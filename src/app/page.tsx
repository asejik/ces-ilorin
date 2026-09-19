import Link from 'next/link';
import { 
  GraduationCap, 
  BookOpen, 
  UserCheck, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles,
  Award
} from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col justify-between bg-canvas">
      {/* Header */}
      <header className="border-b border-ink-200/80 bg-surface/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-ink-950 flex items-center justify-center text-solar-500 shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="font-heading font-bold text-lg text-ink-950 tracking-tight block leading-tight">
                Citizens Elementary School
              </span>
              <span className="text-xs text-ink-500 font-medium block leading-tight">
                Citizens of Light Church · Ilorin
              </span>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-ink-800 bg-surface border border-ink-200 rounded-md hover:bg-surface-subtle hover:text-ink-950 transition-colors shadow-xs"
          >
            <ShieldCheck className="w-4 h-4 text-solar-600" />
            Staff Portal
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-solar-50 text-solar-700 border border-solar-200 mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-solar-500" />
          Discipleship Training Platform · 2026 Academic Year
        </div>

        <h1 className="font-heading font-bold text-3xl sm:text-5xl text-ink-950 tracking-tight leading-tight sm:leading-tight mb-4">
          Equipping Believers with Kingdom Truth & Integrity
        </h1>
        <p className="text-base sm:text-lg text-ink-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          Welcome to the official academic portal for Citizens Elementary School. Access cohort enrollment, online continuous assessments, attendance tracking, and graduation certification.
        </p>

        {/* Action Gateway Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-left max-w-3xl mx-auto">
          {/* Card 1: Student Intake */}
          <Link
            href="/register"
            className="group p-5 bg-surface rounded-xl border border-ink-200 shadow-sm hover:border-solar-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-solar-50 border border-solar-200 flex items-center justify-center text-solar-600 mb-4 group-hover:bg-solar-500 group-hover:text-ink-950 transition-colors">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2 className="font-heading font-bold text-base text-ink-950 mb-1 group-hover:text-solar-700 transition-colors">
                Cohort Registration
              </h2>
              <p className="text-xs text-ink-600 leading-relaxed mb-4">
                Enroll for the current regular or Sunday cohort and automatically generate your official matriculation number.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-950 group-hover:text-solar-600 transition-colors">
              Begin Registration <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Online Assessments */}
          <Link
            href="/assessment"
            className="group p-5 bg-surface rounded-xl border border-ink-200 shadow-sm hover:border-solar-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-ink-950 border border-ink-800 flex items-center justify-center text-solar-400 mb-4 group-hover:bg-solar-500 group-hover:text-ink-950 transition-colors">
                <Award className="w-5 h-5" />
              </div>
              <h2 className="font-heading font-bold text-base text-ink-950 mb-1 group-hover:text-solar-700 transition-colors">
                Take Quiz / Exam
              </h2>
              <p className="text-xs text-ink-600 leading-relaxed mb-4">
                Active students access class quizzes and examinations using their Matric Number and Teacher Session PIN.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-950 group-hover:text-solar-600 transition-colors">
              Access Assessment <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Class Attendance */}
          <Link
            href="/attendance"
            className="group p-5 bg-surface rounded-xl border border-ink-200 shadow-sm hover:border-solar-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-status-graduate-bg border border-status-graduate-dot/30 flex items-center justify-center text-status-graduate-text mb-4 group-hover:bg-status-graduate-dot group-hover:text-white transition-colors">
                <UserCheck className="w-5 h-5" />
              </div>
              <h2 className="font-heading font-bold text-base text-ink-950 mb-1 group-hover:text-status-graduate-text transition-colors">
                Class Attendance
              </h2>
              <p className="text-xs text-ink-600 leading-relaxed mb-4">
                Log attendance for mandatory non-graded courses and submit delivery ratings for teaching feedback.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-950 group-hover:text-status-graduate-text transition-colors">
              Check-in Now <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink-200/80 bg-surface py-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-500 text-center sm:text-left">
          <p>© {new Date().getFullYear()} Citizens of Light Church, Ilorin. Citizens Elementary School.</p>
          <div className="flex items-center gap-4">
            <span>Discipleship Training Programme</span>
            <span>·</span>
            <span>CES/ILR Center</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
