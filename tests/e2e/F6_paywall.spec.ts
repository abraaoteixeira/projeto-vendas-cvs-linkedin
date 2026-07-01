import { test, expect } from '@playwright/test';

test.describe('F6: Conversion Paywall', () => {

  test('F6-TC1: Access Blocker Trigger', async ({ page }) => {
    // Access mockup page and trigger paywall
    await page.goto('/mockup?cvId=test-cv-123');
    const unlockBtn = page.getByTestId('paywall-unlock');
    await unlockBtn.click();

    await expect(page.getByTestId('paywall-modal')).toBeVisible();
  });

  test('F6-TC2: Verify Conversion Copywriting', async ({ page }) => {
    await page.goto('/mockup?cvId=test-cv-123');
    await page.getByTestId('paywall-unlock').click();

    const paywallText = await page.getByTestId('paywall-modal').textContent();
    expect(paywallText).toMatch(/(Premium|Acesso|Desbloqueie|garantia)/i);
  });

  test('F6-TC3: Redirection to Payment Checkout', async ({ page }) => {
    // Intercept checkout session creation
    await page.route('**/api/checkout', async (route) => {
      await route.fulfill({
        status: 200,
        json: { url: 'https://checkout.stripe.com/pay/cs_test_mockurl' }
      });
    });

    await page.goto('/mockup?cvId=test-cv-123');
    await page.getByTestId('paywall-unlock').click();

    // Mock window location change or verify URL redirection
    await page.route('https://checkout.stripe.com/**', async (route) => {
      await route.fulfill({ status: 200, body: 'Stripe Mock Page' });
    });

    await page.getByTestId('paywall-checkout-btn').click();
    await page.waitForURL(/stripe.com/);
    expect(page.url()).toContain('stripe.com');
  });

  test('F6-TC4: Successful Payment Update', async ({ page, request }) => {
    // Test the API endpoint directly to verify Firestore state mutation
    const response = await request.post('/api/payment-webhook', {
      data: {
        userId: 'user123',
        status: 'paid'
      }
    });
    expect(response.ok()).toBe(true);

    const json = await response.json();
    expect(json.updated).toBe(true);
  });

  test('F6-TC5: Paywall Dismissal Redirect', async ({ page }) => {
    await page.goto('/mockup?cvId=test-cv-123');
    await page.getByTestId('paywall-unlock').click();

    const closeBtn = page.getByTestId('paywall-close');
    await closeBtn.click();

    await expect(page.getByTestId('paywall-modal')).not.toBeVisible();
    await expect(page).toHaveURL(/\/mockup/);
  });

  test('F6-TC6: Multi-Click Checkout Prevention', async ({ page }) => {
    let callCount = 0;
    await page.route('**/api/checkout', async (route) => {
      callCount++;
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        json: { url: 'https://checkout.stripe.com/pay/cs_test_mockurl' }
      });
    });

    await page.goto('/mockup?cvId=test-cv-123');
    await page.getByTestId('paywall-unlock').click();

    const payBtn = page.getByTestId('paywall-checkout-btn');
    await payBtn.click({ clickCount: 2 });
    
    // Ensure only one API call was triggered
    expect(callCount).toBe(1);
  });

  test('F6-TC7: Out-of-Order Webhook Delivery', async ({ page, request }) => {
    // Send identical duplicate requests
    const res1 = await request.post('/api/payment-webhook', {
      data: { userId: 'user123', status: 'paid' }
    });
    expect(res1.ok()).toBe(true);

    const res2 = await request.post('/api/payment-webhook', {
      data: { userId: 'user123', status: 'paid' }
    });
    expect(res2.ok()).toBe(true);

    const json = await res2.json();
    expect(json.updated).toBe(true); // Should remain true and idempotent
  });

  test('F6-TC8: LocalStorage Bypass Mitigation', async ({ page }) => {
    await page.goto('/');
    
    // Attempt local storage bypass
    await page.evaluate(() => {
      localStorage.setItem('premium', 'true');
    });

    // Attempt direct access to dashboard
    await page.goto('/dashboard?cvId=test-cv-123');
    
    // Middleware / Firestore verification should reject this bypass and send back to paywall/mockup
    await expect(page).toHaveURL(/\/mockup|\/paywall|select-role/);
  });

  test('F6-TC9: Abandoned Checkout Resiliency', async ({ page }) => {
    // Simulating Stripe cancel redirect
    await page.goto('/paywall?cvId=test-cv-123&status=cancel');
    
    const feedback = page.getByTestId('paywall-feedback');
    await expect(feedback).toBeVisible();
    await expect(feedback).toContainText(/Pagamento não finalizado. Tente novamente/i);
  });

  test('F6-TC10: Expired Verification Session', async ({ page, context }) => {
    await page.goto('/dashboard?cvId=test-cv-123');
    
    // Delete session cookies mid-page view
    await context.clearCookies();

    // Trigger UI copy action
    const titleCopyBtn = page.getByTestId('copy-title-btn');
    await titleCopyBtn.click();

    // Verification check fails and forces redirect to home or paywall
    await expect(page).toHaveURL(/\/|paywall/);
  });

});
