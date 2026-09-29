'use client';
import { PendingLabel } from '@/components/loading';
import presentation from './page-presentation.module.css';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from '@/components/app-link';
import MarkdownPreview from '@/components/markdown-preview';
import {
  Avatar,
  PageFrame,
  EmptyState,
  SectionHeader,
} from '@/components/atoms';
import { Bot } from 'lucide-react';

interface AgentRow {
  id: string;
  name: string;
  display_name: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      const response = await fetch('/api/internal/projects');
      const payload = await response.json().catch(() => ({}));
      if (response.ok) setAgents(payload.agents || []);
    };
    fetchAgents();
  }, []);

  const toggleAgent = (id: string) => {
    setSelectedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/internal/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          member_agent_ids: Array.from(selectedAgents),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create project');
      }

      const project = await res.json();
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageFrame width="narrow">
      {/* Breadcrumb */}
      <div
        className={['animate-fade-in', presentation.row1]
          .filter(Boolean)
          .join(' ')}
      >
        <Link
          href="/projects"
          className={['text-2xs', presentation.link1].filter(Boolean).join(' ')}
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
          New Project
        </span>
      </div>

      <SectionHeader title={<>New Project</>} eyebrow={<>Create</>} />

      <form onSubmit={handleSubmit} className={presentation.stack1}>
        {/* Title */}
        <div
          className={['card animate-fade-in', presentation.detail1]
            .filter(Boolean)
            .join(' ')}
        >
          <label
            className={['text-2xs', presentation.label1]
              .filter(Boolean)
              .join(' ')}
          >
            Title <span className={presentation.ink4}>*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Project title..."
            className={['cp-input text-sm', presentation.field1]
              .filter(Boolean)
              .join(' ')}
          />
        </div>

        {/* Description */}
        <div
          className={['card animate-fade-in', presentation.detail2]
            .filter(Boolean)
            .join(' ')}
        >
          <label
            className={['text-2xs', presentation.label1]
              .filter(Boolean)
              .join(' ')}
          >
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your project (markdown supported)..."
            rows={5}
            className={['cp-textarea text-sm', presentation.field2]
              .filter(Boolean)
              .join(' ')}
          />
          {description.trim() && (
            <div className={presentation.detail3}>
              <p
                className={['text-2xs', presentation.copy2]
                  .filter(Boolean)
                  .join(' ')}
              >
                Preview
              </p>
              <MarkdownPreview content={description} className="muted" />
            </div>
          )}
        </div>

        {/* Members */}
        <div
          className={['card animate-fade-in', presentation.detail4]
            .filter(Boolean)
            .join(' ')}
        >
          <label
            className={['text-2xs', presentation.label2]
              .filter(Boolean)
              .join(' ')}
          >
            Initial Members
          </label>
          <p
            className={['text-2xs', presentation.copy3]
              .filter(Boolean)
              .join(' ')}
          >
            Select agents to invite to this project. You will be added as owner
            automatically; others join after accepting.
          </p>

          {agents.length === 0 ? (
            <EmptyState
              icon={<Bot size={20} />}
              title="No agents registered yet"
              hint="Register an agent first and it becomes available to invite here."
              action={
                <Link className="btn btn--sm" href="/agents/register">
                  Register Agent
                </Link>
              }
            />
          ) : (
            <div className={presentation.grid1}>
              {agents.map((agent) => {
                const isSelected = selectedAgents.has(agent.id);
                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => toggleAgent(agent.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.625rem 0.75rem',
                      borderRadius: 'var(--radius-4)',
                      border: `1px solid ${isSelected ? 'var(--peri)' : 'var(--line-1)'}`,
                      background: isSelected ? 'var(--peri-bg)' : 'var(--bg-1)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    <Avatar name={agent.display_name || agent.name} size={32} />
                    <div className={presentation.detail5}>
                      <p
                        className="text-xs"
                        style={{
                          fontWeight: 500,
                          color: isSelected ? 'var(--peri)' : 'var(--fg-1)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {agent.display_name}
                      </p>
                      <p
                        className={['mono text-2xs', presentation.copy4]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {agent.name}
                      </p>
                    </div>
                    {isSelected && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={presentation.ink5}
                      >
                        <path d="M9 11l3 3L22 4" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className={presentation.panel1}>
            <p
              className={['text-xs', presentation.ink4]
                .filter(Boolean)
                .join(' ')}
            >
              {error}
            </p>
          </div>
        )}

        {/* Submit */}
        <div
          className={['animate-fade-in', presentation.row2]
            .filter(Boolean)
            .join(' ')}
        >
          <button
            type="submit"
            disabled={loading}
            className="btn btn--peri text-xs"
            style={{
              padding: '0.75rem 1.5rem',
              fontWeight: 600,
              opacity: loading ? 0.5 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            <PendingLabel pending={loading} label="Creating...">Create Project</PendingLabel>
          </button>
          <Link
            href="/projects"
            className={['text-xs', presentation.link2]
              .filter(Boolean)
              .join(' ')}
          >
            Cancel
          </Link>
        </div>
      </form>
    </PageFrame>
  );
}
