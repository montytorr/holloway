import type { DashboardNotificationCounts } from './dashboard-notifications';

export interface DashboardDestination {
  href: string;
  label: string;
  icon: string;
  badgeKey?: keyof DashboardNotificationCounts;
  danger?: boolean;
}

export const DASHBOARD_NAVIGATION: {
  label: string;
  items: DashboardDestination[];
}[] = [
  {
    label: 'Workspace',
    items: [
      { href: '/', label: 'Overview', icon: 'grid' },
      {
        href: '/contracts',
        label: 'Contracts',
        icon: 'doc',
        badgeKey: 'contracts',
      },
      {
        href: '/projects',
        label: 'Projects',
        icon: 'folder',
        badgeKey: 'projects',
      },
      { href: '/tasks', label: 'Tasks', icon: 'checks' },
      { href: '/agents', label: 'Agents', icon: 'agent' },
      {
        href: '/notifications',
        label: 'Attention',
        icon: 'bell',
        badgeKey: 'total',
      },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/messages', label: 'Messages', icon: 'msg' },
      {
        href: '/approvals',
        label: 'Approvals',
        icon: 'check',
        badgeKey: 'approvals',
      },
      { href: '/feed', label: 'Live activity', icon: 'activity' },
      { href: '/audit', label: 'Audit trail', icon: 'list' },
      { href: '/analytics', label: 'Analytics', icon: 'chart' },
      { href: '/webhooks', label: 'Webhooks', icon: 'plug' },
      { href: '/webhooks/health', label: 'Delivery health', icon: 'pulse' },
      {
        href: '/protocol-inspector',
        label: 'Protocol inspector',
        icon: 'wave',
      },
      {
        href: '/kill-switch',
        label: 'Emergency controls',
        icon: 'power',
        danger: true,
      },
    ],
  },
  {
    label: 'Resources',
    items: [
      { href: '/api-docs', label: 'API reference', icon: 'code' },
      { href: '/security', label: 'Security', icon: 'shield' },
      { href: '/onboarding/human', label: 'Operator guide', icon: 'book' },
      { href: '/onboarding/agent', label: 'Agent guide', icon: 'book' },
      { href: '/changelog', label: 'Changelog', icon: 'tag' },
      { href: '/settings', label: 'Settings', icon: 'gear' },
    ],
  },
];

export const ADMIN_NAVIGATION: DashboardDestination[] = [
  { href: '/users', label: 'Users', icon: 'users' },
  { href: '/admin/emails', label: 'Email templates', icon: 'mail' },
];

export function dashboardDestination(pathname: string) {
  return [
    ...DASHBOARD_NAVIGATION.flatMap((group) => group.items),
    ...ADMIN_NAVIGATION,
  ]
    .filter((item) =>
      item.href === '/'
        ? pathname === '/'
        : pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];
}
