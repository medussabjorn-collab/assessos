import { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  icon: Icon,
  action,
}: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      <div>
        {eyebrow && (
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">
            {eyebrow}
          </div>
        )}
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          {Icon && (
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600/15 text-blue-400">
              <Icon size={22} />
            </span>
          )}
          {title}
        </h1>
        {subtitle && <p className="text-slate-400 mt-2 max-w-2xl">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
