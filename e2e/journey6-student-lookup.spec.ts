import { test, expect, type Page } from '@playwright/test';
import { adminClient, loginAs, readState } from './helpers';

async function openStudent(page: Page, matricNo: string) {
  await page.getByLabel('Search students').fill(matricNo);
  await page.getByRole('button', { name: /^Search$/ }).click();
  await page.getByRole('button', { name: new RegExp(matricNo) }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 20_000 });
}

test.describe.serial('Journey 6: student lookup', () => {
  test('an administrator sees the full record and can resend the welcome email', async ({ page }) => {
    const state = readState();
    const { matricNo, email } = state.student!;
    await loginAs(page, state.admin, '/admin/students');
    await page.waitForLoadState('networkidle');
    await openStudent(page, matricNo);

    await expect(page.getByText(matricNo).first()).toBeVisible();
    await expect(page.getByText(/Contact details \(administrators only\)/)).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
    await expect(page.getByText(/Consent:/)).not.toContainText('not recorded');
    await expect(page.getByRole('heading', { name: 'Scores' })).toBeVisible();

    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: /Resend welcome email/ }).click();
    await expect(page.getByText(/Done\. Email status/)).toBeVisible({ timeout: 20_000 });

    const sb = adminClient();
    const { data: stu } = await sb.from('ces_students').select('id').eq('matric_no', matricNo).single();
    const { data: log } = await sb.from('ces_audit_log').select('action, actor_email').eq('student_id', stu!.id).eq('action', 'welcome_email_resent');
    expect(log).toHaveLength(1);
    expect(log![0].actor_email).toBe(state.admin.email);
  });

  test('a teacher finds the student but sees no contact details or resend button', async ({ page }) => {
    const state = readState();
    const { matricNo, email } = state.student!;
    await loginAs(page, state.teacher, '/admin/students');
    await page.waitForLoadState('networkidle');
    await openStudent(page, matricNo);

    await expect(page.getByRole('heading', { name: 'Scores' })).toBeVisible();
    await expect(page.getByText(/Contact details/)).toHaveCount(0);
    await expect(page.getByText(email)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Resend welcome email/ })).toHaveCount(0);

    // Teachers cannot find people by e-mail address
    await page.getByRole('button', { name: /Back to results/ }).click();
    await page.getByLabel('Search students').fill(email);
    await page.getByRole('button', { name: /^Search$/ }).click();
    await expect(page.getByText(/No students match/)).toBeVisible({ timeout: 20_000 });
  });

  test('odd search text is handled safely', async ({ page }) => {
    const state = readState();
    await loginAs(page, state.admin, '/admin/students');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('Search students').fill('x),is_deleted.eq.true,(y');
    await page.getByRole('button', { name: /^Search$/ }).click();
    await expect(page.getByText(/No students match/)).toBeVisible({ timeout: 20_000 });
    await page.getByLabel('Search students').fill('a');
    await page.getByRole('button', { name: /^Search$/ }).click();
    await expect(page.getByText('Type at least 2 characters.')).toBeVisible();
  });
});
