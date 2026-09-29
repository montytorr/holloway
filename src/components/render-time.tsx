'use client';

import { createContext, useContext, type ReactNode } from 'react';

const RenderTime = createContext<number | null>(null);

/** Share the server's timestamp so clock boundaries cannot regenerate hydrated pages. */
export function RenderTimeProvider({
  now,
  children,
}: {
  now: number;
  children: ReactNode;
}) {
  return <RenderTime.Provider value={now}>{children}</RenderTime.Provider>;
}

export function useRenderTime(): number {
  const now = useContext(RenderTime);
  if (now === null)
    throw new Error('Relative client time requires a server render snapshot');
  return now;
}
