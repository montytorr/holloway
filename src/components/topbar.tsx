'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  RefreshCw,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { useDashboardContext } from '@/app/(dashboard)/dashboard-context';
import type { TickerItem } from '@/lib/live-feed';
import {
  dashboardDestination,
  DASHBOARD_NAVIGATION,
} from '@/lib/dashboard-navigation';
import { useNavigationFeedback } from './navigation-feedback';
import { ThemeToggle } from './theme-toggle';
import { usePageFreshness } from './page-freshness';
import { usePageHeading } from './page-heading';
import styles from './topbar.module.css';

interface TopbarProps {
  initialTickerItems?: TickerItem[];
  onOpenPalette: () => void;
  leading?: React.ReactNode;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export const Topbar = ({
  onOpenPalette,
  leading,
  collapsed,
  onToggleCollapsed,
}: TopbarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { notificationCounts } = useDashboardContext();
  const { begin } = useNavigationFeedback();
  const [connection, setConnection] = useState<
    'checking' | 'connected' | 'stale'
  >('checking');
  const [lastUpdated, setLastUpdated] = useState<string>();
  const actionable = notificationCounts?.total;
  const destination = dashboardDestination(pathname);
  const reportedHeading = usePageHeading();
  const heading = reportedHeading?.path === pathname ? reportedHeading : null;
  const group =
    DASHBOARD_NAVIGATION.find((entry) =>
      entry.items.some((item) => item.href === destination?.href),
    )?.label ?? 'Administration';
  const reportedFreshness = usePageFreshness();
  const freshness =
    reportedFreshness?.path === pathname ? reportedFreshness : null;
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch('/api/internal/live-feed', {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Feed unavailable');
        await response.json();
        if (!controller.signal.aborted) {
          setConnection('connected');
          setLastUpdated(new Date().toLocaleTimeString());
        }
      } catch {
        if (!controller.signal.aborted) setConnection('stale');
      }
    };
    void load();
    const timer = window.setInterval(load, 30000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, []);
  return (
    <header className={styles.header}>
      {leading}
      {onToggleCollapsed && (
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="btn btn--ghost btn--icon hidden xl:inline-flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-pressed={collapsed}
        >
          {collapsed ? (
            <PanelLeftOpen size={18} />
          ) : (
            <PanelLeftClose size={18} />
          )}
        </button>
      )}
      <div className={styles.location}>
        <span className={styles.breadcrumb}>{heading?.eyebrow ?? group}</span>
        <ChevronRight size={14} className={styles.breadcrumb} aria-hidden />
        <div
          className={styles.title}
          key={heading ? `${heading.path}:${heading.id}` : pathname}
          title={typeof heading?.title === 'string' ? heading.title : undefined}
        >
          {heading?.heading ?? (
            <h1>{heading?.title ?? destination?.label ?? 'Holloway'}</h1>
          )}
          <span
            className={styles.liveDot}
            role="status"
            aria-label={
              freshness
                ? freshness.status === 'live'
                  ? 'Current'
                  : freshness.status === 'stale'
                    ? 'Not updating'
                    : 'Reload needed'
                : connection === 'connected'
                  ? 'Connected'
                  : connection === 'stale'
                    ? 'Feed stale'
                    : 'Connecting'
            }
            title={
              freshness
                ? `Page data received ${freshness.ageSeconds}s ago · ${freshness.streaming ? 'live updates' : `${Math.round(freshness.intervalMs / 1000)}s fallback`}${freshness.status === 'stuck' ? '. Reload manually.' : ''}`
                : lastUpdated
                  ? `Activity feed checked at ${lastUpdated}`
                  : 'Checking activity feed'
            }
          >
            <span
              className={`dot ${freshness?.status === 'stuck' || (!freshness && connection === 'stale') ? 'dot--rose' : freshness?.status === 'stale' ? 'dot--amber' : freshness?.status === 'live' || connection === 'connected' ? 'dot--mint' : ''}`}
            />
          </span>
        </div>
        {connection === 'stale' && (
          <span
            className="pill pill--amber"
            role="status"
            title="Activity feed unavailable. Page freshness is reported separately."
          >
            Feed stale
          </span>
        )}
        {heading?.badge && <div className={styles.badges}>{heading.badge}</div>}
      </div>
      <div className={styles.tools}>
        <button
          type="button"
          className={styles.search}
          onClick={onOpenPalette}
          aria-label="Search workspace or run a command"
        >
          <Search size={16} aria-hidden />
          <span>Search workspace…</span>
          <kbd>⌘ K</kbd>
        </button>
        <ThemeToggle />
        <button
          type="button"
          className="btn btn--ghost btn--icon"
          title="Refresh page"
          aria-label="Refresh current page"
          onClick={() => router.refresh()}
        >
          <RefreshCw size={16} />
        </button>
        <Link
          href="/kill-switch"
          className="btn btn--ghost btn--icon"
          title="Emergency controls"
          aria-label="Emergency controls"
        >
          <Shield size={18} />
        </Link>
        <Link
          href="/notifications"
          onNavigate={() => {
            if (pathname !== '/notifications') begin();
          }}
          className={`btn btn--ghost btn--icon ${styles.attention}`}
          title={
            actionable === undefined
              ? 'Attention'
              : `Attention · ${actionable} actionable items`
          }
          aria-label={
            actionable === undefined
              ? 'Open attention inbox'
              : `Open attention inbox, ${actionable} items needing attention`
          }
        >
          <Bell size={18} />
          {actionable !== undefined && actionable > 0 && (
            <span className="count-badge">
              {actionable > 99 ? '99+' : actionable}
            </span>
          )}
        </Link>
      </div>
      {heading?.actions != null && (
        <div className={styles.actions}>{heading.actions}</div>
      )}
    </header>
  );
};
