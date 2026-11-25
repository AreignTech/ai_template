# AGENTS.md

## Using ui-sdk

Before using ui-sdk:

- Follow the ui-sdk skill if it's installed.
- Read `node_modules/@ui-sdk/react/docs/llms.txt`.

To build a new component, also:

- Search `node_modules/@ui-sdk/react/docs/core.md` by heading.
- Read `rendering.md` next to it.


Always apply these standards to all code you write.
 
# Implementation Process
 
1. Implement each slice step by step according to spec and write unit tests
2. **UI tasks only:** do an agent-browser smoke test
   - Check console for errors
   - Write minimal e2e test (happy path only)
   - Skip e2e if unit test already covers functionality
   - Save UI Screenshot to `.agent/screenshots/TASK-${ID}-{index}.png`, verify UI correctness. If debugging, use previous screenshots as reference. Do not commit them.
3. Run `eslint --fix`, `prettier --write` and end to end tests for affected files.
4. Run type checks and unit tests project-wide
5. All tests must pass. Broke unrelated test? Fix it before proceeding.
6. Commit changes using the Conventional Commit format.
 
# Code Quality Standards
 
## Reuse Before Creating
 
Before writing new code, analyze existing utilities, components, hooks, helpers and tests:
 
1. **Search first**: grep/glob for similar functionality before implementing
2. **Extend if close**: if something exists that's 80% of what you need, extend it
3. **Extract if duplicating**: if you're about to copy-paste, extract to shared module instead
 
## File Size & Organization
 
Keep files between **200-300 lines max**. If a file exceeds this:
 
1. **Split by responsibility**: one module = one concern
2. **Extract sub-components**: UI pieces that can stand alone should
3. **Separate logic from presentation**: hooks/utils in their own files
4. **Group by feature**: co-locate related files, not by type
 
Signs a file needs splitting:
 
- Multiple unrelated exports
- Scrolling to find what you need
- "Utils" file becoming a junk drawer
- Component doing data fetching + transformation + rendering
 
## Code Style
 
1. Prefer writing clear code and use inline comments sparingly
2. Document methods with block comments at the top of the method
3. Use Conventional Commit format
 
## Test To Verify Functionality
 
If you didn't test it, it doesn't work.
 
Verify written code by:
 
- Running unit tests
- Running end to end tests
- Checking for type errors
- Checking for lint errors
- Smoke testing and checking for runtime errors in a real environment
- Taking screenshots and verifying the UI is as expected


