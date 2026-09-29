import presentation from './page-presentation.module.css';
import { unstable_noStore as noStore } from 'next/cache';
import Link from '@/components/app-link';
import { redirect } from 'next/navigation';
import { getAuthActorContext } from '@/lib/auth-actor-context';
import { formatDateTime, formatRelative } from '@/lib/format-date';
import {
  getExecutionStatusLabel,
  getExecutionStatusTone,
  isExecutionStale,
} from '@/lib/task-execution-ui';
import StatusBadge from '@/components/status-badge';
import { colorVarForTone, pillClassForTone } from '@/lib/status-tone';
import { loadProtocolInspector } from '@/lib/protocol-inspector';
import AutoRefresh from '@/components/auto-refresh';
import { describeContractLink } from '@/lib/contract-links';
import { requeueWebhookDelivery } from './actions';
import type { TaskExecutionCheckpoint, TaskExecutionRun } from '@/lib/types';
import { Search, RotateCcw, GitBranch } from 'lucide-react';
import { PageFrame, EmptyState, SectionHeader } from '@/components/atoms';

export const dynamic = 'force-dynamic';

function SearchForm({
  contractId,
  taskId,
}: {
  contractId: string;
  taskId: string;
}) {
  return (
    <form
      className={presentation.grid1}
      action="/protocol-inspector"
      method="get"
    >
      <div>
        <label
          htmlFor="contract"
          className={['upper', presentation.label1].filter(Boolean).join(' ')}
        >
          Contract ID
        </label>
        <input
          id="contract"
          name="contract"
          defaultValue={contractId}
          placeholder="86e925fb-a2e4-41a3-a6a0-6b6ef114f7aa"
          className="cp-input mono"
        />
      </div>
      <div>
        <label
          htmlFor="task"
          className={['upper', presentation.label1].filter(Boolean).join(' ')}
        >
          Task ID
        </label>
        <input
          id="task"
          name="task"
          defaultValue={taskId}
          placeholder="6a3aaf07-778b-41d6-87a0-c61ad00fc8c7"
          className="cp-input mono"
        />
      </div>
      <div className={presentation.row1}>
        <button
          type="submit"
          className={['btn btn--primary', presentation.action1]
            .filter(Boolean)
            .join(' ')}
        >
          <Search size={13} />
          Inspect
        </button>
        <Link
          href="/protocol-inspector"
          className={['btn btn--ghost', presentation.action1]
            .filter(Boolean)
            .join(' ')}
        >
          <RotateCcw size={13} />
          Clear
        </Link>
      </div>
    </form>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <div className={['card', presentation.detail1].filter(Boolean).join(' ')}>
      <p className={['upper', presentation.copy1].filter(Boolean).join(' ')}>
        {label}
      </p>
      <p
        className="num text-xl"
        style={{ fontWeight: 700, color: tone || 'var(--fg-0)' }}
      >
        {value}
      </p>
    </div>
  );
}

