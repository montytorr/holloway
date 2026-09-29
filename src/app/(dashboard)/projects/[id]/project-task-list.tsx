'use client';

import { useState } from 'react';
import type { TaskStatus } from '@/lib/types';
import TaskList, { type TaskListRow } from '@/components/task-list';
import QuickTaskForm from './quick-task-form';
import styles from './project-detail.module.css';

/* Kept so page.tsx's dependency-summary mapping still typechecks; the list
   itself only needs the fields TaskListRow names. */
export interface TaskRow extends TaskListRow {
  assignee_agent_id?: string | null;
  blocked_at?: string | null;
  blocker_follow_up_at?: string | null;
  blocker_followed_through_at?: string | null;
  blocker_escalated_at?: string | null;
  blocker_resolution_action?: string | null;
  blocker_resolution_owner?: string | null;
  blocker_resolution_due_at?: string | null;
  blocker_resolution_status?: string | null;
  dependencySummary?: {
    blockedBy?: Array<{ id: string; title: string; status: string }>;
    blocks?: Array<{ id: string; title: string; status: string }>;
    sequenceAfter?: Array<{ id: string; title: string; status: string }>;
    sequenceBefore?: Array<{ id: string; title: string; status: string }>;
    related?: Array<{ id: string; title: string; status: string }>;
  };
}

export default function ProjectTaskList({
  tasks,
  projectId,
  sprintId,
  members = [],
  canCreate,
}: {
  tasks: TaskRow[];
  projectId: string;
  sprintId?: string;
  members?: Array<{
    id: string;
    role: string;
    agent: { id: string; name: string; display_name: string } | null;
  }>;
  canCreate: boolean;
}) {
  const [creating, setCreating] = useState(false);

  /* "Blocked" on a row means blocked by work that is not finished. The board
     card carried a whole blocker panel for this, which is what made it tall. */
  const rows: TaskListRow[] = tasks.map((task) => ({
    ...task,
    blockedBy: (task.dependencySummary?.blockedBy || []).filter(
      (dep) => dep.status !== 'done' && dep.status !== 'cancelled',
    ).length,
  }));

  return (
    <>
      <div className={styles.workHead}>
        <div>
          <h2>Tasks</h2>
          <p>
            {tasks.length} task{tasks.length === 1 ? '' : 's'} across the
            workflow
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            className="btn btn--sm"
            aria-expanded={creating}
            onClick={() => setCreating(!creating)}
          >
            {creating ? 'Cancel' : '+ New task'}
          </button>
        )}
      </div>
      {canCreate && creating && (
        <div className={styles.newTask}>
          <QuickTaskForm
            projectId={projectId}
            status="backlog"
            sprintId={sprintId}
            members={members}
            defaultOpen
            onClose={() => setCreating(false)}
          />
        </div>
      )}
      <TaskList
        tasks={rows}
        projectId={projectId}
        emptyHint="No tasks in this project yet."
        renderComposer={
          canCreate
            ? (status: TaskStatus, close: () => void) => (
                <QuickTaskForm
                  projectId={projectId}
                  status={status}
                  sprintId={sprintId}
                  members={members}
                  defaultOpen
                  onClose={close}
                />
              )
            : undefined
        }
      />
    </>
  );
}
