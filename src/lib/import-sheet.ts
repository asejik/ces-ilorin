import * as XLSX from 'xlsx';
import { CES_CURRICULUM } from './curriculum';

/**
 * Reading and checking an uploaded results spreadsheet. Pure functions only (no database),
 * so every rule is unit-tested. The server action adds the checks that need the database
 * (unknown matric numbers, students from another semester, the real quiz maximums).
 */

export const MAX_IMPORT_ROWS = 1000;
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
const HEADER_SEARCH_ROWS = 15;

export const MANDATORY_CLASSES = ['Elementary Principles', 'Membership & Vision Class'] as const;
export type MandatoryClass = (typeof MANDATORY_CLASSES)[number];
export type ImportAttendance = 'Attended' | 'Not Attended' | 'Excused';

interface ColumnDef {
  /** Letters-only, lower-case start of the heading, so "Salvation (/5)" and "salvation" both match. */
  match: string;
  kind: 'score' | 'attendance';
  /** course_code for scores, course_name for attendance */
  key: string;
  label: string;
}

/** Same short headings as the broadsheet export, so an exported sheet can be re-imported. */
const SHORT_NAMES: Record<string, string> = {
  salvation: 'Salvation',
  righteousness: 'Righteousness',
  word_of_god: 'Word of God',
  love_walk: 'Love Walk',
  service: 'Service',
  spiritual_authority: 'Spiritual Authority',
  holy_spirit: 'Holy Spirit',
  prayer: 'Prayer',
  final_exam: 'Final Exam',
};

const SCORE_COLUMNS: ColumnDef[] = CES_CURRICULUM.map((c) => ({
  match: c.code.replace(/_/g, ''),
  kind: 'score' as const,
  key: c.code,
  label: `${SHORT_NAMES[c.code] ?? c.title} (/${c.maxScore})`,
}));

const ATTENDANCE_COLUMNS: ColumnDef[] = [
  { match: 'elementaryprinciples', kind: 'attendance', key: 'Elementary Principles', label: 'Elementary Principles' },
  { match: 'membershipvision', kind: 'attendance', key: 'Membership & Vision Class', label: 'Membership & Vision' },
];

const DATA_COLUMNS = [...SCORE_COLUMNS, ...ATTENDANCE_COLUMNS];
const MATRIC_HEADINGS = ['matricno', 'matriculationno', 'matricnumber', 'matriculationnumber', 'matric'];
const MATRIC_FORMAT = /^CES\/ILR\/\d{2}[A-Z]\d{2,}$/;
const EMPTY_TOKENS = new Set(['', '-', '–', '—', 'n/a', 'na', 'not recorded', 'pending']);

export interface ParsedImportRow {
  /** Row number as shown in Excel, so staff can find it. */
  rowNumber: number;
  matricNo: string;
  scores: Record<string, number>;
  attendance: Record<string, ImportAttendance>;
  errors: string[];
}

export interface ParsedSheet {
  rows: ParsedImportRow[];
  fileErrors: string[];
  /** Data columns the file contains (labels), for the preview. */
  columnsFound: string[];
}

const lettersOnly = (v: unknown) => String(v ?? '').toLowerCase().replace(/[^a-z]/g, '');

function emptyCell(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  return typeof v === 'string' && EMPTY_TOKENS.has(v.trim().toLowerCase());
}

function maxScoreFor(code: string): number {
  return CES_CURRICULUM.find((c) => c.code === code)?.maxScore ?? 0;
}

function readScore(v: unknown, code: string): { value?: number; error?: string } {
  const max = maxScoreFor(code);
  const n = typeof v === 'number' ? v : Number(String(v).trim());
  if (!Number.isFinite(n)) return { error: `${labelOf(code)}: "${String(v).trim()}" is not a number` };
  if (n < 0) return { error: `${labelOf(code)}: ${n} is below 0` };
  if (n > max) return { error: `${labelOf(code)}: ${n} is above the maximum of ${max}` };
  return { value: Math.round(n * 100) / 100 };
}

function labelOf(key: string): string {
  return DATA_COLUMNS.find((c) => c.key === key)?.label ?? key;
}

function readAttendance(v: unknown, key: string): { value?: ImportAttendance; error?: string } {
  const t = String(v).trim().toLowerCase();
  if (t === 'attended') return { value: 'Attended' };
  if (t === 'not attended') return { value: 'Not Attended' };
  if (t === 'excused') return { value: 'Excused' };
  return { error: `${labelOf(key)}: "${String(v).trim()}" must be Attended, Not Attended or Excused` };
}

/** Checks the uploaded file before it is parsed. Returns an error message or null. */
export function checkUploadedFile(name: string, size: number, bytes: Uint8Array): string | null {
  if (!name.toLowerCase().endsWith('.xlsx')) return 'Please upload an Excel file ending in .xlsx.';
  if (size === 0) return 'The file is empty.';
  if (size > MAX_IMPORT_BYTES) return 'The file is too large (limit 2 MB).';
  // .xlsx is a zip archive: it starts with "PK"
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) return 'This does not look like a real .xlsx file.';
  return null;
}

/** Reads the first sheet of the workbook into rows of cells. */
export function readFirstSheet(bytes: Uint8Array): unknown[][] {
  const wb = XLSX.read(bytes, { type: 'array', sheetRows: MAX_IMPORT_ROWS + HEADER_SEARCH_ROWS + 50 });
  const first = wb.SheetNames[0];
  if (!first) return [];
  return XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[first], { header: 1, raw: true, defval: null, blankrows: true });
}

