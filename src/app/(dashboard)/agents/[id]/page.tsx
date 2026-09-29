import presentation from './page-presentation.module.css';
import { unstable_noStore as noStore } from 'next/cache';
import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';
import Link from '@/components/app-link';
import { createServerClient } from '@/lib/db/server';
import { getAuthUser } from '@/lib/auth-context';
import type { Agent, ServiceKey } from '@/lib/types';
import AutoRefresh from '@/components/auto-refresh';
import MarkdownPreview from '@/components/markdown-preview';
import {
  Avatar,
  PageFrame,
  EmptyState,
  SectionHeader,
} from '@/components/atoms';
import KeyActions from './key-actions';
import TrustControls from './trust-controls';
import TrustPolicyControls from './trust-policy-controls';
import { formatDate, formatDateTime } from '@/lib/format-date';
import {
  normalizeAgentTrustTier,
  TRUST_TIER_DESCRIPTIONS,
  TRUST_TIER_LABELS,
} from '@/lib/trust-tiers';
import { dotClassForTone } from '@/lib/status-tone';
import { normalizeAgentTrustPolicy } from '@/lib/agent-trust-policy';
import { KeyRound } from 'lucide-react';
import styles from './agent-detail.module.css';

export const dynamic = 'force-dynamic';

type ServiceKeyRow = Pick<
  ServiceKey,
  | 'id'
  | 'key_id'
  | 'is_active'
  | 'created_at'
  | 'rotated_at'
  | 'expires_at'
  | 'label'
