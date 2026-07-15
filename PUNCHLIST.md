# AxtarIS — Remaining Work & Deploy Punch‑List

This captures what was completed in the finishing pass and the items that still
need credentials, infrastructure, or human/legal input. Nothing here is faked —
these are the genuinely-remaining steps.

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
