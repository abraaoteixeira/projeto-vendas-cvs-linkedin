import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Cross-Feature & Real-World Scenarios', () => {

  const mockProfileData = {
    novo_titulo_linkedin: "Gerente de Projetos Senior",
    sobre_persuasivo: "Profissional experiente em gestão ágil.",
    top_3_experiencias_reescritas: [
      "Experiência 1",
      "Experiência 2",
      "Experiência 3"
    ],
    original_cv_text: "Original CV content..."
  };

  // ==========================================
  // Tier 3: Cross-Feature Combinations (XF)
  // ==========================================

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));
  });

  test('XF-TC1: Seamless Sequential Funnel (LP -> Upload -> Loading -> Selection -> Mockup)', async ({ page }) => {
    // 1. Landing Page
    await page.goto('/');
    await page.getByTestId('cta-button').click();
    await expect(page).toHaveURL(/\/upload/);

    // 2. Upload Page
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByTestId('upload-input').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.join(__dirname, '../fixtures/cv_valid.pdf'));

    // 3. Transition to Loading
    await expect(page).toHaveURL(/\/loading/);

    // Mock status transition to processed
    await page.route('**/api/rebuild/status*', async (route) => {
      await route.fulfill({ status: 200, json: { status: 'processed' } });
    });

    // 4. Role Selection Page
    await expect(page).toHaveURL(/\/select-role/);
    
    // Select role
    await page.getByTestId('role-card-outro').click();
    await page.getByTestId('custom-role-input').fill('Tech Lead');

    await page.route('**/api/rebuild/select-role', async (route) => {
      await route.fulfill({ status: 200, json: { success: true } });
    });

    await page.route('**/api/profile-rebuild*', async (route) => {
      await route.fulfill({ status: 200, json: { ...mockProfileData, novo_titulo_linkedin: 'Tech Lead' } });
    });

    // 5. Mockup Page
    await page.getByTestId('continue-button').click();
    await expect(page).toHaveURL(/\/mockup/);
    await expect(page.getByTestId('mockup-headline')).toContainText('Tech Lead');
  });

  test('XF-TC2: Purchase Validation and Mockup-to-Dashboard Unlock', async ({ page }) => {
    await page.route('**/api/profile-rebuild*', async (route) => {
      await route.fulfill({ status: 200, json: mockProfileData });
    });

    // Go to mockup, click unlock
    await page.goto('/mockup?cvId=test-cv-123');
    await page.getByTestId('paywall-unlock').click();
    await expect(page.getByTestId('paywall-modal')).toBeVisible();

    // Mock successful checkout redirection
    await page.route('**/api/checkout', async (route) => {
      await route.fulfill({ status: 200, json: { url: 'https://checkout.stripe.com/pay/mock' } });
    });
    
    // Simulate webhook payment confirmation in database
    await page.route('https://checkout.stripe.com/**', async (route) => {
      // Simulate webhook trigger while user is navigating
      await page.request.post('/api/payment-webhook', {
        data: { userId: 'user123', status: 'paid' }
      });
      await route.fulfill({ status: 200, body: 'Checkout Success' });
    });

    await page.getByTestId('paywall-checkout-btn').click();
    
    // After payment, user gets routed to dashboard
    await page.goto('/dashboard?cvId=test-cv-123');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByTestId('copy-title-btn')).toBeEnabled();
  });

  test('XF-TC3: Multi-Process Abort (Loading to Re-upload)', async ({ page }) => {
    // Start processing session 1
    await page.goto('/loading?cvId=first-cv-123');
    await expect(page.getByTestId('loading-spinner')).toBeVisible();

    // Click back to abort
    await page.goto('/upload');
    await expect(page.getByTestId('drop-zone')).toBeVisible();

    // Upload different CV
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByTestId('upload-input').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.join(__dirname, '../fixtures/cv_valid.pdf'));

    // Loading should track the new ID
    await expect(page).toHaveURL(/\/loading\?cvId=/);
    const newUrl = page.url();
    expect(newUrl).not.toContain('first-cv-123');
  });

  test('XF-TC4: Interactive Mockup Regenerative Loop', async ({ page }) => {
    let currentRole = 'Product Manager';
    await page.route('**/api/profile-rebuild*', async (route) => {
      await route.fulfill({ 
        status: 200, 
        json: { ...mockProfileData, novo_titulo_linkedin: currentRole } 
      });
    });

    await page.goto('/mockup?cvId=test-cv-123');
    await expect(page.getByTestId('mockup-headline')).toContainText('Product Manager');

    // Click alter role
    await page.getByTestId('alter-role-btn').click();
    await expect(page).toHaveURL(/\/select-role/);

    // Update role choice
    await page.getByTestId('role-card-outro').click();
    await page.getByTestId('custom-role-input').fill('Product Designer');
    currentRole = 'Product Designer';

    await page.route('**/api/rebuild/select-role', async (route) => {
      await route.fulfill({ status: 200, json: { success: true } });
    });

    await page.getByTestId('continue-button').click();
    
    // UI displays skeleton and then re-renders updated mockup
    await expect(page).toHaveURL(/\/mockup/);
    await expect(page.getByTestId('mockup-headline')).toContainText('Product Designer');
  });

  test('XF-TC5: Decoupled API Integration (Simulation of Chrome Extension Context)', async ({ request }) => {
    // 1. Confirm client gets 200 OK and valid JSON
    const response = await request.get('/api/profile-rebuild?cvId=test-cv-123');
    expect(response.ok()).toBe(true);
    const json = await response.json();
    expect(json).toHaveProperty('novo_titulo_linkedin');
    expect(json).toHaveProperty('sobre_persuasivo');
    expect(json).toHaveProperty('top_3_experiencias_reescritas');
  });

  test('XF-TC6: Recovery from Upload Failures during Interactive State', async ({ page }) => {
    await page.route('**/api/rebuild/status*', async (route) => {
      await route.fulfill({ status: 200, json: { status: 'failed' } });
    });

    await page.goto('/loading?cvId=test-cv-123');
    
    const retryBtn = page.getByTestId('retry-button');
    await expect(retryBtn).toBeVisible();
    await retryBtn.click();

    await expect(page).toHaveURL(/\/upload/);
    await expect(page.getByTestId('drop-zone')).toBeVisible();
  });

  test('XF-TC7: State-Aware Landing Page routing', async ({ page }) => {
    await page.goto('/');
    
    // Simulate user with already processed profile cached in sessionStorage/cookies
    await page.evaluate(() => {
      sessionStorage.setItem('activeCvId', 'processed-cv-456');
    });

    await page.getByTestId('cta-button').click();
    // Directly routes to mockup or select-role instead of upload page
    await expect(page).toHaveURL(/\/mockup|\/select-role/);
  });

  // ==========================================
  // Tier 4: Real-World Scenarios (RW)
  // ==========================================

  test('RW-TC1: Complete Premium Conversion Journey', async ({ page, request }) => {
    // 1. Navigate to `/` and click CTA
    await page.goto('/');
    await page.getByTestId('cta-button').click();
    await expect(page).toHaveURL(/\/upload/);

    // 2. Upload valid CV
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByTestId('upload-input').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.join(__dirname, '../fixtures/cv_valid.pdf'));
    await expect(page).toHaveURL(/\/loading/);

    // 3. Track processing on `/loading`
    await page.route('**/api/rebuild/status*', async (route) => {
      await route.fulfill({ status: 200, json: { status: 'processed' } });
    });
    await expect(page).toHaveURL(/\/select-role/);

    // 4. Select role "Gerente de Projetos"
    await page.getByTestId('role-card-outro').click();
    await page.getByTestId('custom-role-input').fill('Gerente de Projetos');

    await page.route('**/api/rebuild/select-role', async (route) => {
      await route.fulfill({ status: 200, json: { success: true } });
    });

    await page.route('**/api/profile-rebuild*', async (route) => {
      await route.fulfill({ status: 200, json: { ...mockProfileData, novo_titulo_linkedin: 'Gerente de Projetos' } });
    });

    await page.getByTestId('continue-button').click();
    await expect(page).toHaveURL(/\/mockup/);

    // 5. Review Mockup at `/mockup`
    await expect(page.getByTestId('mockup-headline')).toContainText('Gerente de Projetos');

    // 6. Click unlock, proceed to payment
    await page.getByTestId('paywall-unlock').click();
    await expect(page.getByTestId('paywall-modal')).toBeVisible();

    await page.route('**/api/checkout', async (route) => {
      await route.fulfill({ status: 200, json: { url: 'https://checkout.stripe.com/pay/mock' } });
    });

    await page.route('https://checkout.stripe.com/**', async (route) => {
      // 7. Webhook registers payment status change
      await request.post('/api/payment-webhook', {
        data: { userId: 'user123', status: 'paid' }
      });
      await route.fulfill({ status: 200, body: 'Success' });
    });

    await page.getByTestId('paywall-checkout-btn').click();

    // 8. Open dashboard and click copy
    await page.goto('/dashboard?cvId=test-cv-123');
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByTestId('copy-title-btn').click();
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('Gerente de Projetos');
  });

  test('RW-TC2: User Upload Fail and Free Funnel Exit', async ({ page }) => {
    // 1. Drag and drop invalid corrupted file
    await page.goto('/upload');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByTestId('upload-input').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.join(__dirname, '../fixtures/cv_corrupted.pdf'));

    // 2. Verify error message
    const errorMsg = page.getByTestId('upload-error');
    await expect(errorMsg).toBeVisible();

    // 3. Drag and drop valid PDF file
    const fileChooserPromise2 = page.waitForEvent('filechooser');
    await page.getByTestId('upload-input').click();
    const fileChooser2 = await fileChooserPromise2;
    await fileChooser2.setFiles(path.join(__dirname, '../fixtures/cv_valid.pdf'));
    await expect(page).toHaveURL(/\/loading/);

    // 4. Proceed through loading and role selection
    await page.route('**/api/rebuild/status*', async (route) => {
      await route.fulfill({ status: 200, json: { status: 'processed' } });
    });
    await expect(page).toHaveURL(/\/select-role/);

    await page.getByTestId('role-card-outro').click();
    await page.getByTestId('custom-role-input').fill('Analista de Growth Marketing');

    await page.route('**/api/rebuild/select-role', async (route) => {
      await route.fulfill({ status: 200, json: { success: true } });
    });

    await page.route('**/api/profile-rebuild*', async (route) => {
      await route.fulfill({ status: 200, json: { ...mockProfileData, novo_titulo_linkedin: 'Analista de Growth Marketing' } });
    });

    await page.getByTestId('continue-button').click();
    await expect(page).toHaveURL(/\/mockup/);

    // 5. Reach paywall overlay
    await page.getByTestId('paywall-unlock').click();
    await expect(page.getByTestId('paywall-modal')).toBeVisible();

    // 6. Decline payment and close browser tab (we verify closing paywall returns user to mockup page)
    await page.getByTestId('paywall-close').click();
    await expect(page.getByTestId('paywall-modal')).not.toBeVisible();
    await expect(page).toHaveURL(/\/mockup/);
  });

  test('RW-TC3: Mobile Conversion Workflow', async ({ page }) => {
    // 1. Initialize mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    // 2. Perform entire funnel
    await page.getByTestId('cta-button').click();
    await expect(page).toHaveURL(/\/upload/);

    // Upload file
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByTestId('upload-input').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.join(__dirname, '../fixtures/cv_valid.pdf'));
    await expect(page).toHaveURL(/\/loading/);

    // Mock fast processing
    await page.route('**/api/rebuild/status*', async (route) => {
      await route.fulfill({ status: 200, json: { status: 'processed' } });
    });
    await expect(page).toHaveURL(/\/select-role/);

    // Select role
    await page.getByTestId('role-card-fullstack').click();

    await page.route('**/api/rebuild/select-role', async (route) => {
      await route.fulfill({ status: 200, json: { success: true } });
    });

    await page.route('**/api/profile-rebuild*', async (route) => {
      await route.fulfill({ status: 200, json: { ...mockProfileData, novo_titulo_linkedin: 'Fullstack Dev' } });
    });

    await page.getByTestId('continue-button').click();
    await expect(page).toHaveURL(/\/mockup/);

    // Open paywall, trigger checkout click
    await page.getByTestId('paywall-unlock').click();
    await expect(page.getByTestId('paywall-modal')).toBeVisible();

    await page.route('**/api/checkout', async (route) => {
      await route.fulfill({ status: 200, json: { url: 'https://checkout.stripe.com/pay/mock' } });
    });

    await page.route('https://checkout.stripe.com/**', async (route) => {
      await route.fulfill({ status: 200, body: 'Success' });
    });
    
    await page.getByTestId('paywall-checkout-btn').click();

    // Verify dashboard renders cleanly on mobile viewport
    await page.goto('/dashboard?cvId=test-cv-123');
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Tap-to-copy trigger
    await page.getByTestId('copy-title-btn').click();
    const toast = page.getByTestId('copy-toast');
    await expect(toast).toBeVisible();
    
    const clipboardVal = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardVal).toBe('Fullstack Dev');
  });

  test('RW-TC4: Chrome Extension decoupled API Integration', async ({ request }) => {
    // 1. Query api with premium session / userId
    const response = await request.get('/api/profile-rebuild?cvId=test-cv-123');
    expect(response.status()).toBe(200);

    const json = await response.json();
    expect(json).toHaveProperty('novo_titulo_linkedin');
    expect(json).toHaveProperty('sobre_persuasivo');
    expect(json).toHaveProperty('top_3_experiencias_reescritas');
  });

  test('RW-TC5: System Concurrent Load Stress', async ({ request }) => {
    // Send 10 concurrent requests to simulate concurrent load
    const uploadPromises = Array.from({ length: 10 }).map((_, index) => {
      return request.post('/api/upload', {
        headers: {
          'Content-Type': 'application/pdf',
          'X-User-Session': `session-user-${index}`
        },
        data: Buffer.from('%PDF-1.4 mock cv upload')
      });
    });

    const results = await Promise.all(uploadPromises);
    
    // Verify all requests are accepted and return 200 or 201 OK
    for (const res of results) {
      expect([200, 201]).toContain(res.status());
      const data = await res.json();
      expect(data).toHaveProperty('id');
    }
  });

});
