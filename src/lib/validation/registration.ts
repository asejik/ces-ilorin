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

/**
 * Server-Side Image Buffer Validation:
 * Validates declared MIME type, verifies magic header bytes, and provides a safe extension.
 */
export function validateImageBuffer(
  buffer: Buffer,
  declaredType: string
): { valid: boolean; ext?: string; error?: string } {
  const MIME_MAP: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };

  const ext = MIME_MAP[declaredType];
  if (!ext) {
    return { valid: false, error: 'Unsupported file type. Only JPG, PNG, and WebP are permitted.' };
  }

  if (buffer.length < 4) {
    return { valid: false, error: 'Corrupted image file.' };
  }

  // Check magic bytes signatures
  if (declaredType === 'image/jpeg') {
    // JPEG signature: FF D8 FF
    if (buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
      return { valid: false, error: 'Invalid JPEG file content: signature mismatch.' };
    }
  } else if (declaredType === 'image/png') {
    // PNG signature: 89 50 4E 47
    if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4e || buffer[3] !== 0x47) {
      return { valid: false, error: 'Invalid PNG file content: signature mismatch.' };
    }
  } else if (declaredType === 'image/webp') {
    // WebP signature: RIFF (52 49 46 46) ... WEBP (57 45 42 50)
    if (buffer.length < 12) {
      return { valid: false, error: 'Corrupted WebP file content.' };
    }
    const isRiff = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
    const isWebp = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    if (!isRiff || !isWebp) {
      return { valid: false, error: 'Invalid WebP file content: signature mismatch.' };
    }
  }

  return { valid: true, ext };
}

