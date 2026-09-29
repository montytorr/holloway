/** Resource canvas and authored Markdown checks against the isolated review app. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_IMPORT || 'playwright');
const base = process.env.UI_AUDIT_BASE || 'http://localhost:3132';
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
const fixture = JSON.parse(fs.readFileSync('ui-audit-shots/markdown/api-results.json', 'utf8')).display;
const auth = process.env.UI_AUDIT_STORAGE_STATE;
assert.ok(auth, 'Provide the isolated review account storage state');
const resources = ['/onboarding/agent', '/onboarding/human', '/api-docs', '/security', '/changelog'];
const proseRoutes = [
  ['/agents', 'compact agent description'],
  [`/projects/${fixture.project}`, 'project description'],
  [`/projects/${fixture.fixtureProject}/tasks/${fixture.task}`, 'task description and comment'],
  [`/contracts/${fixture.closedContract}`, 'contract description and outcome'],
  [`/protocol-inspector?task=${fixture.task}`, 'run and checkpoint summaries'],
];
const output = 'ui-audit-shots/markdown';
const browser = await chromium.launch({ executablePath: process.env.UI_AUDIT_CHROMIUM || '/home/caladmin/.cache/ms-playwright/chromium-1187/chrome-linux/chrome' });
const results = [], errors = [];
try {
  for (const theme of ['dark', 'light']) for (const width of [390, 768, 1024, 1440, 1920]) {
    const ctx = await browser.newContext({ storageState: auth, viewport: { width, height: 1000 } });
    await ctx.addInitScript(t => localStorage.setItem('theme', t), theme);
    const page = await ctx.newPage();
    page.on('pageerror', error => errors.push({ path: page.url(), message: error.message }));
    page.on('console', message => { if (message.type() === 'error' && /hydrat|server rendered|cannot be a descendant/i.test(message.text())) errors.push({ path: page.url(), message: message.text() }); });
    for (const path of resources) {
      const response = await page.goto(base + path);
      assert.equal(response.status(), 200, path);
      await page.waitForFunction(t => document.documentElement.classList.contains(t), theme);
      await page.locator('h1').first().waitFor();
      const geometry = await page.locator('.page-content').evaluate(el => {
        const frame = el.closest('.page-frame'), style = getComputedStyle(frame);
        const box = frame.getBoundingClientRect(), content = el.getBoundingClientRect();
        const navigation = el.querySelector('[aria-label="Document sections"]');
        const layout = navigation?.parentElement, documentContent = layout?.lastElementChild;
        return {
          available: box.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight), width: content.width,
          right: content.right, documentRight: documentContent?.getBoundingClientRect().right ?? null,
          headingWidth: document.querySelector('h1').getBoundingClientRect().width,
          overflow: document.documentElement.scrollWidth - innerWidth,
        };
      });
      assert.ok(Math.abs(geometry.width - geometry.available) < 2, `${path} page frame doesn't fill canvas: ${JSON.stringify(geometry)}`);
      if (geometry.documentRight !== null) assert.ok(Math.abs(geometry.documentRight - geometry.right) < 2, `${path} inner documentation cap remains`);
      assert.ok(geometry.headingWidth > 30);
      assert.ok(geometry.overflow <= 1, `${path} overflow ${geometry.overflow}`);
      if (path === '/onboarding/agent' || path === '/api-docs') {
        await page.locator('#markdown-authoring').waitFor();
        assert.match(await page.locator('#markdown-authoring').innerText(), /MARKDOWN_UNSTRUCTURED/);
        if (width <= 900) await page.locator('summary').filter({ hasText: 'On this page' }).click();
        await page.locator('a[href="#markdown-authoring"]').filter({ visible: true }).first().click();
        if (width <= 900) await page.locator('summary').filter({ hasText: 'On this page' }).click();
        await page.waitForFunction(() => location.hash === '#markdown-authoring');
      }
      if (path === '/onboarding/agent' && [390, 1440].includes(width)) await page.screenshot({ path: `${output}/agent-guide-${theme}-${width}.png` });
      results.push({ theme, width, path, kind: 'resource-width', geometry }); console.log('PASS', theme, width, path);
    }
    for (const [path, label] of proseRoutes) {
      const response = await page.goto(base + path);
      assert.equal(response.status(), 200, path);
      await page.locator('h1').first().waitFor();
      const markdown = page.locator('.page-content .markdown-preview').filter({ hasText: 'Markdown review' });
      if (path === '/agents') {
        await page.locator('.page-content strong').filter({ hasText: 'Markdown review' }).first().waitFor();
      } else {
        await markdown.first().waitFor();
        assert.ok(await markdown.locator('h2').filter({ hasText: 'Markdown review' }).count() >= 1, label);
        assert.ok(await markdown.locator('strong').filter({ hasText: 'Status:' }).count() >= 1, label);
        assert.ok(await markdown.locator('code').filter({ hasText: 'routing.ts' }).count() >= 1, label);
        assert.ok(await markdown.locator('ul li').count() >= 2, label);
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert.ok(overflow <= 1, `${path} overflow ${overflow}`);
      if (path.includes('/tasks/') && [390, 1440].includes(width)) await page.screenshot({ path: `${output}/task-markdown-${theme}-${width}.png`, fullPage: true });
      results.push({ theme, width, path, kind: 'markdown-semantics', label, overflow }); console.log('PASS', theme, width, label);
    }
    await ctx.close();
  }
  assert.deepEqual(errors, []);
  fs.writeFileSync(`${output}/browser-results.json`, JSON.stringify({ passed: results.length, results, errors }, null, 2));
  console.log(JSON.stringify({ passed: results.length, errors }));
} finally { await browser.close(); }
