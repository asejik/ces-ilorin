'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Award,
  CheckCircle2,
  Clock,
  XCircle,
  FileSpreadsheet,
  X,
  Printer,
  ExternalLink,
} from 'lucide-react';
import {
  getBroadsheetAction,
  issueCertificateAction,
  batchIssueCertificatesAction,
} from '@/actions/broadsheet';
import { exportBroadsheetToExcel } from '@/lib/excel';
import { getHonourBadgeDetails } from '@/lib/certificate';
import type { StudentBroadsheetRow, BroadsheetKPIs, CertificateDetails } from '@/types/broadsheet';

const QUIZ_COLUMNS = [
  { code: 'salvation', short: 'Salv', name: 'Salvation' },
  { code: 'righteousness', short: 'Rght', name: 'Righteousness' },
  { code: 'word_of_god', short: 'Word', name: 'Word of God' },
  { code: 'love_walk', short: 'Love', name: 'Love Walk' },
  { code: 'service', short: 'Serv', name: 'Service' },
  { code: 'spiritual_authority', short: 'Auth', name: 'Authority' },
  { code: 'holy_spirit', short: 'Spir', name: 'Holy Spirit' },
  { code: 'prayer', short: 'Pray', name: 'Prayer' },
];

export default function BroadsheetPage() {
  const [selectedCohort, setSelectedCohort] = useState<'Regular' | 'Sunday Cohort'>('Regular');
  const [rows, setRows] = useState<StudentBroadsheetRow[]>([]);
  const [kpis, setKpis] = useState<BroadsheetKPIs | null>(null);
  const [semesterName, setSemesterName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'ALL' | 'GRADUATE' | 'PENDING' | 'NOT_YET' | 'HONOURS'
  >('ALL');

  // Certificate Modal State
  const [certModal, setCertModal] = useState<CertificateDetails | null>(null);
  const [issuingStudentId, setIssuingStudentId] = useState<string | null>(null);
  const [batchIssuing, setBatchIssuing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadBroadsheet = async () => {
    setLoading(true);
    const res = await getBroadsheetAction(selectedCohort);
    if (res.success && res.rows) {
      setRows(res.rows);
      setKpis(res.kpis ?? null);
      setSemesterName(res.semester?.name ?? `${selectedCohort} — 2026`);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBroadsheet();
  }, [selectedCohort]);

  // Handle Single Certificate Issuance
  const handleIssueCertificate = async (studentId: string) => {
    setIssuingStudentId(studentId);
    const res = await issueCertificateAction(studentId);
    setIssuingStudentId(null);

    if (res.success && res.certificate) {
      showToast(`Certificate ${res.certificate.certificateNo} issued successfully!`);
      // Update row in-place
      setRows((prev) =>
        prev.map((r) =>
          r.studentId === studentId
            ? {
                ...r,
                certificateId: res.certificate!.id,
                certificateNo: res.certificate!.certificateNo,
                certificateIssuedAt: res.certificate!.issuedAt,
              }
            : r
        )
      );
      setCertModal(res.certificate);
    } else {
      showToast(`Failed: ${res.error ?? 'Unknown error'}`);
    }
  };

  // Handle Batch Certificate Issuance
  const handleBatchIssue = async () => {
    const unissuedGraduates = rows.filter(
      (r) => r.graduationStatus === '✅ GRADUATE' && !r.certificateId
    );
    if (unissuedGraduates.length === 0) {
      showToast('All qualified graduates already possess issued certificates.');
      return;
    }

    setBatchIssuing(true);
    const res = await batchIssueCertificatesAction(selectedCohort);
    setBatchIssuing(false);

    if (res.success) {
      showToast(`Batch completed: ${res.issuedCount ?? 0} new certificate(s) issued.`);
      loadBroadsheet();
    } else {
      showToast(`Batch error: ${res.error ?? 'Failed to issue'}`);
    }
  };

  // Handle Excel Export
  const handleExportExcel = () => {
    if (rows.length === 0) {
      showToast('No student data available to export.');
      return;
    }
    exportBroadsheetToExcel({
      cohortName: selectedCohort,
      semesterName,
      rows,
      kpis,
    });
    showToast('Official broadsheet spreadsheet downloaded!');
  };

  // Filter Rows
  const filteredRows = rows.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.matricNo.toLowerCase().includes(q) ||
      r.fullName.toLowerCase().includes(q) ||
      (r.certificateNo && r.certificateNo.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (filterStatus === 'GRADUATE') return r.graduationStatus === '✅ GRADUATE';
    if (filterStatus === 'PENDING') return r.graduationStatus === '⏳ PENDING';
    if (filterStatus === 'NOT_YET') return r.graduationStatus === '❌ NOT YET';
    if (filterStatus === 'HONOURS') {
      return r.honourClass === 'Distinction' || r.honourClass === 'Merit';
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-canvas">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink-950 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in border border-ink-800">
          <Award className="w-4 h-4 text-solar-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-ink-200 bg-surface px-4 sm:px-8 py-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-9 h-9 rounded-xl border border-ink-200 flex items-center justify-center text-ink-600 hover:text-ink-950 hover:bg-canvas transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-base sm:text-lg text-ink-950">
                  Master Graduation Broadsheet
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-solar-100 text-solar-800">
                  Board Review
                </span>
              </div>
              <p className="text-xs text-ink-500">
                Official composite results, continuous assessments, clearance standing, and certificate issuance.
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={loadBroadsheet}
              className="h-9 px-3 rounded-lg border border-ink-200 text-xs font-semibold text-ink-700 hover:bg-canvas transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="h-9 px-3.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handleBatchIssue}
              disabled={batchIssuing}
              className="h-9 px-3.5 rounded-lg bg-solar-600 text-white text-xs font-bold hover:bg-solar-700 transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Award className={`w-4 h-4 ${batchIssuing ? 'animate-bounce' : ''}`} />
              <span>{batchIssuing ? 'Issuing...' : 'Batch Issue All'}</span>
            </button>

            <Link
              href="/admin/gradebook"
              className="h-9 px-3 rounded-lg bg-surface border border-ink-300 text-ink-800 text-xs font-semibold hover:bg-surface-subtle transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>Teacher Gradebook →</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* KPI Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Cohort Switcher */}
          <div className="bg-surface rounded-2xl border border-ink-200 p-3 sm:p-4 shadow-xs col-span-2 flex flex-col justify-between">
            <span className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-1.5">
              Select Cohort
            </span>
            <div className="grid grid-cols-2 gap-1.5 bg-canvas p-1 rounded-xl border border-ink-200">
              <button
                type="button"
                onClick={() => setSelectedCohort('Regular')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  selectedCohort === 'Regular'
                    ? 'bg-surface text-ink-950 shadow-xs'
                    : 'text-ink-600 hover:text-ink-950'
                }`}
              >
                Regular Cohort
              </button>
              <button
                type="button"
                onClick={() => setSelectedCohort('Sunday Cohort')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  selectedCohort === 'Sunday Cohort'
                    ? 'bg-solar-600 text-white shadow-xs'
                    : 'text-ink-600 hover:text-ink-950'
                }`}
              >
                Sunday Cohort
              </button>
            </div>
          </div>

          {/* KPI: Cleared Graduates */}
          <div className="bg-surface rounded-2xl border border-ink-200 p-3 sm:p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-500 uppercase tracking-wider">
                Graduates
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-heading font-black text-ink-950">
                {kpis?.graduatesCount ?? 0}
              </span>
              <span className="text-xs font-semibold text-emerald-600">
                / {kpis?.totalStudents ?? 0}
              </span>
            </div>
            <span className="text-[11px] text-ink-400 mt-1 block">
              {kpis && kpis.totalStudents > 0
                ? `${Math.round((kpis.graduatesCount / kpis.totalStudents) * 100)}% clearance rate`
                : '0% clearance'}
            </span>
          </div>

          {/* KPI: Pending */}
          <div className="bg-surface rounded-2xl border border-ink-200 p-3 sm:p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-500 uppercase tracking-wider">
                Pending
              </span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-heading font-black text-amber-600">
                {kpis?.pendingCount ?? 0}
              </span>
              <span className="text-xs font-semibold text-ink-400">awaiting</span>
            </div>
            <span className="text-[11px] text-ink-400 mt-1 block">Quizzes or class attendance</span>
          </div>

          {/* KPI: Average Score */}
          <div className="bg-surface rounded-2xl border border-ink-200 p-3 sm:p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-500 uppercase tracking-wider">
                Cohort Avg
              </span>
              <Award className="w-4 h-4 text-solar-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-heading font-black text-ink-950">
                {kpis?.averageScore ?? 0}
              </span>
              <span className="text-xs font-semibold text-ink-400">/ 100</span>
            </div>
            <span className="text-[11px] text-ink-400 mt-1 block">Cumulative composite</span>
          </div>

          {/* KPI: Distinctions & Merits */}
          <div className="bg-surface rounded-2xl border border-ink-200 p-3 sm:p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-500 uppercase tracking-wider">
                Honours
              </span>
              <span className="text-xs font-bold text-solar-600">≥ 75%</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-heading font-black text-ink-950">
                {(kpis?.distinctionCount ?? 0) + (kpis?.meritCount ?? 0)}
              </span>
              <span className="text-[11px] font-semibold text-ink-500">
                ({kpis?.distinctionCount ?? 0} Dist)
              </span>
            </div>
            <span className="text-[11px] text-ink-400 mt-1 block">Distinctions & Merits</span>
          </div>
        </div>

        {/* Filter and Search Controls */}
        <div className="bg-surface rounded-2xl border border-ink-200 p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setFilterStatus('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  filterStatus === 'ALL'
                    ? 'bg-ink-950 text-white'
                    : 'bg-canvas text-ink-600 hover:text-ink-950'
                }`}
              >
                All Candidates ({rows.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('GRADUATE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  filterStatus === 'GRADUATE'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-canvas text-ink-600 hover:text-ink-950'
                }`}
              >
                Graduates ({kpis?.graduatesCount ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('PENDING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  filterStatus === 'PENDING'
                    ? 'bg-amber-600 text-white'
                    : 'bg-canvas text-ink-600 hover:text-ink-950'
                }`}
              >
                Pending ({kpis?.pendingCount ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('HONOURS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  filterStatus === 'HONOURS'
                    ? 'bg-solar-600 text-white'
                    : 'bg-canvas text-ink-600 hover:text-ink-950'
                }`}
              >
                Honours ({(kpis?.distinctionCount ?? 0) + (kpis?.meritCount ?? 0)})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('NOT_YET')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  filterStatus === 'NOT_YET'
                    ? 'bg-red-600 text-white'
                    : 'bg-canvas text-ink-600 hover:text-ink-950'
                }`}
              >
                Not Yet ({kpis?.notYetCount ?? 0})
              </button>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate or matric no..."
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-ink-200 bg-canvas text-xs text-ink-900 focus:outline-hidden focus:ring-2 focus:ring-solar-500/20 focus:border-solar-500"
              />
            </div>
          </div>
        </div>

        {/* Master Broadsheet Table */}
        <div className="bg-surface rounded-2xl border border-ink-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-surface-subtle border-b border-ink-200 text-[11px] font-bold text-ink-600 uppercase tracking-wider">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-3 min-w-[180px]">Candidate Details</th>
                  {QUIZ_COLUMNS.map((col) => (
                    <th key={col.code} className="py-3 px-2 text-center w-12" title={col.name}>
                      {col.short}
                    </th>
                  ))}
                  <th className="py-3 px-2 text-center w-14 bg-solar-50/50 font-extrabold text-ink-900">
                    Quiz /40
                  </th>
                  <th className="py-3 px-2 text-center w-14 bg-solar-50/50 font-extrabold text-ink-900">
                    Exam /60
                  </th>
                  <th className="py-3 px-2 text-center w-16 bg-solar-100/50 font-black text-ink-950">
                    Total /100
                  </th>
                  <th className="py-3 px-2 text-center min-w-[110px]">Elem. Princ.</th>
                  <th className="py-3 px-2 text-center min-w-[110px]">Mem. & Vision</th>
                  <th className="py-3 px-3 text-center min-w-[120px]">Clearance</th>
                  <th className="py-3 px-3 text-center min-w-[100px]">Honours</th>
                  <th className="py-3 px-3 text-center min-w-[140px]">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {loading ? (
                  <tr>
                    <td colSpan={19} className="py-12 text-center text-ink-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-solar-500" />
                      Loading master academic broadsheet...
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={19} className="py-12 text-center text-ink-500">
                      No candidate records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, idx) => {
                    const isGraduate = row.graduationStatus === '✅ GRADUATE';
                    const isPending = row.graduationStatus === '⏳ PENDING';
                    const hasCert = Boolean(row.certificateId);
                    const honourBadge = getHonourBadgeDetails(row.honourClass);

                    return (
                      <tr
                        key={row.studentId}
                        className="hover:bg-canvas/60 transition-colors group"
                      >
                        {/* Index */}
                        <td className="py-3 px-3 text-center text-ink-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>

                        {/* Candidate Identity */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            {row.passportUrl ? (
                              <img
                                src={row.passportUrl}
                                alt={row.fullName}
                                className="w-8 h-8 rounded-lg object-cover border border-ink-200 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-surface-subtle border border-ink-200 flex items-center justify-center font-bold text-ink-600 text-xs shrink-0">
                                {row.fullName.charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-bold text-ink-950 block truncate">
                                {row.fullName}
                              </span>
                              <span className="font-mono text-[11px] text-ink-500 block truncate">
                                {row.matricNo}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 8 Quiz Scores */}
                        {QUIZ_COLUMNS.map((col) => {
                          const qInfo = row.quizzes[col.code];
                          const score = qInfo?.score;
                          return (
                            <td key={col.code} className="py-3 px-2 text-center font-mono text-xs">
                              {score !== null && score !== undefined ? (
                                <span
                                  className={
                                    qInfo?.isOverride ? 'text-amber-700 font-bold' : 'text-ink-800'
                                  }
                                >
                                  {score.toFixed(1)}
                                  {qInfo?.isOverride && <span className="text-[10px] ml-0.5">M</span>}
                                </span>
                              ) : (
                                <span className="text-ink-300">-</span>
                              )}
                            </td>
                          );
                        })}

                        {/* Quiz Total */}
                        <td className="py-3 px-2 text-center font-mono font-bold bg-solar-50/40 text-ink-900">
                          {row.quizTotal !== null ? row.quizTotal.toFixed(1) : '-'}
                        </td>

                        {/* Final Exam */}
                        <td className="py-3 px-2 text-center font-mono font-bold bg-solar-50/40 text-ink-900">
                          {row.finalExam?.score !== null && row.finalExam?.score !== undefined
                            ? row.finalExam.score.toFixed(1)
                            : '-'}
                        </td>

                        {/* Cumulative Total */}
                        <td className="py-3 px-2 text-center font-mono font-black bg-solar-100/40 text-ink-950 text-sm">
                          {row.cumulativeTotal !== null ? (
                            <span
                              className={
                                row.cumulativeTotal >= 50 ? 'text-emerald-700' : 'text-red-600'
                              }
                            >
                              {row.cumulativeTotal.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-ink-300">-</span>
                          )}
                        </td>

                        {/* Elementary Principles */}
                        <td className="py-3 px-2 text-center">
                          {row.elementaryPrinciples === 'Attended' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Attended
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              {row.elementaryPrinciples ?? 'Pending'}
                            </span>
                          )}
                        </td>

                        {/* Membership & Vision */}
                        <td className="py-3 px-2 text-center">
                          {row.membershipVision === 'Attended' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Attended
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              {row.membershipVision ?? 'Pending'}
                            </span>
                          )}
                        </td>

                        {/* Clearance Status */}
                        <td className="py-3 px-3 text-center">
                          {isGraduate ? (
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              GRADUATE
                            </span>
                          ) : isPending ? (
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center gap-1">
                              <Clock className="w-3 h-3 text-amber-700" />
                              PENDING
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-100 text-red-900 border border-red-300 flex items-center justify-center gap-1">
                              <XCircle className="w-3 h-3 text-red-700" />
                              NOT YET
                            </span>
                          )}
                        </td>

                        {/* Honour Class */}
                        <td className="py-3 px-3 text-center">
                          {row.honourClass && isGraduate ? (
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${honourBadge.badgeBg} ${honourBadge.badgeText} ${honourBadge.badgeBorder}`}
                            >
                              {row.honourClass}
                            </span>
                          ) : (
                            <span className="text-ink-400 text-[11px]">-</span>
                          )}
                        </td>

                        {/* Certificate Action */}
                        <td className="py-3 px-3 text-center">
                          {hasCert ? (
                            <button
                              type="button"
                              onClick={() =>
                                setCertModal({
                                  id: row.certificateId!,
                                  certificateNo: row.certificateNo!,
                                  studentId: row.studentId,
                                  studentName: row.fullName,
                                  matricNo: row.matricNo,
                                  passportUrl: row.passportUrl,
                                  cohortName: semesterName,
                                  cohortType: row.cohortType,
                                  cumulativeTotal: row.cumulativeTotal ?? 0,
                                  honourClass: row.honourClass ?? 'Pass',
                                  issuedAt: row.certificateIssuedAt ?? '',
                                  formattedIssuedDate: new Date().toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                  }),
                                })
                              }
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-solar-100 text-solar-900 hover:bg-solar-200 border border-solar-300 transition-colors flex items-center justify-center gap-1 mx-auto"
                            >
                              <Award className="w-3 h-3 text-solar-700" />
                              <span>{row.certificateNo}</span>
                            </button>
                          ) : isGraduate ? (
                            <button
                              type="button"
                              onClick={() => handleIssueCertificate(row.studentId)}
                              disabled={issuingStudentId === row.studentId}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-ink-950 text-white hover:bg-ink-800 transition-colors flex items-center justify-center gap-1 mx-auto disabled:opacity-50"
                            >
                              <Award className="w-3 h-3 text-solar-400" />
                              <span>
                                {issuingStudentId === row.studentId ? 'Issuing...' : 'Issue Cert'}
                              </span>
                            </button>
                          ) : (
                            <span className="text-ink-400 text-[11px] italic">Not Cleared</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* In-App Certificate Preview Modal */}
      {certModal && (
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
                  {certModal.certificateNo}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/certificate/${encodeURIComponent(certModal.matricNo)}`}
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
                  onClick={() => setCertModal(null)}
                  className="w-8 h-8 rounded-lg border border-ink-200 flex items-center justify-center text-ink-500 hover:text-ink-950 hover:bg-canvas transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Certificate Template Card conforming to docs/DESIGN.md Section 6 */}
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

                <p className="text-xs sm:text-sm text-ink-600 mt-4 mb-2">
                  This is to officially certify that
                </p>

                {/* Candidate Name */}
                <h2 className="font-serif text-2xl sm:text-4xl font-black text-ink-950 tracking-tight my-3 text-solar-900 underline decoration-solar-400 decoration-1 underline-offset-8">
                  {certModal.studentName}
                </h2>

                <p className="text-xs sm:text-sm text-ink-600 max-w-lg mx-auto leading-relaxed my-4">
                  has satisfactorily completed the prescribed discipleship curriculum, assessments,
                  and foundational institutional classes for the{' '}
                  <span className="font-bold text-ink-950">{certModal.cohortName}</span>.
                </p>

                {/* Honour Badge */}
                <div className="my-6">
                  <span className="inline-block px-4 py-1.5 rounded-full border-2 border-solar-500 bg-solar-50 text-solar-900 font-extrabold text-xs sm:text-sm tracking-wider uppercase shadow-xs">
                    Graduated with {certModal.honourClass}
                  </span>
                  <p className="text-[11px] text-ink-400 mt-1">
                    Cumulative Composite: {certModal.cumulativeTotal.toFixed(1)} / 100
                  </p>
                </div>

                {/* Dual Signatures & Metadata */}
                <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-ink-200">
                  <div className="text-center">
                    <div className="h-10 border-b border-ink-400 max-w-[160px] mx-auto flex items-end justify-center pb-1">
                      <span className="font-serif italic text-xs text-ink-600">
                        Senior Pastorate
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-ink-900 block mt-1.5">
                      Pastor In Charge
                    </span>
                    <span className="text-[10px] text-ink-500">Citizens of Light Church</span>
                  </div>

                  <div className="text-center">
                    <div className="h-10 border-b border-ink-400 max-w-[160px] mx-auto flex items-end justify-center pb-1">
                      <span className="font-serif italic text-xs text-ink-600">
                        School Directorate
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-ink-900 block mt-1.5">
                      Director of Studies
                    </span>
                    <span className="text-[10px] text-ink-500">Citizens Elementary School</span>
                  </div>
                </div>

                {/* Footer Certificate Number & Date */}
                <div className="mt-8 pt-4 border-t border-ink-100 flex flex-col sm:flex-row items-center justify-between text-[10px] text-ink-400 gap-2">
                  <span>
                    Certificate No:{' '}
                    <strong className="text-ink-700 font-mono">{certModal.certificateNo}</strong>
                  </span>
                  <span>
                    Matric No:{' '}
                    <strong className="text-ink-700 font-mono">{certModal.matricNo}</strong>
                  </span>
                  <span>
                    Date:{' '}
                    <strong className="text-ink-700">{certModal.formattedIssuedDate}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
