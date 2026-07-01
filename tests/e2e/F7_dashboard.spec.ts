import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('F7: Decoupled Copy-Paste Dashboard & API', () => {

  const mockProfileData = {
    novo_titulo_linkedin: "Senior Software Engineer",
    sobre_persuasivo: "Passionate developer with 10+ years experience in Node.js and TypeScript.",
    top_3_experiencias_reescritas: [
      "Led development of core cloud-native microservices.",
      "Optimized database queries, reducing response times by 40%.",
      "Mentored junior developers and introduced TDD practices."
    ]
  };

  test('F7-TC1: Premium User Dashboard Access', async ({ page }) => {
    // Mock user verification
    await page.route('**/api/profile-rebuild*', async (route) => {
      await route.fulfill({ status: 200, json: mockProfileData });
    });

    await page.goto('/dashboard?cvId=test-cv-123');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByTestId('copy-title-btn')).toBeVisible();
    await expect(page.getByTestId('copy-about-btn')).toBeVisible();
    await expect(page.getByTestId('copy-experiences-btn')).toBeVisible();
  });

  test('F7-TC2: Copy LinkedIn Title Widget', async ({ page }) => {
    await page.route('**/api/profile-rebuild*', async (route) => {
      await route.fulfill({ status: 200, json: mockProfileData });
    });

    await page.goto('/dashboard?cvId=test-cv-123');
    await page.getByTestId('copy-title-btn').click();

    // Verify clipboard content or toast message
    const toast = page.getByTestId('copy-toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/copiado/i);

    // Verify clipboard value
    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardContent).toBe(mockProfileData.novo_titulo_linkedin);
  });

  test('F7-TC3: Copy Bio and Experience Widgets', async ({ page }) => {
    await page.route('**/api/profile-rebuild*', async (route) => {
      await route.fulfill({ status: 200, json: mockProfileData });
    });

    await page.goto('/dashboard?cvId=test-cv-123');

    // Copy About
    await page.getByTestId('copy-about-btn').click();
    let toast = page.getByTestId('copy-toast');
    await expect(toast).toBeVisible();
    let clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardContent).toBe(mockProfileData.sobre_persuasivo);

    // Close toast if necessary, or click next
    await page.getByTestId('copy-experiences-btn').click();
    toast = page.getByTestId('copy-toast');
    await expect(toast).toBeVisible();
    clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardContent).toBe(mockProfileData.top_3_experiencias_reescritas.join('\n\n'));
  });

  test('F7-TC4: API Format Contract Check', async ({ request }) => {
    // Verify GET response matches the AI schema contracts
    const response = await request.get('/api/profile-rebuild?cvId=test-cv-123');
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('application/json');

    const json = await response.json();
    expect(json).toHaveProperty('novo_titulo_linkedin');
    expect(json).toHaveProperty('sobre_persuasivo');
    expect(json).toHaveProperty('top_3_experiencias_reescritas');
    expect(Array.isArray(json.top_3_experiencias_reescritas)).toBe(true);
  });

  test('F7-TC5: Decoupled Comments Check', async () => {
    // Read codebase to find the specific TODO hook comment
    const apiRoutePath = path.join(__dirname, '../../src/app/api/profile-rebuild/route.ts');
    
    let fileContent = '';
    if (fs.existsSync(apiRoutePath)) {
      fileContent = fs.readFileSync(apiRoutePath, 'utf8');
    } else {
      // Fallback: check if we can scan any source file or if we should skip/mock
      const appPagePath = path.join(__dirname, '../../src/app/page.tsx');
      if (fs.existsSync(appPagePath)) {
        fileContent = fs.readFileSync(appPagePath, 'utf8');
      }
    }
    
    expect(fileContent).toContain('// TODO: V2 Chrome Extension Hook');
  });

  test('F7-TC6: Fetching Data for Non-Existent User', async ({ request }) => {
    const response = await request.get('/api/profile-rebuild?cvId=user_does_not_exist');
    expect(response.status()).toBe(404);
    const json = await response.json();
    expect(json.error).toContain('User not found');
  });

  test('F7-TC7: Loading Under Massive Network Throttling', async ({ page }) => {
    // Intercept with high latency
    await page.route('**/api/profile-rebuild*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({ status: 200, json: mockProfileData });
    });

    await page.goto('/dashboard?cvId=test-cv-123');
    // Verify skeleton elements are visible before text loads
    await expect(page.getByTestId('dashboard-skeleton')).toBeVisible();
  });

  test('F7-TC8: Copy Fail Safe', async ({ page, context }) => {
    // Deny permission for clipboard read/write to force fallback logic
    await context.clearPermissions();
    
    await page.route('**/api/profile-rebuild*', async (route) => {
      await route.fulfill({ status: 200, json: mockProfileData });
    });

    await page.goto('/dashboard?cvId=test-cv-123');

    // Trigger copy
    await page.getByTestId('copy-title-btn').click();
    const toast = page.getByTestId('copy-toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/copiado/i);
  });

  test('F7-TC9: Missing Request Params on API', async ({ request }) => {
    const response = await request.get('/api/profile-rebuild');
    expect(response.status()).toBe(400);
    const json = await response.json();
    expect(json.error).toContain('userId is required');
  });

  test('F7-TC10: API Input Injection Attack', async ({ request }) => {
    const maliciousId = "';DROP TABLE profiles;--";
    const response = await request.get(`/api/profile-rebuild?cvId=${encodeURIComponent(maliciousId)}`);
    
    // API should sanitize inputs and either fail to find the user cleanly or return a standard error
    expect([400, 404]).toContain(response.status());
  });

});
