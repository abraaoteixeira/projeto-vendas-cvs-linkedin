# Challenge Report — Milestone 1 Fix (Iteration 2)

## Challenge Summary

**Overall risk assessment**: LOW

The project setup and configuration are robust, demonstrating clean headless building, successful prebuild cache clearing, proper lint validation, and resilient Firebase emulator initialization logic that prevents duplicate connection errors during Next.js Fast Refresh.

---

## Challenges

### [Low] Challenge 1: Next.js Dev Server File Lock (EBUSY) during Clean

- **Assumption challenged**: The prebuild script assumes that `npm run clean` can always wipe the `.next` directory.
- **Attack scenario**: If a developer has a Next.js development server running (`npm run dev`), the operating system (especially Windows) locks some files in `.next/cache`. Running `npm run build` simultaneously triggers `prebuild` -> `npm run clean`, which will throw an `EBUSY: resource busy or locked` error and halt the build process.
- **Blast radius**: The build pipeline crashes immediately on compilation start.
- **Mitigation**: Adjust the clean script to handle locks gracefully, such as trying to delete the directories and showing a user-friendly warning instead of crashing if the folder is locked, or warning the developer to terminate any active `next dev` processes. For example:
  ```javascript
  const fs = require('fs');
  ['.next', 'out', 'dist', '.turbo'].forEach(dir => {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch (e) {
      if (e.code === 'EBUSY') {
        console.warn(`Warning: Could not remove locked directory: ${dir}. If a dev server is running, please stop it.`);
      } else {
        throw e;
      }
    }
  });
  ```

### [Medium] Challenge 2: Hardcoded Emulator Host and Ports

- **Assumption challenged**: The Firebase emulator hookups assume the emulators always run on `'127.0.0.1'` on default ports (`8080`, `9199`).
- **Attack scenario**: In containerized environments (Docker, Kubernetes) or alternative CI workflows, the Firebase emulators may run on different hosts (e.g. `0.0.0.0`, `localhost`, or a specific service container name) or bind to dynamic ports. Hardcoding `127.0.0.1` makes connection impossible in these scenarios.
- **Blast radius**: The app fails to connect to Firestore and Storage, throwing connection errors during E2E verification.
- **Mitigation**: Extract these connection variables into optional environment variables:
  ```typescript
  const host = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || '127.0.0.1';
  const firestorePort = parseInt(process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_PORT_FIRESTORE || '8080');
  const storagePort = parseInt(process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_PORT_STORAGE || '9199');
  ```

---

## Stress Test Results

- **Headless Build Validation** → `npm run build` should compile cleanly and generate static pages without user intervention → Executed successfully, compiled page routes and generated manifests → **PASS**
- **Lint Check Execution** → `npm run lint` should run cleanly and non-interactively → Checked all files, resolved successfully without error/warnings or input requests → **PASS**
- **Fast Refresh Re-evaluation Protection** → Simulated Firebase module re-load with `g._firebase_emulators_connected` → Prevented calling emulator connect triggers on subsequent evaluations, avoiding Firebase crash → **PASS**
- **Sanitized DB Input Boundaries** → Sending malformed input payloads such as `DROP TABLE` or SQL characters via the API → Handled and rejected with HTTP 400 → **PASS**

---

## Unchallenged Areas

- **E2E Test Suites Execution** — The specific playwright/E2E test files were not executed in this setup cycle since the core UI components/pages are planned for Milestone 3, and only setup configurations are verified in this iteration.
- **Production Firebase Configuration Validation** — Real credentials validation is out of scope since the current verification is isolated to local emulators and dev environment hooks.
