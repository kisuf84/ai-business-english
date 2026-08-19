/**
 * Single release switch for the Aug 19 content-expansion libraries
 * (Business Industries, Syntax Flow, Level Test, Listening Hub). Separate
 * from AUGUST_CONTENT_RELEASED (the Aug 12 batch) and from
 * ENGLISH_TRAINING_RELEASED — flipping this flag never hides any
 * previously released content.
 *
 * Safe to import from both client components (AppShell) and server code
 * (the search route) — no Node-only APIs here.
 *
 * While `false`:
 * - the 4 new top-level sidebar/mobile nav entries stay hidden
 * - none of the above are included in global search
 * - all of their routes remain live for direct-URL local/private QA
 *
 * Flip to `true` to release. Currently `true` for local visual QA only —
 * flip back to `false` before any real deploy.
 */
export const AUG19_CONTENT_RELEASED = true;
