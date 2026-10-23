'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { failWith } from '@/lib/errors';
import { lagosDateParts } from '@/lib/lagos-time';
import { CONSENT_VERSION } from '@/lib/consent';
import { cookies } from 'next/headers';
import { RECEIPT_COOKIE, RECEIPT_MAX_AGE_SECONDS } from '@/lib/registration-receipt';
import {
  studentRegistrationSchema,
  validatePassportFile,
  validateImageBuffer,
} from '@/lib/validation/registration';
import { randomUUID } from 'crypto';
import { generateMatricNumber } from '@/lib/academic';
import { PASSPORT_BUCKET } from '@/lib/passport-photos';
import { getClientIp, TOO_MANY_ATTEMPTS, withinRateLimit } from '@/lib/rate-limit';
import { sendWelcomeEmail } from '@/lib/email';

export interface RegisterActionResult {
  success: boolean;
  matricNo?: string;
  studentName?: string;
  cohortType?: string;
  error?: string;
}

export async function registerStudentAction(formData: FormData): Promise<RegisterActionResult> {
  try {
    const rawData = {
      surname: formData.get('surname') as string,
      first_name: formData.get('first_name') as string,
      middle_name: (formData.get('middle_name') as string) || null,
      phone_number: formData.get('phone_number') as string,
      whatsapp_number: (formData.get('whatsapp_number') as string) || null,
      email_address: formData.get('email_address') as string,
      permanent_address: (formData.get('permanent_address') as string) || null,
      gender: formData.get('gender') as string,
      marital_status: formData.get('marital_status') as string,
      educational_level: (formData.get('educational_level') as string) || null,
      born_again: formData.get('born_again') as string,
      baptised_hs: formData.get('baptised_hs') as string,
      unit_of_interest: (formData.get('unit_of_interest') as string) || null,
      years_as_christian: (formData.get('years_as_christian') as string) || null,
      previously_served: (formData.get('previously_served') as string) || null,
      prev_service_details: (formData.get('prev_service_details') as string) || null,
      gifts_skills: (formData.get('gifts_skills') as string) || null,
      attended_mem_vision: formData.get('attended_mem_vision') as string,
      committed_to_programme: formData.get('committed_to_programme') as string,
      comments_enquiries: (formData.get('comments_enquiries') as string) || null,
      cohort_type: formData.get('cohort_type') as string,
      occupation: (formData.get('occupation') as string) || null,
      emergency_contact: (formData.get('emergency_contact') as string) || null,
      emergency_contact_phone: (formData.get('emergency_contact_phone') as string) || null,
      notes: (formData.get('notes') as string) || null,
      ndpa_consent: (formData.get('ndpa_consent') as string) || null,
    };

    // 1. Zod Validation
    const parseResult = studentRegistrationSchema.safeParse(rawData);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || 'Invalid form input';
      return { success: false, error: firstError };
    }

    const validatedData = parseResult.data;

    // 2. Validate Passport Photo File
    const passportFile = formData.get('passport_file') as File | null;
    const fileValidation = validatePassportFile(passportFile);
    if (!fileValidation.valid) {
      return { success: false, error: fileValidation.error };
    }

    // Use administrative client for server-side registration operations
    const supabase = createAdminClient();

    // Throttle mass sign-ups (welcome emails go out from the church address)
    if (!(await withinRateLimit(supabase, `register:ip:${await getClientIp()}`, 100, 3600))) {
      return { success: false, error: TOO_MANY_ATTEMPTS };
    }

    // 3. Resolve or Create Active Semester for this Cohort Type
    // Nigerian calendar date (the server runs in UTC) so the matric month is right at month boundaries
    const { year: currentYear, month: currentMonth } = lagosDateParts();

    let semesterId: string;
    const { data: existingSemester, error: semFetchErr } = await supabase
      .from('ces_semesters')
      .select('id')
      .eq('type', validatedData.cohort_type)
      .eq('is_active', true)
      .maybeSingle();

    if (semFetchErr) {
      console.error('[Registration] Error querying active semester:', semFetchErr);
    }

    if (existingSemester) {
      semesterId = existingSemester.id;
    } else {
      // Auto-create active default semester if none exists
      const semesterName =
        validatedData.cohort_type === 'Sunday Cohort'
          ? `Sunday Cohort — ${currentYear}`
          : `Regular Cohort — ${currentYear}`;

      const { data: newSemester, error: semErr } = await supabase
        .from('ces_semesters')
        .insert({
          name: semesterName,
          type: validatedData.cohort_type,
          year: currentYear,
          is_active: true,
          notes: `Auto-initialized for ${validatedData.cohort_type}`,
        })
        .select('id')
        .single();

      if (semErr || !newSemester) {
        console.error('[Registration] Failed to resolve or initialize active cohort semester:', semErr);
        return {
          success: false,
          error: `Unable to assign an active semester for cohort "${validatedData.cohort_type}". Please contact administration.`,
        };
      }
      semesterId = newSemester.id;
    }

    // One registration per email address per semester. Checked before a matric number is
    // issued or a photo uploaded, so a repeat attempt wastes neither.
    const normalizedEmail = validatedData.email_address.trim().toLowerCase();
    const { data: existingStudent } = await supabase
      .from('ces_students')
      .select('id')
      .eq('email_address', normalizedEmail)
      .eq('semester_id', semesterId)
      .eq('is_deleted', false)
      .limit(1)
      .maybeSingle();
    if (existingStudent) {
      return {
        success: false,
        error:
          'This email address is already registered for this cohort. Please check your inbox (and spam folder) for your matric number, or contact the school office.',
      };
    }

    // 4. Calculate Next Sequence & Generate Matriculation Number
    // Atomic per-month counter (ces_next_matric_seq): safe under concurrent registrations
    // and never reuses a number after a student is deleted.
    const { data: sequence, error: seqErr } = await supabase.rpc('ces_next_matric_seq', {
      p_year: currentYear,
      p_month: currentMonth,
    });
    if (seqErr || typeof sequence !== 'number') {
      console.error('[Registration] Matric sequence error:', seqErr);
      return { success: false, error: 'Unable to generate a matric number. Please try again shortly.' };
    }
    const matricNo = generateMatricNumber({
      year: currentYear,
      month: currentMonth,
      sequence,
    });

    // 5. Upload Passport Photo to Supabase Storage (if provided)
    let passportUrl: string | null = null;
    if (passportFile && passportFile.size > 0) {
      try {
        const arrayBuffer = await passportFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Verify magic bytes signatures and determine canonical extension
        const bufferValidation = validateImageBuffer(buffer, passportFile.type);
        if (!bufferValidation.valid || !bufferValidation.ext) {
          return { success: false, error: bufferValidation.error || 'Invalid image file content.' };
        }

        const safeExt = bufferValidation.ext;
        // Private bucket + unguessable name: the stored value is a storage path, not a URL.
        const filePath = `passports/${randomUUID()}.${safeExt}`;

        const { error: uploadErr } = await supabase.storage
          .from(PASSPORT_BUCKET)
          .upload(filePath, buffer, {
            contentType: passportFile.type,
            upsert: false,
          });

        if (!uploadErr) {
          passportUrl = filePath;
        }
      } catch (uploadErr) {
        console.warn('[Storage] Photo upload failed, continuing with registration:', uploadErr);
      }
    }

    // 6. Insert Student Record
    const studentRecord = {
      semester_id: semesterId,
      matric_no: matricNo,
      surname: validatedData.surname.trim(),
      first_name: validatedData.first_name.trim(),
      middle_name: validatedData.middle_name?.trim() || null,
      phone_number: validatedData.phone_number.trim(),
      whatsapp_number: validatedData.whatsapp_number?.trim() || null,
      email_address: validatedData.email_address.trim().toLowerCase(),
      permanent_address: validatedData.permanent_address?.trim() || null,
      gender: validatedData.gender,
      marital_status: validatedData.marital_status,
      educational_level: validatedData.educational_level || null,
      born_again: validatedData.born_again,
      baptised_hs: validatedData.baptised_hs,
      unit_of_interest: validatedData.unit_of_interest || null,
      years_as_christian: validatedData.years_as_christian || null,
      previously_served: validatedData.previously_served || null,
      prev_service_details: validatedData.prev_service_details || null,
      gifts_skills: validatedData.gifts_skills || null,
      attended_mem_vision: validatedData.attended_mem_vision,
      committed_to_programme: validatedData.committed_to_programme,
      comments_enquiries: validatedData.comments_enquiries || null,
      cohort_type: validatedData.cohort_type,
      status: 'Active',
      occupation: validatedData.occupation || null,
      emergency_contact: validatedData.emergency_contact || null,
      emergency_contact_phone: validatedData.emergency_contact_phone || null,
      notes: validatedData.notes || null,
      passport_url: passportUrl,
      consent_at: new Date().toISOString(),
      consent_version: CONSENT_VERSION,
    };

    const { error: insertErr } = await supabase.from('ces_students').insert(studentRecord);
    if (insertErr) {
      console.error('[Registration] Database insert error:', insertErr);
      if (insertErr.code === '23505') {
        if (insertErr.message.includes('uq_ces_students_email_semester')) {
          return {
            success: false,
            error: 'This email address is already registered for this cohort. Please check your inbox for your matric number.',
          };
        }
        return { success: false, error: 'Registration could not be completed. Please try again.' };
      }
      if (insertErr.code === '23503') {
        return { success: false, error: 'Referenced cohort semester does not exist in database.' };
      }
      if (insertErr.code === '42501') {
        return { success: false, error: 'Database permission denied. Ensure database role grants have been executed.' };
      }
      return failWith('register', insertErr, 'Database save error. Please try again.');
    }

    // 7. Dispatch Automated Welcome Email
    const fullName = `${validatedData.first_name} ${validatedData.surname}`;
    const emailResult = await sendWelcomeEmail({
      to: validatedData.email_address,
      studentName: fullName,
      matricNo,
      cohortType: validatedData.cohort_type,
    });

    // Record the outcome so staff can see who never received their matric number.
    const { error: statusErr } = await supabase
      .from('ces_students')
      .update({
        email_status: emailResult.status,
        email_sent_at: emailResult.status === 'sent' ? new Date().toISOString() : null,
      })
      .eq('matric_no', matricNo);
    if (statusErr) {
      console.error('[Registration] could not record email status:', statusErr.message);
    }

    // Keep the name and matric number out of the URL: hand them to the success page
    // through a short-lived, server-only cookie instead.
    (await cookies()).set(
      RECEIPT_COOKIE,
      JSON.stringify({ matricNo, studentName: fullName, cohortType: validatedData.cohort_type }),
      {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/register',
        maxAge: RECEIPT_MAX_AGE_SECONDS,
      }
    );

    return {
      success: true,
      matricNo,
      studentName: fullName,
      cohortType: validatedData.cohort_type,
    };
  } catch (err: unknown) {
    return failWith('register', err, 'Registration could not be completed. Please try again.');
  }
}
