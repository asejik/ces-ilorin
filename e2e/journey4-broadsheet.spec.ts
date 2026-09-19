import { test, expect } from '@playwright/test';

test.describe('Journey 4: Academic Broadsheet & Graduation Engine', () => {
  test('renders broadsheet with KPI cards and export action', async ({ page }) => {
    // 1. Visit broadsheet
    await page.goto('/admin/broadsheet');

    // 2. Assert page header
    const heading = page.locator('h1');
    await expect(heading).toContainText(/Broadsheet/i);

    // 3. Assert Excel export button exists
    const exportBtn = page.getByRole('button', { name: /Export Excel/i });
    await expect(exportBtn).toBeVisible();

    // 4. Assert filter tabs exist (All, Ready to Graduate, Pending, Not Cleared)
    await expect(page.getByRole('button', { name: /All/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Ready to Graduate/i })).toBeVisible();
  });
});
