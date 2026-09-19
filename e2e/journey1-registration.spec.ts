import { test, expect } from '@playwright/test';

test.describe('Journey 1: Student Intake Registration', () => {
  test('renders registration form and performs validation check', async ({ page }) => {
    // 1. Visit registration page
    await page.goto('/register');
    await expect(page).toHaveTitle(/CES/i);

    // 2. Assert page header and title
    const heading = page.locator('h1');
    await expect(heading).toContainText(/Student Cohort Intake/i);

    // 3. Verify key input elements exist
    await expect(page.locator('input[name="surname"]')).toBeVisible();
    await expect(page.locator('input[name="first_name"]')).toBeVisible();
    await expect(page.locator('input[name="phone_number"]')).toBeVisible();
    await expect(page.locator('input[name="email_address"]')).toBeVisible();

    // 4. Verify cohort selection buttons exist
    const regularCohortBtn = page.getByRole('button', { name: /Regular Cohort/i });
    const sundayCohortBtn = page.getByRole('button', { name: /Sunday Cohort/i });
    await expect(regularCohortBtn).toBeVisible();
    await expect(sundayCohortBtn).toBeVisible();

    // 5. Verify back link
    const backLink = page.getByRole('link', { name: /Back to Portal Home/i });
    await expect(backLink).toBeVisible();
  });
});
