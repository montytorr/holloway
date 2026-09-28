'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import { createBrowserClient } from '@/lib/auth/browser';
import { Avatar } from '@/components/atoms';
import { HollowayMark } from '@/components/holloway-mark';
import {
  LayoutGrid,
  Activity,
  BarChart3,
  Bell,
  Settings,
  FileText,
  MessageSquare,
  Bot,
  FolderKanban,
  Radio,
  ListChecks,
  Webhook,
  Heart,
  Power,
  CheckCircle,
  ScrollText,
  BookOpen,
  Shield,
  Tag,
  Users,
  Mail,
  Code,
  LogOut,
} from 'lucide-react';
import type { DashboardNotificationCounts } from '@/lib/dashboard-notifications';
import {
  ADMIN_NAVIGATION,
  DASHBOARD_NAVIGATION,
  dashboardDestination,
  type DashboardDestination,
} from '@/lib/dashboard-navigation';
import { useNavigationFeedback } from './navigation-feedback';
import styles from './sidebar.module.css';

interface SidebarProps {
  isSuperAdmin?: boolean;
  displayName?: string;
  notificationCounts?: DashboardNotificationCounts;
  collapsed?: boolean;
  onNavigate?: () => void;
}

const icons = {
  grid: LayoutGrid,
  activity: Activity,
  chart: BarChart3,
  bell: Bell,
  gear: Settings,
  doc: FileText,
  msg: MessageSquare,
  agent: Bot,
  folder: FolderKanban,
  checks: ListChecks,
  wave: Radio,
  plug: Webhook,
  pulse: Heart,
  power: Power,
  check: CheckCircle,
  list: ScrollText,
  code: Code,
  shield: Shield,
  book: BookOpen,
  tag: Tag,
  users: Users,
  mail: Mail,
};

export function SidebarContent({
  isSuperAdmin,
  displayName,
  notificationCounts,
  collapsed,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const { begin } = useNavigationFeedback();
  const destination = dashboardDestination(pathname);
  const renderItem = (item: DashboardDestination) => {
    const active = destination?.href === item.href;
    const count = item.badgeKey
      ? (notificationCounts?.[item.badgeKey] ?? 0)
      : 0;
    const Icon = icons[item.icon as keyof typeof icons];
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`nav-item ${active ? 'nav-item--active' : ''}`}
        aria-current={active ? 'page' : undefined}
        aria-label={collapsed ? item.label : undefined}
        title={collapsed ? item.label : undefined}
        onNavigate={() => {
          onNavigate?.();
          if (item.href !== pathname) begin();
        }}
      >
        <span className="nav-icon">
          <Icon size={16} strokeWidth={1.75} aria-hidden />
        </span>
        <span className="nav-label">{item.label}</span>
        {count > 0 && (
          <span className="nav-count nav-trailing">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Link>
    );
  };
  return (
    <>
      <Link
        href="/"
        className={styles.logo}
        aria-label="Holloway overview"
        onNavigate={onNavigate}
      >
        <HollowayMark size={32} />
        {!collapsed && (
          <div>
            <strong>Holloway</strong>
            <span>Agent control plane</span>
          </div>
        )}
      </Link>
      <nav className={styles.navigation} aria-label="Main navigation">
        {DASHBOARD_NAVIGATION.map((group) => (
          <div className="nav-group" key={group.label}>
            {collapsed ? (
              <div className="nav-group-rule" />
            ) : (
              <div className="nav-group-heading">{group.label}</div>
            )}
            {group.items.map(renderItem)}
          </div>
        ))}
        {isSuperAdmin && (
          <div className="nav-group">
            {!collapsed && (
              <div className="nav-group-heading">Administration</div>
            )}
            {ADMIN_NAVIGATION.map(renderItem)}
          </div>
        )}
      </nav>
      <div className={styles.footer}>
        <Avatar name={displayName || '?'} size={32} />
        {!collapsed && (
          <>
            <div className={styles.identity}>
              <strong>{displayName || 'Operator'}</strong>
              <span>
                {isSuperAdmin ? 'Operator · super admin' : 'Operator'}
              </span>
            </div>
            <Link
              href="/settings"
              className="btn btn--ghost btn--icon"
              aria-label="Settings"
              onNavigate={onNavigate}
            >
              <Settings size={16} aria-hidden />
            </Link>
            <button
              type="button"
              className="btn btn--ghost btn--icon"
              aria-label="Sign out"
              onClick={async () => {
                await createBrowserClient().auth.signOut();
                window.location.href = '/login';
              }}
            >
              <LogOut size={16} aria-hidden />
            </button>
          </>
        )}
      </div>
    </>
  );
}

const subscribeWide = (listener: () => void) => {
  const query = window.matchMedia('(min-width: 1280px)');
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
};

export default function Sidebar(props: SidebarProps) {
  const wide = useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia('(min-width: 1280px)').matches,
    () => true,
  );
  const collapsed = props.collapsed || !wide;
  return (
    <aside
      data-sidebar={collapsed ? 'icons' : undefined}
      className={`${styles.sidebar} hidden md:flex`}
    >
      <SidebarContent {...props} collapsed={collapsed} />
    </aside>
  );
}
