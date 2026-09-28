/** Authenticated, read-only route smoke across themes and layout widths.
 * Requires a running isolated review app and operator credentials. No writes.
 * UI_AUDIT_BASE, UI_AUDIT_EMAIL, UI_AUDIT_PASSWORD; detail fixture IDs below.
 * PLAYWRIGHT_IMPORT and CHROMIUM_PATH select an existing browser installation.
 * Output contains application metadata: keep ui-audit-shots local.
 */
import fs from 'node:fs';
const { chromium } = await import(
  process.env.PLAYWRIGHT_IMPORT || 'playwright'
);
const base = process.env.UI_AUDIT_BASE || 'http://localhost:3100';
const fixture = (key) => process.env[`UI_AUDIT_${key}`];
const contract = fixture('CONTRACT'),
  project = fixture('PROJECT'),
  task = fixture('TASK'),
  agent = fixture('AGENT');
const routes = [
  ['overview', '/'],
  ['contracts', '/contracts'],
  ['contract', contract && `/contracts/${contract}`],
  ['messages', '/messages'],
  ['agents', '/agents'],
  ['agent', agent && `/agents/${agent}`],
  ['agent-register', '/agents/register'],
  ['projects', '/projects'],
  ['project', project && `/projects/${project}`],
  ['task', project && task && `/projects/${project}/tasks/${task}`],
  ['project-new', '/projects/new'],
  ['tasks', '/tasks'],
  ['protocol', '/protocol-inspector'],
  ['feed', '/feed'],
  ['analytics', '/analytics'],
  ['attention', '/notifications'],
  ['approvals', '/approvals'],
  ['audit', '/audit'],
  ['webhooks', '/webhooks'],
  ['delivery-health', '/webhooks/health'],
  ['webhook-register', '/webhooks/register'],
  ['security', '/security'],
  ['api', '/api-docs'],
  ['changelog', '/changelog'],
  ['settings', '/settings'],
  ['users', '/users'],
  ['emergency', '/kill-switch'],
  ['agent-guide', '/onboarding/agent'],
  ['human-guide', '/onboarding/human'],
  ['emails', '/admin/emails'],
];
const widths = (process.env.UI_AUDIT_WIDTHS || '390,768,1024,1440,1920')
  .split(',')
  .map(Number);
const output = process.env.UI_AUDIT_OUTPUT || 'ui-audit-shots/redesign';
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : {}),
});
const results = [];
try {
  let auth;
  if (process.env.UI_AUDIT_STORAGE) auth = process.env.UI_AUDIT_STORAGE;
  else {
    if (!process.env.UI_AUDIT_EMAIL || !process.env.UI_AUDIT_PASSWORD)
      throw new Error(
        'Set UI_AUDIT_EMAIL and UI_AUDIT_PASSWORD for the isolated review app.',
      );
    const login = await browser.newContext();
    const page = await login.newPage();
    await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[type=email]', process.env.UI_AUDIT_EMAIL);
    await page.fill('input[type=password]', process.env.UI_AUDIT_PASSWORD);
    await Promise.all([
      page.waitForURL((url) => !url.pathname.startsWith('/login')),
      page.click('button[type=submit]'),
    ]);
    auth = await login.storageState();
    await login.close();
  }
  for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({
      storageState: auth,
      viewport: { width: 1440, height: 1000 },
    });
    await context.addInitScript(
      (value) => localStorage.setItem('theme', value),
      theme,
    );
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const [name, route] of routes) {
      if (!route) {
        results.push({ name, theme, skipped: 'Missing detail fixture ID' });
        continue;
      }
      const before = errors.length;
      let response;
      try {
        response = await page.goto(base + route, {
          waitUntil: 'domcontentloaded',
          timeout: 60000,
        });
      } catch (error) {
        results.push({ name, theme, unreachable: error.message });
        continue;
      }
      await page.waitForFunction(() =>
        document.documentElement.classList.contains(
          localStorage.getItem('theme'),
        ),
      );
      // Wait for the persistent shell to hydrate before interaction or measurement.
      await page.waitForFunction(
        () =>
          document.querySelector('header [role=status]')?.textContent !==
          'Connecting',
      );
      for (const width of widths) {
        await page.setViewportSize({ width, height: 1000 });
        const metrics = await page.evaluate(() => {
          const root = document.documentElement,
            clipped = [];
          const content = document.querySelector('main') || document.body;
          for (const element of content.querySelectorAll('*')) {
            const box = element.getBoundingClientRect(),
              css = getComputedStyle(element);
            if (
              !box.width ||
              !box.height ||
              css.visibility === 'hidden' ||
              css.clip !== 'auto' ||
              css.clipPath !== 'none'
            )
              continue;
            if (
              element.children.length ||
              !element.textContent.trim() ||
              !element.clientWidth ||
              ['PRE', 'CODE', 'OPTION'].includes(element.tagName)
            )
              continue;
            if (
              element.scrollWidth <= element.clientWidth + 3 ||
              css.textOverflow === 'ellipsis' ||
              ['auto', 'scroll'].includes(css.overflowX)
            )
              continue;
            clipped.push({
              tag: element.tagName,
              className: String(element.className),
              width: element.clientWidth,
              needs: element.scrollWidth,
            });
          }
          return {
            overflow: root.scrollWidth - root.clientWidth,
            errorPage:
              document.body.innerText.includes('This page couldn’t load') ||
              document.body.innerText.includes('Application error'),
            clipped,
          };
        });
        const record = {
          name,
          theme,
          width,
          status: response.status(),
          ...metrics,
          errors: errors.slice(before),
        };
        results.push(record);
        const failed =
          record.status >= 400 ||
          record.overflow > 1 ||
          record.errorPage ||
          record.clipped.length ||
          record.errors.length;
        console.log(`${failed ? 'FAIL' : 'PASS'} ${name} ${theme} ${width}`);
        if (
          process.env.UI_AUDIT_SCREENSHOTS === '1' &&
          [390, 1440].includes(width)
        )
          await page.screenshot({
            path: `${output}/${name}-${theme}-${width}.png`,
          });
        fs.writeFileSync(
          `${output}/results.json`,
          JSON.stringify(results, null, 2),
        );
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}
const failed = results.filter(
  (record) =>
    record.unreachable ||
    record.status >= 400 ||
    record.overflow > 1 ||
    record.errorPage ||
    record.clipped?.length ||
    record.errors?.length,
);
console.log(
  JSON.stringify({
    cases: results.filter((record) => record.width).length,
    skipped: results.filter((record) => record.skipped).length,
    failed: failed.length,
  }),
);
if (failed.length) process.exitCode = 1;
