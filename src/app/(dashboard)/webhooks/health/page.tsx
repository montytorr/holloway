import presentation from './page-presentation.module.css';
import { unstable_noStore as noStore } from 'next/cache';
import Link from 'next/link';
import { createServerClient } from '@/lib/db/server';
import { getAuthActorContext } from '@/lib/auth-actor-context';
import { redirect } from 'next/navigation';
import AutoRefresh from '@/components/auto-refresh';
import WebhookFilterCard from './webhook-filter-card';
import { buildDashboardVisibilityScope } from '@/lib/dashboard-scope';
import { ArrowLeft, Clock, Info, Activity } from 'lucide-react';
import StatusBadge from '@/components/status-badge';
import {
  colorVarForTone,
  httpStatusTone,
  pillClassForTone,
} from '@/lib/status-tone';
import type { WebhookDeliveryStatus } from '@/lib/types';
import { PageFrame, EmptyState, SectionHeader } from '@/components/atoms';

export const dynamic = 'force-dynamic';

type WebhookDelivery = {
  id: string;
  webhook_id: string;
  event: string;
  status: WebhookDeliveryStatus;
  attempts: number;
  response_status: number | null;
  delivered_at: string | null;
  created_at: string;
  max_retries: number;
  last_retry_at: string | null;
  webhooks: {
    id: string;
    url: string;
    agent_id: string;
    is_active: boolean;
    failure_count: number;
    last_delivery_at: string | null;
    agents: { id: string; name: string; display_name: string | null } | null;
  };
};

type WebhookSummary = {
  webhookId: string;
  url: string;
  agentId: string;
  agentName: string | null;
  isActive: boolean;
  failureCount: number;
  lastDeliveryAt: string | null;
  successCount24h: number;
  failedCount24h: number;
  pendingCount24h: number;
  retryCount24h: number;
  totalCount24h: number;
};

function truncateUrl(url: string, maxLen = 40) {
  if (url.length <= maxLen) return url;
  try {
    const u = new URL(url);
    const host = u.hostname;
    const path = u.pathname;
    const truncated =
      host + (path.length > 20 ? path.slice(0, 17) + '...' : path);
    return truncated.length > maxLen
      ? truncated.slice(0, maxLen - 3) + '...'
      : truncated;
  } catch {
    return url.slice(0, maxLen - 3) + '...';
  }
}

