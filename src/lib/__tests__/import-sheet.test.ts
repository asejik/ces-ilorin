import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import {
  buildImportTemplateWorkbook,
  checkUploadedFile,
  parseImportSheet,
  readFirstSheet,
} from '../import-sheet';

const HEAD = ['Matric No', 'Salvation (/5)', 'Prayer (/5)', 'Final Exam (/60)', 'Elementary Principles', 'Membership & Vision'];

describe('parseImportSheet', () => {
  it('reads scores and attendance and ignores blanks and placeholders', () => {
    const out = parseImportSheet([HEAD, ['ces/ilr/26h801', 4.5, '-', 55, 'Attended', null]]);
    expect(out.fileErrors).toEqual([]);
    expect(out.rows).toHaveLength(1);
    expect(out.rows[0]).toMatchObject({
      rowNumber: 2,
      matricNo: 'CES/ILR/26H801',
      scores: { salvation: 4.5, final_exam: 55 },
      attendance: { 'Elementary Principles': 'Attended' },
      errors: [],
    });
  });

  it('finds the heading row under the broadsheet export title lines and ignores computed columns', () => {
    const cells = [
      ['CITIZENS OF LIGHT CHURCH'],
      [],
      ['S/N', 'Matriculation No', 'Full Name', 'Salvation (/5)', 'Quiz Total (/40)', 'Cumulative Total (/100)', 'Honour Class'],
      [1, 'CES/ILR/26H801', 'Ada Obi', 3, 30, 80, 'Merit'],
    ];
    const out = parseImportSheet(cells);
    expect(out.fileErrors).toEqual([]);
    expect(out.rows[0].rowNumber).toBe(4);
    expect(out.rows[0].scores).toEqual({ salvation: 3 });
  });

  it('flags scores over the maximum, negatives, text and bad attendance', () => {
    const out = parseImportSheet([
      HEAD,
      ['CES/ILR/26H801', 6, 'abc', 61, 'Maybe', 'Attended'],
      ['CES/ILR/26H802', -1, 5, 60, 'Excused', 'Not Attended'],
    ]);
    expect(out.rows[0].errors).toHaveLength(4);
    expect(out.rows[0].errors.join(' ')).toMatch(/above the maximum of 5/);
    expect(out.rows[0].errors.join(' ')).toMatch(/not a number/);
    expect(out.rows[0].errors.join(' ')).toMatch(/must be Attended/);
    expect(out.rows[1].errors).toHaveLength(1);
    expect(out.rows[1].scores).toEqual({ prayer: 5, final_exam: 60 });
  });

  it('rejects every copy of a duplicated matric number', () => {
    const out = parseImportSheet([HEAD, ['CES/ILR/26H801', 1], ['CES/ILR/26H801', 2], ['CES/ILR/26H802', 3]]);
    expect(out.rows[0].errors[0]).toMatch(/2 times.*rows 2, 3/);
    expect(out.rows[1].errors[0]).toMatch(/2 times/);
    expect(out.rows[2].errors).toEqual([]);
  });

  it('flags missing and malformed matric numbers', () => {
    const out = parseImportSheet([HEAD, [null, 3], ['26H801', 3]]);
    expect(out.rows[0].errors[0]).toMatch(/missing/);
    expect(out.rows[1].errors[0]).toMatch(/not a valid matric/);
  });

  it('reports a missing matric column or no data columns', () => {
    expect(parseImportSheet([['Name', 'Salvation']]).fileErrors[0]).toMatch(/Matric No/);
    expect(parseImportSheet([['Matric No', 'Notes']]).fileErrors[0]).toMatch(/No score or attendance/);
  });

  it('limits the number of student rows', () => {
    const rows = Array.from({ length: 1001 }, (_, i) => [`CES/ILR/26H${800 + i}`, 3]);
    expect(parseImportSheet([HEAD, ...rows]).fileErrors.join(' ')).toMatch(/more than 1,000/);
  });
});

describe('template and file checks', () => {
  it('the template round-trips through the parser', () => {
    const { workbook } = buildImportTemplateWorkbook();
    const bytes = new Uint8Array(XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }));
    const sheet = parseImportSheet(readFirstSheet(bytes));
    expect(sheet.fileErrors).toEqual([]);
    expect(sheet.columnsFound).toHaveLength(11);
    expect(sheet.rows).toEqual([]);
  });

  it('accepts only real .xlsx files within the size limit', () => {
    const zip = new Uint8Array([0x50, 0x4b, 3, 4]);
    expect(checkUploadedFile('a.xlsx', 100, zip)).toBeNull();
    expect(checkUploadedFile('a.csv', 100, zip)).toMatch(/\.xlsx/);
    expect(checkUploadedFile('a.xlsx', 0, zip)).toMatch(/empty/);
    expect(checkUploadedFile('a.xlsx', 3 * 1024 * 1024, zip)).toMatch(/too large/);
    expect(checkUploadedFile('a.xlsx', 100, new Uint8Array([1, 2, 3]))).toMatch(/real/);
  });
});
