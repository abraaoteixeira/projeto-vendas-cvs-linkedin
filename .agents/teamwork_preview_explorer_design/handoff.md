# E2E Test Suite Design Report

## 1. Observation
From the project description and configuration files, the following details were directly observed:
- **Core Architecture & Flow (`PROJECT.md` & `ORIGINAL_REQUEST.md`)**:
  - The application is a Product-Led Growth (PLG) SaaS for rebuilding LinkedIn profiles built with **Next.js (React) + Tailwind CSS + shadcn/ui** and **Firebase** (Firestore for user/job records, Storage for CV PDFs).
  - The flow consists of 7 steps: `Landing Page -> Upload CV -> Interactive Loading -> Job Selection -> LinkedIn Mockup -> Paywall -> Copy/Paste Dashboard`.
  - The backend returns a decoupled structured JSON containing:
    ```json
    {
      "novo_titulo_linkedin": "string",
      "sobre_persuasivo": "string",
      "top_3_experiencias_reescritas": ["string", "string", "string"]
    }
    ```
  - The integration point must expose the `/api/profile-rebuild` API route and contain the comment hook `// TODO: V2 Chrome Extension Hook`.
- **Target Milestones**:
  - **Milestone 5 (E2E Suite Verification)**: Requires passing E2E tests and completing adversarial hardening.
- **Constraints & Environment**:
  - The testing architecture must be opaque-box, requirement-driven, and compatible with Next.js running on Windows and standard environments.

---

## 2. Logic Chain
Based on these observations, the E2E test suite has been designed as follows:
1. **Define Core Features ($N$)**:
   - The user flow and system structure yield **$N = 7$** core features:
     - **F1: Landing Page & Copy Elements** (Sales presentation, copy triggers, CTA routing)
     - **F2: CV Upload & Storage Pipeline** (PDF upload interface, file validation, storage upload)
     - **F3: Interactive Loading / Processing Screen** (Engaging copy, spinner, Firestore polling)
     - **F4: Target Job/Role Selection** (Career mapping, custom job inputs, payload update)
     - **F5: Interactive LinkedIn Mockup Visualization** (Dynamic rendering of AI props in header/about/experience elements)
     - **F6: Conversion Paywall** (Access blocking, checkout trigger, premium status integration)
     - **F7: Decoupled Copy-Paste Dashboard & API** (Clipboard widgets, API response format, Chrome extension hook comments)
2. **Calculate Test Suite Coverage**:
   - **Tier 1: Feature Coverage** $\ge 5 \times N = 35$ test cases.
   - **Tier 2: Boundary & Corner Cases** $\ge 5 \times N = 35$ test cases.
   - **Tier 3: Cross-Feature Combinations** $\ge N = 7$ test cases.
   - **Tier 4: Real-World Application Scenarios** $\ge \max(5, N/2) = 5$ test cases.
   - **Total Test Cases**: $35 + 35 + 7 + 5 = 82$ test cases.
3. **Select Test Infrastructure**:
   - **Playwright** is recommended for the E2E framework because of its native support for Next.js, headless browsers, network interception (mocking Firebase and OpenAI API calls), mobile device emulation, and screenshot matching (perfect for the LinkedIn Mockup layout).
   - **Firebase Local Emulator Suite** is recommended to test Firestore/Storage logic without cloud-side side effects.

---

## 3. Comprehensive Test Suite (82 Test Cases)

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
  - *Inputs*: Navigate to `/`, upload valid `dev_cv.pdf`, wait through loading animation, select "Tech Lead" custom role, view mockup.
  - *Expected Output*: Seamless transitions; mockup displays "Tech Lead" tailored titles and copy.
- **XF-TC2: Purchase Validation and Mockup-to-Dashboard Unlock**
  - *Description*: Unlock full capabilities of dashboard upon successful payment checkout.
  - *Inputs*: Access mockup, trigger paywall, complete stripe redirect simulation, process payment hook.
  - *Expected Output*: UI updates view dynamically, routes to `/dashboard`, clipboard selectors function.
- **XF-TC3: Multi-Process Abort (Loading to Re-upload)**
  - *Description*: Change mind during loading state and upload a new CV.
  - *Inputs*: Trigger CV processing -> loading screen starts -> click browser "Back" -> drag-and-drop a different `marketing_cv.pdf`.
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
  - *Steps*: 
    1. Navigate to `/`. Click CTA.
    2. Upload `CV_Eng_Civil.pdf`.
    3. Transition to `/loading` and check dynamic message updates.
    4. Select "Gerente de Projetos" on `/select-role`. Click submit.
    5. Mockup preview page renders profile details.
    6. Click "Desbloquear Perfil". Verify Paywall overlay appears.
    7. Click Payment button, trigger `/api/payment-webhook` event payload.
    8. UI navigates to `/dashboard`.
    9. Click copy icons for title, bio, and experiences. Verify clipboard values match.
  - *Inputs*: `CV_Eng_Civil.pdf`, "Gerente de Projetos" target, mock payment details.
  - *Expected Output*: Successful completion of all actions; correct database mutations; exact clipboard values.
