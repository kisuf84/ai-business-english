# AI Business English Training Platform (MVP)

## How to run

1. Install dependencies:

```bash
npm install
```

2. Set environment variables:

```bash
cp .env.example .env.local
```

3. Start the dev server:

```bash
npm run dev
```

To capture backend/frontend dev logs to a file while you work:

```bash
npm run dev:log
```

This writes logs to `logs/dev.log`.

## Local workflow (stable)

Use these scripts to avoid stale port/.next issues when switching between workflows:

- `npm run dev:clean`
  - Kills any process on port `3000`
  - Removes `.next`
  - Starts `next dev`

- `npm run dev:log`
  - Starts `next dev`
  - Mirrors stdout/stderr to `logs/dev.log` for easier error capture

- `npm run start:clean`
  - Kills any process on port `3000`
  - Removes `.next`
  - Runs `next build`
  - Starts `next start`

## Required environment variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optional (fallback only):
- `SUPABASE_ANON_KEY`
- `OPENAI_API_KEY` (reserved for future AI wiring)

## Google OAuth (Supabase Auth)

1. In Supabase, enable Google provider under Authentication → Providers.
2. Add your OAuth Client ID and Client Secret.
3. Add the authorized redirect URL:

```
http://localhost:3000/dashboard
```

4. Ensure your site URL is set to `http://localhost:3000` in Supabase Auth settings.

## Features (MVP)

- Lesson generation + save, list, detail, share, copy, export
- Course generation + list, detail
- Workplace simulation (text-based)

## Notes

- Supabase schema scaffold: `lib/supabase/schema.sql`.
- Vercel Hobby supports cron schedules at most once per day. The YouTube job processor is scheduled for `0 6 * * *` in `vercel.json`; use Vercel Pro, Supabase Cron, or an external scheduler for higher-frequency processing.
- Local fallback files for development:
  - `.data/lessons.json`
  - `.data/courses.json`
  - `.data/simulations.json`
  - `.data/simulation_attempts.json`

## Supabase (Sprint 2B)

Set these env vars for real persistence:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only)

Optional fallback (not recommended for production):

- `SUPABASE_ANON_KEY`
