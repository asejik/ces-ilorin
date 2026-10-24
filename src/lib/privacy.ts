/** Facts shown on the public privacy page. Change them here so the page and the data-request guide stay in step. */
export const RETENTION_YEARS = 5;
export const RESPONSE_DAYS = 30;

/** Set NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL in the hosting settings; until then the page points to the school office. */
export function privacyContactEmail(): string | null {
  const v = process.env.NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL?.trim();
  return v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : null;
}
