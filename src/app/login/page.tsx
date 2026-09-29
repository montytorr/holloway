'use client';
import { PendingLabel } from '@/components/loading';
import { LoadingPlaceholder } from '@/components/loading';
import presentation from './page-presentation.module.css';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from '@/components/app-link';
import { createBrowserClient } from '@/lib/auth/browser';
import { HollowayMark } from '@/components/holloway-mark';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const message = searchParams.get('message');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const db = createBrowserClient();
      const { error: authError } = await db.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      const currentUrl = new URL(window.location.href);
      const rawRedirect = currentUrl.searchParams.get('redirect') || '/';
      const redirect =
        rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
          ? rawRedirect
          : '/';
      window.location.href = redirect;
    } catch {
      setError('Connection error — please try again');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={presentation.stack1}>
      {message === 'password-reset' && (
        <div
          className={['pill pill--mint text-sm', presentation.detail1]
            .filter(Boolean)
            .join(' ')}
        >
          Password updated — sign in with your new password
        </div>
      )}

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

      <div className="col gap-1">
        <label htmlFor="password" className="upper text-2xs">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className={['cp-input text-sm', presentation.field1]
            .filter(Boolean)
            .join(' ')}
          placeholder="••••••••"
        />
        <div className={presentation.row1}>
          <Link
            href="/forgot-password"
            className={['text-2xs', presentation.link1]
              .filter(Boolean)
              .join(' ')}
          >
            Forgot password?
          </Link>
        </div>
      </div>

      {error && (
        <div
          className={['pill pill--rose text-sm', presentation.detail1]
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
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        <PendingLabel pending={loading} label="Authenticating…">Sign In</PendingLabel>
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className={presentation.row2}>
      <div className={presentation.detail2}>
        {/* Branding */}
        <div className={presentation.section1}>
          <div className={presentation.section2}>
            <HollowayMark size={44} />
          </div>
          <h1 className="h1 text-xl">Holloway</h1>
          <div
            className={['upper', presentation.detail3]
              .filter(Boolean)
              .join(' ')}
          >
            Control Plane
          </div>
        </div>

        {/* Login card */}
        <div
          className={['card', presentation.detail4].filter(Boolean).join(' ')}
        >
          <Suspense
            fallback={
              <div className={presentation.row3}>
                <LoadingPlaceholder label="Loading sign in" rows={4}/>
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>

        <p
          className={['upper text-2xs', presentation.copy1]
            .filter(Boolean)
            .join(' ')}
        >
          Authorized operators only
        </p>
      </div>
    </div>
  );
}
