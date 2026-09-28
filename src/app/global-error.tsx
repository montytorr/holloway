'use client';

import './globals.css';

export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="system-message">
          <p className="page-eyebrow">Holloway</p>
          <h1 className="h1">Workspace unavailable</h1>
          <p className="page-description">
            The workspace couldn’t load. Retry the request or return to sign in.
          </p>
          <div className="page-header-actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={unstable_retry}
            >
              Try again
            </button>
            <a className="btn" href="/login">
              Sign in
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
