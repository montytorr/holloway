# Premium Holloway workspace

HOL-152 implements the direction in the [audit and plan](audit-and-plan.md): a premium visual system that keeps dense operator workflows. The reference was Marvin V2; Holloway retains its own moss identity, routes, trust controls, and data model.

## Delivered behavior

The shell groups daily work before operations, resources, and administration. Desktop, mobile, search, and route context share one navigation definition. Only the most specific destination is selected, so Delivery health no longer also selects Webhooks. Resources remain reachable through a disclosure. The global activity ticker, ticking clock, and decorative boot delay are removed. The header reports the activity feed connection; page freshness remains a separate, truthful signal. Emergency controls are always reachable.

Dark and light surfaces use the same hierarchy: canvas, section card, recessed controls, and restrained moss selection. Labels use readable sans text; identifiers, code, and aligned numeric data retain mono. Operational text has a 12px floor. Compact and comfortable density change row and panel geometry without shrinking type. Shared page headers, section cards, metadata, empty states, controls, and error surfaces support the same composition throughout the product.

The overview shows four summary metrics, actionable attention, active contracts, recent meaningful activity, and a separate control-plane summary. Routine authentication successes stay in the audit trail instead of filling the overview. No invented trend or overall-health claims are added. Attention prioritizes blocking human questions, blocked work, and approvals using the existing scoped notification source.

Contracts put the complete original brief in the main reading column and metadata in a right inspector. Overview, Conversation, Activity, and Artifacts have directly addressable hash tabs. Blocking human questions appear above routine content. Empty operator notes use a compact disclosure; once an operator opens it, saved notes and resolved answers remain visible. The operator component stays mounted across tabs and hash changes. Messages and question links reveal and scroll to their target. Tab IDs are unique per contract and focus queries stay within the current workspace, including when the router retains previous pages.

Opening-agent state is visible to administrators as well as participants. Expiry, accepted completion, and closure without approval have distinct outcome wording. Original completion gates, observer restrictions, attachment eligibility, linked tasks, related contracts, and status mappings remain in place. Operator saves show pending state, prevent duplicate submission, retain a rejected draft, show inline feedback, and refresh attention badges after success.

Task details also put work before context. The Tasks register now uses serializable project IDs instead of passing a server-created callback into a Client Component; that callback previously crashed populated task lists. Registers preserve URL filters and row destinations. Forms, operations, documentation, settings, administration, authentication, loading, and error pages use the shared foundation and responsive route stylesheets. Static presentation moved out of inline objects so it can adapt to narrow layouts; state-dependent values remain explicit at their call sites.

## Validation

The review environment uses an isolated PostgreSQL database and a loopback application server. Populated application data supports the route sweep. Authored review fixtures exercise waiting, a blocking human question, approval required, accepted completion, closure without acceptance, expiry, pending invitation, and a 30-message thread. Copied webhook destinations are disabled in the review database. No production mutations or deployment are part of verification.

- All 30 dashboard routes, dark and light, at 390 / 768 / 1024 / 1440 / 1920 pixels: **300 passed**, with no skipped routes, horizontal overflow, clipped text, error surfaces, or browser exceptions.
- Eight authored contract states and four public/auth/error pages across both themes and five widths: **120 passed**. An additional **10 blocking-question checks** confirm the open question stays above the tabs.
- **19 interaction checks passed**: operator notes and answers, retained drafts, failure feedback, state wording, message deep links, keyboard tabs, density persistence, palette focus and navigation, URL filters and Back, mobile focus and navigation, stale feed, and a 720px layout equivalent to 200% zoom on a 1440px display.
- Separate super-admin, member, partner observer, and restricted external sessions; acting-agent changes and observer write restrictions.
- **462 unit tests and 86 reactor tests passed**. Lint, TypeScript, and production build passed; unit checks include contrast, cascade, geometry, source policy, and documentation links.
- Browser-computed foreground/surface contrast: **32 pairs passed**, with a minimum **4.58:1** across both themes.
- The deeper 390px dark geometry scan passed all **30 routes with zero findings**, covering text overlap and human wheel scrolling. Closed disclosure contents are excluded using browser visibility, because Chromium can retain their invisible layout rectangles.

The geometry ratchet now caps inline style objects at 316 (baseline 2,183), distinct inline padding at 35, gaps at 6, radii at 15, font weights at 4, and icon sizes at 18. Moving rules into CSS is not itself proof of better layout; authenticated screenshots and browser geometry checks provide the complementary evidence. The docs endpoint-count test reads JSX structure instead of physical lines, and source-policy/contrast matchers tolerate formatting without changing the requirements they check.

Verification covers Chromium. It is not a formal accessibility certification or a live production observation. Safari/Firefox behavior, real operator feedback, and production integration remain release review considerations. The broad change is deliberately delivered as an unmerged pull request under the repository’s artifact policy; no dependency, schema, or data-layer upgrade accompanies it.

## Actual application screenshots

These captures use authored fixtures, not production customer content. The earlier standalone concept files are illustrative; these show the implemented application.

- [Waiting contract, desktop](screenshots/contract-1-dark-1440.png) and [phone](screenshots/contract-1-dark-390.png)
- [Blocking human question, desktop](screenshots/contract-2-dark-1440.png) and [phone](screenshots/contract-2-dark-390.png)
- [Accepted completion](screenshots/contract-4-dark-1440.png) and [closure without approval](screenshots/contract-5-dark-1440.png)
- [Thirty-message conversation](screenshots/contract-7-dark-1440.png)
- [Light theme](screenshots/contract-1-light-1440.png)

The [sanitized verification summary](verification.json) records counts and limits. Detailed browser payloads and session credentials remain local.

## Repeat the browser checks

Install or point to an existing Playwright browser. Start the app against an isolated review database. Supply `UI_AUDIT_BASE`, `UI_AUDIT_EMAIL`, `UI_AUDIT_PASSWORD`, and the detail IDs in `UI_AUDIT_CONTRACT`, `UI_AUDIT_PROJECT`, `UI_AUDIT_TASK`, and `UI_AUDIT_AGENT`. `PLAYWRIGHT_IMPORT` and `CHROMIUM_PATH` can select an existing installation.

Run `node scripts/ui-redesign-check.mjs` for the read-only route sweep. Set `UI_AUDIT_SCREENSHOTS=1` to capture phone and desktop screenshots. Results go to the ignored `ui-audit-shots/redesign` directory; they may include application data and stay local.

For interaction checks, create an isolated database named `ui_review` with the current migrations and a super-admin test account `ui-review@example.test`. Load [the authored fixtures](../../scripts/ui-review-fixtures.sql) into that database. The script refuses any other database name and inherits the test account’s password for its synthetic roles. Keep the app’s webhook worker and mail integration disconnected from external services.

Provide `UI_AUDIT_STORAGE` pointing to the local super-admin Playwright session file and `UI_AUDIT_PASSWORD` matching the test account. Set `UI_REVIEW_ALLOW_WRITES=1`, then run `node scripts/ui-contract-check.mjs`. This test submits notes and answers only to the authored fixtures and refuses a non-loopback host. Reseed before repeating it. Session files and result payloads are local artifacts, never source attachments.

The existing [geometry audit](../../scripts/ui-audit.mjs) remains available for its deeper overlap scan. It now includes the five reference widths, checks the overview route, and excludes intentionally hidden accessible labels from clipping findings.
