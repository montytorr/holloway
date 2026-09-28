# Holloway UI: audit and redesign plan

28 September 2026 · HOL-151 · Direction: **premium visual design while preserving dense operator workflows**.

## Recommendation

Redesign Holloway as a precise, calm agent workspace. Keep its moss identity and the operational depth; adopt Marvin V2’s discipline in composition, surface hierarchy, controls, and context-preserving inspection.

The central change is **what gets the space and emphasis**. A scope brief needs room to read. A blocking question needs an obvious answer action. A long contract thread needs a comfortable text measure. Metadata needs a compact inspector. Empty content needs a small, explanatory treatment. Each state deserves a deliberate composition.

Start with the shell and contract detail, then migrate the rest of the product through a small set of page patterns. This is a product-wide redesign with staged delivery, not a collection of page-specific polish tickets.

## Review artifacts

- [Interactive concept](concept.html): overview, contract register, and contract detail. Default detail matches the situation in the supplied screenshot.
- [Contract preview](contract-waiting.png), [overview preview](overview-dark-1280.png), [register preview](contracts-dark-1280.png).
- [Light preview](contract-light-1280.png) and [phone preview](contract-dark-390.png).
- [Source inventory](source-inventory.json): reproducible scope, source commit, metrics, and the 30 dashboard page templates.
- [Preview verification](preview-verification.json): browser checks of the standalone concept.

Open the HTML directly in a browser. Switch pages with the sidebar or the command palette; change the contract state, theme, and density. Notes and answers are local demonstrations. All counts and records are sample data. The preview summarizes the screenshot’s brief to demonstrate layout; the real interface must retain the full author-supplied content. Secondary navigation items explain that their pages belong to the plan.

## Evidence and limits

The audit covers the user-supplied Holloway screenshot; Holloway core `c42ba7e361fdc41ff3f89c5fbdee642b6727d88d`, version `1.0.377`; prior UI work HOL-121 and HOL-123; an inventory of all 30 dashboard `page.tsx` templates; deeper review of the shared shell, theme layer, dashboard, contracts, tasks, projects, agents, notifications, and representative operations/documentation components; and Marvin’s `frontendV2` design primitives introduced in `6bb93d8e`.

**This is a screenshot and source audit, not an authenticated live-browser audit of either deployed product.** Some screenshot details differ from the current source, so findings below distinguish visible composition from implementation evidence. All browser checks in this report apply to the new standalone concept. Performance, live-data geometry, accessibility, and role behavior of the production application need baseline measurements before migration.

No application files, production data, deployment configuration, or dependencies were changed. These review artifacts live outside the core checkout.

## Why the previous polish has not solved the problem

HOL-121 established a more coherent visual system. HOL-123 improved contract rows, task activity, agent presentation, and ticker copy. The current code also contains later fixes to reading width, page alignment, and nested scrolling. Those improvements are useful foundations.

The screenshot still exposes a mismatch between page layout and the work being done. The contract is accepted but has no messages. Its main area contains a zero-note operator panel, a waiting strip, and a very wide empty thread. Meanwhile the lengthy review brief occupies the narrow context rail. Improving border radii or text colors cannot resolve that allocation of space.

The design needs shared **page patterns and state patterns**, in addition to shared tokens. Otherwise each route continues to make its own decisions about importance, layout, density, and interaction.

## Findings

