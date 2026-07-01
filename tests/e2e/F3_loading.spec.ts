import { test, expect } from '@playwright/test';

test.describe('F3: Interactive Loading / Processing Screen', () => {

  test('F3-TC1: Route Transition', async ({ page }) => {
    await page.goto('/loading?cvId=test-cv-123');
    await expect(page).toHaveURL(/\/loading/);
    const spinner = page.getByTestId('loading-spinner');
    await expect(spinner).toBeVisible();
  });

  test('F3-TC2: Narrative Copy Rotation', async ({ page }) => {
    // We will stay on loading page and check the status text changes
    await page.goto('/loading?cvId=test-cv-123');
    const loadingText = page.getByTestId('loading-status-text');
    await expect(loadingText).toBeVisible();
    
    // First message
    const text1 = await loadingText.textContent();
    expect(text1).not.toBeNull();

    // Fast-forward or wait to see if it rotates messages
    await page.waitForTimeout(3000);
    const text2 = await loadingText.textContent();
    expect(text1).not.toEqual(text2);
  });

  test('F3-TC3: Real-Time State Synced with Firestore', async ({ page }) => {
    // Intercept Firestore status check endpoint or state endpoint
    let status = 'processing';
    await page.route('**/api/rebuild/status?cvId=test-cv-123', async (route) => {
      await route.fulfill({ status: 200, json: { status } });
    });

    await page.goto('/loading?cvId=test-cv-123');
    const loadingText = page.getByTestId('loading-status-text');
    await expect(loadingText).toContainText(/processando|lendo/i);

    // Change status
    status = 'reescrevendo';
    // wait for next poll
    await page.waitForTimeout(1100);
    await expect(loadingText).toContainText(/reescrevendo|experiências/i);
  });

  test('F3-TC4: Processing Error Handling', async ({ page }) => {
    await page.route('**/api/rebuild/status?cvId=test-cv-123', async (route) => {
      await route.fulfill({ status: 200, json: { status: 'failed' } });
    });

    await page.goto('/loading?cvId=test-cv-123');
    const errorMsg = page.getByTestId('processing-error');
    await expect(errorMsg).toBeVisible();
    await expect(page.getByTestId('retry-button')).toBeVisible();
  });

  test('F3-TC5: Interactive Animation Stability', async ({ page }) => {
    await page.goto('/loading?cvId=test-cv-123');
    const spinner = page.getByTestId('loading-spinner');
    await expect(spinner).toBeVisible();
    // Verify it contains standard animations classes (e.g. animate-spin)
    const className = await spinner.getAttribute('class');
    expect(className).toContain('animate-spin');
  });

  test('F3-TC6: Firebase Latency Timeout', async ({ page }) => {
    // Lock response for 2 seconds (simulating delay in test)
    await page.route('**/api/rebuild/status?cvId=test-cv-123', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({ status: 200, json: { status: 'processing' } });
    });

    await page.goto('/loading?cvId=test-cv-123');
    const warning = page.getByTestId('loading-latency-warning');
    // After timeout, it should show latency warning
    await page.waitForTimeout(2500);
    await expect(warning).toBeVisible();
    await expect(warning).toContainText(/demorar mais do que o comum/i);
  });

  test('F3-TC7: Tab Reload Persistence', async ({ page }) => {
    await page.goto('/loading?cvId=test-cv-123');
    await page.reload();
    await expect(page).toHaveURL(/\/loading/);
    await expect(page.getByTestId('loading-spinner')).toBeVisible();
  });

  test('F3-TC8: Polling Disconnect Recovery', async ({ page, context }) => {
    let callCount = 0;
    await page.route('**/api/rebuild/status?cvId=test-cv-123', async (route) => {
      callCount++;
      if (callCount === 2) {
        await context.setOffline(true);
        await route.abort('failed');
      } else {
        await route.fulfill({ status: 200, json: { status: 'processing' } });
      }
    });

    await page.goto('/loading?cvId=test-cv-123');
    await page.waitForTimeout(1000);
    
    // Go online again
    await context.setOffline(false);
    // Polling should resume
    await page.waitForTimeout(2000);
    await expect(page.getByTestId('loading-spinner')).toBeVisible();
  });

  test('F3-TC9: Malformed State Payload handling', async ({ page }) => {
    await page.route('**/api/rebuild/status?cvId=test-cv-123', async (route) => {
      await route.fulfill({ status: 200, json: { status: 'invalid_status' } });
    });

    await page.goto('/loading?cvId=test-cv-123');
    // Should fallback to default loading message and not crash
    await expect(page.getByTestId('loading-spinner')).toBeVisible();
  });

  test('F3-TC10: Ultra-Fast Backend Execution', async ({ page }) => {
    const startTime = Date.now();
    await page.route('**/api/rebuild/status?cvId=test-cv-123', async (route) => {
      await route.fulfill({ status: 200, json: { status: 'processed' } });
    });

    await page.goto('/loading?cvId=test-cv-123');
    
    // Wait for redirection to select-role
    await expect(page).toHaveURL(/\/select-role/);
    const duration = Date.now() - startTime;
    // Minimum UX delay should be 1500ms
    expect(duration).toBeGreaterThanOrEqual(1400); 
  });

});
