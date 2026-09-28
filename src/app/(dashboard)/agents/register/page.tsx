'use client';
import presentation from './page-presentation.module.css';

import { useState } from 'react';
import Link from 'next/link';
import { registerAgent, type RegisterAgentResult } from './actions';
import { PageFrame, SectionHeader } from '@/components/atoms';

export default function RegisterAgentPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RegisterAgentResult | null>(null);
  const [copied, setCopied] = useState<'keyId' | 'secret' | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const res = await registerAgent(formData);

      if (res.success) {
        setResult(res);
      } else {
        setError(res.error || 'Registration failed');
      }
    } catch {
      setError('An unexpected error occurred during registration');
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(text: string, field: 'keyId' | 'secret') {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  }

  if (result) {
    return (
      <PageFrame width="narrow">
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

        <div className={presentation.detail1}>
          <div
            className={['card', presentation.detail2].filter(Boolean).join(' ')}
          >
            <div className={presentation.detail3}>
              <div className={presentation.row1}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={presentation.ink1}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <h2
                className={['h2', presentation.section1]
                  .filter(Boolean)
                  .join(' ')}
              >
                Agent Registered
              </h2>
              <p
                className={['muted text-sm', presentation.copy1]
                  .filter(Boolean)
                  .join(' ')}
              >
                Save these credentials now. The signing secret will{' '}
                <span className={presentation.ink2}>not be shown again</span>.
              </p>

              <div className={presentation.stack1}>
                <div className={presentation.row2}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={presentation.ink3}
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <p
                    className={['text-2xs', presentation.copy2]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    Copy both values below. The signing secret is displayed only
                    once and cannot be recovered.
                  </p>
                </div>

                <div>
                  <p
                    className={['upper dim text-2xs', presentation.copy3]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    Key ID
                  </p>
                  <div className={presentation.row3}>
                    <code
                      className={['mono text-sm', presentation.code1]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {result.keyId}
                    </code>
                    <button
                      onClick={() => copyToClipboard(result.keyId!, 'keyId')}
                      className="btn btn--ghost btn--sm"
                    >
                      {copied === 'keyId' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div>
                  <p
                    className={['upper dim text-2xs', presentation.copy3]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    Signing Secret
                  </p>
                  <div className={presentation.row3}>
                    <code
                      className={['mono text-sm', presentation.code2]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {result.signingSecret}
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(result.signingSecret!, 'secret')
                      }
                      className="btn btn--ghost btn--sm"
                    >
                      {copied === 'secret' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              <Link
                href="/agents"
                className={['btn btn--ghost', presentation.link2]
                  .filter(Boolean)
                  .join(' ')}
              >
                Back to Agents
              </Link>
            </div>
          </div>
        </div>
      </PageFrame>
    );
  }

  return (
    <PageFrame width="narrow">
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
        title={<>Register Agent</>}
        eyebrow={<>Registry</>}
        sub={
          <>
            <p
              className={['muted text-sm', presentation.copy5]
                .filter(Boolean)
                .join(' ')}
            >
              Create a new agent identity and service key
            </p>
          </>
        }
      />

      <div className={presentation.detail4}>
        <div
          className={['card', presentation.detail2].filter(Boolean).join(' ')}
        >
          <form onSubmit={handleSubmit} className={presentation.stack2}>
            {error && (
              <div
                className={['text-xs', presentation.panel1]
                  .filter(Boolean)
                  .join(' ')}
              >
                {error}
              </div>
            )}

            <div>
              <label
                className={['upper dim text-2xs', presentation.label1]
                  .filter(Boolean)
                  .join(' ')}
              >
                Name <span className={presentation.ink4}>*</span>
              </label>
              <input
                name="name"
                required
                pattern="^[a-z0-9][a-z0-9_-]*$"
                placeholder="my-agent"
                className={['cp-input mono', presentation.field1]
                  .filter(Boolean)
                  .join(' ')}
              />
              <p
                className={['dim text-2xs', presentation.copy6]
                  .filter(Boolean)
                  .join(' ')}
              >
                Slug format: lowercase, numbers, hyphens, underscores
              </p>
            </div>

            <div>
              <label
                className={['upper dim text-2xs', presentation.label1]
                  .filter(Boolean)
                  .join(' ')}
              >
                Display Name <span className={presentation.ink4}>*</span>
              </label>
              <input
                name="display_name"
                required
                placeholder="My Agent"
                className={['cp-input', presentation.field1]
                  .filter(Boolean)
                  .join(' ')}
              />
            </div>

            <div>
              <label
                className={['upper dim text-2xs', presentation.label1]
                  .filter(Boolean)
                  .join(' ')}
              >
                Owner <span className={presentation.ink4}>*</span>
              </label>
              <input
                name="owner"
                required
                placeholder="your-name"
                className={['cp-input', presentation.field1]
                  .filter(Boolean)
                  .join(' ')}
              />
            </div>

            <div>
              <label
                className={['upper dim text-2xs', presentation.label1]
                  .filter(Boolean)
                  .join(' ')}
              >
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="What does this agent do?"
                className={['cp-textarea', presentation.field1]
                  .filter(Boolean)
                  .join(' ')}
              />
            </div>

            <div>
              <label
                className={['upper dim text-2xs', presentation.label1]
                  .filter(Boolean)
                  .join(' ')}
              >
                Capabilities
              </label>
              <input
                name="capabilities"
                placeholder="trading, research, messaging"
                className={['cp-input', presentation.field1]
                  .filter(Boolean)
                  .join(' ')}
              />
              <p
                className={['dim text-2xs', presentation.copy6]
                  .filter(Boolean)
                  .join(' ')}
              >
                Comma-separated list
              </p>
            </div>

            <div>
              <label
                className={['upper dim text-2xs', presentation.label1]
                  .filter(Boolean)
                  .join(' ')}
              >
                Protocols
              </label>
              <input
                name="protocols"
                placeholder="a2a-comms-v1, webhooks"
                className={['cp-input', presentation.field1]
                  .filter(Boolean)
                  .join(' ')}
              />
              <p
                className={['dim text-2xs', presentation.copy6]
                  .filter(Boolean)
                  .join(' ')}
              >
                Comma-separated list
              </p>
            </div>

            <div>
              <label
                className={['upper dim text-2xs', presentation.label1]
                  .filter(Boolean)
                  .join(' ')}
              >
                Max Active Contracts
              </label>
              <input
                name="max_concurrent_contracts"
                type="number"
                defaultValue={5}
                min={1}
                max={100}
                className={['cp-input mono', presentation.field1]
                  .filter(Boolean)
                  .join(' ')}
              />
            </div>

            <div>
              <label
                className={['upper dim text-2xs', presentation.label1]
                  .filter(Boolean)
                  .join(' ')}
              >
                Trust Tier
              </label>
              <select
                name="trust_tier"
                defaultValue="external"
                className={['cp-select', presentation.field1]
                  .filter(Boolean)
                  .join(' ')}
              >
                <option value="internal">
                  Internal — full project + handoff access
                </option>
                <option value="partner">
                  Partner — can observe and broker, but not take handoffs
                </option>
                <option value="external">
                  External — registry only until explicitly trusted
                </option>
              </select>
              <p
                className={['dim text-2xs', presentation.copy6]
                  .filter(Boolean)
                  .join(' ')}
              >
                This is the base trust rail. Fine-grained trust-policy
                thresholds can be adjusted later from the agent detail page.
              </p>
            </div>

            <div>
              <label
                className={['upper dim text-2xs', presentation.label1]
                  .filter(Boolean)
                  .join(' ')}
              >
                Trust Notes
              </label>
              <textarea
                name="trust_notes"
                rows={2}
                placeholder="Why this agent has this tier, who vetted it, or what restrictions apply"
                className={['cp-textarea', presentation.field1]
                  .filter(Boolean)
                  .join(' ')}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={['btn btn--primary', presentation.field1]
                .filter(Boolean)
                .join(' ')}
            >
              {loading ? (
                <span className={presentation.row4}>
                  <span className={presentation.detail5} />
                  Registering…
                </span>
              ) : (
                'Register Agent'
              )}
            </button>
          </form>
        </div>
      </div>
    </PageFrame>
  );
}
