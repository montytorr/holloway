'use client';

import Link from 'next/link';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { PageFrame, SectionHeader, EmptyState } from '@/components/atoms';

export default function DashboardError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <PageFrame>
      <SectionHeader
        title="This page couldn’t load"
        sub="The requested data or action is unavailable. Try again to reload this page."
      />
      <div className="card">
        <EmptyState
          tone="error"
          icon={<AlertCircle size={20} />}
          title="Unable to finish loading"
          hint="Your other workspace pages are still available."
          action={
            <>
              <button
                type="button"
                className="btn btn--primary"
                onClick={unstable_retry}
              >
                <RotateCcw size={16} /> Try again
              </button>
              <Link href="/" className="btn">
                Overview
              </Link>
            </>
          }
        />
      </div>
    </PageFrame>
  );
}
