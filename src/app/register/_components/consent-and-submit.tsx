import { Loader2, Sparkles } from 'lucide-react';

export function ConsentSection({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="bg-surface p-5 sm:p-6 rounded-2xl border border-ink-200 shadow-sm">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          name="ndpa_consent"
          id="ndpa_consent"
          required
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 mt-0.5 rounded border-ink-300 text-solar-600 focus:ring-solar-500 shrink-0 cursor-pointer"
        />
        <span className="text-xs text-ink-700 leading-relaxed">
          <strong className="text-ink-950 font-semibold">Data Privacy & Consent (NDPA 2023):</strong> I consent to Citizens of Light Church / Citizens Elementary School collecting, storing, and processing my personal, contact, and academic information strictly for cohort enrollment, discipleship progress, and graduation certification in accordance with the Nigeria Data Protection Act (NDPA 2023).
        </span>
      </label>
    </div>
  );
}

export function SubmitSection({ isFormValid, loading }: { isFormValid: boolean; loading: boolean }) {
  return (
    <div className="pt-2">
      <button
        type="submit"
        disabled={!isFormValid || loading}
        className={`w-full h-12 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2 ${
          isFormValid && !loading
            ? 'bg-ink-950 text-white hover:bg-ink-800 active:scale-[0.99] cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-solar-500 focus:ring-offset-2'
            : 'bg-ink-100 text-ink-400 border border-ink-200 cursor-not-allowed shadow-none'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-solar-400" />
            Generating Matriculation Number & Enrolling...
          </>
        ) : (
          <>
            <Sparkles className={`w-5 h-5 ${isFormValid ? 'text-solar-400' : 'text-ink-300'}`} />
            Complete Registration & Generate Matric No.
          </>
        )}
      </button>
      <p className="text-center text-xs mt-3 flex items-center justify-center gap-1.5">
        {!isFormValid ? (
          <span className="text-ink-500">
            Please complete all mandatory fields (<strong className="text-status-notyet-dot">*</strong>) and accept the Data Privacy consent to activate registration.
          </span>
        ) : (
          <span className="text-ink-600">
            Ready to register! Your official admission number will be generated immediately.
          </span>
        )}
      </p>
    </div>
  );
}
