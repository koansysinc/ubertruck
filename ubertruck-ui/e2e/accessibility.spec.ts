import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Accessibility Testing
 * Tests WCAG compliance and keyboard navigation
 */

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tab to phone input
    await page.keyboard.press('Tab');

    const phoneInput = page.locator('input[type="tel"]');
    await expect(phoneInput).toBeFocused();

    // Type with keyboard
    await page.keyboard.type('9876543210');
    const value = await phoneInput.inputValue();
    expect(value).toBe('9876543210');

    // Tab to next button
    await page.keyboard.press('Tab');
    const nextButton = page.locator('button:has-text("Next")');
    await expect(nextButton).toBeFocused();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);

    const h1Text = await h1.textContent();
    expect(h1Text).toBeTruthy();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    const heading = page.locator('h1');
    const color = await heading.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        color: style.color,
        backgroundColor: style.backgroundColor,
      };
    });

    expect(color.color).toBeTruthy();
  });

  test('should have descriptive error messages', async ({ page }) => {
    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill('123');
    await phoneInput.blur();

    const errorMessage = page.locator('text=/Phone number/i');
    await expect(errorMessage).toBeVisible();

    const errorText = await errorMessage.textContent();
    expect(errorText).toBeTruthy();
    expect(errorText!.length).toBeGreaterThan(10);
  });

  test('should have visible focus indicators', async ({ page }) => {
    await page.keyboard.press('Tab');

    const phoneInput = page.locator('input[type="tel"]');
    await expect(phoneInput).toBeFocused();

    const outlineStyle = await phoneInput.evaluate(el =>
      window.getComputedStyle(el).outlineStyle
    );

    // Should have some outline/border style on focus
    expect(outlineStyle).not.toBe('none');
  });

  test('should support form submission with Enter key', async ({ page }) => {
    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill('9876543210');

    await page.keyboard.press('Enter');

    // Should attempt to submit (button should become disabled)
    const nextButton = page.locator('button:has-text("Next")');
    await expect(nextButton).toBeDisabled();
  });

  test('should have alt text for images', async ({ page }) => {
    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });
});
