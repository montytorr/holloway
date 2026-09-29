'use client';

import {
  useEffect,
  useState,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { MessageSquare, ArrowRight } from 'lucide-react';
import styles from './contract-workspace.module.css';

type Tab = 'overview' | 'conversation' | 'activity' | 'artifacts';
const sections: Tab[] = ['overview', 'conversation', 'activity', 'artifacts'];
const labels = {
  overview: 'Overview',
  conversation: 'Conversation',
  activity: 'Activity',
  artifacts: 'Artifacts',
};
const subscribe = (listener: () => void) => {
  window.addEventListener('hashchange', listener);
  return () => window.removeEventListener('hashchange', listener);
};
const select = (tab: Tab) => {
  window.history.replaceState(
    window.history.state,
    '',
    `${window.location.pathname}${window.location.search}#${tab}`,
  );
  window.dispatchEvent(new HashChangeEvent('hashchange'));
};

export function ContractWorkspace({
  contractId,
  overview,
  conversation,
  context,
  operator,
  stateSummary,
  outcome,
  artifacts,
  activity,
  messageCount,
  artifactCount,
  hasOpenQuestions,
  hasOperatorContent = true,
}: {
  contractId: string;
  overview: ReactNode;
  conversation: ReactNode;
  context: ReactNode;
  operator: ReactNode;
  stateSummary: ReactNode;
  outcome: ReactNode;
  artifacts: ReactNode;
  activity: ReactNode;
  messageCount: number;
  artifactCount: number;
  hasOpenQuestions: boolean;
  hasOperatorContent?: boolean;
}) {
  // The server's initial overview is also the hydration snapshot. Reading the
  // hash afterwards preserves direct links without mismatched server markup.
  const workspaceRef = useRef<HTMLDivElement>(null);
  const tabId = (section: Tab) => `contract-${contractId}-tab-${section}`;
  const panelId = (section: Tab) => `contract-${contractId}-panel-${section}`;
  const [notesExpanded, setNotesExpanded] = useState(hasOpenQuestions);
  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash.slice(1),
    () => 'overview',
  );
  const tab: Tab = sections.includes(hash as Tab)
    ? (hash as Tab)
    : hash.startsWith('message-')
      ? 'conversation'
      : 'overview';
  const revealOperator =
    hasOpenQuestions ||
    hash === 'operator-channel' ||
    hash.startsWith('question-');
  useEffect(() => {
    if (
      !hash.startsWith('message-') &&
      !hash.startsWith('question-') &&
      hash !== 'operator-channel'
    )
      return;
    const frame = requestAnimationFrame(() =>
      workspaceRef.current
        ?.querySelector(`#${CSS.escape(hash)}`)
        ?.scrollIntoView({ block: 'start' }),
    );
    return () => cancelAnimationFrame(frame);
  }, [hash]);
  const counts = {
    overview: undefined,
    conversation: messageCount,
    activity: undefined,
    artifacts: artifactCount,
  };
  const panels = { overview, conversation, artifacts, activity };
  return (
    <div className={styles.workspace} ref={workspaceRef}>
      {outcome}
      {stateSummary}
      <details
        className={styles.notes}
        id={`contract-${contractId}-operator`}
        hidden={!hasOperatorContent && !revealOperator && !notesExpanded}
        open={revealOperator || notesExpanded}
        onToggle={(event) => setNotesExpanded(event.currentTarget.open)}
      >
        <summary hidden={revealOperator || !hasOperatorContent}>
          Operator notes & questions <span>+</span>
        </summary>
        {operator}
      </details>
      <div className={styles.toolbar}>
        <div
          className={styles.tabs}
          role="tablist"
          aria-label="Contract sections"
        >
          {sections.map((section, index) => (
            <button
              type="button"
              key={section}
              id={tabId(section)}
              role="tab"
              aria-selected={section === tab}
              aria-controls={panelId(section)}
              tabIndex={section === tab ? 0 : -1}
              className={section === tab ? styles.active : undefined}
              onClick={() => select(section)}
              onKeyDown={(event) => {
                let next: Tab | undefined;
                if (event.key === 'ArrowRight')
                  next = sections[(index + 1) % sections.length];
                if (event.key === 'ArrowLeft')
                  next =
                    sections[(index + sections.length - 1) % sections.length];
                if (event.key === 'Home') next = sections[0];
                if (event.key === 'End') next = sections[sections.length - 1];
                if (next) {
                  event.preventDefault();
                  select(next);
                  workspaceRef.current
                    ?.querySelector<HTMLButtonElement>(
                      `#${CSS.escape(tabId(next))}`,
                    )
                    ?.focus();
                }
              }}
            >
              {labels[section]}
              {counts[section] !== undefined && <span>{counts[section]}</span>}
            </button>
          ))}
        </div>
        {!hasOperatorContent && !hasOpenQuestions && (
          <button
            type="button"
            className={`btn btn--ghost btn--sm ${styles.operatorToggle}`}
            aria-expanded={revealOperator || notesExpanded}
            aria-controls={`contract-${contractId}-operator`}
            onClick={() => {
              if (revealOperator) {
                select(tab);
                setNotesExpanded(false);
              } else {
                setNotesExpanded(!notesExpanded);
              }
            }}
          >
            Operator notes & questions{' '}
            <span aria-hidden>{notesExpanded ? '−' : '+'}</span>
          </button>
        )}
      </div>
      <div className={styles.layout}>
        <div className={styles.work}>
          {sections.map((section) => (
            <div
              key={section}
              id={panelId(section)}
              role="tabpanel"
              aria-labelledby={tabId(section)}
              hidden={section !== tab}
              className={styles.panel}
            >
              {panels[section]}
            </div>
          ))}
          {tab === 'overview' && (
            <button
              className={styles.threadEntry}
              type="button"
              onClick={() => select('conversation')}
            >
              <MessageSquare size={18} aria-hidden />
              <div>
                <strong>
                  {messageCount
                    ? `${messageCount} agent message${messageCount === 1 ? '' : 's'}`
                    : 'No agent messages yet'}
                </strong>
                <span>
                  {messageCount
                    ? 'Inspect the exchanges and their turn context.'
                    : 'The conversation starts when the opening agent sends its first message.'}
                </span>
              </div>
              <ArrowRight size={18} aria-hidden />
            </button>
          )}
        </div>
        <aside className={styles.context} aria-label="Contract context">
          {context}
        </aside>
      </div>
    </div>
  );
}
