# AxtarIS — Remaining Work & Deploy Punch‑List

This captures what was completed in the finishing pass and the items that still
need credentials, infrastructure, or human/legal input. Nothing here is faked —
these are the genuinely-remaining steps.

---

## 🔒 2026-08-01 — Production-readiness audit + fixes pass

A full deep audit (bugs, security, features, i18n, perf, types) plus a first
tranche of fixes. Baseline verified: **`tsc` clean · Jest 112/112 · `expo export
--platform web` builds · app boots web with 0 console errors**.

### ✅ Fixed this pass (code, all verified)
- **P0 PII/RLS lockdown** — new migration `supabase/migrations/202608010001_rls_pii_lockdown.sql`:
  - `profiles` SELECT was `USING(true)` (any anon-key caller could dump every
    email/phone/push-token) → now `TO authenticated`.
  - `work_experiences`/`education`/`language_skills`/`certifications` had **RLS
    disabled entirely** (anon read+write+delete) → RLS enabled with owner-CRUD +
    admin + employer-relationship read policies.
  - `candidate_profiles` SELECT `USING(true)` → `TO authenticated` and now
    **enforces the `is_discoverable` opt-out server-side**.
- **Invite notifications** — new migration `202608010002_invite_notification_trigger.sql`
  (client insert was RLS-denied; now an `AFTER INSERT` SECURITY DEFINER trigger).
- **Store readiness** — `app.json`: removed unjustified Android `RECORD_AUDIO`;
  added iOS camera/photo purpose strings + `microphonePermission:false` via the
  `expo-image-picker` plugin config.
- **Pricing contradiction** — employer comparison table now 19/49 AZN to match
  the plan cards + checkout (`subscriptionService.ts`).
- **Saved jobs no longer vanish** when a vacancy closes (`fetchVacanciesByIds` +
  `useSavedVacancies`, `saved.tsx`).
- **Company edit** now invalidates public company/top-companies caches
  (`useVacancyQueries.ts`).
- **Idempotent talent invites** — no more double-invite on remount (`talentService.ts`).
- **AppState-driven token refresh** on native — prevents avoidable logouts (`supabase.ts`).
- **Keyboard** no longer covers the applicant-notes field (`applicant/[id].tsx`).
- **Talent list virtualized** — `ScrollView`+`.map` → `FlatList` (`talent.tsx`).

### ✅ Migrations APPLIED + verified (2026-08-01)
`npx supabase db push` applied both migrations to production. Verified with an
anonymous anon-key REST scrape: `profiles`, `work_experiences`, `education` now
return `[]` to anon (were full dumps); public `vacancies` still 200. **P0 closed.**

### ✅ Wave 2 fixes (also shipped + verified: tsc 0 · Jest 112/112 · web export · 0 console errors on 5 screens)
- **Perf** — virtualized `viewers.tsx`, `company/[id].tsx`, `invites.tsx` (→ FlatList);
  `React.memo` on `VacancyCard`; `useCallback` renderItems across 8 list screens.
- **Notifications realtime** — Supabase channel on `notifications` (mock-guarded) +
  30s fallback poll + pull-to-refresh (`RefreshControl`) in `notifications.tsx`.
- **zod validation** — vacancy create/edit, all 4 profile sub-editors, company edit,
  profile edit, OTP now validate on submit (schemas in `validation.ts`).
- **i18n polish** — "CARD HOLDER"/"EXPIRES" + raw thrown errors localized (az/ru/en,
  parity green); RU-truncation guards on stat/tile labels.
- **Design foundation** — refined elevation tokens (navy-tinted, diffuse); card + CTA
  lift; input focus rings; branded empty-state halos.

### Audit false-positives / corrections (verified, no action)
- Status-change candidate notification **already works** (existing
  `applications_notify_candidate` AFTER UPDATE trigger) — not a bug.
