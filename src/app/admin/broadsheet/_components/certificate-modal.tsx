import Link from 'next/link';
import { Award, ExternalLink, Printer, X } from 'lucide-react';
import type { CertificateDetails } from '@/types/broadsheet';

/** In-app certificate preview modal (template conforms to docs/DESIGN.md section 6). */
export function CertificateModal({
  cert,
  onClose,
}: {
  cert: CertificateDetails;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-ink-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface w-full max-w-4xl rounded-3xl border border-ink-200 shadow-2xl overflow-hidden animate-fade-in my-8">
        {/* Modal Header */}
        <div className="bg-surface px-6 py-4 border-b border-ink-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-solar-600" />
            <span className="font-heading font-extrabold text-sm sm:text-base text-ink-950">
              Graduation Certificate Preview
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-solar-100 text-solar-800 font-mono">
              {cert.certificateNo}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/certificate/${encodeURIComponent(cert.matricNo)}`}
              target="_blank"
              className="px-3 py-1.5 rounded-lg border border-ink-200 text-xs font-bold text-ink-700 hover:bg-canvas transition-colors flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Full Screen Print</span>
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-solar-600 text-white text-xs font-bold hover:bg-solar-700 transition-colors flex items-center gap-1 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-ink-200 flex items-center justify-center text-ink-500 hover:text-ink-950 hover:bg-canvas transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-10 bg-canvas flex justify-center">
          <div className="w-full max-w-3xl bg-white border-8 border-double border-solar-600 p-8 sm:p-12 shadow-lg relative text-center rounded-sm overflow-hidden">
            {/* Gold Corner Accents */}
            <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-solar-600" />
            <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-solar-600" />
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-solar-600" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-solar-600" />

            {/* Church & School Header */}
            <div className="space-y-1 mb-6">
              <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.25em] text-solar-700 block">
                Citizens of Light Church
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-ink-950 tracking-wide uppercase">
                Citizens Elementary School
              </h1>
              <p className="text-[11px] sm:text-xs text-ink-500 italic">
                Foundations of Faith, Doctrine & Discipleship
              </p>
            </div>

            <div className="my-4 flex items-center justify-center gap-4">
              <div className="h-[1px] w-16 bg-solar-300" />
              <span className="text-xs font-bold uppercase tracking-widest text-ink-600">
                Certificate of Graduation
              </span>
              <div className="h-[1px] w-16 bg-solar-300" />
            </div>

            <p className="text-xs sm:text-sm text-ink-600 mt-4 mb-2">This is to officially certify that</p>

            {/* Candidate Name */}
            <h2 className="font-serif text-2xl sm:text-4xl font-black text-ink-950 tracking-tight my-3 text-solar-900 underline decoration-solar-400 decoration-1 underline-offset-8">
              {cert.studentName}
            </h2>

            <p className="text-xs sm:text-sm text-ink-600 max-w-lg mx-auto leading-relaxed my-4">
              has satisfactorily completed the prescribed discipleship curriculum, assessments,
              and foundational institutional classes for the{' '}
              <span className="font-bold text-ink-950">{cert.cohortName}</span>.
            </p>

            {/* Honour Badge */}
            <div className="my-6">
              <span className="inline-block px-4 py-1.5 rounded-full border-2 border-solar-500 bg-solar-50 text-solar-900 font-extrabold text-xs sm:text-sm tracking-wider uppercase shadow-xs">
                Graduated with {cert.honourClass}
              </span>
              <p className="text-[11px] text-ink-400 mt-1">
                Cumulative Composite: {cert.cumulativeTotal.toFixed(1)} / 100
              </p>
            </div>

            {/* Dual Signatures & Metadata */}
            <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-ink-200">
              <div className="text-center">
                <div className="h-10 border-b border-ink-400 max-w-[160px] mx-auto flex items-end justify-center pb-1">
                  <span className="font-serif italic text-xs text-ink-600">Senior Pastorate</span>
                </div>
                <span className="text-[11px] font-bold text-ink-900 block mt-1.5">Pastor In Charge</span>
                <span className="text-[10px] text-ink-500">Citizens of Light Church</span>
              </div>

              <div className="text-center">
                <div className="h-10 border-b border-ink-400 max-w-[160px] mx-auto flex items-end justify-center pb-1">
                  <span className="font-serif italic text-xs text-ink-600">School Directorate</span>
                </div>
                <span className="text-[11px] font-bold text-ink-900 block mt-1.5">Director of Studies</span>
                <span className="text-[10px] text-ink-500">Citizens Elementary School</span>
              </div>
            </div>

            {/* Footer Certificate Number & Date */}
            <div className="mt-8 pt-4 border-t border-ink-100 flex flex-col sm:flex-row items-center justify-between text-[10px] text-ink-400 gap-2">
              <span>
                Certificate No:{' '}
                <strong className="text-ink-700 font-mono">{cert.certificateNo}</strong>
              </span>
              <span>
                Matric No: <strong className="text-ink-700 font-mono">{cert.matricNo}</strong>
              </span>
              <span>
                Date: <strong className="text-ink-700">{cert.formattedIssuedDate}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
