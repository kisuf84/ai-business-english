/**
 * Single release switch for the August content-expansion libraries
 * (Situational English, Listening Training, Reading Training, Bilingual
 * Compendium, Lexipro, Lexica, Biz Compendium, Gossip English) plus
 * Bootcamp, which is scoped under English Training but is part of this
 * same expansion. Independent from ENGLISH_TRAINING_RELEASED — flipping
 * this flag never hides existing English Training, General English
 * Training, Business English Training, or Business English Scenarios.
 *
 * Safe to import from both client components (AppShell) and server code
 * (the search route) — no Node-only APIs here.
 *
 * While `false`:
 * - the 8 new top-level sidebar/mobile nav entries stay hidden
 * - Bootcamp stays hidden from the English Training catalog and nav
 * - none of the above are included in global search
 * - all of their routes remain live for direct-URL local/private QA
 *
 * Flip to `true` to release.
 */
export const AUGUST_CONTENT_RELEASED = true;
