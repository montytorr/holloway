'use client';

import {
  useState,
  useTransition,
  type ReactNode,
  type CSSProperties,
} from 'react';

/** Keep a failed server action beside its draft, and prevent duplicate writes. */
export function ActionForm({
  action,
  children,
  className,
  style,
}: {
  action: (data: FormData) => Promise<void>;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <form
      className={className}
      style={style}
      aria-busy={pending}
      onSubmit={(event) => {
        event.preventDefault();
        if (pending) return;
        const data = new FormData(event.currentTarget);
        setError(null);
        // Capture before disabling fields. Handling submission here also keeps
        // uncontrolled drafts intact when the server rejects the action.
        startTransition(async () => {
          try {
            await action(data);
            window.dispatchEvent(new Event('holloway:attention-changed'));
          } catch (failure) {
            console.error('Operator action failed:', failure);
            setError(
              'Could not save. Your draft is still here. Please try again.',
            );
          }
        });
      }}
    >
      <fieldset disabled={pending} className="action-form-fields">
        {children}
      </fieldset>
      {pending && (
        <p role="status" className="text-xs dim">
          Saving…
        </p>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </form>
  );
}
