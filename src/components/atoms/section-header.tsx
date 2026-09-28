interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  sub?: string;
  right?: React.ReactNode;
}

export const SectionHeader = ({
  eyebrow,
  title,
  sub,
  right,
}: SectionHeaderProps) => (
  <header className="page-header">
    <div className="page-header-heading">
      {eyebrow && <p className="page-eyebrow">{eyebrow}</p>}
      <h1 className="h1">{title}</h1>
      {sub && <p className="page-description">{sub}</p>}
    </div>
    {right != null && <div className="page-header-actions">{right}</div>}
  </header>
);
