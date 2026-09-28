'use client';
import presentation from './contract-row-presentation.module.css';

import Link, { useLinkStatus } from 'next/link';
import type { ReactNode } from 'react';

function ContractRowStatus() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span role="status" aria-live="polite" className="contract-row-loading">
      <span aria-hidden="true" className="contract-row-loading__spinner" />
      Loading contract…
    </span>
  );
}

export default function ContractRow({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={`/contracts/${id}`}
      aria-label={`Open contract: ${title}`}
      className={presentation.link1}
    >
      {children}
      <ContractRowStatus />
    </Link>
  );
}
