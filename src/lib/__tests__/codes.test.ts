import { describe, it, expect } from 'vitest';
import { codesMatch, generateCode } from '../codes';

describe('class / session codes', () => {
  it('generates 6-character codes without ambiguous characters', () => {
    for (let i = 0; i < 200; i++) {
      expect(generateCode()).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
    }
  });

  it('generates different codes', () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateCode()));
    expect(codes.size).toBeGreaterThan(45);
  });

  it('matches case-insensitively and ignores surrounding spaces', () => {
    expect(codesMatch('AB12CD', ' ab12cd ')).toBe(true);
  });

  it('rejects wrong, empty and different-length codes', () => {
    expect(codesMatch('AB12CD', 'AB12CE')).toBe(false);
    expect(codesMatch('AB12CD', 'AB12C')).toBe(false);
    expect(codesMatch('AB12CD', '')).toBe(false);
    expect(codesMatch('', '')).toBe(false);
    expect(codesMatch(null, 'AB12CD')).toBe(false);
    expect(codesMatch('AB12CD', undefined)).toBe(false);
  });
});
