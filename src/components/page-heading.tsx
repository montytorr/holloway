'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export interface PageHeading {
  id: string;
  path: string;
  title?: ReactNode;
  heading?: ReactNode;
  eyebrow?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
}

const HeadingContext = createContext<PageHeading | null>(null);
const PublishContext = createContext<
  ((heading: PageHeading | null, id: string) => void) | null
>(null);

/** The persistent shell owns one header; streamed pages supply its title and actions. */
export function PageHeadingProvider({ children }: { children: ReactNode }) {
  const [heading, setHeading] = useState<PageHeading | null>(null);
  const publish = useCallback((next: PageHeading | null, id: string) => {
    setHeading((current) => next ?? (current?.id === id ? null : current));
  }, []);
  const value = useMemo(() => heading, [heading]);
  return (
    <PublishContext.Provider value={publish}>
      <HeadingContext.Provider value={value}>
        {children}
      </HeadingContext.Provider>
    </PublishContext.Provider>
  );
}

export const usePageHeading = () => useContext(HeadingContext);
export const usePublishPageHeading = () => useContext(PublishContext);
