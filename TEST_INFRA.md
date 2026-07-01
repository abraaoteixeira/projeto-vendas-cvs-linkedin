# TEST_INFRA.md — E2E Test Infrastructure & Test Suite Documentation

This document defines the E2E test infrastructure, strategy, and test cases designed for the LinkedIn Profile Rebuilder SaaS MVP.

---

## 1. Test Philosophy

Our testing framework uses an **opaque-box, requirement-driven** strategy to validate the application's flow and logic. The test suite operates from the perspective of an end-user and external clients without assuming access to internal JavaScript state, styling variables, or functions.

The core principles of our testing philosophy are:
- **Opaque-Box Testing**: Evaluates UI actions, API requests/responses, and database states through standard endpoints and public interactions.
- **Requirement-Driven**: Every test case directly links to requirements (R1-R4) and Acceptance Criteria in `PROJECT.md` and `ORIGINAL_REQUEST.md`.
- **Category-Partition (C-P)**: Groups inputs (such as file formats, file sizes, and career roles) into categories to isolate and verify equivalence classes.
- **Boundary Value Analysis (BVA)**: Asserts system boundaries, including empty files (0 bytes), oversized files (15MB vs. 5MB limit), custom inputs (100 vs. 1000 characters), and rate limits.
- **Pairwise Testing**: Strategically maps combinations of viewports, browser types, and file options to optimize E2E execution paths.
- **Workload Testing**: Simulates real-world conditions like slow network throttling (3G speeds), database latency spikes, and simultaneous users.

---

## 2. Feature Inventory

| Feature ID | Feature Name | Description | ORIGINAL_REQUEST Mapping |
|------------|--------------|-------------|--------------------------|
| **F1** | Landing Page & Copy Elements | Presentation of sales assets, conversion triggers, and main CTA button routing. | R1 (Landing Page), R4 (Headline, Subheadline, CTA copy) |
| **F2** | CV Upload & Storage Pipeline | Drop-zone interface, file validation constraints (PDF vs. other types), and Cloud Storage storage logic. | R1 (Upload Page), R2 (PDF upload to Storage) |
| **F3** | Interactive Loading Screen | Intermediate loading transition, rotating text updates, and Firestore state polling during CV extraction. | R1 (Interactive Loading), R2 (Firestore processing status), R4 (Loading copy) |
| **F4** | Target Job/Role Selection | Selection grid for predefined career paths and input fields for custom role specifications. | R1 (Job Selection Page) |
| **F5** | Interactive LinkedIn Mockup | Dynamic component displaying AI-generated title, bio, and rewritten experiences via dynamic props. | R1 (LinkedIn Mockup component), R3 (AI JSON extraction output) |
| **F6** | Conversion Paywall | Blocker overlay restricting access, Stripe redirect triggers, and database paid status mutations. | R1 (Paywall Page), R4 (Paywall triggers & copywriting) |
| **F7** | Decoupled Dashboard & API | Premium dashboard for copies, structured `/api/profile-rebuild` API endpoint, and comment integration hooks. | R1 (Dashboard), R2 (Decoupled API structure), R3 (AI JSON schema keys), Comment Hook |

---

## 3. Test Architecture

The testing architecture uses **Playwright** as the automation framework and runs tests locally against a target base URL of `http://localhost:3000`.

### 3.1 Components
1. **Test Runner**: Playwright (`@playwright/test`)
   - Emulates multiple browsers (Chromium, Firefox, WebKit) and mobile devices (iPhone 14 Pro Max).
   - Manages asynchronous assertions, automated screenshots on failure, and trace generation.
2. **Database Mocking**: Firebase Emulator Suite
   - Runs Firestore and Storage locally. Isolated test suites can seed and clean data deterministically between runs.
3. **AI Mocking**: Playwright Route Interception (`page.route`)
   - Intercepts requests to the backend AI processors/API endpoints, returning preconfigured JSON files to ensure tests remain fast, cheap, and deterministic.

### 3.2 Test Case Format
Each E2E test case is declared with:
- **Test Case ID / Name**: Unique identifier.
- **Description**: Target requirement and validation purpose.
- **Inputs**: Step-by-step user input commands or API queries.
- **Expected Output**: Assertions for UI state, network requests, database changes, or console outputs.

### 3.3 Directory Layout
All tests and configurations reside in the root-level `/tests` directory:

