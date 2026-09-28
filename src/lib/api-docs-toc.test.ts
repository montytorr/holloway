import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

/**
 * The api-docs table of contents claims a number of endpoints per section, by
 * hand, in a prop. Three of those numbers were wrong when this was written:
 * `tasks` was short by three (the five attachment endpoints landed without the
 * TOC being touched), `projects` by one, and `contracts` by one — including
 * after a deliberate edit to that very number, because the value it was being
 * corrected from was already stale.
 *
 * A count nobody can check drifts silently and makes the page quietly wrong
 * about itself. This checks it. It lives under src/lib because that is where
 * the test runner looks; what it reads is a page.
 */
const PAGE = join(process.cwd(), 'src/app/(dashboard)/api-docs/page.tsx');

function attribute(
  node: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
  name: string,
) {
  const property = node.attributes.properties.find(
    (item): item is ts.JsxAttribute =>
      ts.isJsxAttribute(item) && item.name.getText() === name,
  );
  return property?.initializer;
}

// Read JSX structure rather than physical lines: responsive presentation and
// formatting must not hide a stale count or invent an undocumented endpoint.
function counts(source: string) {
  const tree = ts.createSourceFile(
    PAGE,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const toc = new Map<string, number>();
  const endpoints = new Map<string, number>();
  function visit(node: ts.Node, section: string | null = null) {
    const opening = ts.isJsxElement(node)
      ? node.openingElement
      : ts.isJsxSelfClosingElement(node)
        ? node
        : null;
    if (opening?.tagName.getText() === 'TocItem') {
      const href = attribute(opening, 'href'),
        count = attribute(opening, 'count');
      if (
        href &&
        ts.isStringLiteral(href) &&
        count &&
        ts.isJsxExpression(count) &&
        count.expression &&
        ts.isNumericLiteral(count.expression)
      )
        toc.set(href.text.slice(1), Number(count.expression.text));
    }
    if (opening?.tagName.getText() === 'Section') {
      const id = attribute(opening, 'id');
      if (id && ts.isStringLiteral(id)) {
        section = id.text;
        endpoints.set(section, 0);
      }
    }
    if (section && opening?.tagName.getText() === 'Endpoint')
      endpoints.set(section, (endpoints.get(section) ?? 0) + 1);
    ts.forEachChild(node, (child) => visit(child, section));
  }
  visit(tree);
  return { toc, endpoints };
}

function tocCounts(source: string) {
  return counts(source).toc;
}
function endpointCounts(source: string) {
  return counts(source).endpoints;
}

test('every TOC count matches the endpoints its section actually documents', () => {
  const source = readFileSync(PAGE, 'utf8');
  const declared = tocCounts(source);
  const actual = endpointCounts(source);

  assert.ok(
    declared.size >= 10,
    'expected the TOC to still carry per-section counts',
  );

  const wrong = [...declared.entries()]
    .filter(([id, count]) => actual.get(id) !== count)
    .map(
      ([id, count]) => `${id}: says ${count}, documents ${actual.get(id) ?? 0}`,
    );

  assert.deepEqual(
    wrong,
    [],
    `api-docs TOC counts are stale —\n  ${wrong.join('\n  ')}`,
  );
});

test('a section that carries a count actually exists on the page', () => {
  const source = readFileSync(PAGE, 'utf8');
  for (const id of tocCounts(source).keys()) {
    assert.ok(
      endpointCounts(source).has(id),
      `TOC links to #${id}, which is not a Section id on the page`,
    );
  }
});
