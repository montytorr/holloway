import type { ApiError } from './types';

export const PROSE_STRUCTURE_THRESHOLD = 400;
export const DESCRIPTION_STRUCTURE_THRESHOLD = 600;

export function hasEscapedBreakOutsideCode(content: string): boolean {
  let index = 0;
  while (index < content.length) {
    const fence = content[index] === '~' && (index === 0 || content[index - 1] === '\n')
      ? content.slice(index).match(/^~{3,}[^\n]*\n/) : null;
    if (fence) {
      const delimiter = fence[0].match(/^~+/)![0];
      const closing = content.indexOf(`\n${delimiter}`, index + fence[0].length - 1);
      if (closing === -1) return false;
      index = closing + delimiter.length + 1;
      continue;
    }
    if (content[index] === '`') {
      let end = index;
      while (content[end] === '`') end += 1;
      const delimiter = content.slice(index, end);
      const closing = content.indexOf(delimiter, end);
      if (closing === -1) return false;
      index = closing + delimiter.length;
      continue;
    }
    if (content.startsWith('\\n', index) || content.startsWith('\\r', index)) return true;
    index += 1;
  }
  return false;
}

/** Markdown paragraphs are valid structure; arbitrary single line wraps aren't. */
export function hasMarkdownStructure(content: string): boolean {
  return content.includes('\n') && (
    /\n[ \t]*\n/.test(content)
    || /^(?:[ \t]{0,3})(?:#{1,6}[ \t]+\S|[-*+][ \t]+\S|\d+[.)][ \t]+\S|>[ \t]?\S|`{3,}|~{3,}|\|.*\|)/m.test(content)
    || /\*\*[^*\n]+\*\*|__[^_\n]+__/.test(content)
  );
}

export type MarkdownCheck =
  | { ok: true; value: string | null }
  | { ok: false; status: number; body: ApiError };

export function validateMarkdownText(input: unknown, {
  field, threshold = PROSE_STRUCTURE_THRESHOLD, prefix = 'MARKDOWN', remedy,
}: { field: string; threshold?: number; prefix?: string; remedy?: string }): MarkdownCheck {
  if (input === undefined || input === null) return { ok: true, value: null };
  const refuse = (suffix: string, error: string): MarkdownCheck => ({
    ok: false, status: 400, body: { code: `${prefix}_${suffix}`, error },
  });
  const guidance = remedy || 'Write Markdown to a UTF-8 file and pass @file.md, or use - for stdin. Use headings, bullets, labelled sections or blank lines between paragraphs.';
  if (typeof input !== 'string') return refuse('INVALID', `${field} must be a string containing Markdown. ${guidance}`);
  const value = input.trim();
  if (!value) return { ok: true, value: null };
  if (hasEscapedBreakOutsideCode(value)) {
    return refuse('ESCAPED_BREAKS', `${field} contains a literal \\n or \\r instead of a real line break. Shell single-quoted strings do not expand escapes. ${guidance}`);
  }
  if (value.length > threshold && !hasMarkdownStructure(value)) {
    return refuse('UNSTRUCTURED', `${field} is ${value.length} characters without readable Markdown structure. Over ${threshold} characters, use a heading, bullets, labelled sections or blank lines between paragraphs; arbitrary line wraps are insufficient. ${guidance}`);
  }
  return { ok: true, value };
}

/** Check only explicitly named prose; titles, identifiers and JSON data stay data. */
export function validateAgentMarkdownFields(input: unknown, fields: readonly string[]): MarkdownCheck {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, status: 400, body: { error: 'Request body must be an object.', code: 'INVALID_BODY' } };
  }
  for (const field of fields) {
    let value: unknown = input;
    for (const key of field.split('.')) {
      value = value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined;
    }
    const check = validateMarkdownText(value, {
      field, threshold: /(?:^|\.)(description|goal)$/.test(field) ? DESCRIPTION_STRUCTURE_THRESHOLD : PROSE_STRUCTURE_THRESHOLD,
    });
    if (!check.ok) return check;
  }
  return { ok: true, value: null };
}
