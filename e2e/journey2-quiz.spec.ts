import { test, expect } from '@playwright/test';

test.describe('Journey 2: Student Assessment Room', () => {
  test('renders assessment access gate and validates candidate interface', async ({ page }) => {
    // 1. Visit assessment gate
    await page.goto('/assess');

    // 2. Assert page headings and instructions
    const heading = page.locator('h1, h2');
    await expect(heading.first()).toBeVisible();

    // 3. Verify inputs for matriculation number and PIN exist
    const matricInput = page.locator('input[placeholder*="CES"], input[name*="matric"], input[type="text"]').first();
    await expect(matricInput).toBeVisible();

    // 4. Verify cohort toggle exists
    const cohortRegular = page.getByRole('button', { name: /Regular/i }).first();
    await expect(cohortRegular).toBeVisible();
  });
});
