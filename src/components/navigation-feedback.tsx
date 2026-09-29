"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Let local search timers stop before a different route replaces their page. */
function announceNavigation(href: string) {
  window.dispatchEvent(new CustomEvent('holloway:navigation-start', { detail: href }));
}

interface NavigationFeedbackValue {
  pending: boolean;
  begin: (href?: string) => void;
  refresh: () => void;
  navigate: (
    href: string,
    options?: { replace?: boolean; scroll?: boolean },
  ) => void;
}
const NavigationFeedbackContext = createContext<NavigationFeedbackValue | null>(
  null,
);

export function NavigationFeedbackProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const current = `${pathname}${search ? `?${search}` : ""}`;
  const router = useRouter();
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [transitionPending, startTransition] = useTransition();
  if (startedAt !== null && startedAt !== current) setStartedAt(null);
  const linkPending = startedAt === current;
  const pending = transitionPending || linkPending;

  useEffect(() => {
    if (!linkPending) return;
    const clear = window.setTimeout(() => setStartedAt(null), 15000);
    return () => window.clearTimeout(clear);
  }, [linkPending]);

  const begin = useCallback((href?: string) => {
    if (href) announceNavigation(href);
    setStartedAt(current);
  }, [current]);
  const navigate = useCallback(
    (href: string, options?: { replace?: boolean; scroll?: boolean }) => {
      if (href === window.location.pathname + window.location.search) return;
      announceNavigation(href);
      startTransition(() => {
        if (options?.replace)
          router.replace(href, { scroll: options.scroll ?? true });
        else router.push(href, { scroll: options?.scroll ?? true });
      });
    },
    [router],
  );
  const refresh = useCallback(() => { startTransition(() => router.refresh()); }, [router]);
  const value = useMemo(
    () => ({ pending, begin, navigate, refresh }),
    [pending, begin, navigate, refresh],
  );

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      )
        return;
      const destination = new URL(anchor.href, window.location.href);
      if (
        destination.origin === window.location.origin &&
        destination.pathname + destination.search !== current
      )
        begin(destination.href);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [begin, current]);

  return (
    <NavigationFeedbackContext.Provider value={value}>
      {children}
      {pending && (
        <div
          className="navigation-progress"
          role="status"
          aria-live="polite"
          aria-label="Loading page"
        />
      )}
    </NavigationFeedbackContext.Provider>
  );
}
export function useNavigationFeedback() {
  const value = useContext(NavigationFeedbackContext);
  if (!value) throw new Error("Navigation feedback is not available");
  return value;
}

export const useOptionalNavigationFeedback = () =>
  useContext(NavigationFeedbackContext);
