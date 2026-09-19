'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  UserCheck,
  Star,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Home,
  BookOpen,
  MessageSquareQuote,
  RotateCcw,
} from 'lucide-react';
import { submitAttendanceCheckinAction } from '@/actions/attendance';
import { ATTENDANCE_COURSE_NAMES } from '@/lib/validation/attendance';

export default function StudentAttendancePage() {
  const [matricNo, setMatricNo] = useState('');
  const [courseName, setCourseName] = useState<string>(ATTENDANCE_COURSE_NAMES[0]);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Success receipt state
  const [receipt, setReceipt] = useState<{
    studentName: string;
    matricNo: string;
    courseName: string;
    rating: number;
    isUpdate: boolean;
  } | null>(null);

  const RATING_LABELS: Record<number, string> = {
    1: 'Needs Improvement',
    2: 'Fair Delivery',
    3: 'Good & Clear',
    4: 'Very Good & Engaging',
    5: 'Exceptional & Inspiring',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!matricNo.trim()) {
      setErrorMsg('Please enter your Official Matriculation Number');
      return;
    }

    setLoading(true);
    try {
      const res = await submitAttendanceCheckinAction({
        matricNo,
        courseName: courseName as (typeof ATTENDANCE_COURSE_NAMES)[number],
        deliveryRating: rating,
        deliveryFeedback: feedback || null,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Check-in failed. Please verify your credentials.');
        setLoading(false);
        return;
      }

      setReceipt({
        studentName: res.studentName || 'Student',
        matricNo: res.matricNo || matricNo,
        courseName: res.courseName || courseName,
        rating: res.rating || rating,
        isUpdate: res.isUpdate || false,
      });
    } catch {
      setErrorMsg('An unexpected network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setReceipt(null);
    setFeedback('');
    setErrorMsg(null);
  };

  const activeRating = hoverRating ?? rating;

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-between">
      {/* Top Bar */}
      <header className="border-b border-ink-200 bg-surface/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-status-graduate-bg border border-status-graduate-dot/30 flex items-center justify-center text-status-graduate-text shadow-xs">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-heading font-extrabold text-sm sm:text-base text-ink-950 block leading-tight">
              CES Class Check-in
            </span>
            <span className="text-[11px] text-ink-500 font-medium">
              Attendance Verification & Teaching Feedback
            </span>
          </div>
        </div>

        <Link
          href="/"
          className="text-xs font-semibold text-ink-600 hover:text-ink-950 flex items-center gap-1 transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Home</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        {!receipt ? (
          <div className="bg-surface rounded-2xl border border-ink-200 shadow-md p-6 sm:p-10 relative overflow-hidden">
            {/* Solar Gold Accent Line */}
            <div className="absolute top-0 inset-x-0 h-2 bg-solar-500" />

            <div className="text-center mb-8">
              <h1 className="font-heading font-bold text-2xl sm:text-3xl text-ink-950 tracking-tight">
                Class Attendance Check-In
              </h1>
              <p className="text-xs sm:text-sm text-ink-600 mt-1.5">
                Confirm your presence in mandatory discipleship classes and evaluate the teaching delivery.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-status-notyet-bg border border-status-notyet-dot/30 text-status-notyet-text text-xs flex items-start gap-3 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-status-notyet-dot" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Matric Number */}
              <div>
                <label htmlFor="matricInput" className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-2">
                  Official Matriculation Number
                </label>
                <input
                  id="matricInput"
                  type="text"
                  placeholder="e.g. CES/ILR/26I901"
                  value={matricNo}
                  onChange={(e) => setMatricNo(e.target.value.toUpperCase())}
                  className="w-full h-12 px-4 rounded-xl border border-ink-200 bg-surface text-ink-950 font-mono font-semibold text-sm tracking-wide focus:outline-none focus:ring-2 focus:ring-solar-500 focus:border-transparent transition-all uppercase placeholder:normal-case placeholder:font-sans placeholder:text-ink-400"
                />
              </div>

              {/* Course Selection */}
              <div>
                <label htmlFor="courseSelect" className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-2">
                  Mandatory Class / Session
                </label>
                <div className="relative">
                  <select
                    id="courseSelect"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-ink-200 bg-surface text-ink-950 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-solar-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                  >
                    {ATTENDANCE_COURSE_NAMES.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <BookOpen className="w-4 h-4 text-ink-400 absolute right-4 top-4 pointer-events-none" />
                </div>
                <span className="text-[11px] text-ink-400 mt-1 block">
                  Attendance in Elementary Principles & Membership Class is strictly required for graduation.
                </span>
              </div>

              {/* Interactive Star Rating */}
              <div className="bg-canvas p-5 rounded-xl border border-ink-200 text-center">
                <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1">
                  How was the teaching delivery today?
                </label>
                <span className="text-xs font-bold text-solar-700 block mb-3 h-4">
                  {RATING_LABELS[activeRating]}
                </span>

                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isLit = star <= activeRating;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 focus:outline-none group transform hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            isLit
                              ? 'text-solar-500 fill-solar-400 drop-shadow-xs'
                              : 'text-ink-300 hover:text-solar-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Qualitative Feedback Textarea */}
              <div>
                <label htmlFor="feedbackInput" className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Student Feedback & Insights (Optional)</span>
                  <span className="text-[11px] text-ink-400 font-normal">Max 500 chars</span>
                </label>
                <div className="relative">
                  <textarea
                    id="feedbackInput"
                    rows={3}
                    maxLength={500}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Share what blessed you most or suggest areas of improvement for the teaching delivery..."
                    className="w-full p-3.5 rounded-xl border border-ink-200 bg-surface text-ink-950 text-xs focus:outline-none focus:ring-2 focus:ring-solar-500 focus:border-transparent transition-all placeholder:text-ink-400 resize-none leading-relaxed"
                  />
                  <MessageSquareQuote className="w-4 h-4 text-ink-300 absolute right-3 bottom-3 pointer-events-none" />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-ink-950 text-white text-sm font-bold hover:bg-ink-900 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>Confirm Class Attendance</span>
                    <CheckCircle2 className="w-4 h-4 text-solar-400" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* =============================================================== */
          /* ATTENDANCE RECEIPT CARD                                         */
          /* =============================================================== */
          <div className="bg-surface rounded-2xl border border-ink-200 shadow-md p-6 sm:p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-status-graduate-dot" />

            <div className="w-16 h-16 rounded-full bg-status-graduate-bg border-2 border-status-graduate-dot/20 flex items-center justify-center text-status-graduate-dot mx-auto mb-4 shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-ink-950 tracking-tight">
              {receipt.isUpdate ? 'Attendance Updated!' : 'Attendance Confirmed!'}
            </h2>
            <p className="text-xs sm:text-sm text-ink-600 mt-1 mb-6">
              Thank you <strong>{receipt.studentName}</strong>, your attendance record has been logged.
            </p>

            <div className="bg-canvas rounded-2xl p-5 border border-ink-200/80 text-left space-y-3 mb-6">
              <div className="flex justify-between items-center text-xs">
                <span className="text-ink-500">Student Name:</span>
                <strong className="text-ink-950">{receipt.studentName}</strong>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-ink-500">Matriculation Number:</span>
                <span className="font-mono font-bold text-ink-950 bg-ink-100 px-2 py-0.5 rounded">
                  {receipt.matricNo}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-ink-500">Course Session:</span>
                <strong className="text-ink-950">{receipt.courseName}</strong>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-ink-500">Status:</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-status-graduate-bg text-status-graduate-text border border-status-graduate-dot/30">
                  Attended
                </span>
              </div>
              <div className="border-t border-ink-200 pt-3 flex justify-between items-center text-xs">
                <span className="text-ink-500">Teaching Delivery Rating:</span>
                <div className="flex items-center gap-1 text-solar-600 font-bold">
                  <span>{receipt.rating} / 5</span>
                  <Star className="w-3.5 h-3.5 fill-solar-400" />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 h-11 rounded-xl bg-ink-950 text-white text-xs font-bold hover:bg-ink-900 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <RotateCcw className="w-4 h-4 text-solar-400" />
                <span>Check In for Another Class</span>
              </button>
              <Link
                href="/"
                className="h-11 px-5 rounded-xl border border-ink-300 text-xs font-bold text-ink-700 hover:bg-canvas transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return Home</span>
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-ink-200 bg-surface/50 py-4 px-4 text-center text-xs text-ink-500">
        Citizens Elementary School · Official Discipleship Training Platform · Citizens of Light Church, Ilorin
      </footer>
    </div>
  );
}
