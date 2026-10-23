import type { SupabaseClient } from '@supabase/supabase-js';
import type { StaffUser } from '@/lib/auth/guard';

export interface AuditEntry {
  action: 'score_override' | 'attendance_override';
  studentId: string;
  targetTable: 'ces_student_assessments' | 'ces_attendance_records';
  targetId?: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown>;
  reason?: string | null;
}

/**
 * Appends a row to the append-only ces_audit_log. Returns false if it could not be written
 * (the caller reports that to staff so the change can be retried and logged).
 */
export async function writeAuditLog(
  supabase: SupabaseClient,
  staff: StaffUser,
  entry: AuditEntry
): Promise<boolean> {
  const { error } = await supabase.from('ces_audit_log').insert({
    actor_id: staff.id,
    actor_email: staff.email,
    action: entry.action,
    student_id: entry.studentId,
    target_table: entry.targetTable,
    target_id: entry.targetId ?? null,
    old_value: entry.oldValue,
    new_value: entry.newValue,
    reason: entry.reason ?? null,
  });
  if (error) {
    console.error('[Audit] failed to write audit log entry:', error.message);
    return false;
  }
  return true;
}

export const AUDIT_FAILED_MESSAGE =
  'The change was saved but the audit record could not be written. Please repeat the action once so it is logged.';
