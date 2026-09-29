import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { RenderTimeProvider, useRenderTime } from '../components/render-time';
import { formatRelative } from './format-date';

const created = '2026-09-29T00:00:00.000Z';
const epoch = Date.parse(created);

test('relative labels keep their server snapshot when hydration crosses a minute', (t) => {
  t.mock.method(Date, 'now', () => epoch + 60_001);
  assert.equal(formatRelative(created), '1m ago');
  assert.equal(formatRelative(created, epoch + 59_999), 'just now');
});

test('future relative labels keep the same server boundary', (t) => {
  t.mock.method(Date, 'now', () => epoch - 60_001);
  assert.equal(formatRelative(created), 'in 1m');
  assert.equal(formatRelative(created, epoch - 59_999), 'just now');
});

test('client views render identical relative text despite browser clock skew', (t) => {
  function Label() {
    return <time>{formatRelative(created, useRenderTime())}</time>;
  }
  const view = (
    <RenderTimeProvider now={epoch + 59_999}>
      <Label />
    </RenderTimeProvider>
  );
  t.mock.method(Date, 'now', () => epoch + 59_999);
  const server = renderToStaticMarkup(view);
  t.mock.method(Date, 'now', () => epoch + 125_000);
  assert.equal(renderToStaticMarkup(view), server);
  assert.equal(server, '<time>just now</time>');
});