```text
/projeto-vendas-cvs-linkedin
├── tests/
│   ├── e2e/
│   │   ├── F1_landing.spec.ts         # Landing page and CTA routing tests
│   │   ├── F2_upload.spec.ts          # PDF upload and error state validation tests
│   │   ├── F3_loading.spec.ts         # Transition page and status polling tests
│   │   ├── F4_role_selection.spec.ts  # Career selection and inputs tests
│   │   ├── F5_mockup.spec.ts          # LinkedIn mockup visual layout rendering tests
│   │   ├── F6_paywall.spec.ts         # Checkout redirects and paywall blocker tests
│   │   ├── F7_dashboard.spec.ts       # Clipboard widgets and API schema checks
│   │   └── cross_scenarios.spec.ts   # Tiers 3 (Combinations) and 4 (Real-World Scenarios)
│   ├── fixtures/
│   │   ├── cv_valid.pdf               # Mock valid CV PDF (1MB)
│   │   ├── cv_too_large.pdf           # Mock oversized PDF (12MB)
│   │   ├── cv_corrupted.pdf           # Mock invalid file format
│   │   └── ai_mock_response.json      # Standard output payload for AI
│   └── helpers/
│       └── db_cleaner.ts              # Script to reset Firebase local emulator db state
├── playwright.config.ts               # Playwright configuration
├── package.json
└── PROJECT.md
```

---

## 4. Real-World Application Scenarios (Tier 4)

| Scenario ID | Scenario Name | Steps | Inputs | Expected Output |
|-------------|---------------|-------|--------|-----------------|
| **RW-TC1** | Complete Premium Conversion Journey | 1. Navigate to `/` and click CTA.<br>2. Upload `CV_Eng_Civil.pdf`.<br>3. Track processing on `/loading`.<br>4. Select "Gerente de Projetos" on `/select-role`.<br>5. Review Mockup at `/mockup`.<br>6. Click unlock. Proceed to payment page.<br>7. Webhook registers payment status change.<br>8. Open dashboard `/dashboard` and click copy. | Valid CV file, "Gerente de Projetos" target, mock payment webhook. | Transition through pages completes smoothly. User registers as paid in Firestore. Copied clipboard values match the target output payload. |
| **RW-TC2** | User Upload Fail and Free Funnel Exit | 1. Drag and drop invalid PPTX file.<br>2. Verify error message.<br>3. Drag and drop valid PDF file.<br>4. Proceed through loading and role selection.<br>5. Reach paywall overlay.<br>6. Decline payment and close browser tab. | Invalid PPTX file, valid PDF, cancelation actions. | PPTX file is rejected instantly. PDF upload proceeds. Paywall blocks access to dashboard, and no user purchase is made. |
| **RW-TC3** | Mobile Conversion Workflow | 1. Initialize mobile browser (iPhone 14 Pro Max viewport).<br>2. Perform entire funnel (Landing page, Upload, Loading, Role Selection, Mockup, Payment click, Dashboard).<br>3. Trigger copy widget buttons. | Mobile user-agent and viewport variables, valid CV document. | Layout elements scale correctly. Navigation flows seamlessly. Tap-to-copy trigger saves data to mobile system clipboard. |
| **RW-TC4** | Decoupled Chrome Extension Hook | 1. Mock premium user entry in database.<br>2. Query `/api/profile-rebuild?userId=user_99` from an external client.<br>3. Parse JSON response.<br>4. Read `/src/app/api/profile-rebuild/route.ts` content. | GET request targeting API route, server files content. | API responds with HTTP 200 and schema matches AI output keys. Code files contain `// TODO: V2 Chrome Extension Hook`. |
| **RW-TC5** | System Concurrent Load Stress | 1. Send 10 concurrent file upload requests targeting `/api/upload` from distinct user sessions. | 10 distinct files and credentials. | Requests are accepted and saved safely in Storage/Firestore. No session cross-contamination or document locking occurs. |

---

## 5. Coverage Thresholds Checklist

- [ ] **Tier 1: Feature Coverage** $\ge 35$ test cases (5 per feature F1-F7).
- [ ] **Tier 2: Boundary & Corner Cases** $\ge 35$ test cases (5 per feature F1-F7).
- [ ] **Tier 3: Cross-Feature Combinations** $\ge 7$ test cases.
- [ ] **Tier 4: Real-World Scenarios** $\ge 5$ test cases.
- [ ] **Browser Interoperability**: Chromium, Firefox, WebKit execution check.
- [ ] **Mobile Responsive Layout Verification**: iPhone 14 emulation scaling check.
- [ ] **API Contract Conformity**: Verification of `/api/profile-rebuild` structured JSON schema types.
- [ ] **Storage Limits enforcement**: Blocking files > 5MB, files with 0 bytes, and unsupported extensions.
- [ ] **Offline & Network Recovery**: Successful reconnection behavior on network drops.
- [ ] **Environment Isolation**: Runs natively against Firebase local emulators with zero cloud side-effects.

