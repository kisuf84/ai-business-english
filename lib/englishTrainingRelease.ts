/**
 * Single release switch for the English Training section. Flip to `true` to
 * re-enable Sunday. Safe to import from both client components (AppShell)
 * and server code (the search route) — no Node-only APIs here.
 *
 * While `false`:
 * - sidebar nav entry (parent + children) stays hidden
 * - English Training results are excluded from global search
 * - /english-training routes remain live for direct-URL QA
 */
export const ENGLISH_TRAINING_RELEASED = false;
