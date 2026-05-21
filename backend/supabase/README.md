# AxtarIS Supabase Setup

The mobile app is wired for Supabase Auth, Postgres, and Storage. Do not connect the app directly to raw Postgres from the device; use Supabase client keys in the app and keep service-role/database credentials local or server-side only.

## Required Client Env

Create `.env.local` from `.env.example`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_ENABLE_MOCK_AUTH=false
EXPO_PUBLIC_REQUIRE_REAL_BACKEND=true
```

For local verification only, add:

```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_URL=postgresql://...
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_DB_URL` in Expo public env vars or client builds.

## Fresh Project

Run the full schema in Supabase SQL Editor or with `psql`:

```bash
psql "$SUPABASE_DB_URL" -f backend/supabase/schema.sql
```

## Existing Project Migrations

Apply migrations in order:

```bash
psql "$SUPABASE_DB_URL" -f backend/supabase/migrations/202605060001_storage_buckets_and_upload_metadata.sql
psql "$SUPABASE_DB_URL" -f backend/supabase/migrations/202605060002_application_review_metadata.sql
```

The first migration creates/updates these Storage buckets:

- `cv-uploads`: private, 10 MB, PDF/DOC/DOCX
- `avatars`: public-read, 5 MB, image MIME types
- `company-media`: public-read, 5 MB, image MIME types

It also configures `storage.objects` RLS so:

- candidates can CRUD their own CV files under `candidates/{auth.uid()}/cv/...`
- users can CRUD their own avatars under `profiles/{auth.uid()}/avatar/...`
- company owners can CRUD company media under `companies/{company.id}/logo/...`

## Verify

After env and migrations:

```bash
npm run supabase:verify
```

This checks:

- app env points at a real Supabase project
- application review metadata columns exist
- uploaded file storage metadata columns exist
- the three required Storage buckets exist

## Real Upload Flow

The app upload services write to both Storage and Postgres:

- candidate CV upload stores a private `storage://cv-uploads/...` reference on `candidate_profiles.cv_url`
- avatar/company image uploads store public Storage URLs on profile/company rows
- every successful upload inserts an `uploaded_files` row with file metadata plus `storage_bucket`, `storage_path`, and `is_public`

CV consumers must continue resolving private references through `fileStorageService.resolveFileUrl(...)`.