- The sub-entity dedupe/reconcile **genuinely self-heals** — verified vs schema.
- **T-028 is a false lead**: `nativewind`/`tailwindcss` aren't installed at all;
  `react-native-worklets` is a **required Reanimated-4 peer** (do NOT remove).
- `MASTER_PLAN.md` is stale (lists React Query/push as not-done — both shipped).

### ⏳ Genuinely remaining (deliberately not done blind)
- **RLS residual (P1)**: authenticated users can still read another user's
  `email`/`phone` (row-level RLS can't hide columns). Correct fix = a
  SECURITY-DEFINER contact RPC + column-level revoke, repointing the employer-
  applicant and admin-users read paths. **Left for a follow-up with employer+admin
  test accounts** — shipping it blind risks breaking a paying-customer flow.
- **`expo-image`** for avatar disk-caching — a native module; needs a native rebuild
  to validate, so deferred until the iOS sim is available.
- **IAP compliance (P1 decision — yours)**: in-app card checkout for digital subs
  violates App Store 3.1.1 / Play Billing. Move to StoreKit/Play Billing or remove
  the in-app sale from the binary (overlaps monetization scope).
- **Smoke-test after the RLS migration**: sign in as an employer and confirm
  applicant-detail (name/experience) + talent search still populate.

---

## ✅ Completed this pass

- **Localization** — every user‑visible hardcoded string / raw enum is now
  translated across `az` / `ru` / `en` (work‑type & experience chips, status
  badges, language levels, DateField/SelectField buttons, CV upload, AI
  assistant, company verification, salary/date validation, error messages, etc.).
  New shared helper: `src/utils/labels.ts` (work‑type, experience, language‑level,
  application/vacancy status → localized label + semantic color, verification).
- **Bugs** — all 23 adversarially‑confirmed bugs fixed, including:
  - Duplicate languages/experience/education/certifications (root cause: the old
    id‑classification sync re‑inserted the seed's non‑canonical UUIDs on every
    save). Now a self‑healing reconcile + read‑side de‑dup, plus a cleanup
    migration and a fixed (RFC‑4122 v5) seed `uuidFor`.
  - Pro daily‑application limit mismatch (client said 10, DB enforced 7) → DB
    now 10 (migration + schema).
  - Dashboard active‑vacancy count/list, applicant status badge colors, salary
    max‑only, OTP paste/autofill, apply → stale quota counter, applicant button
    scoping, home recommended≠recent, "1 day ago" for today, salary min>max,
    experience/education end<start, ProfileCompletionCard ring math, Avatar
    blank initials, and more.
- **Design (elevated polish)** — Badge/Chip on the type scale, VacancyCard depth
  + unified radius + wrap spacing, dashboard/home soft‑token tints, staggered
  entrance motion (Reanimated, web‑safe), header contrast, dark‑mode onboarding
  flash fix.
- **Features** — candidate‑facing **Company detail** screen (fixes the
  top‑companies / vacancy‑company dead‑ends), **notification deep‑links**,
  **Terms/Privacy** screens (linked from sign‑up + settings), **account deletion**
  flow (double‑confirm) in both settings screens.
- **Verified** — `npx tsc --noEmit` clean; `npx expo export --platform web`
  builds successfully.

---

## 🔌 New feature setup (AI / Push / Admin)

### 1. ChatGPT (OpenAI) — where to paste your token
The key stays **server-side** (never in the app bundle). Paste it as a Supabase
Edge Function secret, then deploy the proxy:
```bash
supabase secrets set OPENAI_API_KEY=sk-your-key-here      # <-- paste your token here
supabase secrets set OPENAI_MODEL=gpt-4o-mini             # optional (this is the default, cost-effective)
supabase functions deploy ai-assist
```
Once set, the AI Assistant generates real bios / rewrites experience. Until then
it gracefully falls back to the localized built-in text. Cost control: `gpt-4o-mini`,
capped output tokens, and only signed-in users can call it.

### 2. Push notifications
```bash
supabase secrets set PUSH_SECRET=$(openssl rand -hex 24)   # required: send-push refuses calls without it
supabase functions deploy send-push
```
The DB trigger (or backend) that calls `send-push` must pass this value in the
`x-push-secret` header. Without `PUSH_SECRET` set, the endpoint safely rejects everything.
The app registers each device's Expo push token on sign-in (native builds; web is a
safe no-op). The notification→push trigger is now provided:
`supabase/migrations/202608020001_push_delivery_trigger.sql` (pg_net, exception-safe,
reads PUSH_SECRET from Vault). To turn pushes on: deploy `send-push --no-verify-jwt`,
`supabase secrets set PUSH_SECRET=…`, store the same value via
`select vault.create_secret('<PUSH_SECRET>', 'push_secret');`, then `supabase db push`.
Web push (Netlify) is a separate future item.

