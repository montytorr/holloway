'use client';

import { useRenderTime } from '@/components/render-time';
import presentation from './webhook-filter-card-presentation.module.css';

import { useQueryFilters } from '@/components/use-query-filters';

interface WebhookFilterCardProps {
  webhookId: string;
  isActive: boolean;
  url: string;
  agentId: string;
  agentName: string | null;
  failureCount: number;
  lastDeliveryAt: string | null;
  successCount24h: number;
  failedCount24h: number;
  pendingCount24h: number;
  retryCount24h: number;
  totalCount24h: number;
  animationDelay: string;
}

function truncateUrl(url: string, maxLen = 50) {
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

function timeAgo(dateStr: string | null, now: number) {
  if (!dateStr) return '—';
  const diff = now - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function WebhookFilterCard({
  webhookId,
  isActive,
  url,
  agentId,
  agentName,
  failureCount,
  lastDeliveryAt,
  successCount24h,
  failedCount24h,
  pendingCount24h,
  retryCount24h,
  totalCount24h,
  animationDelay,
}: WebhookFilterCardProps) {
  const now = useRenderTime();
  const { params, update, pending } = useQueryFilters('/webhooks/health');
  const activeFilter = params.get('webhook');
  const isSelected = activeFilter === webhookId;

  function handleClick() { update({ webhook: isSelected ? '' : webhookId }); }

  const rate =
    totalCount24h > 0 ? Math.round((successCount24h / totalCount24h) * 100) : 0;

  return (
    <button
      onClick={handleClick}
      aria-busy={pending}
      aria-pressed={isSelected}
      className="card animate-fade-in"
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '16px 20px',
        cursor: 'pointer',
        animationDelay,
        transition: 'all 0.15s ease',
        outline: isSelected ? `1px solid var(--peri)` : 'none',
        background: isSelected ? 'var(--peri-bg)' : 'var(--bg-1)',
      }}
      title={
        isSelected
          ? 'Click to clear filter'
          : 'Click to filter deliveries to this webhook'
      }
    >
      <div className={presentation.row1}>
        <div className={presentation.detail1}>
          <div
            className={['row gap-2', presentation.section1]
              .filter(Boolean)
              .join(' ')}
          >
            <span
              className="dot"
              style={{ background: isActive ? 'var(--mint)' : 'var(--fg-4)' }}
            />
            <span
              className={['mono text-xs', presentation.ink1]
                .filter(Boolean)
                .join(' ')}
              title={url}
            >
              {truncateUrl(url, 50)}
            </span>
            {isSelected && (
              <span
                className={['pill pill--peri text-2xs', presentation.detail2]
                  .filter(Boolean)
                  .join(' ')}
              >
                Filtered
              </span>
            )}
          </div>
          <div
            className={['row gap-2 text-2xs', presentation.ink2]
              .filter(Boolean)
              .join(' ')}
          >
            <span title={agentId}>
              {agentName || (
                <span className="mono">{agentId.slice(0, 8)}...</span>
              )}
            </span>
            {failureCount > 0 && (
              <span className={presentation.ink3}>
                {failureCount} consecutive failure
                {failureCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <div className={presentation.detail3}>
          <p
            className="num text-lg"
            style={{
              fontWeight: 700,
              color:
                rate >= 90
                  ? 'var(--mint)'
                  : rate >= 70
                    ? 'var(--amber)'
                    : 'var(--rose)',
            }}
          >
            {rate}%
          </p>
          <p className="upper text-2xs">success</p>
        </div>
      </div>
      <div className="row gap-4 text-xs">
        <div className="row gap-1">
          <span className="dot dot--mint" />
          <span className={presentation.ink4}>{successCount24h}</span>
        </div>
        <div className="row gap-1">
          <span className="dot dot--rose" />
          <span className={presentation.ink4}>{failedCount24h}</span>
        </div>
        <div className="row gap-1">
          <span className="dot dot--amber" />
          <span className={presentation.ink4}>{pendingCount24h}</span>
        </div>
        {retryCount24h > 0 && (
          <div className="row gap-1">
            <span className="dot dot--peri" />
            <span className={presentation.ink4}>{retryCount24h}</span>
          </div>
        )}
        <span
          className={['mono num dim text-2xs', presentation.detail4]
            .filter(Boolean)
            .join(' ')}
        >
          {lastDeliveryAt ? timeAgo(lastDeliveryAt, now) : 'never'}
        </span>
      </div>
      {/* Progress bar */}
      <div className={presentation.row2}>
        {successCount24h > 0 && (
          <div
            style={{
              height: '100%',
              background: 'var(--mint-2)',
              width: `${(successCount24h / totalCount24h) * 100}%`,
            }}
          />
        )}
        {pendingCount24h > 0 && (
          <div
            style={{
              height: '100%',
              background: 'var(--amber-2)',
              width: `${(pendingCount24h / totalCount24h) * 100}%`,
            }}
          />
        )}
        {retryCount24h > 0 && (
          <div
            style={{
              height: '100%',
              background: 'var(--peri)',
              width: `${(retryCount24h / totalCount24h) * 100}%`,
            }}
          />
        )}
        {failedCount24h > 0 && (
          <div
            style={{
              height: '100%',
              background: 'var(--rose)',
              width: `${(failedCount24h / totalCount24h) * 100}%`,
            }}
          />
        )}
      </div>
    </button>
  );
}
