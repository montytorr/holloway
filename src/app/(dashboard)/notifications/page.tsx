import Link from 'next/link';
import { redirect } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import { Bell } from 'lucide-react';
import AutoRefresh from '@/components/auto-refresh';
import { getAuthActorContext } from '@/lib/auth-actor-context';
import { getDashboardNotificationSummary } from '@/lib/dashboard-notifications';
import { formatDate } from '@/lib/format-date';
import {
  PageFrame,
  EmptyState,
  SectionHeader,
  SectionCard,
} from '@/components/atoms';
import styles from './attention.module.css';
import { NotificationCountsSync } from './notification-counts-sync';

export const dynamic = 'force-dynamic';

const kindPillTone: Record<string, string> = {
  'contract-invitation': 'pill--mint',
  'task-assigned': 'pill--peri',
  'task-blocked': 'pill--rose',
  'task-blocked-stale': 'pill--rose',
  'task-blocked-follow-through': 'pill--amber',
  'project-invitation': 'pill--mint',
  'approval-request': 'pill--amber',
  'agent-question': 'pill--rose',
};

export default async function NotificationsPage() {
  // Same context and same function as /api/internal/notifications, which feeds
  // the navigation badge, so the two cannot disagree on scope.
  const auth = await getAuthActorContext();
  if (!auth?.user) redirect('/login');

  noStore();
  const { counts, items } = await getDashboardNotificationSummary(auth);

  const priority = (kind: string) =>
    kind === 'agent-question'
      ? 0
      : kind.startsWith('task-blocked')
        ? 1
        : kind === 'approval-request'
          ? 2
          : 3;
  const ordered = [...items].sort(
    (a, b) =>
      priority(a.kind) - priority(b.kind) ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const metrics = [
    { label: 'Needs attention', value: counts.total },
    { label: 'Blocked work', value: counts.blockers },
    { label: 'Agents asking you', value: counts.questions },
    { label: 'Approvals', value: counts.approvals },
  ];
  return (
    <AutoRefresh
      intervalMs={10000}
      watch={['contracts', 'participants', 'tasks', 'projects', 'approvals']}
    >
      <NotificationCountsSync counts={counts} />
      <PageFrame>
        <SectionHeader
          eyebrow="Workspace"
          title="Attention"
          sub="Questions, blockers, invitations, and approvals across your visible work."
        />
        <div className={styles.metrics}>
          {metrics.map((metric) => (
            <div className={`card ${styles.metric}`} key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>
        <SectionCard
          title="Needs your attention"
          description="Blocking questions and work appear first. Updated every 10 seconds."
          action={
            <span className="pill pill--ghost">{items.length} items</span>
          }
        >
          {ordered.length === 0 ? (
            <EmptyState
              icon={<Bell size={20} />}
              title="Nothing needs attention"
              hint="New questions, invitations, and approvals will appear here."
            />
          ) : (
            ordered.map((item) => (
              <Link className={styles.item} key={item.id} href={item.href}>
                <div className={styles.content}>
                  <div className={styles.meta}>
                    <span
                      className={`pill ${kindPillTone[item.kind] || 'pill--ghost'}`}
                    >
                      {item.kind.replace(/-/g, ' ')}
                    </span>
                    {item.meta && <span>{item.meta}</span>}
                  </div>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </div>
                <div className={styles.trailing}>
                  <time dateTime={item.createdAt}>
                    {formatDate(item.createdAt)}
                  </time>
                  <span>Open →</span>
                </div>
              </Link>
            ))
          )}
        </SectionCard>
      </PageFrame>
    </AutoRefresh>
  );
}
