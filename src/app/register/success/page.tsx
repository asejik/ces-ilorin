import Link from 'next/link';
import { 
  CheckCircle2, 
  Download, 
  BookOpen, 
  Calendar, 
  ShieldCheck, 
  Award,
  Home
} from 'lucide-react';

interface SuccessPageProps {
  searchParams: {
    matricNo?: string;
    name?: string;
    cohort?: string;
  };
}

export default function RegisterSuccessPage({ searchParams }: SuccessPageProps) {
  const matricNo = searchParams.matricNo || 'CES/ILR/26XXXX';
  const studentName = searchParams.name || 'Student';
  const cohortType = searchParams.cohort || 'Regular';
  const isSunday = cohortType === 'Sunday Cohort';

  return (
    <main className="min-h-screen bg-canvas py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="max-w-xl w-full">
        {/* Success Card */}
        <div className="bg-surface rounded-2xl border border-ink-200 shadow-md p-6 sm:p-10 text-center relative overflow-hidden">
          {/* Top Decorative Banner */}
          <div className={`absolute top-0 inset-x-0 h-2 ${isSunday ? 'bg-sunday-500' : 'bg-solar-500'}`} />

          {/* Success Checkmark */}
          <div className="w-16 h-16 rounded-full bg-status-graduate-bg border-2 border-status-graduate-dot/20 flex items-center justify-center text-status-graduate-dot mx-auto mb-5 shadow-xs">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-ink-950 tracking-tight mb-2">
            Registration Successful!
          </h1>
          <p className="text-sm text-ink-600 mb-6">
            Congratulations <strong>{studentName}</strong>, your enrollment has been recorded.
          </p>

          {/* Matriculation Number Card */}
          <div className={`p-6 rounded-xl border-2 mb-8 text-center transition-all ${
            isSunday 
              ? 'bg-sunday-50/60 border-sunday-500/80 shadow-xs' 
              : 'bg-solar-50 border-solar-400 shadow-xs'
          }`}>
            <span className="text-xs font-bold uppercase tracking-wider text-solar-700 block mb-1">
              Your Official Matriculation Number
            </span>
            <span className="font-mono font-extrabold text-2xl sm:text-3xl text-ink-950 tracking-wider block tabular-nums">
              {matricNo}
            </span>
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isSunday 
                  ? 'bg-sunday-100 text-sunday-700 border border-sunday-300' 
                  : 'bg-ink-950 text-white'
              }`}>
                <Calendar className="w-3 h-3" /> {cohortType}
              </span>
            </div>
          </div>

          {/* Key Instructions */}
          <div className="text-left bg-canvas rounded-xl p-5 border border-ink-200/80 mb-8 space-y-3 text-xs text-ink-700">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-solar-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Keep this Matric Number safe:</strong> You will need it to check in for classes and take all 8 course quizzes.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <BookOpen className="w-4 h-4 text-solar-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Instructional Manual:</strong> An automated confirmation email has been sent to your email address with the curriculum manual.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Award className="w-4 h-4 text-solar-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Graduation Clearance:</strong> A minimum score of 50% plus attendance in both mandatory classes is required to graduate.
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/manual.pdf"
              target="_blank"
              className="flex-1 h-11 rounded-lg bg-ink-950 text-white text-xs font-semibold hover:bg-ink-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4 text-solar-400" />
              Download Course Manual
            </a>
            <Link
              href="/"
              className="h-11 px-5 rounded-lg border border-ink-300 bg-surface hover:bg-surface-subtle text-xs font-semibold text-ink-950 transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Home className="w-4 h-4 text-ink-500" />
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
