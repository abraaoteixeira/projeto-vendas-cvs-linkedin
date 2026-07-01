# Project Plan: LinkedIn Profile Rebuilder SaaS MVP

## Goals
Build the MVP for the LinkedIn Profile Rebuilder SaaS, enabling users to upload their CVs, see an interactive loading screen, select target job roles, view a mock LinkedIn profile, go through a paywall, and copy their new profile data from a dashboard.

## Tracks

### Track 1: E2E Testing Track (Requirement-driven, opaque-box)
- **Objective**: Build a comprehensive E2E test suite covering all features of the PLG flow.
- **Phases**:
  1. Define test cases (Tier 1-4: Feature, Boundary, Cross-feature, Real-world).
  2. Implement test runner and assertion scripts.
  3. Publish `TEST_READY.md` to trigger the implementation final milestone verification.

### Track 2: Implementation Track (SaaS Core Features)
- **Objective**: Develop the Next.js frontend, Firebase backend, AI prompt, and copywriting.
- **Milestones**:
  - **Milestone 1**: Project initialization, directory structure, config (Completed).
  - **Milestone 2**: Copywriting (`copy_e_growth.md`) and AI Prompt (`prompt_mestre.md`) (Completed).
  - **Milestone 3**: PLG Frontend flow pages (Landing Page, Upload Page, Loading Page, Job Selection Page, LinkedIn Mockup Component, Paywall modal on Mockup Page, Dashboard Page, and Custom 404 Page).
    - Implement `src/app/not-found.tsx` with selectors `404-title` and `404-back-link`.
    - Implement `src/app/select-role/page.tsx` with grid selection, custom inputs (100 char limit), char-counter, toast validations, and routing.
    - Update all pages to include missing `data-testid` selectors (e.g. `upload-input`, `drop-zone`, `upload-error`, `upload-progress`, `upload-cancel`, `loading-spinner`, `loading-status-text`, `processing-error`, `retry-button`, `loading-latency-warning`, `mockup-banner`, `mockup-avatar`, `mockup-headline`, `mockup-about`, `mockup-experience-list`, `mockup-experience-item`, `mockup-toggle-view`, `alter-role-btn`, `paywall-unlock`, `paywall-modal`, `paywall-checkout-btn`, `paywall-close`, `paywall-feedback`, `copy-title-btn`, `copy-about-btn`, `copy-experiences-btn`, `copy-toast`, `dashboard-skeleton`).
  - **Milestone 4**: Firebase integration & AI API (Firestore schemas, Storage uploads, processing state logic, decoupled API).
    - Integrations: Storage for PDF uploads, Firestore for processing status (`uploaded` -> `processing` -> `reescrevendo` -> `processed` -> `failed`) and profile JSON data.
    - Implement server-side PDF extraction (using `pdf-parse` or a fallback parser) and initial Firestore document creation.
    - Implement backend API routes:
      - `POST /api/upload`: handles PDF upload to Storage and text extraction, initializing Firestore state.
      - `GET /api/rebuild/status?cvId=...`: polls user document status from Firestore.
      - `POST /api/rebuild/select-role`: updates target role and triggers AI reconstruction.
      - `GET /api/profile-rebuild?cvId=...`: returns reconstructed profile JSON. Must include comment `// TODO: V2 Chrome Extension Hook` at the top and validate payment status.
      - `POST /api/checkout`: creates simulated payment session.
      - `POST /api/payment-webhook`: updates user status in Firestore to `paid` (idempotent, supports duplicate requests).
    - Integrate AI call (Gemini or OpenAI) with `prompt_mestre.md`. Implement a robust local fallback in case of missing keys/network issues to satisfy offline E2E test runs.
  - **Milestone 5**: Full E2E verification & hardening.
    - Start Firebase Local Emulators and Next.js dev server.
    - Run Playwright E2E tests (`npx playwright test`) to ensure all 82 test cases across 4 configurations pass.
    - Spawn Forensic Auditor to verify no cheating, hardcoding, or dummy results.

## Verification Strategy
- Worker will implement all frontend/backend code, start emulator + Next dev server, and verify using `npx playwright test`.
- All tests must pass with exit code 0.
- Forensic Auditor will run to verify there is no hardcoding, dummy logic, or other integrity violations.
