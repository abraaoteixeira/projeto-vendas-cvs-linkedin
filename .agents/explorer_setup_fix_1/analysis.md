# Analysis & Strategy Report: Setup and Configuration Fixes

## 1. Executive Summary

This report evaluates four major issues identified in the project setup during Milestone 1:
1. **ESLint interactive prompt hang** due to missing root `.eslintrc.json`.
2. **Next.js build failure on Windows** with non-ASCII username paths (containing "Abraão") due to pre-existing `.next` cache.
3. **Silent Firebase errors** due to a lack of environment variable validation in `src/lib/firebase.ts`.
4. **Missing Firebase Emulator configuration** (missing files in root) and **missing emulator hooks** in `src/lib/firebase.ts`.

A detailed breakdown of each issue is provided, followed by a step-by-step strategy for the Implementer (Worker) to resolve them.

---

## 2. Issue Analysis

### 2.1 ESLint Interactive Prompt Hang
- **Observation**: Running `next lint` on a fresh workspace without an ESLint config file (`.eslintrc.json`, `.eslintrc.js`, etc.) forces Next.js to run an interactive CLI prompt to select a style configuration (e.g. Core Web Vitals vs. Strict). In automated CI, scripts, or non-interactive agent shells, this prompt hangs indefinitely waiting for input.
- **Root Cause**: Next.js is configured with `"lint": "next" lint` in `package.json` but no `.eslintrc.json` is supplied in the root directory.
- **Solution**: Create a `.eslintrc.json` file extending `"next/core-web-vitals"` in the root folder, matching the existing package dependency `"eslint-config-next": "14.2.3"`. This configures Next.js ESLint execution to run immediately in non-interactive mode.

### 2.2 Windows Non-ASCII Username Cache Invalidation
- **Observation**: The user operates under a Windows path containing the non-ASCII username `Abraão` (`c:\Users\Abraão\Desktop\projeto-vendas-cvs-linkedin\`). During Next.js builds, pre-existing cached compilation artifacts containing absolute references or double-escaped unicode chars inside `.next/` fail to resolve properly, causing compile-time crash loops.
- **Root Cause**: Next.js uses file-system caching (`.next/cache`) which caches absolute path structures. When these paths contain special/accented characters like `ã`, file resolution under Windows can fail due to character encoding mismatch or locking.
- **Solution**: We must clear the cache before running a new build. To do this cross-platform (and avoid relying on Unix-specific shell utilities or installing additional dependencies like `rimraf`), we define a custom Node.js execution script under the `prebuild` step:
  ```json
  "clean": "node -e \"const fs = require('fs'); ['.next', 'out'].forEach(d => fs.existsSync(d) && fs.rmSync(d, { recursive: true, force: true }))\"",
  "prebuild": "npm run clean"
  ```
  This guarantees a fresh path context on every compilation, bypassing path caching issues entirely.

### 2.3 Firebase Environment Variable Validation
- **Observation**: The app initializes Firebase directly using `process.env.NEXT_PUBLIC_...` variables. If the environment is not configured, the SDK initializes with `undefined` parameters. This leads to runtime failures that are hard to diagnose.
- **Root Cause**: No validation checking exists in `src/lib/firebase.ts` to inspect the credentials block before calling `initializeApp`.
- **Solution**: Implement environment verification.
  - In **production** (when `NEXT_PUBLIC_FIREBASE_EMULATOR !== 'true'`), the code must check that all 6 required variables are defined. If not, it should log a critical initialization error to console.
  - In **development/emulator** mode, the check will print a warning indicating that production environment variables are missing, but fallback to mock strings so the local SDK is still initialized for emulator hook integration.

### 2.4 Missing Firebase Emulator Configs and Hooks
- **Observation**:
  - The E2E tests (`tests/helpers/db_cleaner.ts`) attempt to reset Firestore and Storage on local emulators at `127.0.0.1:8080` (Firestore) and `127.0.0.1:9199` (Storage).
  - The root directory does not contain `firebase.json` or `.firebaserc` configuring these ports.
  - The application codebase (`src/lib/firebase.ts`) does not hook into `connectFirestoreEmulator` or `connectStorageEmulator`.
- **Root Cause**: The local development emulators are configured to run, but the client code has no connection route to direct requests to `localhost`.
- **Solution**:
  1. Add `firebase.json` to the root directory with the emulator configurations mapped to the specified ports.
  2. Add `.firebaserc` pointing to the mock project name `demo-project`.
  3. Create `firestore.rules` and `storage.rules` to prevent emulator initialization failures.
  4. Modify `src/lib/firebase.ts` to connect Firestore and Storage instance to the emulators when `process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === 'true'`. The hooks must be wrapped in `globalThis` flags to prevent multiple reconnection errors during Next.js Hot Module Replacement (HMR) reloads.

---

## 3. Worker Strategy & Specifications

The Implementer (Worker) should implement the following changes:

### Step 1: Add ESLint Configuration
Create a `.eslintrc.json` file in the root folder with the following content:
```json
{
  "extends": "next/core-web-vitals"
}
```

### Step 2: Add Firebase Local Configuration files
Create the following files in the root folder to configure local emulators:

**`.firebaserc`**:
```json
{
  "projects": {
    "default": "demo-project"
  }
}
```

**`firebase.json`**:
```json
{
  "firestore": {
    "rules": "firestore.rules"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "emulators": {
    "firestore": {
      "port": 8080
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "port": 4000
    },
    "singleProjectMode": true
  }
}
```

**`firestore.rules`**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**`storage.rules`**:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

### Step 3: Add Cache Cleaning to `package.json`
Modify `package.json` to include `"clean"` and `"prebuild"` scripts.
- **Before**:
  ```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test:e2e": "playwright test"
  }
  ```
- **After**:
  ```json
  "scripts": {
    "clean": "node -e \"const fs = require('fs'); ['.next', 'out'].forEach(d => fs.existsSync(d) && fs.rmSync(d, { recursive: true, force: true }))\"",
    "prebuild": "npm run clean",
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test:e2e": "playwright test"
  }
  ```

### Step 4: Re-write `src/lib/firebase.ts` with checks, validation, and emulator hooks
Replace the content of `src/lib/firebase.ts` with:
```typescript
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// Define fallback credentials for local emulators if missing from .env
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mock-auth-domain.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mock-bucket.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "mock-sender-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "mock-app-id",
};

