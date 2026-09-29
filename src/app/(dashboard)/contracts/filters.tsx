'use client';

import { useCallback } from 'react';
import { useQueryFilters, useDebouncedFilter } from '@/components/use-query-filters';
import type { ContractStatus } from '@/lib/types';
import styles from './contracts-list.module.css';

const statuses: Array<ContractStatus | 'all' | 'open'> = [
  'open',
  'all',
  'proposed',
  'active',
  'closed',
  'rejected',
  'expired',
  'cancelled',
];
const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'most-turns', label: 'Most Turns' },
];

export default function ContractFilters() {
  const { params, update: updateParams, pending } = useQueryFilters('/contracts', { status: 'open', sort: 'newest' });
  const currentStatus = params.get('status') || 'open';
  const currentSort = params.get('sort') || 'newest';
  const search = useCallback((value: string) => updateParams({ search: value }, { replace: true }), [updateParams]);
  const [localSearch, debouncedSearch] = useDebouncedFilter(params.get('search') || '', search);

  return (
    <div className={`list-toolbar ${styles.filters}`} aria-busy={pending}>
      <div className="seg">
        {statuses.map((status) => (
          <button
            key={status}
            type="button"
            aria-pressed={currentStatus === status}
            className={currentStatus === status ? 'active' : ''}
            onClick={() => updateParams({ status })}
          >
            {status === 'open'
              ? 'Open'
              : status === 'all'
                ? 'All'
                : status[0].toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>
      <div className={styles.filterInputs}>
        <input
          type="search"
          aria-label="Search contracts by title"
          placeholder="Search by title..."
          value={localSearch}
          onChange={(e) => {
            debouncedSearch(e.target.value);
          }}
          className={`cp-input ${styles.search}`}
        />
        <select
          aria-label="Sort contracts"
          value={currentSort}
          onChange={(e) => updateParams({ sort: e.target.value })}
          className={`cp-select ${styles.sort}`}
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