---

## 6. Comprehensive Test Suite (82 Test Cases)

### Tier 1: Feature Coverage (35 Test Cases)

#### F1: Landing Page & Conversational Navigation (5 Tests)
- **F1-TC1: Initial Render Validation**
  - *Description*: Verify that the landing page renders core components cleanly.
  - *Inputs*: Navigate to `/`.
  - *Expected Output*: Headline, subheadline, and main CTA button are visible. Headline matches growth copy.
- **F1-TC2: CTA Redirection**
  - *Description*: Click the CTA button and confirm redirection.
  - *Inputs*: Click "Reconstruir meu Perfil".
  - *Expected Output*: URL changes to `/upload`.
- **F1-TC3: Multi-Viewport Responsiveness**
  - *Description*: Validate that the layout handles mobile, tablet, and desktop viewports.
  - *Inputs*: Set viewport to 375x812 (mobile), 768x1024 (tablet), 1280x800 (desktop).
  - *Expected Output*: Layout components do not overlap; CTA button remains clickable on all screens.
- **F1-TC4: Copy Copywriting Asset Check**
  - *Description*: Verify presence of the specific copy hooks from `copy_e_growth.md`.
  - *Inputs*: Select text elements on Landing Page.
  - *Expected Output*: Text contains core sales hooks (invisibility pain points, growth statistics).
- **F1-TC5: Smooth Anchor Scrolling**
  - *Description*: Click landing page menu links to check anchor jumps.
  - *Inputs*: Click navigation menu links.
  - *Expected Output*: Smoothly scrolls to target sections without layout jumping or console errors.

#### F2: CV Upload & Storage Pipeline (5 Tests)
- **F2-TC1: Successful PDF Upload**
  - *Description*: Upload a valid PDF CV.
  - *Inputs*: Drag and drop a 1MB valid PDF CV.
  - *Expected Output*: Firebase Storage receives the file; Firestore registers a new document with state `uploaded`.
- **F2-TC2: Rejection of Non-PDF Formats**
  - *Description*: Attempt to upload unsupported formats.
  - *Inputs*: Upload `cv.docx` or `cv.png`.
  - *Expected Output*: Error message displays: "Format not supported. Please upload a PDF"; Firestore is not modified.
- **F2-TC3: Rejection of Oversized Files**
  - *Description*: Validate size limits.
  - *Inputs*: Upload a 15MB PDF.
  - *Expected Output*: UI blocks upload showing: "File too large. Maximum size is 5MB".
- **F2-TC4: Upload Progress Bar**
  - *Description*: Monitor upload visual cues during transfer.
  - *Inputs*: Upload a 4MB PDF on a throttled 3G connection.
  - *Expected Output*: Progress bar starts at 0% and climbs incrementally to 100%.
- **F2-TC5: Cancel Upload Functionality**
  - *Description*: Abort an in-progress file upload.
  - *Inputs*: Start a throttled upload and click "Cancel".
  - *Expected Output*: Upload terminates; UI resets to the drop-zone state; no file is persisted in Firebase Storage.

#### F3: Interactive Loading / Processing Screen (5 Tests)
- **F3-TC1: Route Transition**
  - *Description*: Verify transition to the loading page after successful upload.
  - *Inputs*: Upload finishes.
  - *Expected Output*: URL changes to `/loading`.
- **F3-TC2: Narrative Copy Rotation**
  - *Description*: Ensure copywriting transitions on-screen during loading to keep the user engaged.
  - *Inputs*: Monitor the screen for 8 seconds.
  - *Expected Output*: Text dynamically changes through the stages defined in `copy_e_growth.md` (e.g. "Lendo currículo...", "Extraindo dados chave...").
- **F3-TC3: Real-Time State Synced with Firestore**
  - *Description*: Verify loading page reads and reacts to the Firestore state updates.
  - *Inputs*: Backend changes status of document to `processing`.
  - *Expected Output*: Loader updates text to "Reescrevendo experiências...".
