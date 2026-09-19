import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface StaffUser {
  id: string;
  email: string;
  fullName: string;
  role: 'super_admin' | 'ces_admin' | 'ces_teacher';
}

/**
 * Validates that the active request originates from an authenticated CES staff member.
 * Throws an Error with 401/403 status message if unauthenticated or unauthorized.
 */
export async function requireStaffUser(
  allowedRoles?: Array<'super_admin' | 'ces_admin' | 'ces_teacher'>
): Promise<StaffUser> {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized: Staff session required.');
  }

  // Verify staff role in ces_staff_profiles using service client
  const adminClient = createAdminClient();
  const { data: staff, error: staffError } = await adminClient
    .from('ces_staff_profiles')
    .select('id, email, full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  if (staffError || !staff) {
    throw new Error('Forbidden: Active staff profile not found.');
  }

  const role = staff.role as 'super_admin' | 'ces_admin' | 'ces_teacher';
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    throw new Error(`Forbidden: Insufficient privileges. Required: ${allowedRoles.join(', ')}.`);
  }

  return {
    id: staff.id,
    email: staff.email,
    fullName: staff.full_name,
    role,
  };
}

/**
 * Non-throwing helper that returns the authenticated staff user or null.
 */
export async function getStaffUser(): Promise<StaffUser | null> {
  try {
    return await requireStaffUser();
  } catch {
    return null;
  }
}
