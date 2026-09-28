import presentation from './page-presentation.module.css';
import { unstable_noStore as noStore } from 'next/cache';
import { createServerClient } from '@/lib/db/server';
import { getAuthActorContext } from '@/lib/auth-actor-context';
import { redirect } from 'next/navigation';
import ApprovalList from './approval-list';
import AutoRefresh from '@/components/auto-refresh';
import { getDashboardApprovalVisibility } from '@/lib/approval-trust-policy';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { PageFrame, EmptyState, SectionHeader } from '@/components/atoms';
export const dynamic = 'force-dynamic';

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const auth = await getAuthActorContext();
  const user = auth?.user ?? null;
  if (!user || !auth) redirect('/login');

  const visibility = await getDashboardApprovalVisibility(auth);
  if (!visibility.canViewPage) {
    return (
      <PageFrame>
        <SectionHeader
          title={<>Approvals</>}
          eyebrow={<>System</>}
          sub={
            <>
              <p className="muted text-sm">
                Sensitive operations waiting for an authorized reviewer.
              </p>
            </>
          }
        />
        <div className="card">
          <EmptyState
            icon={<ShieldCheck size={20} />}
            title="No approvals available to this account"
            hint="An eligible reviewer or a requesting agent can see approvals here."
          />
        </div>
      </PageFrame>
    );
  }

  const params = await searchParams;
  const filter = params.filter || 'pending';

  const db = createServerClient();
  noStore();

  let query = db
    .from('pending_approvals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (!user.isSuperAdmin) {
    if (
      visibility.allowedApprovalIds &&
      visibility.allowedApprovalIds.length > 0
    ) {
      query = query.in('id', visibility.allowedApprovalIds);
    } else if (visibility.visibleActors.length > 0) {
      query = query.in('actor', visibility.visibleActors);
    } else {
      query = query.eq('id', '00000000-0000-0000-0000-000000000000');
    }
  }

  if (filter !== 'all') {
    query = query.eq('status', filter);
  }

  const { data: approvals, error: queryError } = await query;
  if (queryError) {
    return (
      <PageFrame width="prose">
        <SectionHeader
          title={<>Approvals</>}
          sub={
            <>
              <p className="muted text-sm">Failed to load approvals</p>
            </>
          }
        />
        <div className="card">
          <EmptyState
            tone="error"
            icon={<AlertTriangle size={20} />}
            title="Failed to load approvals"
            hint="A database error occurred. The queue is not empty — it could not be read. Please try again later."
          />
        </div>
      </PageFrame>
    );
  }
  const rows = (approvals || []) as Array<{
    id: string;
    action: string;
    actor: string;
    details: Record<string, unknown>;
    status: 'pending' | 'approved' | 'denied' | 'consumed';
    reviewed_by: string | null;
    created_at: string;
    reviewed_at: string | null;
  }>;

  // Count pending for badge
  let pendingCountQuery = db
    .from('pending_approvals')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (!user.isSuperAdmin) {
    if (
      visibility.allowedApprovalIds &&
      visibility.allowedApprovalIds.length > 0
    ) {
      pendingCountQuery = pendingCountQuery.in(
        'id',
        visibility.allowedApprovalIds,
      );
    } else if (visibility.visibleActors.length > 0) {
      pendingCountQuery = pendingCountQuery.in(
        'actor',
        visibility.visibleActors,
      );
    } else {
      pendingCountQuery = pendingCountQuery.eq(
        'id',
        '00000000-0000-0000-0000-000000000000',
      );
    }
  }

  const { count: pendingCount } = await pendingCountQuery;

  const filters = ['pending', 'approved', 'consumed', 'denied', 'all'] as const;

  return (
    <AutoRefresh intervalMs={10000} watch={['approvals']}>
      <PageFrame width="prose">
        {/* Header */}
        <SectionHeader
          title={<>Approvals</>}
          eyebrow={<>System</>}
          sub={
            <>
              <p
                className={['muted text-sm', presentation.copy3]
                  .filter(Boolean)
                  .join(' ')}
              >
                Review and approve sensitive operations. Key rotation requires
                approval from another admin; admin-triggered kill switch
                activations are auto-approved.
                {(pendingCount ?? 0) > 0 && (
                  <span
                    className={['pill pill--amber', presentation.detail1]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {pendingCount} pending
                  </span>
                )}
              </p>
            </>
          }
        />

        {/* Filter tabs using .seg */}
        <div
          className={['seg', presentation.section4].filter(Boolean).join(' ')}
        >
          {filters.map((f) => (
            <a
              key={f}
              href={`/approvals${f === 'pending' ? '' : `?filter=${f}`}`}
              className={presentation.link1}
            >
              <button
                className={[filter === f ? 'active' : '', presentation.action1]
                  .filter(Boolean)
                  .join(' ')}
              >
                {f}
              </button>
            </a>
          ))}
        </div>

        {/* List */}
        <ApprovalList
          approvals={rows}
          currentUser={user.displayName}
          isSuperAdmin={user.isSuperAdmin}
        />
      </PageFrame>
    </AutoRefresh>
  );
}
