'use client';
import presentation from './contract-row-presentation.module.css';

import Link, { useLinkStatus } from '@/components/app-link';
import type { ReactNode } from 'react';
import { LoadingIndicator } from '@/components/loading';

function ContractRowStatus() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return <LoadingIndicator label="Opening contract" compact className="contract-row-loading" />;
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
