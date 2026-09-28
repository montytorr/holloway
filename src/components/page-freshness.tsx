'use client';

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from 'react';

export interface PageFreshness {
  path: string;
  status: 'live' | 'stale' | 'stuck';
  ageSeconds: number;
  streaming: boolean;
  intervalMs: number;
}

const FreshnessContext = createContext<PageFreshness | null>(null);
const PublisherContext = createContext<Dispatch<
  SetStateAction<PageFreshness | null>
> | null>(null);

export function PageFreshnessProvider({ children }: { children: ReactNode }) {
  const [freshness, publish] = useState<PageFreshness | null>(null);
  return (
    <PublisherContext.Provider value={publish}>
      <FreshnessContext.Provider value={freshness}>
        {children}
      </FreshnessContext.Provider>
    </PublisherContext.Provider>
  );
}

export const usePageFreshness = () => useContext(FreshnessContext);
export const usePageFreshnessPublisher = () => useContext(PublisherContext);