- **F3-TC4: Processing Error Handling**
  - *Description*: Check loading behavior when processing fails.
  - *Inputs*: Simulate a backend error by setting Firestore status to `failed`.
  - *Expected Output*: Loading screen terminates; error page displays with retry action.
- **F3-TC5: Interactive Animation Stability**
  - *Description*: Ensure spinner renders without layout shifting.
  - *Inputs*: Check spinner elements and classes.
  - *Expected Output*: Spinner animates smoothly and conforms to shadcn/ui styles.

#### F4: Target Job/Role Selection (5 Tests)
- **F4-TC1: Redirect on Completion**
  - *Description*: Redirect user to role selection when CV processing finishes.
  - *Inputs*: Firestore status changes to `processed`.
  - *Expected Output*: UI navigates to `/select-role`.
- **F4-TC2: Custom Job Entry**
  - *Description*: Allow custom inputs for roles not listed in options.
  - *Inputs*: Select "Outro" and enter "Senior Reliability Engineer". Submit.
  - *Expected Output*: Choice is saved; payload details target role correctly.
- **F4-TC3: Selection Grid Interaction**
  - *Description*: Test interactions on pre-defined roles.
  - *Inputs*: Click "Desenvolvedor Full Stack" card.
  - *Expected Output*: Card displays visual selection border; "Continuar" button is enabled.
- **F4-TC4: Validation Check**
  - *Description*: Block continuing without selecting a role.
  - *Inputs*: Click "Continuar" button when no role is active.
  - *Expected Output*: Error toast displays: "Por favor, selecione um cargo".
- **F4-TC5: Back Navigation Reset**
  - *Description*: Verify returning to upload resets state.
  - *Inputs*: Click "Voltar" link.
  - *Expected Output*: UI navigates back to `/upload`; active processing session is reset.

#### F5: Interactive LinkedIn Mockup Visualization (5 Tests)
- **F5-TC1: Layout Structural Verification**
  - *Description*: Ensure components mirror the LinkedIn layout structure.
  - *Inputs*: Render page `/mockup` with mock data.
  - *Expected Output*: Profile banner, round avatar frame, headline text, bio card, and experience listings appear.
- **F5-TC2: Dynamic Props Propagation**
  - *Description*: Confirm that mockup components render props variables.
  - *Inputs*: Inject props `{ novo_titulo_linkedin: "Senior Dev", sobre_persuasivo: "Bio Exemplo", top_3_experiencias_reescritas: ["E1", "E2"] }`.
  - *Expected Output*: Corresponding sections display matching strings.
- **F5-TC3: Responsiveness of Profile elements**
  - *Description*: Verify that the mockup matches LinkedIn mobile look.
  - *Inputs*: Set viewport to 375px wide.
  - *Expected Output*: Profile picture shrinks and re-aligns; text wraps correctly.
- **F5-TC4: Skeleton Mockup Loading state**
  - *Description*: Show skeleton loader cards before data is fetched.
  - *Inputs*: Mount page with data loading active.
  - *Expected Output*: Skeleton divs render in place of the text and images.
- **F5-TC5: Original vs. Optimized Toggle**
  - *Description*: Toggle view between original CV text and optimized profile text.
  - *Inputs*: Click "Visualizar Original" toggle.
  - *Expected Output*: Text details fall back to original uploaded CV contents.

#### F6: Conversion Paywall (5 Tests)
- **F6-TC1: Access Blocker Trigger**
  - *Description*: Display paywall when user attempts to proceed from preview to premium copy screen.
  - *Inputs*: Click "Ver Perfil Completo" on `/mockup`.
  - *Expected Output*: Paywall modal or page blocks screen.
- **F6-TC2: Verify Conversion Copywriting**
  - *Description*: Check copy presence against `copy_e_growth.md`.
  - *Inputs*: Check text inside the paywall container.
  - *Expected Output*: Includes premium value props (e.g. "Desbloqueie seu potencial", price anchor).
- **F6-TC3: Redirection to Payment Checkout**
  - *Description*: Check CTA triggers payment link.
  - *Inputs*: Click "Quero Acesso Premium".
  - *Expected Output*: Redirects user to Stripe / checkout gateway link.
- **F6-TC4: Successful Payment Update**
  - *Description*: Simulate webhook database callback for paid users.
  - *Inputs*: POST `/api/payment-webhook` with `{ userId: 'user123', status: 'paid' }`.
  - *Expected Output*: User Firestore record premium flag is set to `true`.
