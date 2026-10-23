import { test, expect, type Page } from '@playwright/test';
import { adminClient, E2E_QUIZ_PIN, readState } from './helpers';

async function openAssess(page: Page) {
  await page.goto('/assess');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('#courseSelect')).toBeVisible();
  await page.locator('#courseSelect').selectOption('salvation');
}

async function enter(page: Page, matric: string, pin: string) {
  await page.locator('#matricInput').fill(matric);
  await page.locator('#pinInput').fill(pin);
  await page.getByRole('button', { name: /Verify & Enter Room/i }).click();
}

test.describe.serial('Journey 2: taking a quiz with a session PIN', () => {
  test('wrong PIN and unknown matric number give the same message', async ({ page }) => {
    const { student } = readState();
    await openAssess(page);
    await enter(page, student!.matricNo, 'WRONG1');
    const first = await page.getByText(/Matric number or session PIN is incorrect/i).innerText();

    await page.reload();
    await openAssess(page);
    await enter(page, 'CES/ILR/99Z999', E2E_QUIZ_PIN);
    const second = await page.getByText(/Matric number or session PIN is incorrect/i).innerText();
    expect(second).toBe(first);
  });

  test('student enters with the right PIN, answers every question and gets a recorded score', async ({ page }) => {
    const state = readState();
    await openAssess(page);
    await enter(page, state.student!.matricNo, E2E_QUIZ_PIN.toLowerCase()); // PIN is case-insensitive

    await expect(page.getByText(/Candidate Confirmed/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Journey Registrant')).toBeVisible();
    await page.getByRole('button', { name: /Start Assessment Now/i }).click();

    // Answer option A on each question, then submit
    for (let i = 0; i < 20; i++) {
      await page.locator('div.space-y-3 > button').first().click(); // option A
      const finish = page.getByRole('button', { name: /Finish & Submit/i });
      if (await finish.isVisible()) break;
      await page.getByRole('button', { name: /Next Question/i }).click();
    }
    await page.getByRole('button', { name: /Finish & Submit/i }).click();
    await page.getByRole('button', { name: /Confirm & Record/i }).click();
    await expect(page.getByText(/Assessment Recorded/i)).toBeVisible({ timeout: 20_000 });

    // The score is in the database, and answer keys never reached the page
    const sb = adminClient();
    const { data: quiz } = await sb.from('ces_quizzes').select('id, max_score').eq('course_code', 'salvation').eq('session_pin', E2E_QUIZ_PIN).single();
    const { data: row } = await sb.from('ces_student_assessments').select('score').eq('student_id', state.student!.id!).eq('quiz_id', quiz!.id).single();
    expect(Number(row!.score)).toBeGreaterThanOrEqual(0);
    expect(Number(row!.score)).toBeLessThanOrEqual(Number(quiz!.max_score));
    expect(await page.content()).not.toMatch(/correct_option_index/);
  });

  test('a second attempt at the same quiz is refused', async ({ page }) => {
    const { student } = readState();
    await openAssess(page);
    await enter(page, student!.matricNo, E2E_QUIZ_PIN);
    await expect(page.getByText(/already completed/i)).toBeVisible({ timeout: 20_000 });
  });
});
