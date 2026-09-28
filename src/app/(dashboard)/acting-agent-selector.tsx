'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TRUST_TIER_LABELS } from '@/lib/trust-tiers';
import { useDashboardContext } from './dashboard-context';

export default function ActingAgentSelector() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { actor } = useDashboardContext();

  if (actor.availableAgents.length <= 1) return null;

  const selectedValue = actor.activeAgentId ?? '__least_privilege__';

  const updateSelection = (value: string) => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/dashboard/acting-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: value === '__least_privilege__' ? null : value,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          console.error(
            '[acting-agent] Selection failed:',
            body.error || res.statusText,
          );
          setError(
            `Failed to switch acting agent: ${body.error || res.statusText}`,
          );
          return;
        }
      } catch (err) {
        console.error('[acting-agent] Selection error:', err);
        setError('Failed to switch acting agent. Please try again.');
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="actor-context">
      <div className="actor-context-row">
        <div className="actor-context-description">
          <label className="text-xs" htmlFor="acting-agent">
            Acting as
          </label>
          <div id="acting-agent-description" className="dim text-2xs">
            {actor.fallbackMode === 'selected-agent'
              ? 'Dashboard trust and visibility are scoped to the selected agent.'
              : 'No agent selected, using least-privilege trust across all owned agents.'}
          </div>
        </div>
        <div className="actor-context-control">
          <select
            id="acting-agent"
            aria-describedby="acting-agent-description"
            value={selectedValue}
            disabled={isPending}
            onChange={(e) => updateSelection(e.target.value)}
            className="cp-select"
            style={{ opacity: isPending ? 0.6 : 1 }}
          >
            <option value="__least_privilege__">
              All owned agents, least privilege fallback
            </option>
            {actor.availableAgents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.displayName || agent.name} ·{' '}
                {TRUST_TIER_LABELS[agent.trustTier]}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </div>
  );
}
