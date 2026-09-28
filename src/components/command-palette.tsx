'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { Search, ArrowUpRight } from 'lucide-react';
import {
  ADMIN_NAVIGATION,
  DASHBOARD_NAVIGATION,
} from '@/lib/dashboard-navigation';
import { useNavigationFeedback } from './navigation-feedback';
import { useModalFocus } from './use-modal-focus';
import styles from './command-palette.module.css';

interface CommandPaletteProps {
  open: boolean;
  onClose: (open: boolean) => void;
  isAdmin?: boolean;
}

export const CommandPalette = ({
  open,
  onClose,
  isAdmin = false,
}: CommandPaletteProps) => {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { begin } = useNavigationFeedback();
  useModalFocus(open, dialogRef);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onClose(!open);
      } else if (open && event.key === 'Escape') onClose(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  const destinations = DASHBOARD_NAVIGATION.flatMap((group) =>
    group.items.map((item) => ({ ...item, group: group.label })),
  );
  if (isAdmin)
    destinations.push(
      ...ADMIN_NAVIGATION.map((item) => ({ ...item, group: 'Administration' })),
    );
  const results = destinations.filter((item) =>
    `${item.label} ${item.group}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const navigate = (href: string) => {
    if (href !== pathname) begin();
    router.push(href);
    onClose(false);
    setQuery('');
    setActive(0);
  };
  useEffect(() => {
    if (open)
      dialogRef.current
        ?.querySelector(`#command-result-${active}`)
        ?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);
  if (!open) return null;
  return createPortal(
    <div className={styles.scrim} onClick={() => onClose(false)}>
      <div
        className={styles.dialog}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="command-title" className="sr-only">
          Navigate Holloway
        </h2>
        <div className={styles.search}>
          <Search size={20} aria-hidden />
          <input
            role="combobox"
            aria-label="Search destinations"
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls="command-results"
            aria-activedescendant={
              results[active] ? `command-result-${active}` : undefined
            }
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            placeholder="Where do you want to go?"
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                setActive((index) =>
                  Math.max(
                    0,
                    Math.min(
                      results.length - 1,
                      index + (event.key === 'ArrowDown' ? 1 : -1),
                    ),
                  ),
                );
              } else if (event.key === 'Enter' && results[active]) {
                event.preventDefault();
                navigate(results[active].href);
              }
            }}
          />
          <button
            type="button"
            className="kbd"
            onClick={() => onClose(false)}
            aria-label="Close search"
          >
            Esc
          </button>
        </div>
        <div
          id="command-results"
          role="listbox"
          aria-label="Destinations"
          className={styles.results}
        >
          {results.map((item, index) => (
            <div
              role="option"
              aria-selected={index === active}
              key={item.href}
              id={`command-result-${index}`}
            >
              <button
                type="button"
                tabIndex={-1}
                className={styles.result}
                data-active={index === active}
                onMouseEnter={() => setActive(index)}
                onClick={() => navigate(item.href)}
              >
                <span>
                  {item.label}
                  <small>{item.group}</small>
                </span>
                <ArrowUpRight size={16} aria-hidden />
              </button>
            </div>
          ))}
          {results.length === 0 && (
            <p className={styles.empty}>No destinations match “{query}”.</p>
          )}
        </div>
        <div className={styles.footer}>
          <span>↑ ↓ to move</span>
          <span>Enter to open</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>,
    document.body,
  );
};
