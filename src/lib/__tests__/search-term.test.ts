import { describe, it, expect } from 'vitest';
import { sanitizeSearchTerm } from '../search-term';

describe('sanitizeSearchTerm', () => {
  it('keeps matric-style and name searches', () => {
    expect(sanitizeSearchTerm('CES/ILR/26J1001')).toBe('CES/ILR/26J1001');
    expect(sanitizeSearchTerm('  Ada   Obi ')).toBe('Ada Obi');
  });

  it('removes characters that could change the filter', () => {
    // underscore is a LIKE wildcard, so it is dropped too
    expect(sanitizeSearchTerm('a),is_deleted.eq.true,(b')).toBe('a is deleted.eq.true b');
    expect(sanitizeSearchTerm('50%_off\\')).toBe('50 off');
  });

  it('rejects searches that are too short or empty after cleaning', () => {
    expect(sanitizeSearchTerm('a')).toBeNull();
    expect(sanitizeSearchTerm('%%%')).toBeNull();
    expect(sanitizeSearchTerm('')).toBeNull();
  });

  it('limits length', () => {
    expect(sanitizeSearchTerm('x'.repeat(200))?.length).toBe(60);
  });
});
