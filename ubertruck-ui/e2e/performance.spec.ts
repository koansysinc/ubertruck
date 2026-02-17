import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Performance Testing
 * Tests page load times and rendering performance
 */

test.describe('Performance', () => {
  test('should load page within 3 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });

  test('should render main content quickly', async ({ page }) => {
    await page.goto('/');

    const startTime = Date.now();
    await page.locator('h1').waitFor({ state: 'visible' });
    const renderTime = Date.now() - startTime;

    expect(renderTime).toBeLessThan(1000);
  });

  test('should not have console errors on load', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out expected API errors (since we don't have backend)
    const unexpectedErrors = errors.filter(
      (err) => !err.includes('fetch') && !err.includes('Network')
    );

    expect(unexpectedErrors.length).toBe(0);
  });

  test('should load with minimal network requests', async ({ page }) => {
    const requests: string[] = [];

    page.on('request', (request) => {
      requests.push(request.url());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should have reasonable number of requests (HTML, JS, CSS, favicon)
    expect(requests.length).toBeLessThan(20);
  });

  test('should have efficient CSS rendering', async ({ page }) => {
    await page.goto('/');

    const metrics = await page.evaluate(() => ({
      firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
      firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime || 0,
    }));

    // First paint should happen quickly
    expect(metrics.firstPaint).toBeLessThan(1500);
    expect(metrics.firstContentfulPaint).toBeLessThan(2000);
  });

  test('should handle input without lag', async ({ page }) => {
    await page.goto('/');

    const phoneInput = page.locator('input[type="tel"]');

    const startTime = Date.now();
    await phoneInput.fill('9876543210');
    const inputTime = Date.now() - startTime;

    expect(inputTime).toBeLessThan(500);
  });
});
