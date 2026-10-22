'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { KeyRound, RefreshCw, Lock, Unlock } from 'lucide-react';
import {
  getClassCodesAction,
  regenerateClassCodeAction,
  setClassCodeOpenAction,
  type ClassCodeItem,
} from '@/actions/attendance';

type Cohort = 'Regular' | 'Sunday Cohort';

/** Teacher panel: open a class for check-in and read the code out to students. */
export function ClassCodesPanel() {
  const [cohort, setCohort] = useState<Cohort>('Regular');
  const [codes, setCodes] = useState<ClassCodeItem[]>([]);
  const [semesterName, setSemesterName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getClassCodesAction(cohort);
    if (res.success && res.codes) {
      setCodes(res.codes);
      setSemesterName(res.semesterName || '');
      setError(null);
    } else {
      setCodes([]);
      setError(res.error || 'Could not load class codes');
    }
    setLoading(false);
  }, [cohort]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (item: ClassCodeItem) => {
    setBusyId(item.id);
    const res = await setClassCodeOpenAction(item.id, !item.isOpen);
    if (!res.success) setError(res.error || 'Update failed');
    await load();
    setBusyId(null);
  };

  const regenerate = async (item: ClassCodeItem) => {
    setBusyId(item.id);
    const res = await regenerateClassCodeAction(item.id);
    if (!res.success) setError(res.error || 'Update failed');
    await load();
    setBusyId(null);
  };

  return (
    <section className="bg-surface rounded-2xl border border-ink-200 p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-solar-600" />
          <h2 className="font-heading font-bold text-sm text-ink-950">Class check-in codes</h2>
          {semesterName && <span className="text-xs text-ink-500">{semesterName}</span>}
        </div>
        <div className="flex rounded-lg border border-ink-200 overflow-hidden text-xs font-semibold">
          {(['Regular', 'Sunday Cohort'] as Cohort[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCohort(c)}
              className={`px-3 h-8 ${cohort === c ? 'bg-ink-950 text-white' : 'text-ink-700 hover:bg-canvas'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-ink-500 mb-4">
        Open a class, then read its code to the students in the room. Students cannot check in without it.
        Close the class when it ends; regenerate the code if it leaks.
      </p>

      {error && <p className="text-xs text-status-notyet-text mb-3">{error}</p>}

      <div className="divide-y divide-ink-100">
        {loading && codes.length === 0 && <p className="text-xs text-ink-500 py-2">Loading…</p>}
        {codes.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center gap-3 py-2.5">
            <span className="flex-1 min-w-[180px] text-sm font-semibold text-ink-900">{item.courseName}</span>
            <span
              className={`font-mono text-sm font-bold tracking-widest px-2.5 py-1 rounded-lg ${
                item.isOpen ? 'bg-solar-50 text-solar-900 border border-solar-300' : 'bg-ink-100 text-ink-400'
              }`}
            >
              {item.code}
            </span>
            <button
              type="button"
              disabled={busyId === item.id}
              onClick={() => toggle(item)}
              className={`h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 ${
                item.isOpen
                  ? 'bg-status-graduate-bg text-status-graduate-text border border-status-graduate-dot/30'
                  : 'border border-ink-200 text-ink-700 hover:bg-canvas'
              }`}
            >
              {item.isOpen ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              {item.isOpen ? 'Open: click to close' : 'Closed: click to open'}
            </button>
            <button
              type="button"
              disabled={busyId === item.id}
              onClick={() => regenerate(item)}
              className="h-8 px-2.5 rounded-lg border border-ink-200 text-xs font-semibold text-ink-600 hover:bg-canvas flex items-center gap-1 disabled:opacity-50"
              title="Generate a new code"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New code</span>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
