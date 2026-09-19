import { describe, it, expect } from 'vitest';
import { studentRegistrationSchema, validatePassportFile } from '../validation/registration';

describe('Student Registration Validation', () => {
  const validPayload = {
    surname: 'Adeyemi',
    first_name: 'David',
    middle_name: 'Oluwaseun',
    phone_number: '08031234567',
    whatsapp_number: '08031234567',
    email_address: 'david.adeyemi@example.com',
    permanent_address: 'Tanke, Ilorin, Kwara State',
    gender: 'Male' as const,
    marital_status: 'Single' as const,
    educational_level: 'B.Sc Computer Science',
    born_again: 'Yes' as const,
    baptised_hs: 'Yes' as const,
    unit_of_interest: 'Media & Sound',
    years_as_christian: '4 years',
    previously_served: 'Yes, ushering',
    prev_service_details: 'Ushering team at campus fellowship',
    gifts_skills: 'Graphic design and audio mixing',
    attended_mem_vision: 'Yes' as const,
    committed_to_programme: 'Yes' as const,
    comments_enquiries: 'Looking forward to spiritual growth',
    cohort_type: 'Sunday Cohort' as const,
    occupation: 'Software Engineer',
    emergency_contact: 'Mrs. Adeyemi',
    emergency_contact_phone: '08029876543',
    notes: 'Registered online',
  };

  it('validates a complete and correct registration payload', () => {
    const result = studentRegistrationSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email_address).toBe('david.adeyemi@example.com');
      expect(result.data.cohort_type).toBe('Sunday Cohort');
    }
  });

  it('rejects missing or invalid email address', () => {
    const invalidEmail = { ...validPayload, email_address: 'not-an-email' };
    const result = studentRegistrationSchema.safeParse(invalidEmail);
    expect(result.success).toBe(false);
  });

  it('rejects short surname or first name', () => {
    const shortName = { ...validPayload, surname: 'A' };
    const result = studentRegistrationSchema.safeParse(shortName);
    expect(result.success).toBe(false);
  });

  it('rejects invalid cohort type', () => {
    const invalidCohort = { ...validPayload, cohort_type: 'Evening Cohort' as unknown as 'Regular' };
    const result = studentRegistrationSchema.safeParse(invalidCohort);
    expect(result.success).toBe(false);
  });

  describe('Passport File Validation', () => {
    it('allows null or empty file as optional during intake', () => {
      expect(validatePassportFile(null).valid).toBe(true);
    });

    it('rejects files with invalid mime types', () => {
      const mockFile = new File(['mock content'], 'resume.pdf', { type: 'application/pdf' });
      const res = validatePassportFile(mockFile);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('JPG, PNG, or WebP');
    });

    it('accepts valid JPEG or PNG files', () => {
      const mockJpg = new File(['image-bytes'], 'photo.jpg', { type: 'image/jpeg' });
      expect(validatePassportFile(mockJpg).valid).toBe(true);

      const mockPng = new File(['image-bytes'], 'photo.png', { type: 'image/png' });
      expect(validatePassportFile(mockPng).valid).toBe(true);
    });
  });
});
