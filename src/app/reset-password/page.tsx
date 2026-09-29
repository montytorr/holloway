'use client';
import { PendingLabel } from '@/components/loading';
import presentation from './page-presentation.module.css';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from '@/components/app-link';
import { HollowayMark } from '@/components/holloway-mark';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [linkInvalid, setLinkInvalid] = useState(false);
  const [token, setToken] = useState('');
  const router = useRouter();

  useEffect(() => {
    const value = new URL(window.location.href).searchParams.get('token') || '';
    const timer = window.setTimeout(() => {
      setToken(value);
      setReady(Boolean(value));
      setLinkInvalid(!value);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 12) {
      setError('Password must be at least 12 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || 'Password update failed.');
        setLoading(false);
        return;
      }
      router.push('/login?message=password-reset');
    } catch {
      setError('Connection error — please try again');
      setLoading(false);
    }
  };

  return (
    <div className={presentation.row1}>
      <div className={presentation.detail1}>
        <div className={presentation.section1}>
          <div className={presentation.section2}>
            <HollowayMark size={44} />
          </div>
          <h1 className="h1 text-xl">New Password</h1>
          <div
            className={['upper', presentation.detail2]
              .filter(Boolean)
              .join(' ')}
          >
            Choose a strong password
          </div>
        </div>

        <div
          className={['card', presentation.detail3].filter(Boolean).join(' ')}
        >
          {linkInvalid ? (
            <div className={presentation.detail4}>
              <div
                className={['pill pill--rose text-sm', presentation.detail5]
                  .filter(Boolean)
                  .join(' ')}
              >
                This password reset link is invalid or has expired. Please
                request a new one.
              </div>
            </div>
          ) : !ready ? (
            <div className={presentation.detail4}>
              <span className="dot dot--amber pulse" />
              <div
                className={['dim text-xs', presentation.detail6]
                  .filter(Boolean)
                  .join(' ')}
              >
                Verifying reset link…
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={presentation.stack1}>
              <div className="col gap-1">
                <label htmlFor="password" className="upper text-2xs">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={12}
                  autoComplete="new-password"
                  autoFocus
                  className={['cp-input text-sm', presentation.field1]
                    .filter(Boolean)
                    .join(' ')}
                  placeholder="Minimum 12 characters"
                />
              </div>

              <div className="col gap-1">
                <label htmlFor="confirmPassword" className="upper text-2xs">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={12}
                  autoComplete="new-password"
                  className={['cp-input text-sm', presentation.field1]
                    .filter(Boolean)
                    .join(' ')}
                  placeholder="Re-enter your password"
                />
              </div>

              {error && (
                <div
                  className={['pill pill--rose text-sm', presentation.detail5]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn--primary text-sm"
                style={{
                  width: '100%',
                  height: 42,
                  justifyContent: 'center',
                  opacity: loading ? 0.5 : 1,
                }}
              >
                <PendingLabel pending={loading} label="Updating…">Update Password</PendingLabel>
              </button>
            </form>
          )}
        </div>

        <p className={presentation.copy1}>
          <Link
            href="/login"
            className={['text-2xs', presentation.link1]
              .filter(Boolean)
              .join(' ')}
          >
            ← Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
