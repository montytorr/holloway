import { validateMarkdownText, DESCRIPTION_STRUCTURE_THRESHOLD } from './markdown-policy';
export { DESCRIPTION_STRUCTURE_THRESHOLD, hasEscapedBreakOutsideCode } from './markdown-policy';
export type { MarkdownCheck as DescriptionCheck } from './markdown-policy';

/** Keep the established contract error codes and CLI remedy on propose/update. */
export function validateContractDescription(input: unknown) {
  return validateMarkdownText(input, {
    field: 'description', threshold: DESCRIPTION_STRUCTURE_THRESHOLD,
    prefix: 'CONTRACT_DESCRIPTION',
    remedy: 'Write a Markdown brief and pass --description @brief.md, or --description - for stdin.',
  });
}
