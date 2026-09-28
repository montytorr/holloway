'use client';
import presentation from './page-presentation.module.css';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { registerWebhook, getAgents } from './actions';

import { CANONICAL_WEBHOOK_EVENTS } from '@/lib/webhook-events';
import Link from 'next/link';
import { Bot } from 'lucide-react';
import { EmptyState, PageFrame } from '@/components/atoms';

const ALL_EVENTS = CANONICAL_WEBHOOK_EVENTS;

export default function RegisterWebhookPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<
    { id: string; name: string; display_name: string }[]
  >([]);
  const [agentId, setAgentId] = useState('');
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [events, setEvents] = useState<string[]>([...ALL_EVENTS]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getAgents().then(setAgents);
  }, []);

  function toggleEvent(ev: string) {
    setEvents((prev) =>
      prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev],
    );
  }

  function generateSecret() {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(
      '',
    );
    setSecret(`whsec_${hex}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!agentId || !url || !secret || events.length === 0) {
      setError(
        'All fields are required and at least one event must be selected.',
      );
      return;
    }
    setLoading(true);
    try {
      const result = await registerWebhook({ agentId, url, secret, events });
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/webhooks'), 1500);
      }
    } catch {
      setError('Failed to register webhook');
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className={presentation.row1}>
        <div
          className={['animate-fade-in', presentation.detail1]
            .filter(Boolean)
            .join(' ')}
        >
          <div className={presentation.section1}>
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={presentation.ink1}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2
            className={['text-lg', presentation.section2]
              .filter(Boolean)
              .join(' ')}
          >
            Webhook Registered
          </h2>
          <p
            className={['text-sm', presentation.copy1]
              .filter(Boolean)
              .join(' ')}
          >
            Redirecting to webhooks…
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageFrame width="narrow">
      {/* Back */}
      <a
        href="/webhooks"
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
        Back to Webhooks
      </a>

      <div
        className={['animate-fade-in', presentation.section3]
          .filter(Boolean)
          .join(' ')}
      >
        <p
          className={['upper text-2xs', presentation.copy2]
            .filter(Boolean)
            .join(' ')}
        >
          Register
        </p>
        <h1
          className={['text-2xl', presentation.ink2].filter(Boolean).join(' ')}
        >
          New Webhook
        </h1>
        <p
          className={['text-sm', presentation.copy3].filter(Boolean).join(' ')}
        >
          Register a push notification endpoint for an agent
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className={['animate-fade-in', presentation.stack1]
          .filter(Boolean)
          .join(' ')}
      >
        {error && (
          <div
            className={['text-sm', presentation.panel1]
              .filter(Boolean)
              .join(' ')}
          >
            {error}
          </div>
        )}

        {/* Agent */}
        <div
          className={['card', presentation.detail2].filter(Boolean).join(' ')}
        >
          <label
            className={['text-2xs', presentation.label1]
              .filter(Boolean)
              .join(' ')}
          >
            Agent
          </label>
          {agents.length === 0 ? (
            <EmptyState
              icon={<Bot size={20} />}
              title="No agents to deliver for"
              hint="A webhook delivers on behalf of an agent. Register one first and it becomes selectable here."
              action={
                <Link className="btn btn--sm" href="/agents/register">
                  Register Agent
                </Link>
              }
            />
          ) : (
            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className={['cp-select', presentation.field1]
                .filter(Boolean)
                .join(' ')}
            >
              <option value="">Select an agent…</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.display_name} ({a.name})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* URL */}
        <div
          className={['card', presentation.detail2].filter(Boolean).join(' ')}
        >
          <label
            className={['text-2xs', presentation.label1]
              .filter(Boolean)
              .join(' ')}
          >
            Webhook URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-server.com/a2a-webhook"
            className={['cp-input mono', presentation.field1]
              .filter(Boolean)
              .join(' ')}
          />
        </div>

        {/* Secret */}
        <div
          className={['card', presentation.detail2].filter(Boolean).join(' ')}
        >
          <label
            className={['text-2xs', presentation.label1]
              .filter(Boolean)
              .join(' ')}
          >
            Signing Secret
          </label>
          <div className={presentation.row2}>
            <input
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="whsec_..."
              className={['cp-input mono', presentation.field2]
                .filter(Boolean)
                .join(' ')}
            />
            <button
              type="button"
              onClick={generateSecret}
              className={['btn btn--peri text-2xs', presentation.action1]
                .filter(Boolean)
                .join(' ')}
            >
              Generate
            </button>
          </div>
          <p
            className={['text-2xs', presentation.copy4]
              .filter(Boolean)
              .join(' ')}
          >
            Used to sign webhook payloads (HMAC-SHA256). Store securely — shown
            here once.
          </p>
        </div>

        {/* Events */}
        <div
          className={['card', presentation.detail2].filter(Boolean).join(' ')}
        >
          <label
            className={['text-2xs', presentation.label2]
              .filter(Boolean)
              .join(' ')}
          >
            Events
          </label>
          <div className={presentation.row3}>
            {ALL_EVENTS.map((ev) => (
              <button
                key={ev}
                type="button"
                onClick={() => toggleEvent(ev)}
                className="text-2xs"
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: '0.5rem',

                  fontWeight: 600,
                  border: `1px solid ${events.includes(ev) ? 'var(--peri)' : 'var(--line-1)'}`,
                  background: events.includes(ev)
                    ? 'var(--peri-bg)'
                    : 'var(--bg-1)',
                  color: events.includes(ev) ? 'var(--peri)' : 'var(--fg-3)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {events.includes(ev) && '✓ '}
                {ev}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn btn--peri text-sm"
          style={{
            width: '100%',
            padding: '0.875rem 1.5rem',

            fontWeight: 700,
            opacity: loading ? 0.5 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? (
            <span className={presentation.row4}>
              <span className={presentation.detail3} />
              Registering…
            </span>
          ) : (
            'Register Webhook'
          )}
        </button>
      </form>
    </PageFrame>
  );
}
