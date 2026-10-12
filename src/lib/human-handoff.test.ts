import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  detectHumanHandoff,
  humanHandoffHint,
  mightHandToHuman,
  normalizeHumanNames,
} from '@/lib/human-handoff';
import { TURN_10, TURN_3, TURN_4 } from '@/lib/fixtures/contract-handoff-in-prose';

const agents = ['alpha', 'beta'];
const humans = normalizeHumanNames(['Alex', 'Sam Rivera', 'sam@example.com'], agents);
const names = { humans, agents };

const detects = (text: string) => {
  assert.equal(mightHandToHuman(text), true, `prefilter missed: ${text}`);
  return detectHumanHandoff(text, names).detected;
};

test('the three prose handoffs of the fixture contract are detected', () => {
  assert.equal(detects(TURN_3), true, 'turn 3');
  assert.equal(detects(TURN_4), true, 'turn 4');
  assert.equal(detects(TURN_10), true, 'turn 10');
});

test('boilerplate that names a person without handing them the move is not a handoff', () => {
  for (const text of [
    'Merge/deployment — Alex/Sam only',
    'Alex/Sam retain merge decisions',
    '## Update\n\n**Status:** fixtures green.\n\n**Next:** beta to re-run the suite. Merge/deployment — Alex/Sam only.',
    '**Next:** I rerun the workload test and post the numbers.',
  ]) {
    assert.equal(detectHumanHandoff(text, names).detected, false, text);
  }
});

test('the generic words for a person count without any names', () => {
  const bare = { humans: [], agents };
  assert.equal(detectHumanHandoff('This needs human approval before merge.', bare).detected, true);
  assert.equal(detectHumanHandoff('**Next:** operator to pick the release window', bare).detected, true);
  assert.equal(detectHumanHandoff('Blocked pending operator decision on the budget.', bare).detected, true);
  assert.equal(detectHumanHandoff('Needs Sam approval', bare).detected, false, 'Sam is only known from the names');
  assert.equal(detectHumanHandoff('Needs Sam approval', names).detected, true);
});

test('an agent named first owns the move even when a person is mentioned after it', () => {
  assert.equal(detectHumanHandoff('Next: beta, then Sam signs off', names).detected, false);
});

test('an agent is never mistaken for a person, even if a user shares its name', () => {
  assert.deepEqual(normalizeHumanNames(['beta', 'Alex Martin'], agents), ['Alex Martin', 'Alex', 'Martin']);
});

test('the hint names both fixes and quotes the line that triggered it', () => {
  const found = detectHumanHandoff(TURN_3, names);
  const hint = humanHandoffHint('5c8e2f17', found.evidence);
  assert.match(hint, /opened no question/);
  assert.match(hint, /holloway ask 5c8e2f17 --kind blocked --body/);
  assert.match(hint, /--needs-human/);
  assert.match(hint, /Alex\/Sam to authorize/);
  assert.match(hint, /peer has been woken/);
  assert.doesNotMatch(humanHandoffHint('5c8e2f17', null, { peerWoken: false }), /woken to reply/);
});

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

test('the messages route refuses a bad needs_human before it writes or spends anything', () => {
  const route = read('src/app/api/v1/contracts/[id]/messages/route.ts');
  const validated = route.indexOf('validateNeedsHuman(parsed.needs_human)');
  assert.ok(validated > 0);
  assert.ok(validated < route.indexOf("code: 'MAX_TURNS'"));
  assert.ok(validated < route.indexOf('insertMessageWithQuestion('));
  assert.ok(validated < route.indexOf("db.rpc('insert_message_atomic'"));
  assert.match(route, /const requiresAction = needsHuman \? false :/);
});

test('asking by message and asking directly announce the question the same way', () => {
  for (const path of ['src/app/api/v1/contracts/[id]/messages/route.ts', 'src/app/api/v1/contracts/[id]/questions/route.ts']) {
    const route = read(path);
    assert.match(route, /announceContractQuestion\(/, path);
    assert.doesNotMatch(route, /event: 'contract\.question_asked'/, path);
  }
});

test('the handoff hint only runs for turn messages without needs_human', () => {
  const route = read('src/app/api/v1/contracts/[id]/messages/route.ts');
  const hint = route.indexOf('response.human_handoff_hint =');
  assert.ok(hint > 0);
  assert.match(route.slice(route.lastIndexOf('if (!needsHuman && !isNonTurn)', hint), hint), /hasOpenBlockingQuestion/);
  assert.ok(hint < route.indexOf('storeIdempotencyResponse('), 'a replayed request must get the same hint');
});

test('the question-message link migration is additive and safe to run twice', () => {
  const sql = read('migrations/20260923120000_contract_question_message_link.sql');
  assert.match(sql, /^BEGIN;$/m);
  assert.match(sql, /^COMMIT;$/m);
  assert.match(sql, /ADD COLUMN IF NOT EXISTS message_id UUID/);
  assert.match(sql, /CREATE INDEX IF NOT EXISTS/);
  assert.match(sql, /message_id UUID REFERENCES messages\(id\) ON DELETE SET NULL;/, 'nullable: a standalone ask has no message');
  assert.doesNotMatch(sql, /service_role|DROP /);
});

test('a standing merge gate is not a handoff, but a Next line naming a person still is', () => {
  // In the same contract, turn 1 handed the move to the peer agent and only restated the gate.
  assert.equal(detectHumanHandoff('Please review. PR 42 stays open and unmerged pending human decision.', names).detected, false);
  assert.equal(detectHumanHandoff('Next owner: Alex/Sam to approve the merge.', names).detected, true);
});
