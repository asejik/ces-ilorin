'use client';

import Link from 'next/link';
import { GraduationCap, ArrowLeft, AlertCircle } from 'lucide-react';
import { CohortSection } from './_components/cohort-section';
import { PersonalSection } from './_components/personal-section';
import { ContactSection } from './_components/contact-section';
import { SpiritualSection } from './_components/spiritual-section';
import { PhotoSection } from './_components/photo-section';
import { ConsentSection, SubmitSection } from './_components/consent-and-submit';
import { useRegistrationForm } from './_components/use-registration-form';

export default function RegisterPage() {
  const form = useRegistrationForm();

  return (
    <div className="min-h-screen bg-canvas py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Navigation / Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-600 hover:text-ink-950 transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Portal Home
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-ink-950 flex items-center justify-center text-solar-500 shadow-md">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl text-ink-950 tracking-tight">
                Student Cohort Registration
              </h1>
              <p className="text-xs sm:text-sm text-ink-600">
                Citizens Elementary School · Discipleship Training Programme
              </p>
            </div>
          </div>
        </div>

        {/* Global Error Notice */}
        {form.error && (
          <div className="mb-6 p-4 rounded-xl bg-status-notyet-bg border border-status-notyet-dot/30 flex items-start gap-3 text-status-notyet-text text-sm shadow-xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-status-notyet-dot mt-0.5" />
            <div>
              <div className="font-semibold mb-0.5">Please check your form submission:</div>
              <div>{form.error}</div>
            </div>
          </div>
        )}

        <form onSubmit={form.handleSubmit} className="space-y-8">
          <CohortSection cohortType={form.cohortType} onChange={form.setCohortType} />
          <PersonalSection values={form.formFields} onChange={form.handleInputChange} />
          <ContactSection values={form.formFields} onChange={form.handleInputChange} />
          <SpiritualSection values={form.formFields} onChange={form.handleInputChange} />
          <PhotoSection
            photoPreview={form.photoPreview}
            hasPhoto={form.hasPhoto}
            onPhotoChange={form.handlePhotoChange}
          />
          <ConsentSection checked={form.ndpaConsent} onChange={form.setNdpaConsent} />
          <SubmitSection isFormValid={form.isFormValid} loading={form.loading} />
        </form>
      </div>
    </div>
  );
}
