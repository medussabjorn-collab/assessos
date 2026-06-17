import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
}

export default function StatCard({ label, value, icon: Icon, hint }: StatCardProps) {
  return (
    <div className="frost-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-subtle text-sm font-medium">{label}</p>
        {Icon && (
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-brand-50 text-brand-500">
            <Icon className="w-4 h-4" />
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-ink mt-3">{value}</p>
      {hint && <p className="text-xs text-subtle mt-1">{hint}</p>}
    </div>
  );
}
