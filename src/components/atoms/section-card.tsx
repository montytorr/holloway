import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function SectionCard({
  title,
  icon,
  description,
  action,
  children,
  className,
  id,
}: {
  title: string;
  icon?: ReactNode;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn('card section-card', className)}>
      <header className="section-card-header">
        {icon && (
          <span className="section-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <div className="section-card-heading">
          <h2 className="h4">{title}</h2>
          {description && (
            <p className="section-card-description">{description}</p>
          )}
        </div>
        {action}
      </header>
      <div className="section-card-body">{children}</div>
    </section>
  );
}
