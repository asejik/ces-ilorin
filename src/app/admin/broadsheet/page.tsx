'use client';

import { BroadsheetHeader, Toast } from './_components/broadsheet-header';
import { KpiBanner } from './_components/kpi-banner';
import { FilterBar } from './_components/filter-bar';
import { BroadsheetTable } from './_components/broadsheet-table';
import { CertificateModal } from './_components/certificate-modal';
import { useBroadsheet } from './_components/use-broadsheet';

export default function BroadsheetPage() {
  const bs = useBroadsheet();

  return (
    <div className="min-h-screen bg-canvas">
      {bs.toastMessage && <Toast message={bs.toastMessage} />}

      <BroadsheetHeader
        loading={bs.loading}
        batchIssuing={bs.batchIssuing}
        onRefresh={bs.loadBroadsheet}
        onExport={bs.handleExportExcel}
        onBatchIssue={bs.handleBatchIssue}
      />

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {bs.loadError && (
          <div className="rounded-xl border border-status-notyet-dot/30 bg-status-notyet-bg text-status-notyet-text text-sm font-medium p-4">
            {bs.loadError}
          </div>
        )}
        <KpiBanner
          selectedCohort={bs.selectedCohort}
          onSelectCohort={bs.setSelectedCohort}
          kpis={bs.kpis}
        />
        <FilterBar
          filterStatus={bs.filterStatus}
          onFilterChange={bs.setFilterStatus}
          searchQuery={bs.searchQuery}
          onSearchChange={bs.setSearchQuery}
          totalRows={bs.rows.length}
          kpis={bs.kpis}
        />
        <BroadsheetTable
          loading={bs.loading}
          rows={bs.filteredRows}
          semesterName={bs.semesterName}
          issuingStudentId={bs.issuingStudentId}
          onViewCertificate={bs.setCertModal}
          onIssueCertificate={bs.handleIssueCertificate}
        />
      </main>

      {bs.certModal && <CertificateModal cert={bs.certModal} onClose={bs.closeCertModal} />}
    </div>
  );
}
