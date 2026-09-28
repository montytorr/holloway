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
  Rows3,
  Shield,
} from 'lucide-react';
import { useDashboardContext } from '@/app/(dashboard)/dashboard-context';
import type { TickerItem } from '@/lib/live-feed';
import { dashboardDestination } from '@/lib/dashboard-navigation';
import { usePersistedToggle } from '@/lib/persisted-toggle';
import { useNavigationFeedback } from './navigation-feedback';
import { ThemeToggle } from './theme-toggle';
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
  const [comfortable, toggleDensity] = usePersistedToggle(
    'holloway:comfortable-density',
  );
  const [connection, setConnection] = useState<
    'checking' | 'connected' | 'stale'
  >('checking');
  const [lastUpdated, setLastUpdated] = useState<string>();
  const actionable = notificationCounts?.total;
  const destination = dashboardDestination(pathname);
  useEffect(() => {
    document.documentElement.dataset.density = comfortable
      ? 'comfortable'
      : 'compact';
  }, [comfortable]);
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
          className="btn btn--ghost btn--icon hidden md:inline-flex"
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
        <span>Workspace</span>
        <span aria-hidden>/</span>
        <strong>{destination?.label || 'Holloway'}</strong>
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
        <span
          className={`${styles.connection} hidden lg:inline-flex`}
          title={
            lastUpdated
              ? `Activity feed last checked at ${lastUpdated}`
              : 'Checking the activity feed'
          }
          role="status"
        >
          <span
            className={`dot ${connection === 'connected' ? 'dot--mint' : connection === 'stale' ? 'dot--rose' : ''}`}
          />
          {connection === 'connected'
            ? 'Connected'
            : connection === 'stale'
              ? 'Feed stale'
              : 'Connecting'}
        </span>
        <button
          type="button"
          className="btn btn--ghost btn--icon hidden sm:inline-flex"
          onClick={toggleDensity}
          aria-pressed={!comfortable}
          aria-label={comfortable ? 'Use compact rows' : 'Use comfortable rows'}
          title={
            comfortable
              ? 'Comfortable density — switch to compact'
              : 'Compact density — switch to comfortable'
          }
        >
          <Rows3 size={18} aria-hidden />
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
    </header>
  );
};
