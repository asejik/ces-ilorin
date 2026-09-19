import { z } from 'zod';

export const studentRegistrationSchema = z.object({
  surname: z.string().min(2, 'Surname must be at least 2 characters'),
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  middle_name: z.string().optional().nullable(),
  phone_number: z.string().min(8, 'Valid phone number is required'),
  whatsapp_number: z.string().optional().nullable(),
  email_address: z.string().email('Valid email address is required'),
  permanent_address: z.string().optional().nullable(),
  gender: z.enum(['Male', 'Female'], {
    errorMap: () => ({ message: 'Please select a gender' }),
  }),
  marital_status: z.enum(['Single', 'Married', 'Widowed', 'Divorced'], {
    errorMap: () => ({ message: 'Please select a marital status' }),
  }),
  educational_level: z.string().optional().nullable(),
  born_again: z.enum(['Yes', 'No'], {
    errorMap: () => ({ message: 'Please indicate if you are born again' }),
  }),
  baptised_hs: z.enum(['Yes', 'No'], {
    errorMap: () => ({ message: 'Please indicate if you are baptised in the Holy Spirit' }),
  }),
  unit_of_interest: z.string().optional().nullable(),
  years_as_christian: z.string().optional().nullable(),
  previously_served: z.string().optional().nullable(),
  prev_service_details: z.string().optional().nullable(),
  gifts_skills: z.string().optional().nullable(),
  attended_mem_vision: z.enum(['Yes', 'No'], {
    errorMap: () => ({ message: 'Please indicate if you attended Membership & Vision class' }),
  }),
  committed_to_programme: z.enum(['Yes', 'No'], {
    errorMap: () => ({ message: 'Please confirm commitment to the programme' }),
  }),
  comments_enquiries: z.string().optional().nullable(),
  cohort_type: z.enum(['Regular', 'Sunday Cohort'], {
    errorMap: () => ({ message: 'Please select a cohort type' }),
  }),
  occupation: z.string().optional().nullable(),
  emergency_contact: z.string().optional().nullable(),
  emergency_contact_phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  ndpa_consent: z.string().optional().nullable(),
});

export type StudentRegistrationInput = z.infer<typeof studentRegistrationSchema>;

/**
 * Validates uploaded passport photo
 */
export function validatePassportFile(file: File | null): { valid: boolean; error?: string } {
  if (!file || file.size === 0) {
    return { valid: true }; // Optional on initial intake, can be added later
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Passport photo must be a JPG, PNG, or WebP image.' };
  }

  const maxBytes = 3 * 1024 * 1024; // 3MB limit
  if (file.size > maxBytes) {
    return { valid: false, error: 'Passport photo must be under 3MB.' };
  }

  return { valid: true };
}
