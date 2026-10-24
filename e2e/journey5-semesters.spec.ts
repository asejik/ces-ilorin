import { test, expect } from '@playwright/test';
import { adminClient, fillRegistration, loginAs, readState } from './helpers';

test.describe.serial('Journey 5: semester setup', () => {
  let originalActiveId: string | null = null;
  let testSemId: string | null = null;

  test.beforeAll(async () => {
    const { data } = await adminClient().from('ces_semesters').select('id').eq('type', 'Regular').eq('is_active', true).maybeSingle();
    originalActiveId = data?.id ?? null;
  });

  test.afterAll(async () => {
    // Put the Regular cohort back exactly as it was, then remove the test semester.
    if (!originalActiveId) return;
    const sb = adminClient();
    await sb.from('ces_semesters').update({ is_active: false }).eq('type', 'Regular').neq('id', originalActiveId);
    await sb.from('ces_semesters').update({ is_active: true }).eq('id', originalActiveId);
    if (testSemId) await sb.from('ces_semesters').delete().eq('id', testSemId);
  });

  test('a teacher cannot manage semesters', async ({ page }) => {
    await loginAs(page, readState().teacher, '/admin/semesters');
    await expect(page.getByText(/not allowed to manage semesters/i)).toBeVisible({ timeout: 20_000 });
  });

  test('an administrator creates a semester, switches to it, and closing it pauses registration', async ({ page }) => {
    const state = readState();
    const sb = adminClient();
    const name = `ZZ E2E Semester ${state.runId}`;
    await loginAs(page, state.admin, '/admin/semesters');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder(/Regular Cohort/).fill(name);
    await page.getByRole('checkbox').uncheck();
    await page.getByRole('button', { name: /Create semester/i }).click();
    const row = page.locator('li', { hasText: name });
    await expect(row).toBeVisible({ timeout: 20_000 });
    await expect(row.getByText('Closed')).toBeVisible();
    const { data: created } = await sb.from('ces_semesters').select('id, is_active').eq('name', name).single();
    testSemId = created!.id;
    expect(created!.is_active).toBe(false);

    // Switching: the new one becomes the single active Regular semester
    await row.getByRole('button', { name: /Make active/i }).click();
    await expect(row.getByText('Active', { exact: true })).toBeVisible({ timeout: 20_000 });
    const { data: actives } = await sb.from('ces_semesters').select('id').eq('type', 'Regular').eq('is_active', true);
    expect(actives).toHaveLength(1);
    expect(actives![0].id).toBe(testSemId);

    // Close it: registration for the cohort is refused with a clear message
    page.once('dialog', (d) => d.accept());
    await row.getByRole('button', { name: /^Close$/ }).click();
    await expect(row.getByText('Closed')).toBeVisible({ timeout: 20_000 });
    await fillRegistration(page, { email: `e2e-closed-${state.runId}@example.com`, first: 'Closed', surname: 'Cohort' });
    await expect(page.getByText(/not open right now/i)).toBeVisible({ timeout: 20_000 });
    const { count } = await sb.from('ces_students').select('id', { count: 'exact', head: true }).eq('email_address', `e2e-closed-${state.runId}@example.com`);
    expect(count).toBe(0);
  });
});
