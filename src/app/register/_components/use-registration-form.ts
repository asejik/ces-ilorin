'use client';

import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { registerStudentAction } from '@/actions/register';
import type { CohortType } from './cohort-section';
import {
  EMPTY_REGISTRATION_FIELDS,
  MAX_PHOTO_BYTES,
  isRegistrationValid,
  type RegistrationFields,
} from './registration-fields';

/** State, validation and submit handling for the registration form. */
export function useRegistrationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cohortType, setCohortType] = useState<CohortType>('Regular');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [formFields, setFormFields] = useState<RegistrationFields>(EMPTY_REGISTRATION_FIELDS);
  const [ndpaConsent, setNdpaConsent] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormFields((prev) => ({ ...prev, [name]: value }));
  };

  const isFormValid = isRegistrationValid(formFields, ndpaConsent);

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_PHOTO_BYTES) {
      setError('Passport photo must be smaller than 3MB.');
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    if (photoFile) {
      formData.set('passport_file', photoFile);
    }

    try {
      const result = await registerStudentAction(formData);

      if (!result.success) {
        setError(result.error || 'Registration failed. Please review your entries.');
        setLoading(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      router.push('/register/success');
    } catch {
      setError('An unexpected connection error occurred. Please try again.');
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return {
    loading,
    error,
    cohortType,
    setCohortType,
    photoPreview,
    hasPhoto: photoFile !== null,
    formFields,
    ndpaConsent,
    setNdpaConsent,
    isFormValid,
    handleInputChange,
    handlePhotoChange,
    handleSubmit,
  };
}
