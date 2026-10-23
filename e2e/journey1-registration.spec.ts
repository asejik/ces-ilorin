import { test, expect } from '@playwright/test';
import { adminClient, E2E_TAG, fillRegistration, readState, writeState } from './helpers';

test.describe.serial('Journey 1: student registration', () => {
  test('registers with a photo and lands on a success page that keeps personal details out of the URL', async ({ page }) => {
    const state = readState();
    const email = `${E2E_TAG}student-${state.runId}@example.com`;

    await fillRegistration(page, { email, first: 'Journey', surname: 'Registrant', withPhoto: true });
    await page.waitForURL('**/register/success', { timeout: 30_000 });

    // Nothing personal in the address bar
    expect(new URL(page.url()).search).toBe('');
    const matric = (await page.locator('body').innerText()).match(/CES\/ILR\/\d{2}[A-L]\d{3,}/)?.[0];
    expect(matric, 'a matric number in the CES/ILR/YY[Letter][Month][Seq] format').toBeTruthy();
    await expect(page.getByText('Journey Registrant')).toBeVisible();

    // Stored correctly in the database
    const sb = adminClient();
    const { data: row } = await sb
      .from('ces_students')
      .select('id, matric_no, consent_version, consent_at, passport_url, email_status')
      .eq('email_address', email)
      .single();
    expect(row?.matric_no).toBe(matric);
    expect(row?.consent_version).toBeTruthy();
    expect(row?.consent_at).toBeTruthy();
    expect(row?.passport_url).toMatch(/^passports\/[0-9a-f-]{36}\.jpg$/); // private path, random name
    expect(['sent', 'not_configured', 'pending']).toContain(row?.email_status);

    writeState({ ...state, student: { matricNo: matric!, email, id: row!.id } });
  });

  test('the same email address cannot register twice in one cohort', async ({ page }) => {
    const state = readState();
    await fillRegistration(page, { email: state.student!.email.toUpperCase(), first: 'Second', surname: 'Attempt' });
    await expect(page.getByText(/already registered for this cohort/i)).toBeVisible({ timeout: 20_000 });
    expect(page.url()).toContain('/register');
    expect(page.url()).not.toContain('success');
  });

  test('the success page shows nothing without a fresh registration', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto('/register/success');
    await expect(page.getByText(/No recent registration found/i)).toBeVisible();
    await ctx.close();
  });
});
