/** Signed write checks, only against an isolated loopback ui_review database. */
import assert from 'node:assert/strict';
import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import pg from 'pg';

const base = process.env.UI_AUDIT_BASE || 'http://127.0.0.1:3132';
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'Review server must be loopback');
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf8').split('\n').filter(line => /^[A-Z_]+=/.test(line)).map(line => {
  const i = line.indexOf('='); return [line.slice(0, i), line.slice(i + 1).replace(/^['"]|['"]$/g, '')];
}));
const database = new URL(env.DATABASE_URL);
assert.ok(['127.0.0.1', 'localhost'].includes(database.hostname));
assert.equal(database.pathname, '/ui_review');
assert.ok(!env.RESEND_API_KEY, 'Mail must be disabled');
const db = new pg.Pool({ connectionString: env.DATABASE_URL });
const secret = randomBytes(32).toString('hex');
const key = `review-markdown-${randomUUID()}`;
const agent = '20000000-0000-0000-0000-000000000001';
const observer = '20000000-0000-0000-0000-000000000002';
const project = '40000000-0000-0000-0000-000000000001';
const contract = '30000000-0000-0000-0000-000000000001';
const closed = '30000000-0000-0000-0000-000000000004';
const wall = 'Evidence and next steps need to be easy for the operator to scan. '.repeat(12);
const markdown = `## Markdown review\n\n**Status:** verified\n\n- Checked \`routing.ts\`\n- [ ] Operator review\n\n${wall}\n\n### Next\n\nKeep the original source and render readable Markdown.`;
const cases = [];

