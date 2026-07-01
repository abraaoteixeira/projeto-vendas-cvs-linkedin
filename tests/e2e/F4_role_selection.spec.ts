import { test, expect } from '@playwright/test';

test.describe('F4: Target Job/Role Selection', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/select-role?cvId=test-cv-123');
  });

  test('F4-TC1: Redirect on Completion', async ({ page }) => {
    // This is verified during loading spec transition, but let's confirm page loads correctly
    await expect(page).toHaveURL(/\/select-role/);
    await expect(page.getByTestId('continue-button')).toBeVisible();
  });

  test('F4-TC2: Custom Job Entry', async ({ page }) => {
    // Select "Outro"
    const outroCard = page.getByTestId('role-card-outro');
    await outroCard.click();

    const inputField = page.getByTestId('custom-role-input');
    await expect(inputField).toBeVisible();
    await inputField.fill('Senior Reliability Engineer');

    // Intercept submit
    await page.route('**/api/rebuild/select-role', async (route) => {
      expect(route.request().postDataJSON()).toEqual({
        cvId: 'test-cv-123',
        role: 'Senior Reliability Engineer'
      });
      await route.fulfill({ status: 200, json: { success: true } });
    });

    await page.getByTestId('continue-button').click();
    await expect(page).toHaveURL(/\/mockup/);
  });

  test('F4-TC3: Selection Grid Interaction', async ({ page }) => {
    const fullstackCard = page.getByTestId('role-card-fullstack');
    const continueBtn = page.getByTestId('continue-button');

    // Click full stack card
    await fullstackCard.click();
    
    // Check for visual selection class or attribute
    await expect(fullstackCard).toHaveAttribute('data-selected', 'true');
    await expect(continueBtn).toBeEnabled();
  });

  test('F4-TC4: Validation Check', async ({ page }) => {
    const continueBtn = page.getByTestId('continue-button');
    // Click when no role is active
    await continueBtn.click();

    const toast = page.getByTestId('error-toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/Por favor, selecione um cargo/i);
  });

  test('F4-TC5: Back Navigation Reset', async ({ page }) => {
    const backBtn = page.getByTestId('back-button');
    await backBtn.click();
    await expect(page).toHaveURL(/\/upload/);
  });

  test('F4-TC6: Overflow Length Custom Input', async ({ page }) => {
    // Select "Outro"
    await page.getByTestId('role-card-outro').click();

    const inputField = page.getByTestId('custom-role-input');
    const longText = 'A'.repeat(1000);
    await inputField.fill(longText);

    // Assert that the input was truncated to 100 characters
    const val = await inputField.inputValue();
    expect(val.length).toBe(100);

    const counter = page.getByTestId('char-counter');
    await expect(counter).toContainText('100/100');
  });

  test('F4-TC7: HTML/JS Injection (XSS Check)', async ({ page }) => {
    await page.getByTestId('role-card-outro').click();
    
    const inputField = page.getByTestId('custom-role-input');
    const maliciousPayload = "<script>alert('XSS')</script>";
    await inputField.fill(maliciousPayload);

    // Mock API to return the payload verbatim to see if it gets executed or sanitized
    await page.route('**/api/rebuild/select-role', async (route) => {
      await route.fulfill({ status: 200, json: { success: true } });
    });
    
    await page.route('**/api/profile-rebuild*', async (route) => {
      await route.fulfill({ 
        status: 200, 
        json: { 
          novo_titulo_linkedin: maliciousPayload,
          sobre_persuasivo: 'Bio',
          top_3_experiencias_reescritas: []
        } 
      });
    });

    await page.getByTestId('continue-button').click();
    await expect(page).toHaveURL(/\/mockup/);

    // Check that title element displays text as plain string
    const titleElement = page.getByTestId('mockup-headline');
    await expect(titleElement).toBeVisible();
    
    // In playwright, textContent returns the raw unescaped string, 
    // but the page DOM should have escaped it or put it in a text node
    expect(await titleElement.textContent()).toBe(maliciousPayload);
  });

  test('F4-TC8: Concurrent Choice Clicking', async ({ page }) => {
    const fullstack = page.getByTestId('role-card-fullstack');
    const outro = page.getByTestId('role-card-outro');
    const pm = page.getByTestId('role-card-productmanager');

    await fullstack.click();
    await outro.click();
    await pm.click();

    await expect(pm).toHaveAttribute('data-selected', 'true');
    await expect(fullstack).not.toHaveAttribute('data-selected', 'true');
    await expect(outro).not.toHaveAttribute('data-selected', 'true');
  });

  test('F4-TC9: Selection Persistence Across Refreshes', async ({ page }) => {
    const fullstack = page.getByTestId('role-card-fullstack');
    await fullstack.click();
    
    await page.reload();
    // Assuming choice is cached in sessionStorage or database, it should still be selected
    await expect(page.getByTestId('role-card-fullstack')).toHaveAttribute('data-selected', 'true');
  });

  test('F4-TC10: Accessible Keyboard Interaction', async ({ page }) => {
    // Focus first element on selection page
    await page.keyboard.press('Tab');
    
    // Tab through to select card using space or enter
    let isSelected = false;
    for (let i = 0; i < 10; i++) {
      const activeElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      if (activeElement === 'role-card-fullstack') {
        await page.keyboard.press('Enter');
        isSelected = true;
        break;
      }
      await page.keyboard.press('Tab');
    }
    expect(isSelected).toBe(true);
    await expect(page.getByTestId('role-card-fullstack')).toHaveAttribute('data-selected', 'true');
  });

});