- **F6-TC5: Paywall Dismissal Redirect**
  - *Description*: Handle clicking cancel/close on the paywall.
  - *Inputs*: Click the close icon on paywall.
  - *Expected Output*: Paywall modal closes, UI returns user to read-only mockup.

#### F7: Decoupled Copy-Paste Dashboard & API (5 Tests)
- **F7-TC1: Premium User Dashboard Access**
  - *Description*: Access the dashboard as a paid premium user.
  - *Inputs*: Navigate to `/dashboard` with a premium account session.
  - *Expected Output*: Dashboard page opens; all copy widgets are active.
- **F7-TC2: Copy LinkedIn Title Widget**
  - *Description*: Copy optimized title to system clipboard.
  - *Inputs*: Click "Copiar Título".
  - *Expected Output*: Clipboard contains `novo_titulo_linkedin`; toast says "Copiado!".
- **F7-TC3: Copy Bio and Experience Widgets**
  - *Description*: Copy Bio and rewritten experiences.
  - *Inputs*: Click "Copiar Sobre" and "Copiar Experiências".
  - *Expected Output*: Respective strings are written to the system clipboard.
- **F7-TC4: API Format Contract Check**
  - *Description*: Verify contract payload format on `/api/profile-rebuild`.
  - *Inputs*: GET `/api/profile-rebuild?userId=user123`.
  - *Expected Output*: HTTP 200; Response headers include `application/json`; Payload matches schema (keys: `novo_titulo_linkedin`, `sobre_persuasivo`, `top_3_experiencias_reescritas`).
- **F7-TC5: Decoupled Comments Check**
  - *Description*: Verify source code contains Chrome Extension comment tags.
  - *Inputs*: Read server actions/endpoints source files.
  - *Expected Output*: Contains the exact string comment `// TODO: V2 Chrome Extension Hook`.

---

### Tier 2: Boundary & Corner Cases (35 Test Cases)

#### F1: Landing Page Boundaries (5 Tests)
- **F1-TC6: Slow Asset Render Resiliency**
  - *Description*: Check if the page behaves correctly if CSS loads slowly.
  - *Inputs*: Throttle CSS/JS files using proxy.
  - *Expected Output*: Text remains readable; basic CTAs are interactive.
- **F1-TC7: Clean 404 Routing**
  - *Description*: Check navigation to non-existent route.
  - *Inputs*: Access `/invalid-route-name`.
  - *Expected Output*: Custom 404 page is displayed with clear navigation back to landing page.
- **F1-TC8: Malformed Query Parameter Handling**
  - *Description*: Navigate to Landing Page with weird parameters.
  - *Inputs*: Access `/?utm_source=invalid[]%&utm_campaign=xyz`.
  - *Expected Output*: Page loads without throwing errors or breaking redirects.
- **F1-TC9: Bot Crawling Simulation**
  - *Description*: Check bot indexing readability.
  - *Inputs*: Request `/` using `Googlebot` user-agent.
  - *Expected Output*: Page returns standard static HTML without rendering blank screens or getting stuck in JavaScript verification checks.
- **F1-TC10: Rapid CTA Click Spams**
  - *Description*: Prevent duplicate route transition queues.
  - *Inputs*: Double click CTA button fast (e.g. 50ms interval).
  - *Expected Output*: Only one navigation event fires; URL changes to `/upload` once.

#### F2: CV Upload Boundaries (5 Tests)
- **F2-TC6: Empty File Upload**
  - *Description*: Attempt to upload a 0 byte file.
  - *Inputs*: Drag and drop `empty.pdf` (0 bytes).
  - *Expected Output*: UI displays error: "This file is empty. Please upload a valid CV PDF."
- **F2-TC7: Special Characters File Name**
  - *Description*: Upload PDF containing non-standard Unicode or special characters.
  - *Inputs*: Upload file `Currículo_#2026_@Admin-Versão%.pdf`.
  - *Expected Output*: Upload processes successfully; name is sanitized in Firestore/Storage.
- **F2-TC8: Masked Text File as PDF**
  - *Description*: Attempt to bypass type checks by renaming a text file extension.
  - *Inputs*: Upload `normal_text.pdf` (which contains pure ASCII text, not valid PDF structure).
  - *Expected Output*: System parsing module catches failure; UI alerts: "Could not parse PDF content. Ensure the file is not corrupted."
