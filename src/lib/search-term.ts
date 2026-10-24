/**
 * Makes free text safe to drop into a PostgREST `or(...)` / `ilike` filter.
 * Commas, parentheses, quotes, backslashes and the LIKE wildcards would otherwise change
 * the meaning of the filter. Returns null when too little is left to search on.
 */
export function sanitizeSearchTerm(raw: string, minLength = 2): string | null {
  const cleaned = raw
    .replace(/[,()"'\\%*_:;]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
  return cleaned.length >= minLength ? cleaned : null;
}