/** Turns the sheet's cells into checked rows. */
export function parseImportSheet(cells: unknown[][]): ParsedSheet {
  const fileErrors: string[] = [];

  // Find the heading row (the broadsheet export has title lines above it)
  let headerIdx = -1;
  let matricCol = -1;
  for (let i = 0; i < Math.min(cells.length, HEADER_SEARCH_ROWS); i++) {
    const idx = (cells[i] ?? []).findIndex((c) => MATRIC_HEADINGS.includes(lettersOnly(c)));
    if (idx >= 0) {
      headerIdx = i;
      matricCol = idx;
      break;
    }
  }
  if (headerIdx < 0) {
    return { rows: [], columnsFound: [], fileErrors: ['Could not find a "Matric No" column in the first rows of the sheet.'] };
  }

  const colOf = new Map<number, ColumnDef>();
  (cells[headerIdx] ?? []).forEach((c, idx) => {
    const norm = lettersOnly(c);
    if (!norm || idx === matricCol) return;
    const def = DATA_COLUMNS.find((d) => norm.startsWith(d.match));
    if (!def) return; // S/N, Full Name, totals, honour class, etc. are ignored
    if (Array.from(colOf.values()).some((d) => d.key === def.key)) {
      fileErrors.push(`The column "${def.label}" appears more than once.`);
      return;
    }
    colOf.set(idx, def);
  });
  if (colOf.size === 0) {
    fileErrors.push('No score or attendance columns were found. Use the template for the exact headings.');
  }

  const rows: ParsedImportRow[] = [];
  for (let i = headerIdx + 1; i < cells.length; i++) {
    const line = cells[i] ?? [];
    if (line.every((c) => emptyCell(c))) continue;

    const rawMatric = line[matricCol];
    const matricNo = String(rawMatric ?? '').replace(/\s+/g, '').toUpperCase();
    const row: ParsedImportRow = { rowNumber: i + 1, matricNo, scores: {}, attendance: {}, errors: [] };

    if (!matricNo) row.errors.push('Matric number is missing');
    else if (!MATRIC_FORMAT.test(matricNo)) row.errors.push(`"${String(rawMatric).trim()}" is not a valid matric number`);

    for (const [idx, def] of Array.from(colOf.entries())) {
      const v = line[idx];
      if (emptyCell(v)) continue;
      if (def.kind === 'score') {
        const r = readScore(v, def.key);
        if (r.error) row.errors.push(r.error);
        else if (r.value !== undefined) row.scores[def.key] = r.value;
      } else {
        const r = readAttendance(v, def.key);
        if (r.error) row.errors.push(r.error);
        else if (r.value) row.attendance[def.key] = r.value;
      }
    }
    rows.push(row);
  }

  if (rows.length > MAX_IMPORT_ROWS) {
    fileErrors.push(`The file has more than ${MAX_IMPORT_ROWS.toLocaleString()} student rows. Split it into smaller files.`);
  }

  // The same student twice is ambiguous, so every copy is rejected
  const byMatric = new Map<string, ParsedImportRow[]>();
  for (const r of rows) {
    if (!r.matricNo) continue;
    byMatric.set(r.matricNo, [...(byMatric.get(r.matricNo) ?? []), r]);
  }
  for (const group of Array.from(byMatric.values())) {
    if (group.length > 1) {
      const where = group.map((g) => g.rowNumber).join(', ');
      for (const r of group) r.errors.push(`Appears ${group.length} times in the file (rows ${where})`);
    }
  }

  return { rows, fileErrors, columnsFound: Array.from(colOf.values()).map((d) => d.label) };
}

/** Blank import template with the same column headings as the broadsheet export. */
export function buildImportTemplateWorkbook(): { workbook: XLSX.WorkBook; filename: string } {
  const wb = XLSX.utils.book_new();
  const headings = ['Matric No', ...SCORE_COLUMNS.map((c) => c.label), ...ATTENDANCE_COLUMNS.map((c) => c.label)];
  const ws = XLSX.utils.aoa_to_sheet([headings]);
  ws['!cols'] = headings.map((h, i) => ({ wch: i === 0 ? 20 : Math.max(14, h.length + 2) }));
  XLSX.utils.book_append_sheet(wb, ws, 'Results');

  const help = XLSX.utils.aoa_to_sheet([
    ['How to fill this template'],
    ['1. One student per row, starting under the headings. Use the full matric number, e.g. CES/ILR/26H801.'],
    ['2. Quiz scores are 0 to 5. The Final Exam is 0 to 60. Decimals are fine (e.g. 4.5).'],
    ['3. Elementary Principles and Membership & Vision: type Attended, Not Attended or Excused.'],
    ['4. Leave a cell blank to keep the student\'s existing value. Totals and honour class are worked out by the portal.'],
    ['5. You can also upload a broadsheet export: its extra columns (name, totals, honour class) are ignored.'],
    ['6. Upload at most 1,000 students per file. Nothing is saved until you confirm on the preview page.'],
  ]);
  help['!cols'] = [{ wch: 110 }];
  XLSX.utils.book_append_sheet(wb, help, 'Instructions');
  return { workbook: wb, filename: 'CES_Results_Import_Template.xlsx' };
}
