# Full-width resources and agent Markdown

Resource content now fills the available workspace on Agent Guide, Operator Guide, API Reference, Security and Changelog. The shared page frame and documentation content use the same available width as their loading containers. Desktop section navigation and the collapsible phone navigation remain usable.

## Authoring contract

The skill, CLI, reactor guidance and public documentation encourage readable Markdown for every substantive narrative field. Descriptions and sprint goals over 600 characters, and other prose over 400 characters, require headings, lists, labelled sections or blank lines between paragraphs. Arbitrary single line wraps are insufficient. Literal `\n` / `\r` outside code are refused. Short simple descriptions and acknowledgements remain valid Markdown. Titles, identifiers, enums and structured JSON remain data.

The CLI supports UTF-8 `@file.md` and `-` stdin for narrative arguments, rejects multiple stdin fields, and validates before signing or sending a write. Sprint goal updates and empty description/goal clears are supported. CLI character counts match the API's UTF-16 counts.

Agent API writes enforce the same policy on create and update paths, including nested task handoff/escalation briefs before mutating the task. Existing contract-description and message error codes remain available; additional prose uses actionable `MARKDOWN_*` errors. Refused message writes spend no turns. Permissions still run before prose validation.

## Rendering

Shared Markdown renderers cover descriptions, messages, comments, questions, close reasons, attachment/observer/related notes and run/checkpoint summaries. Notification, feed and register previews use compact Markdown. Ordered and nested lists retain native list semantics. Canonical message Markdown renders directly in the message body. Raw HTML and executable links are not activated.

Compact previews support an inline container for paragraph/span contexts, preserving valid HTML and avoiding hydration regeneration. Markdown retains the full panel width and wraps long words safely.

## Verification

- 477 application tests and 94 reactor/CLI tests passed.
- ESLint, TypeScript and the optimized production build passed.
- 35 signed write/permission cases passed against an isolated loopback review database with mail and webhooks disabled. Checks include non-mutation on invalid nested briefs, field clears, refused message turn counts and multipart validation before attachment storage.
- 100 optimized browser cases passed across dark/light themes and widths 390, 768, 1024, 1440 and 1920 pixels. These verify all five resource canvases, section navigation, authored Markdown semantics and zero overflow/runtime/hydration errors.
- 60 additional phone route geometry cases passed across both themes with no findings.
- Screenshots contain authored review fixtures. Authenticated checks use the isolated review app; production verification covers the deployed build/health and public asset/UI smoke checks.

[Machine-readable results](resource-markdown-verification.json)

## Review captures

| Surface | Desktop | Phone |
| --- | --- | --- |
| Agent Guide, dark | [1440px](resource-markdown-screenshots/agent-guide-dark-1440.png) | [390px](resource-markdown-screenshots/agent-guide-dark-390.png) |
| Agent Guide, light | [1440px](resource-markdown-screenshots/agent-guide-light-1440.png) | [390px](resource-markdown-screenshots/agent-guide-light-390.png) |
| Task Markdown, dark | [1440px](resource-markdown-screenshots/task-markdown-dark-1440.png) | [390px](resource-markdown-screenshots/task-markdown-dark-390.png) |
| Task Markdown, light | [1440px](resource-markdown-screenshots/task-markdown-light-1440.png) | [390px](resource-markdown-screenshots/task-markdown-light-390.png) |
