'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import {
  activateSemesterAction,
  closeSemesterAction,
  createSemesterAction,
  listSemestersAction,
  type SemesterItem,
} from '@/actions/semesters';
import { COHORT_TYPES } from '@/lib/validation/semester';

export default function SemestersPage() {
  const [semesters, setSemesters] = useState<SemesterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<(typeof COHORT_TYPES)[number]>('Regular');
  const [year, setYear] = useState(new Date().getFullYear());
  const [makeActive, setMakeActive] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listSemestersAction();
    if (res.success && res.semesters) {
      setSemesters(res.semesters);
      setError(null);
    } else {
      setError(res.error ?? 'Could not load semesters.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (id: string, fn: () => Promise<{ success: boolean; error?: string }>) => {
    setBusyId(id);
    const res = await fn();
    setError(res.success ? null : res.error ?? 'Update failed');
    await load();
    setBusyId(null);
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const res = await createSemesterAction({ name, type, year, makeActive });
    if (res.success) {
      setName('');
      setError(null);
    } else {
      setError(res.error ?? 'Could not create the semester.');
    }
    await load();
    setCreating(false);
  };

  const confirmClose = (s: SemesterItem) =>
    window.confirm(
      `Close "${s.name}"? New registrations, quizzes and check-ins for the ${s.type} cohort will stop until a semester is made active again.`
    );

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-ink-200 bg-surface px-4 sm:px-8 py-4 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/broadsheet"
              className="w-9 h-9 rounded-xl border border-ink-200 flex items-center justify-center text-ink-600 hover:text-ink-950 hover:bg-canvas transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <span className="font-heading font-extrabold text-base sm:text-lg text-ink-950">Semester Setup</span>
              <p className="text-xs text-ink-500">One active semester per cohort. Registration, quizzes and check-in use it.</p>
            </div>
          </div>
          <button
            onClick={load}
            className="h-9 px-3 rounded-lg border border-ink-200 text-xs font-semibold text-ink-700 hover:bg-canvas transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
            {error}
          </div>
        )}

        <section className="bg-surface rounded-2xl border border-ink-200 p-5 shadow-xs">
          <h2 className="font-heading font-bold text-base text-ink-950 mb-3">New semester</h2>
          <form onSubmit={create} className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
            <label className="sm:col-span-3 text-xs font-semibold text-ink-600">
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={80}
                placeholder="e.g. Regular Cohort — Jan 2027"
                className="mt-1 w-full h-10 px-3 rounded-xl border border-ink-200 bg-surface text-ink-950 text-sm"
              />
            </label>
            <label className="sm:col-span-2 text-xs font-semibold text-ink-600">
              Cohort
              <select
                value={type}
                onChange={(e) => setType(e.target.value as (typeof COHORT_TYPES)[number])}
                className="mt-1 w-full h-10 px-3 rounded-xl border border-ink-200 bg-surface text-ink-950 text-sm"
              >
                {COHORT_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-ink-600">
              Year
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                min={2024}
                max={2100}
                className="mt-1 w-full h-10 px-3 rounded-xl border border-ink-200 bg-surface text-ink-950 text-sm"
              />
            </label>
            <label className="sm:col-span-4 flex items-center gap-2 text-xs text-ink-700">
              <input type="checkbox" checked={makeActive} onChange={(e) => setMakeActive(e.target.checked)} />
              Make it the active semester for this cohort (replaces the current one)
            </label>
            <button
              type="submit"
              disabled={creating}
              className="sm:col-span-2 h-10 rounded-xl bg-ink-950 text-white text-xs font-semibold hover:bg-ink-800 disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create semester'}
            </button>
          </form>
        </section>

        <section className="bg-surface rounded-2xl border border-ink-200 shadow-sm overflow-hidden">
          {loading && semesters.length === 0 ? (
            <div className="p-12 text-center text-xs text-ink-500">Loading semesters…</div>
          ) : semesters.length === 0 ? (
            <div className="p-12 text-center text-xs text-ink-500">
              No semesters yet. Create one above before opening registration.
            </div>
          ) : (
            <ul className="divide-y divide-ink-100">
              {semesters.map((s) => (
                <li key={s.id} className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm text-ink-950">{s.name}</strong>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          s.type === 'Sunday Cohort'
                            ? 'bg-solar-100 text-solar-900'
                            : 'bg-ink-100 text-ink-700'
                        }`}
                      >
                        {s.type}
                      </span>
                      {s.isActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-status-graduate-bg text-status-graduate-text">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-canvas text-ink-500 border border-ink-200">
                          Closed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-500">
                      {s.year} · {s.studentCount} student{s.studentCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {s.isActive ? (
                      <button
                        disabled={busyId === s.id}
                        onClick={() => confirmClose(s) && run(s.id, () => closeSemesterAction(s.id))}
                        className="h-9 px-3 rounded-lg border border-ink-200 text-xs font-semibold text-ink-700 hover:bg-canvas disabled:opacity-50"
                      >
                        Close
                      </button>
                    ) : (
                      <button
                        disabled={busyId === s.id}
                        onClick={() => run(s.id, () => activateSemesterAction(s.id))}
                        className="h-9 px-3 rounded-lg bg-ink-950 text-white text-xs font-semibold hover:bg-ink-800 disabled:opacity-50"
                      >
                        Make active
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
