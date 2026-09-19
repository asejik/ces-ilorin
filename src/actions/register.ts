'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { studentRegistrationSchema, validatePassportFile } from '@/lib/validation/registration';
import { generateMatricNumber } from '@/lib/academic';
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

    // 3. Resolve or Create Active Semester for this Cohort Type
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-12

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

    // 4. Calculate Next Sequence & Generate Matriculation Number
    // Query count of existing students registered this year & month
    const { count } = await supabase
      .from('ces_students')
      .select('id', { count: 'exact', head: true });

    const sequence = (count || 0) + 1;
    const matricNo = generateMatricNumber({
      year: currentYear,
      month: currentMonth,
      sequence,
    });

    // 5. Upload Passport Photo to Supabase Storage (if provided)
    let passportUrl: string | null = null;
    if (passportFile && passportFile.size > 0) {
      try {
        const fileExt = passportFile.name.split('.').pop() || 'jpg';
        const filePath = `passports/${matricNo.replace(/\//g, '_')}.${fileExt}`;
        const arrayBuffer = await passportFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadErr } = await supabase.storage
          .from('ces-assets')
          .upload(filePath, buffer, {
            contentType: passportFile.type,
            upsert: true,
            cacheControl: '31536000',
          });

        if (!uploadErr) {
          const { data: publicUrlData } = supabase.storage
            .from('ces-assets')
            .getPublicUrl(filePath);
          passportUrl = publicUrlData?.publicUrl || null;
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
    };

    // Abuse Deterrence: prevent duplicate rapid submissions for the same email within 60s
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: recentRegistration } = await supabase
      .from('ces_students')
      .select('matric_no')
      .eq('email_address', validatedData.email_address.trim().toLowerCase())
      .gte('created_at', oneMinuteAgo)
      .maybeSingle();

    if (recentRegistration) {
      return {
        success: false,
        error: 'A registration for this email address was received recently. Please check your email or wait before retrying.',
      };
    }

    const { error: insertErr } = await supabase.from('ces_students').insert(studentRecord);
    if (insertErr) {
      console.error('[Registration] Database insert error:', insertErr);
      if (insertErr.code === '23505') {
        return { success: false, error: 'A student with this matric number or email already exists.' };
      }
      if (insertErr.code === '23503') {
        return { success: false, error: 'Referenced cohort semester does not exist in database.' };
      }
      if (insertErr.code === '42501') {
        return { success: false, error: 'Database permission denied. Ensure database role grants have been executed.' };
      }
      return { success: false, error: `Database save error: ${insertErr.message}` };
    }

    // 7. Dispatch Automated Welcome Email
    const fullName = `${validatedData.first_name} ${validatedData.surname}`;
    await sendWelcomeEmail({
      to: validatedData.email_address,
      studentName: fullName,
      matricNo,
      cohortType: validatedData.cohort_type,
    });

    return {
      success: true,
      matricNo,
      studentName: fullName,
      cohortType: validatedData.cohort_type,
    };
  } catch (err: unknown) {
    console.error('[Registration Action Error]:', err);
    const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
    return { success: false, error: errorMsg };
  }
}
