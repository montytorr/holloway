import { PageFrame } from "./atoms";
import type { PageWidth } from "./atoms/page-frame";
import { Skeleton } from "./loading";
import styles from "./route-skeleton.module.css";

type Shape = "overview" | "analytics" | "list" | "detail" | "document" | "form";
const Prose = () => (
  <div className={styles.prose}>
    <Skeleton className={styles.heading} />
    {Array.from({ length: 5 }, (_, i) => (
      <Skeleton
        key={i}
        className={styles.line}
        style={{ width: i === 4 ? "72%" : i === 2 ? "88%" : "100%" }}
      />
    ))}
  </div>
);
export default function RouteSkeleton({
  label = "page",
  shape = "list",
  width = "default",
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
        <Skeleton className={styles.subtitle} />
        {shape === "form" ? (
          <div className={`card ${styles.form}`}>
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className={styles.formField}>
                <Skeleton className={styles.fieldLabel} />
                <Skeleton
                  className={index === 3 ? styles.textarea : styles.field}
                />
              </div>
            ))}
          </div>
        ) : shape === "analytics" || shape === "overview" ? (
          <>
            <div className={styles.metrics}>
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className={`card ${styles.metric}`}>
                  <Skeleton className={styles.fieldLabel} />
                  <Skeleton className={styles.value} />
                </div>
              ))}
            </div>
            <div className={styles.charts}>
              <div className={`card ${styles.chart}`}>
                <Prose />
              </div>
              <div className={`card ${styles.chart}`}>
                <Prose />
              </div>
            </div>
          </>
        ) : shape === "detail" || shape === "document" ? (
          <div className={styles.detail}>
            <div className={styles.detailBody}>
              <div className="card">
                <Prose />
              </div>
              <div className="card">
                <Prose />
              </div>
            </div>
            <div className={`card ${styles.rail}`}>
              <Prose />
            </div>
          </div>
        ) : (
          <>
            <div className={styles.filters}>
              <Skeleton />
              <Skeleton />
              <Skeleton />
            </div>
            <div className={`card ${styles.rows}`}>
              <div className={styles.tableHead}>
                <Skeleton className={styles.fieldLabel} />
                <Skeleton className={styles.fieldLabel} />
                <Skeleton className={styles.fieldLabel} />
              </div>
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className={styles.row}>
                  <div>
                    <Skeleton className={styles.rowTitle} />
                    <Skeleton className={styles.rowSub} />
                  </div>
                  <Skeleton className={styles.fieldLabel} />
                  <Skeleton className={styles.fieldLabel} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </PageFrame>
  );
}
