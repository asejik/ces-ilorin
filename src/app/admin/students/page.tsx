'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';
import {
  getStudent360Action,
  resendWelcomeEmailAction,
  searchStudentsAction,
  type Student360,
  type StudentSearchHit,
} from '@/actions/students';

const fmt = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Lagos' })
    : '—';

const EMAIL_LABEL: Record<string, string> = {
  sent: 'Sent',
  failed: 'Failed',
  pending: 'Pending',
  not_configured: 'Not sent (mail not set up)',
  unknown: 'Unknown',
};

export default function StudentsPage() {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<StudentSearchHit[] | null>(null);
  const [student, setStudent] = useState<Student360 | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    setStudent(null);
    const res = await searchStudentsAction(query);
    if (res.success) {
      setHits(res.students ?? []);
      setError(null);
    } else {
      setHits(null);
      setError(res.error ?? 'Search failed.');
    }
    setBusy(false);
  };

  const open = async (id: string, keepNotice = false) => {
    setBusy(true);
    if (!keepNotice) setNotice(null);
    const res = await getStudent360Action(id);
    if (res.success && res.student) {
      setStudent(res.student);
      setError(null);
    } else {
      setError(res.error ?? 'Could not load the student.');
    }
    setBusy(false);
  };

  const resend = async () => {
    if (!student) return;
    if (!window.confirm(`Send the welcome email again to ${student.profile.contact?.email}?`)) return;
    setBusy(true);
    const res = await resendWelcomeEmailAction(student.profile.id);
    setNotice(res.success ? `Done. Email status: ${EMAIL_LABEL[res.emailStatus ?? 'unknown']}.${res.error ? ' ' + res.error : ''}` : null);
    setError(res.success ? null : res.error ?? 'Could not resend.');
    await open(student.profile.id, true);
    setBusy(false);
  };

  const p = student?.profile;

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-ink-200 bg-surface px-4 sm:px-8 py-4 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link
            href="/admin/gradebook"
            className="w-9 h-9 rounded-xl border border-ink-200 flex items-center justify-center text-ink-600 hover:text-ink-950 hover:bg-canvas transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="font-heading font-extrabold text-base sm:text-lg text-ink-950">Student Lookup</span>
            <p className="text-xs text-ink-500">Everything about one student: scores, attendance, certificate and history.</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <form onSubmit={search} className="flex gap-2">
          <label className="sr-only" htmlFor="student-search">Search students</label>
          <input
            id="student-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Matric number or name"
            className="flex-1 h-11 px-4 rounded-xl border border-ink-200 bg-surface text-ink-950 text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="h-11 px-4 rounded-xl bg-ink-950 text-white text-xs font-semibold hover:bg-ink-800 disabled:opacity-50 flex items-center gap-1.5"
          >
            <Search className="w-4 h-4" /> Search
          </button>
        </form>

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">{error}</div>
        )}
        {notice && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-800">{notice}</div>
        )}

        {hits && !student && (
          <section className="bg-surface rounded-2xl border border-ink-200 overflow-hidden">
            {hits.length === 0 ? (
              <p className="p-8 text-center text-xs text-ink-500">No students match that search.</p>
            ) : (
              <ul className="divide-y divide-ink-100">
                {hits.map((h) => (
                  <li key={h.id}>
                    <button
                      onClick={() => open(h.id)}
                      className="w-full text-left p-4 hover:bg-canvas flex flex-wrap items-center justify-between gap-2"
                    >
                      <span>
                        <strong className="text-sm text-ink-950">{h.fullName}</strong>{' '}
                        <span className="font-mono text-[11px] text-ink-500 bg-ink-100 px-1.5 py-0.5 rounded">{h.matricNo}</span>
                      </span>
                      <span className="flex items-center gap-2 text-[11px]">
                        <span className={`px-2 py-0.5 rounded-full font-bold ${h.cohortType === 'Sunday Cohort' ? 'bg-solar-100 text-solar-900' : 'bg-ink-100 text-ink-700'}`}>
                          {h.cohortType}
                        </span>
                        <span className="text-ink-500">{h.semesterName}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {student && p && (
          <div className="space-y-4">
            <button onClick={() => setStudent(null)} className="text-xs font-semibold text-ink-600 hover:text-ink-950">
              ← Back to results
            </button>

            <section className="bg-surface rounded-2xl border border-ink-200 p-5 flex flex-wrap gap-5">
              {p.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.photoUrl} alt={`Passport photo of ${p.fullName}`} className="w-24 h-28 rounded-xl object-cover border border-ink-200" />
              ) : (
                <div className="w-24 h-28 rounded-xl bg-canvas border border-ink-200 flex items-center justify-center text-[11px] text-ink-400">No photo</div>
              )}
              <div className="space-y-1 min-w-0">
                <h1 className="font-heading font-extrabold text-xl text-ink-950">{p.fullName}</h1>
                <p className="font-mono text-sm text-ink-700">{p.matricNo}</p>
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className={`px-2 py-0.5 rounded-full font-bold ${p.cohortType === 'Sunday Cohort' ? 'bg-solar-100 text-solar-900' : 'bg-ink-100 text-ink-700'}`}>{p.cohortType}</span>
                  <span className="text-ink-500">{p.semesterName}</span>
                  <span className="px-2 py-0.5 rounded-full bg-canvas border border-ink-200 text-ink-700 font-semibold">{p.status}</span>
                </div>
                <p className="text-xs text-ink-500">Registered {fmt(p.registeredAt)}</p>
                <p className="text-xs text-ink-500">
                  Consent: {p.consentAt ? `${fmt(p.consentAt)} (version ${p.consentVersion ?? '—'})` : 'not recorded'}
                </p>
                <p className="text-xs text-ink-500">
                  Welcome email: <strong>{EMAIL_LABEL[p.emailStatus] ?? p.emailStatus}</strong>
                  {p.emailSentAt ? ` · ${fmt(p.emailSentAt)}` : ''}
                </p>
                {student.canManage && (
                  <button
                    onClick={resend}
                    disabled={busy}
                    className="mt-2 h-9 px-3 rounded-lg border border-ink-300 text-xs font-semibold text-ink-800 hover:bg-canvas disabled:opacity-50"
                  >
                    Resend welcome email
                  </button>
                )}
              </div>
            </section>

            {p.contact && (
              <section className="bg-surface rounded-2xl border border-ink-200 p-5">
                <h2 className="font-heading font-bold text-sm text-ink-950 mb-3">Contact details (administrators only)</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  {[
                    ['Email', p.contact.email],
                    ['Phone', p.contact.phone],
                    ['WhatsApp', p.contact.whatsapp],
                    ['Address', p.contact.address],
                    ['Emergency contact', p.contact.emergencyContact],
                    ['Emergency phone', p.contact.emergencyPhone],
                    ['Notes', p.contact.notes],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-ink-500">{k}</dt>
                      <dd className="text-ink-950 break-words">{v || '—'}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            <section className="bg-surface rounded-2xl border border-ink-200 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h2 className="font-heading font-bold text-sm text-ink-950">Scores</h2>
                <p className="text-xs text-ink-600">
                  Quiz total {student.summary.quizTotal ?? '—'}/40 · Overall {student.summary.cumulativeTotal ?? '—'}/100 ·{' '}
                  <strong>{student.summary.graduationStatus}</strong>
                  {student.summary.honourClass ? ` · ${student.summary.honourClass}` : ''}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-ink-500">
                      <th className="py-1.5 pr-3 font-semibold">Course</th>
                      <th className="py-1.5 pr-3 font-semibold">Score</th>
                      <th className="py-1.5 font-semibold">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {student.scores.map((x) => (
                      <tr key={x.courseCode}>
                        <td className="py-1.5 pr-3 text-ink-900">{x.title}</td>
                        <td className="py-1.5 pr-3 font-mono">{x.score ?? '—'} / {x.maxScore}</td>
                        <td className="py-1.5 text-ink-500">
                          {x.isOverride ? `Set by staff${x.overrideReason ? `: ${x.overrideReason}` : ''}` : x.score !== null ? 'Taken online' : 'Not taken'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-surface rounded-2xl border border-ink-200 p-5">
              <h2 className="font-heading font-bold text-sm text-ink-950 mb-3">Attendance</h2>
              {student.attendance.length === 0 ? (
                <p className="text-xs text-ink-500">No attendance recorded yet.</p>
              ) : (
                <ul className="text-xs divide-y divide-ink-100">
                  {student.attendance.map((a) => (
                    <li key={a.courseName} className="py-1.5 flex justify-between gap-3">
                      <span className="text-ink-900">{a.courseName}</span>
                      <span className="text-ink-600">{a.status} · {a.sessionDate}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="bg-surface rounded-2xl border border-ink-200 p-5">
              <h2 className="font-heading font-bold text-sm text-ink-950 mb-2">Certificate</h2>
              <p className="text-xs text-ink-700">
                {student.certificate
                  ? `${student.certificate.certificateNo} · ${student.certificate.honourClass} · issued ${fmt(student.certificate.issuedAt)}`
                  : 'Not issued.'}
              </p>
            </section>

            <section className="bg-surface rounded-2xl border border-ink-200 p-5">
              <h2 className="font-heading font-bold text-sm text-ink-950 mb-3">Change history</h2>
              {student.history.length === 0 ? (
                <p className="text-xs text-ink-500">No staff changes recorded.</p>
              ) : (
                <ul className="text-xs divide-y divide-ink-100">
                  {student.history.map((h, i) => (
                    <li key={i} className="py-2 space-y-0.5">
                      <p className="text-ink-900">
                        <strong>{h.action.replace(/_/g, ' ')}</strong> by {h.actorEmail ?? 'unknown'} · {fmt(h.at)}
                      </p>
                      {h.reason && <p className="text-ink-500">Reason: {h.reason}</p>}
                      <p className="font-mono text-[11px] text-ink-500 break-all">
                        {h.oldValue ? JSON.stringify(h.oldValue) : '—'} → {h.newValue ? JSON.stringify(h.newValue) : '—'}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
