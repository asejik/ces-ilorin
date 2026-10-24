'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { ArrowLeft, Award, Download, Upload } from 'lucide-react';
import {
  applyResultsImportAction,
  previewResultsImportAction,
  type ImportPreview,
  type ImportResult,
} from '@/actions/import-results';
import { batchIssueCertificatesAction } from '@/actions/broadsheet';
import { buildImportTemplateWorkbook } from '@/lib/import-sheet';
import { COHORT_TYPES } from '@/lib/validation/semester';

export default function ImportResultsPage() {
  const [cohort, setCohort] = useState<(typeof COHORT_TYPES)[number]>('Regular');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [certMessage, setCertMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'preview' | 'apply' | 'certs' | null>(null);

  const downloadTemplate = () => {
    const { workbook, filename } = buildImportTemplateWorkbook();
    XLSX.writeFile(workbook, filename);
  };

  const formFor = () => {
    const fd = new FormData();
    if (file) fd.set('file', file);
    fd.set('cohort', cohort);
    return fd;
  };

  const reset = () => {
    setPreview(null);
    setResult(null);
    setCertMessage(null);
    setError(null);
  };

  const runPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    if (!file) {
      setError('Choose an Excel file first.');
      return;
    }
    setBusy('preview');
    const res = await previewResultsImportAction(formFor());
    if (res.success && res.preview) setPreview(res.preview);
    else setError(res.error ?? 'Could not read the file.');
    setBusy(null);
  };

  const runApply = async () => {
    if (!preview) return;
    if (
      !window.confirm(
        `Save ${preview.scoreChangeCount} score(s) and ${preview.attendanceChangeCount} attendance record(s) to ${preview.semesterName}? This is recorded in the audit log.`
      )
    )
      return;
    setBusy('apply');
    const res = await applyResultsImportAction(formFor());
    if (res.success && res.result) {
      setResult(res.result);
      setPreview(null);
      setError(null);
    } else {
      setError(res.error ?? 'Import failed.');
    }
    setBusy(null);
  };

  const runCertificates = async () => {
    if (
      !window.confirm(
        `Generate certificates for every graduate in the ${cohort} cohort who does not have one yet? Only students who meet the graduation rules are included.`
      )
    )
      return;
    setBusy('certs');
    const res = await batchIssueCertificatesAction(cohort);
    setCertMessage(
      res.success
        ? `Done. ${res.issuedCount ?? 0} new certificate(s) issued. ${res.totalGraduates ?? 0} graduate(s) in this cohort.`
        : res.error ?? 'Could not generate certificates.'
    );
    setBusy(null);
  };

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-ink-200 bg-surface px-4 sm:px-8 py-4 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link
            href="/admin/broadsheet"
            className="w-9 h-9 rounded-xl border border-ink-200 flex items-center justify-center text-ink-600 hover:text-ink-950 hover:bg-canvas transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-heading font-extrabold text-base sm:text-lg text-ink-950">Import Results</h1>
            <p className="text-xs text-ink-500">Upload an Excel file of scores and attendance, check it, then save and issue certificates.</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
            {error}
          </div>
        )}

        <section className="bg-surface rounded-2xl border border-ink-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="font-heading font-bold text-base text-ink-950">1. Choose the file</h2>
            <button
              type="button"
              onClick={downloadTemplate}
              className="h-9 px-3 rounded-lg border border-ink-300 text-xs font-semibold text-ink-800 hover:bg-canvas flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Download blank template
            </button>
          </div>
          <form onSubmit={runPreview} className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
            <label className="sm:col-span-2 text-xs font-semibold text-ink-600">
              Cohort
              <select
                value={cohort}
                onChange={(e) => {
                  setCohort(e.target.value as (typeof COHORT_TYPES)[number]);
                  reset();
                }}
                className="mt-1 w-full h-10 px-3 rounded-xl border border-ink-200 bg-surface text-ink-950 text-sm"
              >
                {COHORT_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="sm:col-span-3 text-xs font-semibold text-ink-600">
              Excel file (.xlsx)
              <input
                type="file"
                accept=".xlsx"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  reset();
                }}
                className="mt-1 w-full h-10 px-3 py-2 rounded-xl border border-ink-200 bg-surface text-ink-950 text-xs"
              />
            </label>
            <button
              type="submit"
              disabled={busy !== null}
              className="h-10 rounded-xl bg-ink-950 text-white text-xs font-semibold hover:bg-ink-800 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" /> {busy === 'preview' ? 'Checking…' : 'Check file'}
            </button>
          </form>
          <p className="text-[11px] text-ink-500">
            Scores go into the active {cohort} semester as manual entries. Blank cells keep what is already saved. Nothing is saved until you confirm below.
          </p>
        </section>

        {preview && (
          <section className="bg-surface rounded-2xl border border-ink-200 p-5 shadow-xs space-y-4">
            <h2 className="font-heading font-bold text-base text-ink-950">2. Check the preview</h2>
            <p className="text-xs text-ink-600">
              {preview.fileName} → {preview.semesterName} ({preview.cohortType}). Columns found: {preview.columnsFound.join(', ')}.
            </p>
            <dl className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              {[
                ['Rows in file', preview.totalRows],
                ['Ready', preview.validRows],
                ['With problems', preview.problemRowCount],
                ['Scores to save', preview.scoreChangeCount],
                ['Attendance to save', preview.attendanceChangeCount],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-xl border border-ink-200 p-3">
                  <dd className="text-lg font-bold text-ink-950">{value}</dd>
                  <dt className="text-[11px] text-ink-500">{label}</dt>
                </div>
              ))}
            </dl>

            {preview.problemRowCount > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <h3 className="text-xs font-bold text-amber-900 mb-2">
                  {preview.problemRowCount} row(s) will be skipped. Fix them in Excel and upload again to include them.
                </h3>
                <ul className="text-xs text-amber-900 space-y-1 max-h-60 overflow-auto">
                  {preview.problems.map((p) => (
                    <li key={p.rowNumber}>
                      Row {p.rowNumber}
                      {p.matricNo ? ` (${p.matricNo})` : ''}: {p.messages.join('; ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {preview.changes.length > 0 && (
              <div className="rounded-xl border border-ink-200 p-3">
                <h3 className="text-xs font-bold text-ink-800 mb-2">What will change (first {preview.changes.length} students)</h3>
                <ul className="text-xs text-ink-700 space-y-1 max-h-60 overflow-auto">
                  {preview.changes.map((c) => (
                    <li key={c.matricNo}>
                      <span className="font-semibold">{c.matricNo}</span>: {c.summary}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="button"
              onClick={runApply}
              disabled={busy !== null || preview.scoreChangeCount + preview.attendanceChangeCount === 0}
              className="h-10 px-5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy === 'apply'
                ? 'Saving…'
                : preview.scoreChangeCount + preview.attendanceChangeCount === 0
                  ? 'Nothing to save'
                  : `Save ${preview.validRows - preview.unchangedRows} student(s)`}
            </button>
          </section>
        )}

        {result && (
          <section className="bg-surface rounded-2xl border border-emerald-200 p-5 shadow-xs space-y-3">
            <h2 className="font-heading font-bold text-base text-ink-950">3. Saved</h2>
            <p role="status" className="text-xs text-emerald-800">
              Saved {result.scoresSaved} score(s) and {result.attendanceSaved} attendance record(s). {result.skippedRows} row(s) were skipped. Every change is in the audit log.
            </p>
            <button
              type="button"
              onClick={runCertificates}
              disabled={busy !== null}
              className="h-10 px-5 rounded-xl bg-solar-600 text-white text-xs font-bold hover:bg-solar-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Award className="w-4 h-4" /> {busy === 'certs' ? 'Generating…' : 'Generate certificates'}
            </button>
            {certMessage && (
              <p role="status" className="text-xs text-ink-800">
                {certMessage}
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
