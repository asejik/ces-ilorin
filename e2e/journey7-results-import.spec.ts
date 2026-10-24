import { test, expect, type Page } from '@playwright/test';
import * as XLSX from 'xlsx';
import { adminClient, loginAs, readState } from './helpers';

const HEAD = [
  'Matric No', 'Salvation (/5)', 'Righteousness (/5)', 'Word of God (/5)', 'Love Walk (/5)', 'Service (/5)',
  'Spiritual Authority (/5)', 'Holy Spirit (/5)', 'Prayer (/5)', 'Final Exam (/60)', 'Elementary Principles', 'Membership & Vision',
];

function workbookBuffer(rows: unknown[][]): Buffer {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([HEAD, ...rows]), 'Results');
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}

async function chooseFile(page: Page, buffer: Buffer, cohort: string) {
  await page.getByLabel('Cohort').selectOption(cohort);
  await page.getByLabel('Excel file (.xlsx)').setInputFiles({
    name: 'e2e-results.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer,
  });
  await page.getByRole('button', { name: /Check file/ }).click();
}

test.describe.serial('Journey 7: results import and certificates', () => {
  let cohort = 'Regular';
  let existingCerts: string[] = [];

  test.beforeAll(async () => {
    const sb = adminClient();
    const { matricNo } = readState().student!;
    const { data: stu } = await sb.from('ces_students').select('cohort_type').eq('matric_no', matricNo).single();
    cohort = stu!.cohort_type;
    const { data: certs } = await sb.from('ces_certificates').select('id');
    existingCerts = (certs ?? []).map((c) => c.id);
  });

  test.afterAll(async () => {
    // "Generate certificates" covers the whole cohort, so remove any certificate this test created
    const sb = adminClient();
    const { data: certs } = await sb.from('ces_certificates').select('id');
    for (const c of certs ?? []) {
      if (!existingCerts.includes(c.id)) await sb.from('ces_certificates').delete().eq('id', c.id);
    }
  });

  test('a teacher cannot import results', async ({ page }) => {
    const state = readState();
    await loginAs(page, state.teacher, '/admin/import');
    await page.waitForLoadState('networkidle');
    await chooseFile(page, workbookBuffer([[state.student!.matricNo, 5]]), cohort);
    await expect(page.getByText(/Forbidden/)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: /^Save / })).toHaveCount(0);
  });

  test('a file that is not an .xlsx is refused', async ({ page }) => {
    const state = readState();
    await loginAs(page, state.admin, '/admin/import');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('Excel file (.xlsx)').setInputFiles({ name: 'results.xlsx', mimeType: 'text/plain', buffer: Buffer.from('not a zip') });
    await page.getByRole('button', { name: /Check file/ }).click();
    await expect(page.getByText(/does not look like a real \.xlsx/)).toBeVisible({ timeout: 20_000 });
  });

  test('an administrator checks, saves and issues a certificate', async ({ page }) => {
    const state = readState();
    const { matricNo } = state.student!;
    await loginAs(page, state.admin, '/admin/import');
    await page.waitForLoadState('networkidle');

    const rows = [
      [matricNo, 5, 5, 5, 5, 5, 5, 5, 5, 55, 'Attended', 'Attended'],
      ['CES/ILR/26H999999', 3, null, null, null, null, null, null, null, null, null, null],
      ['CES/ILR/26H999998', 9, null, null, null, null, null, null, null, null, null, null],
      ['CES/ILR/26H999997', 1], // duplicated below
      ['CES/ILR/26H999997', 2],
    ];
    await chooseFile(page, workbookBuffer(rows), cohort);

    await expect(page.getByRole('heading', { name: '2. Check the preview' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/No student with this matric number/)).toBeVisible();
    await expect(page.getByText(/above the maximum of 5/)).toBeVisible();
    await expect(page.getByText(/Appears 2 times/).first()).toBeVisible();
    await expect(page.getByText(/4 row\(s\) will be skipped/)).toBeVisible();

    // Nothing is saved by the preview
    const sb = adminClient();
    const { data: stu } = await sb.from('ces_students').select('id').eq('matric_no', matricNo).single();
    const before = await sb.from('ces_student_assessments').select('id', { count: 'exact', head: true }).eq('student_id', stu!.id).like('override_reason', 'Excel import:%');
    expect(before.count).toBe(0);

    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: /^Save 1 student/ }).click();
    await expect(page.getByText(/Saved \d+ score\(s\) and \d+ attendance record\(s\)\. 4 row\(s\) were skipped/)).toBeVisible({ timeout: 30_000 });

    const { data: saved } = await sb.from('ces_student_assessments').select('score, is_manual_override, overridden_by').eq('student_id', stu!.id).like('override_reason', 'Excel import:%');
    expect(saved).toHaveLength(9);
    expect(saved!.every((s) => s.is_manual_override && s.overridden_by === state.admin.id)).toBe(true);
    const { data: att } = await sb.from('ces_attendance_records').select('course_name, status').eq('student_id', stu!.id).in('course_name', ['Elementary Principles', 'Membership & Vision Class']);
    expect(att).toHaveLength(2);
    expect(att!.every((a) => a.status === 'Attended')).toBe(true);
    const { data: audit } = await sb.from('ces_audit_log').select('actor_email').eq('student_id', stu!.id).like('reason', 'Excel import:%');
    expect(audit!.length).toBeGreaterThanOrEqual(9);
    expect(audit![0].actor_email).toBe(state.admin.email);

    // Uploading the same file again changes nothing
    await chooseFile(page, workbookBuffer(rows), cohort);
    await expect(page.getByRole('button', { name: /Nothing to save/ })).toBeVisible({ timeout: 20_000 });
  });

  test('certificates are generated from the imported results', async ({ page }) => {
    const state = readState();
    const { matricNo } = state.student!;
    const sb = adminClient();
    const { data: stu } = await sb.from('ces_students').select('id').eq('matric_no', matricNo).single();
    await sb.from('ces_certificates').delete().eq('student_id', stu!.id);

    await loginAs(page, state.admin, '/admin/import');
    await page.waitForLoadState('networkidle');
    // The certificate button appears after a save, so change one score first
    await chooseFile(page, workbookBuffer([[matricNo, 4]]), cohort);
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: /^Save 1 student/ }).click();
    await expect(page.getByText(/Saved 1 score/)).toBeVisible({ timeout: 30_000 });

    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: /Generate certificates/ }).click();
    await expect(page.getByText(/Done\. \d+ new certificate/)).toBeVisible({ timeout: 30_000 });

    const { data: cert } = await sb.from('ces_certificates').select('honour_class, cumulative_total').eq('student_id', stu!.id).single();
    expect(cert!.honour_class).toBe('Distinction');
    expect(Number(cert!.cumulative_total)).toBe(94);
  });
});
