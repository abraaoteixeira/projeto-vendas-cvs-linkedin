import { test, expect } from '@playwright/test';

test.describe('F5: Interactive LinkedIn Mockup Visualization', () => {

  const mockProfileData = {
    novo_titulo_linkedin: "Senior Software Engineer",
    sobre_persuasivo: "Passionate developer with 10+ years experience in Node.js and TypeScript.",
    top_3_experiencias_reescritas: [
      "Led development of core cloud-native microservices.",
      "Optimized database queries, reducing response times by 40%.",
      "Mentored junior developers and introduced TDD practices."
    ],
    original_cv_text: "Original CV: John Doe, Dev for 10 years, worked at Company A and B."
  };

  test('F5-TC1: Layout Structural Verification', async ({ page }) => {
    // Inject mock API data
    await page.route('**/api/profile-rebuild?cvId=test-cv-123', async (route) => {
      await route.fulfill({ status: 200, json: mockProfileData });
    });

    await page.goto('/mockup?cvId=test-cv-123');

    await expect(page.getByTestId('mockup-banner')).toBeVisible();
    await expect(page.getByTestId('mockup-avatar')).toBeVisible();
    await expect(page.getByTestId('mockup-headline')).toBeVisible();
    await expect(page.getByTestId('mockup-about')).toBeVisible();
    await expect(page.getByTestId('mockup-experience-list')).toBeVisible();
  });

  test('F5-TC2: Dynamic Props Propagation', async ({ page }) => {
    await page.route('**/api/profile-rebuild?cvId=test-cv-123', async (route) => {
      await route.fulfill({ status: 200, json: mockProfileData });
    });

    await page.goto('/mockup?cvId=test-cv-123');

    await expect(page.getByTestId('mockup-headline')).toContainText(mockProfileData.novo_titulo_linkedin);
    await expect(page.getByTestId('mockup-about')).toContainText(mockProfileData.sobre_persuasivo);
    
    const items = page.getByTestId('mockup-experience-item');
    await expect(items).toHaveCount(3);
    await expect(items.first()).toContainText(mockProfileData.top_3_experiencias_reescritas[0]);
  });

  test('F5-TC3: Responsiveness of Profile elements', async ({ page }) => {
    await page.route('**/api/profile-rebuild?cvId=test-cv-123', async (route) => {
      await route.fulfill({ status: 200, json: mockProfileData });
    });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/mockup?cvId=test-cv-123');

    // Confirm avatar shrinks/re-aligns (e.g. check width/height or css rules)
    const avatar = page.getByTestId('mockup-avatar');
    await expect(avatar).toBeVisible();
    const box = await avatar.boundingBox();
    expect(box?.width).toBeLessThan(150); // standard desktop size is usually larger (150px+)
  });

  test('F5-TC4: Skeleton Mockup Loading state', async ({ page }) => {
    // Make the API call load slowly
    await page.route('**/api/profile-rebuild?cvId=test-cv-123', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({ status: 200, json: mockProfileData });
    });

    await page.goto('/mockup?cvId=test-cv-123');
    await expect(page.getByTestId('mockup-skeleton')).toBeVisible();
  });

  test('F5-TC5: Original vs. Optimized Toggle', async ({ page }) => {
    await page.route('**/api/profile-rebuild?cvId=test-cv-123', async (route) => {
      await route.fulfill({ status: 200, json: mockProfileData });
    });

    await page.goto('/mockup?cvId=test-cv-123');
    
    const toggle = page.getByTestId('mockup-toggle-view');
    await expect(toggle).toBeVisible();
    await toggle.click();

    // Verify page displays original CV text
    await expect(page.getByTestId('mockup-original-text')).toContainText(mockProfileData.original_cv_text);
    
    // Toggle back
    await toggle.click();
    await expect(page.getByTestId('mockup-headline')).toContainText(mockProfileData.novo_titulo_linkedin);
  });

  test('F5-TC6: Super-Long AI Fields (Layout Overflow Check)', async ({ page }) => {
    const longData = {
      ...mockProfileData,
      novo_titulo_linkedin: 'A'.repeat(400),
      sobre_persuasivo: 'B'.repeat(4000)
    };

    await page.route('**/api/profile-rebuild?cvId=test-cv-123', async (route) => {
      await route.fulfill({ status: 200, json: longData });
    });

    await page.goto('/mockup?cvId=test-cv-123');

    // Confirm elements do not overflow viewport width
    const headlineBox = await page.getByTestId('mockup-headline').boundingBox();
    const viewportWidth = page.viewportSize()?.width || 1280;
    expect(headlineBox?.width).toBeLessThanOrEqual(viewportWidth);
  });

  test('F5-TC7: Empty AI Outputs Handling', async ({ page }) => {
    const emptyData = {
      ...mockProfileData,
      sobre_persuasivo: ""
    };

    await page.route('**/api/profile-rebuild?cvId=test-cv-123', async (route) => {
      await route.fulfill({ status: 200, json: emptyData });
    });

    await page.goto('/mockup?cvId=test-cv-123');
    const about = page.getByTestId('mockup-about');
    await expect(about).toBeVisible();
    await expect(about).toContainText(/Insira uma descrição sobre você|não fornecido/i);
  });

  test('F5-TC8: Direct URL Access Block', async ({ page }) => {
    // Navigate directly without cvId query param
    await page.goto('/mockup');
    await expect(page).toHaveURL(/\/upload|\//);
  });

  test('F5-TC9: Non-ASCII Emojis and Character Scripts', async ({ page }) => {
    const unicodeData = {
      ...mockProfileData,
      novo_titulo_linkedin: "Diretor de Engenharia de Vendas 🚀 (日本語)"
    };

    await page.route('**/api/profile-rebuild?cvId=test-cv-123', async (route) => {
      await route.fulfill({ status: 200, json: unicodeData });
    });

    await page.goto('/mockup?cvId=test-cv-123');
    await expect(page.getByTestId('mockup-headline')).toContainText("Diretor de Engenharia de Vendas 🚀 (日本語)");
  });

  test('F5-TC10: Intercepting Profile Editing Actions', async ({ page }) => {
    await page.route('**/api/profile-rebuild?cvId=test-cv-123', async (route) => {
      await route.fulfill({ status: 200, json: mockProfileData });
    });

    await page.goto('/mockup?cvId=test-cv-123');

    // Try to type in headline element or double-click to edit
    const headline = page.getByTestId('mockup-headline');
    await headline.dblclick();
    
    // Check if the element is editable (input/textarea) or standard contentEditable=true
    const isContentEditable = await headline.getAttribute('contenteditable');
    expect(isContentEditable === 'false' || isContentEditable === null).toBe(true);
  });

});
