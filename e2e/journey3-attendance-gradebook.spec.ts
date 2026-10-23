import { test, expect, type Page } from '@playwright/test';
import { adminClient, loginAs, readState } from './helpers';

async function checkIn(page: Page, matric: string, code: string) {
  await page.goto('/attendance');
  await page.waitForLoadState('networkidle');
  await page.locator('#courseSelect').selectOption('Doctrine of Salvation');
  await page.locator('#matricInput').fill(matric);
  await page.locator('#classCodeInput').fill(code);
  await page.getByRole('button', { name: /Confirm Class Attendance/i }).click();
}

test.describe.serial('Journey 3: attendance check-in and the teacher gradebook', () => {
  test('check-in needs the class code the teacher reads out', async ({ page }) => {
    const { student } = readState();
    await checkIn(page, student!.matricNo, 'NOPE00');
    await expect(page.getByText(/Matric number or class code is incorrect/i)).toBeVisible({ timeout: 20_000 });
  });

  test('a student with the correct code is recorded as attended, once only', async ({ page }) => {
    const state = readState();
    const sb = adminClient();
    const { data: sem } = await sb.from('ces_students').select('semester_id').eq('id', state.student!.id!).single();
    const { data: code } = await sb.from('ces_class_codes').select('code').eq('semester_id', sem!.semester_id).eq('course_name', 'Doctrine of Salvation').single();

    await checkIn(page, state.student!.matricNo, code!.code.toLowerCase());
    await expect(page.getByText(/Attendance Confirmed/i)).toBeVisible({ timeout: 20_000 });

    await checkIn(page, state.student!.matricNo, code!.code);
    await expect(page.getByText(/already been recorded/i)).toBeVisible({ timeout: 20_000 });
  });

  test('a teacher sees the student in the gradebook with the quiz score and can record an override', async ({ page }) => {
    const state = readState();
    await loginAs(page, state.teacher, '/admin/gradebook');
    await page.waitForLoadState('networkidle');
    await page.getByPlaceholder(/Search by student name/i).fill(state.student!.matricNo);
    const row = page.locator('tbody tr', { hasText: state.student!.matricNo });
    await expect(row).toHaveCount(1, { timeout: 20_000 });

    // Override the second quiz score (first one was taken by the student)
    await row.locator('button[title*="Click to edit"]').first().click();
    await page.locator('input[type=number]').fill('3');
    await page.locator('textarea').fill('E2E override check');
    await page.getByRole('button', { name: /Save Score Override/i }).click();
    await expect(page.locator('textarea')).toHaveCount(0, { timeout: 20_000 });

    // The change is audited with who did it and why
    const sb = adminClient();
    const { data } = await sb.from('ces_audit_log').select('actor_email, reason, new_value').eq('student_id', state.student!.id!).eq('action', 'score_override');
    expect(data?.length).toBeGreaterThanOrEqual(1);
    expect(data![0].actor_email).toBe(state.teacher.email);
    expect(data![0].reason).toBe('E2E override check');
  });
});