### 3. Admin panel access
The `is_admin()` RLS migration is applied. Promote a user to admin:
```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'you@example.com';
```
They'll be routed to the `(admin)` section (dashboard KPIs, moderation queue, user &
company management). In dev/mock mode, signing in with any `admin@…` email works.

---

## 🚀 Deploy steps required (code is ready — just needs applying)

1. **Apply the new DB migration** to the Supabase project:
   ```bash
   psql "$SUPABASE_DB_URL" -f supabase/migrations/202607150001_pro_quota_and_dedupe.sql
   # or: npx supabase db push
   ```
   This sets the pro daily limit to 10 and one‑time de‑duplicates any existing
   candidate sub‑entity rows. (The app already self‑heals on the next profile
   save, so this is a belt‑and‑suspenders cleanup + the quota change.)

2. **Deploy the account‑deletion Edge Function** (App Store / Play Store
   requirement — the client flow calls it):
   ```bash
   npx supabase functions deploy delete-account
   ```
   Source: `supabase/functions/delete-account/index.ts`. It authenticates the
   caller with their JWT and deletes their auth user (cascades all data).
   Until deployed, "Delete account" errors gracefully in real‑backend mode.

3. **Re‑seed (optional)** if you want the demo data rebuilt with canonical UUIDs:
   ```bash
   npm run supabase:seed
   ```

---

## ⏳ Plan items still open (need credentials / infra / human input)

These are from `MASTER_PLAN.md` / `LATEST_PLAN.md` and could not be completed
without external accounts, secrets, or legal content:

| Area | What's needed |
|---|---|
| **Real AI (T‑026)** | LLM API key + an Edge Function proxy. Current AI assistant is localized mock output; `aiService` is ready to swap to a provider. |
| **Push notifications / realtime (T‑010)** | Expo push credentials + a delivery pipeline. In‑app fetch + deep‑link nav are done; realtime subscription + push token registration remain. |
| **Legal copy (T‑018)** | Terms/Privacy screens exist with placeholder text in all 3 languages; final legal copy must replace `legal.termsBody` / `legal.privacyBody`. |
| **Moderation/Admin (T‑025)** | Schema supports it (`moderation_flags`, `pending_moderation`); no admin surface built. |
| **EAS build/signing, Sentry, tests, store assets (T‑020–T‑024)** | Apple/Google signing, a Sentry DSN, a Jest suite, and store screenshots/metadata — all require the owner's accounts. |
| **Job‑matching algorithm (T‑027)** | Home "recommended" now ranks by skill overlap (client‑side); a server‑side matching function is the fuller version. |
| **Bundle trim (T‑028)** | `nativewind`/`tailwindcss`/`react-native-worklets` still present but unused; safe to remove for a smaller bundle. |

---

## Notes

- `app/settings.tsx` is a pre‑existing untracked near‑duplicate of
  `app/preferences.tsx` and is not linked from any screen (candidate settings go
  through `/preferences`). It can be deleted.
- New routes use narrow `as never` casts where Expo's generated route types
  hadn't caught up; the web export regenerates them, after which the casts are
  redundant (but harmless).
