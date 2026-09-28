'use client';

import Link from 'next/link';
import {
  ArrowRight,
  MessageSquare,
  Shield,
  Clock,
  FileText,
  AlertCircle,
} from 'lucide-react';
import {
  HashChip,
  Avatar,
  SectionHeader,
  SectionCard,
  SummaryBand,
  PageFrame,
  EmptyState,
} from '@/components/atoms';
import type { DashboardNotificationItem } from '@/lib/dashboard-notifications';
import { formatDateTime } from '@/lib/format-date';
import styles from './dashboard.module.css';

interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  created_at: string;
}
interface ActiveWork {
  id: string;
  title: string;
  current_turns: number;
  max_turns: number;
}
interface DashboardClientProps {
  activeContracts: number;
  messagesToday: number;
  pendingInvitations: number;
  isKillSwitchActive: boolean | null;
  totalAgents: number;
  activeProjects: number;
  tasksInProgress: number;
  webhookDeliveries: number;
  recentAudit: AuditEntry[];
  latestWebhookDeliveryAt?: string | null;
  attentionItems: DashboardNotificationItem[];
  activeWork: ActiveWork[];
}

function auditLink(entry: AuditEntry) {
  if (entry.resource_type === 'contract' && entry.resource_id)
    return `/contracts/${entry.resource_id}`;
  if (entry.resource_type === 'project' && entry.resource_id)
    return `/projects/${entry.resource_id}`;
  if (entry.resource_type === 'agent' && entry.resource_id)
    return `/agents/${entry.resource_id}`;
  if (entry.resource_type === 'message') return '/messages';
  return '/audit';
}
const attentionRank = (kind: string) =>
  kind === 'agent-question'
    ? 0
    : kind.startsWith('task-blocked')
      ? 1
      : kind === 'approval-request'
        ? 2
        : 3;

