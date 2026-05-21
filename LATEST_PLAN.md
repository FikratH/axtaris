# AxtarIS Commercial V1 Agent Handoff

This handoff plan updates the original Commercial V1 roadmap to reflect the latest implemented tranche and gives the next agent a concrete, low-risk sequence for continuing production-readiness work.

## 1. Current Implementation Baseline

The previous tranche completed the highest-risk platform foundations needed before deeper product and operations work:

- Added validated runtime config in `src/config/runtime.ts`
- Switched auth mock-mode control to runtime config in `src/services/authService.ts`
- Hardened Supabase boot validation in `src/services/supabase.ts`
- Added real storage abstraction in `src/services/fileStorageService.ts`
- Added profile media persistence in `src/services/userProfileService.ts`
- Added `updateUser` action in `src/store/authStore.ts`
- Wired candidate avatar upload in `app/(candidate)/profile.tsx`
- Wired real CV upload/remove in `app/profile/upload-cv.tsx`
- Wired employer company logo upload in `app/(employer)/company.tsx`
- Replaced dashboard mock analytics with query-derived analytics in `app/(employer)/dashboard.tsx`
- Added password recovery completion route in `app/auth/reset-password.tsx`
- Updated root auth guard in `app/_layout.tsx` to allow recovery flow
- Updated `.env.example` with runtime flags
- Added shared reset-password confirmation validation in `src/services/resetPasswordValidation.ts`
- Refactored `app/auth/reset-password.tsx` to use the shared reset-password validation module
- Added employer-side CV access in `app/(employer)/applicants.tsx`
  - resolves private `storage://...` CV references through `fileStorageService.resolveFileUrl(...)`
  - opens the resolved signed/public URL through React Native `Linking`
- Updated `src/services/candidateVacancyService.ts` so `applyToVacancy(...)` snapshots `cv_url` onto application rows
- Hardened release-path service mock fallbacks with `shouldUseMockBackend()`
  - development without Supabase can still use explicit mock ergonomics
  - staging/production or `EXPO_PUBLIC_REQUIRE_REAL_BACKEND=true` now fails through runtime validation instead of silently returning mock data
- Added real employer vacancy editing
  - `app/(employer)/vacancies.tsx` now routes edit actions to `app/vacancy/edit/[id].tsx`
  - `src/services/vacancyService.ts` now has `updateVacancy(...)`
  - `src/hooks/useVacancyQueries.ts` now has `useUpdateVacancy(...)`
- Added employer candidate review detail
  - route: `app/(employer)/applicant/[id].tsx`
  - shows application/candidate profile details, skills, experience, education, languages, certifications
  - opens private CV references through `fileStorageService.resolveFileUrl(...)`
  - includes employer status actions
- Added structured employer review metadata on applications
  - schema columns: `applications.employer_notes`, `applications.employer_rating`
  - model fields: `Application.employerNotes`, `Application.employerRating`
  - service/hook support: `updateApplicationReview(...)`, `useUpdateApplicationReview(...)`
  - employer detail screen can save internal notes and a 1-5 rating
- Removed stale mock-backed `src/store/dataStore.ts` after confirming no active imports remained
- Added production Supabase/Postgres setup assets for real database and real file upload:
  - `backend/supabase/migrations/202605060001_storage_buckets_and_upload_metadata.sql`
  - `backend/supabase/migrations/202605060002_application_review_metadata.sql`
  - `backend/supabase/README.md`
  - `scripts/verify-supabase.mjs`
  - `npm run supabase:verify`
- Expanded `uploaded_files` metadata so successful uploads are recorded with:
  - `storage_provider`
  - `storage_bucket`
  - `storage_path`
  - `is_public`
- Added Supabase Storage bucket provisioning and RLS policies for:
  - private candidate CVs in `cv-uploads`
  - public avatars in `avatars`
  - public company media in `company-media`
