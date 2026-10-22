import type { ComponentType, ReactNode } from 'react';

export function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-surface p-6 sm:p-8 rounded-2xl border border-ink-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-ink-100">
        <Icon className="w-5 h-5 text-solar-600" />
        <h2 className="font-heading font-bold text-base text-ink-950">{title}</h2>
      </div>
      {children}
    </div>
  );
}
