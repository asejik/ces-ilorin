import type { HonourClass } from '@/types/database';

/**
 * Derives an official certificate number from the student's matriculation number.
 * Example: 'CES/ILR/26I901' -> 'CERT-CES-26I901'
 * Standard specified in PROJECT_PLAN.md: 'CERT-CES-YY[Month][Seq]'
 */
export function generateCertificateNumber(matricNo: string): string {
  if (!matricNo || typeof matricNo !== 'string') {
    throw new Error('Valid matriculation number is required to generate certificate number');
  }

  const cleaned = matricNo.trim().toUpperCase();
  const parts = cleaned.split('/');

  // If format is CES/ILR/26I901, take the last segment
  if (parts.length >= 3) {
    const suffix = parts[parts.length - 1].replace(/[^A-Z0-9]/g, '');
    return `CERT-CES-${suffix}`;
  }

  // Fallback: strip any non-alphanumeric and keep last 6-8 chars
  const alphanumeric = cleaned.replace(/[^A-Z0-9]/g, '');
  const suffix = alphanumeric.length > 6 ? alphanumeric.slice(-6) : alphanumeric;
  return `CERT-CES-${suffix}`;
}

/**
 * Returns ordinal suffix for a day of the month (e.g. 1st, 2nd, 3rd, 4th, 21st).
 */
function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return 'th';
  }
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

/**
 * Formats a date for official academic certificates:
 * e.g., '19th September, 2026'
 */
export function formatCertificateDate(input: Date | string): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(date.getTime())) {
    return '19th September, 2026';
  }

  const day = date.getDate();
  const suffix = getOrdinalSuffix(day);
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();

  return `${day}${suffix} ${month}, ${year}`;
}

export interface HonourBadgeInfo {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  sealColor: string;
  isFoil: boolean;
  description: string;
}

/**
 * Provides styling and metadata tokens for honour classes on certificates.
 */
export function getHonourBadgeDetails(honourClass: HonourClass | null): HonourBadgeInfo {
  switch (honourClass) {
    case 'Distinction':
      return {
        label: 'DISTINCTION',
        badgeBg: 'bg-amber-100',
        badgeText: 'text-amber-900',
        badgeBorder: 'border-amber-400',
        sealColor: 'from-amber-400 via-yellow-300 to-amber-500',
        isFoil: true,
        description: 'Graduated with Highest Academic Distinction (≥ 85%)',
      };
    case 'Merit':
      return {
        label: 'MERIT',
        badgeBg: 'bg-blue-100',
        badgeText: 'text-blue-900',
        badgeBorder: 'border-blue-400',
        sealColor: 'from-blue-400 via-indigo-300 to-blue-600',
        isFoil: false,
        description: 'Graduated with High Academic Merit (75% – 84.9%)',
      };
    case 'Pass':
      return {
        label: 'PASS',
        badgeBg: 'bg-emerald-100',
        badgeText: 'text-emerald-900',
        badgeBorder: 'border-emerald-400',
        sealColor: 'from-emerald-400 via-teal-300 to-emerald-600',
        isFoil: false,
        description: 'Successfully Cleared Curriculum Requirements (50% – 74.9%)',
      };
    default:
      return {
        label: 'BELOW PASS',
        badgeBg: 'bg-gray-100',
        badgeText: 'text-gray-700',
        badgeBorder: 'border-gray-300',
        sealColor: 'from-gray-300 via-gray-200 to-gray-400',
        isFoil: false,
        description: 'Academic clearance pending or below graduation pass threshold',
      };
  }
}
