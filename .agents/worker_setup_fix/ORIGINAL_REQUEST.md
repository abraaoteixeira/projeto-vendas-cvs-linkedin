## 2026-06-28T22:55:20Z
You are the Worker for Milestone 1 Fix (Iteration 2).
Your working directory is c:\Users\Abraão\Desktop\projeto-vendas-cvs-linkedin\.agents\worker_setup_fix\.

Your mission:
1. Implement the configuration fixes proposed by Explorer Fix 1 and 2.
2. Create `.eslintrc.json` in the root folder with:
{
  "extends": "next/core-web-vitals"
}
3. Update `package.json` under scripts to add:
   - "clean": "node -e \"const fs = require('fs'); ['.next', 'out', 'dist', '.turbo'].forEach(dir => fs.rmSync(dir, { recursive: true, force: true }));\""
   - "prebuild": "npm run clean"
4. Update `src/lib/firebase.ts` to:
   - Check if required environment variables are present and log a warning if missing (suppressed when in emulator or testing mode).
   - Conditionally connect to local Firestore and Storage emulators when `NEXT_PUBLIC_FIREBASE_EMULATOR === 'true'`.
   - Wrap the emulator connection inside a connection guard (using `globalThis`) to prevent duplicate connection attempts on Next.js HMR/Fast Refresh re-execution.
5. Execute `npm run clean`, `npm run build`, and `npm run lint` in the project root to verify that the build compiles successfully and the linter runs headlessly without interactive prompts.
6. Write a handoff report detailing your changes, build/lint commands output, and save it at c:\Users\Abraão\Desktop\projeto-vendas-cvs-linkedin\.agents\worker_setup_fix\handoff.md.
7. Send a message to recipient "parent" with ID 2902f9ef-6773-4b87-92a0-85d0908f1610 once done.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT
hardcode test results, create dummy/facade implementations, or
circumvent the intended task. A Forensic Auditor will independently
verify your work. Integrity violations WILL be detected and your
work WILL be rejected.
