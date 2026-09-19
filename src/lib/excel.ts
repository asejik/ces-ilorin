import * as XLSX from 'xlsx';
import type { StudentBroadsheetRow, BroadsheetKPIs } from '../types/broadsheet';

export interface ExportBroadsheetParams {
  cohortName: string;
  semesterName: string;
  rows: StudentBroadsheetRow[];
  kpis?: BroadsheetKPIs | null;
}

/**
 * Builds the official Excel (.xlsx) Broadsheet WorkBook object.
 */
export function buildBroadsheetWorkbook({
  cohortName,
  semesterName,
  rows,
  kpis,
}: ExportBroadsheetParams): { workbook: XLSX.WorkBook; filename: string } {
  const wb = XLSX.utils.book_new();

  const titleRows: (string | number)[][] = [
    ['CITIZENS OF LIGHT CHURCH'],
    ['CITIZENS ELEMENTARY SCHOOL (CES) — OFFICIAL ACADEMIC BROADSHEET'],
    [
      `Cohort: ${cohortName} (${semesterName})`,
      '',
      `Generated: ${new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })}`,
    ],
    [], // Blank separator
  ];

  const headerRow: string[] = [
    'S/N',
    'Matriculation No',
    'Full Name',
    'Cohort',
    'Salvation (/5)',
    'Righteousness (/5)',
    'Word of God (/5)',
    'Love Walk (/5)',
    'Service (/5)',
    'Spiritual Authority (/5)',
    'Holy Spirit (/5)',
    'Prayer (/5)',
    'Quiz Total (/40)',
    'Final Exam (/60)',
    'Cumulative Total (/100)',
    'Elementary Principles',
    'Membership & Vision',
    'Graduation Clearance',
    'Honour Class',
    'Certificate No',
  ];

  const dataRows: (string | number)[][] = rows.map((r, index) => {
    const q = r.quizzes;
    return [
      index + 1,
      r.matricNo,
      r.fullName,
      r.cohortType,
      q['salvation']?.score !== null && q['salvation']?.score !== undefined
        ? q['salvation'].score
        : '-',
      q['righteousness']?.score !== null && q['righteousness']?.score !== undefined
        ? q['righteousness'].score
        : '-',
      q['word_of_god']?.score !== null && q['word_of_god']?.score !== undefined
        ? q['word_of_god'].score
        : '-',
      q['love_walk']?.score !== null && q['love_walk']?.score !== undefined
        ? q['love_walk'].score
        : '-',
      q['service']?.score !== null && q['service']?.score !== undefined
        ? q['service'].score
        : '-',
      q['spiritual_authority']?.score !== null && q['spiritual_authority']?.score !== undefined
        ? q['spiritual_authority'].score
        : '-',
      q['holy_spirit']?.score !== null && q['holy_spirit']?.score !== undefined
        ? q['holy_spirit'].score
        : '-',
      q['prayer']?.score !== null && q['prayer']?.score !== undefined ? q['prayer'].score : '-',
      r.quizTotal !== null ? r.quizTotal : '-',
      r.finalExam?.score !== null && r.finalExam?.score !== undefined ? r.finalExam.score : '-',
      r.cumulativeTotal !== null ? r.cumulativeTotal : '-',
      r.elementaryPrinciples ?? 'Not Recorded',
      r.membershipVision ?? 'Not Recorded',
      r.graduationStatus.replace(/^[^\w]+/, '').trim(), // Clean emoji e.g. "GRADUATE"
      r.honourClass ?? 'Below Pass',
      r.certificateNo ?? 'Not Issued',
    ];
  });

  const summaryRows: (string | number)[][] = [
    [],
    ['EXECUTIVE SUMMARY & COHORT METRICS'],
    ['Total Enrolled Students', kpis?.totalStudents ?? rows.length],
    [
      'Cleared for Graduation',
      `${kpis?.graduatesCount ?? 0} (${rows.length > 0 ? Math.round(((kpis?.graduatesCount ?? 0) / rows.length) * 100) : 0}%)`,
    ],
    ['Pending Requirements', kpis?.pendingCount ?? 0],
    ['Cohort Average Score', `${kpis?.averageScore ?? 0} / 100`],
    ['Distinctions (≥ 85%)', kpis?.distinctionCount ?? 0],
    ['Merits (75% - 84.9%)', kpis?.meritCount ?? 0],
    ['Passes (50% - 74.9%)', kpis?.passCount ?? 0],
  ];

  const fullSheetData = [...titleRows, headerRow, ...dataRows, ...summaryRows];

  const ws = XLSX.utils.aoa_to_sheet(fullSheetData);

  // Column width definitions (wch = width in characters)
  ws['!cols'] = [
    { wch: 6 }, // S/N
    { wch: 18 }, // Matric No
    { wch: 26 }, // Full Name
    { wch: 16 }, // Cohort
    { wch: 14 }, // Salvation
    { wch: 16 }, // Righteousness
    { wch: 15 }, // Word of God
    { wch: 14 }, // Love Walk
    { wch: 12 }, // Service
    { wch: 20 }, // Spiritual Auth
    { wch: 14 }, // Holy Spirit
    { wch: 12 }, // Prayer
    { wch: 16 }, // Quiz Total
    { wch: 16 }, // Final Exam
    { wch: 20 }, // Cumulative Total
    { wch: 22 }, // Elem Princ
    { wch: 24 }, // Membership & Vision
    { wch: 20 }, // Clearance
    { wch: 16 }, // Honour Class
    { wch: 20 }, // Certificate No
  ];

  const safeCohort = cohortName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStamp = new Date().toISOString().split('T')[0];
  const filename = `CES_Broadsheet_${safeCohort}_${dateStamp}.xlsx`;

  XLSX.utils.book_append_sheet(wb, ws, 'Broadsheet');

  return { workbook: wb, filename };
}

/**
 * Builds and downloads an official Excel (.xlsx) Broadsheet file in the client browser.
 */
export function exportBroadsheetToExcel(params: ExportBroadsheetParams): void {
  const { workbook, filename } = buildBroadsheetWorkbook(params);
  XLSX.writeFile(workbook, filename);
}
