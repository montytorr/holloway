# Uniform loading across the operator workspace

HOL-159 addresses the raw contract-filter loading row, the long filter wait, and inconsistent feedback across the application.

Filters retain the current register and its geometry while the server resolves the next result. A thin, delayed header progress line communicates navigation, filtering, pagination and manual refresh. Selection updates immediately, rapid changes compose against the latest intent, and search submits one debounced request per typing burst. Browser Back restores the URL's selection and search. Leaving a page cancels its pending search before it can navigate back.

Initial loading uses shared skeleton primitives inside the destination's page container. Lists, forms, detail workspaces, documents and overview pages share the same surfaces, gutters, quiet shimmer and thin borders. Local previews and feed fetches use the same skeleton treatment. Busy controls share a small spinner; overlapping inactive and active labels reserve their width so controls do not jump. Motion is disabled when the operator requests reduced motion.

Links fetch dynamic operator pages when they are opened. The previous automatic sidebar and row prefetches created competing requests: the first reproduced contract filter change issued 46 RSC requests. The final build issues one request per change. The contract register also selects only displayed contract fields and the open question metadata needed for its status badges, preserving existing scope and turn-state rules.

## Production-only transition delay

The initial optimized build still showed intermittent waits of about 15 seconds after the server had finished sending the page. Diagnostic browser instrumentation found suspended React lanes with no pending promises and no recorded ping. The bundled renderer had the synchronous-during-render ping bug addressed by [React PR #36134](https://github.com/react/react/pull/36134).

Next.js and its matching ESLint configuration move from 16.2.1 to stable 16.3.6, whose bundled renderer includes the upstream fix. The production build typechecks the existing `.ts` test imports with `allowImportingTsExtensions`, alongside `noEmit`. Attachment binaries are marked as runtime filesystem data so tracing does not include the entire repository. The installed framework carries the renderer fix; browser diagnostic substitutions remain outside the repository.

## Measured filter response

Both runs used an isolated production build, the same local database and the same six filter selections. These are local measurements, not a promise of live network latency.

| Selection | Previous build | Final build | Previous RSC requests | Final RSC requests |
| --- | ---: | ---: | ---: | ---: |
| All | 15,069 ms | 953 ms | 46 | 1 |
| Closed | 3,332 ms | 681 ms | 7 | 1 |
| Active | 152 ms | 369 ms | 1 | 1 |
| All | 10,259 ms | 1,902 ms | 1 | 1 |
| Closed | 500 ms | 771 ms | 1 | 1 |
| All | 2,878 ms | 1,073 ms | 1 | 1 |

Median completion time falls from 3,105 ms to 862 ms. The previously observed 15-second transition stalls were absent in the final run.

## Validation

The [verification summary](uniform-loading-verification.json) records the final application, reactor, browser and production-build checks. The isolated fixtures include a recent terminal delivery on an inactive webhook, so the delivery filter is exercised without dispatching an event.

The loading checks exercise delayed server responses, retained register geometry, rapid combined filters, debounced search, cancellation during a delayed departure, browser Back, manual refresh, streamed task skeletons, and busy controls. They run in dark and light themes at 390px and 1440px. A short lock on `task_comments` in the loopback-only `ui_review` database produces a real streamed fallback; the transaction is rolled back before content verification. Reduced-motion behavior is checked on skeletons and spinners. The geometry audit checks CSS visibility so the intentionally hidden width-reservation label is not counted as visible text.

## Authored captures

| State | Dark desktop | Light desktop | Dark phone | Light phone |
| --- | --- | --- | --- | --- |
| Filter pending with results retained | [View](loading-screenshots/filter-pending-dark-1440.png) | [View](loading-screenshots/filter-pending-light-1440.png) | [View](loading-screenshots/filter-pending-dark-390.png) | [View](loading-screenshots/filter-pending-light-390.png) |
| Streamed task skeleton | [View](loading-screenshots/task-skeleton-dark-1440.png) | [View](loading-screenshots/task-skeleton-light-1440.png) | [View](loading-screenshots/task-skeleton-dark-390.png) | [View](loading-screenshots/task-skeleton-light-390.png) |
