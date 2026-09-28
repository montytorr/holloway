'use client';
import presentation from './email-admin-client-presentation.module.css';

import { useState } from 'react';
import {
  AlertTriangle,
  CheckSquare,
  FileText,
  KeyRound,
  Mail,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';

const TEMPLATES = [
  {
    id: 'welcome',
    label: 'Welcome',
    description: 'Sent when a new account is created',
    icon: Mail,
  },
  {
    id: 'password-reset',
    label: 'Password Reset',
    description: 'Sent when a user requests a password reset',
    icon: KeyRound,
  },
  {
    id: 'contract-invitation',
    label: 'Contract Invitation',
    description: 'Sent when an agent receives a contract proposal',
    icon: FileText,
  },
  {
    id: 'task-assigned',
    label: 'Task Assigned',
    description: 'Sent when a task is assigned to a user',
    icon: CheckSquare,
  },
  {
    id: 'approval-request',
    label: 'Approval Request',
    description: 'Sent when an action requires admin approval',
    icon: ShieldCheck,
  },
  {
    id: 'project-member-invitation',
    label: 'Project Invitation',
    description: 'Sent when an agent is invited to a project',
    icon: UserPlus,
  },
  {
    id: 'stale-blocker',
    label: 'Stale Blocker',
    description: 'Sent when a blocked task is automatically escalated',
    icon: AlertTriangle,
  },
];

interface EmailAdminClientProps {
  userEmail: string;
}

export default function EmailAdminClient({ userEmail }: EmailAdminClientProps) {
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  return (
    <div className={presentation.grid1}>
      <div className={presentation.stack1}>
        <p
          className={['upper dim text-2xs', presentation.copy1]
            .filter(Boolean)
            .join(' ')}
        >
          Templates
        </p>
        {TEMPLATES.map((tpl) => {
          const Icon = tpl.icon;
          const selected = activeTemplate === tpl.id;

          return (
            <button
              key={tpl.id}
              type="button"
              style={{
                cursor: 'pointer',
                width: '100%',
                border: `1px solid ${selected ? 'color-mix(in oklch, var(--brand) 58%, var(--line-1))' : 'transparent'}`,
                background: selected
                  ? 'color-mix(in oklch, var(--brand-bg) 46%, var(--bg-1))'
                  : 'transparent',
                borderRadius: 9,
                padding: '9px 10px',
                display: 'grid',
                gridTemplateColumns: '30px 1fr',
                gap: 10,
                textAlign: 'left',
                alignItems: 'center',
                position: 'relative',
              }}
              onClick={() => setActiveTemplate(tpl.id)}
            >
              {selected && <span className={presentation.detail1} />}
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 'var(--radius-3)',
                  display: 'grid',
                  placeItems: 'center',
                  color: selected ? 'var(--brand)' : 'var(--fg-3)',
                  background: selected
                    ? 'color-mix(in oklch, var(--brand-bg) 70%, transparent)'
                    : 'var(--bg-2)',
                  border: '1px solid var(--line-1)',
                }}
              >
                <Icon size={15} strokeWidth={1.8} />
              </span>
              <span className={presentation.detail2}>
                <span
                  className={['text-sm', presentation.ink1]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {tpl.label}
                </span>
                <span
                  className={['dim text-2xs', presentation.detail3]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {tpl.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className={['card', presentation.stack2].filter(Boolean).join(' ')}>
        {activeTemplate ? (
          <>
            <div className={presentation.row1}>
              <div>
                <p
                  className={['muted text-xs', presentation.copy2]
                    .filter(Boolean)
                    .join(' ')}
                >
                  Preview —{' '}
                  {TEMPLATES.find((t) => t.id === activeTemplate)?.label}
                </p>
                <p
                  className={['dim text-2xs', presentation.copy3]
                    .filter(Boolean)
                    .join(' ')}
                >
                  Uses preview-only payloads; test sends require explicit real
                  props and remain disabled here for {userEmail}.
                </p>
              </div>
              <a
                href={`/api/v1/email/preview?template=${activeTemplate}`}
                target="_blank"
                rel="noopener noreferrer"
                className={['text-2xs', presentation.row2]
                  .filter(Boolean)
                  .join(' ')}
              >
                Open in new tab
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
            <iframe
              key={activeTemplate}
              src={`/api/v1/email/preview?template=${activeTemplate}`}
              className={presentation.detail4}
              title={`Preview — ${activeTemplate}`}
            />
          </>
        ) : (
          <div className={presentation.row3}>
            <div className={presentation.detail5}>
              <div className={presentation.row4}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={presentation.ink2}
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <p className="muted text-sm">Select a template to preview</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
