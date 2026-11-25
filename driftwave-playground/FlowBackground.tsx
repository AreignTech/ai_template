"use client";

/**
 * Driftwave hero background — "sound as a slow current".
 * Dependency-free (vanilla Canvas 2D + seeded Perlin flow field).
 *
 * Same seed => same artwork (deterministic PRNG + seeded noise).
 * Drop into the future Next.js app as e.g. app/components/FlowBackground.tsx
 * and use behind the hero:
 *
 *   <section className="relative isolate overflow-hidden">
 *     <FlowBackground seed={1847} lineColor="#d8c9a8" className="absolute inset-0 -z-10" />
 *     <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b
 *                     from-[#100f0d]/70 via-[#100f0d]/20 to-[#100f0d]" />
 *     ...headline...
 *   </section>
 *
 * The gradient scrim above keeps the headline readable; tune to taste once
 * the real hero exists.
 */

import { useEffect, useRef } from "react";

type Props = {
  seed: number;
  speed?: number;      // 0 = frozen, 1 = default
  lineCount?: number;  // 400–6000
  lineColor?: string;  // hex, e.g. "#d8c9a8" (sand)
  background?: string; // off-black
  pointerAffect?: boolean;
  className?: string;
};

const NOISE_SCALE = 0.0018;
const BUCKETS = [
  { a: 0.05, w: 0.7 },
  { a: 0.07, w: 0.8 },
  { a: 0.10, w: 0.9 },
  { a: 0.14, w: 1.15 },
];
const MAX_LINES = 6000;

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeNoise(rand: () => number) {
  const perm = new Uint8Array(512);
  const base = new Uint8Array(256);
  for (let i = 0; i < 256; i++) base[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = (rand() * (i + 1)) | 0;
    const tmp = base[i];
    base[i] = base[j];
    base[j] = tmp;
  }
  for (let i = 0; i < 512; i++) perm[i] = base[i & 255];
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (t: number, a: number, b: number) => a + t * (b - a);
  const grad = (hash: number, x: number, y: number, z: number) => {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  };
  return (x: number, y: number, z: number) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
    const u = fade(x), v = fade(y), w = fade(z);
    const A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z;
    const B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;
    return lerp(
      w,
      lerp(
        v,
        lerp(u, grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z)),
        lerp(u, grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z)),
      ),
      lerp(
        v,
        lerp(u, grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1)),
        lerp(u, grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1)),
      ),
    );
  };
}

function hexToRgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export default function FlowBackground({
  seed,
  speed = 1,
  lineCount = 2600,
  lineColor = "#d8c9a8",
  background = "#100f0d",
  pointerAffect = true,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // live params the animation loop reads each frame; changing them
  // does not reset the artwork (only `seed` does).
  const paramsRef = useRef({ speed, lineCount, lineColor, background });
  paramsRef.current = { speed, lineCount, lineColor, background };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0, t = 0, raf = 0;
    let noise = makeNoise(mulberry32((seed ^ 0x9e3779b9) >>> 0));
    const spawnRnd = mulberry32(seed >>> 0);

    const px = new Float32Array(MAX_LINES);
    const py = new Float32Array(MAX_LINES);
    const plife = new Float32Array(MAX_LINES);
    const psp = new Float32Array(MAX_LINES);
    const pbucket = new Uint8Array(MAX_LINES);

    const pointer = { x: 0, y: 0, active: false };

    const spawn = (i: number) => {
      px[i] = spawnRnd() * W;
      py[i] = spawnRnd() * H;
      plife[i] = 80 + spawnRnd() * 280;
      psp[i] = 0.7 + spawnRnd() * 0.85;
      pbucket[i] = (spawnRnd() * BUCKETS.length) | 0;
    };

    const paintBg = () => {
      ctx.fillStyle = paramsRef.current.background;
      ctx.fillRect(0, 0, W, H);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = parent.clientWidth;
      H = parent.clientHeight;
      if (W === 0 || H === 0) return;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (let i = 0; i < MAX_LINES; i++) spawn(i);
      paintBg();
    };

    const step = () => {
      const { speed, lineCount, lineColor, background } = paramsRef.current;
      t += 0.0016 * speed;

      ctx.fillStyle = hexToRgba(background, 0.05);
      ctx.fillRect(0, 0, W, H);

      const mv = 1.2 * speed;
      const MR = 170, MR2 = MR * MR;

      for (let b = 0; b < BUCKETS.length; b++) {
        ctx.strokeStyle = hexToRgba(lineColor, BUCKETS[b].a);
        ctx.lineWidth = BUCKETS[b].w;
        ctx.beginPath();
        for (let i = 0; i < lineCount; i++) {
          if (pbucket[i] !== b) continue;
          const x = px[i], y = py[i];

          const a = noise(x * NOISE_SCALE, y * NOISE_SCALE, t) * 2.2;
          let vx = Math.cos(a) * 0.85 + 0.5;
          let vy = Math.sin(a) * 0.85;

          if (pointerAffect && pointer.active) {
            const dx = x - pointer.x, dy = y - pointer.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < MR2 && d2 > 0.01) {
              const d = Math.sqrt(d2);
              const f = 1 - d / MR;
              const push = f * f * 1.9;
              vx += (dx / d) * push;
              vy += (dy / d) * push;
              vx += (-dy / d) * f * 0.7;
              vy += (dx / d) * f * 0.7;
            }
          }

          const m = Math.sqrt(vx * vx + vy * vy) || 1;
          const s = mv * psp[i];
          const nx = x + (vx / m) * s;
          const ny = y + (vy / m) * s;

          ctx.moveTo(x, y);
          ctx.lineTo(nx, ny);

          plife[i] -= 1;
          if (plife[i] <= 0 || nx < -24 || nx > W + 24 || ny < -24 || ny > H + 24) {
            spawn(i);
          } else {
            px[i] = nx;
            py[i] = ny;
          }
        }
        ctx.stroke();
      }
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    };
    const onLeave = () => { pointer.active = false; };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    if (pointerAffect) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerleave", onLeave);
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      for (let i = 0; i < 220; i++) step();
    } else {
      const loop = () => { step(); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (pointerAffect) {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerleave", onLeave);
      }
    };
  }, [seed, pointerAffect]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
