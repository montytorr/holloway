interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  height?: number;
}

export const ProgressBar = ({
  value,
  max = 100,
  color = 'var(--mint)',
  height = 4,
}: ProgressBarProps) => {
  const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));

  return (
    <div
      role="progressbar"
      aria-label="Progress"
      aria-valuemin={0}
      aria-valuemax={Math.max(1, max)}
      aria-valuenow={Math.max(0, Math.min(Math.max(1, max), value))}
      style={{
        height,
        background: 'var(--bg-3)',
        borderRadius: 0,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: `${pct}%`,
          background: color,
        }}
      />
    </div>
  );
};
