# Milestone 1 Fix (Iteration 2) — Explorer 2 Analysis

This report outlines the proposed strategy to fix the identified build, lint, and Firebase setup issues reported in the MVP project repository.

---

## 1. Issue Analysis & Resolution Strategy

### Issue A: Interactive ESLint Hangs (Missing `.eslintrc.json` in Root)
* **Problem**: Next.js automatically invokes ESLint checks during build and dev processes. If there is no ESLint config file (`.eslintrc.json`) present in the root folder, Next.js launches an interactive CLI prompt to guide the user in setting it up. In non-interactive environments (CI pipelines, automated test runs, git hooks), this prompt hangs indefinitely, blocking builds.
* **Strategy**: Create a standard `.eslintrc.json` configuration file in the root directory. This pre-configures Next.js to use its recommended ruleset (`next/core-web-vitals`), bypassing the interactive prompt.

### Issue B: Next.js Cache Build Failures on Windows with Non-ASCII Usernames
* **Problem**: The project root contains a pre-existing `.next` build cache directory. When running builds or start commands on Windows machines with non-ASCII characters in paths (such as `C:\Users\Abraão\...`), Next.js's loader middleware caching mechanism causes build failures because of path encoding discrepancies.
* **Strategy**: Introduce a cross-platform cleanup script to delete the `.next` directory (and other build/temporary files) before executing a new build. Calling this clean script as part of a `prebuild` hook guarantees that the Next.js cache starts fresh each time, preventing path-related failures.

### Issue C: Lack of Environment Variable Verification in `src/lib/firebase.ts`
* **Problem**: If the required environment variables for Firebase are missing, the Firebase Client SDK will crash with cryptically short error messages or fail silently during execution, hindering debugging.
* **Strategy**: Add runtime verification code inside `src/lib/firebase.ts` that lists the required environment variables, checks for their presence, and logs a descriptive console warning detailing exactly which variables are missing (suppressing this warning only when in emulator/testing environments where mock fallbacks are acceptable).

### Issue D: Missing Firebase Emulator Connections
* **Problem**: Tests rely on local emulators (e.g., Firestore at port `8080` and Storage at port `9199`), but `src/lib/firebase.ts` does not establish connections to the emulators.
* **Strategy**: Read the emulator configurations (such as `NEXT_PUBLIC_FIREBASE_EMULATOR === 'true'`) and conditionally call `connectFirestoreEmulator` and `connectStorageEmulator` during initialization. To avoid crashing during development Fast Refresh/Hot Module Replacement (HMR) (which executes the file multiple times), wrap these connections in a `globalThis` execution guard to ensure they are established only once.

---

## 2. Proposed Code Implementations

Below are the exact file modifications proposed for the Worker to apply.

### 2.1. Create `.eslintrc.json`
Create this file in the root folder (`c:\Users\Abraão\Desktop\projeto-vendas-cvs-linkedin\.eslintrc.json`).

```json
{
  "extends": "next/core-web-vitals"
}
```

### 2.2. Update `package.json`
Inject a cross-platform node-based `clean` script and a `prebuild` hook under `scripts`.

```json
  "scripts": {
    "dev": "next dev",
    "clean": "node -e \"const fs = require('fs'); ['.next', 'out', 'dist', '.turbo'].forEach(dir => fs.rmSync(dir, { recursive: true, force: true }));\"",
    "prebuild": "npm run clean",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test:e2e": "playwright test"
  }
```

### 2.3. Update `src/lib/firebase.ts`
Replace the contents of `src/lib/firebase.ts` with a version that validates environment variables and connects Firestore/Storage emulators safely.

```typescript
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// 1. Define Fallback Mock Configurations for local/test use
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mock-auth-domain.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1234567890:web:1234567890",
};

// 2. Validate Environment Variables (skip warn if in emulator/test mode)
const isEmulator = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === "true";
const isTest = process.env.NODE_ENV === "test";

const requiredEnvVars = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID"
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0 && !isEmulator && !isTest) {
  console.warn(
    `[Firebase Initialization Warning]: The following environment variables are missing: ${missingEnvVars.join(", ")}. ` +
    `Using default fallback configuration values which may not work for production.`
  );
}

// 3. Initialize Firebase app instance safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

// 4. Hook up local emulators if activated
if (isEmulator) {
  // Use globalThis state tracking to prevent duplicate connections on hot reload / Fast Refresh
  const globalRef = globalThis as any;
  if (!globalRef._firebaseEmulatorsConnected) {
    try {
      const firestoreHost = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || "127.0.0.1";
      const firestorePort = parseInt(process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT || "8080", 10);
      connectFirestoreEmulator(db, firestoreHost, firestorePort);
      console.log(`[Firebase Emulator]: Connected Firestore to ${firestoreHost}:${firestorePort}`);
    } catch (err) {
      console.warn("[Firebase Emulator]: Failed to connect to Firestore emulator:", err);
    }

    try {
      const storageHost = process.env.NEXT_PUBLIC_STORAGE_EMULATOR_HOST || "127.0.0.1";
      const storagePort = parseInt(process.env.NEXT_PUBLIC_STORAGE_EMULATOR_PORT || "9199", 10);
      connectStorageEmulator(storage, storageHost, storagePort);
      console.log(`[Firebase Emulator]: Connected Storage to ${storageHost}:${storagePort}`);
    } catch (err) {
      console.warn("[Firebase Emulator]: Failed to connect to Storage emulator:", err);
    }

    globalRef._firebaseEmulatorsConnected = true;
  }
}

export { app, db, storage };
```

---

## 3. Verification Plan

Once the Worker implements the changes, verification should be executed as follows:

1. **Verify ESLint Configuration**:
   - Run `npm run lint` or `npx next lint`.
   - It should parse configuration files immediately and complete checks without asking any interactive setup queries.

2. **Verify Clean Hook & Build**:
   - Manually verify that `.next` cache is deleted by running `npm run clean`.
   - Run `npm run build`. Confirm that the build finishes successfully on the system, indicating the path problems caused by `.next` caches are resolved.

3. **Verify Environment Variable Validation**:
   - Temporarily clear all environment variables (`$env:NEXT_PUBLIC_FIREBASE_API_KEY=""`, etc.).
   - Start the next server `npm run dev` and verify that the warning triggers on startup/import (only when `NEXT_PUBLIC_FIREBASE_EMULATOR` is not set to `true`).

4. **Verify Emulator Setup**:
   - Run local Firebase Emulators.
   - Start Next.js with `NEXT_PUBLIC_FIREBASE_EMULATOR=true`.
   - Confirm console logs `[Firebase Emulator]: Connected Firestore to 127.0.0.1:8080` and `[Firebase Emulator]: Connected Storage to 127.0.0.1:9199` appear on startup and do not crash on page reloads/hot resets.
