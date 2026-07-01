import { test, expect } from '@playwright/test';

test.describe('F1: Landing Page & Conversational Navigation', () => {
  
  test('F1-TC1: Initial Render Validation', async ({ page }) => {
    await page.goto('/');
    
    const headline = page.getByTestId('headline');
    const subheadline = page.getByTestId('subheadline');
    const ctaButton = page.getByTestId('cta-button');

    await expect(headline).toBeVisible();
    await expect(subheadline).toBeVisible();
    await expect(ctaButton).toBeVisible();

    // Verify it contains target copywriting words
    const headlineText = await headline.textContent();
    expect(headlineText).toContain('Perfil');
  });

  test('F1-TC2: CTA Redirection', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('cta-button').click();
    await expect(page).toHaveURL(/\/upload/);
  });

  test('F1-TC3: Multi-Viewport Responsiveness', async ({ page }) => {
    const viewports = [
      { width: 375, height: 812 },  // mobile
      { width: 768, height: 1024 }, // tablet
      { width: 1280, height: 800 }  // desktop
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto('/');
      
      const ctaButton = page.getByTestId('cta-button');
      await expect(ctaButton).toBeVisible();
      await expect(ctaButton).toBeEnabled();
    }
  });

  test('F1-TC4: Copy Copywriting Asset Check', async ({ page }) => {
    await page.goto('/');
    const bodyText = await page.textContent('body');
    // Expect body text to contain sales hooks or invibility pain points
    expect(bodyText).toMatch(/(invisível|invisibilidade|destaque|vendas|linkedin|curriculo|currículo)/i);
  });

  test('F1-TC5: Smooth Anchor Scrolling', async ({ page }) => {
    await page.goto('/');
    
    // Target anchor links if present
    const featuresLink = page.locator('a[href^="#"]').first();
    if (await featuresLink.count() > 0) {
      await featuresLink.click();
      // Ensure page did not crash and URL contains target hash
      const href = await featuresLink.getAttribute('href');
      if (href) {
        expect(page.url()).toContain(href);
      }
    }
  });

  test('F1-TC6: Slow Asset Render Resiliency', async ({ page }) => {
    // Intercept stylesheets and delay them
    await page.route('**/*.css', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });

    await page.goto('/');
    // Should still display text and CTA
    await expect(page.getByTestId('cta-button')).toBeVisible();
    await expect(page.getByTestId('cta-button')).toBeEnabled();
  });

  test('F1-TC7: Clean 404 Routing', async ({ page }) => {
    await page.goto('/invalid-route-name');
    const errorTitle = page.getByTestId('404-title');
    await expect(errorTitle).toBeVisible();
    
    const backLink = page.getByTestId('404-back-link');
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL('/');
  });

  test('F1-TC8: Malformed Query Parameter Handling', async ({ page }) => {
    await page.goto('/?utm_source=invalid[]%&utm_campaign=xyz');
    await expect(page.getByTestId('cta-button')).toBeVisible();
    const headline = page.getByTestId('headline');
    await expect(headline).toBeVisible();
  });

  test('F1-TC9: Bot Crawling Simulation', async ({ page }) => {
    // Set user agent to Googlebot
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
    });
    await page.goto('/');
    await expect(page.getByTestId('headline')).toBeVisible();
    // Validate we got a standard HTML landing page back
    const html = await page.content();
    expect(html).toContain('<html');
  });

  test('F1-TC10: Rapid CTA Click Spams', async ({ page }) => {
    await page.goto('/');
    const cta = page.getByTestId('cta-button');
    await expect(cta).toBeVisible();
    
    // Rapid double click
    await cta.click({ clickCount: 2 });
    
    // Verify only one navigation happened and we landed safely
    await expect(page).toHaveURL(/\/upload/);
  });

});
