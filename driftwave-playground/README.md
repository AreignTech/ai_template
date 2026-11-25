# Driftwave generative background — holding area

Nothing here can run until the Next.js project is scaffolded (that step is
blocked on shell access), so these files live outside the app for now.

## Pick a seed

Open [flow-background.html](flow-background.html) directly in a browser
(double-click — no server or npm needed).

- **Seed** — same seed always composes the same artwork. Type one, or **Roll seed**.
- **Speed** — 0 freezes the current; 1 is the default drift.
- **Lines** — 400–6000. Default 2600; lower it if a laptop fan spins up.
- **Colour** — Sand / Bone / Copper / Seafoam / Moonlight presets, or any custom hex.

Move the pointer over the field — the current bends and swirls gently around
it. **Save PNG** exports the current frame as `driftwave-seed-<seed>.png`.

When you've chosen one, tell me the seed (and colour if changed) and I'll
embed it behind the hero.

## Embedding later

[FlowBackground.tsx](FlowBackground.tsx) is the drop-in client component
(same deterministic engine, no dependencies — vanilla Canvas 2D). Once the
Next.js app exists it goes to `app/components/FlowBackground.tsx`; its file
header shows the hero markup with a readability scrim.

Notes:

- `prefers-reduced-motion`: renders one static composed frame, no animation.
- Pointer avoidance uses pointer events, so touch works too.
- Palette is the placeholder sand `#d8c9a8` on off-black `#100f0d`; both are
  props and should be swapped for the real brand tokens once the site exists.
