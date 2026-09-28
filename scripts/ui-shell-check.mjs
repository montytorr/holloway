/** Verifies route-owned header actions, history, unsaved editors and responsive rail using local synthetic fixtures. */
const { chromium } = await import(
  process.env.PLAYWRIGHT_IMPORT || 'playwright'
);
import assert from 'node:assert/strict';
import fs from 'node:fs';
const base = process.env.UI_AUDIT_BASE || 'http://localhost:3125';
if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname))
  throw new Error(
    'Use an isolated local app with scripts/ui-review-fixtures.sql.',
  );
if (!process.env.UI_AUDIT_STORAGE)
  throw new Error('Set UI_AUDIT_STORAGE for the local review session.');
fs.mkdirSync('ui-audit-shots', { recursive: true });
(async () => {
  const b = await chromium.launch({
    ...(process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {}),
  });
  const results = [];
  for (const theme of ['dark', 'light'])
    for (const width of [390, 768, 1024, 1440]) {
      const ctx = await b.newContext({
        storageState: process.env.UI_AUDIT_STORAGE,
        viewport: { width, height: 1000 },
      });
      await ctx.addInitScript((t) => localStorage.setItem('theme', t), theme);
      const p = await ctx.newPage();
      const errors = [];
      p.on('pageerror', (e) => errors.push(e.message));
      const header = p.locator('main > header');
      const title = header.locator('h1');
      await p.goto(base + '/');
      await p
        .getByRole('heading', { name: 'Workspace overview', exact: true })
        .waitFor();
      assert.equal(await title.count(), 1);
      await header.getByRole('link', { name: 'View contracts' }).click();
      await p.waitForURL('**/contracts');
      await p
        .getByRole('heading', { name: 'Contracts', exact: true })
        .waitFor();
      assert.equal(
        await header.getByRole('link', { name: 'View contracts' }).count(),
        0,
      );
      await p.goto(base + '/agents');
      await p.getByRole('heading', { name: 'Agents', exact: true }).waitFor();
      await header
        .getByRole('link', { name: 'Register Agent', exact: true })
        .click();
      await p.waitForURL('**/agents/register');
      await p
        .getByRole('heading', { name: 'Register Agent', exact: true })
        .waitFor();
      assert.equal(
        await header
          .getByRole('link', { name: 'Register Agent', exact: true })
          .count(),
        0,
      );
      await p.goBack();
      await p.getByRole('heading', { name: 'Agents', exact: true }).waitFor();
      await header
        .getByRole('link', { name: 'Register Agent', exact: true })
        .waitFor();
      await p.goto(base + '/contracts/30000000-0000-0000-0000-000000000002');
      await title
        .filter({ hasText: 'Review fixture · blocked on a human answer' })
        .waitFor();
      await header
        .getByRole('button', { name: 'Close Contract', exact: true })
        .waitFor();
      await p.getByRole('button', { name: 'Answer', exact: true }).waitFor();
      await p.goto(base + '/projects/40000000-0000-0000-0000-000000000001');
      await title.filter({ hasText: 'Review workspace' }).waitFor();
      await p.getByRole('button', { name: 'Edit title', exact: true }).click();
      const input = header.getByRole('textbox');
      await input.waitFor();
      await input.fill('Unsubmitted preview');
      await p.keyboard.press('Escape');
      await title.filter({ hasText: 'Review workspace' }).waitFor();
      assert.equal(
        await header
          .getByRole('button', { name: 'Close Contract', exact: true })
          .count(),
        0,
      );
      const rail = p.locator('aside[data-sidebar]');
      if (width >= 768 && width < 1280) {
        assert.equal(await rail.getAttribute('data-sidebar'), 'icons');
        assert.ok((await rail.boundingBox()).width <= 64);
      }
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth - innerWidth,
        ),
        0,
      );
      assert.deepEqual(errors, []);
      results.push({ theme, width, titleActionsHistoryEditorAndRail: true });
      console.log('PASS', theme, width);
      await ctx.close();
    }
  fs.writeFileSync(
    'ui-audit-shots/shell-interactions.json',
    JSON.stringify(results, null, 2),
  );
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
