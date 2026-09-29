/** Exercise real slow navigation, rapid filters, search debounce and streamed
 * skeletons. Uses authored fixtures in a loopback-only ui_review database.
 * The short task_comments lock delays only this isolated fixture application.
 * Screenshots/results stay local until inspected. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import pg from 'pg';
const { chromium } = await import(process.env.PLAYWRIGHT_IMPORT || 'playwright');
const base = process.env.UI_AUDIT_BASE || 'http://localhost:3128';
const local = (host) => ['localhost', '127.0.0.1', '[::1]'].includes(host);
assert.ok(local(new URL(base).hostname), 'Use an isolated loopback app');
assert.ok(process.env.UI_AUDIT_STORAGE, 'Supply local storage state');
const database = new URL(process.env.DATABASE_URL);
assert.ok(local(database.hostname) && database.pathname === '/ui_review', 'Use ui_review on loopback');
const output = process.env.UI_AUDIT_OUTPUT || 'ui-audit-shots/loading';
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const checks = [], errors = [];
const settle = async (page) => {
  await page.locator('.navigation-progress').waitFor({ state: 'detached' });
  await page.waitForFunction(() => {
    const frames = [...document.querySelectorAll('.page-frame')];
    return frames.length === 1 && frames[0].checkVisibility() && !document.querySelector('[aria-busy="true"][aria-label^="Loading "]');
  });
};
const go = async (page, path) => { assert.equal((await page.goto(base + path)).status(), 200); await settle(page); };
const check = async (name, work) => {
  if (process.env.UI_LOADING_CHECK_MATCH && !name.includes(process.env.UI_LOADING_CHECK_MATCH)) return;
  try { await work(); checks.push({ name, pass: true }); console.log('PASS', name); }
  catch (error) { checks.push({ name, pass: false, error: error.message }); console.log('FAIL', name, error.message); }
  fs.writeFileSync(`${output}/results.json`, JSON.stringify({ checks, errors }, null, 2));
};
try {
  for (const theme of ['dark', 'light']) for (const width of [390, 1440]) {
    const tag = `${theme}-${width}`;
    const ctx = await browser.newContext({ storageState: process.env.UI_AUDIT_STORAGE, viewport: { width, height: 1000 } });
    await ctx.addInitScript(t => localStorage.setItem('theme', t), theme);
    const page = await ctx.newPage();
    page.on('pageerror', error => errors.push({ tag, message: error.message }));
    page.on('console', message => { if (message.type() === 'error' && /hydrat|server rendered/i.test(message.text())) errors.push({ tag, message: message.text() }); });
    let requests = [], delay = 0;
    page.on('request', request => { if (request.headers().rsc === '1') requests.push({ url: request.url(), prefetch: request.headers()['next-router-prefetch'] }); });
    await page.route('**/*', async route => {
      if (delay && route.request().headers().rsc === '1') await new Promise(resolve => setTimeout(resolve, delay));
      await route.continue().catch(() => {}); // superseded transitions may abort
    });
    await check(`${tag}: no speculative sidebar or row requests`, async () => {
      await go(page, '/contracts?status=all&search=Review+fixture');
      await page.waitForTimeout(700);
      assert.equal(requests.filter(r => r.prefetch).length, 0);
      assert.equal(requests.length, 0);
      const blocked = page.locator('a[href="/contracts/30000000-0000-0000-0000-000000000002"]');
      assert.ok(await blocked.count() > 0);
      await blocked.getByText('asking', { exact: true }).waitFor();
    });
    await check(`${tag}: filter feedback preserves results and geometry`, async () => {
      const register = page.locator('[aria-label="Contract register"]');
      const before = await register.boundingBox();
      await register.evaluate(el => el.dataset.loadingContinuity = 'retained');
      delay = 900; requests = [];
      const started = performance.now();
      await page.getByRole('button', { name: 'Closed', exact: true }).click();
      assert.equal(await page.getByRole('button', { name: 'Closed', exact: true }).getAttribute('aria-pressed'), 'true');
      await page.getByRole('status', { name: 'Loading page', exact: true }).waitFor();
      assert.equal(await register.getAttribute('data-loading-continuity'), 'retained');
      assert.ok(Math.abs((await register.boundingBox()).y - before.y) < 1);
      assert.equal(await page.getByText('Loading contracts...', { exact: true }).count(), 0);
      await page.waitForTimeout(150);
      const progress = await page.locator('.navigation-progress').evaluate(el => ({ height: el.getBoundingClientRect().height, opacity: getComputedStyle(el).opacity, animation: getComputedStyle(el).animationName }));
      assert.ok(progress.height <= 2 && +progress.opacity > 0);
      await page.screenshot({ path: `${output}/filter-pending-${tag}.png` });
      await page.waitForURL(url => url.searchParams.get('status') === 'closed');
      await settle(page); delay = 0;
      assert.ok(performance.now() - started < 4000, 'A delayed filter must not wait for the 15s fallback refresh');
      assert.equal(requests.length, 1);
      assert.equal(await page.getByRole('button', { name: 'Closed', exact: true }).getAttribute('aria-pressed'), 'true');
    });
    await check(`${tag}: rapid changes compose and Back restores selection`, async () => {
      await go(page, '/contracts?status=all&search=Review+fixture');
      delay = 700;
      await page.getByRole('button', { name: 'Closed', exact: true }).click();
      await page.getByRole('combobox', { name: 'Sort contracts' }).selectOption('oldest');
      assert.equal(await page.getByRole('button', { name: 'Closed', exact: true }).getAttribute('aria-pressed'), 'true');
      assert.equal(await page.getByRole('combobox', { name: 'Sort contracts' }).inputValue(), 'oldest');
      await page.waitForURL(url => url.searchParams.get('status') === 'closed' && url.searchParams.get('sort') === 'oldest');
      await settle(page); delay = 0;
      await page.goBack(); await settle(page);
      const url = new URL(page.url());
      assert.equal(await page.getByRole('button', { name: url.searchParams.get('status') === 'closed' ? 'Closed' : 'All', exact: true }).getAttribute('aria-pressed'), 'true');
      assert.equal(await page.getByRole('combobox', { name: 'Sort contracts' }).inputValue(), url.searchParams.get('sort') || 'newest');
      assert.equal(await page.locator('.navigation-progress').count(), 0);
    });
    await check(`${tag}: search sends one request and cancels on departure`, async () => {
      await go(page, '/contracts?status=all'); requests = [];
      const input = page.getByRole('searchbox', { name: 'Search contracts by title' });
      await input.pressSequentially('Review fixture', { delay: 10 });
      assert.equal(await input.inputValue(), 'Review fixture');
      assert.ok(requests.length <= 1, 'Typing a burst must not send a request per character');
      await page.waitForURL(url => url.searchParams.get('search') === 'Review fixture'); await settle(page);
      assert.equal(requests.length, 1);
      delay = 700;
      await input.fill('This delayed search must not reopen contracts');
      // Leave before debounce expiry using the actual sidebar link.
      if (width === 390) await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
      await page.locator('aside a[href="/projects"]:visible').click();
      await page.waitForURL(url => url.pathname === '/projects'); await settle(page); delay = 0;
      await page.waitForTimeout(400);
      assert.equal(new URL(page.url()).pathname, '/projects');
      await page.goBack(); await settle(page);
      assert.equal(await input.inputValue(), new URL(page.url()).searchParams.get('search') || '');
    });
    for (const item of [
      { path: '/projects', change: p => p.getByRole('button', { name: 'Active', exact: true }).click(), key: 'status', value: 'active' },
      { path: '/tasks', change: p => p.getByRole('combobox', { name: 'Filter by status' }).selectOption('done'), key: 'status', value: 'done' },
      { path: '/messages', change: p => p.getByRole('combobox', { name: 'Filter messages by type' }).selectOption('request'), key: 'type', value: 'request' },
      { path: '/audit', change: p => p.getByRole('combobox', { name: 'Filter audit date range' }).selectOption('7d'), key: 'range', value: '7d' },
      { path: '/webhooks/health', change: p => p.getByRole('button', { name: /review\.example\.test/, exact: false }).click(), key: 'webhook', value: '80000000-0000-0000-0000-000000000001' },
    ]) await check(`${tag}: ${item.path} uses shared query feedback`, async () => {
      await go(page, item.path); delay = 600;
      await item.change(page);
      await page.getByRole('status', { name: 'Loading page', exact: true }).waitFor();
      await page.waitForURL(url => url.searchParams.get(item.key) === item.value);
      await settle(page); delay = 0;
      assert.equal(await page.getByRole('status', { name: 'Loading page', exact: true }).count(), 0);
      assert.ok(!await page.getByText('This page couldn’t load', { exact: false }).count());
    });
    await check(`${tag}: refresh keeps the mounted workspace`, async () => {
      await go(page, '/contracts?status=all');
      const register = page.locator('[aria-label="Contract register"]');
      await register.evaluate(el => el.dataset.loadingContinuity = 'refresh');
      delay = 600;
      await page.getByRole('button', { name: 'Refresh current page' }).click();
      await page.getByRole('status', { name: 'Loading page', exact: true }).waitFor();
      assert.equal(await register.getAttribute('data-loading-continuity'), 'refresh');
      await settle(page); delay = 0;
      assert.equal(await register.getAttribute('data-loading-continuity'), 'refresh');
    });
    await check(`${tag}: real streamed skeleton has shared geometry and motion`, async () => {
      await go(page, '/projects/40000000-0000-0000-0000-000000000001');
      const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
      client.on('error', error => errors.push({ tag, database: error.message }));
      await client.connect();
      try {
        assert.equal((await client.query('SELECT current_database() AS db')).rows[0].db, 'ui_review');
        await client.query('BEGIN');
        await client.query('SET LOCAL idle_in_transaction_session_timeout = 12000');
        await client.query('LOCK TABLE task_comments IN ACCESS EXCLUSIVE MODE');
        const task = '/projects/40000000-0000-0000-0000-000000000001/tasks/60000000-0000-0000-0000-000000000001';
        await page.goto(base + task, { waitUntil: 'commit' });
        const skeleton = page.getByRole('status', { name: 'Loading task', exact: true });
        await skeleton.waitFor({ timeout: 7000 });
        await page.waitForFunction(() => { const el = document.querySelector('[aria-label="Loading task"] .loading-skeleton'), frame = el?.closest('.page-frame'); return el?.checkVisibility() && frame && parseFloat(getComputedStyle(frame).paddingLeft) >= 16 && getComputedStyle(el, '::after').animationName === 'loading-sweep'; }, null, { timeout: 5000 });
        const geometry = await page.evaluate(() => {
          const el = document.querySelector('[aria-label="Loading task"]');
          const frame = el.closest('.page-frame');
          const shimmer = el.querySelector('.loading-skeleton');
          return { gutter: parseFloat(getComputedStyle(frame).paddingLeft), width: frame.getBoundingClientRect().width, animation: getComputedStyle(shimmer, '::after').animationName, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
        });
        assert.equal(Math.round(geometry.gutter), width === 390 ? 16 : 24);
        assert.equal(geometry.overflow, 0);
        assert.equal(geometry.animation, 'loading-sweep');
        await page.screenshot({ path: `${output}/task-skeleton-${tag}.png` });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        assert.equal(await skeleton.locator('.loading-skeleton').first().evaluate(el => getComputedStyle(el, '::after').animationName), 'none');
        await page.emulateMedia({ reducedMotion: 'no-preference' });
      } finally { await client.query('ROLLBACK').catch(() => {}); await client.end(); }
      await settle(page);
      await page.getByRole('heading', { name: 'Implementation scope', exact: true }).waitFor();
    });
    await check(`${tag}: busy control keeps width and respects reduced motion`, async () => {
      delay = 0;
      await page.goto(base + '/login');
      const submit = page.locator('button[type="submit"]');
      await page.getByRole('button', { name: 'Sign In', exact: true }).waitFor();
      await page.locator('#email').fill('ui-review@example.test');
      await page.locator('#password').fill('review-only-mocked-request');
      const before = await submit.boundingBox();
      let release;
      const gate = new Promise(resolve => { release = resolve; });
      await page.route('**/api/auth/login', async route => {
        await gate;
        await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'Review-only simulated sign-in failure' }) });
      });
      try {
        await submit.click();
        await page.getByRole('button', { name: 'Authenticating…', exact: true }).waitFor();
        assert.equal(await submit.isDisabled(), true);
        assert.equal(await submit.locator('.pending-label').getAttribute('aria-busy'), 'true');
        assert.ok(Math.abs((await submit.boundingBox()).width - before.width) < 1);
        await submit.locator('.loading-spinner:visible').waitFor();
        assert.equal(await submit.locator('.pending-label-hidden').evaluate(el => el.checkVisibility({ visibilityProperty: true })), false);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        assert.equal(await submit.locator('.loading-spinner').evaluate(el => getComputedStyle(el).animationName), 'none');
        await page.emulateMedia({ reducedMotion: 'no-preference' });
      } finally { release(); }
      await page.getByText('Review-only simulated sign-in failure', { exact: true }).waitFor();
      assert.equal(await submit.isDisabled(), false);
      assert.equal(await page.locator('#email').inputValue(), 'ui-review@example.test');
      await page.unroute('**/api/auth/login');
    });
    await ctx.close();
  }
} finally { await browser.close(); }
fs.writeFileSync(`${output}/results.json`, JSON.stringify({ checks, errors }, null, 2));
console.log('COMPLETE', checks.length, errors.length);
if (checks.some(x => !x.pass) || errors.length) process.exitCode = 1;