// Validate environment variables
const requiredKeys = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

const missingKeys = requiredKeys.filter((key) => !process.env[key]);
const isEmulator = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === "true";

if (missingKeys.length > 0) {
  if (isEmulator) {
    console.warn(
      `[Firebase Warning] Running in Emulator mode, but the following production environment variables are missing: ${missingKeys.join(
        ", "
      )}. Mock fallback credentials will be used.`
    );
  } else {
    console.error(
      `[Firebase Error] Missing critical production environment variables: ${missingKeys.join(
        ", "
      )}. Operations will fail.`
    );
  }
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

// Connect to Emulators if configured
if (isEmulator) {
  const globalObj = globalThis as any;

  // Connect Firestore Emulator (HMR-safe check)
  if (!globalObj._firestoreEmulatorConnected) {
    const firestoreHost = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
    try {
      const [host, portStr] = firestoreHost.replace(/^https?:\/\//, "").split(":");
      const port = portStr ? parseInt(portStr, 10) : 8080;
      connectFirestoreEmulator(db, host, port);
      globalObj._firestoreEmulatorConnected = true;
      console.log(`[Firebase Emulator] Firestore hooked to emulator at ${host}:${port}`);
    } catch (e) {
      console.error("[Firebase Emulator] Failed to connect to Firestore Emulator:", e);
    }
  }

  // Connect Storage Emulator (HMR-safe check)
  if (!globalObj._storageEmulatorConnected) {
    const storageHost = process.env.NEXT_PUBLIC_STORAGE_EMULATOR_HOST || "127.0.0.1:9199";
    try {
      const [host, portStr] = storageHost.replace(/^https?:\/\//, "").split(":");
      const port = portStr ? parseInt(portStr, 10) : 9199;
      connectStorageEmulator(storage, host, port);
      globalObj._storageEmulatorConnected = true;
      console.log(`[Firebase Emulator] Storage hooked to emulator at ${host}:${port}`);
    } catch (e) {
      console.error("[Firebase Emulator] Failed to connect to Storage Emulator:", e);
    }
  }
}

export { app, db, storage };
```

---

## 4. Verification Methods

After implementing the changes, the Worker can verify the configurations by running:

1. **Verify ESLint Integration**:
   Run `npm run lint`. The command should execute and terminate instantly without waiting for input or throwing interactive prompt warnings.
2. **Verify Cache Cleaning & Windows Compilability**:
   Run `npm run build` multiple times. Check that the `.next` folder is deleted at the start of the build process (as indicated by the `prebuild` execution), and that compilation succeeds.
3. **Verify Firebase Initialization & Warnings**:
   - Set `.env` to have missing variables and run the application. Check console logs for warning warnings.
   - Enable emulator by setting `NEXT_PUBLIC_FIREBASE_EMULATOR=true`. Verify warnings about mock variables are logged, and emulator hook console logs appear: `[Firebase Emulator] Firestore hooked to emulator...`.