function JsonBlock({ value }: { value: unknown }) {
  if (
    !value ||
    (typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.keys(value as Record<string, unknown>).length === 0)
  ) {
    return (
      <p className={['text-xs', presentation.copy2].filter(Boolean).join(' ')}>
        No payload.
      </p>
    );
  }
  return (
    <pre
      className={['mono text-2xs', presentation.code1]
        .filter(Boolean)
        .join(' ')}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function DeliveryBadge({ status }: { status: string }) {
  return (
    <StatusBadge
      domain="webhook-delivery"
      status={status}
      dot="none"
      size="lg"
    />
  );
}

function RequeueDeliveryButton({
  deliveryId,
  webhookId,
  contractId,
  taskId,
}: {
  deliveryId: string;
  webhookId: string;
  contractId?: string | null;
  taskId?: string | null;
}) {
  async function action() {
    'use server';
    await requeueWebhookDelivery({ deliveryId, webhookId, contractId, taskId });
  }

  return (
    <form action={action}>
      <button
        type="submit"
        className={['btn btn--sm', presentation.action2]
          .filter(Boolean)
          .join(' ')}
      >
        Requeue for retry
      </button>
    </form>
  );
}

function RunCard({ run }: { run: TaskExecutionRun }) {
  const stale = isExecutionStale(run.status, run.heartbeat_at);
  const tone = getExecutionStatusTone(run.status, stale, 'task-execution-run');
  return (
    <div className={['card', presentation.detail2].filter(Boolean).join(' ')}>
      <div className={presentation.row2}>
        <div>
          <p
            className={['text-sm', presentation.copy3]
              .filter(Boolean)
              .join(' ')}
          >
            Attempt #{run.attempt}
          </p>
          <p
            className={['mono text-2xs', presentation.copy4]
              .filter(Boolean)
              .join(' ')}
          >
            {run.id}
          </p>
        </div>
        <StatusBadge
          domain="task-execution-run"
          status={run.status}
          tone={tone}
          label={getExecutionStatusLabel(run.status, stale)}
          size="lg"
        />
      </div>
      <div
        className={['text-xs', presentation.grid2].filter(Boolean).join(' ')}
      >
        <p>
          Started:{' '}
          <span className={presentation.ink1}>
            {run.started_at ? formatDateTime(run.started_at) : '—'}
          </span>
        </p>
        <p>
          Heartbeat:{' '}
          <span className={presentation.ink1}>
            {run.heartbeat_at
              ? `${formatDateTime(run.heartbeat_at)} (${formatRelative(run.heartbeat_at)})`
              : '—'}
          </span>
        </p>
        <p>
          Completed:{' '}
          <span className={presentation.ink1}>
            {run.completed_at ? formatDateTime(run.completed_at) : '—'}
          </span>
        </p>
        <p>
          Checkpoints:{' '}
          <span className={presentation.ink1}>{run.checkpoint_count}</span>
        </p>
      </div>
      {(run.summary || run.error_message) && (
        <div
          className={['text-xs', presentation.stack1].filter(Boolean).join(' ')}
        >
          {run.summary && (
            <p className={presentation.copy5}>
              <span className={presentation.copy2}>Summary:</span> {run.summary}
            </p>
          )}
          {run.error_message && (
            <p className={presentation.copy6}>
              <span className={presentation.copy6}>Error:</span>{' '}
              {run.error_message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function CheckpointCard({
  checkpoint,
}: {
  checkpoint: TaskExecutionCheckpoint;
}) {
  return (
    <div className={['card', presentation.detail2].filter(Boolean).join(' ')}>
      <div className={presentation.row2}>
        <div>
          <p
            className={['text-sm', presentation.copy3]
              .filter(Boolean)
              .join(' ')}
          >
            {checkpoint.summary || checkpoint.checkpoint_key}
          </p>
          <p
            className={['mono text-2xs', presentation.copy4]
              .filter(Boolean)
              .join(' ')}
          >
            {checkpoint.checkpoint_key} · seq {checkpoint.sequence}
          </p>
        </div>
        <span
          className={['text-2xs', presentation.copy2].filter(Boolean).join(' ')}
        >
          {formatDateTime(checkpoint.created_at)}
        </span>
      </div>
      <div className={presentation.detail3}>
        <JsonBlock value={checkpoint.payload} />
      </div>
    </div>
  );
}

export default async function ProtocolInspectorPage({
  searchParams,
}: {
  searchParams: Promise<{ contract?: string; task?: string }>;
}) {
  const auth = await getAuthActorContext();
  const user = auth?.user ?? null;
  if (!user || !auth) redirect('/login');

  const params = await searchParams;
  const contractId = (params.contract || '').trim();
  const taskId = (params.task || '').trim();
  noStore();

  const data = await loadProtocolInspector({
    contractId: contractId || null,
    taskId: taskId || null,
    agentIds: auth.agentScope,
    isSuperAdmin: user.isSuperAdmin,
  });

  const searched = !!contractId || !!taskId;

  return (
    // The debugging cockpit for stale state was itself the one page that never
    // refreshed: it renders live contract status, turn counts and webhook
    // delivery, and only re-submitting the form ever changed any of it.
    <AutoRefresh
      intervalMs={10000}
      watch={['contracts', 'participants', 'messages', 'tasks', 'webhooks']}
    >
      <PageFrame>
        {/* Header */}
        <SectionHeader
          title={<>Protocol Inspector</>}
          eyebrow={<>Debugging Cockpit</>}
          sub={
            <>
              <p
                className={['muted text-sm', presentation.copy8]
                  .filter(Boolean)
                  .join(' ')}
              >
                One operator-facing view for contract state, message timeline,
                task linkage, execution evidence, webhook delivery, and obvious
                conformance drift.
              </p>
            </>
          }
        />

        {/* Search form card */}
        <div
          className={['card', presentation.section2].filter(Boolean).join(' ')}
        >
          <SearchForm contractId={contractId} taskId={taskId} />
        </div>

        {!searched ? (
          <div
            className={['card', presentation.detail4].filter(Boolean).join(' ')}
          >
            <p
              className={['text-sm', presentation.copy2]
                .filter(Boolean)
                .join(' ')}
            >
              Enter a contract ID, task ID, or both.
            </p>
            <p
              className={['text-xs', presentation.copy4]
                .filter(Boolean)
                .join(' ')}
            >
              The inspector will stitch together the visible flow instead of
              making you bounce across five screens like a lunatic.
            </p>
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className={presentation.grid3}>
              <StatCard
                label="Messages"
                value={data.conformance.messageCount}
              />
              <StatCard
                label="Linked Tasks"
                value={data.conformance.linkedTaskCount}
              />
              <StatCard label="Runs" value={data.conformance.runCount} />
              <StatCard
                label="Checkpoints"
                value={data.conformance.checkpointCount}
              />
              <StatCard
                label="Related Contracts"
                value={data.conformance.relatedContractCount}
              />
              <StatCard
                label="Webhook Events"
                value={data.conformance.webhookEventCount}
              />
              <StatCard
                label="Webhook Failures"
                value={
                  data.conformance.failedWebhookEventCount +
                  data.conformance.retryingWebhookEventCount
                }
                tone={colorVarForTone(
                  data.conformance.failedWebhookEventCount +
                    data.conformance.retryingWebhookEventCount
                    ? 'amber'
                    : 'mint',
                )}
              />
              <StatCard
                label="Drift Flags"
                value={data.conformance.driftFlags.length}
                tone={
                  data.conformance.driftFlags.length
                    ? 'var(--rose)'
                    : 'var(--mint)'
                }
              />
            </div>

            <div className={presentation.grid4}>
              {/* Left column */}
              <div className={presentation.stack2}>
                {/* Conformance section */}
                <section className="card card--pad">
                  <div className={presentation.section3}>
                    <p
                      className={['upper', presentation.copy9]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      Conformance Summary
                    </p>
                    <h2 className="h2">Live sanity checks</h2>
                  </div>
                  <div className={presentation.grid5}>
                    {[
                      {
                        label: 'Contract visible',
                        ok: data.conformance.contractFound,
                        detail: data.contract
                          ? `${data.contract.status} · ${data.contract.current_turns}/${data.contract.max_turns} turns`
                          : 'Not found or not visible to this user',
                      },
                      {
                        label: 'Task visible',
                        ok: data.conformance.taskFound,
                        detail: data.task
                          ? `${data.task.status} · ${data.task.execution_status || 'idle'}`
                          : 'No task selected or linked',
                      },
                      {
                        label: 'Participants accepted',
                        ok: data.conformance.allParticipantsAccepted !== false,
                        detail:
                          data.conformance.allParticipantsAccepted === null
                            ? 'No contract in scope'
                            : data.conformance.allParticipantsAccepted
                              ? 'All visible participants accepted'
                              : 'At least one participant is pending/rejected',
                      },
                      {
                        label: 'Task linkage exists',
                        ok: data.conformance.hasTaskLink,
                        detail: data.conformance.hasTaskLink
                          ? `${data.conformance.linkedTaskCount} linked task(s)`
                          : 'No contract ↔ task link found',
                      },
                      {
                        // Four of the five ways a contract ends do not mean the
                        // work finished. This is the check that asks where it
                        // went, and the one the chain exists to answer.
                        label: 'Succession recorded',
                        ok:
                          !data.conformance.endedWithoutCompleting ||
                          data.conformance.hasSuccessor,
                        detail: !data.conformance.contractFound
                          ? 'No contract in scope'
                          : !data.conformance.endedWithoutCompleting
                            ? data.conformance.relatedContractCount
                              ? `${data.conformance.relatedContractCount} linked contract(s)`
                              : 'Contract has not ended unfinished'
                            : data.conformance.hasSuccessor
                              ? 'A successor contract is recorded'
                              : 'Ended without the work accepted, and nothing says where it went',
                      },
                      {
                        label: 'Execution evidence exists',
                        ok: data.conformance.hasActiveOrCompletedRun,
                        detail: data.conformance.hasActiveOrCompletedRun
                          ? `${data.conformance.runCount} run(s)`
                          : 'No task execution run found',
                      },
                      {
                        label: 'Checkpoint evidence exists',
                        ok: data.conformance.hasCheckpointEvidence,
                        detail: data.conformance.hasCheckpointEvidence
                          ? `${data.conformance.checkpointCount} checkpoint(s)`
                          : 'No checkpoint trail found',
                      },
                      {
                        label: 'Successful webhook evidence exists',
                        ok: data.conformance.hasSuccessfulWebhookEvidence,
                        detail:
                          data.conformance.webhookEventCount === 0
                            ? 'No webhook evidence in scope'
                            : data.conformance.hasSuccessfulWebhookEvidence
                              ? 'At least one matching delivery succeeded'
                              : data.conformance.hasRetryableWebhookFailure
                                ? 'Only retryable deliveries exist so far'
                                : 'Only terminal webhook failures found',
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className={['card', presentation.detail5]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <div className={presentation.row3}>
                          <p
                            className={['text-xs', presentation.copy10]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            {item.label}
                          </p>
                          <span
                            className={pillClassForTone(
                              item.ok ? 'mint' : 'rose',
                            )}
                          >
                            {item.ok ? 'ok' : 'check'}
                          </span>
                        </div>
                        <p
                          className={['text-xs', presentation.copy11]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          {item.detail}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div
                    className={['card--inset', presentation.detail6]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <p
                      className={['upper', presentation.copy1]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      Drift flags
                    </p>
                    {data.conformance.driftFlags.length === 0 ? (
                      <p
                        className={['text-sm', presentation.copy12]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        Nothing obviously cursed.
                      </p>
                    ) : (
                      <ul
                        className={['text-xs', presentation.stack3]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {data.conformance.driftFlags.map((flag) => (
                          <li key={flag} className={presentation.panel1}>
                            {flag}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>

                {/* Contract section */}
                <section className="card card--pad">
                  <div className={presentation.row4}>
                    <div>
                      <p
                        className={['upper', presentation.copy9]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        Contract
                      </p>
                      <h2 className="h2">Summary + timeline</h2>
                    </div>
                    {data.contract && (
                      <Link
                        href={`/contracts/${data.contract.id}`}
                        className={['text-xs', presentation.link1]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        Open contract →
                      </Link>
                    )}
                  </div>

                  {!data.contract ? (
                    <p
                      className={['text-sm', presentation.copy2]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      No visible contract in scope.
                    </p>
                  ) : (
                    <>
                      <div className={presentation.grid6}>
                        {[
                          { label: 'Title', value: data.contract.title },
                          { label: 'Status', value: data.contract.status },
                          {
                            label: 'Participants',
                            value: String(data.contract.participants.length),
                          },
                          {
                            label: 'Turns',
                            value: `${data.contract.current_turns}/${data.contract.max_turns}`,
                          },
                        ].map(({ label, value }) => (
                          <div
                            key={label}
                            className={['card', presentation.detail7]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            <p
                              className={['upper', presentation.copy7]
                                .filter(Boolean)
                                .join(' ')}
                            >
                              {label}
                            </p>
                            <p
                              className={['text-sm', presentation.copy13]
                                .filter(Boolean)
                                .join(' ')}
                            >
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div
                        className={['card', presentation.detail8]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <p
                          className={['upper', presentation.copy14]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          Participants
                        </p>
                        <div className={presentation.grid7}>
                          {data.contract.participants.map((participant) => (
                            <div
                              key={participant.id}
                              className={['card--inset', presentation.detail9]
                                .filter(Boolean)
                                .join(' ')}
                            >
                              <div className={presentation.row3}>
                                <p
                                  className={['text-sm', presentation.copy15]
                                    .filter(Boolean)
                                    .join(' ')}
                                >
                                  {participant.agent?.display_name ||
                                    participant.agent?.name ||
                                    'Unknown agent'}
                                </p>
                                <StatusBadge
                                  domain="participant"
                                  status={participant.status}
                                  dot="none"
                                  size="lg"
                                />
                              </div>
                              <p
                                className={['text-xs', presentation.copy16]
                                  .filter(Boolean)
                                  .join(' ')}
                              >
                                {participant.role}
                                {participant.responded_at
                                  ? ` · responded ${formatRelative(participant.responded_at)}`
                                  : ''}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div
                        className={['card', presentation.detail8]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <p
                          className={['upper', presentation.copy14]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          Message timeline
                        </p>
                        {data.messages.length === 0 ? (
                          <EmptyState
                            title="No messages visible"
                            hint="Either none have been exchanged yet, or your trust tier hides them."
                          />
                        ) : (
                          <div className={presentation.stack4}>
                            {data.messages.map((message) => (
                              <div
                                key={message.id}
                                className={[
                                  'card--inset',
                                  presentation.detail10,
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                              >
                                <div className={presentation.row2}>
                                  <div>
                                    <p
                                      className={[
                                        'text-sm',
                                        presentation.copy15,
                                      ]
                                        .filter(Boolean)
                                        .join(' ')}
                                    >
                                      {message.sender?.display_name ||
                                        message.sender?.name ||
                                        'Unknown sender'}
                                    </p>
                                    <p
                                      className={[
                                        'text-xs',
                                        presentation.copy16,
                                      ]
                                        .filter(Boolean)
                                        .join(' ')}
                                    >
                                      {formatDateTime(message.created_at)} (
                                      {formatRelative(message.created_at)})
                                    </p>
                                  </div>
                                  <span className="pill">
                                    {message.message_type}
                                  </span>
                                </div>
                                <div className={presentation.detail3}>
                                  <JsonBlock value={message.content} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </section>
              </div>

              {/* Right column */}
              <div className={presentation.stack2}>
                {/* Contract chain section */}
                <section className="card card--pad">
                  <div className={presentation.section3}>
                    <p
                      className={['upper', presentation.copy9]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      Chain
                    </p>
                    <h2 className="h2">Related contracts</h2>
                  </div>

                  {!data.conformance.contractFound ? (
                    <EmptyState
                      title="No contract in scope"
                      hint="Inspect a contract to trace what it links to."
                    />
                  ) : data.relatedContracts.length === 0 ? (
                    <EmptyState
                      title="No contract-to-contract link recorded"
                      hint={
                        data.conformance.endedWithoutCompleting
                          ? 'This contract ended without the work being accepted. If it carried on elsewhere, holloway contract-relate <new> --to <this> --type continues records where.'
                          : 'Succession, replacement and delegation are recorded here when they happen.'
                      }
                    />
                  ) : (
                    <div className={presentation.stack4}>
                      {data.relatedContracts.map((related) => (
                        <div
                          key={`${related.link_type}-${related.direction}-${related.contract_id}`}
                          className={['card', presentation.detail2]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          <div className={presentation.row5}>
                            <GitBranch
                              size={13}
                              className={presentation.ink2}
                            />
                            <span className="pill pill--peri">
                              {describeContractLink(
                                related.link_type,
                                related.direction,
                              )}
                            </span>
                            <Link
                              href={`/protocol-inspector?contract=${related.contract_id}`}
                              className={['text-sm', presentation.link2]
                                .filter(Boolean)
                                .join(' ')}
                            >
                              {related.title}
                            </Link>
                            <span className="pill">{related.status}</span>
                          </div>
                          <div
                            className={['text-xs', presentation.stack5]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            <p
                              className={['mono', presentation.copy5]
                                .filter(Boolean)
                                .join(' ')}
                            >
                              {related.contract_id}
                            </p>
                            {related.note && <p>{related.note}</p>}
                            <p>
                              Recorded {formatRelative(related.linked_at)}
                              {related.linked_by_agent_id
                                ? ''
                                : ' by the platform'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Tasks section */}
                <section className="card card--pad">
                  <div className={presentation.section3}>
                    <p
                      className={['upper', presentation.copy9]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      Tasks
                    </p>
                    <h2 className="h2">Linked execution trail</h2>
                  </div>

                  {data.linkedTasks.length === 0 ? (
                    <EmptyState
                      title="No linked tasks"
                      hint="Nothing in the delivery board references this contract."
                    />
                  ) : (
                    <div className={presentation.stack4}>
                      {data.linkedTasks.map((task) => {
                        const stale = isExecutionStale(
                          task.execution_status || undefined,
                          task.execution_heartbeat_at || undefined,
                        );
                        const tone = getExecutionStatusTone(
                          task.execution_status,
                          stale,
                        );
                        return (
                          <div
                            key={task.id}
                            className={['card', presentation.detail2]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            <div className={presentation.row2}>
                              <div>
                                <Link
                                  href={`/projects/${task.project_id}/tasks/${task.id}`}
                                  className={['text-sm', presentation.link2]
                                    .filter(Boolean)
                                    .join(' ')}
                                >
                                  {task.title}
                                </Link>
                                <p
                                  className={['text-xs', presentation.copy16]
                                    .filter(Boolean)
                                    .join(' ')}
                                >
                                  {task.project_title || task.project_id} ·{' '}
                                  {task.status} · {task.priority}
                                </p>
                              </div>
                              <StatusBadge
                                domain="task-execution"
                                status={task.execution_status}
                                tone={tone}
                                label={getExecutionStatusLabel(
                                  task.execution_status,
                                  stale,
                                )}
                                size="lg"
                              />
                            </div>
                            <div
                              className={['text-xs', presentation.stack6]
                                .filter(Boolean)
                                .join(' ')}
                            >
                              <p>
                                Assignee:{' '}
                                <span className={presentation.copy5}>
                                  {task.assignee?.display_name ||
                                    task.assignee?.name ||
                                    '—'}
                                </span>
                              </p>
                              <p>
                                Last checkpoint:{' '}
                                <span className={presentation.copy5}>
                                  {task.last_checkpoint_summary || '—'}
                                </span>
                              </p>
                              <p>
                                Linked via contract:{' '}
                                <span
                                  className={['mono', presentation.copy5]
                                    .filter(Boolean)
                                    .join(' ')}
                                >
                                  {task.linked_via_contract_id ||
                                    'Direct task lookup'}
                                </span>
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Execution section */}
                <section className="card card--pad">
                  <div className={presentation.section3}>
                    <p
                      className={['upper', presentation.copy9]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      Execution
                    </p>
                    <h2 className="h2">Runs + checkpoints</h2>
                  </div>

                  <div className={presentation.stack4}>
                    {data.executionRuns.length === 0 ? (
                      <EmptyState title="No execution runs" />
                    ) : (
                      data.executionRuns.map((run) => (
                        <RunCard key={run.id} run={run} />
                      ))
                    )}
                  </div>

                  <div className={presentation.stack7}>
                    {data.executionCheckpoints.length === 0 ? (
                      <EmptyState title="No checkpoints" />
                    ) : (
                      data.executionCheckpoints.map((checkpoint) => (
                        <CheckpointCard
                          key={checkpoint.id}
                          checkpoint={checkpoint}
                        />
                      ))
                    )}
                  </div>
                </section>

                {/* Webhooks section */}
                <section className="card card--pad">
                  <div className={presentation.row4}>
                    <div>
                      <p
                        className={['upper', presentation.copy9]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        Webhooks
                      </p>
                      <h2 className="h2">Delivery evidence</h2>
                    </div>
                    <Link
                      href="/webhooks/health"
                      className={['text-xs', presentation.link1]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      Health view →
                    </Link>
                  </div>

                  {data.webhookDeliveries.length === 0 ? (
                    <EmptyState
                      title="No matching webhook deliveries"
                      hint="Nothing for this contract appears in the recent audit window."
                    />
                  ) : (
                    <div className={presentation.stack4}>
                      {data.webhookDeliveries.map((delivery) => (
                        <div
                          key={delivery.id}
                          className={['card', presentation.detail2]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          <div className={presentation.row2}>
                            <div>
                              <p
                                className={['text-sm', presentation.copy3]
                                  .filter(Boolean)
                                  .join(' ')}
                              >
                                {delivery.event}
                              </p>
                              <p
                                className={['text-xs', presentation.copy16]
                                  .filter(Boolean)
                                  .join(' ')}
                              >
                                {formatDateTime(delivery.created_at)} (
                                {formatRelative(delivery.created_at)})
                              </p>
                            </div>
                            <DeliveryBadge status={delivery.status} />
                          </div>
                          <div
                            className={['text-xs', presentation.stack6]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            <p>
                              Webhook:{' '}
                              <span
                                className={['mono', presentation.copy5]
                                  .filter(Boolean)
                                  .join(' ')}
                              >
                                {delivery.webhook?.url || delivery.webhook_id}
                              </span>
                            </p>
                            <p>
                              Attempts:{' '}
                              <span className={presentation.copy5}>
                                {delivery.attempts}
                                {delivery.max_retries
                                  ? ` / ${delivery.max_retries}`
                                  : ''}
                              </span>
                            </p>
                            <p>
                              HTTP:{' '}
                              <span className={presentation.copy5}>
                                {delivery.response_status ?? '—'}
                              </span>
                            </p>
                            <p>
                              Related IDs:{' '}
                              <span
                                className={['mono', presentation.copy5]
                                  .filter(Boolean)
                                  .join(' ')}
                              >
                                contract={delivery.related_contract_id || '—'}{' '}
                                task={delivery.related_task_id || '—'}
                              </span>
                            </p>
                          </div>

                          <div
                            className={['card--inset', presentation.detail11]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            <div className={presentation.row2}>
                              <p className="upper">Replay / debug</p>
                              {delivery.replay_debug.can_operator_requeue ? (
                                <RequeueDeliveryButton
                                  deliveryId={delivery.id}
                                  webhookId={delivery.webhook_id}
                                  contractId={delivery.related_contract_id}
                                  taskId={delivery.related_task_id}
                                />
                              ) : (
                                <div className={presentation.detail12}>
                                  <span
                                    className={[
                                      'btn btn--sm',
                                      presentation.ink3,
                                    ]
                                      .filter(Boolean)
                                      .join(' ')}
                                  >
                                    Requeue unavailable
                                  </span>
                                  <span
                                    className={['text-2xs', presentation.ink4]
                                      .filter(Boolean)
                                      .join(' ')}
                                  >
                                    {delivery.replay_debug.requeue_reason ||
                                      'This delivery is not eligible for operator requeue.'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div
                              className={['text-xs', presentation.stack6]
                                .filter(Boolean)
                                .join(' ')}
                            >
                              <p>
                                Delivery ID:{' '}
                                <span
                                  className={['mono', presentation.copy5]
                                    .filter(Boolean)
                                    .join(' ')}
                                >
                                  {delivery.replay_debug.delivery_id}
                                </span>
                              </p>
                              <p>
                                Signature version:{' '}
                                <span className={presentation.copy5}>
                                  {delivery.replay_debug.signature_version}
                                </span>
                              </p>
                              <p>
                                Retryability:{' '}
                                <span className={presentation.copy5}>
                                  {delivery.replay_debug.retryable
                                    ? `yes${delivery.replay_debug.next_attempt_number ? ` · next attempt #${delivery.replay_debug.next_attempt_number}` : ''}`
                                    : delivery.replay_debug.final_attempt
                                      ? 'no · retries exhausted'
                                      : 'no'}
                                </span>
                              </p>
                              <p>
                                Operator requeue:{' '}
                                <span className={presentation.copy5}>
                                  {delivery.replay_debug.can_operator_requeue
                                    ? 'allowed'
                                    : delivery.replay_debug.requeue_reason ||
                                      'not allowed'}
                                </span>
                              </p>
                              <p>
                                Last retry:{' '}
                                <span className={presentation.copy5}>
                                  {delivery.last_retry_at
                                    ? `${formatDateTime(delivery.last_retry_at)} (${formatRelative(delivery.last_retry_at)})`
                                    : '—'}
                                </span>
                              </p>
                              <p>
                                Retry delay:{' '}
                                <span className={presentation.copy5}>
                                  {delivery.retry_delay_ms
                                    ? `${Math.round(delivery.retry_delay_ms / 1000)}s`
                                    : '—'}
                                </span>
                              </p>
                              <p>
                                Event timestamp:{' '}
                                <span className={presentation.copy5}>
                                  {delivery.replay_debug.event_timestamp
                                    ? `${formatDateTime(delivery.replay_debug.event_timestamp)} (${formatRelative(delivery.replay_debug.event_timestamp)})`
                                    : '—'}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div
                            className={['card--inset', presentation.detail13]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            <p
                              className={['upper', presentation.copy14]
                                .filter(Boolean)
                                .join(' ')}
                            >
                              Stored event payload
                            </p>
                            <JsonBlock value={delivery.payload} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          </>
        )}
      </PageFrame>
    </AutoRefresh>
  );
}