- **F2-TC9: Network Loss Mid-Upload**
  - *Description*: Recover UI state on disconnect.
  - *Inputs*: Force offline status during file transfer.
  - *Expected Output*: Transfer stops; warning message: "Connection lost. Please try again"; Storage cleanly discards partial file chunk.
- **F2-TC10: Encrypted PDF CV**
  - *Description*: Attempt to upload a password-protected CV.
  - *Inputs*: Upload `encrypted_cv.pdf`.
  - *Expected Output*: Parser detects lock state; UI alerts: "Password-protected PDFs are not supported. Upload a decrypted file."

#### F3: Interactive Loading Boundaries (5 Tests)
- **F3-TC6: Firebase Latency Timeout**
  - *Description*: Graceful timeout handling when database/API takes too long.
  - *Inputs*: Lock status progress call for 30+ seconds.
  - *Expected Output*: UI remains interactive; status message displays: "Estamos processando. Isso pode demorar mais do que o comum..."
- **F3-TC7: Tab Reload Persistence**
  - *Description*: Verify processing status state persists on browser reload.
  - *Inputs*: Press F5/Refresh while page state is `processing`.
  - *Expected Output*: UI restores loading state from user session data and resumes tracking active Firestore document without re-uploading.
- **F3-TC8: Polling Disconnect Recovery**
  - *Description*: Re-establish polling listener on connection loss.
  - *Inputs*: Break client internet connection for 5 seconds and restore it.
  - *Expected Output*: UI retries connection in background and seamlessly updates UI once database stream resumes.
- **F3-TC9: Malformed State Payload handling**
  - *Description*: Prevent crash if Firestore gets unexpected state strings.
  - *Inputs*: Force document status to `invalid_status`.
  - *Expected Output*: Page recovers cleanly using fallback default spinner messages; doesn't break React app layout.
- **F3-TC10: Ultra-Fast Backend Execution**
  - *Description*: Handle instantaneous API responses to avoid UX layout flash.
  - *Inputs*: Mock processing delay to 10ms.
  - *Expected Output*: Loading screen remains visible for a minimum duration of 1.5 seconds for readable transitions, then progresses.

#### F4: Job/Role Selection Boundaries (5 Tests)
- **F4-TC6: Overflow Length Custom Input**
  - *Description*: Try to enter an exceptionally long custom role text.
  - *Inputs*: Input 1,000 characters in custom role text box.
  - *Expected Output*: Field limits input to 100 characters; displays character counter warning.
- **F4-TC7: HTML/JS Injection (XSS Check)**
  - *Description*: Input script elements into custom role entry.
  - *Inputs*: Enter `<script>alert('XSS')</script>` as custom role.
  - *Expected Output*: Output is rendered as sanitized static string: `&lt;script&gt;alert('XSS')&lt;/script&gt;` inside the mockup header, rather than executing.
- **F4-TC8: Concurrent Choice Clicking**
  - *Description*: Check selection state under rapid clicking.
  - *Inputs*: Rapidly click "Software Engineer", then "Data Analyst", then "Product Manager".
  - *Expected Output*: Selection resolves cleanly on the last clicked role.
- **F4-TC9: Selection Persistence Across Refreshes**
  - *Description*: Reload page with half-filled configuration.
  - *Inputs*: Click card, reload browser page.
  - *Expected Output*: Active card remains highlighted if selection was cached in session storage.
- **F4-TC10: Accessible Keyboard Interaction**
  - *Description*: Navigate selection page via Tab keys.
  - *Inputs*: Focus and navigate layout using `TAB`, select card using `Space` / `Enter`.
  - *Expected Output*: Element outlines render cleanly; selection updates correctly without mouse usage.

#### F5: LinkedIn Mockup Boundaries (5 Tests)
- **F5-TC6: Super-Long AI Fields (Layout Overflow Check)**
  - *Description*: Ensure layout doesn't break under verbose AI generation outputs.
  - *Inputs*: Inject mock AI payload with a 400-character title and a 4000-character bio.
  - *Expected Output*: Mockup container wraps texts correctly; does not clip or overflow viewport boundaries.
- **F5-TC7: Empty AI Outputs Handling**
  - *Description*: Handle missing fields in payload.
  - *Inputs*: Inject empty strings for `sobre_persuasivo`.
  - *Expected Output*: UI renders placeholder text: "Insira uma descrição sobre você" or drops section cleanly without throwing React runtime errors.
