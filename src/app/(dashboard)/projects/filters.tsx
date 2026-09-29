'use client';

import { useQueryFilters } from '@/components/use-query-filters';
import type { ProjectStatus } from '@/lib/types';

const statuses: Array<ProjectStatus | 'all'> = [
  'all',
  'planning',
  'active',
  'completed',
  'archived',
];
const inboxOptions = ['all', 'needs-response', 'history'] as const;

export default function ProjectFilters() {
  const { params, update: updateParams, pending } = useQueryFilters('/projects', { status: 'all', inbox: 'all' });
  const currentStatus = params.get('status') || 'all';
  const currentInbox = params.get('inbox') || 'all';

  return (
    <div className="list-toolbar" aria-busy={pending}>
      <div className="seg">
        {statuses.map((status) => (
          <button
            key={status}
            type="button"
            aria-pressed={currentStatus === status}
            className={currentStatus === status ? 'active' : ''}
            onClick={() => updateParams({ status })}
          >
            {status === 'all'
              ? 'All'
              : status[0].toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>
      <div className="seg">
        {inboxOptions.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={currentInbox === option}
            className={currentInbox === option ? 'active' : ''}
            onClick={() => updateParams({ inbox: option })}
          >
            {option === 'needs-response'
              ? 'Needs Response'
              : option === 'all'
                ? 'Open Workflow'
                : 'History'}
          </button>
        ))}
      </div>
    </div>
  );
}
