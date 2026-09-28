'use client';
import presentation from './approval-list-presentation.module.css';

import { useState, useTransition } from 'react';
import { handleApprove, handleDeny } from './actions';
import { ShieldCheck } from 'lucide-react';
import StatusBadge from '@/components/status-badge';
import type { ApprovalStatus } from '@/lib/types';
import { EmptyState } from '@/components/atoms';

interface Approval {
  id: string;
  action: string;
  actor: string;
  details: Record<string, unknown>;
  status: ApprovalStatus;
  reviewed_by: string | null;
  created_at: string;
  reviewed_at: string | null;
}

function formatAction(action: string): string {
  const map: Record<string, string> = {
    'killswitch.activate': 'Kill Switch Activation',
    'key.rotate': 'Key Rotation',
  };
  return map[action] || action;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ApprovalList({
  approvals,
  currentUser,
  isSuperAdmin,
}: {
  approvals: Approval[];
  currentUser: string;
  isSuperAdmin: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function doApprove(id: string) {
    setActionId(id);
    setError(null);
    startTransition(async () => {
      try {
        await handleApprove(id);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to approve');
      }
      setActionId(null);
    });
  }

  function doDeny(id: string) {
    setActionId(id);
    setError(null);
    startTransition(async () => {
      try {
        await handleDeny(id);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to deny');
      }
      setActionId(null);
    });
  }

  if (approvals.length === 0) {
    return (
      <EmptyState
        icon={<ShieldCheck size={20} />}
        title="No approval requests"
        hint="Sensitive actions that need a human decision queue here. Nothing is waiting on you."
      />
    );
  }

  return (
    <div className={presentation.stack1}>
      {error && (
        <div
          className={['text-xs', presentation.panel1].filter(Boolean).join(' ')}
        >
          {error}
        </div>
      )}
      {approvals.map((a) => {
        const isOwnRequest = a.actor === currentUser;
        const canReview =
          isSuperAdmin && !isOwnRequest && a.status === 'pending';
        const isActioning = isPending && actionId === a.id;

        return (
          <div
            key={a.id}
            className={['card animate-fade-in', presentation.detail1]
              .filter(Boolean)
              .join(' ')}
          >
            <div className={presentation.row1}>
              <div className={presentation.detail2}>
                <div
                  className={['row gap-2', presentation.section1]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <StatusBadge domain="approval" status={a.status} size="lg" />
                  <span className="h3">{formatAction(a.action)}</span>
                </div>
                <div
                  className={['row gap-3 text-xs', presentation.ink1]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <span>
                    Requested by{' '}
                    <span className={presentation.ink2}>{a.actor}</span>
                  </span>
                  <span className={presentation.ink3}>·</span>
                  <span>{timeAgo(a.created_at)}</span>
                  {a.reviewed_by && (
                    <>
                      <span className={presentation.ink3}>·</span>
                      <span>
                        {a.status === 'consumed'
                          ? 'Consumed (was approved)'
                          : a.status === 'approved'
                            ? 'Approved'
                            : 'Denied'}{' '}
                        by{' '}
                        <span className={presentation.ink2}>
                          {a.reviewed_by}
                        </span>
                      </span>
                    </>
                  )}
                </div>
                {/* Details */}
                {a.details && Object.keys(a.details).length > 0 && (
                  <div
                    className={['card--inset', presentation.detail3]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <div className={presentation.stack2}>
                      {Object.entries(a.details)
                        .filter(
                          ([k]) =>
                            ![
                              'executed',
                              'executed_at',
                              'executed_by',
                            ].includes(k),
                        )
                        .map(([k, v]) => (
                          <div key={k} className="row gap-2 text-xs">
                            <span className={presentation.ink4}>
                              {k.replace(/_/g, ' ')}:
                            </span>
                            <span
                              className={['mono', presentation.ink5]
                                .filter(Boolean)
                                .join(' ')}
                            >
                              {String(v)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                {isOwnRequest && a.status === 'pending' && (
                  <p
                    className={['text-2xs', presentation.copy1]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    You cannot approve your own request
                  </p>
                )}
              </div>

              {/* Action buttons */}
              {canReview && (
                <div
                  className={['row gap-2', presentation.detail4]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <button
                    onClick={() => doApprove(a.id)}
                    disabled={isActioning}
                    className={['btn btn--sm', presentation.action1]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {isActioning ? '...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => doDeny(a.id)}
                    disabled={isActioning}
                    className="btn btn--sm btn--danger"
                  >
                    {isActioning ? '...' : 'Deny'}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
