# Analysis Report — Setup and Emulator Configuration Fix Strategy

This report details the findings and strategy to resolve configuration, build, linting, and database emulator integration issues identified during iteration reviews.

---

## 1. ESLint Interactive Hang Issues

### Observation & Impact
- **Problem**: Running `next lint` (or `npm run lint`) without an explicit ESLint configuration file in the project root triggers an interactive prompt asking how the developer would like to configure ESLint.
- **Impact**: In automated testing, CI, or other headless shell executions, this interactive prompt blocks execution indefinitely, causing the lint step to hang.
- **File Locations**: Roots lack a `.eslintrc.json` or `.eslintrc.js` file.

### Proposed Strategy
The Worker should create a `.eslintrc.json` file in the root folder with the standard Next.js lint settings.
#### Proposed `.eslintrc.json` File Content
```json
{
  "extends": "next/core-web-vitals"
}
```

---

## 2. Pre-existing `.next` Cache Build Failures on Windows

### Observation & Impact
- **Problem**: Next.js builds compile and store optimized files in `.next/cache`. If the build environment runs on Windows under a user profile path containing non-ASCII characters (e.g. `c:\Users\Abraão\...`), subsequent builds might suffer from file lock issues, absolute path resolution failures, or character encoding mismatches inside the cache.
- **Impact**: Standard `next build` commands fail unexpectedly.
- **Solution**: Implementing a cross-platform cleanup script to wipe the `.next` compilation folder before every build ensures fresh compilation.

### Proposed Strategy
The Worker should update `package.json` to:
1. Define a cross-platform `clean` script using native Node.js filesystem modules (independent of Windows `rmdir` vs Unix `rm` syntax).
2. Define a `prebuild` hook that automatically invokes the `clean` script before `next build`.

#### Proposed `package.json` Changes
```json
  "scripts": {
    "dev": "next dev",
    "clean": "node -e \"const fs = require('fs'); fs.rmSync('.next', { recursive: true, force: true }); fs.rmSync('out', { recursive: true, force: true });\"",
    "prebuild": "npm run clean",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test:e2e": "playwright test"
  }
```

---

## 3. Firebase Environment Variable Checks & Warnings

### Observation & Impact
- **Problem**: When environment variables are missing, `initializeApp` either throws immediately (e.g. if `apiKey` is undefined) or Firestore calls fail silently or cryptically later.
- **Impact**: Poor onboarding experience for developers and brittle error state detection in tests.
- **Solution**: Validate presence of all environment variables during file initialization. If emulators are active, provide dummy fallbacks so that the app starts successfully without requiring full credentials; if emulators are not active, print clear setup instructions.

### Proposed Strategy
The Worker should modify `src/lib/firebase.ts` to perform validation on module load.

#### Proposed `src/lib/firebase.ts` Structure
```typescript
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isEmulatorEnabled = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";

// List of required variables
const requiredKeys = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

const missingKeys = requiredKeys.filter((key) => !process.env[key]);

if (missingKeys.length > 0) {
  if (isEmulatorEnabled) {
    console.warn(
      `Firebase warning: The following environment variables are missing: ${missingKeys.join(
        ", "
      )}. Dummy values will be injected for local emulator usage.`
    );
    // Inject dummy fallback credentials to satisfy firebase SDK initialization requirements
    firebaseConfig.apiKey = firebaseConfig.apiKey || "demo-api-key";
    firebaseConfig.authDomain = firebaseConfig.authDomain || "demo-project.firebaseapp.com";
    firebaseConfig.projectId = firebaseConfig.projectId || "demo-project";
    firebaseConfig.storageBucket = firebaseConfig.storageBucket || "demo-project.appspot.com";
    firebaseConfig.messagingSenderId = firebaseConfig.messagingSenderId || "demo-sender-id";
    firebaseConfig.appId = firebaseConfig.appId || "demo-app-id";
  } else {
    console.error(
      `Firebase configuration error: The following environment variables are missing: ${missingKeys.join(
        ", "
      )}. Please verify your local .env or .env.local configuration.`
    );
  }
}

// Safe initialization for SSR HMR context
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

// Connect to local emulator endpoints
if (isEmulatorEnabled) {
  // Use unique symbol/property checks to prevent double-connecting during Next.js Hot Module Replacement reloads
  if (!(db as any)._emulatorConnected) {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    (db as any)._emulatorConnected = true;
    console.log("Connected to Firestore Emulator on http://127.0.0.1:8080");
  }

  if (!(storage as any)._emulatorConnected) {
    connectStorageEmulator(storage, "127.0.0.1", 9199);
    (storage as any)._emulatorConnected = true;
    console.log("Connected to Storage Emulator on http://127.0.0.1:9199");
  }
}

export { app, db, storage };
```

---

## 4. Firebase Emulator Configuration and Security Rules

### Observation & Impact
- **Problem**: The project has test helpers (`db_cleaner.ts`) attempting to communicate with Firestore (port 8080) and Storage (port 9199) emulators. However, there is no emulator configuration file (`firebase.json`) or security rules files (`firestore.rules`, `storage.rules`) defined in the workspace root.
- **Impact**: Attempts to run local emulators via Firebase CLI (`firebase emulators:start`) will fail due to missing configuration files, preventing offline testing.

### Proposed Strategy
The Worker should add the following files to the root directory of the workspace:

#### Proposed `firebase.json`
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

#### Proposed `firestore.rules`
```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

#### Proposed `storage.rules`
```rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

---

## 5. Verification Commands for the Worker

After completing these changes, the Worker can verify the configurations with:

1. **Verify Lint Non-Interactivity**:
   ```bash
   npm run lint
   ```
   Should run clean and finish without prompts or hanging.

2. **Verify Windows Clean Build**:
   ```bash
   npm run build
   ```
   Should invoke the `clean` script, deleting `.next`, and rebuild successfully.

3. **Verify Firebase Emulator Connection**:
   Start the emulators (requires Firebase CLI installed globally or locally):
   ```bash
   npx firebase emulators:start
   ```
   And run Next.js in dev mode with `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true`. Console logs should verify successful emulator connections.