export function DashboardClient(props: DashboardClientProps) {
  const items = [...props.attentionItems].sort(
    (a, b) => attentionRank(a.kind) - attentionRank(b.kind),
  );
  const metrics = [
    {
      label: 'Active contracts',
      value: props.activeContracts,
      hint: 'Scoped agent conversations',
      href: '/contracts?status=active',
    },
    {
      label: 'Tasks in progress',
      value: props.tasksInProgress,
      hint: 'Work currently underway',
      href: '/tasks?status=in-progress',
    },
    {
      label: 'Pending invitations',
      value: props.pendingInvitations,
      hint: 'Project & contract inboxes',
      href: '/notifications',
    },
    {
      label: 'Messages today',
      value: props.messagesToday,
      hint: 'Exchanges between agents',
      href: '/messages',
    },
  ];
  return (
    <PageFrame>
      <SectionHeader
        title="Workspace overview"
        sub="Start with the decisions and work that need your attention."
        right={
          <Link href="/contracts" className="btn">
            View contracts <ArrowRight size={16} />
          </Link>
        }
      />
      <SummaryBand title="Workspace summary" items={metrics} />
      <div className={styles.columns}>
        <div className={styles.stack}>
          <SectionCard
            title="Needs your attention"
            icon={<AlertCircle size={16} />}
            description="Questions, blocked work, invitations, and approvals"
            action={
              <Link href="/notifications" className="btn btn--ghost btn--sm">
                Open inbox · {items.length} <ArrowRight size={14} />
              </Link>
            }
          >
            {items.length === 0 ? (
              <EmptyState
                icon={<Shield size={20} />}
                title="Nothing needs attention"
                hint="No decisions or follow-ups are currently waiting on you."
              />
            ) : (
              items.slice(0, 6).map((item) => (
                <Link href={item.href} key={item.id} className={styles.workRow}>
                  <span
                    className={`${styles.workIcon} ${item.kind === 'agent-question' || item.kind.startsWith('task-blocked') ? styles.urgent : ''}`}
                  >
                    {item.kind === 'agent-question' ? (
                      <MessageSquare size={18} />
                    ) : item.kind.startsWith('task-blocked') ? (
                      <AlertCircle size={18} />
                    ) : (
                      <Clock size={18} />
                    )}
                  </span>
                  <div className={styles.rowText}>
                    <strong>{item.title}</strong>
                    <span>{item.meta || item.body}</span>
                  </div>
                  <ArrowRight size={16} aria-hidden />
                </Link>
              ))
            )}
            {items.length > 6 && (
              <Link className={styles.more} href="/notifications">
                View all {items.length} actionable items →
              </Link>
            )}
          </SectionCard>
          <SectionCard
            title="Active work"
            icon={<FileText size={16} />}
            description="Contracts currently in progress"
            action={
              <Link
                href="/contracts?status=active"
                className="btn btn--ghost btn--sm"
              >
                View all <ArrowRight size={14} />
              </Link>
            }
          >
            {props.activeWork.length ? (
              props.activeWork.slice(0, 6).map((contract) => (
                <Link
                  href={`/contracts/${contract.id}`}
                  key={contract.id}
                  className={styles.workRow}
                >
                  <span className={styles.workIcon}>
                    <FileText size={18} />
                  </span>
                  <div className={styles.rowText}>
                    <strong>{contract.title}</strong>
                    <span>
                      {contract.current_turns} of {contract.max_turns} turns
                      used
                    </span>
                  </div>
                  <span className="pill pill--amber">Active</span>
                  <ArrowRight size={16} aria-hidden />
                </Link>
              ))
            ) : (
              <EmptyState
                title="No active contracts"
                hint="Accepted conversations will appear here."
              />
            )}
          </SectionCard>
        </div>
        <div className={styles.stack}>
          <SectionCard
            title="Latest activity"
            icon={<Clock size={16} />}
            description="Recent changes in your workspace"
            action={
              <Link href="/audit" className="btn btn--ghost btn--sm">
                Audit trail <ArrowRight size={14} />
              </Link>
            }
          >
            {props.recentAudit.length ? (
              props.recentAudit.slice(0, 8).map((entry) => (
                <Link
                  href={auditLink(entry)}
                  key={entry.id}
                  className={styles.activityRow}
                >
                  <Avatar name={entry.actor} size={26} />
                  <div className={styles.rowText}>
                    <strong>{entry.actor}</strong>
                    <span>{entry.action.replace(/[._]/g, ' ')}</span>
                    <time dateTime={entry.created_at}>
                      {formatDateTime(entry.created_at)}
                    </time>
                  </div>
                  {entry.resource_id && (
                    <span className={styles.auditReference}>
                      <HashChip value={entry.resource_id} copyable={false} />
                    </span>
                  )}
                </Link>
              ))
            ) : (
              <EmptyState
                title="No activity yet"
                hint="The audit trail will appear as work moves."
              />
            )}
          </SectionCard>
          <SectionCard
            title="Control plane"
            icon={<Shield size={16} />}
            description="Operational context, with each signal shown separately"
          >
            <dl className={styles.health}>
              <div>
                <dt>Emergency stop</dt>
                <dd>
                  <Link
                    href="/kill-switch"
                    className={
                      props.isKillSwitchActive === null
                        ? ''
                        : props.isKillSwitchActive
                          ? styles.urgent
                          : styles.healthy
                    }
                  >
                    {props.isKillSwitchActive === null
                      ? 'Unknown'
                      : props.isKillSwitchActive
                        ? 'Active · operations frozen'
                        : 'Inactive'}
                  </Link>
                </dd>
              </div>
              <div>
                <dt>Agents</dt>
                <dd>
                  <Link href="/agents">{props.totalAgents} registered</Link>
                </dd>
              </div>
              <div>
                <dt>Active projects</dt>
                <dd>
                  <Link href="/projects?status=active">
                    {props.activeProjects}
                  </Link>
                </dd>
              </div>
              <div>
                <dt>Webhook deliveries (24h)</dt>
                <dd>
                  <Link href="/webhooks/health">{props.webhookDeliveries}</Link>
                </dd>
              </div>
              <div>
                <dt>Latest delivery</dt>
                <dd>
                  {props.latestWebhookDeliveryAt ? (
                    <time dateTime={props.latestWebhookDeliveryAt}>
                      {formatDateTime(props.latestWebhookDeliveryAt)}
                    </time>
                  ) : (
                    'None recorded'
                  )}
                </dd>
              </div>
            </dl>
            <Link href="/webhooks/health" className={styles.more}>
              Inspect delivery health →
            </Link>
          </SectionCard>
        </div>
      </div>
    </PageFrame>
  );
}
