import { test, expect } from '@playwright/test';

test.describe('Privacy notice (no login needed)', () => {
  test('the public privacy page explains retention and rights', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: 'Privacy Notice', level: 1 })).toBeVisible();
    await expect(page.getByText(/5 years after your course ends/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Your rights' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'How to make a request' })).toBeVisible();
  });

  test('the registration consent links to the privacy notice', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('a[href="/privacy"]')).toBeVisible();
  });
});