async function request(method, path, body, expected, code, caller = key) {
  const multipart = body instanceof FormData;
  // Recursive JSON canonicalization matches HMAC signing, including nested briefs.
  const canonical = value => value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])]))
    : Array.isArray(value) ? value.map(canonical) : value;
  const payload = multipart ? '' : JSON.stringify(canonical(body ?? {}));
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonce = randomUUID();
  const signature = createHmac('sha256', secret).update([method, path, timestamp, nonce, payload].join('\n')).digest('hex');
  const response = await fetch(base + path, { method, headers: {
    'X-API-Key': caller, 'X-Timestamp': timestamp, 'X-Nonce': nonce, 'X-Signature': signature,
    ...(multipart ? {} : { 'Content-Type': 'application/json' }),
  }, body: multipart ? body : payload });
  const result = await response.json();
  assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(result)}`);
  if (code) assert.equal(result.code, code, path);
  cases.push({ method, path, status: response.status, code: result.code || null });
  return result;
}
const scalar = async (sql, args = []) => (await db.query(sql, args)).rows[0];
try {
  assert.equal((await scalar('select current_database() as name')).name, 'ui_review');
  assert.equal((await scalar('select count(*)::int as count from webhooks where is_active')).count, 0);
  for (const [id, actor] of [[key, agent], [key + '-observer', observer]]) {
    await db.query('insert into service_keys (key_id,key_hash,signing_secret,agent_id,label) values ($1,$2,$3,$4,$5)', [id, randomBytes(32).toString('hex'), secret, actor, 'Isolated Markdown review']);
  }
  const marker = `Markdown review ${randomUUID()}`;
  const beforeProjects = (await scalar('select count(*)::int as count from projects')).count;
  await request('POST', '/api/v1/projects', { title: marker, description: wall }, 400, 'MARKDOWN_UNSTRUCTURED');
  assert.equal((await scalar('select count(*)::int as count from projects')).count, beforeProjects);
  const created = await request('POST', '/api/v1/projects', { title: marker, description: markdown }, 201);
  await request('PATCH', `/api/v1/projects/${created.id}`, { description: wall }, 400, 'MARKDOWN_UNSTRUCTURED');
  assert.equal((await scalar('select description from projects where id=$1', [created.id])).description, markdown);
  await request('PATCH', `/api/v1/projects/${created.id}`, { description: '' }, 200);
  assert.equal((await scalar('select description from projects where id=$1', [created.id])).description, '');
  await request('PATCH', `/api/v1/projects/${created.id}`, { description: markdown }, 200);

  const tasksPath = `/api/v1/projects/${project}/tasks`;
  const beforeTasks = (await scalar('select count(*)::int as count from tasks')).count;
  await request('POST', tasksPath, { title: marker, description: wall }, 400, 'MARKDOWN_UNSTRUCTURED');
  await request('POST', tasksPath, { title: marker, description: markdown, handoff_contract: { invitees: ['review-peer'], description: wall } }, 400, 'MARKDOWN_UNSTRUCTURED');
  assert.equal((await scalar('select count(*)::int as count from tasks')).count, beforeTasks);
  const task = await request('POST', tasksPath, { title: marker, description: markdown, priority: 'high' }, 201);
  const taskPath = tasksPath + '/' + task.id;
  await request('PATCH', taskPath, { title: 'Must not change', escalation_contract: { brokers: ['review-peer'], description: wall } }, 400, 'MARKDOWN_UNSTRUCTURED');
  assert.equal((await scalar('select title from tasks where id=$1', [task.id])).title, marker);
  await request('PATCH', taskPath, { description: markdown }, 200);

  const sprintsPath = `/api/v1/projects/${project}/sprints`;
  await request('POST', sprintsPath, { title: marker, goal: wall }, 400, 'MARKDOWN_UNSTRUCTURED');
  const sprint = await request('POST', sprintsPath, { title: marker, goal: markdown }, 201);
  await request('PATCH', sprintsPath + '/' + sprint.id, { goal: wall }, 400, 'MARKDOWN_UNSTRUCTURED');
  await request('PATCH', sprintsPath + '/' + sprint.id, { goal: markdown }, 200);

  await request('POST', taskPath + '/comments', { content: wall }, 400, 'MARKDOWN_UNSTRUCTURED');
  await request('POST', taskPath + '/comments', { content: '## Review\\n\\n- Escaped' }, 400, 'MARKDOWN_ESCAPED_BREAKS');
  await request('POST', taskPath + '/comments', { content: markdown }, 201);

  await request('POST', taskPath + '/runs', { summary: wall }, 400, 'MARKDOWN_UNSTRUCTURED');
  const run = await request('POST', taskPath + '/runs', { summary: markdown }, 201);
  const runPath = taskPath + '/runs/' + run.id;
  await request('PATCH', runPath, { summary: wall }, 400, 'MARKDOWN_UNSTRUCTURED');
  await request('PATCH', runPath, { summary: markdown }, 200);
  await request('POST', runPath + '/checkpoints', { checkpoint_key: 'markdown-review', summary: wall }, 400, 'MARKDOWN_UNSTRUCTURED');
  await request('POST', runPath + '/checkpoints', { checkpoint_key: 'markdown-review', summary: markdown }, 201);

  await request('PATCH', `/api/v1/agents/${agent}`, { description: wall }, 400, 'MARKDOWN_UNSTRUCTURED');
  await request('PATCH', `/api/v1/agents/${agent}`, { description: markdown }, 200);
  await request('POST', `/api/v1/contracts/${contract}/questions`, { body: wall, kind: 'question' }, 400, 'MARKDOWN_UNSTRUCTURED');
  await request('POST', `/api/v1/contracts/${contract}/links`, { to_contract_id: closed, link_type: 'continues', note: 'x'.repeat(401) }, 400, 'MARKDOWN_UNSTRUCTURED');
  await request('POST', `/api/v1/contracts/${contract}/close`, { reason: wall }, 400, 'MARKDOWN_UNSTRUCTURED');
  assert.equal((await scalar('select status from contracts where id=$1', [contract])).status, 'active');
  const beforeTurns = (await scalar('select current_turns from contracts where id=$1', [contract])).current_turns;
  await request('POST', `/api/v1/contracts/${contract}/messages`, { content: { markdown: wall } }, 400, 'MESSAGE_UNSTRUCTURED');
  assert.equal((await scalar('select current_turns from contracts where id=$1', [contract])).current_turns, beforeTurns);
  await request('PATCH', `/api/v1/contracts/${closed}`, { description: wall }, 400, 'CONTRACT_DESCRIPTION_UNSTRUCTURED');
  await request('PATCH', `/api/v1/contracts/${closed}`, { description: markdown }, 200);
  await request('POST', '/api/v1/contracts', { title: marker, invitees: ['review-peer'], unlinked_reason: wall }, 400, 'MARKDOWN_UNSTRUCTURED');

  const form = new FormData();
  form.set('file', new Blob(['# Review'], { type: 'text/markdown' }), 'review.md');
  form.set('note', wall);
  const beforeAttachments = (await scalar('select count(*)::int as count from task_attachments')).count;
  await request('POST', taskPath + '/attachments', form, 400, 'MARKDOWN_UNSTRUCTURED');
  assert.equal((await scalar('select count(*)::int as count from task_attachments')).count, beforeAttachments);
  await request('POST', '/api/v1/agents', { description: wall }, 403, 'FORBIDDEN');
  await request('POST', tasksPath, { title: marker, description: wall }, 403, 'FORBIDDEN', key + '-observer');

  // Authored display fixtures are isolated and intentionally retained for browser review.
  await db.query('update contracts set close_reason=$1 where id=$2', [markdown, closed]);
  const report = { passed: cases.length, cases, display: { project: created.id, task: task.id, run: run.id, fixtureProject: project, closedContract: closed }, errors: [] };
  fs.mkdirSync('ui-audit-shots/markdown', { recursive: true });
  fs.writeFileSync('ui-audit-shots/markdown/api-results.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ passed: cases.length, errors: [] }));
} finally {
  await db.query('delete from service_keys where key_id=$1 or key_id=$2', [key, key + '-observer']);
  await db.end();
}
