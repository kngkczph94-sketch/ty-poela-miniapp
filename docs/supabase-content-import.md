# Import existing content into Supabase

The scripts are local migration tooling. They default to dry-run and never use a frontend (`VITE_*`) secret.

## Before connecting the CLI

Because `202607200001_initial_schema.sql` was applied manually in SQL Editor, link the project and mark that exact migration as already applied:

```bash
supabase link --project-ref <PROJECT_REF>
supabase migration repair 202607200001 --status applied --linked
```

Verify with `supabase migration list --linked` before any future `supabase db push`.

## Commands

```bash
# Rebuild the tracked path/hash manifest after intentional source-image changes
npm run migration:manifest

# Validation only: no credentials, network calls, database writes, or uploads
npm run migration:dry-run

# Explicit real run, from a private local shell
SUPABASE_URL=https://<PROJECT_REF>.supabase.co \
SUPABASE_SECRET_KEY='<SECRET_API_KEY>' \
SUPABASE_STORAGE_BUCKET=content-images \
npm run migration:apply
```

Use a current Supabase Secret API key (`sb_secret_...`) for `SUPABASE_SECRET_KEY`. The importer also accepts the legacy JWT-based `SUPABASE_SERVICE_ROLE_KEY` as a fallback, but new integrations should prefer `SUPABASE_SECRET_KEY`. Secret API keys are sent in the `apikey` header only; the legacy JWT fallback also uses `Authorization: Bearer`.

Create the private Storage bucket named `content-images` before apply (or choose an existing private bucket via `SUPABASE_STORAGE_BUCKET`). The content importer validates all data and manifest hashes before its first request, and checks that every file below `public/images` is represented. Entity images receive entity-specific object paths; otherwise-unused assets are retained below `legacy-assets/`. Rows use stable `legacy_id` upserts; ingredients use `(normalized_name, category)`; objects use Storage `x-upsert`, so reruns do not duplicate records or objects.

The two apply phases can also be invoked separately with `node scripts/supabase/import-content.mjs --apply` and `node scripts/supabase/upload-images.mjs --apply`. Keep elevated keys only in a secure process environment, an ignored `.env`, or a protected CI secret store; never commit them or expose them with a `VITE_` prefix.
