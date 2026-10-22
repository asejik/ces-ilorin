export interface RegistrationFields {
  surname: string;
  first_name: string;
  gender: string;
  marital_status: string;
  phone_number: string;
  email_address: string;
  born_again: string;
  baptised_hs: string;
  attended_mem_vision: string;
  committed_to_programme: string;
}

export const EMPTY_REGISTRATION_FIELDS: RegistrationFields = {
  surname: '',
  first_name: '',
  gender: '',
  marital_status: '',
  phone_number: '',
  email_address: '',
  born_again: '',
  baptised_hs: '',
  attended_mem_vision: '',
  committed_to_programme: '',
};

export const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

/** Mirrors the mandatory-field rules enforced again server-side by Zod. */
export function isRegistrationValid(fields: RegistrationFields, ndpaConsent: boolean): boolean {
  return Boolean(
    fields.surname.trim().length >= 2 &&
      fields.first_name.trim().length >= 2 &&
      Boolean(fields.gender) &&
      Boolean(fields.marital_status) &&
      fields.phone_number.trim().length >= 8 &&
      isEmailValid(fields.email_address) &&
      Boolean(fields.born_again) &&
      Boolean(fields.baptised_hs) &&
      Boolean(fields.attended_mem_vision) &&
      Boolean(fields.committed_to_programme) &&
      ndpaConsent
  );
}
