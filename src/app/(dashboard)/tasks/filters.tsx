'use client';
import presentation from './filters-presentation.module.css';

import { useQueryFilters } from '@/components/use-query-filters';

/**
 * Every option here must be a status a task can actually hold. `Blocked` was
 * offered and could never match: `tasks.status` has never permitted it. The two
 * that do exist, `backlog` and `in-review`, were the ones missing.
 *
 * A task IS shown as blocked elsewhere, but that is derived from its
 * dependencies rather than stored on the row, so it is not a filter value.
 */
const statuses = [
  { value: 'open', label: 'Open' },
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'To do' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'in-review', label: 'In review' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'all', label: 'Any status' },
];

const scopes = [
  { value: 'all', label: 'Everyone' },
  { value: 'me', label: 'Assigned to me' },
];

interface TaskFiltersProps {
  projects: Array<{ id: string; title: string }>;
}

export default function TaskFilters({ projects }: TaskFiltersProps) {
  const { params, update: updateParams, pending } = useQueryFilters('/tasks', { status: 'open', assignee: 'all', project: 'any' });
  const update = (key: string, value: string) => updateParams({ [key]: value });

  return (
    <div className="list-toolbar" aria-busy={pending}>
      <select
        className={['cp-select text-sm', presentation.field1]
          .filter(Boolean)
          .join(' ')}
        aria-label="Filter by status"
        value={params.get('status') || 'open'}
        onChange={(e) => update('status', e.target.value)}
      >
        {statuses.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <select
        className={['cp-select text-sm', presentation.field2]
          .filter(Boolean)
          .join(' ')}
        aria-label="Filter by assignee"
        value={params.get('assignee') || 'all'}
        onChange={(e) => update('assignee', e.target.value)}
      >
        {scopes.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <select
        className={['cp-select text-sm', presentation.field3]
          .filter(Boolean)
          .join(' ')}
        aria-label="Filter by project"
        value={params.get('project') || 'any'}
        onChange={(e) => update('project', e.target.value)}
      >
        <option value="any">All projects</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>
    </div>
  );
}
