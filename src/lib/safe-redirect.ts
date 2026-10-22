/**
 * Only allow redirects to a path on this site. Rejects absolute URLs, protocol-relative
 * URLs (//host), backslash tricks and anything not starting with a single "/".
 */
export function safeRedirectTarget(raw: string | null | undefined, fallback = '/admin/gradebook'): string {
  if (!raw) return fallback;
  const value = raw.trim();
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  return value;
}
