import { test, expect } from '@playwright/test';
import { loginAs, readState } from './helpers';

test.describe.serial('Journey 4: who can see what', () => {
  test('signed-out visitors are sent to the login page for every staff area', async ({ page }) => {
    for (const path of ['/admin/gradebook', '/admin/broadsheet', '/admin/attendance', '/admin/quizzes', '/certificate/CES%2FILR%2F26J1001']) {
      await page.context().clearCookies();
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('an administrator sees the broadsheet with the student', async ({ page }) => {
    const state = readState();
    await loginAs(page, state.admin, '/admin/broadsheet');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('tbody tr', { hasText: state.student!.matricNo })).toHaveCount(1, { timeout: 20_000 });
    await expect(page.getByText(/administrators only/i)).toHaveCount(0);
  });

  test('a teacher is told the broadsheet is for administrators', async ({ page }) => {
    const state = readState();
    await loginAs(page, state.teacher, '/admin/broadsheet');
    await expect(page.getByText(/administrators only/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('tbody tr', { hasText: state.student!.matricNo })).toHaveCount(0);
  });

  test('a signed-in account that is not CES staff cannot open staff pages', async ({ page }) => {
    // Teacher login works above; here we prove the staff check by using a fresh, non-staff user.
    const { adminClient: ac } = await import('./helpers');
    const sb = ac();
    const state = readState();
    const email = `e2e-nonstaff-${state.runId}@example.com`;
    const password = `Np-${state.runId}-${Math.random().toString(36).slice(2)}`;
    const { data } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
    try {
      await page.context().clearCookies();
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.locator('input[type=email]').fill(email);
      await page.locator('input[type=password]').fill(password);
      await page.locator('button[type=submit]').click();
      await expect(page).toHaveURL(/error=not-staff/, { timeout: 20_000 });
      await page.goto('/admin/gradebook');
      await expect(page).toHaveURL(/\/login/);
    } finally {
      if (data?.user) await sb.auth.admin.deleteUser(data.user.id);
    }
  });
});
