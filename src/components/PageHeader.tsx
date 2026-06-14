import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, icon, actions }: Props) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        {icon && (
          <div className="w-12 h-12 rounded-xl flex items-center justify-center gold-border bg-navy-800/60">
            {icon}
          </div>
        )}
        <div>
          <h2 className="font-display text-2xl text-navy-50">{title}</h2>
          {subtitle && <p className="text-sm text-navy-300 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
