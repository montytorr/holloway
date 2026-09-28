'use client';
import presentation from './audit-filters-presentation.module.css';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Search } from 'lucide-react';

const actionTypes = [
  { value: 'all', label: 'All event types' },
  { value: 'contract.propose', label: 'Propose Contract' },
  { value: 'contract.accept', label: 'Accept Contract' },
  { value: 'contract.reject', label: 'Reject Contract' },
  { value: 'contract.cancel', label: 'Cancel Contract' },
  { value: 'contract.close', label: 'Close Contract' },
  { value: 'contract.description_updated', label: 'Rewrite Description' },
  { value: 'contract.linked', label: 'Link Contracts' },
  { value: 'contract.unlinked', label: 'Unlink Contracts' },
  { value: 'message.send', label: 'Send Message' },
  { value: 'kill_switch.activate', label: 'Kill Switch Activate' },
  { value: 'kill_switch.deactivate', label: 'Kill Switch Deactivate' },
  { value: 'security', label: 'Security Events' },
  { value: 'auth.success', label: 'Auth Success' },
  { value: 'auth.failure', label: 'Auth Failure' },
  { value: 'authz.denied', label: 'Authorization Denied' },
  { value: 'webhook.delivery.success', label: 'Webhook Delivery OK' },
  { value: 'webhook.delivery.failure', label: 'Webhook Delivery Failed' },
  { value: 'webhook.disabled', label: 'Webhook Disabled' },
  { value: 'suspicious.replay_detected', label: 'Replay Detected' },
  { value: 'suspicious.invalid_signature', label: 'Invalid Signature' },
  { value: 'policy.kill_switch.activated', label: 'Kill Switch Activated' },
  { value: 'policy.kill_switch.deactivated', label: 'Kill Switch Deactivated' },
];

const dateRanges = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];

export default function AuditFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const actor = searchParams.get('actor') || '';
  const action = searchParams.get('action') || 'all';
  const dateRange = searchParams.get('range') || 'all';

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === '' || value === 'all') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete('page');
      const qs = params.toString();
      router.push(`/audit${qs ? `?${qs}` : ''}`);
    },
    [router, searchParams],
  );

  return (
    <div
      className={['row gap-3', presentation.section1].filter(Boolean).join(' ')}
    >
      {/* Actor search — full width on small screens, flex grow on large */}
      <div className={presentation.detail1}>
        <Search size={13} className={presentation.ink1} />
        <input
          type="text"
          placeholder="Search actors…"
          value={actor}
          onChange={(e) => updateFilter('actor', e.target.value)}
          className={['cp-input', presentation.field1]
            .filter(Boolean)
            .join(' ')}
        />
      </div>

      {/* All actors placeholder select — reuses actor filter visually */}
      <select
        value={action}
        onChange={(e) => updateFilter('action', e.target.value)}
        className={['cp-select', presentation.field2].filter(Boolean).join(' ')}
      >
        {actionTypes.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      {/* Date range */}
      <select
        value={dateRange}
        onChange={(e) => updateFilter('range', e.target.value)}
        className={['cp-select', presentation.field3].filter(Boolean).join(' ')}
      >
        {dateRanges.map((d) => (
          <option key={d.value} value={d.value}>
            {d.label}
          </option>
        ))}
      </select>
    </div>
  );
}
