export const RECEIPT_COOKIE = 'ces_reg_receipt';
export const RECEIPT_MAX_AGE_SECONDS = 15 * 60;

export interface RegistrationReceipt {
  matricNo: string;
  studentName: string;
  cohortType: string;
}

/** Parses the receipt cookie value; returns null for anything malformed. */
export function parseReceipt(raw: string | undefined | null): RegistrationReceipt | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<RegistrationReceipt>;
    if (typeof v.matricNo === 'string' && typeof v.studentName === 'string' && typeof v.cohortType === 'string') {
      return { matricNo: v.matricNo, studentName: v.studentName, cohortType: v.cohortType };
    }
  } catch {
    /* fall through */
  }
  return null;
}