| Finding | Evidence | Consequence | Recommended change |
|---|---|---|---|
| **F01 · Contract layout gives the primary work too little room** | Screenshot; [contract layout](https://github.com/montytorr/holloway/blob/c42ba7e361fdc41ff3f89c5fbdee642b6727d88d/src/app/%28dashboard%29/contracts/%5Bid%5D/contract-detail.module.css) reserves a 310–360px context rail; [page](https://github.com/montytorr/holloway/blob/c42ba7e361fdc41ff3f89c5fbdee642b6727d88d/src/app/%28dashboard%29/contracts/%5Bid%5D/page.tsx) places the brief inside it. | Scope wraps into short lines and extends far below an almost empty main column. | Put the full brief in the main reading area, metadata in a right inspector, and conversation in a directly accessible section/tab. |
| **F02 · Empty and populated states use essentially the same page composition** | Screenshot; operator channel renders its own zero counts; thread separately renders `EmptyState`. | Multiple surfaces say very little while requiring several points of attention. | A compact waiting summary plus a small thread entry. Promote the thread when there is content or the operator explicitly opens it. |
| **F03 · The dashboard has eight equally prominent tiles** | [Dashboard client](https://github.com/montytorr/holloway/blob/c42ba7e361fdc41ff3f89c5fbdee642b6727d88d/src/app/%28dashboard%29/dashboard-client.tsx) renders seven statistics plus a system-status tile in a two-row grid. | Volume metrics compete with pending decisions. The dashboard describes the platform before helping the operator act. | Four compact headline measures, followed by the existing attention queue and active work. Put secondary metrics in operations/analytics. |
| **F04 · Navigation colors imply importance unrelated to the current job** | [Sidebar](https://github.com/montytorr/holloway/blob/c42ba7e361fdc41ff3f89c5fbdee642b6727d88d/src/components/sidebar.tsx) exposes 23 destinations for a super admin; [CSS](https://github.com/montytorr/holloway/blob/c42ba7e361fdc41ff3f89c5fbdee642b6727d88d/src/app/globals.css) assigns different group accents and tinted icon tiles. | The shell competes with content; documentation and administrative tools occupy the same visual territory as daily work. | Neutral icons and group labels, moss for the selected destination; daily work first, secondary destinations grouped but reachable. |
| **F05 · Global activity telemetry is visually noisy** | Screenshot; [topbar](https://github.com/montytorr/holloway/blob/c42ba7e361fdc41ff3f89c5fbdee642b6727d88d/src/components/topbar.tsx) combines a ticker, second-by-second UTC clock, connection light, refresh, search, and notifications. | Routine auth successes command attention on every page. Connection status and contract progress appear related even though they are separate. | Quiet connection indicator and contextual freshness. Keep full telemetry in Activity and the inspector; move the clock out of the main shell. |
| **F06 · Token intent and actual typography diverge** | Type scale starts at 12px, but `.upper` and `.pill` remain 11px in [globals.css](https://github.com/montytorr/holloway/blob/c42ba7e361fdc41ff3f89c5fbdee642b6727d88d/src/app/globals.css); dashboard stat labels and contract-register headers also use 11px. | Widespread operational labels still look small and mechanical, particularly at reduced browser zoom. | 14px primary rows/controls; 13px metadata; 12px minimum operational labels. Reserve mono for references, timestamps, code, and numeric alignment. |
| **F07 · Styling is distributed across hundreds of local decisions** | Source inventory: 113 tracked non-email TSX files, 2,183 inline style objects; 70 padding declarations, 29 gap declarations, 18 radius declarations. | A global redesign cannot reliably control geometry or responsive behavior through tokens alone. | Migrate repeated patterns through shared components; reduce variation with each migrated family. Preserve legitimate inline data-driven values. |
| **F08 · Headers, lists, and detail surfaces remain independently authored** | Shared atoms exist, but notifications, registration forms, operational pages, and detail routes still author their own header/toolbar/card compositions. | The product feels like related screens rather than one finished interface. | Shared `PageHeader`, `ListToolbar`, list/register behavior, `SectionCard`, `DetailWorkspace`, and form/document patterns. |
| **F09 · Status copy overstates what was measured** | Dashboard `SystemStatusTile` derives “Operational / All systems nominal” from the kill-switch flag alone; topbar initializes `live` to `true` before its first poll. | Decorative confidence can outrun the underlying evidence. | Separate “Emergency stop inactive,” “Feed connected,” delivery health, and data freshness. Start connection state as checking/unknown until a successful response. |
| **F10 · Navigation selection can be ambiguous** | Sidebar `isActive` accepts any path prefix; `/webhooks` and `/webhooks/health` are separate items. | Both items can be selected on the Health page. | Select the most specific matching destination from a shared navigation definition. |
| **F11 · Artificial startup animation adds a fixed delay** | [Boot screen](https://github.com/montytorr/holloway/blob/c42ba7e361fdc41ff3f89c5fbdee642b6727d88d/src/components/boot-screen.tsx) holds an overlay for 800ms, then fades for 300ms; mounted by [root layout](https://github.com/montytorr/holloway/blob/c42ba7e361fdc41ff3f89c5fbdee642b6727d88d/src/app/layout.tsx). | The interface visibly waits even when content could already be useful. | Replace decorative boot timing with real route/operation loading feedback. |
| **F12 · Layout tests are necessary but cannot judge hierarchy** | Existing [geometry ratchet](https://github.com/montytorr/holloway/blob/c42ba7e361fdc41ff3f89c5fbdee642b6727d88d/src/lib/geometry-ratchet.test.ts) and [browser audit](../../scripts/ui-audit.mjs) catch variation and collisions. | A screen can pass geometry checks while wasting space or making the next action hard to find. | Keep those checks and add a small, stable set of state-based visual references and task-based review criteria. |

The metrics measure literal declaration variation with the same matcher used by the geometry ratchet. They include non-dashboard source and tests and are not counts of individual UI defects. Roughly 41% of the inline style objects sit in four documentation/guide pages; this is a concentrated migration opportunity, not a reason to rewrite every file at once. CSS-module values are outside the TSX ratchet’s scope; for example, several modules still use 550/650 font weights.

## What to carry over from Marvin V2

Marvin’s appeal is an authored system that holds up across lists, summaries, and detail panels. Its implementation provides concrete patterns worth adapting:

| Marvin pattern | Source | Holloway adaptation |
|---|---|---|
| Restrained surface hierarchy | Theme (`Marvin: frontendV2/app/globals.css`), insight primitives (`Marvin: frontendV2/components/ui/insight.jsx`) | Page canvas → section surface → recessed data well, with a subtle moss summary surface where useful. |
| Predictable title/actions layout and sticky-header measurements | PageHeader (`Marvin: frontendV2/components/shell/PageHeader.jsx`) | One page title/action pattern; sticky toolbars and table headers coordinated with the actual header height. |
| Compact, aligned register controls | DataTable (`Marvin: frontendV2/components/data-table/DataTable.jsx`) | Shared row states, sort affordances, column alignment, loading/error behavior, and explicit mobile layouts. |
| Record inspection without losing the list | Panel (`Marvin: frontendV2/components/ui/panel.jsx`) | Optional quick inspection for lists; full routes remain for deep contract/task work and sharing links. |
| Useful numbers embedded in a clear hierarchy | HeroBand / SectionCard / Well (`Marvin: frontendV2/components/ui/insight.jsx`) | Small number of meaningful summary measures, then relevant work; no invented trends or decorative charts. |
| Detail language consistent with page language | Panel insight system (`Marvin: frontendV2/components/panels/insight-panel.jsx`) | The same typography, section headers, and data-well treatment in full details and previews. |

Adapt the principles; keep Holloway’s identity and domain model. Marvin’s purple accent, trading categories, dependency stack, and 11px labels are not requirements for Holloway. Its panel is useful as an interaction reference; audit focus, Escape handling, and layer stacking rather than copying its implementation unexamined.

## Design specification

### Visual language

**Quiet shell, clear content, deliberate signals.** Dark mode uses a cool graphite ground, a slightly brighter panel surface, a third surface for interactive controls, and recessed wells for data. Use borders to distinguish structures, not to box every sentence. A restrained moss tint identifies selection and primary action. Light mode is authored separately with warm neutral ground, white surfaces, readable ink, and subtle elevation.

Retain the existing status mapping in [status-tone.ts](../../src/lib/status-tone.ts): active/in-progress = amber, queued = peri, successful completion/health = mint, failed/blocked = rose, inert = neutral. Brand moss is not success. A closed contract’s lifecycle status must not conceal that its work was unapproved: show the outcome separately and explicitly. Color accompanies text or an icon; it never carries the meaning alone.

Suggested scale:

| Element | Target |
|---|---|
| Page title | 28–30px desktop; 24–26px phone; 600 weight |
| Section title | 15–16px; 600 weight |
| Primary row/control text | 14px |
| Supporting metadata | 13px |
| Operational labels/badges | 12px minimum |
| Brief/message/document prose | 14–15px, line height 1.6–1.75, maximum 65–75ch |
| Hero number | 30–34px, tabular figures |
| Spacing | Existing 4/8/12/16/24/32 scale; optical exceptions documented in control components |
| Radius | 4px small markers, 6–8px controls, 10–12px sections/layers |
| Control heights | 32–36px desktop; adequate independent touch targets on phones |
| Compact list rows | Approximately 44–56px for single-line rows; 56–68px with secondary context |
| Motion | Short 140–200ms feedback; respect reduced motion; no always-moving marquee |

These values are starting points for rendered review, not replacements for the contrast and geometry tests. Do not shrink content to fit dense mode. Compact density changes row height, padding, and gaps, while keeping readable text and reachable controls.

### Shell and navigation

Primary destinations: Overview, Contracts, Projects, Tasks, Agents, Attention. Attention is a clearer presentation of the existing `/notifications` queue, not a new unread-notification system. Activity groups the existing feed/audit/analytics destinations. Infrastructure groups webhooks and delivery health. Administration remains role-scoped. Settings and Docs & help are accessible from persistent secondary controls.

Keep all current URLs, direct links, keyboard navigation, badges, and mobile access. Grouping is an organization of the existing destinations, not deletion of tools. Keep emergency controls reachable from every page through a persistent clearly named control; do not bury them among general settings. Keep acting-agent context visible wherever it affects authority; never silently change the selected actor while opening a detail panel.

The shell carries workspace identity, current location, search, attention, theme, and a truthful connection state. A page header carries its title, scoped context, and permitted actions. Avoid presenting two competing page titles. Persist the rail and density preference without hydration flicker. Select exactly one navigation destination by longest matching path.

### Contract detail: flagship treatment

The supplied screenshot is the first target. Desktop: readable main work area on the left, 280–340px metadata inspector on the right, one page scroller. On a phone, the state and actionable question precede the main content; contextual details remain easy to open or reach.

1. Header: title, lifecycle status, project/task reference, concise identifier, and permitted actions. Closing remains a deliberate secondary action with the existing reason and approval semantics.
2. Single state summary: who owes the next step and why. Show role-aware “your move,” peer waiting, human waiting, or nothing owed, based on existing turn-state computation.
3. Sections: Overview, Conversation, Activity, Artifacts. Persist the selected section in the URL in the product implementation. Deep links to questions and message references select/reveal the relevant content automatically.
4. Overview: full original brief and scope; no autogenerated summary replacing it. A compact conversation preview and a right-hand metadata/participant inspector.
5. Conversation: bounded prose measure, clear sender/type/turn/time, structured payload disclosure, observer visibility, attachments, and completion information. Retain multi-party behavior; do not assume every contract has exactly two agents.
6. Operator channel: notes and questions retain distinct behavior. Empty notes become a compact section. Open blocking questions are promoted above the work area, regardless of the selected section. Resolved questions remain discoverable.
7. Artifacts: uploads and downloads stay governed by linked-task and observer permissions. Source-code review artifacts retain repository links.

State composition:

| State | Main treatment | Must remain visible |
|---|---|---|
| Proposed / partial acceptance | Brief and participant decision state | Which invitees accepted; permitted accept/reject action |
| Accepted, no messages | Full brief; concise first-turn explanation | Expected opening agent and operator-note access |
| Conversation underway | Conversation or last-selected work section | Next actor, turn budget, relevant completion gate |
| Waiting on human | Prominent question and answer action | Who asked, blocking flag, context, answer/dismiss semantics |
| Observer view | Inspectable work and observer context | Permission boundaries; no participant-only actions |
| Completed and approved | Outcome, evidence, and conversation | Actual approval and accepted result |
| Closed without approval / expired | Explicit unresolved outcome and reason | Closure distinct from accepted work; successor linkage |
| Load failure / lost connection | Recoverable error or stale-data disclosure | No false “empty,” “healthy,” or “completed” state |

Tabs are organizational, not hiding places for urgent work. Their counts, selected state, keyboard controls, screen-reader names, and direct-link behavior are part of the implementation.

### Overview and dense registers

Reuse [dashboard-notifications.ts](https://github.com/montytorr/holloway/blob/c42ba7e361fdc41ff3f89c5fbdee642b6727d88d/src/lib/dashboard-notifications.ts) for “Needs your attention.” It already combines questions, blocked work, invitations, assigned work, and approvals with actor-aware visibility. Promote that existing model on the overview; do not create a duplicate attention backend or unread state.

Keep a concise summary band using existing measures. Follow with attention and active work, then meaningful recent changes. Secondary activity/health views retain detailed telemetry. Do not claim overall system health from the kill-switch flag.

Contracts, tasks, projects, agents, deliveries, and audit entries share toolbar behavior, loading states, row selection, and density controls. Their information models differ: use common infrastructure with page-specific column/row definitions rather than forcing every entity into an identical table.

Preserve the grouped task workflow already present in `TaskList`. Compact rows show title, state, owner, key blocker/due information, and readable context. Quick inspection is useful on desktop, but full detail routes remain the primary route for longer work. URL filters and Back behavior must preserve the operator’s place. Bulk actions only appear where the underlying operation and permissions support them.

## Complete route plan

Every existing dashboard page has a migration destination. “Pattern” refers to the intended shared visual/interaction structure, not identical content.

| Existing route | Pattern / treatment | Stage |
|---|---|---|
| `/` | Operator overview: summary, attention, active work | 3 |
| `/contracts` | Dense contract register with filters and contextual inspection | 3 |
| `/contracts/[id]` | State-aware detail workspace; flagship | 2 |
| `/projects` | Aligned project register; invitations remain visible | 3 |
| `/projects/new` | Focused form surface with permission-aware fields | 5 |
| `/projects/[id]` | Project workspace: task groups, blockers, members, invitations | 4 |
| `/projects/[id]/tasks/[tid]` | Task workspace: description, run state, comments, evidence, dependencies | 4 |
| `/tasks` | Cross-project grouped register; retain workflow ordering | 3 |
| `/agents` | Compact registry; trust/ownership/capabilities remain scannable | 3 |
| `/agents/register` | Focused registration form and one-time key handling | 5 |
| `/agents/[id]` | Agent inspector/workspace with trust, policy, keys, and contracts | 4 |
| `/messages` | Message register with bounded previews and contract context | 4 |
| `/notifications` | Attention inbox with decisions separated from routine context | 3 |
| `/approvals` | Decision queue; per-item pending/error feedback | 4 |
| `/feed` | Live event console with pause/filter/freshness, no global ticker dependency | 4 |
| `/audit` | Dense event register; reference detail disclosure | 4 |
| `/analytics` | Purposeful insight sections, accessible charts and date filters | 4 |
| `/protocol-inspector` | Technical inspection workspace; readable graph/data disclosure | 4 |
| `/webhooks` | Delivery configuration register and compact management controls | 4 |
| `/webhooks/health` | Delivery health overview plus failure drill-down | 4 |
| `/webhooks/register` | Focused configuration form | 5 |
| `/kill-switch` | Dedicated emergency surface, reachable globally | 4 |
| `/users` | Administrative register, role-scoped actions | 5 |
| `/admin/emails` | Admin editor workspace with template selection and preview | 5 |
| `/settings` | Focused settings groups; consistent save/error feedback | 5 |
| `/api-docs` | Document shell with contents/navigation and bounded code/prose | 5 |
| `/security` | Document shell; trust model preserved | 5 |
| `/onboarding/human` | Guided document pattern with clear sections and next steps | 5 |
| `/onboarding/agent` | Document/reference pattern with code and command blocks | 5 |
| `/changelog` | Release timeline, readable summaries, expandable detail | 5 |

Also include `/login`, password-reset flows, not-found/global error states, route skeletons, dialogs, upload surfaces, and permission-denied states in the visual-system adoption. They are outside the 30 dashboard templates but inside the finished product’s experience.

## Engineering approach

Evolve the existing application. Keep Next’s server rendering, current data loaders, actor context, route hierarchy, auto-refresh semantics, and authorization enforcement. A visual redesign does not justify a second frontend, framework upgrade, or a new client data architecture.

Suggested component boundary:

```text
Theme tokens + status semantics
  ├─ Controls: Button, IconButton, Badge, SegmentedControl, Field
  ├─ Surfaces: SectionCard, DataWell, SummaryBand, Empty/ErrorState
  ├─ Navigation: shared definition, Sidebar, ShellHeader, command palette
  └─ Page patterns
       ├─ OperatorOverview
       ├─ RecordRegister + ListToolbar + optional RecordPreview
       ├─ DetailWorkspace + ContextInspector + AttentionPanel
       ├─ FormPage
       └─ DocumentPage
```

Build components from proven repeated uses, not a speculative component library. A generic table dependency is optional and should be justified by sorting/selection/virtualization needs. An accessible dialog/popover library may help reduce interaction risk; evaluate it for the layers actually required. Do not adopt Marvin’s entire dependency set.

Move reusable geometry from inline styles into component CSS modules or existing utilities as pages migrate. Keep colors through tokens and status mapping; keep chart positions, progress values, and truly dynamic dimensions inline where appropriate. Lower geometry ratchet ceilings when real counts drop. Extend geometry governance to CSS modules only with checks that measure meaningful policy; do not write tests that merely enforce an arbitrary aesthetic.

## Delivery sequence

| Stage | Concrete deliverable | Completion gate | Indicative focused effort |
|---|---|---|---|
| **0 · Baseline and reference** | Current screenshots, realistic fixture set, route/role/state matrix; refine the concept into rendered reference screens | Baseline production/local app distinguished from mockup; failures recorded | 1–2 days |
| **1 · Foundation and shell** | Tokens, control/surface primitives, shared header/nav, working density, truthful connection state, remove decorative boot delay | Dark/light shell; keyboard/mobile navigation; all current destinations reachable; status colors preserved | 2–3 days |
| **2 · Contract flagship** | Full contract detail and operator channel through all major states | Long brief, long thread, human question, observer, approval and closure cases pass visual/interaction review | 2–3 days |
| **3 · Daily work** | Overview, attention, contracts/projects/tasks/agents registers | Dense flows, URL filters, scoped counts, row navigation and Back behavior work | 3–4 days |
| **4 · Deep work and operations** | Project/task/agent details, messages, approvals, feed, audit, analytics, protocol inspector, webhooks, emergency page | Existing actions and permission gates remain correct; stale/error feedback and telemetry clear | 4–6 days |
| **5 · Finish and release** | Forms, docs, settings, admin, auth/error/loading surfaces; complete browser sweep | Every route/theme/role/state checked; no old visual pattern left in primary flows | 3–4 days |

Estimated **15–22 focused engineering days**, plus asynchronous review/deployment time. This is a planning range for a comprehensive pass, not a delivery promise; Stage 0 may reveal data or permission issues that change it. The first visible milestone—shell plus contract flagship—is about 5–8 days including baseline work.

Each stage can contain a small number of reviewable PRs. Stage 1 changes affect all routes, so check the full route matrix even before individual pages migrate. Stage 2 establishes the detail pattern before propagating it. Stage 3 establishes list behavior before the operational registers. Ship bounded slices through the existing CI/deploy process and keep rollback possible through the previous release. Do not combine unrelated backend changes with visual migrations.

## Validation and acceptance

### Task-based visual gates

- From the overview, identify the highest-priority actionable item without inspecting unrelated statistics.
- From a contract, identify who owes the next step, read the original brief comfortably, and locate the answer/note/approval action appropriate to the viewer.
- An accepted contract with zero messages must explain the first turn without allocating its main reading space to emptiness.
- A blocking human question is visible before routine details; opening a deep link to it does not leave it hidden behind a tab.
- A long thread remains readable on a wide display; metadata does not determine prose line length.
- A closed-but-unapproved contract visibly differs from accepted completed work.
- Operators can scan dense lists, inspect a record, and return with filters, selection, and place preserved.
- Phone layouts prioritize work and keep context reachable without collisions or a page-wide horizontal scrollbar.

### Checks before each release

Keep the existing unit, reactor, lint, build, and CI checks appropriate to the slice. Preserve the contrast, cascade, and geometry suites. Use `scripts/ui-audit.mjs` against a running app with production-shaped fixtures, adapting it where necessary to include new patterns and loading behavior.

Visual reference widths: **390, 768, 1024, 1440, 1920px**, both themes. Test long identifiers/titles, multi-party contracts, deeply nested markdown, large message bodies, attachments, empty filters, partial data, pending operations, backend errors, and stale connections. Check 200% zoom as well as ordinary viewports.

Roles/context: super admin; ordinary owner/member; observer; restricted external/partner actor; acting-agent changes. Route visibility and action eligibility must match the existing server policy. A polished disabled control is not a substitute for authorization.

Keyboard/accessibility: visible focus, complete navigation and form operation, correct tab/dialog semantics, focus restoration, Escape ownership when layers stack, chart text alternatives, reduced motion, and labeled icon controls. Measure text contrast at 4.5:1 and relevant large text/component contrast at 3:1 on actual composited surfaces.

Freshness/performance: establish actual baseline measurements before claiming improvement. Check shell paint and navigation, avoid mount-time decorative delays, avoid clearing drafts during auto-refresh, and distinguish last-known data from a fresh success. Connection status must describe its specific source rather than imply overall health.

### What has already been verified for this concept

The standalone preview is checked in Chromium over three views × two themes × four widths (390/768/1280/1920), plus four contract states at 1440px: **28 layout checks**. Verification also exercises ten interactions: keyboard tabs, local note save, local question answer, search, status filter, attention drill-down, theme, density, palette/Escape, and mobile navigation. The browser report is separate from application validation and does not establish production accessibility or correctness.

## Immediate implementation boundary

This turn delivers the audit, complete route plan, and a reviewable visual direction. The next implementation slice is Stage 0 followed by shared shell/foundations and contract detail. No production rollout is implied by this design study. Successful implementation means the dense operator workflows are preserved and the premium treatment is consistent through the whole product, including its difficult states.
