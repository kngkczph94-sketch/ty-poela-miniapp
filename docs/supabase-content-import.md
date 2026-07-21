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
SUPABASE_SERVICE_ROLE_KEY='<SERVICE_ROLE_KEY>' \
SUPABASE_STORAGE_BUCKET=content-images \
npm run migration:apply
```

Create the private Storage bucket named `content-images` before apply (or choose an existing private bucket via `SUPABASE_STORAGE_BUCKET`). The content importer validates all data and manifest hashes before its first request, and checks that every file below `public/images` is represented. Entity images receive entity-specific object paths; otherwise-unused assets are retained below `legacy-assets/`. Rows use stable `legacy_id` upserts; ingredients use `(normalized_name, category)`; objects use Storage `x-upsert`, so reruns do not duplicate records or objects.

The two apply phases can also be invoked separately with `node scripts/supabase/import-content.mjs --apply` and `node scripts/supabase/upload-images.mjs --apply`. Keep the service-role key only in the local process environment or an ignored `.env`; never commit it or expose it with a `VITE_` prefix.
