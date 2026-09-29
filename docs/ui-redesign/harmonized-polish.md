# Harmonized operator workspace

HOL-158 applies the September 29 screenshot feedback to shared layout rules and the affected workspaces.

The app has one spacing system: 24px desktop gutters, 16px phone gutters and consistent row and panel padding. The density switch is removed. Workspace registers fill the available canvas; forms and documentation retain their intentional width. Loading boundaries use the same page container and width as their destination.

Project and agent registers share column definitions between their headings and rows. Projects have separate status, title, progress, workspace and updated positions. Progress uses a solid, square-edged bar without a gradient or glow.

Project detail uses the same work-left, context-right composition as tasks and contracts. The task heading, creation action and grouped rows belong to one panel. Member controls and task deletion belong in the persistent page header. Project access copy describes the operator consequence without exposing internal response codes.

Task descriptions, contract briefs and conversation messages use their whole work column. Markdown meets the panel padding at both ends. Contract links sit below their metadata labels, so a long task title wraps naturally. Closure outcomes use one compact row and a neutral border; closed contracts no longer repeat an additional “nothing owed” strip. An empty operator channel opens from a small control beside the tabs. Saved notes and questions keep their dedicated panel, and drafts remain mounted across tabs.

The shell retains the page tree while navigation resolves. Next.js loading boundaries own destination fallbacks, avoiding the former delayed second skeleton and component reset. Refreshes no longer restart a pulse subscription simply because a server render reconstructs an equivalent watched-domain array. Live page content does not fade in again on refresh.

Relative labels and task overdue state now use the server render timestamp shared through the refresh boundary. Browser clock skew and minute or second boundaries cannot change the initial client text and force React to regenerate the workspace. The theme toggle also has a stable accessible name in both themes.

## Validation

The read-only [harmonization checks](../../scripts/ui-harmonization-check.mjs) measure populated register columns and detail geometry at 390, 768, 1024, 1440 and 1920px in both themes. They also verify hydration with a browser clock shifted by 65 seconds, a stable live connection during manual refresh, and a retained comment draft during refresh and while delayed navigation resolves. Use an isolated production build with [the authored fixtures](../../scripts/ui-review-fixtures.sql), `UI_AUDIT_BASE`, `UI_AUDIT_STORAGE`, and the browser paths described in [the implementation guide](implementation.md).

The broader route sweep, shell interactions and contract interaction checks remain part of validation. Screenshots below contain authored fixture content only. Raw browser results, copied application data and credentials stay outside source control.

The production build passed **468 application tests**, **88 reactor tests**, lint and TypeScript. Browser validation passed **300 route/theme/width cases**, **120 contract-state and public-page cases**, **24 alignment/clock/refresh checks**, **8 shell interaction cases**, and **24 operator interaction checks**. The deeper 30-route phone overlap scan found no issues. All 32 foreground/surface contrast pairs tested met 4.5:1. The operator checks include member, observer and external roles, failed-save feedback, retained drafts, keyboard controls and 200% zoom.

The [sanitized verification summary](harmonized-verification.json) records the counts and limits.

## Rendered fixtures

These are production-build captures of authored data, at 1440px desktop and 390px phone widths.

| Workspace | Dark desktop | Light desktop | Dark phone | Light phone |
| --- | --- | --- | --- | --- |
| Project | [View](harmonized-screenshots/project-dark-1440.png) | [View](harmonized-screenshots/project-light-1440.png) | [View](harmonized-screenshots/project-dark-390.png) | [View](harmonized-screenshots/project-light-390.png) |
| Task | [View](harmonized-screenshots/task-dark-1440.png) | [View](harmonized-screenshots/task-light-1440.png) | [View](harmonized-screenshots/task-dark-390.png) | [View](harmonized-screenshots/task-light-390.png) |
| Closed contract | [View](harmonized-screenshots/contract-dark-1440.png) | [View](harmonized-screenshots/contract-light-1440.png) | [View](harmonized-screenshots/contract-dark-390.png) | [View](harmonized-screenshots/contract-light-390.png) |
| Conversation | [View](harmonized-screenshots/conversation-dark-1440.png) | [View](harmonized-screenshots/conversation-light-1440.png) | [View](harmonized-screenshots/conversation-dark-390.png) | [View](harmonized-screenshots/conversation-light-390.png) |
