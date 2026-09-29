import { PageFrame } from './atoms';
import type { PageWidth } from './atoms/page-frame';
import styles from './route-skeleton.module.css';

type Shape = 'overview' | 'analytics' | 'list' | 'detail' | 'document' | 'form';

export default function RouteSkeleton({
  label = 'page',
  shape = 'list',
  width = 'default',
}: {
  label?: string;
  shape?: Shape;
  width?: PageWidth;
}) {
  return (
    <PageFrame width={width}>
      <div
        className={styles.shell}
        aria-busy="true"
        aria-label={`Loading ${label}`}
        role="status"
      >
        <div className={styles.subtitle} />
        {shape === 'form' ? (
          <div className={styles.form}>
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className={styles.field} />
            ))}
          </div>
        ) : shape === 'analytics' || shape === 'overview' ? (
          <>
            <div className={styles.metrics}>
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className={styles.metric} />
              ))}
            </div>
            <div className={styles.charts}>
              <div className={styles.chart} />
              <div className={styles.chart} />
            </div>
          </>
        ) : shape === 'detail' ? (
          <div className={styles.detail}>
            <div className={styles.detailBody}>
              <div className={styles.panel} />
              <div className={styles.panel} />
            </div>
            <div className={styles.rail} />
          </div>
        ) : shape === 'document' ? (
          <div className={styles.detail}>
            <div className={styles.rail} />
            <div className={styles.document} />
          </div>
        ) : (
          <>
            <div className={styles.filters} />
            <div className={styles.rows}>
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className={styles.row} />
              ))}
            </div>
          </>
        )}
      </div>
    </PageFrame>
  );
}
