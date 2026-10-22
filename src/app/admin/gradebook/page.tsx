'use client';

import { GradebookHeader } from './_components/gradebook-header';
import { KpiBanner } from './_components/kpi-banner';
import { RosterFilters } from './_components/roster-filters';
import { RosterTable } from './_components/roster-table';
import { OverrideModal } from './_components/override-modal';
import { useGradebook } from './_components/use-gradebook';

export default function GradebookPage() {
  const gb = useGradebook();

  return (
    <div className="min-h-screen bg-canvas">
      <GradebookHeader loading={gb.loading} onRefresh={gb.loadGradebook} />

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <KpiBanner
          selectedCohort={gb.selectedCohort}
          onSelectCohort={gb.setSelectedCohort}
          kpis={gb.kpis}
        />
        <RosterFilters
          searchQuery={gb.searchQuery}
          onSearchChange={gb.setSearchQuery}
          filterStatus={gb.filterStatus}
          onFilterChange={gb.setFilterStatus}
          totalRows={gb.rows.length}
        />
        <RosterTable
          loading={gb.loading}
          rows={gb.filteredRows}
          onOpenScoreOverride={gb.handleOpenScoreOverride}
          onToggleAttendance={gb.handleToggleAttendance}
        />
      </main>

      {gb.overrideModal && (
        <OverrideModal
          target={gb.overrideModal}
          scoreInput={gb.overrideScoreInput}
          onScoreChange={gb.setOverrideScoreInput}
          reasonInput={gb.overrideReasonInput}
          onReasonChange={gb.setOverrideReasonInput}
          saving={gb.overrideSaving}
          error={gb.overrideError}
          onClose={gb.closeOverrideModal}
          onSubmit={gb.handleSubmitScoreOverride}
        />
      )}
    </div>
  );
}
