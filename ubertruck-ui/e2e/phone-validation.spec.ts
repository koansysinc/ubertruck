import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Phone Number Validation
 * Tests the phone entry screen form validation
 */

test.describe('Phone Entry Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display phone entry screen on load', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Get moving with UberTruck');
    await expect(page.locator('input[type="tel"]')).toBeVisible();
  });

  test('should show +91 prefix', async ({ page }) => {
    await expect(page.locator('text=🇮🇳 +91')).toBeVisible();
  });

  test('should validate invalid phone - too short', async ({ page }) => {
    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill('123');
    await phoneInput.blur();

    await expect(page.locator('text=/Phone number must be exactly 10 digits/i')).toBeVisible();
  });

  test('should validate invalid phone - wrong starting digit', async ({ page }) => {
    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill('1234567890');
    await phoneInput.blur();

    await expect(page.locator('text=/Phone number must start with 6, 7, 8, or 9/i')).toBeVisible();
  });

  test('should accept valid phone number', async ({ page }) => {
    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill('9876543210');

    const nextButton = page.locator('button:has-text("Next")');
    await expect(nextButton).toBeEnabled();
  });

  test('should disable Next button for invalid phone', async ({ page }) => {
    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill('123');

    const nextButton = page.locator('button:has-text("Next")');
    await expect(nextButton).toBeDisabled();
  });

  test('should strip non-digit characters', async ({ page }) => {
    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill('98-765-432-10');

    const value = await phoneInput.inputValue();
    expect(value).toBe('9876543210');
  });

  test('should limit to 10 digits', async ({ page }) => {
    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill('98765432101234');

    const value = await phoneInput.inputValue();
    expect(value).toHaveLength(10);
  });

  test('should show Terms & Privacy Policy links', async ({ page }) => {
    await expect(page.locator('text=/Terms & Conditions/i')).toBeVisible();
    await expect(page.locator('text=/Privacy Policy/i')).toBeVisible();
  });

  test('should show user type selector buttons', async ({ page }) => {
    await expect(page.locator('text=I need to ship cargo')).toBeVisible();
    await expect(page.locator('text=I have trucks to offer')).toBeVisible();
  });
});
