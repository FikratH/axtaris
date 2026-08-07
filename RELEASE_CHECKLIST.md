# AxtarIS — Store Submission Checklist

Generated 2026-08-07 at the end of a full production-readiness pass (see
`PUNCHLIST.md` for the underlying audit and every fix applied). Everything
marked ✅ is done and verified. Everything marked 🧑 needs the owner's
accounts, credentials, or judgment — this file lists exactly what to do for
each one, in order.

---

## 0. Where things stand right now

- **Security**: all live-exploitable P0s closed and verified against
  production (admin escalation, CV IDOR — code fixed but **not yet
  deployed**, see §1 below —, PII column exposure, application-hijack,
  DM-anyone). See `PUNCHLIST.md` §0-§1.
- **Data loss**: the concurrent-save bug that could wipe a candidate's
  entire work history is fixed and live-tested under real concurrency.
- **Store compliance**: the fake card-checkout screen is replaced with an
  honest free-during-beta activation flow. No screen collects card details
  anywhere in the app.
- **Build**: `npx tsc --noEmit`, `npx jest` (186/186, all passing — the
  certification-expiry-validation test that used to be an intentional skip
  now runs and passes too), `npx expo export --platform web`,
  `npm run supabase:verify`, and `npm run supabase:smoke` all pass as of
  the last commit on `master`.
- **Since this file was first generated**: a full P2 cleanup batch shipped
  (certification expiry validation, support-conversation dedup + DB unique
  index, 3 auth screens' keyboard-avoidance, silent bookmark-rollback
  feedback, unchecked conversation-preview updates), `expo-image` adoption
  for cached avatars/chat images, the oversized logo PNGs were resized
  (~95% smaller), a safe RLS-refactor prerequisite for the still-open F5
  finding (companies.owner_id anon exposure — see `PUNCHLIST.md` §1.5 for
  why the actual column revoke stays open), and a server-side backstop for
  the employer invite-quota entitlement (previously client-enforced only).
  Full detail in `PUNCHLIST.md`.
- **Android production build**: ✅ finished successfully (profile
  `production`, distribution `store`, commit `dd84488`). AAB:
  https://expo.dev/artifacts/eas/YDXYMW1GNF_MS3q8GsSLI8e1xmWEYcITGjg1j_7KjHk.aab
  — note several commits have landed since this build; re-run
  `eas build --profile production --platform android` before actually
  submitting to pick up everything in this checklist.
- **iOS build**: blocked, see §5.

---

## 1. 🧑 Do this first — deploy the two Edge Functions with security fixes

