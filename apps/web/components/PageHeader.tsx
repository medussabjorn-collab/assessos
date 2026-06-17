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
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-2">
            {eyebrow}
          </div>
        )}
        <h1 className="text-3xl font-bold text-ink flex items-center gap-3">
          {Icon && (
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-brand-50 text-brand-500">
              <Icon size={22} />
            </span>
          )}
          {title}
        </h1>
        {subtitle && <p className="text-subtle mt-2 max-w-2xl">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
