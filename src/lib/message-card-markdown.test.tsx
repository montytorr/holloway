import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import MessageCard from '../app/(dashboard)/contracts/[id]/message-card';

test('each message body field renders as the main Markdown body, once', () => {
  for (const key of ['markdown', 'text', 'message']) {
    const html = renderToStaticMarkup(<MessageCard content={{ [key]: '## Review\n\n**Status:** ready\n\n- Checked `routing.ts`' }} />);
    assert.match(html, /<h2[^>]*>Review<\/h2>/);
    assert.equal(html.match(/>Review<\/h2>/g)?.length, 1);
    assert.match(html, /<strong[^>]*>Status:<\/strong>/);
    assert.doesNotMatch(html, new RegExp(`>${key}<`), 'body field names are not product labels');
  }
});

test('nested narrative body and legacy string messages use Markdown too', () => {
  for (const content of [{ payload: { markdown: '## Nested review' } }, '## Legacy review']) {
    const html = renderToStaticMarkup(<MessageCard content={content} />);
    assert.match(html, /<h2[^>]*>(?:Nested|Legacy) review<\/h2>/);
  }
});
