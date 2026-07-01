# Adversarial Challenge Report — Milestone 1 Fix (Iteration 2)

## Challenge Summary

**Overall risk assessment**: MEDIUM

While the basic project configuration, prebuild clean script, Next.js build, and lints compile successfully, there are structural and operational assumptions in the test suite and environment setup that expose the project to medium-level risks. Specifically, client-side static bundling in Next.js, lack of automated E2E test server orchestration, and the absence of emulator connection error-handling could lead to broken testing runs or unintentional connections to production environments.

---

## Challenges

### [Medium] Challenge 1: Static Environment Inlining of Client-Side Firebase Emulator Checks

- **Assumption challenged**: Assumes that `process.env.NEXT_PUBLIC_FIREBASE_EMULATOR` will always be available dynamically to switch the Firebase client library into emulator mode during testing.
- **Attack scenario**: During `npm run build`, Next.js statically replaces references to `process.env.NEXT_PUBLIC_*` in the client-side bundle. If the build command is executed without prefixing `NEXT_PUBLIC_FIREBASE_EMULATOR=true`, the compiled bundle will hardcode `isEmulator` as `false`. When the built project is served and targeted by Playwright E2E tests, the browser client will attempt to establish connections to production Firebase databases using empty/placeholder credentials instead of connecting to the local emulator, leading to immediate test failure.
- **Blast radius**: Breaks all client-side Firestore and Storage interactions under E2E testing environments if the project is built without the explicit environment variable.
- **Mitigation**: Introduce a secondary runtime check on the client-side for `localhost` or `127.0.0.1` hostnames:
  ```typescript
  const isEmulator = 
    process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === 'true' ||
    (typeof window !== 'undefined' && 
     (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));
  ```

### [Medium] Challenge 2: Lack of Playwright Web Server and Emulator Orchestration

- **Assumption challenged**: Assumes the local Next.js dev server (on port 3000) and Firebase Emulator Suite (ports 8080/9199/4000) are already running when E2E tests are executed.
- **Attack scenario**: Running `npm run test:e2e` out-of-the-box in a clean environment results in immediate test failures because there is no `webServer` configuration in `playwright.config.ts` to automatically spawn the application, nor is there a helper to start the Firebase emulators.
- **Blast radius**: Hinders CI/CD pipelines and headless verification scripts from executing tests autonomously.
- **Mitigation**: Configure the `webServer` block in `playwright.config.ts` to spin up the local server, and provide a bootstrap script or npm command (e.g., `firebase emulators:exec "npm run test:e2e"`) that orchestrates both the database mock servers and application servers.

### [Low] Challenge 3: Unhandled Errors on Emulator Connection Failure

- **Assumption challenged**: Assumes the Firebase emulator services are active and reachable when `isEmulator` evaluates to `true`.
- **Attack scenario**: If the Firebase emulators are offline or bound to different ports, `connectFirestoreEmulator` and `connectStorageEmulator` will fail. Currently, these calls are unhandled, which will trigger uncaught exceptions in the module scope, crashing page loads or server side actions.
- **Blast radius**: Complete crash of the application on any route importing `firebase.ts` when emulators are configured but not running.
- **Mitigation**: Wrap emulator connections in a try-catch block and log clear diagnostics:
  ```typescript
  if (isEmulator) {
    const g = globalThis as any;
    if (!g._firebase_emulators_connected) {
      try {
        connectFirestoreEmulator(db, '127.0.0.1', 8080);
        connectStorageEmulator(storage, '127.0.0.1', 9199);
        g._firebase_emulators_connected = true;
      } catch (err) {
        console.error("Failed to connect to Firebase Emulators. Verify emulator status and configuration.", err);
      }
    }
  }
  ```

---

## Stress Test Results

- **Run `npm run clean`** → Wipes `.next`, `out`, `dist`, `.turbo` → Successful execution, `.next` was completely removed from the filesystem → **PASS**
- **Run `npm run lint`** → Completes lint checks headless without prompting for user inputs → Finished successfully with zero warnings/errors → **PASS**
- **Run `npm run build`** → Compiles and generates static/dynamic routes successfully → Completed successfully, verified manifests and route bundles → **PASS**
- **Trigger Next.js Fast Refresh on `src/lib/firebase.ts`** → Re-evaluates Firebase client module without spawning multiple emulator connections → `globalThis._firebase_emulators_connected` successfully prevents duplicate connection calls → **PASS**
- **E2E Test Run (`npm run test:e2e`)** → Playwright executes tests against target URL → Playwright fails tests because UI pages do not exist in Milestone 1 and dev server was not automated → **FAIL** (Expected behavior for Milestone 1)

---

## Unchallenged Areas

- **AI Prompt Logic (`prompt_mestre.md`) & Copy assets (`copy_e_growth.md`)** — Not challenged as they belong to Milestone 2 and 3 and the primary scope here was to verify prebuild config, setup, clean, builds, and firebase hookups.
- **Production Firebase Deployment Configuration** — Unchallenged because credentials and live production project IDs are not set up or configured within the local repository context.