- Created local `.env.local` for the real Supabase project:
  - `EXPO_PUBLIC_SUPABASE_URL=https://cwmjyonylopsqrtujuvo.supabase.co`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_tElHfJFhgJNKSAVkOBkRrg_RRXQ9c9j`
  - mock auth disabled and real backend required
- Added standard Supabase CLI project files:
  - `supabase/config.toml`
  - `supabase/migrations/202605060000_initial_schema.sql`
- Confirmed the Supabase project is reachable with the publishable key:
  - `npm run supabase:verify` reaches the project and `profiles` endpoint
  - service-role checks are skipped until `SUPABASE_SERVICE_ROLE_KEY` is provided
- Added and ran real upload smoke test support:
  - `scripts/smoke-supabase-real.mjs`
  - `npm run supabase:smoke`
- Confirmed project schema columns and storage buckets exist after configuring the secret key:
  - `npm run supabase:verify` passes
- Applied Supabase migrations through the IPv4 shared pooler connection after repairing the already-present baseline migration history:
  - `202605060001_storage_buckets_and_upload_metadata.sql`
  - `202605060002_application_review_metadata.sql`
  - `202605060003_harden_auth_user_trigger.sql`
- Real upload smoke test now passes for:
  - candidate private CV upload
  - candidate public avatar upload
  - employer public company logo upload
- Hardened `202605060001_storage_buckets_and_upload_metadata.sql` so it creates `public.uploaded_files` if missing, but the base schema still needs `public.profiles` and related app tables first
- Removed direct `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY` from schema/migrations because Supabase-managed Storage tables already have RLS enabled and newer projects can reject direct ALTER statements with `must be owner of table objects`

Verification completed successfully with:

```bash
npx tsc --noEmit
npm run supabase:verify
npm run supabase:smoke
```

## 2. Important Current State Notes

### Completed in substance

- Runtime/backend fail-fast path exists
- Real upload architecture exists for:
  - candidate CV
  - user avatar
  - company logo
- Successful real uploads now insert richer `uploaded_files` records in Postgres after Storage upload succeeds
- Full schema and migrations now include required Storage buckets and `storage.objects` policies
- Employer dashboard no longer uses mock analytics state
- Reset-password recovery route now exists end-to-end
- Reset-password confirmation validation is now shared through `src/services/resetPasswordValidation.ts`
- Employer applicants screen has the first real signed-URL CV open/download path
- Employer candidate review screen also resolves signed/private CV URLs before opening
- Application rows now snapshot candidate `cv_url` at apply time
- Employer vacancy edit is no longer routed to read-only vacancy detail
- Employer candidate detail/review is meaningfully underway and includes persistent review notes

### Still intentionally incomplete

- `EXPO_PUBLIC_ENABLE_MOCK_AUTH` is still enabled in `.env.example` for development defaults
- The app still needs staging verification with real Supabase envs before release
- Real Supabase project URL, publishable key, service-role key, and IPv4 pooler `SUPABASE_DB_URL` are configured locally
- Still needed for CLI convenience:
  - `SUPABASE_ACCESS_TOKEN` or `supabase login` to link/push with CLI
- Reset-password validation is shared, but it lives in `src/services/resetPasswordValidation.ts` rather than the older `src/services/validation.ts` file
- Storage bucket creation, RLS/policy verification, and real upload smoke testing now pass against the real Supabase project
- Service-level mock fallbacks are now gated for development-only mock backend usage
- New `applications.employer_notes` and `applications.employer_rating` columns are applied in the current real Supabase project
- Expo typed routes have not been regenerated, so new dynamic route pushes use narrow casts until route types catch up
- Native push, moderation/admin, and real AI are still open

## 3. Known Caveats The Next Agent Must Respect

### Validation caveat

Reset-password validation is now shared, but **not** inside `src/services/validation.ts`.

Current source of truth:

- `src/services/resetPasswordValidation.ts`

Do not duplicate the reset-password schema inside `app/auth/reset-password.tsx`. If the team wants all auth schemas in one file later, migrate carefully from `resetPasswordValidation.ts` into `validation.ts` and update imports after type-checking.

### Storage caveat

`src/services/fileStorageService.ts` uses:

- **public URLs** for avatars and company media
- **private storage references** for CVs in the format:
  - `storage://cv-uploads/...`

That means future CV consumers must resolve URLs via:

- `fileStorageService.resolveFileUrl(...)`

before trying to open/download them.

Implemented consumers currently exist:

- `app/(employer)/applicants.tsx`
- `app/(employer)/applicant/[id].tsx`

### Bucket assumptions

The following Supabase storage buckets are assumed to exist:

- `cv-uploads`
- `avatars`
- `company-media`

The next agent should validate bucket creation, policies, and signed/public access rules in Supabase before expanding file workflows.

## 4. Recommended Next Execution Order

## Milestone 1 — Finish the remaining backend/platform hardening

### Objective
Close the remaining gaps in the just-built runtime/storage tranche so it is truly production-safe.

### Tasks

- Verify password recovery behavior with a real Supabase recovery email
- Confirm `app.json` scheme `axtaris` and Supabase redirect allow-list route recovery links to `axtaris://auth/reset-password` or the Expo deep-link equivalent
- Ensure all future CV consumers use `fileStorageService.resolveFileUrl(...)`
- Link the Supabase CLI after auth:
  - `SUPABASE_ACCESS_TOKEN=... npm run supabase:link`
  - or run `npx supabase login` interactively, then `npm run supabase:link`
- Continue using the IPv4 shared pooler `SUPABASE_DB_URL` on IPv4-only networks
- Re-run `npm run supabase:verify` and `npm run supabase:smoke` after future schema/storage changes
- Validate upload workflows in Expo Go with real candidate/employer accounts
- Keep future production services on `shouldUseMockBackend()` rather than raw `!isSupabaseConfigured()` fallback checks

### Key files

- `src/services/resetPasswordValidation.ts`
- `app/auth/reset-password.tsx`
- `app/(employer)/applicants.tsx`
- `src/services/fileStorageService.ts`
- `src/services/authService.ts`
- `src/services/supabase.ts`
- `app/profile/upload-cv.tsx`
- `src/services/engagementService.ts`
- `src/services/candidateVacancyService.ts`

