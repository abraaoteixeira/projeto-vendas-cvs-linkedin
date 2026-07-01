## 2026-06-29T04:24:27Z
You are the Lead Developer. Your mission is to implement all missing and partially implemented features of the LinkedIn Profile Rebuilder SaaS MVP, integrate Firebase and the AI model, and ensure 100% of the Playwright E2E tests pass.

Please read the following documents to guide your implementation:
1. Detailed Scan Report: c:\Users\Abraão\Desktop\projeto-vendas-cvs-linkedin\.agents\codebase_scanner\codebase_scan_report.md
2. Project Plan: c:\Users\Abraão\Desktop\projeto-vendas-cvs-linkedin\.agents\orchestrator\plan.md
3. Master Prompt: c:\Users\Abraão\Desktop\projeto-vendas-cvs-linkedin\prompt_mestre.md
4. Copywriting: c:\Users\Abraão\Desktop\projeto-vendas-cvs-linkedin\copy_e_growth.md

Tasks to perform:
1. Create a custom 404 page at 'src/app/not-found.tsx' with 'data-testid="404-title"' and 'data-testid="404-back-link"'.
2. Create the job selection page at 'src/app/select-role/page.tsx' with full selection grids, custom input option ('Outro') with 100 character limit and counter, back/continue buttons, toast error feedbacks, data-selected attributes, focus/accessibility support, and API calls.
3. Update all existing App Router pages and components ('src/app/page.tsx', 'src/app/upload/page.tsx', 'src/app/loading/page.tsx', 'src/app/mockup/page.tsx', 'src/app/paywall/page.tsx', 'src/app/dashboard/page.tsx', 'src/components/LinkedInMockup.tsx') to include all missing 'data-testid' selectors and logic, including:
   - Handling actual file uploads to Storage, storing path in Firestore, updating user document status ('uploaded' -> 'processing' -> 'reescrevendo' -> 'processed' -> 'failed').
   - Visual progress and cancellation during upload.
   - Status polling in '/loading' and minimal UX duration of 1500ms before redirecting to '/select-role'.
   - Saving uploaded photos in sessionStorage as 'profilePhoto' and 'bannerPhoto' and displaying them in the mockup.
   - Paywall overlay modal on the Mockup page itself (instead of a separate page) with copywriting content and Stripe checkout redirect.
   - Dashboard page checking payment status and copying individual title/bio/experience blocks (experiences copy should join experiences by '\n\n') and showing a toast.
4. Implement all missing and mock API routes in 'src/app/api/':
   - 'POST /api/upload': extracts PDF text (add 'pdf-parse' package to dependencies if necessary, or implement a reliable PDF extraction function. Make sure to gracefully handle corrupted, empty, or encrypted PDFs and return appropriate error messages so the frontend displays them under 'data-testid="upload-error"').
   - 'GET /api/rebuild/status?cvId=...': returns document status.
   - 'POST /api/rebuild/select-role': receives role and cvId, and triggers the AI profile rebuild.
   - 'GET /api/profile-rebuild?cvId=...': returns the reconstructed profile JSON structure. Must include comment '// TODO: V2 Chrome Extension Hook' at the top of the file!
   - 'POST /api/checkout': creates checkout session URL.
   - 'POST /api/payment-webhook': updates Firestore user status to 'paid' (must be idempotent and support out-of-order/duplicate requests).
5. AI Model Integration:
   - Integrate OpenAI or Gemini API call in the backend, passing prompt_mestre.md context and the parsed CV text.
   - To support local/offline execution and network-restricted testing, implement a high-quality local fallback inside the API route. If keys are missing or the network call fails, generate a mock reconstructed profile derived from the CV text and selected target role.
6. Verify your implementation by starting the Firebase local emulators (Firestore + Storage) and Next.js server, and running the E2E Playwright tests using 'npx playwright test'.
7. Make sure all 82 test cases across 4 configurations (Chromium, Firefox, WebKit, Mobile) pass with exit code 0.
8. Document all implemented changes, files, and verification test outputs in a handoff report at 'c:\Users\Abraão\Desktop\projeto-vendas-cvs-linkedin\.agents\worker\handoff.md'.
