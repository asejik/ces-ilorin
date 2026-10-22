import { describe, it, expect } from 'vitest';
import { safeRedirectTarget } from '../safe-redirect';

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
