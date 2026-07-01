import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('F2: CV Upload & Storage Pipeline', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/upload');
  });

  test('F2-TC1: Successful PDF Upload', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByTestId('upload-input').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.join(__dirname, '../fixtures/cv_valid.pdf'));

    // Wait for the progress to finish and redirect to loading
    await expect(page).toHaveURL(/\/loading/);
  });

  test('F2-TC2: Rejection of Non-PDF Formats', async ({ page }) => {
    // Create a temporary mock non-pdf file
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByTestId('upload-input').click();
    const fileChooser = await fileChooserPromise;
    
    // We can use a mock path or relative file
    await fileChooser.setFiles({
      name: 'cv.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from('mock word file')
    });

    const errorMsg = page.getByTestId('upload-error');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText(/Format not supported. Please upload a PDF/i);
  });

  test('F2-TC3: Rejection of Oversized Files', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByTestId('upload-input').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.join(__dirname, '../fixtures/cv_too_large.pdf'));

    const errorMsg = page.getByTestId('upload-error');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText(/File too large/i);
  });

  test('F2-TC4: Upload Progress Bar', async ({ page }) => {
    // Enable offline/throttled network in context if needed
    // Intercept upload request to make it progress slowly
    await page.route('**/api/upload', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.fulfill({ status: 200, json: { id: 'test-cv-id' } });
    });

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByTestId('upload-input').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.join(__dirname, '../fixtures/cv_valid.pdf'));

    const progressBar = page.getByTestId('upload-progress');
    await expect(progressBar).toBeVisible();
  });

  test('F2-TC5: Cancel Upload Functionality', async ({ page }) => {
    // Mock upload to hang so we can cancel it
    await page.route('**/api/upload', async () => {
      // never resolve to simulate slow network
    });

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByTestId('upload-input').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.join(__dirname, '../fixtures/cv_valid.pdf'));

    const cancelButton = page.getByTestId('upload-cancel');
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();

    // Verify UI resets to drop-zone
    await expect(page.getByTestId('drop-zone')).toBeVisible();
  });

  test('F2-TC6: Empty File Upload', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByTestId('upload-input').click();
    const fileChooser = await fileChooserPromise;
    
    await fileChooser.setFiles({
      name: 'empty.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('')
    });

    const errorMsg = page.getByTestId('upload-error');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText(/empty/i);
  });

  test('F2-TC7: Special Characters File Name', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByTestId('upload-input').click();
    const fileChooser = await fileChooserPromise;
    
    await fileChooser.setFiles({
      name: 'Currículo_#2026_@Admin-Versão%.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 mock')
    });

    // Valid upload proceeds
    await expect(page).toHaveURL(/\/loading/);
  });

  test('F2-TC8: Masked Text File as PDF', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByTestId('upload-input').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.join(__dirname, '../fixtures/cv_corrupted.pdf'));

    const errorMsg = page.getByTestId('upload-error');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText(/(invalid|corrupted|could not parse)/i);
  });

  test('F2-TC9: Network Loss Mid-Upload', async ({ page, context }) => {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByTestId('upload-input').click();
    const fileChooser = await fileChooserPromise;

    // Trigger offline mode mid-upload
    await page.route('**/api/upload', async (route) => {
      await context.setOffline(true);
      await route.abort('failed');
    });

    await fileChooser.setFiles(path.join(__dirname, '../fixtures/cv_valid.pdf'));

    const errorMsg = page.getByTestId('upload-error');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText(/(connection lost|offline|failed)/i);

    // Clean up offline mode
    await context.setOffline(false);
  });

  test('F2-TC10: Encrypted PDF CV', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByTestId('upload-input').click();
    const fileChooser = await fileChooserPromise;
    
    await fileChooser.setFiles({
      name: 'encrypted_cv.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 encrypted content with /Encrypt')
    });

    const errorMsg = page.getByTestId('upload-error');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText(/(password|encrypted|protected)/i);
  });

});
