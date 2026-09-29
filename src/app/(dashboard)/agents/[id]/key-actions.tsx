'use client';
import { PendingLabel } from '@/components/loading';
import presentation from './key-actions-presentation.module.css';

import { useState } from 'react';
import { rotateAgentKey, type RotateKeyResult } from './actions';

export default function KeyActions({ agentId }: { agentId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RotateKeyResult | null>(null);
  const [copied, setCopied] = useState<'keyId' | 'secret' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRotate() {
    setLoading(true);
    setError(null);
    const res = await rotateAgentKey(agentId);
    if (res.success && res.approvalRequired) {
      setConfirming(false);
      alert(
        `Key rotation requires approval from another admin. Request submitted (ID: ${res.approvalId}). Check the Approvals page.`,
      );
    } else if (res.success) {
      setResult(res);
      setConfirming(false);
    } else {
      setError(res.error || 'Failed to rotate key');
    }
    setLoading(false);
  }

  function copyToClipboard(text: string, field: 'keyId' | 'secret') {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        className={['btn btn--ghost btn--sm', presentation.action1]
          .filter(Boolean)
          .join(' ')}
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
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        Rotate Key
      </button>

      {/* New credentials card (shown after rotation) */}
      {result && (
        <div className={presentation.stack1}>
          <div className={presentation.row1}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={presentation.ink1}
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div>
              <p
                className={['text-xs', presentation.copy1]
                  .filter(Boolean)
                  .join(' ')}
              >
                Key rotated successfully
              </p>
              <p
                className={['text-2xs', presentation.copy2]
                  .filter(Boolean)
                  .join(' ')}
              >
                Save the new credentials now. The signing secret is shown only
                once. Old keys expire in 1 hour.
              </p>
            </div>
          </div>

          <div>
            <p
              className={['upper dim text-2xs', presentation.copy3]
                .filter(Boolean)
                .join(' ')}
            >
              Key ID
            </p>
            <div className={presentation.row2}>
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
            <div className={presentation.row2}>
              <code
                className={['mono text-sm', presentation.code2]
                  .filter(Boolean)
                  .join(' ')}
              >
                {result.signingSecret}
              </code>
              <button
                onClick={() => copyToClipboard(result.signingSecret!, 'secret')}
                className="btn btn--ghost btn--sm"
              >
                {copied === 'secret' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirming && (
        <div className={presentation.row3}>
          <div
            className={presentation.detail1}
            onClick={() => !loading && setConfirming(false)}
          />
          <div
            className={['card', presentation.detail2].filter(Boolean).join(' ')}
          >
            <div className={presentation.detail3}>
              <div className={presentation.row4}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={presentation.ink2}
                >
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              </div>
              <h3
                className={['h3', presentation.section1]
                  .filter(Boolean)
                  .join(' ')}
              >
                Rotate Service Key
              </h3>
              <p
                className={['muted text-sm', presentation.copy4]
                  .filter(Boolean)
                  .join(' ')}
              >
                This will generate a new signing secret and expire the current
                key in 1 hour. The agent will need to update its credentials.
              </p>
              {error && (
                <div
                  className={['text-xs', presentation.panel1]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {error}
                </div>
              )}
            </div>
            <div className={presentation.row5}>
              <button
                onClick={() => setConfirming(false)}
                disabled={loading}
                className={['btn btn--ghost', presentation.action2]
                  .filter(Boolean)
                  .join(' ')}
              >
                Cancel
              </button>
              <button
                onClick={handleRotate}
                disabled={loading}
                className={['btn btn--ghost', presentation.action3]
                  .filter(Boolean)
                  .join(' ')}
              >
                <PendingLabel pending={loading} label="Rotating…">Confirm Rotate</PendingLabel>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
