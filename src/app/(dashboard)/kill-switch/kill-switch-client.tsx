'use client';
import { PendingLabel } from '@/components/loading';
import presentation from './kill-switch-client-presentation.module.css';

import { useState, useCallback } from 'react';
import {
  requestKillSwitchActivation,
  executeKillSwitchActivation,
  deactivateKillSwitch,
  getKillSwitchStatus,
} from './actions';
import { formatDateTime } from '@/lib/format-date';
import { EmptyState, PageFrame, SectionHeader } from '@/components/atoms';
import { Lock, ShieldAlert } from 'lucide-react';

interface KillSwitchClientProps {
  isSuperAdmin: boolean;
  initialStatus: {
    enabled: boolean;
    updated_at: string | null;
    updated_by: string | null;
  };
}

export default function KillSwitchClient({
  isSuperAdmin,
  initialStatus,
}: KillSwitchClientProps) {
  const [isActive, setIsActive] = useState<boolean | null>(
    initialStatus.enabled,
  );
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(
    initialStatus.updated_at,
  );
  const [updatedBy, setUpdatedBy] = useState<string | null>(
    initialStatus.updated_by,
  );

  const loadStatus = useCallback(async () => {
    try {
      const status = await getKillSwitchStatus();
      setIsActive(status.enabled);
      setLastUpdated(status.updated_at);
      setUpdatedBy(status.updated_by);
    } catch {
      setIsActive(false);
    }
  }, []);

  async function handleActivate() {
    setLoading(true);
    try {
      try {
        await executeKillSwitchActivation();
        setIsActive(true);
        setConfirming(false);
        await loadStatus();
        setLoading(false);
        return;
      } catch {
        // No approved request — submit a new one
      }
      await requestKillSwitchActivation();
      await executeKillSwitchActivation();
      setIsActive(true);
      setConfirming(false);
      alert(
        'Kill switch activated. Admin-triggered activations are auto-approved.',
      );
      await loadStatus();
    } catch (err) {
      console.error('Failed to activate kill switch:', err);
    }
    setLoading(false);
  }

  async function handleDeactivate() {
    setLoading(true);
    try {
      await deactivateKillSwitch();
      setIsActive(false);
      setConfirming(false);
      await loadStatus();
    } catch (err) {
      console.error('Failed to deactivate kill switch:', err);
    }
    setLoading(false);
  }

  return (
    <PageFrame>
      <SectionHeader
        title="Emergency controls"
        eyebrow="Operations"
        sub="Manage the system-wide write freeze."
      />
      <div className={presentation.row1}>
        <div className={presentation.detail1}>
          <div
            className={presentation.statusIcon}
            data-active={isActive}
            aria-hidden="true"
          >
            <ShieldAlert size={20} />
          </div>

          {/* Status text */}
          <h2
            className="h2"
            style={{
              fontWeight: 700,
              letterSpacing: '-0.02em',
              marginBottom: 8,
              transition: 'color 0.7s',
              color: isActive ? 'var(--rose)' : 'var(--mint)',
            }}
          >
            {isActive ? 'Write freeze active' : 'Write freeze off'}
          </h2>
          <p
            className={['text-sm', presentation.copy1]
              .filter(Boolean)
              .join(' ')}
          >
            {isActive
              ? 'All contracts are frozen. API write operations are blocked.'
              : 'API write requests follow normal permissions.'}
          </p>
          {lastUpdated && (
            <p
              className={['mono num text-2xs', presentation.copy2]
                .filter(Boolean)
                .join(' ')}
            >
              Last updated: {formatDateTime(lastUpdated)}
              {updatedBy && (
                <span className={presentation.ink1}> · {updatedBy}</span>
              )}
            </p>
          )}

          {/* Action — only for super admins */}
          {isSuperAdmin ? (
            confirming ? (
              <div
                className={['card animate-fade-in', presentation.detail2]
                  .filter(Boolean)
                  .join(' ')}
              >
                <p
                  className="text-sm"
                  style={{
                    fontWeight: 600,
                    marginBottom: 24,
                    color: isActive ? 'var(--mint)' : 'var(--rose)',
                  }}
                >
                  {isActive
                    ? 'Resume normal system operations?'
                    : 'This will freeze ALL contracts and block API writes.'}
                </p>
                <div className="row gap-3">
                  <button
                    onClick={() => setConfirming(false)}
                    disabled={loading}
                    className={['btn btn--ghost', presentation.action1]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={isActive ? handleDeactivate : handleActivate}
                    disabled={loading}
                    className="btn"
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      height: 40,
                      fontWeight: 700,
                      background: isActive
                        ? 'var(--mint-bg)'
                        : 'var(--rose-bg)',
                      borderColor: isActive
                        ? 'var(--mint-line)'
                        : 'var(--rose-line)',
                      color: isActive ? 'var(--mint)' : 'var(--rose)',
                      transition: 'all 0.3s',
                    }}
                  >
                    <PendingLabel pending={loading} label="Processing…">
                      {isActive ? 'Deactivate' : 'Activate'}
                    </PendingLabel>
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="btn text-sm"
                style={{
                  height: 48,
                  padding: '0 40px',

                  fontWeight: 700,
                  borderRadius: 10,
                  background: isActive ? 'var(--mint-bg)' : 'var(--rose-bg)',
                  borderColor: isActive
                    ? 'var(--mint-line)'
                    : 'var(--rose-line)',
                  color: isActive ? 'var(--mint)' : 'var(--rose)',
                  transition: 'all 0.5s',
                }}
              >
                {isActive ? 'Deactivate Kill Switch' : 'Activate Kill Switch'}
              </button>
            )
          ) : (
            <div
              className={['card', presentation.detail3]
                .filter(Boolean)
                .join(' ')}
            >
              <EmptyState
                icon={<Lock size={20} />}
                title="No controls available"
                hint="Only administrators can arm or release the kill switch. The state above is live and read-only for you."
              />
            </div>
          )}
        </div>
      </div>
    </PageFrame>
  );
}
