import { randomBytes, timingSafeEqual } from 'node:crypto';

/** Random 6-char code without ambiguous characters. Generated server-side only. */
export function generateCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(6);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

/** Case-insensitive, constant-time comparison of a typed code against the stored one. */
export function codesMatch(stored: string | null | undefined, typed: string | null | undefined): boolean {
  const a = Buffer.from((stored ?? '').trim().toUpperCase());
  const b = Buffer.from((typed ?? '').trim().toUpperCase());
  if (a.length === 0 || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
