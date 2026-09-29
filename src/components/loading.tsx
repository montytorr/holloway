import type { ReactNode } from "react";

export function LoadingSpinner() {
  return <span className="loading-spinner" aria-hidden="true" />;
}

export function LoadingIndicator({
  label = "Loading content",
  compact = false,
  className = "",
}: {
  label?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`loading-indicator ${className}`}
    >
      <LoadingSpinner />
      {!compact && <span aria-hidden="true">{label}</span>}
    </span>
  );
}

export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`loading-skeleton ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

export function LoadingPlaceholder({
  label = "Loading content",
  rows = 3,
}: {
  label?: string;
  rows?: number;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className="loading-placeholder"
    >
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton
          key={i}
          style={{ width: i === rows - 1 ? "72%" : i === 0 ? "94%" : "100%" }}
        />
      ))}
    </div>
  );
}

/** Reserve both labels' space, so buttons don't jump when work begins. */
export function PendingLabel({
  pending,
  label,
  children,
}: {
  pending: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <span className="pending-label" aria-busy={pending || undefined}>
      <span
        className={!pending ? "" : "pending-label-hidden"}
        aria-hidden={pending || undefined}
      >
        {children}
      </span>
      <span
        className={pending ? "" : "pending-label-hidden"}
        aria-hidden={!pending || undefined}
      >
        <LoadingSpinner />
        {label}
      </span>
    </span>
  );
}
