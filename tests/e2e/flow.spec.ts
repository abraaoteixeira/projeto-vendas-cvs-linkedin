import { test, expect } from '@playwright/test';
import path from 'path';

test('Full flow from CV upload to Dashboard', async ({ page }) => {
  // Aumenta o timeout para 180s devido às chamadas de IA da NVIDIA
  test.setTimeout(180000);
  const screenshotDir = 'C:\\Users\\Abraão\\.gemini\\antigravity\\brain\\69c67b49-d300-41dc-aeb5-3d99087bbabd';
  
  // 1. Open home page
  await page.goto('http://localhost:3000');
  await page.screenshot({ path: path.join(screenshotDir, 'home.png') });
  
  // Navigate to upload page
  await page.click('#hero-cta-primary');
  await page.waitForURL('**/upload');
  
  // 2. Upload the CV
  await page.screenshot({ path: path.join(screenshotDir, 'upload.png') });
  const filePath = 'C:\\Users\\Abraão\\Desktop\\projeto-vendas-cvs-linkedin\\abraao_cv.pdf';
  await page.setInputFiles('#cv-file-input', filePath);
  
  // 3. Loading page
  await page.waitForURL('**/loading?cvId=*', { timeout: 15000 });
  await page.screenshot({ path: path.join(screenshotDir, 'loading.png') });

  // Click continue button once loading is done
  const continueBtn = page.locator('[data-testid="continue-to-select-role"]');
  await continueBtn.waitFor({ state: 'visible', timeout: 30000 });
  await page.screenshot({ path: path.join(screenshotDir, 'loading-ready.png') });
  await continueBtn.click({ force: true });
  
  // 4. Select role page
  await page.waitForURL('**/select-role?cvId=*', { timeout: 30000 });
  // Wait for the roles list to render (the skeleton loader disappears and buttons are rendered)
  await page.waitForSelector('.grid.grid-cols-1.gap-4.mb-6 button', { timeout: 15000 });
  await page.screenshot({ path: path.join(screenshotDir, 'select-role.png') });
  
  // Click first dynamic role
  const firstRole = page.locator('.grid.grid-cols-1.gap-4.mb-6 button').first();
  await firstRole.click();
  
  // Click Continue
  await page.click('button:has-text("Continuar")');
  
  // 5. Mockup page
  await page.waitForURL('**/mockup?cvId=*', { timeout: 90000 });
  await page.waitForSelector('[data-testid="paywall-unlock"]', { timeout: 30000 });
  await page.screenshot({ path: path.join(screenshotDir, 'mockup.png') });
  
  // 6. Click 'Desbloquear Perfil'
  await page.click('[data-testid="paywall-unlock"]');
  
  // Wait for paywall modal
  await page.waitForSelector('[data-testid="paywall-modal"]', { timeout: 5000 });
  await page.screenshot({ path: path.join(screenshotDir, 'paywall.png') });
  
  // 7. Click 'Garantir Acesso Completo' on the paywall modal
  await page.click('[data-testid="paywall-checkout-btn"]');
  
  // 8. Verify Dashboard page
  await page.waitForURL('**/dashboard?cvId=*', { timeout: 15000 });
  await page.waitForSelector('button:has-text("Copiar")', { timeout: 15000 });
  await page.screenshot({ path: path.join(screenshotDir, 'dashboard.png') });
  
  // Verify that copy buttons are visible
  const copyButtons = page.locator('button:has-text("Copiar")');
  await expect(copyButtons.first()).toBeVisible();
});
