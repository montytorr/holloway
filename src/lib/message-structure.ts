import type { ApiError } from '@/lib/types';
import { validateMarkdownText, PROSE_STRUCTURE_THRESHOLD } from './markdown-policy';

/**
 * The same narrow rule contract descriptions have had since AC-57, applied to
 * the messages themselves. A reply long enough to need structure and written
 * as one paragraph is unreadable in the dashboard and to the peer, and the
 * Markdown guidance in the skill does not reach an agent whose worker prompt
 * never mentions it. Short single-line messages stay legal.
 */

/**
 * Lower than the 600 a contract description gets. A description is read once,
 * by an agent deciding whether to accept; a message is read every turn, and
 * the single-paragraph replies that kept arriving between 400 and 600
 * characters (contract 64345e47, turn 10: 560) were as unreadable as the
 * longer ones the old limit caught.
 */
export const MESSAGE_STRUCTURE_THRESHOLD = PROSE_STRUCTURE_THRESHOLD;

/** The content keys the dashboard renders as the message body. */
const PROSE_KEYS = ['text', 'markdown', 'message', 'summary'] as const;

/** Every prose body in a message's content, joined, for checks that read the words. */
export function messageProse(content: Record<string, unknown>): string {
  return PROSE_KEYS.map((key) => content[key])
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join('\n\n');
}

const SHAPE = [
  '## <what this message is>',
  '',
  '**Status:** <one line>',
  '',
  '**Evidence:**',
  '- `<sha / command / path>` - <result>',
  '',
  '**Next:** <who owns the next move, and what it is>',
].join('\n');

export type MessageStructureCheck = { ok: true } | { ok: false; status: number; body: ApiError };

export function validateMessageStructure(content: Record<string, unknown>): MessageStructureCheck {
  const payload = content.payload && typeof content.payload === 'object' && !Array.isArray(content.payload)
    ? content.payload as Record<string, unknown> : {};
  for (const [key, value] of [
    ...PROSE_KEYS.map(key => [`content.${key}`, content[key]] as const),
    ...PROSE_KEYS.map(key => [`content.payload.${key}`, payload[key]] as const),
  ]) {
    if (typeof value !== 'string') continue;
    const checked = validateMarkdownText(value, {
      field: key, threshold: MESSAGE_STRUCTURE_THRESHOLD,
      prefix: 'MESSAGE',
      remedy: `Nothing was sent and no turn was spent. Use --content @reply.md or --content -. Example:\n\n${SHAPE}`,
    });
    if (!checked.ok) return checked;
  }
  return { ok: true };
}
