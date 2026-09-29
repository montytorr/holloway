/** Read-only regression checks for layout geometry and refresh continuity.
 * Requires the authored ui_review fixtures, local storage state and a running
 * production build. Results and screenshots remain local unless inspected. */
import assert from "node:assert/strict";
import fs from "node:fs";
const { chromium } = await import(
  process.env.PLAYWRIGHT_IMPORT || "playwright"
);
const base = process.env.UI_AUDIT_BASE || "http://localhost:3128";
if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(base).hostname))
  throw new Error("Use an isolated local review app.");
if (!process.env.UI_AUDIT_STORAGE) throw new Error("Supply UI_AUDIT_STORAGE.");
const output = process.env.UI_AUDIT_OUTPUT || "ui-audit-shots/harmonized";
fs.mkdirSync(output, { recursive: true });
const fixture = (n) => `30000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const project = "/projects/40000000-0000-0000-0000-000000000001";
const task = `${project}/tasks/60000000-0000-0000-0000-000000000001`;
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : {},
);
const results = [],
  errors = [];
const check = async (name, work) => {
  try {
    await work();
    results.push({ name, pass: true });
    console.log("PASS", name);
  } catch (error) {
    results.push({ name, pass: false, error: error.message });
    console.log("FAIL", name, error.message);
  }
  fs.writeFileSync(
    `${output}/results.json`,
    JSON.stringify({ results, errors }, null, 2),
  );
};
const aligned = async (page) =>
  page.evaluate(() => {
    const head = document.querySelector('[class*="columns"]');
    if (!head?.checkVisibility()) return [];
    const columns = [...head.children];
    const failures = [];
    const rows = head.parentElement.querySelectorAll(":scope > a");
    if (!rows.length) throw new Error("Expected populated register rows");
    for (const anchor of rows) {
      const row = anchor.querySelector("article") || anchor;
      for (let i = 0; i < columns.length; i++) {
        if (!columns[i].checkVisibility()) continue;
        const header = columns[i].getBoundingClientRect(),
          cell = row.children[i]?.getBoundingClientRect();
        if (
          !cell ||
          Math.abs(header.x - cell.x) > 1 ||
          (row.children[i].tagName.toLowerCase() !== "svg" &&
            Math.abs(header.width - cell.width) > 1)
        )
          failures.push({
            column: i,
            header: [header.x, header.width],
            cell: cell && [cell.x, cell.width],
          });
      }
    }
    return failures;
  });
const watchErrors = (page) => {
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /hydrat|server rendered/i.test(message.text())
    )
      errors.push(message.text());
  });
};
const go = async (page, path) => {
  const response = await page.goto(base + path);
  if (response) assert.equal(response.status(), 200);
  await page.waitForFunction(() =>
    ["Current", "Not updating", "Connected", "Feed stale"].includes(
      document
        .querySelector("header [role=status]")
        ?.getAttribute("aria-label"),
    ),
  );
  // React streams hidden replacement markup before hydration commits it.
  // Measure the settled workspace rather than that temporary duplicate tree.
  await page.waitForFunction(() => {
    const frames = [...document.querySelectorAll(".page-frame")];
    return (
      frames.length === 1 &&
      frames[0].checkVisibility() &&
      !document.querySelector('[aria-busy="true"][aria-label^="Loading "]')
    );
  });
};
try {
  for (const theme of ["dark", "light"]) {
    const context = await browser.newContext({
      storageState: process.env.UI_AUDIT_STORAGE,
    });
    await context.addInitScript((value) => {
      localStorage.setItem("theme", value);
      localStorage.setItem("a2a:comfortable-density", "true");
    }, theme);
    const page = await context.newPage();
    watchErrors(page);
    for (const width of [390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      await check(
        `register columns, flat progress and spacing ${theme} ${width}`,
        async () => {
          await go(page, "/projects");
          assert.deepEqual(await aligned(page), []);
          const bars = await page
            .locator("[role=progressbar]")
            .evaluateAll((nodes) =>
              nodes.map((node) => {
                const fill = getComputedStyle(node.firstElementChild),
                  track = getComputedStyle(node);
                return [
                  fill.backgroundImage,
                  fill.boxShadow,
                  track.borderRadius,
                ];
              }),
            );
          assert.ok(
            bars.length > 0,
            "Expected populated project progress bars",
          );
          assert.ok(
            bars.every(
              (bar) =>
                JSON.stringify(bar) === JSON.stringify(["none", "none", "0px"]),
            ),
            "Progress styling: " + JSON.stringify(bars),
          );
          const gutter = await page
            .locator(".page-frame:visible")
            .evaluate((node) => getComputedStyle(node).paddingLeft);
          assert.equal(gutter, width <= 640 ? "16px" : "24px");
          assert.equal(
            await page
              .getByRole("button", { name: /Use (comfortable|compact) rows/ })
              .count(),
            0,
          );
          await go(page, "/agents");
          assert.deepEqual(await aligned(page), []);
          await go(page, "/contracts");
          assert.deepEqual(await aligned(page), []);
        },
      );
      await check(
        `detail workspaces and actions ${theme} ${width}`,
        async () => {
          await go(page, task);
          const description = page.locator(".markdown-preview:visible").first();
          assert.ok(
            (await description.boundingBox()).width >
              (await description.locator("p").first().boundingBox()).width - 1,
          );
          assert.equal(
            await description.evaluate(
              (node) => getComputedStyle(node).maxWidth,
            ),
            "none",
          );
          await page
            .locator("header")
            .getByRole("button", { name: "Delete task", exact: true })
            .waitFor();
          await go(page, project);
          await page
            .getByText(
              "Turn this off to prevent observers from opening this project.",
              { exact: true },
            )
            .filter({ visible: true })
            .waitFor();
          await page
            .getByRole("region", { name: "Project tasks", exact: true })
            .getByRole("button", { name: "+ New task", exact: true })
            .waitFor();
          await page
            .getByRole("button", { name: "Add member", exact: true })
            .click();
          const menu = page.locator('[class*="detail5"]:visible');
          const box = await menu.boundingBox();
          assert.ok(box.x >= 0 && box.x + box.width <= width + 1);
          await page.keyboard.press("Escape");
          await go(page, "/contracts/" + fixture(4));
          const prose = page.locator(
            '[class*="brief"] .markdown-preview:visible',
          );
          assert.equal(
            await prose.evaluate((node) => getComputedStyle(node).maxWidth),
            "none",
          );
          if (width >= 1440) {
            assert.ok(
              (
                await page
                  .locator('.card[class*="outcome"]:visible')
                  .boundingBox()
              ).height < 110,
            );
            assert.ok(
              (
                await page
                  .getByRole("tabpanel", { name: "Overview", exact: true })
                  .boundingBox()
              ).y < 300,
            );
          }
          if (width === 390) {
            const bounds = await page.getByRole("tablist").boundingBox();
            for (const box of await page
              .getByRole("tab")
              .evaluateAll((nodes) =>
                nodes.map((node) => node.getBoundingClientRect().right),
              ))
              assert.ok(box <= bounds.x + bounds.width + 1);
          }
          const kv = page
            .locator('aside[aria-label="Contract context"] .kv')
            .filter({
              has: page.getByRole("link", {
                name: "Review fixture · release audit",
                exact: true,
              }),
            });
          const label = await kv.locator(".kv-label").boundingBox(),
            value = await kv.locator(".kv-value").boundingBox();
          assert.ok(value.y > label.y && Math.abs(value.x - label.x) < 1);
          if ([390, 1440].includes(width))
            await page.screenshot({
              path: `${output}/contract-${theme}-${width}.png`,
            });
          await go(page, "/contracts/" + fixture(7) + "#conversation");
          assert.equal(
            await page
              .locator('[class*="messageBody"]:visible')
              .first()
              .evaluate((node) => getComputedStyle(node).maxWidth),
            "none",
          );
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth - innerWidth,
            ),
            0,
          );
        },
      );
    }
    for (const [name, path] of [
      ["project", project],
      ["task", task],
      ["conversation", "/contracts/" + fixture(7) + "#conversation"],
    ]) {
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await go(page, path);
        await page.screenshot({
          path: `${output}/${name}-${theme}-${width}.png`,
        });
      }
    }
    await context.close();
  }
  for (const theme of ["dark", "light"]) {
    await check(
      `hydration stays stable across clock boundaries ${theme}`,
      async () => {
        const context = await browser.newContext({
          storageState: process.env.UI_AUDIT_STORAGE,
          viewport: { width: 1440, height: 1000 },
        });
        await context.addInitScript((value) => {
          const now = Date.now.bind(Date);
          Date.now = () => now() + 65_000;
          localStorage.setItem("theme", value);
        }, theme);
        const page = await context.newPage();
        watchErrors(page);
        try {
          for (const path of [
            task,
            project,
            "/projects",
            "/tasks",
            "/audit",
            "/approvals",
            "/webhooks",
            "/webhooks/health",
          ]) {
            await go(page, path);
            await page.waitForTimeout(250);
          }
        } finally {
          await context.close();
        }
      },
    );
  }
  const context = await browser.newContext({
    storageState: process.env.UI_AUDIT_STORAGE,
    viewport: { width: 1440, height: 1000 },
  });
  await context.addInitScript(() => {
    window.__pulse = { opens: 0, closes: 0 };
    const Native = EventSource;
    window.EventSource = class extends Native {
      constructor(...args) {
        super(...args);
        this.tracked = String(args[0]).includes("/api/internal/pulse");
        if (this.tracked) window.__pulse.opens++;
      }
      close() {
        if (this.tracked) window.__pulse.closes++;
        super.close();
      }
    };
  });
  const page = await context.newPage();
  watchErrors(page);
  await check(
    "manual refresh keeps the live connection and content mounted",
    async () => {
      await go(page, "/webhooks/health");
      const before = await page.evaluate(() => ({ ...window.__pulse }));
      await page.evaluate(
        () => (window.__frame = document.querySelector(".page-frame")),
      );
      const response = page.waitForResponse(
        (response) =>
          response.request().headers().rsc === "1" &&
          response.url().includes("/webhooks/health"),
      );
      await page
        .getByRole("button", { name: "Refresh current page", exact: true })
        .click();
      await response;
      await page.waitForTimeout(400);
      assert.deepEqual(await page.evaluate(() => window.__pulse), before);
      assert.equal(await page.evaluate(() => window.__frame.isConnected), true);
      assert.equal(
        await page
          .locator(".animate-fade-in:visible")
          .evaluateAll((nodes) =>
            nodes.every(
              (node) => getComputedStyle(node).animationName === "none",
            ),
          ),
        true,
      );
    },
  );
  await check(
    "refresh and slow navigation retain the unfinished task draft",
    async () => {
      let release, requested;
      const gate = new Promise((resolve) => (release = resolve)),
        seen = new Promise((resolve) => (requested = resolve));
      await page.route("**/webhooks/health*", async (route) => {
        requested();
        await gate;
        await route.continue();
      });
      try {
        await go(page, task);
        const draft = page.getByRole("textbox", {
          name: "Add to the conversation",
        });
        await draft.fill("Unsubmitted review draft");
        await draft.evaluate((node) => (window.__draft = node));
        const refresh = page.waitForResponse(
          (response) =>
            response.request().headers().rsc === "1" &&
            response.url().includes(task),
        );
        await page
          .getByRole("button", { name: "Refresh current page", exact: true })
          .click();
        await refresh;
        await page.waitForTimeout(400);
        assert.equal(await draft.inputValue(), "Unsubmitted review draft");
        assert.equal(
          await page.evaluate(() => window.__draft.isConnected),
          true,
        );
        await page
          .locator('a[href="/webhooks/health"]:visible')
          .first()
          .click();
        await Promise.race([
          seen,
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Destination was not requested")),
              5000,
            ),
          ),
        ]);
        await page.waitForTimeout(450);
        assert.equal(
          await page.evaluate(() => window.__draft.isConnected),
          true,
        );
        assert.equal(await draft.inputValue(), "Unsubmitted review draft");
      } finally {
        release();
      }
      await page.waitForURL("**/webhooks/health");
    },
  );
  await context.close();
} finally {
  await browser.close();
}
assert.deepEqual(errors, []);
assert.ok(
  results.every((result) => result.pass),
  `${results.filter((result) => !result.pass).length} checks failed`,
);
