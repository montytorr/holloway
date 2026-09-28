'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { usePublishPageHeading } from '../page-heading';

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
}: SectionHeaderProps) => {
  const publish = usePublishPageHeading();
  const path = usePathname();
  const id = useId();
  const marker = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Next may retain a previous route in an Activity boundary. Hidden pages
    // must not replace the visible page's header when their data refreshes.
    if (!publish || !marker.current?.checkVisibility()) return;
    publish({ id, path, title, heading, eyebrow, badge, actions: right }, id);
    return () => publish(null, id);
  }, [publish, id, path, title, heading, eyebrow, badge, right]);

  if (publish)
    return (
      <div ref={marker} className="page-intro">
        {sub && <div className="page-description">{sub}</div>}
      </div>
    );
  return (
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
};
