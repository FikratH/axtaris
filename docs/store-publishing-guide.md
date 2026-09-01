# AxtarIS — Store Publishing Guide

Step-by-step path from today's state to live App Store + Google Play listings.
Written 2026-09-01 against the actual repo state (EAS project linked, production
build profile ready, legal documents drafted, push code fixed). Steps marked
**[YOU]** need the owner personally (accounts, payments, identity); steps marked
**[DEV]** can be run from this repo.

**Current state:** Android production AAB has built successfully before. iOS has
never been built for production (no Apple account). Neither store account
exists yet. Push notifications need credentials (§4) before the next build.

---

## Phase 0 — Company prerequisites (week 1, in parallel with everything)

1. **[YOU] Register the Azerbaijan MMC.**
   Electronic registration via e-taxes.gov.az (ASAN İmza needed, ~18 AZN;
   e-registration itself is free; ~3 business days; no minimum capital).
   The MMC unlocks *organization* accounts on both stores — which avoids
   Google's 12-tester requirement for personal accounts and keeps your personal
   name off the App Store listing.
2. **[YOU] Immediately after registration: apply for the KOBIA startup
   certificate** (smb.gov.az → "Startup" şəhadətnaməsi) — 3-year profit-tax
   exemption on innovation income. Confirm scope with your accountant.
3. **[YOU] Request a D-U-N-S number** for the MMC via Apple's free flow:
   https://developer.apple.com/enroll/duns-lookup/ — allow up to 30 days
   (usually faster). Google org verification also accepts D-U-N-S.
4. **[YOU] Open a company bank account** (Kapital/PASHA — ask for a USD account
   too; Google Play pays out in USD).
5. Fill the legal-document placeholders (docs/legal/README.md lists them all:
   legal name, VÖEN, registered address, effective date) and redeploy the
   landing site so the hosted policies are final. **[DEV]** command after edits:
   `node scripts/generate-legal-content.mjs` (syncs the in-app copies).

*Fallback if you must ship before the MMC exists:* Apple individual enrollment
(no D-U-N-S; app shows your personal name as seller; migration to org later is
supported) + Google personal account (requires a closed test with 12 testers
opted-in for 14 continuous days before production access — this is the main
cost of the personal path).

## Phase 1 — Store accounts (week 1-2)

6. **[YOU] Google Play Console** — https://play.google.com/console/signup
   - Organization account under the MMC. $25 one-time fee.
   - Verification: D-U-N-S / registration docs, website (axtaris.app),
     org email (info@axtaris.app), phone. Expect 2-4 weeks worst case; usually
     days.
   - Then: **Set up merchant account / payments profile** (Azerbaijan is
     supported for merchant registration; payouts in USD) — needed the moment
     paid subscriptions go live, harmless to do now.
7. **[YOU] Apple Developer Program** — https://developer.apple.com/programs/enroll/
   - Organization enrollment with the MMC + D-U-N-S. $99/year.
   - You need: a legal-entity webpage (axtaris.app — exists), org email,
     and to be the org's authorized signer. Verification phone call is common.
   - Note: if organization enrollment hits problems from Azerbaijan, enroll as
     individual first — flagged as an open verification item in our research.
8. **[YOU] Sentry account** (crash reporting — free tier fine):
   sentry.io → create org `axtaris`, project `axtaris-app` (React Native).
   Copy the DSN. **[DEV]** add to eas.json production env:
   `"EXPO_PUBLIC_SENTRY_DSN": "<dsn>"`, and set EAS secrets
   `SENTRY_AUTH_TOKEN` (from Sentry → Auth Tokens) so sourcemaps upload.

## Phase 2 — Push credentials (30 minutes, blocking every store build)

The entire push pipeline is built and deployed; only credentials are missing.
The app.json already references `./google-services.json` — **Android builds
will fail until step 10 places that file.**

9. **[YOU] Create the Firebase project**: console.firebase.google.com →
   Add project "AxtarIS" (Analytics off is fine).
10. **[YOU]** Add app → **Android**, package name exactly `az.axtaris.app` →
    download `google-services.json` → **[DEV]** place it at the repo root and
    commit it (it contains no secrets — committing is the standard practice).
11. **[YOU]** Firebase → Project settings → Service accounts →
    **Generate new private key** (JSON). NEVER commit this file.
12. **[DEV]** `npx eas credentials -p android` → select the project →
    "Google Service Account key (FCM V1)" → upload the JSON from step 11.
13. **[DEV]** Sync the push secret (the function env and Vault copy were set
    separately and may not match):
    - Generate one value: `openssl rand -hex 32`
    - `npx supabase secrets set PUSH_SECRET=<value>`
    - Supabase dashboard → SQL editor:
      `select vault.update_secret((select id from vault.secrets where name='push_secret'), '<same value>');`
14. iOS push (after Phase 1 step 7): **[DEV]** `npx eas credentials -p ios` →
    let EAS create & upload the APNs key.
15. **Verify (after the Phase 4 build):** install the new build on a real
    Android device → sign in → check `profiles.expo_push_token` is set → send
    a chat message from a second account with the app backgrounded → push
    arrives; tap it → the chat opens. Repeat foregrounded (banner should show)
    and from a killed state.

