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
SUPABASE_SECRET_KEY='sb_secret_<SECRET_API_KEY>' \
SUPABASE_STORAGE_BUCKET=content-images \
npm run migration:apply
```

For projects that still use legacy keys, `SUPABASE_SERVICE_ROLE_KEY='<SERVICE_ROLE_JWT>'` is supported as a fallback when `SUPABASE_SECRET_KEY` is not set.

Create the private Storage bucket named `content-images` before apply (or choose an existing private bucket via `SUPABASE_STORAGE_BUCKET`). The content importer validates all data and manifest hashes before its first request, and checks that every file below `public/images` is represented. Entity images receive entity-specific object paths; otherwise-unused assets are retained below `legacy-assets/`. Legacy filenames that contain Cyrillic, spaces, percent encoding, or other characters unsafe for Storage keys are replaced by the SHA-256 of their unchanged repository path while retaining the file extension. Manifest generation rejects every non-ASCII/unsafe or duplicate `objectPath`; `oldPath` continues to identify the original repository file. Rows use stable `legacy_id` upserts; ingredients use `(normalized_name, category)`; objects use Storage `x-upsert`, so reruns do not duplicate records or objects.

The follow-up migration `202607210001_grant_catalog_service_role.sql` records the catalog-table grants that were previously issued manually. Do not edit or reapply the already-recorded initial migration to capture those grants; apply the follow-up through the normal Supabase migration flow.

The two apply phases can also be invoked separately with `node scripts/supabase/import-content.mjs --apply` and `node scripts/supabase/upload-images.mjs --apply`. Keep the Secret API key (or legacy service-role fallback) only in the local process environment or an ignored `.env`; never commit it or expose it with a `VITE_` prefix.
