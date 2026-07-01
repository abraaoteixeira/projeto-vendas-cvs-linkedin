## Challenge Summary

**Overall risk assessment**: CRITICAL

While the basic Next.js build compilation (`npm run build`) compiles successfully, the project configuration has critical gaps that prevent standard developer workflows (such as linting, testing, and firebase emulator integration) from functioning. Most notably, ESLint configuration is missing, and there is no setup or code integration for Firebase Emulators despite claims in the test documentation.

---

## Challenges

### [Critical] Challenge 1: Missing ESLint Configuration File

- **Assumption challenged**: Running `npm run lint` works out of the box and is ready for CI/CD pipelines.
- **Attack scenario**: When `npm run lint` is executed in a non-interactive CI/CD pipeline or a local script, the process halts or fails with a non-zero exit code because Next.js prompts the user interactively (`? How would you like to configure ESLint?`).
- **Blast radius**: Prevents automated lint checks in pull requests, blocks CI/CD deployment gates, and fails to enforce code style consistency.
- **Mitigation**: Add a `.eslintrc.json` file to the root directory extending the recommended Next.js config:
  ```json
  {
    "extends": "next/core-web-vitals"
  }
  ```

### [High] Challenge 2: Firebase Local Emulator Configuration and Integration Mismatch

- **Assumption challenged**: The test suite runs in isolation using the Firebase Local Emulator Suite.
- **Attack scenario**:
  1. The project lacks a `firebase.json` configuration file, which is required by the Firebase CLI to initialize and start emulators.
  2. `src/lib/firebase.ts` does not contain conditional calls to `connectFirestoreEmulator` or `connectStorageEmulator`. Thus, any runtime database or storage calls (including those in `tests/helpers/db_cleaner.ts`) will attempt to connect to production/cloud Firebase instead of the local emulator.
- **Blast radius**: The application will crash on startup if credentials are not configured, or if configured, tests could accidentally modify production databases, violating environment isolation principles.
- **Mitigation**:
  1. Add a `firebase.json` to define emulator ports (e.g., Firestore on `8080`, Storage on `9199`).
  2. Update `src/lib/firebase.ts` to conditionally connect to the emulators:
     ```typescript
     if (process.env.NEXT_PUBLIC_USE_EMULATORS === "true") {
       connectFirestoreEmulator(db, "127.0.0.1", 8080);
       connectStorageEmulator(storage, "127.0.0.1", 9199);
     }
     ```

### [Medium] Challenge 3: Playwright Test WebServer Missing Configuration

- **Assumption challenged**: E2E tests (`npm run test:e2e`) can be run with a single command.
- **Attack scenario**: `playwright.config.ts` does not define the `webServer` key. If the local development server is not manually started beforehand, executing `npm run test:e2e` fails immediately with `net::ERR_CONNECTION_REFUSED`.
- **Blast radius**: Automated testing in CI environments will fail unless custom orchestration scripts are written to launch, wait for, and tear down the Next.js server.
- **Mitigation**: Add the `webServer` block in `playwright.config.ts`:
  ```typescript
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  }
  ```

### [Medium] Challenge 4: Missing Playwright Browser Binaries on the Host

- **Assumption challenged**: The host environment has all necessary browser engines installed for cross-browser testing.
- **Attack scenario**: Running Playwright tests fails because WebKit and Firefox browser binaries are missing from the system.
- **Blast radius**: Unable to run full-funnel cross-browser verification test suites.
- **Mitigation**: Run `npx playwright install` to install browser binaries or adjust project definitions in `playwright.config.ts` during local testing.

---

## Stress Test Results

- **Build Verification Test (`npm run build`)** → Next.js compiles, checks types, and outputs static pages successfully → **PASS** (Note: runtime code paths and missing configurations are not exercised during build-time compilation).
- **ESLint Check (`npm run lint`)** → Command fails due to missing ESLint config prompting user interaction → **FAIL**
- **E2E Test Execution (`npm run test:e2e`)** → Playwright fails due to missing server automatic startup and missing browser binaries (Firefox/WebKit) → **FAIL**

---

## Unchallenged Areas

- **Firebase SDK Runtime Integration** — Checked only statically. Stricter validation of environment variables at runtime is missing but was not tested because no component currently imports `src/lib/firebase.ts`.
