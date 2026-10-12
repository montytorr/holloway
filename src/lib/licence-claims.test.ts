import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

/**
 * A stale licence claim is a false legal statement, not a typo.
 *
 * Holloway is MIT. For a while (v1.0.338 until the move back) it was under a
 * fair-code licence, and that wording was in a badge, the README, the reactor's
 * README, CONTRIBUTING and package.json. Leave one behind and the repository
 * tells a visitor it withholds rights it in fact grants.
 *
 * The same shape as the guard in release-hygiene.test.ts that keeps a dropped
 * dependency's name out of the code: the next person to copy an old paragraph
 * has no way of knowing it stopped being true.
 */

const tracked = () =>
  execFileSync('git', ['ls-files'], { encoding: 'utf8', cwd: root }).trim().split('\n').filter(Boolean);

/** Files that are ALLOWED to name the old licence, each for a stated reason. */
const EXEMPT = new Set([
  // The historical record. Rewriting it to match today's licence would be the
  // dishonest option, not the tidy one.
  'CHANGELOG.md',
  // This file, which cannot test for a phrase without containing it.
  'src/lib/licence-claims.test.ts',
]);

const STALE = [
  /sustainable[- ]use/i,
  /fair[- ]code/i,
  /source[- ]available/i,
  /internal business purposes/i,
  /commercial hosting/i,
  /\bSUL\b/,
  /LICENSE-MIT|LICENSE\.md/,
];

test('nothing outside the history still claims the fair-code licence', () => {
  const offenders: string[] = [];
  for (const path of tracked()) {
    if (EXEMPT.has(path)) continue;
    let text: string;
    try { text = readFileSync(join(root, path), 'utf8'); } catch { continue; }
    if (text.includes('\0')) continue;
    for (const [i, line] of text.split('\n').entries()) {
      if (STALE.some((re) => re.test(line))) {
        offenders.push(`${path}:${i + 1}  ${line.trim().slice(0, 90)}`);
      }
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `Holloway is MIT. These still carry fair-code wording:\n${offenders.join('\n')}`,
  );
});

test('the licence is MIT, in one file, and package.json says so', () => {
  const licence = readFileSync(join(root, 'LICENSE'), 'utf8');
  assert.match(licence, /^MIT License\n/, 'LICENSE is the MIT text');
  assert.match(licence, /Copyright \(c\) \d{4}(-\d{4})? Callum Torr/, 'and names the copyright holder');
  for (const old of ['LICENSE.md', 'LICENSE-MIT']) {
    assert.ok(!existsSync(join(root, old)), `${old} is gone; LICENSE is the only licence file`);
  }
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.license, 'MIT');
});
