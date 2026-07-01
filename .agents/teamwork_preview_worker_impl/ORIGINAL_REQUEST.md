## 2026-06-28T22:50:55Z
You are the E2E Test Suite Implementer (teamwork_preview_worker).
Your working directory is c:\Users\Abraão\Desktop\projeto-vendas-cvs-linkedin\.agents\teamwork_preview_worker_impl\.
Your mission:
1. Read the TEST_INFRA.md file at the project root c:\Users\Abraão\Desktop\projeto-vendas-cvs-linkedin\TEST_INFRA.md.
2. Update c:\Users\Abraão\Desktop\projeto-vendas-cvs-linkedin\package.json:
   - Add "@playwright/test": "^1.43.0" to devDependencies.
   - Add a test script: `"test:e2e": "playwright test"` to scripts.
3. Run npm install (or yarn/pnpm if lockfile indicates otherwise; we have package-lock.json so use npm install) to install Playwright.
4. Run npx playwright install chromium to install the required browser binaries.
5. Create c:\Users\Abraão\Desktop\projeto-vendas-cvs-linkedin\playwright.config.ts with standard configuration as described in Section 4.3 of TEST_INFRA.md.
6. Create all 8 spec files under c:\Users\Abraão\Desktop\projeto-vendas-cvs-linkedin\tests\e2e\:
   - F1_landing.spec.ts (F1-TC1 to F1-TC10)
   - F2_upload.spec.ts (F2-TC1 to F2-TC10)
   - F3_loading.spec.ts (F3-TC1 to F3-TC10)
   - F4_role_selection.spec.ts (F4-TC1 to F4-TC10)
   - F5_mockup.spec.ts (F5-TC1 to F5-TC10)
   - F6_paywall.spec.ts (F6-TC1 to F6-TC10)
   - F7_dashboard.spec.ts (F7-TC1 to F7-TC10)
   - cross_scenarios.spec.ts (XF-TC1 to XF-TC7, and RW-TC1 to RW-TC5)
   Each test file should implement its 10/7/5 test cases as Playwright tests (`test('Name', async ({ page }) => { ... })`). Ensure the tests are fully implemented, verify appropriate page URLs (e.g. `await expect(page).toHaveURL('/upload')`), and target page elements using descriptive selectors (like `data-testid="upload-input"`, `data-testid="paywall-unlock"`, etc.).
7. Create mock fixtures under c:\Users\Abraão\Desktop\projeto-vendas-cvs-linkedin\tests\fixtures\:
   - cv_valid.pdf (a small mock PDF file, e.g. a 1KB text file containing `%PDF-1.4 ...`)
   - cv_too_large.pdf (a mock large PDF, or we can mock size validations in the test)
   - cv_corrupted.pdf (invalid file structure)
   - ai_mock_response.json (valid JSON with `novo_titulo_linkedin`, `sobre_persuasivo`, `top_3_experiencias_reescritas`)
8. Create helper c:\Users\Abraão\Desktop\projeto-vendas-cvs-linkedin\tests\helpers\db_cleaner.ts.
9. Verify the test suite runs and parses without syntax errors by running `npx playwright test --list`.
10. MANDATORY INTEGRITY WARNING: DO NOT CHEAT. All implementations must be genuine. Do not hardcode test results, create dummy/facade implementations, or circumvent the intended task.
11. Once done, write c:\Users\Abraão\Desktop\projeto-vendas-cvs-linkedin\.agents\teamwork_preview_worker_impl\handoff.md with your actions, files created, and test compilation check outputs. Then send a status message back to parent (cb7ed2d6-b1fc-459f-a54d-effec07117cc).
