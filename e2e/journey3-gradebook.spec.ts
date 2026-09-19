import { test, expect } from '@playwright/test';

test.describe('Journey 3: Teacher Gradebook & Live Roster', () => {
  test('renders gradebook roster with cohort controls and search filter', async ({ page }) => {
    // 1. Visit gradebook
    await page.goto('/admin/gradebook');

    // 2. Assert page header
    const heading = page.locator('h1');
    await expect(heading).toContainText(/Gradebook/i);

    // 3. Assert search input exists
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    // 4. Assert cohort buttons exist
    const regularBtn = page.getByRole('button', { name: /Regular Cohort/i });
    const sundayBtn = page.getByRole('button', { name: /Sunday Cohort/i });
    await expect(regularBtn).toBeVisible();
    await expect(sundayBtn).toBeVisible();
  });
});
