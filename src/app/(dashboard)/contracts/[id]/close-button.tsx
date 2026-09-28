'use client';
import presentation from './close-button-presentation.module.css';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { closeContract } from './actions';
import { AlertTriangle, X } from 'lucide-react';

export default function CloseContractButton({
  contractId,
  approvalPendingFrom,
  reasonMin = 10,
}: {
  contractId: string;
  approvalPendingFrom?: string | null;
  /** Shortest reason accepted for closing without approval; the server re-checks. */
  reasonMin?: number;
}) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const router = useRouter();

  // With the gate pending, the only close on offer is refusing the work, so
  // the dialog asks for the reason instead of offering a plain close.
  const withoutApproval = Boolean(approvalPendingFrom);
  const reasonReady = reason.trim().length >= reasonMin;

  const handleClose = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await closeContract(
        contractId,
        withoutApproval ? { withoutApproval: true, reason: reason.trim() } : {},
      );
      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }
      router.refresh();
    } catch (err) {
      console.error('Failed to close contract:', err);
      setError(
        'The contract could not be closed. Check your connection and try again.',
      );
      setLoading(false);
      return;
    }
    setLoading(false);
    setConfirming(false);
  };

  return (
    <>
      <button
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
        className="btn btn--danger"
      >
        <X size={13} />
        Close Contract
      </button>

      {confirming && (
        <div className={presentation.row1}>
          <div
            className={presentation.detail1}
            onClick={() => !loading && setConfirming(false)}
          />
          <div className={presentation.detail2}>
            <div className={presentation.detail3}>
              <div className={presentation.row2}>
                <AlertTriangle size={24} className={presentation.ink1} />
              </div>
              <div
                className={['h2', presentation.section1]
                  .filter(Boolean)
                  .join(' ')}
              >
                {withoutApproval ? 'Close without approving' : 'Close Contract'}
              </div>
              <div
                className={['muted text-sm', presentation.detail4]
                  .filter(Boolean)
                  .join(' ')}
              >
                {withoutApproval
                  ? `This contract is waiting for ${approvalPendingFrom} to approve completion (holloway approve-completion ${contractId}). Closing it now records the work as NOT accepted (closed-unapproved). This cannot be undone.`
                  : 'This will permanently close the contract. No more messages can be exchanged. This action cannot be undone.'}
              </div>
              {withoutApproval && (
                <label
                  className={['col', presentation.label1]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <span className="text-sm">
                    Why is the work not being accepted?
                  </span>
                  <textarea
                    className="cp-textarea"
                    rows={3}
                    autoFocus
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    disabled={loading}
                    placeholder={`At least ${reasonMin} characters. Every participant sees this.`}
                  />
                </label>
              )}
              {error && (
                <div role="alert" className="text-sm contract-action-error">
                  {error}
                </div>
              )}
            </div>
            <div
              className={['row gap-3', presentation.detail5]
                .filter(Boolean)
                .join(' ')}
            >
              <button
                onClick={() => setConfirming(false)}
                disabled={loading}
                className="btn"
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  opacity: loading ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleClose}
                disabled={loading || (withoutApproval && !reasonReady)}
                className="btn btn--danger"
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  opacity:
                    loading || (withoutApproval && !reasonReady) ? 0.5 : 1,
                }}
              >
                {loading
                  ? 'Closing…'
                  : withoutApproval
                    ? 'Close without approving'
                    : 'Confirm Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