## Milestone 2 — Commercial employer workflow completion

### Objective
Complete the most important missing employer-side product capabilities.

### Tasks

- Continue refining vacancy edit UX and validation
- Continue refining employer candidate detail/review
  - full candidate profile view exists
  - CV access via resolved signed URL exists
  - status actions exist
  - structured employer review notes/rating exist
  - next useful improvements: direct contact actions, notes history/audit trail, vacancy-scoped filtering
- Expand employer analytics beyond derived summary cards if needed
- Replace any remaining employer settings placeholders that block operational use

### Key files to inspect first

- `app/vacancy/[id].tsx`
- `app/vacancy/create.tsx`
- `app/(employer)/applicants.tsx`
- `app/(employer)/vacancies.tsx`
- `app/(employer)/settings.tsx`
- `src/hooks/useVacancyQueries.ts`
- `src/services/vacancyService.ts`
- `src/services/engagementService.ts`

## Milestone 3 — Moderation/Admin MVP

### Objective
Deliver the minimum internal operations capability required by Commercial V1 scope.

### Tasks

- Design the moderation operating model using existing schema support
- Build a moderation queue and review actions for:
  - vacancies
  - companies
  - reports / flags
- Decide whether admin UX should be:
  - inside the mobile app
  - or a thin internal admin surface elsewhere
- Ensure employer publish flow can support moderation status transitions

### Key files and schema

- `backend/supabase/schema.sql`
- `src/types/models.ts`
- any future admin routes/components to be created

## Milestone 4 — Notification deep links, realtime, and push foundation

### Objective
Turn notifications into a production engagement system.

### Tasks

- Add notification deep-link routing from `notification.data`
- Add realtime subscription for in-app freshness
- Add push token registration and token persistence
- Build first push delivery pipeline for:
  - new application
  - application status changes
  - moderation decisions

### Key files

- `app/notifications.tsx`
- `app/_layout.tsx`
- `src/hooks/useEngagementQueries.ts`
- `src/services/engagementService.ts`
- `backend/supabase/schema.sql`

## Milestone 5 — Real AI backend path

### Objective
Replace simulated AI with a secure backend-driven provider path.

### Tasks

- Introduce provider abstraction
- Move model calls off-device
- Add real implementations for:
  - profile analysis
  - skill suggestions
  - experience rewriting
  - resume summary generation
- Add rate limits, logging, and fallback handling

### Key files

- `src/services/aiService.ts`
- `app/profile/ai-assistant.tsx`
- future edge function / backend code

## 5. Exact Handoff Issues To Resolve First

The next agent should begin with these concrete checks before making bigger feature changes:

- **[check real recovery flow]**
  - Confirm Supabase reset emails return to `axtaris://auth/reset-password` or the Expo deep-link equivalent
  - Confirm restored session survives long enough for password update

- **[check storage buckets]**
  - Confirm the three buckets exist and policies match intended access model
  - Confirm `uploaded_files` inserts succeed under current RLS

- **[check CV consumers]**
  - `app/(employer)/applicants.tsx` resolves and opens CV URLs
  - `app/(employer)/applicant/[id].tsx` resolves and opens CV URLs
  - Any future candidate-detail or CV-preview route must reuse `fileStorageService.resolveFileUrl(...)`
  - Confirm application rows have `cv_url`; `applyToVacancy(...)` now snapshots it from `profile.cvUrl`

- **[check mock cleanup]**
  - Search for remaining uses of:
    - `USE_MOCK_AUTH`
    - `mockData`
    - `useDataStore`
  - `src/store/dataStore.ts` has been removed after `useDataStore` was confirmed unused
  - Production service fallbacks should remain gated through `shouldUseMockBackend()`, not raw `!isSupabaseConfigured()` checks

## 6. Suggested First Commands For The Next Agent

Run these first to re-establish confidence before further edits:

```bash
npx tsc --noEmit
```

Then inspect remaining mock/runtime references and CV usage:

```bash
rg "USE_MOCK_AUTH|useDataStore|mockData|cvUrl|storage://" src app
```

Then inspect the current CV-opening implementation before adding candidate-detail CV review:

```bash
sed -n '1,220p' app/'(employer)'/applicants.tsx
```

## 7. Definition of Success for the Next Agent

The next agent should consider their continuation successful if they complete the remaining **Milestone 1** backend checks and make measurable progress on **Milestone 2**, with these outcomes:

- recovery flow is verified against real Supabase
- CV access is expanded from the applicants list into employer candidate review
- remaining service-level mock fallbacks are removed or made impossible in staging/production runtime modes
- storage bucket policies are verified against the current public/private upload model
- vacancy edit / employer candidate detail implementation is underway

## 8. Recommended Handoff Summary

Continue from the new runtime/storage/auth/CV-access baseline, do **not** rework it prematurely, and focus next on removing release-path mock fallbacks, verifying Supabase storage policies, then completing vacancy edit and employer candidate detail/CV review.
