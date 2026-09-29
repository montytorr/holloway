'use client';

import { useRenderTime } from '@/components/render-time';
import presentation from './invitation-inbox-presentation.module.css';

import Link from 'next/link';
import { formatDateTime, formatRelative } from '@/lib/format-date';
import type { ProjectInvitationStatus } from '@/lib/types';
import {
  getInvitationStatusLabel,
  type InvitationLike,
} from './invitation-utils';
import StatusBadge from '@/components/status-badge';
import { EmptyState } from '@/components/atoms';

export default function InvitationInbox({
  invitations,
  title,
  empty,
}: {
  invitations: InvitationLike[];
  title: string;
  empty: string;
}) {
  const now = useRenderTime();
  return (
    <div className={['card', presentation.detail1].filter(Boolean).join(' ')}>
      <div className={['row', presentation.section1].filter(Boolean).join(' ')}>
        <div className="upper text-2xs">{title}</div>
        <span className="mono num dim text-2xs">{invitations.length}</span>
      </div>

      {invitations.length === 0 ? (
        <EmptyState title={empty} />
      ) : (
        <div className="col gap-2">
          {invitations.map((invitation) => {
            const projectTitle = invitation.project?.title || 'Unknown Project';
            const agentName =
              invitation.agent?.display_name ||
              invitation.agent?.name ||
              'Unknown Agent';
            const inviter =
              invitation.invited_by?.display_name ||
              invitation.invited_by?.name ||
              'Unknown';
            const statusLabel = getInvitationStatusLabel(
              invitation.status as ProjectInvitationStatus,
            );

            return (
              <Link
                key={invitation.id}
                href={`/projects/${invitation.project_id || invitation.project?.id}`}
                className={['card card--inset', presentation.link1]
                  .filter(Boolean)
                  .join(' ')}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    'var(--line-2)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    'var(--line-1)';
                }}
              >
                <div
                  className={['row', presentation.detail2]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <div className={presentation.detail3}>
                    <div
                      className={['text-xs', presentation.ink1]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {projectTitle}
                    </div>
                    <div
                      className={['dim text-2xs', presentation.detail4]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {agentName} · invited by {inviter}
                    </div>
                  </div>
                  <StatusBadge
                    domain="project-invitation"
                    status={invitation.status}
                    label={statusLabel}
                    className={presentation.detail5}
                  />
                </div>
                <div
                  className={[
                    'row gap-3 dim mono text-2xs',
                    presentation.detail6,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <span>Created {formatRelative(invitation.created_at, now)}</span>
                  {invitation.expires_at && invitation.status === 'pending' && (
                    <span title={formatDateTime(invitation.expires_at)}>
                      Expires {formatRelative(invitation.expires_at, now)}
                    </span>
                  )}
                  {invitation.reminder_sent_at && (
                    <span title={formatDateTime(invitation.reminder_sent_at)}>
                      Reminder sent{' '}
                      {formatRelative(invitation.reminder_sent_at, now)}
                    </span>
                  )}
                  {invitation.responded_at &&
                    invitation.status !== 'pending' && (
                      <span title={formatDateTime(invitation.responded_at)}>
                        Resolved {formatRelative(invitation.responded_at, now)}
                      </span>
                    )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
