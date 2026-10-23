'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getBroadsheetAction,
  issueCertificateAction,
  batchIssueCertificatesAction,
} from '@/actions/broadsheet';
import type { StudentBroadsheetRow, BroadsheetKPIs, CertificateDetails } from '@/types/broadsheet';
import type { CohortFilter, StatusFilter } from './types';

/** State, data loading and actions for the master graduation broadsheet. */
export function useBroadsheet() {
  const [selectedCohort, setSelectedCohort] = useState<CohortFilter>('Regular');
  const [rows, setRows] = useState<StudentBroadsheetRow[]>([]);
  const [kpis, setKpis] = useState<BroadsheetKPIs | null>(null);
  const [semesterName, setSemesterName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('ALL');

  const [certModal, setCertModal] = useState<CertificateDetails | null>(null);
  const [issuingStudentId, setIssuingStudentId] = useState<string | null>(null);
  const [batchIssuing, setBatchIssuing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadBroadsheet = useCallback(async () => {
    setLoading(true);
    const res = await getBroadsheetAction(selectedCohort);
    if (!res.success) {
      setRows([]);
      setKpis(null);
      setLoadError(
        /Forbidden/.test(res.error ?? '')
          ? 'The master broadsheet, certificates and Excel export are for administrators only. Teachers can use the Gradebook.'
          : res.error ?? 'Could not load the broadsheet.'
      );
    }
    if (res.success && res.rows) {
      setLoadError(null);
      setRows(res.rows);
      setKpis(res.kpis ?? null);
      setSemesterName(res.semester?.name ?? `${selectedCohort} — ${new Date().getFullYear()}`);
    }
    setLoading(false);
  }, [selectedCohort]);

  useEffect(() => {
    loadBroadsheet();
  }, [loadBroadsheet]);

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

  const handleExportExcel = async () => {
    if (rows.length === 0) {
      showToast('No student data available to export.');
      return;
    }
    // Load the Excel library only when it is needed (keeps the broadsheet page light).
    const { exportBroadsheetToExcel } = await import('@/lib/excel');
    exportBroadsheetToExcel({
      cohortName: selectedCohort,
      semesterName,
      rows,
      kpis,
    });
    showToast('Official broadsheet spreadsheet downloaded!');
  };

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

  return {
    selectedCohort,
    setSelectedCohort,
    rows,
    kpis,
    semesterName,
    loadError,
    loading,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filteredRows,
    certModal,
    setCertModal,
    closeCertModal: () => setCertModal(null),
    issuingStudentId,
    batchIssuing,
    toastMessage,
    loadBroadsheet,
    handleIssueCertificate,
    handleBatchIssue,
    handleExportExcel,
  };
}
