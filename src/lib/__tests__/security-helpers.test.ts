import { describe, it, expect } from 'vitest';
import { safeRedirectTarget } from '../safe-redirect';
import { parseReceipt } from '../registration-receipt';

describe('safeRedirectTarget (open redirect guard)', () => {
  it('keeps normal in-site paths, including query strings', () => {
    expect(safeRedirectTarget('/admin/broadsheet')).toBe('/admin/broadsheet');
    expect(safeRedirectTarget('/certificate/CES%2FILR%2F26J1005?x=1')).toBe('/certificate/CES%2FILR%2F26J1005?x=1');
  });

  it('falls back for empty values', () => {
    expect(safeRedirectTarget(null)).toBe('/admin/gradebook');
    expect(safeRedirectTarget('')).toBe('/admin/gradebook');
  });

  it('rejects absolute, protocol-relative and scheme URLs', () => {
    for (const bad of [
      'https://evil.example',
      'http://evil.example/x',
      '//evil.example',
      '///evil.example',
      '/\\evil.example',
      '\\\\evil.example',
      'javascript:alert(1)',
      'evil.example',
      '/ok\nbad',
    ]) {
      expect(safeRedirectTarget(bad)).toBe('/admin/gradebook');
    }
  });

  it('uses a custom fallback', () => {
    expect(safeRedirectTarget('https://x.y', '/home')).toBe('/home');
  });
});

describe('parseReceipt (success-page cookie)', () => {
  it('parses a valid receipt', () => {
    const raw = JSON.stringify({ matricNo: 'CES/ILR/26J1006', studentName: 'A B', cohortType: 'Regular' });
    expect(parseReceipt(raw)).toEqual({ matricNo: 'CES/ILR/26J1006', studentName: 'A B', cohortType: 'Regular' });
  });

  it('returns null for missing, malformed or incomplete values', () => {
    expect(parseReceipt(undefined)).toBeNull();
    expect(parseReceipt('')).toBeNull();
    expect(parseReceipt('not json')).toBeNull();
    expect(parseReceipt(JSON.stringify({ matricNo: 'x' }))).toBeNull();
    expect(parseReceipt(JSON.stringify({ matricNo: 1, studentName: 2, cohortType: 3 }))).toBeNull();
  });
});
