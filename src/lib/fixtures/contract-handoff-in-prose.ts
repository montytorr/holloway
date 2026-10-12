/**
 * Invented messages modelled on a contract where two agents handed the move to
 * a person in prose three times and never asked one. The lengths, line shapes
 * and handoff phrasings match the ones that happened; the names, SHAs and work
 * are made up. Shared by the tests of the rules written because of it.
 */

/** Turn 3, alpha: a single paragraph naming Alex/Sam as next owner. */
export const TURN_3 = "I accept both P2 findings as actionable review blockers at exact head 3f9c2e7a1b5d8046c2e9f17a3b6d0c5e8f2a4b71; approval is withheld. The pagination path needs a stable sort key that orders unread items ahead of read items before applying the requested page size, plus a page-size-1 mixed-state regression. The search path needs the same workspace/team/global visibility predicate as the list endpoint and the export job, plus a cross-workspace negative and same-workspace/global positives. Your sandbox and network limitations and migration 012-015 rollout cautions remain explicit; no test pass or deployment safety is inferred. This contract authorizes review/discussion only and explicitly forbids code edits, new tasks, or push, so I will not implement a corrected SHA under it. Next owner: Alex/Sam to authorize a separate implementation scope; then Alpha can supply a new exact SHA and CI evidence. Next reviewer: Beta to verify that revision. PR 42 remains open and unmerged.";

/** Turn 4, beta: spent a turn agreeing that a person must decide. */
export const TURN_4 = "Both P2 findings are now accepted as blockers at `3f9c2e7a1b5d8046c2e9f17a3b6d0c5e8f2a4b71`; I reconfirmed the local remote ref still points there and the workspace is clean. I agree this contract permits review and discussion only, not implementing fixes. No approval is granted on this revision.\n\n**Next owner — Alex/Sam:** decide whether to authorize a separate implementation scope for Alpha to fix the two findings. **After authorization — Alpha:** deliver a new exact branch SHA and CI evidence, including page-size-1 mixed-state and cross-workspace search and export regressions. **Then — Beta:** independently review that exact revision and migration 012–015 rollout risks. Alex/Sam retain the merge and deployment decisions. PR 42 remains open and unmerged; this contract remains open pending that decision.";

/** Turn 10, alpha: one paragraph on one line, legal under the old 600 rule. */
export const TURN_10 = "I accept the P1 last_seen_at regression as a blocker at SHA 8d41b6e09a2c7f35e1d90b4a6c83f2e75b19d0a4; approval remains withheld. Keep last_seen_at unchanged for read-receipt and backfill writes, while real content edits still advance it. Add DB coverage for inbox hit/miss, direct open, backfill, and digest behavior; assess write amplification and migration locks. I do not claim independent DB or CI verification. Next: Alex/Sam authorize this fix scope; Alpha supplies a new exact SHA and DB/CI evidence; Beta reviews it. PR 42 stays open and unmerged.";
