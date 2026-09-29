import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { hasMarkdownStructure, validateMarkdownText, validateAgentMarkdownFields } from './markdown-policy';

const wall = 'Evidence and next steps need to be easy for the operator to scan. '.repeat(12);
const corpus = [
  '', 'Received.', 'x'.repeat(400), 'x'.repeat(401), '😀'.repeat(201),
  wall, wall.slice(0, 390) + '\n' + wall.slice(390),
  `## Review\n${wall}`, `${wall}\n\n${wall}`, `- ${wall}\n- Next step`,
  `**Status:** done\n${wall}`, `> ${wall}\n> Quoted finding`,
  '## Scope\\n\\n- Read it', 'Use `\\n` inside code.',
  '```sh\nprintf "a\\nb"\n```', '~~~sh\nprintf "a\\nb"\n~~~',
  '`code` then literal \\n',
];

test('readable paragraphs and Markdown blocks count; arbitrary wrapping does not', () => {
  assert.equal(hasMarkdownStructure(wall.slice(0, 390) + '\n' + wall.slice(390)), false);
  for (const value of [`## Scope\n${wall}`, `${wall}\n\n${wall}`, `1. ${wall}\n2. Next`]) {
    assert.equal(hasMarkdownStructure(value), true);
  }
});

test('all explicit prose fields use description/goal or general thresholds', () => {
  for (const field of ['description', 'goal', 'summary', 'error_message', 'content', 'note', 'reason', 'body', 'next_action']) {
    const threshold = field === 'description' || field === 'goal' ? 600 : 400;
    assert.equal(validateAgentMarkdownFields({ [field]: 'x'.repeat(threshold) }, [field]).ok, true, field);
    const check = validateAgentMarkdownFields({ [field]: 'x'.repeat(threshold + 1) }, [field]);
    assert.equal(check.ok, false, field);
    if (!check.ok) {
      assert.equal(check.status, 400);
      assert.equal(check.body.code, 'MARKDOWN_UNSTRUCTURED');
      assert.match(check.body.error, new RegExp(field));
      assert.match(check.body.error, /@file\.md/);
    }
    assert.equal(validateAgentMarkdownFields({ [field]: `## Scope\n\n${wall}` }, [field]).ok, true, field);
  }
});

test('nested handoff/escalation prose is checked without applying Markdown rules to data', () => {
  const input = { title: wall, metadata: { description: wall }, handoff_contract: { description: wall } };
  assert.equal(validateAgentMarkdownFields(input, ['description']).ok, true);
  assert.equal(validateAgentMarkdownFields(input, ['handoff_contract.description']).ok, false);
  assert.equal(validateAgentMarkdownFields({ escalation_contract: { requested_intervention: wall } }, ['escalation_contract.requested_intervention']).ok, false);
});

test('optional clears work; malformed prose and body objects are rejected', () => {
  for (const description of [undefined, null, '', '  ']) assert.equal(validateAgentMarkdownFields({ description }, ['description']).ok, true);
  for (const description of [42, {}, ['text']]) {
    const check = validateAgentMarkdownFields({ description }, ['description']);
    assert.equal(check.ok, false);
    if (!check.ok) assert.equal(check.body.code, 'MARKDOWN_INVALID');
  }
  for (const input of [null, [], 42, 'text']) assert.equal(validateAgentMarkdownFields(input, ['description']).ok, false);
});

test('CLI and API agree on Unicode, threshold boundaries, structure and code literals', () => {
  const python = `import json, runpy, contextlib, io, sys\nm = runpy.run_path('skill/scripts/holloway')\nresults=[]\nfor row in json.load(sys.stdin):\n    try:\n        with contextlib.redirect_stderr(io.StringIO()):\n            m['validate_markdown_text'](row['value'], 'prose', row['threshold'])\n        results.append(True)\n    except SystemExit:\n        results.append(False)\nprint(json.dumps(results))`;
  const cases = [400, 600].flatMap(threshold => corpus.map(value => ({ value, threshold })));
  const cli = JSON.parse(execFileSync('python3', ['-c', python], { input: JSON.stringify(cases), encoding: 'utf8' }));
  assert.deepEqual(cli, cases.map(({ value, threshold }) => validateMarkdownText(value, { field: 'prose', threshold }).ok));
});
