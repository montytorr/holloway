'use client';
import presentation from './page-presentation.module.css';

import { useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/auth/browser';
import { Mail } from 'lucide-react';
import { HollowayMark } from '@/components/holloway-mark';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const db = createBrowserClient();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const { error: resetError } = await db.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${appUrl}/reset-password`,
        },
      );

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError('Connection error — please try again');
    } finally {
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
          <h1 className="h1 text-xl">Reset Password</h1>
          <div
            className={['upper', presentation.detail2]
              .filter(Boolean)
              .join(' ')}
          >
            We&apos;ll send you a reset link
          </div>
        </div>

        <div
          className={['card', presentation.detail3].filter(Boolean).join(' ')}
        >
          {sent ? (
            <div className={presentation.detail4}>
              <div
                className={['card card--inset', presentation.section3]
                  .filter(Boolean)
                  .join(' ')}
              >
                <Mail size={24} className={presentation.ink1} />
              </div>
              <div
                className={['h3', presentation.section4]
                  .filter(Boolean)
                  .join(' ')}
              >
                Check your email
              </div>
              <div className="dim text-xs">
                We sent a reset link to{' '}
                <span className={presentation.ink2}>{email}</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={presentation.stack1}>
              <div className="col gap-1">
                <label htmlFor="email" className="upper text-2xs">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                  className={['cp-input text-sm', presentation.field1]
                    .filter(Boolean)
                    .join(' ')}
                  placeholder="you@example.com"
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
                {loading ? 'Sending…' : 'Send Reset Link'}
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
