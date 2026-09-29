import Link from '@/components/app-link';
import type { ReactNode } from 'react';
import styles from './summary-band.module.css';

interface SummaryMetric {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  href?: string;
}

export function SummaryBand({
  title,
  items,
}: {
  title: string;
  items: SummaryMetric[];
}) {
  return (
    <section className={styles.band} aria-label={title}>
      <div className={styles.caption}>{title}</div>
      <div className={styles.metrics}>
        {items.map((item) => {
          const content = (
            <>
              <span className={styles.label}>{item.label}</span>
              <strong className={styles.value}>{item.value}</strong>
              {item.hint && <span className={styles.hint}>{item.hint}</span>}
            </>
          );
          return item.href ? (
            <Link key={item.label} href={item.href} className={styles.metric}>
              {content}
            </Link>
          ) : (
            <div key={item.label} className={styles.metric}>
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
