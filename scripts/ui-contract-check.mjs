/** Mutates only the authored fixtures in ui_review; never target a live app.
 * Seed scripts/ui-review-fixtures.sql first, then supply a local admin session. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
const { chromium } = await import(
  process.env.PLAYWRIGHT_IMPORT || 'playwright'
);
const base = process.env.UI_AUDIT_BASE || 'http://localhost:3100',
  fixture = (n) => '30000000-0000-0000-0000-' + String(n).padStart(12, '0');
if (
  !['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname) ||
  process.env.UI_REVIEW_ALLOW_WRITES !== '1'
)
  throw new Error(
    'Run only against an isolated local review app with UI_REVIEW_ALLOW_WRITES=1.',
  );
if (!process.env.UI_AUDIT_STORAGE || !process.env.UI_AUDIT_PASSWORD)
  throw new Error(
    'Set UI_AUDIT_STORAGE and UI_AUDIT_PASSWORD for the review fixtures.',
  );
fs.mkdirSync('ui-audit-shots', { recursive: true });
(async () => {
  const browser = await chromium.launch({
    ...(process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {}),
  });
  const ctx = await browser.newContext({
    storageState: process.env.UI_AUDIT_STORAGE,
    viewport: { width: 1440, height: 1000 },
  });
  const page = await ctx.newPage();
  const go = async (path) => {
    await page.goto(base + path);
    await page.waitForFunction(() => {
      const status = document
        .querySelector('header [role="status"]')
        ?.getAttribute('aria-label');
      return ['Current', 'Not updating', 'Connected', 'Feed stale'].includes(
        status,
      );
    });
  };
  const outcomes = [];
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const check = async (name, work) => {
    try {
      await work();
      outcomes.push({ name, pass: true });
      console.log('PASS', name);
    } catch (e) {
      outcomes.push({ name, pass: false, error: e.message });
      console.log('FAIL', name, e.message);
    }
    fs.writeFileSync(
      'ui-audit-shots/contract-interactions.json',
      JSON.stringify({ outcomes, errors }, null, 2),
    );
  };
  await go('/contracts/' + fixture(1));
  for (const width of [1440, 390]) {
    await check(
      `close dialog keyboard and geometry at ${width}px`,
      async () => {
        await page.setViewportSize({ width, height: 1000 });
        const trigger = page.getByRole('button', {
          name: 'Close Contract',
          exact: true,
        });
        await trigger.click();
        const dialog = page.getByRole('dialog', {
          name: 'Close Contract',
          exact: true,
        });
        await dialog.waitFor();
        const box = await dialog.boundingBox();
        assert.ok(box.x >= 0 && box.x + box.width <= width);
        assert.ok(Math.abs(box.x + box.width / 2 - width / 2) < 2);
        assert.equal(
          await page.evaluate(() => document.body.style.overflow),
          'hidden',
        );
        await dialog
          .getByRole('button', { name: 'Cancel', exact: true })
          .focus();
        await page.keyboard.press('Shift+Tab');
        assert.equal(
          await page.evaluate(() => document.activeElement?.innerText?.trim()),
          'Confirm Close',
        );
        await page.keyboard.press('Tab');
        assert.equal(
          await page.evaluate(() => document.activeElement?.innerText?.trim()),
          'Cancel',
        );
        await page.keyboard.press('Escape');
        await dialog.waitFor({ state: 'hidden' });
        assert.equal(
          await trigger.evaluate((node) => node === document.activeElement),
          true,
        );
        assert.notEqual(
          await page.evaluate(() => document.body.style.overflow),
          'hidden',
        );
      },
    );
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await check('page freshness follows client navigation', async () => {
    const current = page.locator('header [role=status][aria-label=Current]');
    await current.waitFor();
    assert.match(
      await current.getAttribute('title'),
      /received.*(?:live updates|fallback)/,
    );
    await page.locator('a[href="/settings"]:visible').first().click();
    await page.waitForURL('**/settings');
    await page
      .getByRole('heading', { name: 'Settings', exact: true })
      .waitFor();
    assert.equal(await current.count(), 0);
    await page.goBack();
    await page.waitForURL('**/contracts/' + fixture(1));
    await current.waitFor();
  });
  for (const width of [1440, 390]) {
    await check(`approval gate close dialog at ${width}px`, async () => {
      await go('/contracts/' + fixture(3));
      await page.setViewportSize({ width, height: 1000 });
      const trigger = page.getByRole('button', {
        name: 'Close Contract',
        exact: true,
      });
      await trigger.click();
      const dialog = page.getByRole('dialog', {
        name: 'Close without approving',
        exact: true,
      });
      await dialog.waitFor();
      const reason = dialog.getByRole('textbox', {
        name: 'Why is the work not being accepted?',
        exact: true,
      });
      const confirm = dialog.getByRole('button', {
        name: 'Close without approving',
        exact: true,
      });
      assert.equal(await confirm.isDisabled(), true);
      assert.equal(
        await reason.evaluate((node) => node === document.activeElement),
        true,
      );
      await reason.fill('Too short');
      assert.equal(await confirm.isDisabled(), true);
      await reason.fill('The audit needs a follow-up fix.');
      assert.equal(await confirm.isEnabled(), true);
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'hidden' });
      assert.equal(
        await trigger.evaluate((node) => node === document.activeElement),
        true,
      );
    });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await go('/contracts/' + fixture(1));
  await check('opening agent visible to admin', async () => {
    await page
      .locator('[data-awaiting]:visible')
      .getByText('Waiting on Review peer', { exact: true })
      .waitFor();
  });
  await check('contract tabs keyboard and hash', async () => {
    await page.getByRole('tab', { name: 'Overview', exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    await page.getByRole('tab', { name: 'Conversation 0' }).waitFor();
    assert.equal(
      await page
        .getByRole('tab', { name: 'Conversation 0' })
        .getAttribute('aria-selected'),
      'true',
    );
    assert.equal(new URL(page.url()).hash, '#conversation');
    await page.keyboard.press('End');
    assert.equal(
      await page
        .getByRole('tab', { name: 'Artifacts 0' })
        .getAttribute('aria-selected'),
      'true',
    );
  });
  await check('note draft survives tabs and hash links', async () => {
    await page
      .getByText('Operator notes & questions', { exact: false })
      .filter({ visible: true })
      .click();
    await page
      .getByRole('button', { name: 'Leave a note', exact: true })
      .click();
    await page
      .getByRole('textbox', { name: 'Standing instruction' })
      .fill('Preserve this operator draft.');
    await page.getByRole('tab', { name: 'Conversation 0' }).click();
    await page.evaluate(() => {
      location.hash = 'operator-channel';
    });
    await page.waitForTimeout(150);
    assert.equal(
      await page
        .getByRole('textbox', { name: 'Standing instruction' })
        .inputValue(),
      'Preserve this operator draft.',
    );
    // A direct channel link can also be collapsed, without losing the draft.
    const disclosure = page.getByRole('button', {
      name: /Operator notes & questions/,
    });
    await disclosure.click();
    await page
      .getByRole('textbox', { name: 'Standing instruction' })
      .waitFor({ state: 'hidden' });
    await disclosure.click();
    assert.equal(
      await page
        .getByRole('textbox', { name: 'Standing instruction' })
        .inputValue(),
      'Preserve this operator draft.',
    );
  });
  await check('note saves and is rendered', async () => {
    await page.getByRole('button', { name: 'Leave note', exact: true }).click();
    await page
      .locator('#operator-channel:visible')
      .getByText('Preserve this operator draft.', { exact: true })
      .waitFor({ timeout: 20000 });
  });
  await check('question remains visible across contract tabs', async () => {
    await go('/contracts/' + fixture(2) + '#artifacts');
    await page
      .locator('#operator-channel:visible')
      .getByText('Decision needed', { exact: true })
      .waitFor();
    await page.getByRole('button', { name: 'Answer', exact: true }).click();
    await page
      .getByRole('textbox', { name: 'Answer the agent' })
      .fill('Please wait for the follow-up fix.');
    await page.getByRole('tab', { name: 'Conversation 0' }).click();
    assert.equal(
      await page
        .getByRole('textbox', { name: 'Answer the agent' })
        .inputValue(),
      'Please wait for the follow-up fix.',
    );
  });
  await check(
    'question answer updates attention and resolved history',
    async () => {
      await page.getByRole('button', { name: 'Answer', exact: true }).click();
      await page
        .getByRole('textbox', { name: 'Answer the agent' })
        .waitFor({ state: 'hidden', timeout: 20000 });
      await page
        .locator('#operator-channel:visible')
        .getByText('Resolved questions', { exact: false })
        .waitFor();
      await page
        .locator('#operator-channel:visible')
        .getByText('Please wait for the follow-up fix.', { exact: true })
        .waitFor();
      await page.waitForFunction(() =>
        document
          .querySelector('a[href="/notifications"][aria-label]')
          ?.getAttribute('aria-label')
          ?.includes('0 items'),
      );
    },
  );
  await check(
    'closed without approval differs from accepted completion',
    async () => {
      await go('/contracts/' + fixture(4));
      await page
        .locator('[class*=outcomeTitle]:visible')
        .filter({ hasText: 'Contract completed' })
        .waitFor();
      await go('/contracts/' + fixture(5));
      await page
        .getByText('Closed without approval', { exact: true })
        .first()
        .waitFor();
    },
  );
  await check('message deep link reveals conversation and target', async () => {
    await go('/contracts/' + fixture(7) + '#conversation');
    const id = await page
      .locator('[id^="message-"]:visible')
      .nth(3)
      .getAttribute('id');
    await go('/contracts/' + fixture(7) + '#' + id);
    assert.equal(
      await page
        .getByRole('tab', { name: 'Conversation 30' })
        .getAttribute('aria-selected'),
      'true',
    );
    await page.locator('#' + id).waitFor({ state: 'visible' });
  });
  await check(
    'workspace spacing stays consistent across routes and reloads',
    async () => {
      const geometry = () =>
        page.locator('.page-frame:visible').evaluate((element) => {
          const style = getComputedStyle(element);
          return [style.paddingLeft, style.paddingRight];
        });
      await go('/tasks');
      const before = await geometry();
      assert.equal(
        await page
          .getByRole('button', { name: /Use (comfortable|compact) rows/ })
          .count(),
        0,
      );
      await go('/projects');
      assert.deepEqual(await geometry(), before);
      await page.reload();
      assert.deepEqual(await geometry(), before);
    },
  );
  await check('palette traps focus and restores trigger', async () => {
    const trigger = page.getByRole('button', {
      name: 'Search workspace or run a command',
    });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Navigate Holloway' });
    await dialog.waitFor();
    await page.keyboard.press('Shift+Tab');
    assert.equal(
      await page.evaluate(() =>
        document.activeElement.getAttribute('aria-label'),
      ),
      'Close search',
    );
    await page.keyboard.press('Tab');
    assert.equal(
      await page.evaluate(() =>
        document.activeElement.getAttribute('aria-label'),
      ),
      'Search destinations',
    );
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(
      await trigger.evaluate((el) => el === document.activeElement),
      true,
    );
  });
  await check(
    'palette search navigates through shared destinations',
    async () => {
      await page.keyboard.press('Escape');
      await page
        .getByRole('button', { name: 'Search workspace or run a command' })
        .click();
      await page
        .getByRole('combobox', { name: 'Search destinations' })
        .fill('Delivery health');
      await page.keyboard.press('Enter');
      await page.waitForURL('**/webhooks/health');
      assert.equal(await page.locator('a[aria-current=page]').count(), 1);
    },
  );
  await check('status filters retain URLs and browser Back', async () => {
    await go('/contracts');
    await page.getByRole('button', { name: 'Closed', exact: true }).click();
    await page.waitForURL('**/contracts?status=closed');
    await page.goBack();
    assert.equal(new URL(page.url()).search, '');
  });
  await check(
    'mobile navigation traps focus, closes on Escape and navigates',
    async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.getByRole('button', { name: 'Open navigation' }).click();
      await page.getByRole('dialog', { name: 'Main navigation' }).waitFor();
      await page.keyboard.press('Shift+Tab');
      assert.equal(
        await page.evaluate(() =>
          document.activeElement.getAttribute('aria-label'),
        ),
        'Sign out',
      );
      await page.keyboard.press('Escape');
      await page
        .getByRole('dialog', { name: 'Main navigation' })
        .waitFor({ state: 'hidden' });
      assert.equal(
        await page.evaluate(() =>
          document.activeElement.getAttribute('aria-label'),
        ),
        'Open navigation',
      );
      await page.getByRole('button', { name: 'Open navigation' }).click();
      await page
        .getByRole('dialog', { name: 'Main navigation' })
        .getByRole('link', { name: 'Tasks', exact: true })
        .click();
      await page.waitForURL('**/tasks');
      await page
        .getByRole('dialog', { name: 'Main navigation' })
        .waitFor({ state: 'hidden' });
    },
  );
  await check('stale feed has truthful status', async () => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.route('**/api/internal/live-feed', (route) =>
      route.fulfill({ status: 503, body: 'unavailable' }),
    );
    await page.reload();
    await page.getByText('Feed stale', { exact: true }).waitFor();
    for (const width of [390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.getByText('Feed stale', { exact: true }).waitFor();
      await page.locator('header [role=status][aria-label=Current]').waitFor();
      assert.equal(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        ),
        0,
      );
    }
    await page.setViewportSize({ width: 1440, height: 1000 });

    await page.unroute('**/api/internal/live-feed');
  });
  await check(
    'wide contract at 200 percent zoom keeps work readable',
    async () => {
      await go('/contracts/' + fixture(7) + '#conversation');
      await page.setViewportSize({ width: 720, height: 500 });
      await page.waitForTimeout(200);
      assert.equal(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth + 1,
        ),
        false,
      );
      await page.setViewportSize({ width: 1440, height: 1000 });
    },
  );
  // Distinct sessions exercise member, observer, and external visibility.
  for (const role of ['member', 'observer', 'external'])
    await check(role + ' permissions and scoped navigation', async () => {
      const rctx = await browser.newContext({
        viewport: { width: 1280, height: 900 },
      });
      const rp = await rctx.newPage();
      await rp.goto(base + '/login');
      await rp.fill('#email', 'ui-' + role + '@example.test');
      await rp.fill('#password', process.env.UI_AUDIT_PASSWORD);
      await Promise.all([
        rp.waitForURL((u) => u.pathname === '/'),
        rp.click('button[type=submit]'),
      ]);
      const activeWork = rp.locator('section').filter({
        has: rp.getByRole('heading', { name: 'Active work', exact: true }),
      });
      if (role === 'external') {
        await activeWork
          .getByText('No active contracts', { exact: true })
          .waitFor();
      } else {
        await activeWork
          .getByText('Review fixture · waiting for the opening agent', {
            exact: true,
          })
          .waitFor();
        await activeWork
          .getByText('0 of 100 turns used', { exact: true })
          .first()
          .waitFor();
        const titles = await activeWork.locator('strong').allTextContents();
        assert.ok(titles.length > 0 && titles.every((title) => title.trim()));
      }
      await rp.goto(base + '/contracts/' + fixture(1));
      if (role === 'observer') {
        await rp
          .locator('aside[aria-label="Contract context"]:visible')
          .getByText(
            'You are attached as a read-only observer on this contract.',
            { exact: true },
          )
          .waitFor();
        assert.equal(
          await rp
            .getByRole('button', { name: 'Leave a note', exact: true })
            .count(),
          0,
        );
        assert.equal(
          await rp
            .getByRole('button', { name: 'Close Contract', exact: true })
            .count(),
          0,
        );
      } else if (role === 'external') {
        assert.equal(
          await rp
            .getByRole('heading', {
              name: 'Review fixture · waiting for the opening agent',
            })
            .count(),
          0,
        );
      } else {
        await rp
          .locator('#acting-agent')
          .selectOption('20000000-0000-0000-0000-000000000001');
        await rp.waitForFunction(
          () =>
            document.querySelector('#acting-agent')?.value ===
            '20000000-0000-0000-0000-000000000001',
        );
        assert.equal(
          await rp.locator('#acting-agent').inputValue(),
          '20000000-0000-0000-0000-000000000001',
        );
        await rp
          .getByText('Operator notes & questions', { exact: false })
          .filter({ visible: true })
          .click();
        assert.equal(
          await rp
            .getByRole('button', { name: 'Leave a note', exact: true })
            .count(),
          1,
        );
      }
      assert.equal(await rp.locator('a[href="/users"]').count(), 0);
      await rctx.close();
    });
  await check(
    'failed operator save keeps draft and shows feedback',
    async () => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await go('/contracts/' + fixture(1) + '#operator-channel');
      await page
        .getByRole('button', { name: 'Leave a note', exact: true })
        .click();
      const draft = page.getByRole('textbox', { name: 'Standing instruction' });
      await draft.fill('Keep this unsaved instruction after a failed request.');
      let releaseSave;
      const saveGate = new Promise(resolve => { releaseSave = resolve; });
      await page.route('**/contracts/' + fixture(1), async (route) => {
        if (route.request().method() === 'POST') {
          await saveGate;
          await route.fulfill({
            status: 500,
            body: 'Review-only simulated failure',
          });
        } else await route.continue();
      });
      const save = page.getByRole('button', { name: 'Leave note', exact: true });
      const beforeSave = await save.boundingBox();
      await save.click();
      await page.getByRole('status', { name: 'Saving changes', exact: true }).waitFor();
      assert.equal(await save.isDisabled(), true);
      assert.equal((await save.boundingBox()).width, beforeSave.width);
      assert.equal(await page.locator('#operator-channel .loading-spinner:visible').count(), 1);
      releaseSave();
      await page.locator('#operator-channel [role=alert]').waitFor();
      assert.equal(
        await draft.inputValue(),
        'Keep this unsaved instruction after a failed request.',
      );
      await page.unroute('**/contracts/' + fixture(1));
    },
  );
  await ctx.close();
  await browser.close();
  console.log('COMPLETE', outcomes.length, errors.length);
  if (outcomes.some((x) => !x.pass) || errors.length) process.exitCode = 1;
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
