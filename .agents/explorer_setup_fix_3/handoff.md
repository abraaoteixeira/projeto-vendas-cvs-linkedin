# Handoff Report — Explorer 3 Setup & Emulator Configuration

This report outlines observations, logic, conclusions, and a detailed implementation strategy for the Worker agent to resolve configuration, build, linting, and database emulator integration issues.

---

## 1. Observation

1. **Missing ESLint configuration file**:
   - Running `list_dir` in the root workspace directory `c:\Users\Abraão\Desktop\projeto-vendas-cvs-linkedin` shows the following output:
     ```json
     {"name":".agents", "isDir":true}
     {"name":".env.example", "sizeBytes":"315"}
     {"name":".gitignore", "sizeBytes":"262"}
     {"name":".next", "isDir":true}
     {"name":"PROJECT.md", "sizeBytes":"2288"}
     {"name":"TEST_INFRA.md", "sizeBytes":"33983"}
     {"name":"components.json", "sizeBytes":"375"}
     {"name":"next-env.d.ts", "sizeBytes":"206"}
     {"name":"next.config.mjs", "sizeBytes":"118"}
     {"name":"node_modules", "isDir":true}
     {"name":"package-lock.json", "sizeBytes":"279224"}
     {"name":"package.json", "sizeBytes":"1022"}
     ...
     ```
     No `.eslintrc.json`, `.eslintrc.js`, or other lint configuration files exist in the root folder.
2. **Missing clean script in package.json**:
   - `package.json` contains:
     ```json
       "scripts": {
         "dev": "next dev",
         "build": "next build",
         "start": "next start",
         "lint": "next lint",
         "test:e2e": "playwright test"
       },
     ```
     No prebuild clean task or `clean` script is defined to handle cache directories on Windows user accounts containing non-ASCII characters (e.g. `ã` in `Abraão`).
3. **No environment validation or emulator setup in Firebase library**:
   - `src/lib/firebase.ts` contains:
     ```typescript
     import { initializeApp, getApps, getApp } from "firebase/app";
     import { getFirestore } from "firebase/firestore";
     import { getStorage } from "firebase/storage";

     const firebaseConfig = {
       apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
       authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
       projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
       storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
       messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
       appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
     };

     // Initialize Firebase for SSR (Server-Side Rendering) compatibility
     const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
     const db = getFirestore(app);
     const storage = getStorage(app);

     export { app, db, storage };
     ```
     There are no checks, warning logs, or fallback parameters when configuration keys are missing. Additionally, no emulator setup or hooks are implemented.
4. **Missing Firebase Emulator configs**:
   - Search for `*firebase.json` via `find_by_name` returned `Found 0 results`. No `firebase.json`, `firestore.rules`, or `storage.rules` files are defined in the workspace, even though test helpers (such as `tests/helpers/db_cleaner.ts`) expect to connect to Firestore on port 8080 and Storage on port 9199.

---

## 2. Logic Chain

1. **ESLint Hangs**:
   - Because `.eslintrc.json` is missing, when automated runners run `npm run lint`, Next.js invokes its interactive setup prompt to create a template config.
   - Non-interactive environments (CI, task agents) cannot provide input to interactive prompts, leading to infinite hangs.
   - **Conclusion**: Placing a static `.eslintrc.json` extending `"next/core-web-vitals"` in the root folder will bypass the interactive prompt.

2. **Windows Non-ASCII Build Failures**:
   - Next.js caching during compilation saves absolute and relative paths inside `.next/cache`.
   - Windows filesystems combined with paths containing non-ASCII characters (e.g. `c:\Users\Abraão\...`) can trigger HMR locks, file reading exceptions, or path parsing failures if the `.next` directory contains stale cache files from previous runs.
   - **Conclusion**: A cross-platform `clean` script running prior to `build` (via a `prebuild` hook) to remove the `.next` directory completely will prevent these cache corruption build failures.

3. **Firebase Environment Validation and Emulator Hooks**:
   - Standard Firebase initialization throws immediately if `apiKey` is undefined, preventing compilation or testing.
   - Developers need a clear diagnosis of missing environment variables in both production and development stages.
   - For offline development, developers use the Firebase Emulator Suite. The app needs to redirect traffic away from production and to the local emulator endpoints dynamically when configured.
   - Hot Module Replacement (HMR) in Next.js causes `firebase.ts` to reload. Attempting to call emulator attachment hooks twice throws a fatal Firebase error.
   - **Conclusion**:
     1. Add environment check script inside `firebase.ts`. If `NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true'`, inject dummy credentials so initialization succeeds even without an `.env` file, and emit a console warning. Otherwise, log an error.
     2. Add hooks to connect to `127.0.0.1:8080` (Firestore) and `127.0.0.1:9199` (Storage) guarded by custom HMR flags (`(db as any)._emulatorConnected`) to prevent multiple connections.

4. **Emulator Configuration Files**:
   - `db_cleaner.ts` uses ports `8080` and `9199` to communicate with the local emulators.
   - To boot the emulators using `firebase emulators:start`, a `firebase.json` configuration file mapping those ports, along with `firestore.rules` and `storage.rules`, must exist in the workspace root.
   - **Conclusion**: Add `firebase.json`, `firestore.rules`, and `storage.rules` mapping to ports `8080` and `9199` with permissive rules for local development/testing.

---

## 3. Caveats

- **Firebase CLI installation**: Running local emulators requires the developer to have the Firebase CLI tool installed globally or locally (via `firebase-tools` package).
- **Environment variables usage**: The environment variables checking relies on the variables beginning with `NEXT_PUBLIC_` so they are accessible on both the client (browser) and the server side.

---

## 4. Conclusion

The Worker should perform the following changes:
1. Create `.eslintrc.json` in the root folder extending `"next/core-web-vitals"`.
2. Add cross-platform `clean` and `prebuild` scripts to `package.json` to purge `.next` before compilation.
3. Update `src/lib/firebase.ts` to validate environment variables, inject dummy credentials if the emulator is enabled, connect to local emulators conditionally, and apply HMR guards.
4. Create `firebase.json`, `firestore.rules`, and `storage.rules` in the root folder to configure local emulators on ports `8080` and `9199`.

All proposed changes are fully documented in `analysis.md`.

---

## 5. Verification Method

To verify these changes:
1. Run `npm run lint` - it must compile and pass cleanly without any prompt.
2. Run `npm run build` - it must execute the clean step and complete building without path-related compilation errors on Windows.
3. Start the emulators with `npx firebase emulators:start` (if `firebase-tools` is available) and verify they launch successfully.
4. In the browser console, check that when `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` is set, console warnings/logs confirm emulator connections on ports `8080` and `9199`, and no initialization errors occur during hot reloading.