function formatTimestamp(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export default async function WebhookHealthPage({
  searchParams,
}: {
  searchParams: Promise<{ webhook?: string }>;
}) {
  const auth = await getAuthActorContext();
  const user = auth?.user ?? null;
  if (!user || !auth) redirect('/login');

  const { isSuperAdmin } = user;

  const params = await searchParams;
  const filterWebhookId = params.webhook || null;

  const db = createServerClient();
  noStore();

  // eslint-disable-next-line react-hooks/purity -- server component with noStore(), Date.now() is intentional
  const now = Date.now();
  const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  // Resolve visible webhook IDs from the current acting-agent scope.
  const scope = await buildDashboardVisibilityScope(auth);
  const userWebhookIds: string[] = !isSuperAdmin ? scope.webhookIds : [];

  const hasWebhooks = isSuperAdmin || userWebhookIds.length > 0;
  const needsScope = !isSuperAdmin && hasWebhooks;

  // Fetch recent deliveries (last 50), optionally filtered by webhook + failures only
  let deliveriesQuery = db
    .from('webhook_deliveries')
    .select(
      `
      id,
      webhook_id,
      event,
      status,
      attempts,
      response_status,
      delivered_at,
      created_at,
      max_retries,
      last_retry_at,
      webhooks!inner(id, url, agent_id, is_active, failure_count, last_delivery_at, agents(id, name, display_name))
    `,
    )
    .order('created_at', { ascending: false })
    .limit(50);

  if (needsScope) {
    deliveriesQuery = deliveriesQuery.in('webhook_id', userWebhookIds);
  }

  if (filterWebhookId) {
    deliveriesQuery = deliveriesQuery
      .eq('webhook_id', filterWebhookId)
      .eq('status', 'failed')
      .gte('created_at', twentyFourHoursAgo);
  }

  const { data: recentDeliveries } = hasWebhooks
    ? await deliveriesQuery
    : { data: [] };
  const deliveries = (recentDeliveries || []) as unknown as WebhookDelivery[];

  // Fetch deliveries in last 24h for summary stats
  let stats24hQuery = db
    .from('webhook_deliveries')
    .select(
      `
      id,
      webhook_id,
      status,
      attempts,
      webhooks!inner(id, url, agent_id, is_active, failure_count, last_delivery_at, agents(id, name, display_name))
    `,
    )
    .gte('created_at', twentyFourHoursAgo);

  if (needsScope) {
    stats24hQuery = stats24hQuery.in('webhook_id', userWebhookIds);
  }

  const { data: last24hDeliveries } = hasWebhooks
    ? await stats24hQuery
    : { data: [] };

  const stats24h = (last24hDeliveries || []) as unknown as Array<{
    id: string;
    webhook_id: string;
    status: string;
    attempts: number;
    webhooks: {
      id: string;
      url: string;
      agent_id: string;
      is_active: boolean;
      failure_count: number;
      last_delivery_at: string | null;
      agents: { id: string; name: string; display_name: string | null } | null;
    };
  }>;

  // Build per-webhook summaries
  const summaryMap = new Map<string, WebhookSummary>();
  for (const d of stats24h) {
    const wid = d.webhook_id;
    if (!summaryMap.has(wid)) {
      summaryMap.set(wid, {
        webhookId: wid,
        url: d.webhooks.url,
        agentId: d.webhooks.agent_id,
        agentName:
          d.webhooks.agents?.display_name || d.webhooks.agents?.name || null,
        isActive: d.webhooks.is_active,
        failureCount: d.webhooks.failure_count,
        lastDeliveryAt: d.webhooks.last_delivery_at,
        successCount24h: 0,
        failedCount24h: 0,
        pendingCount24h: 0,
        retryCount24h: 0,
        totalCount24h: 0,
      });
    }
    const s = summaryMap.get(wid)!;
    s.totalCount24h++;
    if (d.status === 'success') s.successCount24h++;
    else if (d.status === 'failed') s.failedCount24h++;
    else if (d.status === 'pending_retry' || d.status === 'retrying')
      s.retryCount24h++;
    else s.pendingCount24h++;
  }

  const summaries = Array.from(summaryMap.values()).sort(
    (a, b) => b.totalCount24h - a.totalCount24h,
  );

  // Overall stats
  const totalDeliveries24h = stats24h.length;
  const totalSuccess = stats24h.filter((d) => d.status === 'success').length;
  const totalFailed = stats24h.filter((d) => d.status === 'failed').length;
  const totalPending = stats24h.filter((d) => d.status === 'pending').length;
  const totalRetrying = stats24h.filter(
    (d) => d.status === 'pending_retry' || d.status === 'retrying',
  ).length;
  const successRate =
    totalDeliveries24h > 0
      ? Math.round((totalSuccess / totalDeliveries24h) * 100)
      : 0;

  // Resolve filtered webhook name for display
  const filteredWebhookUrl = filterWebhookId
    ? summaries.find((s) => s.webhookId === filterWebhookId)?.url ||
      filterWebhookId
    : null;

  return (
    <AutoRefresh intervalMs={30000} watch={['webhooks']}>
      <PageFrame>
        {/* Header */}
        <SectionHeader
          title={<>Webhook Health</>}
          eyebrow={<Link href="/webhooks">Webhooks</Link>}
          sub={
            <>
              <p
                className={['muted text-sm', presentation.copy1]
                  .filter(Boolean)
                  .join(' ')}
              >
                Delivery status monitoring &amp; diagnostics
              </p>
            </>
          }
          right={
            <>
              <Link href="/webhooks" className="btn">
                <ArrowLeft size={14} />
                Webhooks
              </Link>
            </>
          }
        />

        {/* Scope banner */}
        {isSuperAdmin ? (
          <div
            className={['row gap-2', presentation.panel1]
              .filter(Boolean)
              .join(' ')}
          >
            <Info size={14} className={presentation.ink2} />
            <span
              className={['text-xs', presentation.ink3]
                .filter(Boolean)
                .join(' ')}
            >
              Admin view — showing all platform webhook deliveries.
            </span>
          </div>
        ) : !hasWebhooks ? (
          <div
            className={['row gap-2', presentation.panel2]
              .filter(Boolean)
              .join(' ')}
          >
            <Info size={14} className={presentation.ink4} />
            <span
              className={['text-xs', presentation.ink5]
                .filter(Boolean)
                .join(' ')}
            >
              No webhooks registered for your agents. Register a webhook to see
              delivery health here.
            </span>
          </div>
        ) : (
          <div
            className={['row gap-2', presentation.panel3]
              .filter(Boolean)
              .join(' ')}
          >
            <Info size={14} className={presentation.ink6} />
            <span
              className={['text-xs', presentation.ink7]
                .filter(Boolean)
                .join(' ')}
            >
              Showing deliveries for your webhooks only.
            </span>
          </div>
        )}

        {/* Overall Stats */}
        <div className={presentation.grid1}>
          <div
            className={['card', presentation.detail1].filter(Boolean).join(' ')}
          >
            <p
              className={['upper', presentation.copy2]
                .filter(Boolean)
                .join(' ')}
            >
              24h Total
            </p>
            <p
              className={['num text-xl', presentation.copy3]
                .filter(Boolean)
                .join(' ')}
            >
              {totalDeliveries24h}
            </p>
          </div>
          <div
            className={['card', presentation.detail1].filter(Boolean).join(' ')}
          >
            <p
              className={['upper', presentation.copy4]
                .filter(Boolean)
                .join(' ')}
            >
              Success
            </p>
            <p
              className={['num text-xl', presentation.copy5]
                .filter(Boolean)
                .join(' ')}
            >
              {totalSuccess}
            </p>
          </div>
          <div
            className={['card', presentation.detail1].filter(Boolean).join(' ')}
          >
            <p
              className={['upper', presentation.copy6]
                .filter(Boolean)
                .join(' ')}
            >
              Failed
            </p>
            <p
              className={['num text-xl', presentation.copy7]
                .filter(Boolean)
                .join(' ')}
            >
              {totalFailed}
            </p>
          </div>
          <div
            className={['card', presentation.detail1].filter(Boolean).join(' ')}
          >
            <p
              className={['upper', presentation.copy8]
                .filter(Boolean)
                .join(' ')}
            >
              Retrying
            </p>
            <p
              className={['num text-xl', presentation.copy9]
                .filter(Boolean)
                .join(' ')}
            >
              {totalRetrying}
            </p>
          </div>
          <div
            className={['card', presentation.detail1].filter(Boolean).join(' ')}
          >
            <p
              className={['upper', presentation.copy2]
                .filter(Boolean)
                .join(' ')}
            >
              Success Rate
            </p>
            <p
              className="num text-xl"
              style={{
                fontWeight: 700,
                color:
                  successRate >= 90
                    ? 'var(--mint)'
                    : successRate >= 70
                      ? 'var(--amber)'
                      : 'var(--rose)',
              }}
            >
              {successRate}%
            </p>
          </div>
        </div>

        {/* Per-Webhook Summary Cards (clickable for drill-down) */}
        {summaries.length > 0 && (
          <div className={presentation.section3}>
            <div
              className={['row gap-2', presentation.section4]
                .filter(Boolean)
                .join(' ')}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={presentation.ink8}
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <h2 className="h3">Per-Webhook Summary</h2>
              <span className="dim text-2xs">
                (last 24h · click to filter failures)
              </span>
            </div>
            <div className={presentation.grid2}>
              {summaries.map((s, idx) => (
                <WebhookFilterCard
                  key={s.webhookId}
                  webhookId={s.webhookId}
                  isActive={s.isActive}
                  url={s.url}
                  agentId={s.agentId}
                  agentName={s.agentName}
                  failureCount={s.failureCount}
                  lastDeliveryAt={s.lastDeliveryAt}
                  successCount24h={s.successCount24h}
                  failedCount24h={s.failedCount24h}
                  pendingCount24h={s.pendingCount24h}
                  retryCount24h={s.retryCount24h}
                  totalCount24h={s.totalCount24h}
                  animationDelay={`${0.1 + idx * 0.04}s`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Filter indicator */}
        {filterWebhookId && (
          <div className={presentation.row1}>
            <p
              className={['text-xs', presentation.copy10]
                .filter(Boolean)
                .join(' ')}
            >
              <span className={presentation.detail2}>Filtered:</span> Showing
              failures for{' '}
              <span
                className={['mono', presentation.ink9]
                  .filter(Boolean)
                  .join(' ')}
              >
                {truncateUrl(filteredWebhookUrl || '', 60)}
              </span>
            </p>
            <Link href="/webhooks/health" className="btn btn--sm btn--ghost">
              Clear filter
            </Link>
          </div>
        )}

        {/* Recent Deliveries Table */}
        <div>
          <div
            className={['row gap-2', presentation.section4]
              .filter(Boolean)
              .join(' ')}
          >
            <Clock size={14} className={presentation.ink8} />
            <h2 className="h3">
              {filterWebhookId ? 'Failed Deliveries' : 'Recent Deliveries'}
            </h2>
            <span className="dim text-2xs">
              {filterWebhookId
                ? `(${deliveries.length} failures)`
                : '(last 50)'}
            </span>
          </div>

          {deliveries.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<Activity size={20} />}
                title={
                  filterWebhookId
                    ? 'No failures found'
                    : 'No deliveries recorded'
                }
                hint={
                  filterWebhookId
                    ? 'This webhook has no failed deliveries in the last 50 attempts.'
                    : 'Webhook deliveries appear here once events are dispatched.'
                }
              />
            </div>
          ) : (
            <div
              className={['card', presentation.detail3]
                .filter(Boolean)
                .join(' ')}
            >
              <div className={presentation.detail4}>
                <table className={presentation.detail5}>
                  <thead>
                    <tr className={presentation.detail6}>
                      {[
                        'Event',
                        'Status',
                        'HTTP',
                        'Attempts',
                        'Webhook',
                        'Target Agent',
                        'Created',
                        'Delivered',
                      ].map((col) => (
                        <th key={col} className={presentation.detail7}>
                          <span className="upper text-2xs">{col}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map((d, idx) => (
                      <tr
                        key={d.id}
                        className="animate-fade-in"
                        style={{
                          borderBottom: '1px solid var(--line-1)',
                          animationDelay: `${0.15 + idx * 0.02}s`,
                        }}
                      >
                        <td className={presentation.detail8}>
                          <span
                            className={`${pillClassForTone('neutral')} mono text-2xs`}
                          >
                            {d.event}
                          </span>
                        </td>
                        <td className={presentation.detail8}>
                          <StatusBadge
                            domain="webhook-delivery"
                            status={d.status}
                            size="lg"
                          />
                        </td>
                        <td className={presentation.detail8}>
                          {d.response_status ? (
                            <span
                              className="mono num text-xs"
                              style={{
                                color: colorVarForTone(
                                  httpStatusTone(d.response_status),
                                ),
                              }}
                            >
                              {d.response_status}
                            </span>
                          ) : (
                            <span className="dim text-xs">—</span>
                          )}
                        </td>
                        <td className={presentation.detail8}>
                          <span
                            className="mono num text-xs"
                            style={{
                              color: colorVarForTone(
                                d.attempts > 1 ? 'amber' : 'neutral',
                              ),
                            }}
                          >
                            {d.attempts}/{d.max_retries}
                          </span>
                        </td>
                        <td className={presentation.detail8}>
                          <span
                            className={['mono text-xs', presentation.ink8]
                              .filter(Boolean)
                              .join(' ')}
                            title={d.webhooks.url}
                          >
                            {truncateUrl(d.webhooks.url)}
                          </span>
                        </td>
                        <td className={presentation.detail8}>
                          <span
                            className={['text-xs', presentation.ink10]
                              .filter(Boolean)
                              .join(' ')}
                            title={
                              d.webhooks.agents?.name || d.webhooks.agent_id
                            }
                          >
                            {d.webhooks.agents?.display_name ||
                              d.webhooks.agents?.name || (
                                <span className="mono dim">
                                  {d.webhooks.agent_id.slice(0, 8)}
                                </span>
                              )}
                          </span>
                        </td>
                        <td className={presentation.detail8}>
                          <span
                            className={['num text-xs', presentation.ink8]
                              .filter(Boolean)
                              .join(' ')}
                            title={d.created_at}
                          >
                            {formatTimestamp(d.created_at)}
                          </span>
                        </td>
                        <td className={presentation.detail8}>
                          <span
                            className={['num text-xs', presentation.ink8]
                              .filter(Boolean)
                              .join(' ')}
                            title={d.delivered_at || undefined}
                          >
                            {d.delivered_at
                              ? formatTimestamp(d.delivered_at)
                              : '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Pending count note */}
        {(totalPending > 0 || totalRetrying > 0) && !filterWebhookId && (
          <div className={presentation.panel4}>
            <p
              className={['text-xs', presentation.copy11]
                .filter(Boolean)
                .join(' ')}
            >
              <span className={presentation.detail2}>
                {totalPending + totalRetrying}
              </span>{' '}
              deliveries pending or retrying in the last 24h.
            </p>
          </div>
        )}
      </PageFrame>
    </AutoRefresh>
  );
}
