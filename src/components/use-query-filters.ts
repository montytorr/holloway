"use client";

import {
  useCallback,
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import { useSearchParams } from "next/navigation";
import { useNavigationFeedback } from "./navigation-feedback";

/** Compose rapid changes against the latest intent, keeping URL/Back semantics. */
export function useQueryFilters(
  path: string,
  defaults: Record<string, string> = {},
  resetPage = false,
) {
  const committed = useSearchParams().toString();
  const [optimistic, setOptimistic] = useOptimistic(
    committed,
    (_: string, next: string) => next,
  );
  const intended = useRef<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { navigate } = useNavigationFeedback();
  const defaultSignature = JSON.stringify(defaults);
  useEffect(() => {
    if (!pending) intended.current = null;
  }, [committed, pending]);
  const update = useCallback(
    (updates: Record<string, string>, options?: { replace?: boolean }) => {
      const params = new URLSearchParams(
        intended.current ?? window.location.search,
      );
      const values = JSON.parse(defaultSignature) as Record<string, string>;
      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === values[key]) params.delete(key);
        else params.set(key, value);
      }
      if (resetPage) params.delete("page");
      const query = params.toString();
      if (
        query ===
        (intended.current ??
          new URLSearchParams(window.location.search).toString())
      )
        return;
      intended.current = query;
      startTransition(() => {
        setOptimistic(query);
        navigate(`${path}${query ? `?${query}` : ""}`, {
          replace: options?.replace,
          scroll: false,
        });
      });
    },
    [path, defaultSignature, resetPage, navigate, setOptimistic],
  );
  return { params: new URLSearchParams(optimistic), update, pending };
}

/** Search is immediate locally, debounced on the server, and follows browser Back. */
export function useDebouncedFilter(
  value: string,
  submit: (value: string) => void,
) {
  const [draft, setDraft] = useState(value);
  const [committed, setCommitted] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  if (committed !== value) {
    setCommitted(value);
    setDraft(value);
  }
  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value]);
  useEffect(() => {
    const clear = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    };
    const onNavigate = (event: Event) => {
      const href = (event as CustomEvent<string>).detail;
      if (new URL(href, window.location.href).pathname !== window.location.pathname) clear();
    };
    window.addEventListener('holloway:navigation-start', onNavigate);
    window.addEventListener('popstate', clear);
    return () => {
      clear();
      window.removeEventListener('holloway:navigation-start', onNavigate);
      window.removeEventListener('popstate', clear);
    };
  }, []);
  const change = (next: string) => {
    setDraft(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      submit(next);
    }, 250);
  };
  return [draft, change] as const;
}