This environment had no `SUPABASE_ACCESS_TOKEN` / CLI auth, so these
**could not be deployed** during this pass even though the code is fixed
and committed. Until deployed, the live `parse-resume` function still has
the CV-leak IDOR (any authenticated user can read any other user's CV).
**This is the single most urgent action — do it before anything else below.**

```bash
supabase login   # if not already linked
supabase functions deploy parse-resume
supabase functions deploy ai-assist
```

Verify after deploying:
```bash
# Should now 403, not return a parsed document, for a path you don't own:
curl -X POST "https://cwmjyonylopsqrtujuvo.supabase.co/functions/v1/parse-resume" \
  -H "Authorization: Bearer <a real user JWT>" -H "apikey: <anon key>" \
  -H "Content-Type: application/json" \
  -d '{"bucket":"cv-uploads","path":"candidates/<some-other-user-id>/cv/x.pdf"}'
```

---

## 2. 🧑 Legal & policy content (blocks both stores)

1. **Privacy policy + Terms of Service** — `app/legal/privacy.tsx` /
   `legal.termsBody` currently render literal placeholder text ending in
   "This document is placeholder text." Both stores require a real,
   hosted policy. Have this drafted (a lawyer or a legal-copy service) and
   it must disclose, accurately:
   - OpenAI receives the full text of every uploaded CV (`parse-resume`)
     and free-text AI prompts (`ai-assist`)
   - Behavioral analytics tied to the user's account (`analytics_events`)
   - Push notification tokens are sent to Expo's push service
   - Who viewed a candidate's profile is tracked (`profile_views`)
   - Avatar and company-logo images are stored in **public** buckets
     (world-readable by URL)
   - Candidate profiles default to **discoverable** by employers via
     talent search (`is_discoverable = true` by default) — the CV file
     itself is still application-gated, but profile/experience/education
     are not
   - Data controller identity, retention periods, international transfer
2. Once you have the real copy: replace `legal.termsBody` / `legal.privacyBody`
   and `legal.lastUpdated` in `src/i18n/locales/{en,az,ru}.ts`, host the
   policy at a public HTTPS URL (needed for both store listings and the
   Data Safety / App Privacy forms below), and get a support email +
   support URL.
3. **Web account-deletion URL** — Play's Data Safety form requires a URL
   where a user can request deletion even outside the app. The in-app flow
   exists (`delete-account` Edge Function, already deployed); you need a
   simple web page or documented email process for this specific
   requirement.

---

## 3. 🧑 Accounts & credentials

| Item | Where | Notes |
|---|---|---|
| Apple Developer Program membership | developer.apple.com | Required for any iOS build/submission |
| App Store Connect app record | appstoreconnect.apple.com | Create the app listing, get `ascAppId` |
| Apple Team ID | developer.apple.com/account | For `eas.json` `submit.production.ios` |
| Google Play Console developer account | play.google.com/console | Required for any Android submission |
| Play service-account JSON key | Play Console → API access | For `eas submit` automation (optional — can also upload manually) |
| Sentry DSN | sentry.io (new project) | Crash reporting isn't wired up yet — out of scope of this pass, separate task |
| A valid `OPENAI_API_KEY` | Supabase → Edge Function secrets | **The currently-configured key is invalid** — live-tested during this pass, OpenAI returned "Incorrect API key provided." AI features (bio suggestions, job descriptions, CV parsing) silently fall back to templates until this is fixed. |
| Confirm `PUSH_SECRET` ≡ Vault `push_secret` | Supabase dashboard | Both are set but their *values* couldn't be compared (opaque digests) — cheapest fix is to regenerate both from one new value rather than trying to verify the old ones match |
| A real device push test | — | Push is fully wired (trigger, Edge Function, secret) but has never delivered an actual notification — only 1 test profile in the DB has ever registered a token |
| Supabase Auth → URL Configuration | Supabase dashboard | Confirm `axtaris://auth/reset-password` is in the redirect allow-list — App Review routinely tests password reset, and this couldn't be verified via the REST API in this pass |
| Rotate `hr@azercell.com` / `ali@example.com` passwords | Supabase Auth | The seed script's hardcoded default password (now removed from the script) was live-confirmed as these two accounts' actual current password |

---

## 4. 🧑 Store listing assets (neither store has any of this yet)

| Asset | Apple | Google Play |
|---|---|---|
| Screenshots | 6.7" iPhone required (iPad no longer required — `supportsTablet` is now `false`) | ≥2 phone screenshots + 1024×500 feature graphic |
| App icon | Already have `assets/icon.png` (1024×1024, no alpha) ✅ | Need a 512×512 32-bit PNG export |
| App description / subtitle / keywords | Required, az/ru/en | Short + full description, az/ru/en |
| Category | Required | Required |
| Content rating questionnaire | Age rating questionnaire | IARC questionnaire — **the app has 1:1 messaging and user-generated content (chat, CVs)**; confirm the client actually exposes report + block in chat/profiles before answering (a `moderation_flags` table exists server-side, but this pass didn't trace whether the UI surfaces report/block — check `app/chat/[id].tsx` and profile screens) |
| Demo reviewer account | Strongly recommended — the app is auth-gated behind role selection | Same |
| Privacy policy URL | Required in listing | Required in listing + Data Safety form |
| Support URL / email | Required | Required |

**Demo account suggestion**: use the existing seed accounts
(`hr@azercell.com` for employer, and any `@example.com` candidate from the
seed data) — but **rotate their passwords first** per §3, and give
reviewers the new password in the App Review notes, not the old
publicly-committed one.

---

## 5. iOS build status

`eas build --profile preview --platform ios --non-interactive` was
attempted during this pass and failed with:

```
Failed to set up credentials.
You're in non-interactive mode. EAS CLI couldn't find any credentials
suitable for internal distribution. Run this command again in
interactive mode.
```

This is expected — no Apple Developer Program credentials are linked yet
(§3). Once you have the Apple Developer account:

```bash
eas build --profile preview --platform ios
```

Run this **interactively** (not `--non-interactive`) the first time so EAS
can either generate new credentials or prompt you to upload existing ones.

---

## 6. Data Safety / App Privacy answers (pre-filled from this pass's audit)

Full column-level data inventory is in `PUNCHLIST.md` §3's linked audit
transcript. Summary:

**Collected, linked to identity, none used for tracking:**
Contact info (name, email, phone, address) · Financial info (salary
expectations only — never payment info, since checkout no longer collects
cards) · Photos/videos (avatar, CV, chat images) · Search history (saved
searches) · Identifiers (user ID, push token) · Purchase history (plan
activations — free during beta) · Usage data / analytics (linked to
user_id) · Other (role, availability, discoverability flag).

**Declare NOT collected**: Health & fitness, precise or coarse location
(city is a self-typed string, never device location), sensitive info,
contacts, browsing history, diagnostics/crash data (until Sentry is wired
up), advertising ID, audio, SMS/emails.

**No ATT prompt needed** — no tracking SDK, no IDFA/AAID usage anywhere in
the codebase (confirmed via `package.json` audit).

---

## 7. Final pre-submit gate (run all of these; all must be green)

```bash
npx tsc --noEmit
npx jest
npx expo export --platform web
npm run supabase:verify
npm run supabase:smoke
eas build --profile production --platform android   # AAB
eas build --profile production --platform ios       # after §3/§5 are done
```

Then, in App Store Connect / Play Console:
- IAP section stays **empty** (no in-app purchases — free during beta)
- Encryption export: already declared (`ITSAppUsesNonExemptEncryption: false`)
- Age/content rating: answer per §4's note on messaging/UGC
- Submit for review

---

## 8. What is explicitly NOT in scope of this checklist

- Real payment processing (StoreKit/Play Billing or a local Azerbaijani
  gateway integration) — a deliberate, documented decision to ship free
  during beta instead (`PUNCHLIST.md` §3.1). Revisit when ready to charge.
- Crash reporting (Sentry) — not wired up; separate task.
- The remaining open items in `PUNCHLIST.md` (F5's companies.owner_id anon
  column exposure — a prerequisite RLS refactor shipped this pass, the
  actual revoke needs a client select-constant split first, see §1.5 for
  the exact plan; the lucide bundle trim, blocked on an upstream package
  export-map fix; the chat push-notification safety net, needs a
  notifications-row-on-message-send feature) — none are store-submission
  blockers; fix opportunistically post-launch.
