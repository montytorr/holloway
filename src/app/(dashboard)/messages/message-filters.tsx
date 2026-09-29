'use client';
import presentation from './message-filters-presentation.module.css';

import { useCallback } from 'react';
import { useQueryFilters, useDebouncedFilter } from '@/components/use-query-filters';

const messageTypes = [
  { value: 'all', label: 'All Types' },
  { value: 'message', label: 'Message' },
  { value: 'request', label: 'Request' },
  { value: 'response', label: 'Response' },
  { value: 'update', label: 'Update' },
  { value: 'status', label: 'Status' },
];

interface MessageFiltersProps {
  agents: Array<{ id: string; name: string; display_name: string }>;
}

export default function MessageFilters({ agents }: MessageFiltersProps) {
  const { params, update, pending } = useQueryFilters('/messages', { agent: 'all', type: 'all' }, true);
  const agent = params.get('agent') || 'all';
  const type = params.get('type') || 'all';
  const search = useCallback((value: string) => update({ search: value }, { replace: true }), [update]);
  const [localSearch, debouncedSearch] = useDebouncedFilter(params.get('search') || '', search);
  const updateFilter = (key: string, value: string) => update({ [key]: value });
  const hasFilters = agent !== 'all' || type !== 'all' || localSearch !== '';
  const clearAll = () => { debouncedSearch(''); update({ agent: 'all', type: 'all', search: '' }); };

  return (
    <div aria-busy={pending} className={['row', presentation.section1].filter(Boolean).join(' ')}>
      {/* Agent filter */}
      <select
        aria-label="Filter messages by agent"
        value={agent}
        onChange={(e) => updateFilter('agent', e.target.value)}
        className={['cp-select', presentation.field1].filter(Boolean).join(' ')}
      >
        <option value="all">All Agents</option>
        {agents.map((a) => (
          <option key={a.id} value={a.id}>
            {a.display_name || a.name}
          </option>
        ))}
      </select>

      {/* Message type */}
      <select
        aria-label="Filter messages by type"
        value={type}
        onChange={(e) => updateFilter('type', e.target.value)}
        className={['cp-select', presentation.field2].filter(Boolean).join(' ')}
      >
        {messageTypes.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      {/* Content search */}
      <input
        type="text"
        aria-label="Search message content"
        placeholder="Search content..."
        value={localSearch}
        onChange={(e) => {
          debouncedSearch(e.target.value);
        }}
        className={['cp-input', presentation.field3].filter(Boolean).join(' ')}
      />

      {/* Clear button */}
      {hasFilters && (
        <button onClick={clearAll} className="btn btn--ghost btn--sm">
          Clear filters
        </button>
      )}
    </div>
  );
}
