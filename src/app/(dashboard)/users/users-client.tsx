'use client';
import { PendingLabel } from '@/components/loading';
import presentation from './users-client-presentation.module.css';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  toggleSuperAdmin,
  linkAgentToUser,
  unlinkAgent,
  createUser,
} from './actions';
import { formatDate } from '@/lib/format-date';
import { Plus, X, Shield, User, Bot, Link2, Unlink } from 'lucide-react';
import {
  Avatar,
  PageFrame,
  EmptyState,
  SectionHeader,
} from '@/components/atoms';
import { pillClassForTone } from '@/lib/status-tone';

interface UserProfile {
  id: string;
  display_name: string;
  is_super_admin: boolean;
  created_at: string;
  email: string;
}

interface AgentInfo {
  id: string;
  name: string;
  display_name: string;
  owner: string;
  owner_user_id: string | null;
  capabilities: string[];
}

interface UsersClientProps {
  profiles: UserProfile[];
  agentsByOwner: Record<string, AgentInfo[]>;
  unlinkedAgents: AgentInfo[];
  currentUserId: string;
  activeAgentId: string | null;
  fallbackMode: 'selected-agent' | 'least-privilege';
}

export default function UsersClient({
  profiles,
  agentsByOwner,
  unlinkedAgents: initialUnlinked,
  currentUserId,
  activeAgentId,
  fallbackMode,
}: UsersClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkingUser, setLinkingUser] = useState<string | null>(null);
  const [selectedAgentByUser, setSelectedAgentByUser] = useState<
    Record<string, string>
  >({});

  // Add User form state
  const [showAddUser, setShowAddUser] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newIsSuperAdmin, setNewIsSuperAdmin] = useState(false);
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState<string | null>(null);

  async function handleToggleAdmin(userId: string, currentValue: boolean) {
    setLoading(userId);
    setError(null);
    const result = await toggleSuperAdmin(userId, !currentValue);
    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
    setLoading(null);
  }

  async function handleUnlinkAgent(agentId: string) {
    setLoading(agentId);
    setError(null);
    const result = await unlinkAgent(agentId);
    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
    setLoading(null);
  }

  async function handleLinkAgent(userId: string) {
    const selectedAgent = selectedAgentByUser[userId] || '';
    if (!selectedAgent) return;
    setLoading(`link-${userId}`);
    setError(null);
    const result = await linkAgentToUser(selectedAgent, userId);
    if (result.error) {
      setError(result.error);
    } else {
      setLinkingUser(null);
      setSelectedAgentByUser((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      router.refresh();
    }
    setLoading(null);
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setAddUserLoading(true);
    setAddUserError(null);

    const result = await createUser(
      newEmail,
      newDisplayName,
      newPassword,
      newIsSuperAdmin,
    );
    if (result.error) {
      setAddUserError(result.error);
    } else {
      setShowAddUser(false);
      setNewEmail('');
      setNewDisplayName('');
      setNewPassword('');
      setNewIsSuperAdmin(false);
      setAddUserError(null);
      router.refresh();
    }
    setAddUserLoading(false);
  }

  return (
    <PageFrame>
      {/* Header */}
      <SectionHeader
        title={<>Users</>}
        eyebrow={<>Administration</>}
        sub={
          <>
            <p
              className={['text-sm', presentation.copy2]
                .filter(Boolean)
                .join(' ')}
            >
              Manage user profiles and agent ownership
            </p>
            <p className="mono dim text-2xs">
              Acting agent scope:{' '}
              {activeAgentId
                ? 'selected agent'
                : fallbackMode === 'least-privilege'
                  ? 'least-privilege aggregate'
                  : 'selected agent'}
              . Admin controls remain global.
            </p>
          </>
        }
        right={
          <>
            <button
              className={['btn btn--sm', presentation.action1]
                .filter(Boolean)
                .join(' ')}
              onClick={() => setShowAddUser(!showAddUser)}
            >
              {showAddUser ? (
                <>
                  <X size={13} /> Cancel
                </>
              ) : (
                <>
                  <Plus size={13} /> Add User
                </>
              )}
            </button>
          </>
        }
      />

      {/* Add User Form */}
      {showAddUser && (
        <div
          className={['card animate-fade-in', presentation.section3]
            .filter(Boolean)
            .join(' ')}
        >
          <h3
            className={['h3', presentation.section4].filter(Boolean).join(' ')}
          >
            Create New User
          </h3>

          {addUserError && (
            <div
              className={['text-sm', presentation.panel1]
                .filter(Boolean)
                .join(' ')}
            >
              {addUserError}
            </div>
          )}

          <form onSubmit={handleCreateUser}>
            <div className={presentation.grid1}>
              <div>
                <label
                  className={['upper', presentation.label1]
                    .filter(Boolean)
                    .join(' ')}
                >
                  Email <span className={presentation.ink1}>*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="cp-input"
                />
              </div>
              <div>
                <label
                  className={['upper', presentation.label1]
                    .filter(Boolean)
                    .join(' ')}
                >
                  Display Name <span className={presentation.ink1}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="John Doe"
                  className="cp-input"
                />
              </div>
              <div>
                <label
                  className={['upper', presentation.label1]
                    .filter(Boolean)
                    .join(' ')}
                >
                  Password <span className={presentation.ink1}>*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="cp-input"
                />
              </div>
              <div className={presentation.row1}>
                <label className={presentation.row2}>
                  <div className={presentation.detail2}>
                    <input
                      type="checkbox"
                      checked={newIsSuperAdmin}
                      onChange={(e) => setNewIsSuperAdmin(e.target.checked)}
                      className={presentation.field1}
                    />
                    <div
                      style={{
                        width: 36,
                        height: 20,
                        borderRadius: 10,
                        background: newIsSuperAdmin
                          ? 'var(--amber-bg)'
                          : 'var(--bg-2)',
                        border: `1px solid ${newIsSuperAdmin ? 'var(--amber-line)' : 'var(--line-1)'}`,
                        transition: 'all 0.15s',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: 2,
                          left: newIsSuperAdmin ? 18 : 2,
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          background: newIsSuperAdmin
                            ? 'var(--amber)'
                            : 'var(--fg-4)',
                          transition: 'all 0.15s',
                        }}
                      />
                    </div>
                  </div>
                  <span
                    className={['text-xs', presentation.ink2]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    Super Admin
                  </span>
                </label>
              </div>
            </div>

            <div
              className={['row gap-3', presentation.detail3]
                .filter(Boolean)
                .join(' ')}
            >
              <button
                type="submit"
                disabled={addUserLoading}
                className="btn btn--primary btn--sm"
                style={{ opacity: addUserLoading ? 0.5 : 1 }}
              >
                <PendingLabel pending={addUserLoading} label="Creating…">Create User</PendingLabel>
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  setShowAddUser(false);
                  setAddUserError(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div
          className={['animate-fade-in text-sm', presentation.panel2]
            .filter(Boolean)
            .join(' ')}
        >
          {error}
        </div>
      )}

      {/* User Cards */}
      <div className="col gap-3">
        {profiles.length === 0 && (
          <div className="card">
            <EmptyState
              icon={<User size={20} />}
              title="No users visible"
              hint="Create the first account with Add User above."
            />
          </div>
        )}
        {profiles.map((profile, idx) => {
          const userAgents = agentsByOwner[profile.id] || [];
          const isSelf = profile.id === currentUserId;

          return (
            <div
              key={profile.id}
              className="card animate-fade-in"
              style={{ animationDelay: `${idx * 0.08}s` }}
            >
              <div className={presentation.detail4}>
                {/* User header */}
                <div
                  className={['row row--split', presentation.section5]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <div className="row gap-3">
                    <Avatar
                      name={profile.display_name || profile.email || '?'}
                      size={44}
                    />
                    <div>
                      <div
                        className={[
                          'row gap-2 flex-wrap',
                          presentation.section6,
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <h2 className="h3">{profile.display_name}</h2>
                        {/* Amber here means "elevated privilege" — a real
                            signal. The "You" chip beside it is identity, not a
                            state, so it is neutral: hashing the name to one of
                            the four status tones meant it could come out amber
                            and read as a second privilege badge. The Avatar
                            alongside already carries the hashed colour. */}
                        {profile.is_super_admin && (
                          <span className={pillClassForTone('amber')}>
                            <Shield size={9} />
                            Super Admin
                          </span>
                        )}
                        {isSelf && (
                          <span className={pillClassForTone('neutral')}>
                            <User size={9} />
                            You
                          </span>
                        )}
                      </div>
                      <p
                        className={['mono text-xs', presentation.copy3]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {profile.email}
                      </p>
                      <p
                        className={['mono dim text-2xs', presentation.copy4]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        ID: {profile.id.slice(0, 8)}…
                      </p>
                    </div>
                  </div>

                  {/* Toggle admin button */}
                  <button
                    onClick={() =>
                      handleToggleAdmin(profile.id, profile.is_super_admin)
                    }
                    disabled={
                      loading === profile.id ||
                      (isSelf && profile.is_super_admin)
                    }
                    className={
                      profile.is_super_admin
                        ? 'btn btn--sm btn--danger'
                        : 'btn btn--sm'
                    }
                    style={{
                      opacity:
                        loading === profile.id ||
                        (isSelf && profile.is_super_admin)
                          ? 0.35
                          : 1,
                      ...(profile.is_super_admin
                        ? {}
                        : {
                            color: 'var(--amber)',
                            borderColor: 'var(--amber-line)',
                          }),
                    }}
                    title={
                      isSelf && profile.is_super_admin
                        ? 'Cannot remove your own admin'
                        : undefined
                    }
                  >
                    <PendingLabel pending={loading === profile.id} label="Updating…">{profile.is_super_admin ? 'Remove Admin' : 'Make Admin'}</PendingLabel>
                  </button>
                </div>

                {/* Linked Agents */}
                <div>
                  <div
                    className={['row', presentation.section7]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <p className="upper dim">
                      Linked Agents ({userAgents.length})
                    </p>
                    <button
                      className={[
                        'btn btn--ghost btn--sm text-2xs',
                        presentation.action2,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() =>
                        setLinkingUser(
                          linkingUser === profile.id ? null : profile.id,
                        )
                      }
                    >
                      {linkingUser === profile.id ? 'Cancel' : '+ Link Agent'}
                    </button>
                  </div>

                  {/* Link agent form */}
                  {linkingUser === profile.id && (
                    <div
                      className={[
                        'row gap-2 animate-fade-in',
                        presentation.section8,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <select
                        value={selectedAgentByUser[profile.id] || ''}
                        onChange={(e) =>
                          setSelectedAgentByUser((prev) => ({
                            ...prev,
                            [profile.id]: e.target.value,
                          }))
                        }
                        className={['cp-select', presentation.field2]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <option value="">Select unlinked agent…</option>
                        {initialUnlinked.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.display_name} ({a.name})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleLinkAgent(profile.id)}
                        disabled={
                          !selectedAgentByUser[profile.id] ||
                          loading === `link-${profile.id}`
                        }
                        className="btn btn--sm"
                        style={{
                          opacity:
                            !selectedAgentByUser[profile.id] ||
                            loading === `link-${profile.id}`
                              ? 0.35
                              : 1,
                          gap: 5,
                          color: 'var(--peri)',
                          borderColor: 'var(--peri-line)',
                        }}
                      >
                        <Link2 size={12} />
                        Link
                      </button>
                    </div>
                  )}

                  {userAgents.length === 0 ? (
                    <EmptyState title="No agents linked" />
                  ) : (
                    <div className="col gap-2">
                      {userAgents.map((agent) => (
                        <div
                          key={agent.id}
                          className={[
                            'row gap-3 flex-wrap',
                            presentation.panel3,
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          <div className={presentation.row3}>
                            <Bot size={12} className={presentation.ink3} />
                          </div>
                          <div
                            className={['min-w-[8rem]', presentation.field2]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            <span
                              className={['text-sm', presentation.ink4]
                                .filter(Boolean)
                                .join(' ')}
                            >
                              {agent.display_name}
                            </span>
                            <span
                              className={[
                                'mono dim text-2xs',
                                presentation.detail5,
                              ]
                                .filter(Boolean)
                                .join(' ')}
                            >
                              {agent.name}
                            </span>
                          </div>
                          {/* Capabilities */}
                          {agent.capabilities &&
                            agent.capabilities.length > 0 && (
                              <div className="row gap-1 flex-wrap">
                                {agent.capabilities
                                  .slice(0, 3)
                                  .map((cap: string) => (
                                    <span
                                      key={cap}
                                      className="pill pill--peri text-2xs"
                                    >
                                      {cap}
                                    </span>
                                  ))}
                                {agent.capabilities.length > 3 && (
                                  <span className="dim text-2xs">
                                    +{agent.capabilities.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          <button
                            onClick={() => handleUnlinkAgent(agent.id)}
                            disabled={loading === agent.id}
                            className="btn btn--ghost btn--icon btn--sm"
                            style={{
                              opacity: loading === agent.id ? 0.3 : 1,
                              width: 26,
                              height: 26,
                            }}
                            title="Unlink agent"
                          >
                            <Unlink size={11} className={presentation.copy3} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div className={presentation.detail6}>
                  <span className="mono dim num text-2xs">
                    Joined {formatDate(profile.created_at)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </PageFrame>
  );
}
