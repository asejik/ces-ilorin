import { Calendar } from 'lucide-react';
import { SectionCard } from './section-card';

export type CohortType = 'Regular' | 'Sunday Cohort';

export function CohortSection({
  cohortType,
  onChange,
}: {
  cohortType: CohortType;
  onChange: (value: CohortType) => void;
}) {
  return (
    <SectionCard icon={Calendar} title="1. Cohort & Study Schedule">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label
          className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
            cohortType === 'Regular'
              ? 'border-ink-950 bg-ink-50/20 shadow-xs'
              : 'border-ink-200 bg-surface hover:border-ink-400'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-heading font-bold text-sm text-ink-950">Regular Semester</span>
            <input
              type="radio"
              name="cohort_type"
              value="Regular"
              checked={cohortType === 'Regular'}
              onChange={() => onChange('Regular')}
              className="w-4 h-4 text-ink-950 focus:ring-solar-500"
            />
          </div>
          <p className="text-xs text-ink-600 leading-relaxed">
            Scheduled weekday morning and evening intensive sessions. Meets all week except Wednesday.
          </p>
        </label>

        <label
          className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
            cohortType === 'Sunday Cohort'
              ? 'border-sunday-600 bg-sunday-50/50 shadow-xs'
              : 'border-ink-200 bg-surface hover:border-sunday-400'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-bold text-sm text-sunday-700">Sunday Cohort</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-sunday-100 text-sunday-600 border border-sunday-200">
                Featured
              </span>
            </div>
            <input
              type="radio"
              name="cohort_type"
              value="Sunday Cohort"
              checked={cohortType === 'Sunday Cohort'}
              onChange={() => onChange('Sunday Cohort')}
              className="w-4 h-4 text-sunday-600 focus:ring-sunday-500"
            />
          </div>
          <p className="text-xs text-ink-600 leading-relaxed">
            Dedicated weekend program designed for workers and professionals. Meets on Sundays only.
          </p>
        </label>
      </div>
    </SectionCard>
  );
}
