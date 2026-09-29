import presentation from './page-presentation.module.css';
import type { Metadata } from 'next';
import { readFileSync } from 'fs';
import { join } from 'path';
import { formatDate } from '@/lib/format-date';
import { FileText } from 'lucide-react';
import Link from '@/components/app-link';
import { PageFrame, EmptyState, SectionHeader } from '@/components/atoms';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Changelog — Holloway',
  description: 'All notable changes to the Holloway platform',
};

interface ChangelogEntry {
  version: string;
  date: string;
  sections: { type: string; items: string[] }[];
}

function parseChangelog(): ChangelogEntry[] {
  let content: string;
  try {
    content = readFileSync(join(process.cwd(), 'CHANGELOG.md'), 'utf-8');
  } catch {
    return [];
  }
  const entries: ChangelogEntry[] = [];
  let current: ChangelogEntry | null = null;
  let currentSection: { type: string; items: string[] } | null = null;

  for (const line of content.split('\n')) {
    // Match version header: ## [1.0.0] - 2026-03-28
    const versionMatch = line.match(/^## \[(.+?)\] - (\d{4}-\d{2}-\d{2})/);
    if (versionMatch) {
      if (current) {
        if (currentSection) current.sections.push(currentSection);
        entries.push(current);
      }
      current = {
        version: versionMatch[1],
        date: versionMatch[2],
        sections: [],
      };
      currentSection = null;
      continue;
    }

    // Match section header: ### Added / ### Changed / ### Fixed
    const sectionMatch = line.match(/^### (.+)/);
    if (sectionMatch && current) {
      if (currentSection) current.sections.push(currentSection);
      currentSection = { type: sectionMatch[1], items: [] };
      continue;
    }

    // Match bullet item: - Some change
    const itemMatch = line.match(/^- (.+)/);
    if (itemMatch && currentSection) {
      currentSection.items.push(itemMatch[1]);
    }
  }

  // Push last entry
  if (current) {
    if (currentSection) current.sections.push(currentSection);
    entries.push(current);
  }

  return entries;
}

function getSectionTone(type: string): {
  pill: string;
  dotColor: string;
  bg: string;
  border: string;
} {
  switch (type.toLowerCase()) {
    case 'added':
      return {
        pill: 'pill--mint',
        dotColor: 'var(--mint)',
        bg: 'var(--mint-bg)',
        border: 'var(--mint-line)',
      };
    case 'changed':
      return {
        pill: 'pill--peri',
        dotColor: 'var(--peri)',
        bg: 'var(--peri-bg)',
        border: 'var(--peri-line)',
      };
    case 'fixed':
      return {
        pill: 'pill--amber',
        dotColor: 'var(--amber)',
        bg: 'var(--amber-bg)',
        border: 'var(--amber-line)',
      };
    default:
      return {
        pill: 'pill--ghost',
        dotColor: 'var(--fg-3)',
        bg: 'var(--bg-2)',
        border: 'var(--line-1)',
      };
  }
}

const PAGE_SIZE = 20;

export default async function ChangelogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const entries = parseChangelog();
  const params = await searchParams;
  const parsedPage = Number(params.page);
  const pageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const page =
    Number.isInteger(parsedPage) && parsedPage > 0
      ? Math.min(parsedPage, pageCount)
      : 1;
  const visibleEntries = entries.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  return (
    <PageFrame width="prose">
      {/* Header */}
      <SectionHeader
        title={<>Changelog</>}
        eyebrow={<>Documentation</>}
        sub={
          <>
            <p
              className={['muted text-sm', presentation.copy2]
                .filter(Boolean)
                .join(' ')}
            >
              All notable changes to Holloway. Format follows{' '}
              <a
                href="https://keepachangelog.com/en/1.1.0/"
                target="_blank"
                rel="noopener noreferrer"
                className={presentation.link1}
              >
                Keep a Changelog
              </a>
              .
            </p>
          </>
        }
      />

      {/* Version timeline */}
      <div className={presentation.detail1}>
        {/* Timeline line */}
        <div className={presentation.detail2} />

        <div className="col gap-3">
          {entries.length === 0 && (
            <div
              className={['card', presentation.detail3]
                .filter(Boolean)
                .join(' ')}
            >
              <EmptyState
                icon={<FileText size={20} />}
                title="No versions tracked yet"
                hint="Releases appear here as they are added to CHANGELOG.md."
              />
            </div>
          )}
          {visibleEntries.map((entry, idx) => (
            <div key={entry.version} className={presentation.detail1}>
              {/* Timeline dot */}
              <div className={presentation.detail4} />

              <div
                className={['card', presentation.detail5]
                  .filter(Boolean)
                  .join(' ')}
              >
                {/* Version header */}
                <div
                  className={['row gap-3', presentation.section3]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <span
                    className={['text-sm', presentation.panel1]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    v{entry.version}
                  </span>
                  <span className="dim num text-xs">
                    {formatDate(entry.date)}
                  </span>
                  {page === 1 && idx === 0 && (
                    <span className="pill pill--mint">Latest</span>
                  )}
                </div>

                {/* Sections */}
                <div className="col gap-3">
                  {entry.sections.map((section, sIdx) => {
                    const tone = getSectionTone(section.type);
                    return (
                      <div key={sIdx}>
                        <div
                          className={['row gap-2', presentation.section2]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          <div
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: tone.dotColor,
                              flexShrink: 0,
                            }}
                          />
                          <span className={`pill ${tone.pill}`}>
                            {section.type}
                          </span>
                        </div>
                        <div
                          style={{
                            borderRadius: 'var(--radius-2)',
                            background: tone.bg,
                            border: `1px solid ${tone.border}`,
                            padding: '12px 16px',
                          }}
                        >
                          <ul className="col gap-2">
                            {section.items.map((item, iIdx) => (
                              <li
                                key={iIdx}
                                className={['row text-sm', presentation.ink2]
                                  .filter(Boolean)
                                  .join(' ')}
                              >
                                <span
                                  style={{
                                    width: 4,
                                    height: 4,
                                    borderRadius: '50%',
                                    background: tone.dotColor,
                                    opacity: 0.6,
                                    flexShrink: 0,
                                    marginTop: 7,
                                  }}
                                />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <nav
        aria-label="Changelog pages"
        className={['row gap-3', presentation.detail6]
          .filter(Boolean)
          .join(' ')}
      >
        {page > 1 && (
          <Link
            className="btn"
            href={page === 2 ? '/changelog' : `/changelog?page=${page - 1}`}
          >
            Newer releases
          </Link>
        )}
        <span className="dim text-xs">
          Page {page} of {pageCount}
        </span>
        {page < pageCount && (
          <Link className="btn" href={`/changelog?page=${page + 1}`}>
            Older releases
          </Link>
        )}
      </nav>
      <div className={presentation.detail7}>
        <p className="dim text-2xs">
          {entries.length} versions tracked · Started{' '}
          {entries.length > 0
            ? formatDate(entries[entries.length - 1].date)
            : 'N/A'}
        </p>
      </div>
    </PageFrame>
  );
}
