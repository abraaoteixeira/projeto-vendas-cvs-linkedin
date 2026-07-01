## Challenge Summary

**Overall risk assessment**: MEDIUM

## Challenges

### [High] Challenge 1: Path-dependent Build Failure on Windows with Non-ASCII Characters

- **Assumption challenged**: The Next.js application can be built successfully on any developer's machine using the project's root path.
- **Attack scenario**: A developer on Windows whose local user folder or workspace directory path contains non-ASCII characters (e.g. `Abraão`, `João`, or special characters/spaces) executes `npm run build`. Next.js spawns worker processes/threads during page compilation and static generation. Due to path serialization and encoding mismatches between Node.js worker channels on Windows, the build fails to resolve files and manifests inside the `.next/` folder, throwing error stacks such as:
  `Error: Cannot find module '...\.next\server\pages\_app.js'` or `ENOENT: no such file or directory, open '...\.next\server\font-manifest.json'`.
- **Blast radius**: Prevents developers from compiling the project or running any local test verification suites that rely on a production build (such as Playwright E2E tests).
- **Mitigation**: 
  1. Document this known Windows path encoding limitation in the project documentation (`PROJECT.md` or a `README.md`).
  2. Recommend Windows developers to clone/move the repository to a path that does not contain non-ASCII characters or spaces (e.g., `C:\projeto-vendas-cvs-linkedin\`).
  3. Suggest running the project inside WSL (Windows Subsystem for Linux) where directory path encoding behaves deterministically.

### [Medium] Challenge 2: Missing Explicit ESLint Configuration File in Project Root

- **Assumption challenged**: Code quality and linting constraints are enforced uniformly across all developer workspaces and IDE setups.
- **Attack scenario**: The project specifies `eslint` and `eslint-config-next` in `devDependencies`, but lacks an explicit configuration file (like `.eslintrc.json` or `eslint.config.js`) in the root. IDEs and code editors (such as VS Code) will not automatically detect and highlight linting issues in real-time, relying only on the developer running the command-line `npm run build` or `npm run lint`.
- **Blast radius**: Code formatting and quality guidelines are not enforced during local editing, leading to formatting discrepancies and styling regressions.
- **Mitigation**: Create a standard `.eslintrc.json` file in the root directory:
  ```json
  {
    "extends": "next/core-web-vitals"
  }
  ```

### [Low] Challenge 3: Lack of Configuration Verification for Firebase Environment Variables

- **Assumption challenged**: Firebase is guaranteed to initialize with valid credentials across different deployment environments.
- **Attack scenario**: Next.js builds successfully even if the environment variables (`NEXT_PUBLIC_FIREBASE_*`) are undefined or missing from `.env`. The project initializes Firebase client services using `process.env` directly.
- **Blast radius**: The application will build without errors, but will fail with runtime errors or silent failures when users attempt to upload CVs or read/write Firestore records.
- **Mitigation**: Implement a lightweight validator in `src/lib/firebase.ts` that checks for the existence of required environment variables and throws an informative runtime error if they are missing:
  ```typescript
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ] as const;

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.warn(`Warning: Environment variable ${envVar} is missing.`);
    }
  }
  ```

## Stress Test Results

- **Run build on Windows path containing non-ASCII character (`Abraão`)** → Build compiles code successfully but fails during static page prerendering and manifest generation → **FAIL**
- **TypeScript Type Safety Verification (via `next build`)** → Typecheck succeeds with zero TypeScript compiling errors → **PASS**
- **Linting Verification (via `next build`)** → Default ESLint check succeeds with zero errors → **PASS**

## Unchallenged Areas

- **Firebase Database Rules & Security Controls** — Firebase is initialized in code, but security rules (`firestore.rules` or `storage.rules`) are not yet checked or present in the current root setup.
- **Stripe & Payment Gateway Configuration** — Integration code for payment routes does not exist yet (scoped for Milestone 3/4), preventing verification of real checkout behavior.
- **AI Schema Parser Robustness** — AI response parser and endpoint `/api/profile-rebuild` are not yet implemented (scoped for Milestone 3/4).
