import { test, expect } from '@playwright/test';

/**
 * E2E Tests: UI Elements and Visual Testing
 * Tests all UI components render correctly
 */

test.describe('UI Elements and Layout', () => {
  test('should have correct page title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/UberTruck/);
  });

  test('should display logo/branding', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1:has-text("UberTruck")')).toBeVisible();
  });

  test('should have responsive layout', async ({ page }) => {
    await page.goto('/');

    // Desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    const desktopContainer = page.locator('div.min-h-screen');
    await expect(desktopContainer).toBeVisible();

    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(desktopContainer).toBeVisible();
  });

  test('should have proper color scheme', async ({ page }) => {
    await page.goto('/');

    const container = page.locator('div.min-h-screen');
    const bgColor = await container.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );

    // Should have a background color set
    expect(bgColor).toBeTruthy();
  });

  test('should have accessible form labels', async ({ page }) => {
    await page.goto('/');

    const phoneInput = page.locator('input[type="tel"]');
    await expect(phoneInput).toHaveAttribute('placeholder');
  });

  test('should show loading states', async ({ page }) => {
    await page.goto('/');

    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill('9876543210');

    const nextButton = page.locator('button:has-text("Next")');
    await nextButton.click();

    // Should show some loading indication (spinner or disabled state)
    await expect(nextButton).toBeDisabled();
  });

  test('should have proper font rendering', async ({ page }) => {
    await page.goto('/');

    const heading = page.locator('h1').first();
    const fontSize = await heading.evaluate(el =>
      window.getComputedStyle(el).fontSize
    );

    // Heading should have substantial font size
    const fontSizeNum = parseInt(fontSize);
    expect(fontSizeNum).toBeGreaterThan(20);
  });

  test('should have proper button styling', async ({ page }) => {
    await page.goto('/');

    const button = page.locator('button:has-text("Next")');
    await expect(button).toHaveCSS('cursor', 'not-allowed');

    // Fill valid phone to enable button
    await page.locator('input[type="tel"]').fill('9876543210');

    // Button should now be clickable
    await expect(button).toBeEnabled();
  });
});
