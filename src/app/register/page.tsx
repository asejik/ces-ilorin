'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  GraduationCap, 
  ArrowLeft, 
  UploadCloud, 
  Calendar, 
  User, 
  Phone, 
  Heart, 
  Sparkles, 
  Loader2, 
  AlertCircle
} from 'lucide-react';
import { registerStudentAction } from '@/actions/register';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cohortType, setCohortType] = useState<'Regular' | 'Sunday Cohort'>('Regular');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

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

      // Redirect to success confirmation page
      const queryParams = new URLSearchParams({
        matricNo: result.matricNo || '',
        name: result.studentName || '',
        cohort: result.cohortType || cohortType,
      });

      router.push(`/register/success?${queryParams.toString()}`);
    } catch {
      setError('An unexpected connection error occurred. Please try again.');
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-status-notyet-bg border border-status-notyet-dot/30 flex items-start gap-3 text-status-notyet-text text-sm shadow-xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-status-notyet-dot mt-0.5" />
            <div>
              <div className="font-semibold mb-0.5">Please check your form submission:</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECTION 1: COHORT SELECTION */}
          <div className="bg-surface p-6 sm:p-8 rounded-2xl border border-ink-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-ink-100">
              <Calendar className="w-5 h-5 text-solar-600" />
              <h2 className="font-heading font-bold text-base text-ink-950">
                1. Cohort & Study Schedule
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  cohortType === 'Regular'
                    ? 'border-ink-950 bg-ink-50/20 shadow-xs'
                    : 'border-ink-200 bg-surface hover:border-ink-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-heading font-bold text-sm text-ink-950">
                    Regular Semester
                  </span>
                  <input
                    type="radio"
                    name="cohort_type"
                    value="Regular"
                    checked={cohortType === 'Regular'}
                    onChange={() => setCohortType('Regular')}
                    className="w-4 h-4 text-ink-950 focus:ring-solar-500"
                  />
                </div>
                <p className="text-xs text-ink-600 leading-relaxed">
                  Scheduled weekday morning and evening intensive sessions. Meets all week except Wednesday.
                </p>
              </label>

              <label
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  cohortType === 'Sunday Cohort'
                    ? 'border-sunday-600 bg-sunday-50/50 shadow-xs'
                    : 'border-ink-200 bg-surface hover:border-sunday-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-heading font-bold text-sm text-sunday-700">
                      Sunday Cohort
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-sunday-100 text-sunday-600 border border-sunday-200">
                      Featured
                    </span>
                  </div>
                  <input
                    type="radio"
                    name="cohort_type"
                    value="Sunday Cohort"
                    checked={cohortType === 'Sunday Cohort'}
                    onChange={() => setCohortType('Sunday Cohort')}
                    className="w-4 h-4 text-sunday-600 focus:ring-sunday-500"
                  />
                </div>
                <p className="text-xs text-ink-600 leading-relaxed">
                  Dedicated weekend program designed for workers and professionals. Meets on Sundays only.
                </p>
              </label>
            </div>
          </div>

          {/* SECTION 2: PERSONAL INFORMATION */}
          <div className="bg-surface p-6 sm:p-8 rounded-2xl border border-ink-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-ink-100">
              <User className="w-5 h-5 text-solar-600" />
              <h2 className="font-heading font-bold text-base text-ink-950">
                2. Personal Information
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-ink-950 mb-1.5">
                  Surname <span className="text-status-notyet-dot">*</span>
                </label>
                <input
                  type="text"
                  name="surname"
                  required
                  placeholder="e.g. Adeyemi"
                  className="w-full h-11 px-3 text-sm rounded-lg border border-ink-200 focus:ring-2 focus:ring-solar-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-950 mb-1.5">
                  First Name <span className="text-status-notyet-dot">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  required
                  placeholder="e.g. David"
                  className="w-full h-11 px-3 text-sm rounded-lg border border-ink-200 focus:ring-2 focus:ring-solar-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-950 mb-1.5">
                  Middle Name
                </label>
                <input
                  type="text"
                  name="middle_name"
                  placeholder="e.g. Oluwaseun"
                  className="w-full h-11 px-3 text-sm rounded-lg border border-ink-200 focus:ring-2 focus:ring-solar-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-ink-950 mb-1.5">
                  Gender <span className="text-status-notyet-dot">*</span>
                </label>
                <select
                  name="gender"
                  required
                  defaultValue=""
                  className="w-full h-11 px-3 text-sm rounded-lg border border-ink-200 bg-surface focus:ring-2 focus:ring-solar-500 focus:outline-none"
                >
                  <option value="" disabled>Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-950 mb-1.5">
                  Marital Status <span className="text-status-notyet-dot">*</span>
                </label>
                <select
                  name="marital_status"
                  required
                  defaultValue=""
                  className="w-full h-11 px-3 text-sm rounded-lg border border-ink-200 bg-surface focus:ring-2 focus:ring-solar-500 focus:outline-none"
                >
                  <option value="" disabled>Select Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Divorced">Divorced</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-950 mb-1.5">
                  Educational Level
                </label>
                <input
                  type="text"
                  name="educational_level"
                  placeholder="e.g. BSc, HND, OND, SSCE"
                  className="w-full h-11 px-3 text-sm rounded-lg border border-ink-200 focus:ring-2 focus:ring-solar-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-950 mb-1.5">
                Occupation
              </label>
              <input
                type="text"
                name="occupation"
                placeholder="e.g. Civil Servant, Educator, Entrepreneur, Student"
                className="w-full h-11 px-3 text-sm rounded-lg border border-ink-200 focus:ring-2 focus:ring-solar-500 focus:outline-none"
              />
            </div>
          </div>

          {/* SECTION 3: CONTACT INFORMATION */}
          <div className="bg-surface p-6 sm:p-8 rounded-2xl border border-ink-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-ink-100">
              <Phone className="w-5 h-5 text-solar-600" />
              <h2 className="font-heading font-bold text-base text-ink-950">
                3. Contact Information
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-ink-950 mb-1.5">
                  Phone Number <span className="text-status-notyet-dot">*</span>
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  required
                  placeholder="08012345678"
                  className="w-full h-11 px-3 text-sm rounded-lg border border-ink-200 focus:ring-2 focus:ring-solar-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-950 mb-1.5">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  name="whatsapp_number"
                  placeholder="08012345678"
                  className="w-full h-11 px-3 text-sm rounded-lg border border-ink-200 focus:ring-2 focus:ring-solar-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-950 mb-1.5">
                  Email Address <span className="text-status-notyet-dot">*</span>
                </label>
                <input
                  type="email"
                  name="email_address"
                  required
                  placeholder="name@example.com"
                  className="w-full h-11 px-3 text-sm rounded-lg border border-ink-200 focus:ring-2 focus:ring-solar-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-ink-950 mb-1.5">
                Permanent Residential Address
              </label>
              <textarea
                name="permanent_address"
                rows={2}
                placeholder="Full address in Ilorin or nearby"
                className="w-full p-3 text-sm rounded-lg border border-ink-200 focus:ring-2 focus:ring-solar-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-950 mb-1.5">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  name="emergency_contact"
                  placeholder="Next of kin or guardian"
                  className="w-full h-11 px-3 text-sm rounded-lg border border-ink-200 focus:ring-2 focus:ring-solar-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-950 mb-1.5">
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  name="emergency_contact_phone"
                  placeholder="08012345678"
                  className="w-full h-11 px-3 text-sm rounded-lg border border-ink-200 focus:ring-2 focus:ring-solar-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: SPIRITUAL BACKGROUND */}
          <div className="bg-surface p-6 sm:p-8 rounded-2xl border border-ink-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-ink-100">
              <Heart className="w-5 h-5 text-solar-600" />
              <h2 className="font-heading font-bold text-base text-ink-950">
                4. Spiritual Journey & Church Life
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-ink-950 mb-1.5">
                  Are you Born Again? <span className="text-status-notyet-dot">*</span>
                </label>
                <select
                  name="born_again"
                  required
                  defaultValue=""
                  className="w-full h-11 px-3 text-sm rounded-lg border border-ink-200 bg-surface focus:ring-2 focus:ring-solar-500 focus:outline-none"
                >
                  <option value="" disabled>Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-950 mb-1.5">
                  Baptised in the Holy Spirit (with evidence of speaking in tongues)? <span className="text-status-notyet-dot">*</span>
                </label>
                <select
                  name="baptised_hs"
                  required
                  defaultValue=""
                  className="w-full h-11 px-3 text-sm rounded-lg border border-ink-200 bg-surface focus:ring-2 focus:ring-solar-500 focus:outline-none"
                >
                  <option value="" disabled>Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-ink-950 mb-1.5">
                  Years as a Christian
                </label>
                <input
                  type="text"
                  name="years_as_christian"
                  placeholder="e.g. 5 years, 10 years"
                  className="w-full h-11 px-3 text-sm rounded-lg border border-ink-200 focus:ring-2 focus:ring-solar-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-950 mb-1.5">
                  Unit / Ministry of Interest
                </label>
                <input
                  type="text"
                  name="unit_of_interest"
                  placeholder="e.g. Choir, Media, Ushering, Evangelism"
                  className="w-full h-11 px-3 text-sm rounded-lg border border-ink-200 focus:ring-2 focus:ring-solar-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-ink-950 mb-1.5">
                  Previously served in any church department?
                </label>
                <input
                  type="text"
                  name="previously_served"
                  placeholder="Yes / No (and department)"
                  className="w-full h-11 px-3 text-sm rounded-lg border border-ink-200 focus:ring-2 focus:ring-solar-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-950 mb-1.5">
                  Spiritual Gifts / Practical Skills
                </label>
                <input
                  type="text"
                  name="gifts_skills"
                  placeholder="e.g. Teaching, Design, Sound, Counseling"
                  className="w-full h-11 px-3 text-sm rounded-lg border border-ink-200 focus:ring-2 focus:ring-solar-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-ink-950 mb-1.5">
                  Have you attended Membership & Vision Class? <span className="text-status-notyet-dot">*</span>
                </label>
                <select
                  name="attended_mem_vision"
                  required
                  defaultValue=""
                  className="w-full h-11 px-3 text-sm rounded-lg border border-ink-200 bg-surface focus:ring-2 focus:ring-solar-500 focus:outline-none"
                >
                  <option value="" disabled>Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-950 mb-1.5">
                  Committed to completing all sessions & quizzes? <span className="text-status-notyet-dot">*</span>
                </label>
                <select
                  name="committed_to_programme"
                  required
                  defaultValue=""
                  className="w-full h-11 px-3 text-sm rounded-lg border border-ink-200 bg-surface focus:ring-2 focus:ring-solar-500 focus:outline-none"
                >
                  <option value="" disabled>Select</option>
                  <option value="Yes">Yes, fully committed</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-950 mb-1.5">
                Comments or Enquiries
              </label>
              <textarea
                name="comments_enquiries"
                rows={2}
                placeholder="Any special requests, comments, or expectations"
                className="w-full p-3 text-sm rounded-lg border border-ink-200 focus:ring-2 focus:ring-solar-500 focus:outline-none"
              />
            </div>
          </div>

          {/* SECTION 5: PASSPORT PHOTOGRAPH */}
          <div className="bg-surface p-6 sm:p-8 rounded-2xl border border-ink-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-ink-100">
              <UploadCloud className="w-5 h-5 text-solar-600" />
              <h2 className="font-heading font-bold text-base text-ink-950">
                5. Passport Photograph Upload
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-28 h-28 rounded-xl border-2 border-dashed border-ink-300 bg-canvas flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                {photoPreview ? (
                  <Image
                    src={photoPreview}
                    alt="Passport Preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="text-center p-2 text-ink-400">
                    <User className="w-8 h-8 mx-auto mb-1 opacity-50" />
                    <span className="text-[10px] block">No Photo</span>
                  </div>
                )}
              </div>

              <div className="flex-1 w-full">
                <label
                  htmlFor="passport_input"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-ink-300 bg-surface hover:bg-surface-subtle text-xs font-semibold text-ink-950 cursor-pointer transition-colors shadow-xs"
                >
                  <UploadCloud className="w-4 h-4 text-solar-600" />
                  {photoFile ? 'Change Passport Photo' : 'Select Passport Photo (JPG/PNG)'}
                </label>
                <input
                  id="passport_input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <p className="text-xs text-ink-500 mt-2">
                  Please upload a clear, front-facing passport photograph with a light background (Max 3MB).
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 6: DATA PRIVACY & CONSENT (NDPA 2023) */}
          <div className="bg-surface p-5 sm:p-6 rounded-2xl border border-ink-200 shadow-sm">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="ndpa_consent"
                required
                defaultChecked
                className="w-4 h-4 mt-0.5 rounded border-ink-300 text-solar-600 focus:ring-solar-500 shrink-0"
              />
              <span className="text-xs text-ink-700 leading-relaxed">
                <strong className="text-ink-950 font-semibold">Data Privacy & Consent (NDPA 2023):</strong> I consent to Citizens of Light Church / Citizens Elementary School collecting, storing, and processing my personal, contact, and academic information strictly for cohort enrollment, discipleship progress, and graduation certification in accordance with the Nigeria Data Protection Act (NDPA 2023).
              </span>
            </label>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-ink-950 text-white font-medium text-base hover:bg-ink-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md focus:outline-none focus:ring-2 focus:ring-solar-500 focus:ring-offset-2 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-solar-400" />
                  Generating Matriculation Number & Enrolling...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-solar-400" />
                  Complete Registration & Generate Matric No.
                </>
              )}
            </button>
            <p className="text-center text-xs text-ink-500 mt-3">
              By submitting, your official admission number will be generated immediately and a welcome email will be dispatched.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