- **RW-TC2: User Upload Fail and Free Funnel Exit**
  - *Description*: Simulate user making user errors, uploading valid CV afterwards, viewing preview, and exiting at paywall.
  - *Steps*:
    1. Drop invalid `presentation.pptx` file. Verify rejection message.
    2. Drop valid `CV_Marketing.pdf`. Watch loading progress bar.
    3. Select "Analista de Growth Marketing".
    4. Review generated Mockup details.
    5. Hit Paywall overlay. Click close option.
    6. Close page.
  - *Inputs*: `presentation.pptx`, `CV_Marketing.pdf`, "Analista de Growth Marketing" target.
  - *Expected Output*: UI blocks pptx file upload; successfully process PDF; paywall locks access and rejects navigating to dashboard; clean termination.
- **RW-TC3: Mobile conversion workflow**
  - *Description*: Emulate mobile context for the entire conversion flow.
  - *Steps*:
    1. Force viewport settings to emulate iOS Safari (iPhone 14 Pro Max layout).
    2. Perform standard flow (Upload CV -> Loading -> Role -> Mockup -> Paywall -> Dashboard).
    3. Verify all touch buttons, drag/drop options, input elements fit properly.
    4. Verify tap-to-copy functions cleanly on mobile browser wrapper.
  - *Inputs*: Mobile User-Agent and viewport dimensions, valid CV.
  - *Expected Output*: No layout overlapping; buttons have accessible tap sizes; clipboard operations succeed on mobile environment.
- **RW-TC4: Chrome Extension decoupled API Integration**
  - *Description*: Simulate external client using API credentials to update a browser view.
  - *Steps*:
    1. Mock database state containing premium status user data.
    2. Fetch profile from mock API server: `/api/profile-rebuild?userId=premium_user_99`.
    3. Parse output structure to ensure it matches the AI Output Schema exactly.
    4. Scan `/api/profile-rebuild` code file to check it contains the comment comment `// TODO: V2 Chrome Extension Hook`.
  - *Inputs*: Profile GET request, source code verification.
  - *Expected Output*: HTTP 200 return containing valid JSON payload with title, bio, and top 3 experience array; comment check passes.
- **RW-TC5: Rate Limiting & Concurrent System Stress**
  - *Description*: Verify API stability and isolation under multiple concurrent user requests.
  - *Steps*:
    1. Spawn 10 simultaneous upload requests targeting `/api/upload` endpoint using different user tokens.
    2. Measure response codes, processing delays, and Firestore document creation.
  - *Inputs*: 10 distinct valid test PDFs sent concurrently.
  - *Expected Output*: No database locks occur; users' profiles remain isolated (no mixed data leakage); requests either process successfully or get queued/throttled gracefully with 429 status.

---

## 4. Recommended Test Infrastructure

To implement this suite, we recommend an opaque-box, requirements-driven structure using **Playwright** paired with **Firebase Local Emulator Suite**.

### 4.1 Technology Stack Choice
1. **Test Runner**: **Playwright** (`@playwright/test`)
   - *Why*: Supports headless runs on Windows, easily emulates mobile devices, allows intercepting API calls, and supports visual comparison tests for the LinkedIn mockup page layout.
2. **Database Mocking**: **Firebase Emulator Suite**
   - *Why*: Allows E2E runs to execute Firestore and Storage tasks locally. Tests run fast, are fully isolated, and incur zero Firebase API costs.
3. **AI Mocking**: Playwright API Route Mocking (`page.route`)
   - *Why*: Simulates the `/api/profile-rebuild` responses using mock files. Avoids expensive, slow, non-deterministic calls to OpenAI/Gemini during test runs.

### 4.2 Test File Directory Layout
To match the layout conventions in `PROJECT.md`, tests are housed in a root-level `/tests` directory:

```
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

### 4.3 Key Configuration Recommendations (`playwright.config.ts`)
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 14 Pro Max'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 5. Caveats
- **Implementation Status**: The project source code is in its setup stage (Milestones 1-4 are IN_PROGRESS/PLANNED). As a result, exact CSS selectors (`data-testid` values, class names) are not yet implemented. Developers must insert appropriate semantic selectors (`data-testid="upload-dropzone"`, `data-testid="copy-title-btn"`, etc.) in their UI components to make sure Playwright tests remain decoupled from style changes.
- **Chrome Extension Comment Hook Verification**: The verification of `// TODO: V2 Chrome Extension Hook` relies on regex-based string matching over specified files.

---

## 6. Conclusion
A rigorous 82-test case E2E plan has been detailed, covering direct feature validation, edge boundaries, feature combinations, and end-to-end user journeys. Implementing this structure in Playwright provides a complete requirements-driven framework that guarantees the LinkedIn Profile Rebuilder SaaS meets its acceptance criteria for Milestone 5.

---

## 7. Verification Method
To verify that this E2E test suite plan satisfies instructions:
1. Open the file `c:\Users\Abraão\Desktop\projeto-vendas-cvs-linkedin\.agents\teamwork_preview_explorer_design\handoff.md` and check:
   - Contains all 5 Handoff Protocol sections.
   - Identifies $N = 7$ core features.
   - Lists exactly 82 distinct test cases distributed across:
     - Tier 1: 35 tests (5 per feature)
     - Tier 2: 35 tests (5 per feature)
     - Tier 3: 7 tests
     - Tier 4: 5 tests
   - Each test contains detailed Descriptions, Inputs, and Expected Outputs.
   - Recommends Playwright + Firebase Emulator configuration structure.
