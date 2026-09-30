# Langslate Corporate/Academy migration tooling (Sept 10 delivery)

Moves the 4,607 canonical Corporate (4,054) and Academy (553) lesson files to
external object storage (Cloudflare R2). Lesson HTML never enters Git or a
Vercel function; the app only ships lightweight metadata
(`lib/generated/langslate{Corporate,Academy}Catalog.json`).

Nothing here is imported by the app. The source folder is read-only input.

```sh
export LANGSLATE_SEPT10_SOURCE=".../Migration effort files/Sept 10 migration"
export LANGSLATE_MIGRATION_STAGING="/path/outside/repo/and/source"   # enforced

node scripts/langslate-migration/build-manifest.mjs   # manifest + runtime catalogs
node scripts/langslate-migration/dry-run.mjs          # verify, transform, plan (no upload)
node scripts/langslate-migration/upload.mjs           # prints plan only

# Upload (requires `wrangler login`; resumable; re-hashes every file first):
LANGSLATE_R2_BUCKET=<bucket> node scripts/langslate-migration/upload.mjs --execute [--only corporate/]
LANGSLATE_CONTENT_BASE_URL=https://<content-host>/v1 node scripts/langslate-migration/upload.mjs --verify
```

- Object key: `v1/<contentKey>`; `contentKey` is
  `corporate/{industries|departments|pro|professions}/<category>/<lesson>.html` or
  `academy/<level>/<lesson>.html` (lowercase, `&` → `and`, other runs → `-`).
- App configuration: `LANGSLATE_CONTENT_BASE_URL=https://<content-host>/v1`.
- Transform `disable-remote-ai` (100 Industries lessons): replaces only the
  browser-side `fetch('https://api.anthropic.com/v1/messages'` call head so the
  lesson's existing offline Auto-Correction Report is used. Written to staging
  copies; every other file uploads byte-identical from source.
- Outputs are deterministic for an unchanged source tree.
