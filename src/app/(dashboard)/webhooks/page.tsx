import presentation from './page-presentation.module.css';
import { unstable_noStore as noStore } from 'next/cache';
import Link from 'next/link';
import { createServerClient } from '@/lib/db/server';
import { redirect } from 'next/navigation';
import { getAuthActorContext } from '@/lib/auth-actor-context';
import type { Webhook, Agent } from '@/lib/types';
import WebhookCard from './webhook-card';
import AutoRefresh from '@/components/auto-refresh';
import { Activity, Plus, BellRing } from 'lucide-react';
import {
  Avatar,
  PageFrame,
  EmptyState,
  SectionHeader,
} from '@/components/atoms';

export const dynamic = 'force-dynamic';

type WebhookWithAgent = Webhook & {
  agents: Pick<Agent, 'id' | 'name' | 'display_name'>;
};

export default async function WebhooksPage() {
  const auth = await getAuthActorContext();
  const user = auth?.user ?? null;
  if (!user || !auth) redirect('/login');

  const db = createServerClient();
  noStore();

  let query = db
    .from('webhooks')
    .select(
      `
      id,
      agent_id,
      url,
      events,
      is_active,
      failure_count,
      created_at,
      updated_at,
      last_delivery_at,
      agents!inner(id, name, display_name)
    `,
    )
    .order('created_at', { ascending: true });

  // Non-admin: only show webhooks for their agents
  if (!user.isSuperAdmin) {
    query = query.in('agent_id', auth.agentScope);
  }

  const { data: webhooks } = await query;

  const rows = (webhooks || []) as unknown as WebhookWithAgent[];

  // Group by agent
  const grouped = new Map<
    string,
    {
      agent: Pick<Agent, 'id' | 'name' | 'display_name'>;
      webhooks: WebhookWithAgent[];
    }
  >();
  for (const wh of rows) {
    const agentId = wh.agent_id;
    if (!grouped.has(agentId)) {
      grouped.set(agentId, { agent: wh.agents, webhooks: [] });
    }
    grouped.get(agentId)!.webhooks.push(wh);
  }

  return (
    <AutoRefresh intervalMs={30000} watch={['webhooks']}>
      <PageFrame>
        {/* Header */}
        <SectionHeader
          title={<>Webhooks</>}
          eyebrow={<>Push Notifications</>}
          sub={
            <>
              <p
                className={['muted text-sm', presentation.copy2]
                  .filter(Boolean)
                  .join(' ')}
              >
                Push notification endpoints
              </p>
            </>
          }
          right={
            <>
              <div className="row gap-2">
                <Link href="/webhooks/health" className="btn">
                  <Activity size={14} />
                  Health
                </Link>
                <Link href="/webhooks/register" className="btn btn--primary">
                  <Plus size={14} />
                  Register Webhook
                </Link>
              </div>
            </>
          }
        />

        {/* Content */}
        {rows.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<BellRing size={20} />}
              title="No webhooks configured"
              hint={
                <>
                  Register one here, or from the CLI:{' '}
                  <code
                    className={['mono text-2xs', presentation.code1]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    holloway webhook set --url &lt;url&gt; --secret &lt;s&gt;
                  </code>
                </>
              }
              action={
                <Link
                  className="btn btn--primary btn--sm row gap-2"
                  href="/webhooks/register"
                >
                  <Plus size={13} />
                  Register Webhook
                </Link>
              }
            />
          </div>
        ) : (
          <div className={presentation.stack1}>
            {Array.from(grouped.entries()).map(([agentId, group], groupIdx) => (
              <div
                key={agentId}
                className="animate-fade-in"
                style={{ animationDelay: `${groupIdx * 0.08}s` }}
              >
                {/* Agent section header */}
                <div
                  className={['row gap-3', presentation.section2]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <Avatar
                    name={group.agent.display_name || group.agent.name}
                    size={28}
                  />
                  <div>
                    <h2 className="h3">
                      {group.agent.display_name || group.agent.name}
                    </h2>
                    <span className="mono dim text-2xs">
                      {group.agent.name}
                    </span>
                  </div>
                  <span
                    className={['mono dim text-2xs', presentation.panel1]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {group.webhooks.length} webhook
                    {group.webhooks.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Webhook cards */}
                <div className={presentation.stack2}>
                  {group.webhooks.map((wh, idx) => (
                    <WebhookCard
                      key={wh.id}
                      webhook={wh}
                      animationDelay={`${groupIdx * 0.08 + idx * 0.04}s`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </PageFrame>
    </AutoRefresh>
  );
}
