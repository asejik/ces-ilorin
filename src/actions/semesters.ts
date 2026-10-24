'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { failWith } from '@/lib/errors';
import { fetchAll } from '@/lib/paginate';
import { ADMIN_ROLES, requireStaffUser } from '@/lib/auth/guard';
import { createSemesterSchema, type CreateSemesterInput } from '@/lib/validation/semester';

export interface SemesterItem {
  id: string;
  name: string;
  type: string;
  year: number;
  isActive: boolean;
  studentCount: number;
  createdAt: string;
}

interface Result {
  success: boolean;
  error?: string;
}

const NOT_ALLOWED = 'You are not allowed to manage semesters.';

async function guard(): Promise<boolean> {
  try {
    await requireStaffUser(ADMIN_ROLES);
    return true;
  } catch {
    return false;
  }
}

/** Admin: every semester with its student count, newest first. */
export async function listSemestersAction(): Promise<Result & { semesters?: SemesterItem[] }> {
  try {
    if (!(await guard())) return { success: false, error: NOT_ALLOWED };
    const supabase = createAdminClient();

    const { data: sems, error } = await supabase
      .from('ces_semesters')
      .select('id, name, type, year, is_active, created_at')
      .order('created_at', { ascending: false });
    if (error) return failWith('semesters', error, 'Could not load semesters.');

    const { data: studs, error: stuErr } = await fetchAll((from, to) =>
      supabase
        .from('ces_students')
        .select('id, semester_id')
        .eq('is_deleted', false)
        .order('id', { ascending: true })
        .range(from, to)
    );
    if (stuErr) return failWith('semesters', stuErr, 'Could not load semesters.');

    const counts = new Map<string, number>();
    for (const s of studs) counts.set(s.semester_id, (counts.get(s.semester_id) ?? 0) + 1);

    return {
      success: true,
      semesters: (sems ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        year: s.year,
        isActive: s.is_active,
        studentCount: counts.get(s.id) ?? 0,
        createdAt: s.created_at,
      })),
    };
  } catch (err: unknown) {
    return failWith('semesters', err, 'Could not load semesters.');
  }
}

/** Makes one semester the only active one for its cohort type. */
async function activate(id: string, type: string): Promise<Result> {
  const supabase = createAdminClient();
  const { error: offErr } = await supabase
    .from('ces_semesters')
    .update({ is_active: false })
    .eq('type', type)
    .eq('is_active', true)
    .neq('id', id);
  if (offErr) return failWith('semesters', offErr, 'Could not change the active semester.');
  const { error: onErr } = await supabase.from('ces_semesters').update({ is_active: true }).eq('id', id);
  if (onErr) return failWith('semesters', onErr, 'Could not change the active semester.');
  return { success: true };
}

export async function createSemesterAction(input: CreateSemesterInput): Promise<Result> {
  try {
    if (!(await guard())) return { success: false, error: NOT_ALLOWED };
    const parsed = createSemesterSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' };
    }
    const { name, type, year, makeActive } = parsed.data;
    const supabase = createAdminClient();

    const { data: dup } = await supabase
      .from('ces_semesters')
      .select('id')
      .eq('type', type)
      .ilike('name', name)
      .limit(1)
      .maybeSingle();
    if (dup) return { success: false, error: 'A semester with this name already exists for this cohort.' };

    const { data: created, error } = await supabase
      .from('ces_semesters')
      .insert({ name, type, year, is_active: false })
      .select('id')
      .single();
    if (error || !created) return failWith('semesters', error, 'Could not create the semester.');

    if (makeActive) return await activate(created.id, type);
    return { success: true };
  } catch (err: unknown) {
    return failWith('semesters', err, 'Could not create the semester.');
  }
}

export async function activateSemesterAction(id: string): Promise<Result> {
  try {
    if (!(await guard())) return { success: false, error: NOT_ALLOWED };
    const supabase = createAdminClient();
    const { data: sem } = await supabase.from('ces_semesters').select('id, type').eq('id', id).maybeSingle();
    if (!sem) return { success: false, error: 'Semester not found.' };
    return await activate(sem.id, sem.type);
  } catch (err: unknown) {
    return failWith('semesters', err, 'Could not change the active semester.');
  }
}

/** Closing leaves the cohort with no active semester, so registration for it pauses. */
export async function closeSemesterAction(id: string): Promise<Result> {
  try {
    if (!(await guard())) return { success: false, error: NOT_ALLOWED };
    const supabase = createAdminClient();
    const { error } = await supabase.from('ces_semesters').update({ is_active: false }).eq('id', id);
    if (error) return failWith('semesters', error, 'Could not close the semester.');
    return { success: true };
  } catch (err: unknown) {
    return failWith('semesters', err, 'Could not close the semester.');
  }
}
