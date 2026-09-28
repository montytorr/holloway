'use client';
import presentation from './project-header-presentation.module.css';

import { useState, useRef, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { Pencil, Plus } from 'lucide-react';
import MarkdownPreview from '@/components/markdown-preview';
import { Avatar, EmptyState } from '@/components/atoms';
import { formatDateTime, formatRelative } from '@/lib/format-date';
import ProjectStatusDropdown from './project-status-dropdown';
import {
  inviteProjectMember,
  removeProjectMember,
  respondToProjectInvitation,
  updateProject,
} from './actions';
import {
  getInvitationStatusLabel,
  getInvitationStatusTone,
  type InvitationLike,
} from '../invitation-utils';
import styles from './project-detail.module.css';

interface ProjectHeaderProps {
  project: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    privacy_metadata?: { allow_observer_access?: boolean } | null;
  };
  members: Array<{
    id: string;
    role: string;
    agent: { id: string; name: string; display_name: string } | null;
  }>;
  invitations?: InvitationLike[];
  myPendingInvitations?: InvitationLike[];
  availableAgents?: Array<{
    id: string;
    name: string;
    display_name: string;
    trust_tier?: string | null;
  }>;
  isOwner?: boolean;
  hiddenPendingInvitationCount?: number;
  canSeeObserverInvitationSummary?: boolean;
}