- **F5-TC8: Direct URL Access Block**
  - *Description*: Block viewing mockup directly without completing upload/job selection.
  - *Inputs*: Navigate directly to `/mockup` on clean session.
  - *Expected Output*: UI redirects user back to home `/` or `/upload`.
- **F5-TC9: Non-ASCII Emojis and Character Scripts**
  - *Description*: Verify unicode/emoji rendering.
  - *Inputs*: Inject `Diretor de Engenharia de Vendas 🚀 (日本語)`.
  - *Expected Output*: Layout renders standard fonts and symbols without displaying missing glyph characters or breaking layouts.
- **F5-TC10: Intercepting Profile Editing Actions**
  - *Description*: Lock mockup inputs from client editing.
  - *Inputs*: Try to double click, hover, edit text content in mockup sections.
  - *Expected Output*: Text blocks are non-editable; correct read-only state persists.

#### F6: Paywall Boundaries (5 Tests)
- **F6-TC6: Multi-Click Checkout Prevention**
  - *Description*: Prevent duplicate session generations on double click.
  - *Inputs*: Double click "Quero Acesso Premium" button.
  - *Expected Output*: Only one checkout redirection request is triggered.
- **F6-TC7: Out-of-Order Webhook Delivery**
  - *Description*: Ensure database handles delayed/duplicate webhooks.
  - *Inputs*: Send duplicate paid events for the same purchase session to `/api/payment-webhook`.
  - *Expected Output*: Database records status idempotently; does not crash or corrupt profile record.
- **F6-TC8: LocalStorage Bypass Mitigation**
  - *Description*: Block dashboard access if a user manually sets local storage values to bypass the paywall.
  - *Inputs*: Set `localStorage.setItem('premium', 'true')` and navigate to `/dashboard`.
  - *Expected Output*: Next.js middleware / layout check queries Firestore for validation and redirects back to `/paywall`.
- **F6-TC9: Abandoned Checkout Resiliency**
  - *Description*: Recover state after canceling payment.
  - *Inputs*: Navigate to checkout portal, click back/cancel button.
  - *Expected Output*: User returns to `/paywall` page with clear feedback message: "Pagamento não finalizado. Tente novamente."
- **F6-TC10: Expired Verification Session**
  - *Description*: Prevent dashboard queries if cookies or active session is deleted mid-page view.
  - *Inputs*: Delete browser cookie session while sitting on `/dashboard`, then click copy widgets.
  - *Expected Output*: Copy actions fail; user is redirected to landing `/` or `/paywall`.

#### F7: Dashboard & API Boundaries (5 Tests)
- **F7-TC6: Fetching Data for Non-Existent User**
  - *Description*: API endpoint handling for unknown profiles.
  - *Inputs*: Request `/api/profile-rebuild?userId=user_does_not_exist`.
  - *Expected Output*: API returns HTTP 404 and `{ error: "User not found" }`.
- **F7-TC7: Loading Under Massive Network Throttling**
  - *Description*: Ensure dashboard components display skeletons rather than crashing on slow networks.
  - *Inputs*: Throttle bandwidth to 50 kbps.
  - *Expected Output*: Layout structure resolves immediately; text items stream or display skeleton loaders.
- **F7-TC8: Copy Fail Safe**
  - *Description*: Copy validation on devices/browsers where `navigator.clipboard` is restricted.
  - *Inputs*: Block `navigator.clipboard` API access in browser permissions.
  - *Expected Output*: Clipboard script automatically falls back to textarea selection method; copy still succeeds.
- **F7-TC9: Missing Request Params on API**
  - *Description*: Handle empty payload calls.
  - *Inputs*: GET `/api/profile-rebuild` with no query parameters.
  - *Expected Output*: API returns HTTP 400 and `{ error: "userId is required" }`.
- **F7-TC10: API Input Injection Attack**
  - *Description*: Verify parameter sanitization.
  - *Inputs*: GET `/api/profile-rebuild?userId=';DROP TABLE profiles;--`.
  - *Expected Output*: Sanitized query inputs; returned JSON payload is either 404 or returns empty safe profile; database is unaffected.

---

### Tier 3: Cross-Feature Combinations (7 Test Cases)

- **XF-TC1: Seamless Sequential Funnel (LP -> Upload -> Loading -> Selection -> Mockup)**
  - *Description*: Complete the pre-paywall PLG funnel in a single user session.
  - *Inputs*: Navigate to `/`, upload valid `cv_valid.pdf`, wait through loading animation, select "Tech Lead" custom role, view mockup.
  - *Expected Output*: Seamless transitions; mockup displays "Tech Lead" tailored titles and copy.
