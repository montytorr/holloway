'use client';

import MarkdownPreview from '@/components/markdown-preview';

import { useState } from 'react';
import StatusBadge from '@/components/status-badge';
import { looseStatusTone } from '@/lib/status-tone';

// ── Types ──

type ContentObj = Record<string, unknown>;

// ── Syntax-highlighted JSON ──

function SyntaxJson({ data }: { data: unknown }) {
  const json = JSON.stringify(data, null, 2);
  const parts = json.split(/("(?:[^"\\]|\\.)*")/g);

  return (
    <pre
      className={['mono text-xs', 'message-card-code1']
        .filter(Boolean)
        .join(' ')}
    >
      {parts.map((part, i) => {
        if (part.startsWith('"') && part.endsWith('"')) {
          const next = parts[i + 1];
          if (next && next.trimStart().startsWith(':')) {
            return (
              <span key={i} className={'message-card-ink1'}>
                {part}
              </span>
            );
          }
          return (
            <span key={i} className={'message-card-ink2'}>
              {part}
            </span>
          );
        }
        return (
          <span key={i}>
            {part
              .split(
                /(\b(?:true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b)/g,
              )
              .map((sub, j) => {
                if (/^(true|false)$/.test(sub))
                  return (
                    <span key={j} className={'message-card-ink3'}>
                      {sub}
                    </span>
                  );
                if (sub === 'null')
                  return (
                    <span key={j} className={'message-card-ink4'}>
                      {sub}
                    </span>
                  );
                if (/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(sub))
                  return (
                    <span key={j} className={'message-card-ink5'}>
                      {sub}
                    </span>
                  );
                return (
                  <span key={j} className={'message-card-ink6'}>
                    {sub}
                  </span>
                );
              })}
          </span>
        );
      })}
    </pre>
  );
}

// ── Helper: render a string value as rich text ──

function RichText({ text, className }: { text: string; className?: string }) {
  return <MarkdownPreview content={text} className={className} />;
}

// ── Helper: labeled field ──

function Field({
  label,
  children,
  accent,
}: {
  label: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div>
      <p
        className={['upper text-2xs', 'message-card-copy1']
          .filter(Boolean)
          .join(' ')}
      >
        {label}
      </p>
      <div
        className="text-sm"
        style={{ color: accent ? 'var(--peri)' : 'var(--fg-1)' }}
      >
        {children}
      </div>
    </div>
  );
}

// ── Helper: status pill ──

/* The statuses here come out of agent-authored message payloads, so they are
   free text in whatever casing and separator the agent picked — `in_progress`,
   `both_tasks_done`. `looseStatusTone` normalises and resolves them against the
   real status maps, so a payload saying `failed` is the same rose as a run that
   failed. This used to carry its own five-row map whose fallback tone was `fg`,
   interpolated into a `var(--fg)` that does not exist. */
function StatusPill({ status }: { status: string }) {
  return (
    <StatusBadge
      status={status}
      tone={looseStatusTone(status)}
      dot="none"
      size="lg"
    />
  );
}

// ── Helper: render array of tasks/items ──

/** Known task-like keys get special header treatment; everything else falls through to ObjectFields */
const TASK_HEADER_KEYS = new Set([
  'id',
  'title',
  'status',
  'priority',
  'solution',
  'description',
]);

function TaskList({ tasks }: { tasks: Array<Record<string, unknown>> }) {
  return (
    <div className={'message-card-stack1'}>
      {tasks.map((task, i) => {
        const id = typeof task.id === 'string' ? task.id : null;
        const title = typeof task.title === 'string' ? task.title : null;
        const taskStatus = typeof task.status === 'string' ? task.status : null;
        const priority =
          typeof task.priority === 'string' ? task.priority : null;
        const solution =
          typeof task.solution === 'string' ? task.solution : null;
        const description =
          typeof task.description === 'string' ? task.description : null;

        const hasHeader = id || title || taskStatus || priority;

        return (
          <div key={i} className={'message-card-panel1'}>
            {hasHeader && (
              <div className={'message-card-row1'}>
                {id && (
                  <span
                    className={['mono text-2xs', 'message-card-ink4']
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {id.slice(0, 8)}
                  </span>
                )}
                {title && (
                  <span
                    className={['text-xs', 'message-card-ink8']
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {title}
                  </span>
                )}
                {taskStatus && <StatusPill status={taskStatus} />}
                {priority && (
                  <span
                    className={['mono text-2xs', 'message-card-ink6']
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {priority}
                  </span>
                )}
              </div>
            )}
            {solution && <RichText text={solution} />}
            {description && <RichText text={description} />}
            {/* Render all remaining keys not handled above */}
            <ObjectFields obj={task} exclude={TASK_HEADER_KEYS} />
          </div>
        );
      })}
    </div>
  );
}

// ── Helper: key-value list for objects ──

function ObjectFields({
  obj,
  exclude,
}: {
  obj: ContentObj;
  exclude?: Set<string>;
}) {
  const skip = exclude || new Set();
  const entries = Object.entries(obj).filter(
    ([k, v]) => !skip.has(k) && v !== null && v !== undefined && v !== '',
  );
  if (entries.length === 0) return null;

  return (
    <div className={'message-card-stack2'}>
      {entries.map(([key, value]) => {
        // Nested object — render recursively or as structured
        if (
          typeof value === 'object' &&
          value !== null &&
          !Array.isArray(value)
        ) {
          return (
            <div key={key}>
              <p
                className={['upper text-2xs', 'message-card-copy2']
                  .filter(Boolean)
                  .join(' ')}
              >
                {key.replace(/_/g, ' ')}
              </p>
              <div className={'message-card-detail1'}>
                <ObjectFields obj={value as ContentObj} />
              </div>
            </div>
          );
        }
        // Array of objects (tasks, steps, etc.)
        if (
          Array.isArray(value) &&
          value.length > 0 &&
          typeof value[0] === 'object'
        ) {
          return (
            <div key={key}>
              <p
                className={['upper text-2xs', 'message-card-copy2']
                  .filter(Boolean)
                  .join(' ')}
              >
                {key.replace(/_/g, ' ')}
              </p>
              <TaskList tasks={value as Array<Record<string, unknown>>} />
            </div>
          );
        }
        // Array of strings
        if (Array.isArray(value)) {
          return (
            <div key={key}>
              <p
                className={['upper text-2xs', 'message-card-copy1']
                  .filter(Boolean)
                  .join(' ')}
              >
                {key.replace(/_/g, ' ')}
              </p>
              <div className={'message-card-row2'}>
                {value.map((item, i) => (
                  <span
                    key={i}
                    className={['text-2xs', 'message-card-panel2']
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {String(item)}
                  </span>
                ))}
              </div>
            </div>
          );
        }
        // Boolean
        if (typeof value === 'boolean') {
          return (
            <div key={key} className={'message-card-row3'}>
              <span
                className={['upper text-2xs', 'message-card-ink9']
                  .filter(Boolean)
                  .join(' ')}
              >
                {key.replace(/_/g, ' ')}
              </span>
              <span
                className="text-2xs"
                style={{
                  fontWeight: 600,
                  color: value ? 'var(--mint)' : 'var(--rose)',
                }}
              >
                {value ? 'Yes' : 'No'}
              </span>
            </div>
          );
        }
        // String or number
        return (
          <Field key={key} label={key.replace(/_/g, ' ')}>
            <RichText text={String(value)} />
          </Field>
        );
      })}
    </div>
  );
}

// ── Main component ──

/** Keys handled separately in the layout, not in ObjectFields */
const HANDLED_KEYS = new Set([
  'from',
  'type',
  'summary',
  'text',
  'markdown',
  'message',
  'payload',
  'status',
  'project_id',
]);

export default function MessageCard({ content }: { content: unknown }) {
  const [showRaw, setShowRaw] = useState(false);

  const obj =
    typeof content === 'object' && content !== null
      ? (content as ContentObj)
      : null;
  if (!obj) {
    return (
      <div className={'message-card-stack1'}>
<RichText text={String(content)} />
      </div>
    );
  }

  const msgType = typeof obj.type === 'string' ? obj.type : null;
  const sender = typeof obj.from === 'string' ? obj.from : null;
  const status = typeof obj.status === 'string' ? obj.status : null;
  const summary =
    typeof obj.summary === 'string' && obj.summary.length > 0
      ? obj.summary
      : null;
  const projectId = typeof obj.project_id === 'string' ? obj.project_id : null;

  // Markdown, text and message are equivalent narrative body fields.
  const text =
    typeof obj.markdown === 'string' ? obj.markdown
      : typeof obj.text === 'string' ? obj.text
        : typeof obj.message === 'string' ? obj.message : null;

  // Payload object (Clawdius-style messages)
  const payload =
    typeof obj.payload === 'object' && obj.payload !== null
      ? (obj.payload as ContentObj)
      : null;
  const payloadMessage =
    payload && typeof payload.markdown === 'string' ? payload.markdown
      : payload && typeof payload.text === 'string' ? payload.text
        : payload && typeof payload.message === 'string' ? payload.message : null;
  const payloadStatus =
    payload && typeof payload.status === 'string' ? payload.status : null;

  // Remaining fields not handled above
  const handledPayloadKeys = new Set(['text', 'markdown', 'message', 'status']);

  return (
    <div className={'message-card-stack3'}>
      {/* Header: type badge + status + from */}
      <div className={'message-card-row4'}>
        {msgType && (
          <StatusBadge
            domain="message-type"
            status={msgType}
            dot="none"
            size="lg"
          />
        )}
        {(status || payloadStatus) && (
          <StatusPill status={(status || payloadStatus)!} />
        )}
        {sender && (
          <span
            className={['text-2xs', 'message-card-ink4']
              .filter(Boolean)
              .join(' ')}
          >
            from <span className={'message-card-ink10'}>{sender}</span>
          </span>
        )}
        {projectId && (
          <span
            className={['mono text-2xs', 'message-card-ink4']
              .filter(Boolean)
              .join(' ')}
          >
            project {projectId.slice(0, 8)}
          </span>
        )}
      </div>

      {/* Summary */}
      {summary && <RichText text={summary} />}

      {/* Main text body */}
      {text && <RichText text={text} />}

      {/* Payload message (if different from top-level text) */}
      {payloadMessage && !text && <RichText text={payloadMessage} />}

      {/* Payload structured fields */}
      {payload && (
        <div className={'message-card-detail2'}>
          <ObjectFields obj={payload} exclude={handledPayloadKeys} />
        </div>
      )}

      {/* Remaining top-level fields */}
      <ObjectFields obj={obj} exclude={HANDLED_KEYS} />

      {/* Raw JSON toggle */}
      <div className={'message-card-detail3'}>
        <button
          onClick={() => setShowRaw(!showRaw)}
          className={['upper text-2xs', 'message-card-action1']
            .filter(Boolean)
            .join(' ')}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: showRaw ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.2s',
            }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          {showRaw ? 'Hide' : 'Show'} raw JSON
        </button>
        {showRaw && (
          <div className={'message-card-detail4'}>
            <SyntaxJson data={content} />
          </div>
        )}
      </div>
    </div>
  );
}