function EditableProjectTitle({
  value,
  projectId,
  isOwner,
}: {
  value: string;
  projectId: string;
  isOwner: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const [isSaving, startSaveTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function save() {
    const newVal = text.trim();
    if (!newVal || newVal === value) {
      setText(value);
      setEditing(false);
      return;
    }
    startSaveTransition(async () => {
      await updateProject(projectId, { title: newVal });
      setEditing(false);
    });
  }

  if (!editing) {
    return (
      <div className={presentation.row1}>
        <h1 className={['h1', presentation.detail1].filter(Boolean).join(' ')}>
          {value}
        </h1>
        {isOwner && (
          <button
            onClick={() => setEditing(true)}
            className="btn btn--ghost btn--icon"
            title="Edit title"
          >
            <Pencil size={14} className={presentation.ink1} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={presentation.row1}>
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
          if (e.key === 'Escape') {
            setText(value);
            setEditing(false);
          }
        }}
        onBlur={save}
        disabled={isSaving}
        className={['cp-input text-2xl', presentation.field1]
          .filter(Boolean)
          .join(' ')}
      />
    </div>
  );
}

function EditableProjectDescription({
  value,
  projectId,
  isOwner,
}: {
  value: string | null;
  projectId: string;
  isOwner: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value || '');
  const [isSaving, startSaveTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = descriptionRef.current;
    /* Only measure while the clamp is on. Expanding removes the clamp class,
       so re-measuring then compares an unclamped element against itself,
       overflows flips to false, and the "Show less" button unmounts — the
       description could not be collapsed again without a reload. */
    if (!el || expanded) return;
    const check = () => setOverflows(el.scrollHeight > el.clientHeight + 4);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, expanded]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + 'px';
    }
  }, [editing]);

  function save() {
    const newVal = text.trim() || null;
    if (newVal === (value || null)) {
      setEditing(false);
      return;
    }
    startSaveTransition(async () => {
      await updateProject(projectId, { description: newVal });
      setEditing(false);
    });
  }

  if (!editing) {
    return (
      <div
        style={{
          borderRadius: 'var(--radius-3)',
          padding: 'var(--space-2)',
          margin: -8,
          transition: 'background 0.1s',
          minHeight: 24,
          position: 'relative',
          cursor: isOwner ? 'pointer' : undefined,
        }}
        onClick={isOwner ? () => setEditing(true) : undefined}
        title={isOwner ? 'Click to edit description' : undefined}
        onMouseEnter={(e) => {
          if (isOwner)
            (e.currentTarget as HTMLDivElement).style.background =
              'var(--bg-2)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = 'transparent';
        }}
      >
        {value ? (
          <div className={presentation.row2}>
            <div className={presentation.detail1}>
              <div
                ref={descriptionRef}
                className={[
                  styles.description,
                  expanded ? '' : styles.descriptionClamped,
                  !expanded && overflows ? styles.descriptionFaded : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <MarkdownPreview content={value} />
              </div>
              {/* Only offered when there is something to reveal: measured on
                  the rendered markdown, not guessed from its length. */}
              {overflows && (
                <button
                  type="button"
                  className={styles.descriptionToggle}
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded((v) => !v);
                  }}
                  aria-expanded={expanded}
                >
                  {expanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
            {isOwner && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(true);
                }}
                className={['btn btn--ghost btn--icon', presentation.action1]
                  .filter(Boolean)
                  .join(' ')}
                title="Edit description"
              >
                <Pencil size={12} className={presentation.ink1} />
              </button>
            )}
          </div>
        ) : (
          <p
            className={['text-sm', presentation.copy1]
              .filter(Boolean)
              .join(' ')}
          >
            {isOwner ? 'Click to add project description…' : 'No description'}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={presentation.stack1}>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          e.target.style.height = 'auto';
          e.target.style.height = e.target.scrollHeight + 'px';
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setText(value || '');
            setEditing(false);
          }
        }}
        disabled={isSaving}
        placeholder="Write description (markdown supported)…"
        className={['cp-textarea text-sm', presentation.field2]
          .filter(Boolean)
          .join(' ')}
      />
      <div className={presentation.row3}>
        <button
          type="button"
          onClick={() => {
            setText(value || '');
            setEditing(false);
          }}
          className="btn btn--ghost btn--sm"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={isSaving}
          className="btn btn--primary btn--sm"
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

export { EditableProjectDescription };

export default function ProjectHeader({
  project,
  members,
  invitations = [],
  myPendingInvitations = [],
  availableAgents = [],
  isOwner = false,
  hiddenPendingInvitationCount = 0,
  canSeeObserverInvitationSummary = false,
}: ProjectHeaderProps) {
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowAddDropdown(false);
      }
    }
    if (showAddDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAddDropdown]);

  function handleAddMember(agentId: string) {
    startTransition(async () => {
      await inviteProjectMember(project.id, agentId);
      setShowAddDropdown(false);
    });
  }

  function handleInvitation(
    invitationId: string,
    action: 'accept' | 'decline' | 'cancel',
  ) {
    startTransition(async () => {
      await respondToProjectInvitation(project.id, invitationId, action);
    });
  }

  function handleRemoveMember(memberId: string) {
    if (!confirm('Remove this member from the project?')) return;
    startTransition(async () => {
      await removeProjectMember(project.id, memberId);
    });
  }

  return (
    <div className={presentation.section1}>
      {/* Breadcrumb */}
      <div className={presentation.row4}>
        <Link
          href="/projects"
          className={['text-2xs', presentation.link1].filter(Boolean).join(' ')}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = 'var(--peri)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = 'var(--fg-4)';
          }}
        >
          Projects
        </Link>
        <span
          className={['text-2xs', presentation.ink1].filter(Boolean).join(' ')}
        >
          ›
        </span>
        <span
          className={['text-2xs', presentation.ink2].filter(Boolean).join(' ')}
        >
          {project.title}
        </span>
      </div>

      <div className={styles.headerGrid}>
        <div className={presentation.detail2}>
          <div className={styles.headerMain}>
            <div className={presentation.detail1}>
              <div className={presentation.row5}>
                <EditableProjectTitle
                  value={project.title}
                  projectId={project.id}
                  isOwner={isOwner}
                />
                <ProjectStatusDropdown
                  projectId={project.id}
                  currentStatus={project.status}
                />
              </div>
            </div>

            {/* Member Avatars */}
            <div className={presentation.row6}>
              <div className={presentation.row7}>
                {members.slice(0, 5).map((m) => {
                  const name = m.agent?.display_name || m.agent?.name || '?';
                  return (
                    <div
                      key={m.id}
                      className={styles.memberChip}
                      style={{ marginLeft: m.id === members[0]?.id ? 0 : -8 }}
                    >
                      <span
                        title={`${name} (${m.role})`}
                        className={presentation.detail3}
                      >
                        <Avatar name={name} size={32} />
                      </span>
                      {isOwner && m.role !== 'owner' && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m.id)}
                          disabled={isPending}
                          title={`Remove ${name}`}
                          aria-label={`Remove ${name} from this project`}
                          className={`text-2xs ${styles.memberRemove}`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
                {members.length > 5 && (
                  <div
                    className={['text-2xs', presentation.row8]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    +{members.length - 5}
                  </div>
                )}
              </div>

              {/* Add Member Button */}
              {isOwner && (
                <div className={presentation.detail4} ref={dropdownRef}>
                  <button
                    onClick={() => setShowAddDropdown(!showAddDropdown)}
                    disabled={isPending}
                    className={[
                      'btn btn--ghost btn--icon',
                      presentation.action2,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    title="Add member"
                  >
                    <Plus size={14} className={presentation.ink1} />
                  </button>

                  {showAddDropdown && (
                    <div
                      className={['card', presentation.detail5]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <div className={presentation.detail6}>
                        <span className="upper text-2xs">Add Member</span>
                      </div>
                      {availableAgents.length === 0 ? (
                        <EmptyState
                          title="No agents available"
                          hint="Every agent you can invite is already a member."
                        />
                      ) : (
                        availableAgents.map((agent) => {
                          const name = agent.display_name || agent.name;
                          return (
                            <button
                              key={agent.id}
                              onClick={() => handleAddMember(agent.id)}
                              disabled={isPending}
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '8px 12px',
                                textAlign: 'left',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'background 0.1s',
                                opacity: isPending ? 0.5 : 1,
                              }}
                              onMouseEnter={(e) => {
                                (
                                  e.currentTarget as HTMLButtonElement
                                ).style.background = 'var(--bg-2)';
                              }}
                              onMouseLeave={(e) => {
                                (
                                  e.currentTarget as HTMLButtonElement
                                ).style.background = 'transparent';
                              }}
                            >
                              <Avatar name={name} size={24} />
                              <div className={presentation.detail2}>
                                <p
                                  className={['text-2xs', presentation.copy2]
                                    .filter(Boolean)
                                    .join(' ')}
                                >
                                  {name}
                                </p>
                                <p
                                  className={['text-2xs', presentation.copy3]
                                    .filter(Boolean)
                                    .join(' ')}
                                >
                                  {agent.name}
                                </p>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}

              <span
                className={['text-2xs', presentation.ink3]
                  .filter(Boolean)
                  .join(' ')}
              >
                {members.length} member{members.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Invitation banners */}
      {(myPendingInvitations.length > 0 ||
        (isOwner && invitations.length > 0) ||
        (!isOwner &&
          canSeeObserverInvitationSummary &&
          hiddenPendingInvitationCount > 0)) && (
        <div className={presentation.stack2}>
          {myPendingInvitations.map((invitation) => {
            const inviter =
              invitation.invited_by?.display_name ||
              invitation.invited_by?.name ||
              'Unknown';
            const agentName =
              invitation.agent?.display_name ||
              invitation.agent?.name ||
              'Unknown';
            return (
              <div
                key={invitation.id}
                className={['card', presentation.stack3]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div>
                  <p
                    className={['text-xs', presentation.copy4]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    Pending invitation for {agentName}
                  </p>
                  <p
                    className={['text-2xs', presentation.copy5]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    Invited by {inviter}. Accept to join this project, or
                    decline to stay out.
                  </p>
                  <div
                    className={['text-2xs', presentation.row9]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {invitation.created_at && (
                      <span>
                        Created {formatRelative(invitation.created_at)}
                      </span>
                    )}
                    {invitation.expires_at && (
                      <span title={formatDateTime(invitation.expires_at)}>
                        Expires {formatRelative(invitation.expires_at)}
                      </span>
                    )}
                    {invitation.reminder_sent_at && (
                      <span title={formatDateTime(invitation.reminder_sent_at)}>
                        Reminder sent{' '}
                        {formatRelative(invitation.reminder_sent_at)}
                      </span>
                    )}
                  </div>
                </div>
                <div className={presentation.row10}>
                  <button
                    onClick={() => handleInvitation(invitation.id, 'decline')}
                    disabled={isPending}
                    className="btn btn--ghost btn--sm"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleInvitation(invitation.id, 'accept')}
                    disabled={isPending}
                    className="btn btn--primary btn--sm"
                  >
                    Accept
                  </button>
                </div>
              </div>
            );
          })}

          {!isOwner &&
            canSeeObserverInvitationSummary &&
            hiddenPendingInvitationCount > 0 && (
              <div
                className={['card', presentation.detail7]
                  .filter(Boolean)
                  .join(' ')}
              >
                <p
                  className={['upper text-2xs', presentation.copy6]
                    .filter(Boolean)
                    .join(' ')}
                >
                  Invitation summary
                </p>
                <p
                  className={['text-xs', presentation.copy7]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {hiddenPendingInvitationCount} pending invitation
                  {hiddenPendingInvitationCount !== 1 ? 's are' : ' is'}{' '}
                  currently hidden by trust policy.
                </p>
                <p
                  className={['dim text-2xs', presentation.copy8]
                    .filter(Boolean)
                    .join(' ')}
                >
                  Observer access still lets you inspect the project, but
                  unresolved invitee metadata stays restricted until your trust
                  tier clears the invitation visibility policy.
                </p>
              </div>
            )}

          {isOwner && invitations.length > 0 && (
            <details
              className="card"
              open={
                invitations.some(
                  (invitation) => invitation.status === 'pending',
                ) || undefined
              }
            >
              <summary className={styles.invitationsSummary}>
                Invitation timeline{' '}
                <span className="pill">{invitations.length}</span>
              </summary>
              <div className={styles.invitationsBody}>
                {invitations.map((invitation) => {
                  const agentName =
                    invitation.agent?.display_name ||
                    invitation.agent?.name ||
                    'Unknown';
                  const inviter =
                    invitation.invited_by?.display_name ||
                    invitation.invited_by?.name ||
                    'Unknown';
                  const tone = getInvitationStatusTone(
                    invitation.status as never,
                  );
                  const label = getInvitationStatusLabel(
                    invitation.status as never,
                  );
                  const canCancel = invitation.status === 'pending';
                  return (
                    <div
                      key={invitation.id}
                      className={['card--inset', presentation.row11]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <div className={presentation.detail2}>
                        <div className={presentation.row12}>
                          <p
                            className={['text-xs', presentation.copy9]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            {agentName}
                          </p>
                          <span className={tone}>{label}</span>
                        </div>
                        <p
                          className={['text-2xs', presentation.copy10]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          Invited by {inviter}
                          {invitation.expires_at &&
                          invitation.status === 'pending'
                            ? ` · expires ${formatRelative(invitation.expires_at)}`
                            : ''}
                          {invitation.responded_at &&
                          invitation.status !== 'pending'
                            ? ` · resolved ${formatRelative(invitation.responded_at)}`
                            : ''}
                        </p>
                      </div>
                      {canCancel ? (
                        <button
                          onClick={() =>
                            handleInvitation(invitation.id, 'cancel')
                          }
                          disabled={isPending}
                          className="btn btn--danger btn--sm"
                        >
                          Cancel
                        </button>
                      ) : (
                        <span
                          className={['text-2xs', presentation.ink1]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          No action
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