- **XF-TC2: Purchase Validation and Mockup-to-Dashboard Unlock**
  - *Description*: Unlock full capabilities of dashboard upon successful payment checkout.
  - *Inputs*: Access mockup, trigger paywall, complete stripe redirect simulation, process payment hook.
  - *Expected Output*: UI updates view dynamically, routes to `/dashboard`, clipboard selectors function.
- **XF-TC3: Multi-Process Abort (Loading to Re-upload)**
  - *Description*: Change mind during loading state and upload a new CV.
  - *Inputs*: Trigger CV processing -> loading screen starts -> click browser "Back" -> drag-and-drop a different `cv_valid.pdf`.
  - *Expected Output*: The first database document is marked canceled; a new document is registered in Firestore; loading screen tracking switches to the new ID.
- **XF-TC4: Interactive Mockup Regenerative Loop**
  - *Description*: Modify target role from the mockup view to recalculate AI output.
  - *Inputs*: From `/mockup`, click "Alterar Cargo", change target role to "Product Designer", submit, return to `/mockup`.
  - *Expected Output*: Mockup displays skeleton state -> triggers `/api/profile-rebuild` -> renders updated bio matching "Product Designer" profile.
- **XF-TC5: Decoupled API Integration (Simulation of Chrome Extension Context)**
  - *Description*: Verify that independent clients access data correctly once paywall verifies user.
  - *Inputs*: Process payment on browser -> query `/api/profile-rebuild?userId=user123` from terminal curl/postman client.
  - *Expected Output*: Endpoint matches JSON schema structure; payload contains `// TODO: V2 Chrome Extension Hook` references.
- **XF-TC6: Recovery from Upload Failures during Interactive State**
  - *Description*: Graceful fallback to upload after encountering processing error on loading screen.
  - *Inputs*: Start process -> Firestore set to `failed` status -> click "Tentar Novamente" on error panel.
  - *Expected Output*: Navigates back to `/upload` with file dropzone cleared and ready.
- **XF-TC7: State-Aware Landing Page routing**
  - *Description*: Smart redirect on landing page CTA based on user session state.
  - *Inputs*: User with an already processed profile click CTA on `/`.
  - *Expected Output*: Detects active profile data in cookies/Firestore and redirects user to `/mockup` or `/dashboard` instead of forcing them to re-upload.

---

### Tier 4: Real-World Application Scenarios (5 Test Cases)

- **RW-TC1: Complete Premium Conversion Journey**
  - *Description*: E2E test verifying a job seeker landing on the homepage, submitting a CV, selecting their role, previewing their LinkedIn card, purchasing premium, and successfully copying all three outputs.
  - *Inputs*: `cv_valid.pdf`, "Gerente de Projetos" target, mock payment details.
  - *Expected Output*: Successful completion of all actions; correct database mutations; exact clipboard values.
- **RW-TC2: User Upload Fail and Free Funnel Exit**
  - *Description*: Simulate user making user errors, uploading valid CV afterwards, viewing preview, and exiting at paywall.
  - *Inputs*: `cv_corrupted.pdf`, `cv_valid.pdf`, "Analista de Growth Marketing" target.
  - *Expected Output*: UI blocks corrupted file upload; successfully process PDF; paywall locks access and rejects navigating to dashboard; clean termination.
- **RW-TC3: Mobile conversion workflow**
  - *Description*: Emulate mobile context for the entire conversion flow.
  - *Inputs*: Mobile User-Agent and viewport dimensions, valid CV.
  - *Expected Output*: No layout overlapping; buttons have accessible tap sizes; clipboard operations succeed on mobile environment.
- **RW-TC4: Chrome Extension decoupled API Integration**
  - *Description*: Simulate external client using API credentials to update a browser view.
  - *Inputs*: Profile GET request, source code verification.
  - *Expected Output*: HTTP 200 return containing valid JSON payload with title, bio, and top 3 experience array; comment check passes.
- **RW-TC5: Rate Limiting & Concurrent System Stress**
  - *Description*: Verify API stability and isolation under multiple concurrent user requests.
  - *Inputs*: 10 distinct valid test PDFs sent concurrently.
  - *Expected Output*: No database locks occur; users' profiles remain isolated (no mixed data leakage); requests either process successfully or get queued/throttled gracefully with 429 status.
