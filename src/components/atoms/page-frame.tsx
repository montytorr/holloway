import { cn } from '@/lib/utils';

/**
 * The one page container.
 *
 * The page canvas fills the dashboard. Individual reading and form surfaces
 * can set their own comfortable line length inside that canvas.
 *
 * Horizontal padding matches the shell's own so the acting-agent row and the
 * page body line up at every breakpoint.
 */
export type PageWidth = 'narrow' | 'prose' | 'default' | 'wide';

// Workspace pages share the full canvas; forms and documents remain bounded.
const widths: Record<PageWidth, string> = {
  narrow: 'max-w-[48rem]',
  prose: 'max-w-[78rem]',
  default: 'max-w-none',
  wide: 'max-w-none',
};

interface PageFrameProps {
  children: React.ReactNode;
  width?: PageWidth;
  className?: string;
  /**
   * Escape hatch for a page that genuinely needs a specific pixel cap.
   * Prefer `width`; this exists so the remaining one-offs can be migrated
   * without being redesigned in the same commit.
   */
  maxW?: number;
}

export const PageFrame = ({
  children,
  width = 'default',
  className,
  maxW,
}: PageFrameProps) => (
  <div className={cn('page-frame flex-1', className)}>
    <div
      className={cn(
        'page-content mx-auto w-full',
        maxW ? undefined : widths[width],
      )}
      style={maxW ? { maxWidth: maxW } : undefined}
    >
      {children}
    </div>
  </div>
);
