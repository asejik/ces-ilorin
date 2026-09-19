'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UserCheck,
  Star,
  ArrowLeft,
  RefreshCw,
  MessageSquareQuote,
  Calendar,
} from 'lucide-react';
import {
  getAttendanceFeedbackAction,
  type AttendanceSummaryStats,
} from '@/actions/attendance';

export default function AttendanceFeedbackPage() {
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [stats, setStats] = useState<AttendanceSummaryStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadFeedback = async () => {
    setLoading(true);
    const res = await getAttendanceFeedbackAction(selectedCourse);
    if (res.success && res.stats) {
      setStats(res.stats);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFeedback();
  }, [selectedCourse]);

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <header className="border-b border-ink-200 bg-surface px-4 sm:px-8 py-4 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/gradebook"
              className="w-9 h-9 rounded-xl border border-ink-200 flex items-center justify-center text-ink-600 hover:text-ink-950 hover:bg-canvas transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-base sm:text-lg text-ink-950">
                  Teaching Quality & Delivery Feedback
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-status-graduate-bg text-status-graduate-text">
                  Student Evaluations
                </span>
              </div>
              <p className="text-xs text-ink-500">
                Live attendance check-ins, teaching delivery star ratings, and anonymous qualitative student remarks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadFeedback}
              className="h-9 px-3 rounded-lg border border-ink-200 text-xs font-semibold text-ink-700 hover:bg-canvas transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link
              href="/admin/broadsheet"
              className="h-9 px-3 rounded-lg bg-solar-50 border border-solar-300 text-solar-900 text-xs font-bold hover:bg-solar-100 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>Master Broadsheet →</span>
            </Link>
            <Link
              href="/attendance"
              target="_blank"
              className="h-9 px-3 rounded-lg bg-ink-950 text-white text-xs font-semibold hover:bg-ink-800 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <UserCheck className="w-3.5 h-3.5 text-solar-400" />
              <span>Check-in Portal ↗</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* KPI Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Check-ins */}
          <div className="bg-surface rounded-2xl border border-ink-200 p-5 shadow-xs">
            <span className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-1">
              Total Class Check-ins
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-heading font-extrabold text-3xl text-ink-950">
                {stats?.totalCheckins ?? 0}
              </span>
              <span className="text-xs text-ink-500">Student Logs</span>
            </div>
            <span className="text-[11px] text-ink-400 mt-1 block">Across all mandatory discipleship sessions</span>
          </div>

          {/* Average Rating */}
          <div className="bg-surface rounded-2xl border border-ink-200 p-5 shadow-xs">
            <span className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-1">
              Average Delivery Rating
            </span>
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-3xl text-solar-700">
                {stats?.averageRating ? stats.averageRating.toFixed(1) : '—'}
              </span>
              <div className="flex items-center text-solar-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(stats?.averageRating ?? 0)
                        ? 'fill-solar-400 text-solar-500'
                        : 'text-ink-200'
                    }`}
                  />
                ))}
              </div>
            </div>
            <span className="text-[11px] text-ink-400 mt-1 block">Scale of 1 to 5 Stars</span>
          </div>

          {/* Rating Breakdown */}
          <div className="bg-surface rounded-2xl border border-ink-200 p-5 shadow-xs">
            <span className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-2">
              Star Breakdown
            </span>
            <div className="space-y-1 text-xs">
              {[5, 4, 3, 2, 1].map((s) => {
                const count = stats?.ratingCounts[s] ?? 0;
                const total = stats?.totalCheckins || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={s} className="flex items-center gap-2 text-[11px]">
                    <span className="w-10 font-bold text-ink-600">{s} Stars</span>
                    <div className="flex-1 bg-canvas h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-solar-500 h-full rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 text-right font-mono text-ink-500">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Course Filter Bar */}
        <div className="bg-surface rounded-2xl border border-ink-200 p-3 shadow-xs flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-ink-500 uppercase tracking-wider px-2">
            Filter Course:
          </span>
          <button
            onClick={() => setSelectedCourse('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedCourse === 'all'
                ? 'bg-ink-950 text-white'
                : 'text-ink-600 hover:bg-canvas'
            }`}
          >
            All Courses
          </button>
          <button
            onClick={() => setSelectedCourse('Elementary Principles')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedCourse === 'Elementary Principles'
                ? 'bg-ink-950 text-white'
                : 'text-ink-600 hover:bg-canvas'
            }`}
          >
            Elementary Principles
          </button>
          <button
            onClick={() => setSelectedCourse('Membership & Vision Class')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedCourse === 'Membership & Vision Class'
                ? 'bg-ink-950 text-white'
                : 'text-ink-600 hover:bg-canvas'
            }`}
          >
            Membership & Vision
          </button>
        </div>

        {/* Feedback Comments Stream */}
        <div className="bg-surface rounded-2xl border border-ink-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-ink-200">
            <h2 className="font-heading font-bold text-base text-ink-950">
              Student Reflections & Feedback Log
            </h2>
            <p className="text-xs text-ink-500">
              Direct insights and qualitative suggestions recorded by students upon class check-in.
            </p>
          </div>

          {loading ? (
            <div className="p-16 text-center text-xs text-ink-500 flex items-center justify-center gap-2">
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-solar-500 border-t-transparent" />
              <span>Loading student feedbacks...</span>
            </div>
          ) : !stats || stats.feedbacks.length === 0 ? (
            <div className="p-12 text-center text-xs text-ink-500">
              No class check-ins or student feedback have been submitted yet.
            </div>
          ) : (
            <div className="divide-y divide-ink-100">
              {stats.feedbacks.map((f) => (
                <div key={f.id} className="p-5 hover:bg-canvas/40 transition-colors space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <strong className="text-ink-950">{f.studentName}</strong>
                      <span className="font-mono text-[11px] text-ink-400 bg-ink-100 px-1.5 py-0.5 rounded">
                        {f.matricNo}
                      </span>
                      <span className="text-ink-300">·</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-solar-50 text-solar-800 border border-solar-200">
                        {f.courseName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {f.deliveryRating && (
                        <div className="flex items-center gap-1 text-solar-600 font-bold">
                          <span>{f.deliveryRating}</span>
                          <Star className="w-3.5 h-3.5 fill-solar-400 text-solar-500" />
                        </div>
                      )}
                      <span className="text-ink-400 text-[11px] flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {f.sessionDate}
                      </span>
                    </div>
                  </div>

                  {f.deliveryFeedback ? (
                    <div className="p-3 rounded-xl bg-canvas border border-ink-100 text-xs text-ink-800 flex items-start gap-2">
                      <MessageSquareQuote className="w-4 h-4 text-solar-500 flex-shrink-0 mt-0.5" />
                      <p className="italic leading-relaxed">"{f.deliveryFeedback}"</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-ink-400 italic">No written comment provided.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