>;

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const db = createServerClient();
  noStore();

  const { data: agent, error: agentError } = await db
    .from('agents')
    .select('*')
    .eq('id', id)
    .single();

  if (agentError || !agent) {
    notFound();
  }

  // Non-admin users can only view their own agents
  if (!user.isSuperAdmin && (agent as Agent).owner_user_id !== user.id) {
    notFound();
  }

  const { data: keys } = await db
    .from('service_keys')
    .select('id, key_id, is_active, created_at, rotated_at, expires_at, label')
    .eq('agent_id', id)
    .order('created_at', { ascending: false });

  const serviceKeys = (keys || []) as ServiceKeyRow[];
  const agentData = agent as Agent;
  const name = agentData.display_name || agentData.name;
  const now = new Date();
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const trustTier = normalizeAgentTrustTier(agentData.trust_tier);
  const canEditTrust = user.isSuperAdmin || agentData.owner_user_id === user.id;
  const trustPolicy = normalizeAgentTrustPolicy(agentData.trust_policy);

  return (
    <AutoRefresh
      intervalMs={30000}
      watch={['agents', 'contracts', 'participants']}
    >
      <PageFrame>
        {/* Back link */}
        <Link
          href="/agents"
          className={['text-xs', presentation.link1].filter(Boolean).join(' ')}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Back to Agents
        </Link>

        <SectionHeader
          title={name}
          eyebrow="Agent"
          sub="Identity, trust, capabilities, and service keys"
        />

        {/* Agent Header Card */}
        <div
          className={['card', presentation.section1].filter(Boolean).join(' ')}
        >
          <div className={presentation.detail1}>
            <div className={presentation.row1}>
              <Avatar name={name} size={48} />
              <div className={presentation.detail2}>
                <h2
                  className={['h2', presentation.section2]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {name}
                </h2>
                <div className={presentation.row2}>
                  <code
                    className={['mono text-2xs', presentation.code1]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {agentData.name}
                  </code>
                  {agentData.owner && agentData.owner !== agentData.name && (
                    <span className="dim text-xs">
                      owned by {agentData.owner}
                    </span>
                  )}
                  <span
                    className={`pill pill--${trustTier === 'internal' ? 'mint' : trustTier === 'partner' ? 'peri' : 'ghost'}`}
                  >
                    <span
                      className={dotClassForTone(
                        trustTier === 'internal'
                          ? 'mint'
                          : trustTier === 'partner'
                            ? 'peri'
                            : 'neutral',
                      )}
                    />
                    {TRUST_TIER_LABELS[trustTier]}
                  </span>
                </div>
                {agentData.description && (
                  <div className={presentation.detail3}>
                    <MarkdownPreview
                      content={agentData.description}
                      className="muted"
                    />
                  </div>
                )}
                <div
                  className={['card--inset', presentation.detail4]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <p
                    className={['upper dim text-2xs', presentation.copy1]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    Trust posture
                  </p>
                  <p
                    className={['text-xs', presentation.copy2]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {TRUST_TIER_DESCRIPTIONS[trustTier]}
                  </p>
                  {agentData.trust_notes && (
                    <p
                      className={['dim text-2xs', presentation.copy3]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {agentData.trust_notes}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Capabilities */}
            {agentData.capabilities && agentData.capabilities.length > 0 && (
              <div className={presentation.section3}>
                <p
                  className={['upper dim text-2xs', presentation.copy4]
                    .filter(Boolean)
                    .join(' ')}
                >
                  Capabilities
                </p>
                <div className={presentation.row3}>
                  {agentData.capabilities.map((cap) => (
                    <span key={cap} className="pill pill--peri">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Protocols */}
            {agentData.protocols && agentData.protocols.length > 0 && (
              <div className={presentation.section3}>
                <p
                  className={['upper dim text-2xs', presentation.copy4]
                    .filter(Boolean)
                    .join(' ')}
                >
                  Protocols
                </p>
                <div className={presentation.row3}>
                  {agentData.protocols.map((proto) => (
                    <span key={proto} className="pill pill--ghost mono">
                      {proto}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className={presentation.grid1}>
              <div>
                <p
                  className={['upper dim text-2xs', presentation.copy1]
                    .filter(Boolean)
                    .join(' ')}
                >
                  Active Keys
                </p>
                <span
                  className={['num text-sm', presentation.ink1]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {serviceKeys.filter((k) => k.is_active).length}
                </span>
              </div>
              <div>
                <p
                  className={['upper dim text-2xs', presentation.copy1]
                    .filter(Boolean)
                    .join(' ')}
                >
                  Max Active Contracts
                </p>
                <span
                  className={['mono num text-sm', presentation.ink2]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {agentData.max_concurrent_contracts ?? '∞'}
                </span>
              </div>
              <div>
                <p
                  className={['upper dim text-2xs', presentation.copy1]
                    .filter(Boolean)
                    .join(' ')}
                >
                  Registered
                </p>
                <span
                  className={['mono num text-sm', presentation.ink2]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {formatDate(agentData.created_at)}
                </span>
              </div>
              <div>
                <p
                  className={['upper dim text-2xs', presentation.copy1]
                    .filter(Boolean)
                    .join(' ')}
                >
                  Updated
                </p>
                <span
                  className={['mono num text-sm', presentation.ink2]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {formatDate(agentData.updated_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          className={[styles.stack, presentation.section1]
            .filter(Boolean)
            .join(' ')}
        >
          <TrustControls
            agentId={agentData.id}
            initialTier={trustTier}
            initialNotes={agentData.trust_notes || null}
            canEdit={canEditTrust}
          />
          <TrustPolicyControls
            agentId={agentData.id}
            initialTier={trustTier}
            initialPolicy={trustPolicy}
            canEdit={canEditTrust}
          />
        </div>

        {/* Service Keys Section */}
        <div
          className={['card', presentation.detail5].filter(Boolean).join(' ')}
        >
          <div className={presentation.row4}>
            <div>
              <h2 className="h3">Service Keys</h2>
              <p
                className={['dim text-2xs', presentation.copy5]
                  .filter(Boolean)
                  .join(' ')}
              >
                {serviceKeys.length} key{serviceKeys.length !== 1 ? 's' : ''}
              </p>
            </div>
            <KeyActions agentId={agentData.id} />
          </div>

          <div className={presentation.stack1}>
            {serviceKeys.length === 0 ? (
              <EmptyState
                icon={<KeyRound size={20} />}
                title="No service keys"
                hint={
                  <>
                    Use &quot;Rotate Key&quot; above to generate the first one.
                  </>
                }
              />
            ) : (
              serviceKeys.map((key) => {
                const isExpired =
                  key.expires_at && new Date(key.expires_at) < now;
                const isExpiring =
                  key.expires_at &&
                  !isExpired &&
                  new Date(key.expires_at) < twoHoursFromNow;

                return (
                  <div
                    key={key.id}
                    style={{
                      borderRadius: 'var(--radius-4)',
                      padding: 'var(--space-4)',
                      border: '1px solid',
                      borderColor:
                        !key.is_active || isExpired
                          ? 'var(--line-1)'
                          : isExpiring
                            ? 'var(--amber-bg)'
                            : 'var(--line-2)',
                      background:
                        !key.is_active || isExpired
                          ? 'var(--bg-1)'
                          : isExpiring
                            ? 'var(--amber-bg)'
                            : 'var(--bg-1)',
                      opacity: !key.is_active || isExpired ? 0.5 : 1,
                    }}
                  >
                    <div className={presentation.row5}>
                      <span
                        className={dotClassForTone(
                          !key.is_active || isExpired
                            ? 'neutral'
                            : isExpiring
                              ? 'amber'
                              : 'mint',
                        )}
                      />
                      <code
                        className={['mono text-sm', presentation.code2]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {key.key_id}
                      </code>
                      <span
                        className={`pill pill--${!key.is_active || isExpired ? 'ghost' : isExpiring ? 'amber' : 'mint'}`}
                      >
                        {isExpired
                          ? 'Expired'
                          : !key.is_active
                            ? 'Inactive'
                            : isExpiring
                              ? 'Expiring'
                              : 'Active'}
                      </span>
                    </div>
                    <div className={presentation.row6}>
                      {key.label && (
                        <span className="dim text-2xs">{key.label}</span>
                      )}
                      <span
                        className={['mono dim text-2xs', presentation.detail6]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        Created {formatDate(key.created_at)}
                      </span>
                      {key.rotated_at && (
                        <span
                          className={['mono text-2xs', presentation.ink3]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          Rotated {formatDate(key.rotated_at)}
                        </span>
                      )}
                      {key.expires_at && (
                        <span
                          className="mono text-2xs"
                          style={{
                            color: isExpired ? 'var(--fg-3)' : 'var(--amber)',
                          }}
                        >
                          {isExpired ? 'Expired' : 'Expires'}{' '}
                          {formatDateTime(key.expires_at)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </PageFrame>
    </AutoRefresh>
  );
}
