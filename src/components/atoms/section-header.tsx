import type { ReactNode } from 'react';

interface SectionHeaderProps {
  eyebrow?: ReactNode;
  title?: ReactNode;
  heading?: ReactNode;
  badge?: ReactNode;
  sub?: ReactNode;
  right?: React.ReactNode;
}

export const SectionHeader = ({
  eyebrow,
  title,
  heading,
  badge,
  sub,
  right,
}: SectionHeaderProps) => (
  <header className="page-header">
    <div className="page-header-heading">
      <div className="page-header-title-row">
        {eyebrow && <span className="page-eyebrow">{eyebrow}</span>}
        {heading ?? <h1 className="h1">{title}</h1>}
        {badge}
      </div>
      {sub && <div className="page-description">{sub}</div>}
    </div>
    {right != null && <div className="page-header-actions">{right}</div>}
  </header>
);