## Phase 3 — Listing assets & store metadata (week 2)

16. **[YOU/DEV] Screenshots** (the only significant asset work left):
    - Android: phone screenshots (min 2, 16:9 or 9:16), 1080×1920 works.
    - iOS: 6.7" (1290×2796) and 6.5" (1284×2778 or 1242×2688) sets.
    - Recommended set (both stores, per locale az/en/ru if you have the
      energy — az minimum): Home/recommendations, vacancy detail with match
      explanation, profile builder, chat, employer dashboard.
    - Play also needs: **feature graphic** 1024×500 and the **512×512 icon**
      (export from assets/icon.png).
17. **[YOU] Copy**: short description (80 chars), full description (4000),
    Apple subtitle (30), keywords (100), promotional text. Write az first,
    then en/ru. Use the landing site's vocabulary (src/i18n locales + landing
    content are the approved voice).
18. **Store forms** (RELEASE_CHECKLIST.md §6 has pre-drafted answers matching
    the code):
    - **Play Data Safety**: collects name/email/phone(optional)/CV/chat;
      encrypted in transit; deletion available; account deletion URL:
      `https://axtaris.app/legal/delete-account`.
    - **Apple App Privacy**: Contact Info, User Content (CVs, messages),
      Identifiers (none for tracking), no tracking → no ATT.
    - **Content ratings questionnaire** (IARC on Play): social/user-generated
      content, no objectionable defaults → expect Everyone/4+ with UGC notes.
    - Privacy policy URL for both listings: `https://axtaris.app/legal/privacy`.
19. **[YOU] Review accounts for both stores**: create two clean demo accounts
    (one candidate, one employer with an active vacancy) on production data.
    ROTATE the old seed passwords first (hr@azercell.com / ali@example.com —
    a formerly-committed password is still live on them; checklist §H6).
    Put credentials in the stores' review notes.

## Phase 4 — Builds & submission (week 2-3)

20. **[DEV]** Final gates from the repo:
    `npx tsc --noEmit && npx jest` green; `npm run supabase:verify` and the
    smoke test against production; `supabase migration list` shows remote
    fully applied (entitlement limits migration included).
21. **[DEV] Android build**: `npx eas build -p android --profile production`
    (autoIncrement is now on — no manual versionCode bumps). The 8/7 AAB is
    obsolete (no FCM config baked in): this fresh build is the one to ship.
22. **[DEV] iOS build**: `npx eas build -p ios --profile production` —
    first run is interactive for credentials (say yes to EAS-managed
    distribution cert + profile + APNs key).
23. **Play submission path (org account)**: Internal testing first → promote
    the same release to Closed testing (share with a handful of real users) →
    Production with staged rollout at 20%. Org accounts skip the 12-tester
    requirement, but a week of closed testing catches device-specific issues
    cheaply.
24. **Apple**: Transporter/EAS Submit (`npx eas submit -p ios`) → TestFlight
    (internal testers immediately) → App Review. In review notes: demo
    accounts, note that employer features require the employer demo login,
    and that all payments are currently disabled ("Free during beta").
25. **Review-risk notes (already mitigated in code, know them anyway):**
    - Plans show "Free during beta" with no prices — if a reviewer asks about
      payments, the answer is "no digital purchases are sold in this version".
    - UGC: report + block exist on chat, vacancies, companies, profiles;
      moderation contact is info@axtaris.app; Community Guidelines are hosted.
    - Account deletion: in-app (Settings) + web URL. Both live.
    - If Apple rejects over the notification permission prompt with push not
      yet delivering (APNs key missing), finish step 14 first — do not ship
      iOS without APNs.

## Phase 5 — Post-approval (launch day)

26. Staged rollout to 100% on Play over ~3 days if crash-free rate holds
    (watch Sentry + Play vitals).
27. Fill `submit.production` in eas.json (ascAppId, Play service account) so
    future submissions are one command.
28. Flip the landing site's store links from "Tezliklə" to the real URLs
    (landing/src/config/site.ts holds the typed TODOs) and redeploy.
29. Register the personal-data information system on e-gov (docs/legal/README
    §e-gov step) — required by the AZ personal-data law once real users flow.

---

## Costs summary

| Item | Cost | Recurring |
|---|---|---|
| MMC registration (electronic) | free (~18 AZN ASAN İmza) | — |
| Google Play Console | $25 | one-time |
| Apple Developer Program | $99 | yearly |
| D-U-N-S | free | — |
| Firebase / FCM | free | — |
| Sentry (starter) | free | — |
| **Total to launch** | **~$130** | **$99/yr** |

## Blocking-dependency graph (what waits on what)

- MMC → D-U-N-S → Apple org + Play org accounts
- Play account → Play submission; Apple account → iOS build + APNs → iOS submission
- Firebase JSON (no dependencies — do TODAY) → next Android build
- Legal placeholders (needs MMC VÖEN) → final policy publish → store listing forms
- Everything else is parallel.

The realistic critical path is the account verifications (days to weeks).
Start Phase 0 and steps 6-9 immediately; the rest fits in the gaps.
