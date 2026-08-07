# AxtarIS — Production-Readiness Punchlist

Rewritten 2026-08-07 after a 6-agent deep audit (security/RLS, adversarial bug
hunt + tests, performance, store compliance, i18n, backend deployment status).
All findings below were **live-verified against the production Supabase
project** (`cwmjyonylopsqrtujuvo`) or the current `master` (747b97b) unless
marked otherwise. Every item from the previous punchlist was re-checked; false
leads are closed explicitly in §5.

Legend: **P0** = launch blocker · **P1** = should-fix before/soon after launch
· **P2** = post-launch. 🧑 = requires the human owner (credentials, accounts,
legal, or a judgment call only they can make). 🤖 = fixable in code/config/
migration with no new credentials.

---

## 0. Wave 1 (Security) — status as of 2026-08-07, end of this pass

Migrations `202608070001`–`202608070005` applied to production and live-
verified via direct REST calls against real seed accounts (not just unit
tests). Three of the five hotfix migrations exist because the *first* one
caused live regressions that were caught and fixed in the same session —
documented in full in each migration's header comment, summarized here:

| Finding | Status | Notes |
|---|---|---|
| F2 (admin escalation) | ✅ **Fixed, live** | Verified via `pg_get_functiondef`; live signup test was blocked by Supabase's email rate limit, not re-attempted |
| F3 (parse-resume IDOR) | 🧑 **Code fixed, NOT deployed** | Edge Function code is fixed in the repo, but this environment has no `SUPABASE_ACCESS_TOKEN` / CLI auth, so `supabase functions deploy` could not be run. **The live function is still vulnerable.** Owner must run `supabase functions deploy parse-resume` — this is the single most urgent remaining action. |
| F4 (applications WITH CHECK) | ✅ **Fixed, live** | First attempt caused `infinite recursion detected in policy` (self-referential subquery) — fixed via a SECURITY DEFINER helper (`202608070004`), same pattern as the pre-existing `202608020002` fix. Live-tested: forged `candidate_id` → 403; legitimate status update → 200. |
| F1 (profiles email/phone/token) | ✅ **Fixed, live** | Live-tested: direct `email,phone` select as an authenticated employer → permission denied; `get_profile_contact` RPC correctly scoped to self/admin/employer-relationship; `admin_list_profiles` RPC correct for admin vs non-admin. |
| F5 (companies.owner_id) | ⏪ **Reverted, still open (P1)** | The column-level revoke broke `vacancies_select`'s own policy (it reads `companies.owner_id` in a correlated subquery with no `TO` clause, so anon must be able to evaluate it) — broke anon job browsing entirely. Reverted (`202608070003`). Needs a different implementation (route the ownership check through a SECURITY DEFINER function instead of a raw column read) — not re-attempted this pass. |
| F6 (RPC anon-EXECUTE) | ⚠️ **Partially fixed, live** | `owns_candidate_profile`/`candidate_discoverable`/`employer_sees_candidate` correctly revoked from anon (safe — confirmed not referenced by any `{public}`-scoped policy). `is_admin()` had to be **re-granted to anon** (`202608070002`) — it's referenced inside 9 `{public}`-scoped admin-bypass policies across profiles/companies/vacancies/applications/moderation_flags/conversations/analytics_events, and Postgres must be able to evaluate a policy's expression for a role even on OR-branches that end up false for that role. Revoking it broke anon reads platform-wide. `is_admin()` itself is safe to leave anon-executable (reads `auth.uid()`, which is null for anon, and returns false — no data exposure). |
| F7 (resolve_candidate_subscription_plan) | ✅ **Fixed, live** | Confirmed not referenced by any RLS policy (only called from within another SECURITY DEFINER trigger function, which doesn't need its own EXECUTE grant on functions it calls internally) — revoke was safe, no regression. |
| F8 (consume_ai_quota parameter) | ✅ **Fixed, live, backward-compatible** | Same deploy constraint as F3: the *currently deployed* ai-assist/parse-resume functions still call the old `{daily_limit: N}` form. Rather than break them, the DB function was restored to the original signature with `daily_limit` now an ignored, unused parameter (`202608070005`) — closes the actual vulnerability (limit can't be forged) with zero deploy needed. Confirmed live: OpenAI call now reaches the point of hitting the OpenAI API itself. |
| F9 (diagnostic code) | ✅ **Fixed** | Removed from `src/services/supabase.ts`. |
| F10 (seed password) | ✅ **Fixed in code** | Script now requires `SUPABASE_SEED_PASSWORD` with no default and refuses to run in production. 🧑 **Owner should still rotate `hr@azercell.com`/`ali@example.com`'s actual password** — the fix prevents *future* silent reuse, it doesn't change the already-set live password. |
| F11 (conversations DM-anyone) | ✅ **Fixed, live** | Live-tested: DM with a fake `application_id` → 403; legitimate application-thread and support-thread creation → 201. |
| backend/supabase/ doc trap | ✅ **Fixed** | Directory deleted, README pointers corrected. |

**New finding from live verification, not in the original audit:** the
configured `OPENAI_API_KEY` returns `"Incorrect API key provided"` from
OpenAI directly — it's set, but invalid/expired. 🧑 Owner must supply a
working key.

**Also discovered:** `ai-assist`/`parse-resume` in this environment cannot be
redeployed (no CLI auth token). Any further Edge Function code changes in
this pass are **committed to the repo but not live** until
`supabase functions deploy <name>` is run by someone with access — flagging
this constraint for the rest of this pass and for the final release checklist.

Gates re-run clean after every migration in this wave: `npx tsc --noEmit`
(0 errors), `npx jest` (182/185, 3 pre-existing intentional skips),
`npx expo export --platform web` (builds), `npm run supabase:verify` +
`npm run supabase:smoke` (both pass).

---

## 1. P0 — Security (fix first, in this order)

Recommended sequence (security-auditor): **F3 → F2 → F4 → F1 → F5**, because
F3 is a one-file live-exploitable CV leak, F2 is a full account-takeover
vector, and F1/F4 compound each other.

### 1.1 🤖 F2 — Self-service admin escalation via signup metadata
`supabase/migrations/202605060003_harden_auth_user_trigger.sql:10` casts
client-controlled `raw_user_meta_data->>'role'` straight into `user_role`.
`prevent_role_self_escalation` only fires on `UPDATE`, never `INSERT`. Any
signup with `{ data: { role: 'admin' } }` becomes an admin — unlocks every
`*_admin_all` policy platform-wide. **Reproducible 2/2** (stopped short of
completing it live to avoid creating a real prod admin account).
**Fix:** force `'candidate'` in `handle_new_user()` regardless of metadata;
extend the escalation guard to `BEFORE INSERT OR UPDATE`.
**Acceptance:** signup with a forged `role` in metadata creates a `candidate`
row; direct `UPDATE profiles SET role='admin'` still rejected (already true).

### 1.2 🤖 F3 — `parse-resume` IDOR: any authenticated user reads any file in any bucket
`supabase/functions/parse-resume/index.ts:80-103` — `bucket`/`path` are
caller-controlled, then downloaded with the **service-role client**, bypassing
all storage RLS. Live-verified exploitable (reached the service-role download,
failed only on a nonexistent test path). Real paths return full CV contents
— name, contacts, work history, education — for any user.
**Fix:** hardcode `bucket = 'cv-uploads'`; require `path` to start with
`candidates/${user.id}/` unless the caller is the owning employer via
`employer_can_view_candidate_cv()`.
**Acceptance:** an authenticated user requesting another user's CV path gets
403, not a parsed document.

### 1.3 🤖 F4 — `applications_update` missing `WITH CHECK` → forge `candidate_id`
`supabase/migrations/202605060000_initial_schema.sql:366-368`. `USING`
constrains `vacancy_id` only; without `WITH CHECK`, Postgres reuses `USING`
for the new row, so `candidate_id` is unconstrained on `UPDATE`. Chain: insert
your own `candidate_profiles` row → apply to your own vacancy → `PATCH
applications SET candidate_id = '<victim>'` → `employer_sees_candidate()`
returns true → read the victim's full profile + private CV, even if
`is_discoverable=false`. Verified by policy semantics; not live-mutated.
**Fix:** add `WITH CHECK` pinning both `vacancy_id` and `candidate_id`, or
narrow the employer `UPDATE` grant to status/notes/rating columns only.
**Acceptance:** an employer `UPDATE`-ing `candidate_id` on an application they
don't own is rejected.

### 1.4 🤖 F1 — Any authenticated user reads every user's email/phone/push token
`supabase/migrations/202608010001_rls_pii_lockdown.sql:42-43` —
`profiles_select ... TO authenticated USING (true)`. Live-confirmed as a
plain employer: full dump of all profiles' `email`, `phone`, `role`, and
**live Expo push tokens** (which need no auth to send arbitrary
notifications — a phishing channel, not just a privacy leak). This is worse
than the old punchlist's P1 framing: it's live, it's real users' real PII
(including the owner's own email/phone), and it leaks `role` for account
targeting.
**Fix:** the previously-planned approach — SECURITY DEFINER contact RPC +
column-level `REVOKE SELECT (email, phone, expo_push_token) ON
public.profiles FROM authenticated`, re-`GRANT` a safe column list, repoint
the 5 call sites below. `expo_push_token` is write-only in the client
already, so revoking `SELECT` on it is free; keep `UPDATE` granted.
**Call sites needing repointing** (exact, from the audit):
- `src/services/engagementService.ts:394-404` — `fetchEmployerApplications`, nested `profiles(email, phone …)`
- `src/services/engagementService.ts:517-527` — `updateApplicationStatus` (`UPDATE…RETURNING` — **breaks under a table-level revoke**, must go through the RPC)
- `src/services/engagementService.ts:648-658` — `updateApplicationReview` (same `RETURNING` risk)
- `src/services/adminService.ts:240` — `.select('id,email,role,…')`
- `src/services/adminService.ts:247` — `.or('…email.ilike…')` — server-side filter on a revoked column, needs a different approach (search by name only, or a security-definer search RPC)
- Mappers: `engagementService.ts:172,175,177`, `adminService.ts:55`; types `src/types/models.ts:34,37,324`; render sites `app/(employer)/applicant/[id].tsx:223-227` (already null-guarded) and `app/(admin)/users.tsx:44` (**not** guarded — add a null check)
- Zero existing `.rpc()` calls in the client — this is the first.
**Acceptance:** anon and non-relationship authenticated reads of
`profiles.email/phone/expo_push_token` return null/absent; employer
applicant-detail and admin user-detail still show contact info via the RPC;
`npm run supabase:smoke` plus a manual employer-applicant-detail +
talent-search check both pass against live data (seed accounts:
hr@azercell.com / ali@example.com).

### 1.5 🤖 F5 — `companies_select` exposes every employer's `auth.users` UUID to anon
`202605060000_initial_schema.sql:349` — public read with no column
restriction; `owner_id` (a real auth UUID, the join key for targeted attacks)
is live-readable with no login. Missed by the PII lockdown pass (which only
touched `profiles`/`candidate_profiles`).
**Fix:** column-level revoke on `owner_id` for anon (keep it for
`authenticated`/owner), or split into a public view.

### 1.6 P2 — Rest of the security findings (bundle into the same migration wave)
- 🤖 **F6** — `owns_candidate_profile`, `candidate_discoverable`,
  `employer_sees_candidate`, `is_admin` RPCs are anon-callable despite a
  `REVOKE` in `202608020002` — the grant didn't take live (likely Supabase's
  default schema-wide `GRANT EXECUTE` reapplied after). Re-revoke and verify
  with `\df+` after the next push, don't assume a migration's `REVOKE` stuck.
- 🤖 **F7** — `resolve_candidate_subscription_plan` is the only parameterized
  SECURITY DEFINER with no `REVOKE FROM PUBLIC` — anon can enumerate which
  candidates pay. Revoke, or validate caller ownership.
- 🤖 **F8** — `ai-assist` passes caller-supplied `body.system` through
  unconstrained (open LLM proxy on your OpenAI bill); `consume_ai_quota`
  takes its ceiling as a caller-supplied RPC param, so a user can call it
  directly with an inflated limit. Drop `body.system`; resolve the quota
  ceiling server-side inside the function, not as a parameter.
- 🤖 **F9** — Leftover TEMP DIAGNOSTIC block in `src/services/supabase.ts:29-40`
  (uncommitted): logs URL/config to console + fires an extra unauthenticated
  health-check fetch on every cold start. Delete before building.
- 🧑/🤖 **F10** — `scripts/seed-supabase-real.mjs:6` hardcodes
  `DEFAULT_PASSWORD = 'AxtarisSeed2026!'`, git-tracked, and **is the live
  password today for `hr@azercell.com` and the admin account
  `ali@example.com`.** Fix in code: require `SUPABASE_SEED_PASSWORD` env var
  with no default, refuse to run when `EXPO_PUBLIC_APP_ENV=production`. 🧑
  Owner should also rotate those two accounts' passwords once the script is
  fixed.
- 🤖 **F11** — `conversations_insert` lets any user DM any other
  (`participant_b` unvalidated) — combined with F5's UUID harvest, a spam/
  phishing vector. Validate `participant_b` against a real relationship
  (application or existing thread) before allowing `kind != 'support'`.
- 🤖 **Documentation trap** — `backend/supabase/migrations/` (6 files) is a
  stale, byte-identical-but-incomplete duplicate of the real
  `supabase/migrations/` (17 files) — missing every migration from
  `202607160003` onward, **including both RLS lockdown migrations**.
  `backend/supabase/README.md` tells onboarders to apply this partial set via
  raw `psql`. Delete `backend/supabase/` or reduce its README to a pointer at
  `supabase/migrations/`.

---

## 2. P0 — Crash/data-loss bugs

**Status: all three ✅ fixed, live-verified.** `202608070006` +
`202608070007` (search_path hotfix — `uuid_generate_v4()` lives in the
`extensions` schema in this project, not `public`; same class of "SET
search_path narrowed too far" mistake as Wave 1's `is_admin()` regression,
caught immediately via a live RPC call rather than shipped blind) added
`reconcile_candidate_child_rows`, a SECURITY DEFINER RPC that does the
insert+delete in one statement and serializes concurrent calls per
`(candidate, table)` via `pg_advisory_xact_lock`. Live-tested with two
genuinely concurrent (parallel, backgrounded) requests against a real seed
candidate: result was one surviving row (last-write-wins), never zero.
`candidateVacancyService.reconcile.test.ts` rewritten around the RPC and
all 4 tests pass (the previously-skipped concurrency test now runs and
passes for real, via a fake that simulates the advisory-lock serialization).
2.2 and 2.3 are one-file client-only fixes, applied and `tsc`/`jest`-clean.

### 2.1 🤖 Concurrent profile saves can wipe an entire child table
`src/services/candidateVacancyService.ts:346-383` (`reconcileChildRows`) is
insert-first/delete-after, untransacted, no concurrency token. Two overlapping
saves (e.g. save-then-quickly-delete, or two devices) each delete rows not in
*their own* freshly-inserted id set — reproduced against a stateful fake, the
table ends **empty**. `updateCandidateProfile` reconciles all four child
tables (experience/education/languages/certifications) on *every* save, and
neither the profile-edit save button nor the experience-delete button guards
against a double-tap.
**Fix:** move the reconcile into one SECURITY DEFINER RPC so insert+delete
share a single transaction (a client-side mutex isn't sufficient — two
devices still race).
**Acceptance:** un-skip the test in
`src/services/candidateVacancyService.reconcile.test.ts` (already written,
documents the exact repro) and it passes.

### 2.2 🤖 Password-reset deep link bounces to onboarding, permanently locking the user out
`app/_layout.tsx:213` — the unauthenticated onboarding-redirect branch is
missing `&& !isAuthRoute`. A user tapping a (single-use) reset email on a
fresh install gets flashed to onboarding instead of the reset screen, and the
link is now spent.
**Fix:** add the missing `!isAuthRoute` exemption, matching the pattern
already used for the authenticated-bounce case at `:243`.
**Acceptance:** cold-launch → tap a valid reset link → lands on
`/auth/reset-password`, not onboarding.

### 2.3 🤖 Killed-state push notification taps are always dropped
`src/hooks/usePushNotifications.ts:15-42` — no
`getLastNotificationResponseAsync` handling anywhere in the repo; the tap
listener also isn't registered until auth hydration finishes (a network
round-trip after launch), and there's no `useRootNavigationState` guard.
**Fix:** handle the killed-state launch response, register the listener
before/independent of auth hydration, guard `router.push` on nav-tree
readiness.

---

## 3. P0 — Store compliance (blocks submission to both stores)

**Status:** §3.1 (checkout rewrite), §3.3 (pricing mismatch), §3.4 (stale
`ios/`) ✅ fixed and live-verified in a real browser session (signed in as
a seed candidate, activated a plan end-to-end, confirmed the success flow
and a real DB write — no card form anywhere, "Free during beta" +
included-benefits + coming-soon note render correctly in az). Also applied:
`supportsTablet: false` (removes the iPad-screenshot requirement — flip
back if iPad screenshots get produced), `expo-secure-store` faceIDPermission
disabled, Android `monochromeImage` wired to the existing asset, and the
unsubstantiated "join thousands" social-proof copy softened in all 3
locales. §3.2 (real privacy/terms copy) and §3.5/§3.6 remain 🧑 owner
items — see §8.
**Pricing correction note:** project memory resolves the 29/99-vs-19/49
mismatch the audit flagged — 19/49 is the deliberate, later value (shipped
2026-07-23, "owner wants supply growth"); the locale files had the stale
pre-revision number. Fixed *toward* 19/49, not away from it.

### 3.1 🧑 decision + 🤖 implementation — In-app card checkout is fake and non-compliant
`app/checkout.tsx` collects a real card number/expiry/CVV, Luhn-validates
locally, then **sleeps 1700ms and never contacts a payment processor** — no
card data is transmitted anywhere. There's a "Fill demo card" button and an
in-UI "Simulated payment — no real charge" note. This is a compound rejection
risk: Apple 3.1.1 (subscription sold outside IAP), 2.1/2.3.1 (a demo-labeled
non-functional payment UI in production), plus real consumer risk (users
typing real card numbers into a form with no PCI processor behind it).

**Recommended resolution (store-compliance agent's analysis, not the
originally-assumed "push to web" or "integrate StoreKit"):** since **no money
is actually being taken on any platform** (web hits the same fake sim), the
honest and smallest fix is to ship as **free during beta**. This removes
3.1.1/2.1/2.3.1 entirely rather than working around them, and the i18n
strings for exactly this (`checkout.freeDuringBeta`,
`checkout.paymentComingSoon`, `checkout.activate`) already exist in all 3
locales, unused. 🧑 **This is the owner's call** — if real payment at launch
is required instead, that's a separate, much larger scope (StoreKit/Play
Billing or RevenueCat integration). Concrete step-by-step implementation for
the free-during-beta path is in the audit transcript (rewrite `checkout.tsx`
into a plan-confirmation screen, delete `PaymentCard.tsx`'s card-collection
parts, zero out displayed prices in all 3 locales + `subscriptionService.ts`,
stop persisting a nonzero `price_amount`).
**Acceptance:** no screen collects card details; App Store Connect's IAP
section stays empty; a fresh install can activate any plan with the
UI clearly stating no charge occurs.

### 3.2 🧑 Privacy policy + Terms are placeholder text, and unhosted
`app/legal/privacy.tsx` / `legal.termsBody` literally end with "This document
is placeholder text." No hosted HTTPS policy URL exists anywhere. Both stores
require one (listing + Data Safety form). Even once real copy is supplied, it
must disclose facts the current draft contradicts: OpenAI receives full CV
text + AI prompts; `analytics_events` is linked to `user_id`; push tokens are
sent to Expo; `profile_views` tracks who viewed whom; `avatars`/
`company-media` are public buckets; `is_discoverable` defaults to `true`
(employers can read a candidate's full profile via talent search without an
application). **Owner must supply real, lawyer-reviewed copy** covering all
of the above, hosted at a public URL. Code side (🤖): wire the real copy in
once supplied, and fix `legal.lastUpdated` to a real date.

### 3.3 🤖 Employer price shown ≠ price charged
All 3 locales advertise employer plans at **29/99 AZN**
(`src/i18n/locales/{en,az,ru}.ts:817,827,840-841`) while
`src/services/subscriptionService.ts:73,83` charges **19/49 AZN** — the
number the checkout screen actually renders and charges. Candidate tiers
(5/15) are consistent. Reconcile to one number (ties into §3.1 if going
free-during-beta, since prices get hidden anyway — but the source-of-truth
mismatch should still be fixed).

### 3.4 🤖 Stale `ios/` directory would ship a microphone permission string
`ios/AxtarIS/Info.plist` predates `app.json`'s permission config — still has
`NSMicrophoneUsageDescription` and generic Expo purpose strings. `ios/` is
gitignored so EAS *cloud* builds are unaffected (they prebuild fresh from
`app.json`), but a local `expo run:ios`/`eas build --local` would ship the
already-removed mic permission — a guaranteed rejection. Delete `ios/` (and
`android/` if present) from disk, or standardize on `expo prebuild --clean`.

### 3.5 🧑 Confirm Supabase Auth redirect allow-list includes the reset-password deep link
`axtaris://auth/reset-password` is emitted by `authService.ts:193`. The
hosted allow-list lives in the Supabase dashboard (not readable via the anon
REST API from this audit). **App reviewers routinely test password reset** —
if unlisted, this is a Guideline 2.1 rejection. 🧑 Owner or a session with
dashboard/Management-API access must verify.

### 3.6 🤖 Verify chat has report + block, not just a moderation table
`moderation_flags` exists in schema; both stores require report/block
affordances for UGC + 1:1 messaging apps (Apple 1.2). The client-side
coverage wasn't traced in this audit — confirm `app/chat/[id].tsx` and
candidate/company profile screens actually expose report and block before
answering the content-rating questionnaire.

---

## 4. P1 (bugs, i18n, perf) — fix after P0s, before/soon after launch

### Bugs (code-reviewer)
- ✅ **Fixed, live-verified** — talent invites double-firing on a transient
  network error (`talentService.ts` now checks `existing.error` before
  falling through to INSERT, matching `applyToVacancy`) **and** the missing
  DB backstop (`idx_candidate_invites_company_candidate_unique`, migration
  `202608070008` — checked for existing duplicate rows first, zero found).
  Live-tested via direct REST: first invite 201, an identical second insert
  409s with a unique-constraint violation. Previously-skipped regression
  test now runs and passes.
- 🤖 **Still open**: invite quota (`invitesPerMonth`) is enforced
  **client-side only** — a free employer can still spam invites up to the
  unique-per-candidate limit (i.e. one invite per distinct candidate, but
  unlimited distinct candidates) via direct PostgREST calls, since nothing
  server-side checks the plan's monthly cap. Needs a quota-check trigger or
  RLS policy addition, deliberately not attempted this pass (same class of
  change as the reconcile-RPC and RLS fixes that needed live hotfixing
  earlier in this session — wanted a fresh look rather than rushing it).
- ✅ **Fixed, live-verified** — saved/applied-to vacancies no longer vanish
  once they leave `active`. Extended `vacancies_select` (migration
  `202608070009`) via a new SECURITY DEFINER `candidate_has_vacancy_access()`
  helper rather than an inline subquery — the policy has no `TO` clause
  (anon must evaluate it too) and `applications_select_candidate` already
  references `vacancies`, so an inline check would have recreated the exact
  candidate_profiles↔applications recursion `202608020002` already had to
  fix once. Live-verified: anon browsing unaffected, the owning employer's
  update still works, and a candidate with a real saved-job row *or* a real
  application both correctly keep seeing the vacancy after it's closed —
  the two "control" accounts I first picked as unrelated turned out (per a
  ground-truth query) to already have real seed applications to that
  vacancy, which is why they could see it too; not a bug.
- ✅ **Structurally fixed as a side effect of §3.1** — "Pay 0 AZN" when the
  plans query fails is no longer reachable: the rewritten `checkout.tsx`
  doesn't read `plans[].monthlyPriceAzn` or render a price/pay amount at
  all anymore, and `subscriptionService` always persists `price_amount: 0`
  now regardless of plan.
- ✅ **Fixed** — blank paywall / wrong plan on query failure.
  `fetchEmployerSubscriptionPlan` used to swallow *every* error (not just
  "table doesn't exist yet") and silently return `'free'`; now only that one
  specific case falls back, everything else propagates so `app/subscription.tsx`'s
  new employer-side `isError` branch (it had none before) can show a real
  retry state instead of quietly telling a paying employer they're on Free.
- ✅ **Fixed** — failed inbox no longer silently renders as "no messages".
  `app/messages.tsx` and `app/chat/[id].tsx` both now read `isError` from
  their query hooks and show a retry state instead of falling through to
  the empty-list/empty-thread copy.
- ✅ **Fixed, test-verified** — daily application-limit undercounting.
  Replaced the capped `.limit(20)` row-fetch-then-JS-filter with an exact
  `count:'exact',head:true` query against a computed start-of-Baku-day
  threshold — structurally can't under-count regardless of volume.
  `subscriptionService.quota.test.ts` extended with a 25-applications-in-a-day
  case (previously would have under-reported to 20) and a threshold-shape
  assertion; both pass.
- ✅ **Fixed, live-verified** — `fetchEmployerApplications` now filters via
  `vacancies!inner(...)` + `.eq('vacancies.company_id', ...)` pushed into the
  query itself, rather than fetching every application on the platform and
  filtering in JS. RLS already scoped this correctly (verified), so this is
  defense-in-depth + real efficiency, not a security fix per se — but given
  how many RLS bugs turned up elsewhere in this same pass, not relying on
  RLS alone here felt worth the extra query. Live-tested: the filtered
  query returns only the calling employer's own applications.
- ✅ **Fixed, test-verified** — certification expiry not validated.
  `certificationSchema` (`src/services/validation.ts`) gained an
  `expiryDate: z.string().optional()` field and a `.refine` mirroring
  `experienceSchema`'s pattern (`!expiryDate || expiryDate >= issueDate`,
  path `['expiryDate']`); `app/profile/certification/[id].tsx`'s save
  handler now passes `expiryDate` into the `safeParse` call (it was
  collected in state and written to the model already, just never
  validated). Un-skipped the pre-written
  `validation.test.ts` test that documented this exact gap.
- ✅ **Fixed, live-verified** — duplicate support-conversation on
  double-tap. Client-side: `handleContactSupport`
  (`SettingsScreen.tsx`) now early-returns while
  `startSupport.isPending`, and the button itself is `disabled` during
  the mutation. Data-layer: found and confirmed a **live duplicate** in
  production (one user had 2 support conversations — one real with a
  message from Jul 15, one empty stray from this session's own testing
  earlier today). Deleted the empty duplicate (user-confirmed before the
  delete, per the no-destructive-ops-without-confirmation constraint),
  then added migration `202608070010_support_conversation_unique_index.sql`
  (partial unique index on `conversations(participant_a) WHERE
  kind='support'`, applied live), plus a race-retry in
  `getOrCreateSupportConversation` (`chatService.ts`) matching the
  existing pattern in the sibling `getOrCreateApplicationConversation` —
  on insert conflict, re-fetch and return the row the other caller
  created instead of throwing.
- ✅ **Fixed** — 3 auth screens with no keyboard-avoidance/scroll escape.
  `verify-otp.tsx`, `forgot-password.tsx` (form state only — the
  post-submit "check your email" state has no inputs, left as a plain
  `View`), and `reset-password.tsx` now wrap their forms in
  `KeyboardAvoidingView` + `ScrollView` with `keyboardShouldPersistTaps
  ="handled"`, matching the working pattern already used by
  `sign-in.tsx`/`sign-up.tsx`. Container styles switched `flex: 1` →
  `flexGrow: 1` where reused as `contentContainerStyle` (the former
  silently defeats scrolling once content exceeds the viewport with the
  keyboard open).
- ✅ **Fixed** — silent optimistic-bookmark rollback. `useToggleSavedJob`
  (`useCandidateVacancyActions.ts`) already rolled back the optimistic
  save/unsave on failure but told the user nothing; `onError` now also
  shows an `Alert` (new `errors.saveToggleFailed` key, all 3 locales).
  Fixed once in the hook rather than at each of the 3 fire-and-forget
  call sites (`saved.tsx`, `home.tsx`, `vacancy/[id].tsx`).
- ✅ **Fixed** — unchecked conversation-preview update. Both
  `sendMessage` and `sendImageMessage` (`chatService.ts`) update the
  conversation's denormalized `last_message`/`last_message_at` as a
  best-effort call after the message insert already succeeded; the
  `{ error }` was previously discarded entirely. Now captured and
  `console.warn`'d — deliberately not thrown/surfaced to the user, since
  the message itself already sent successfully and this is just a
  list-preview staleness risk, not a failed send.
- ✅ **Verified already fixed, not a live bug** — "usage counter
  saturating at 20 rows" was the same `applicationsUsedToday` undercount
  already closed earlier in this pass (§3.1's quota fix, exact-count
  query replacing the `.limit(20)` fetch-and-filter). Re-audited the
  entire `src/services/` tree for any other capped-`.limit(20)` quota
  counter — none exists; this punchlist line was stale.
- 🤖 **Partially addressed, rest flagged open** — 5-minute realtime
  message gap with no push safety net. Added the missing
  `refetchInterval: 15000` fallback to `useMessages` (`useChat.ts`),
  matching the pattern `useConversations` already had — a genuinely
  cheap, contained fix for the "realtime socket silently dropped"
  half of this bug. **Still open, not attempted**: chat messages never
  insert a `notifications` row, so there is no push-notification safety
  net at all for a message sent while the recipient's app isn't
  foregrounded/subscribed (traced: `send-push` only triggers off
  `AFTER INSERT ON notifications`, and nothing in `chatService.ts`
  writes to that table). Closing this fully means inserting a
  notification row on message send (with sender-exclusion and probably
  a "recipient already has this thread open" suppression check) — a
  real feature addition, not a cleanup-pass-sized fix, so left open by
  design rather than rushed.

### i18n (i18n-auditor)
- ✅ **Fixed** — AI-assist English fallback text (vacancy
  description/requirements/responsibilities, cover letters, experience
  bullets, applicant fit-reason chips) is now routed through `i18n.t()`
  under a new `ai.fallback.*` namespace, translated in all 3 locales,
  `parity.test.ts` green. `src/services/aiService.ts`.
- ✅ **Fixed** — all sites showing raw `error.message` verbatim now route
  through `toUserMessage()`, including all 5 auth screens. Fixed the 5 auth
  screens by hand first (highest visibility), then the remaining 19 files
  via a scripted transform (regex-matched the exact
  `X instanceof Error ? X.message : tr('common.error')` /
  `X?.message || tr('common.error')` shapes per catch-variable name,
  inserted the `toUserMessage` import where missing) — 34 substitutions
  there + 5 by hand = 39, matching the audit's count exactly. Verified no
  raw-message patterns remain in the UI layer (the 3 remaining
  `.message` hits after the fix are legitimate: an error-type string match
  for UI branching in `vacancy/[id].tsx`, service-layer `Error`
  construction in `api.ts`, and an unrelated `message` data field in
  `talentService.ts`). tsc clean, jest green, expo export builds.
- ✅ **Fixed** — the English service-thrown strings ("Candidate profile not
  found", "Vacancy not found", "Company not found", "Application not
  found", "Rating must be between 1 and 5", "Empty message", "Missing
  image", "Subscription (summary) not found", "Search name is required",
  "Company and candidate are required") now go through `i18n.t()` under
  new `errors.*` keys, translated in all 3 locales, across
  `candidateVacancyService.ts`, `vacancyService.ts`, `talentService.ts`,
  `engagementService.ts`, `chatService.ts`, `subscriptionService.ts`, and
  `candidateGrowthService.ts`. One scripted-edit mistake caught immediately
  by the tsc/jest gate: the import got inserted mid-statement inside a
  multi-line import block in `engagementService.ts` (broke compilation),
  fixed before this landed. `talentService.test.ts` updated to assert
  against the translated string via the real `i18n.t()` call instead of a
  hardcoded English duplicate, so it can't silently drift from the source
  key again.
- ✅ **Fixed** — hardcoded AZ city chips on `app/(candidate)/search.tsx`
  replaced with `getSuggestions('cities', lang)`, matching the pattern
  already used correctly on the vacancy-create screen.
- ✅ **Fixed** — `app/(admin)/finance.tsx` KPI tile now has the same
  `numberOfLines={2} adjustsFontSizeToFit` guard its dashboard sibling has.
- ✅ **Fixed** — all P2 misc items. Salary min/max labels now
  `candidate.salaryMin`/`salaryMax` (was `` `${tr('candidate.salary')} (min)`
  ``). Onboarding's decorative "Bakı" badge now `onboarding.slide3CityBadge`
  (Baku/Bakı/Баку per locale). `CvViewer.web.tsx`'s iframe title now reuses
  `cv.preview`. `DialogHost`'s button-text fallback now `i18n.t('common.ok')`.
  Admin's raw `role`/`entityType` DB enums now go through new
  `getRoleLabel`/`getModerationEntityTypeLabel` helpers in `labels.ts`
  (`admin.roleLabels.*` / `admin.moderationEntity.*` — named to avoid
  colliding with the pre-existing `admin.role` column-header string, which
  tsc's duplicate-object-key check caught immediately). `admin.evt.*`'s
  dynamic key now has a `defaultValue` fallback to the raw event name
  instead of rendering the literal untranslated key string. Checkout's
  demo-fill "Test User" and the card placeholder "YOUR NAME" no longer
  exist at all — moot, removed by the §3.1 checkout rewrite.

### Performance (perf-analyzer)
- 🤖 **Lucide barrel ships all 1704 icons for ~70 used** (~120KB gzip, ~11%
  of the bundle) — confirmed real. **Correction to the audit's suggested
  fix:** deep ESM imports (`lucide-react-native/dist/esm/icons/<name>`) are
  **not** "zero risk" — tested live and it breaks Jest module resolution
  outright (`Cannot find module`) across every file touched, because
  `lucide-react-native`'s `package.json` `"exports"` map only declares `"."`
  and `"./icons"` as public subpaths; `dist/esm/icons/<name>` isn't in it,
  so Jest's exports-aware resolver rejects it even though the file exists
  on disk (Metro's behavior here wasn't separately verified before this was
  reverted). A real fix needs either an `"./icons/*"` wildcard export from
  a future lucide-react-native release, a jest `moduleNameMapper` +
  confirmed-safe Metro config together (its own validation pass), or
  accepting Metro's experimental tree-shaking (a global build-behavior
  change, same caveat the original audit gave it). Not attempted again
  this pass — left open, P2.
- ✅ **Fixed** — `VacancyCard`'s `onPress`/`onSave` props changed shape from
  bound zero-arg callbacks (`() => void`, forcing a fresh closure per row
  per render) to id-taking callbacks (`(id: string) => void`), matching the
  audit's exact suggested fix. Each of the 4 call sites (`saved.tsx`,
  `search.tsx`, `home.tsx` ×2 — the "recommended" FlatList and the "recent
  jobs" list) now hoists ONE stable `useCallback` per screen instead of a
  closure per row, and wraps its own `renderItem` in `useCallback` too, so
  `React.memo` on `VacancyCard` can actually skip re-rendering rows whose
  data hasn't changed. Smoke-tested in a real browser: card-press
  navigation and the save/bookmark toggle both still work correctly after
  the refactor (toggled a real saved-job row on and back off against
  production). The `home.tsx` "Top Companies" FlatList's unmemoized
  `renderItem` was left as-is — it doesn't use `VacancyCard`, so it's a
  separate, lower-priority version of the same class of issue, not part of
  the "fix together or neither works" pair the audit specifically called
  out.
- ✅ **Fixed, gate-verified** — `expo-image` promoted from a transitive
  resolution to a direct dependency (`npx expo install expo-image`, which
  also registered its config plugin in `app.json`). Swapped the RN `Image`
  import for `expo-image`'s in `Avatar.tsx` (network avatar/company-logo
  path only — the SVG branch still uses `react-native-svg`'s `SvgUri`,
  unaffected) and both remote-image sites in `app/chat/[id].tsx`
  (`ChatImageBubble` thumbnail + fullscreen viewer modal), gaining
  memory/disk caching for images that get re-shown across screens.
  Checked the flagged risk directly against `expo-image`'s type
  definitions rather than assuming: its `ImageStyle` is a re-export of
  RN's `ImageStyle` (style prop is unaffected), and both `onError` call
  sites here ignore the event argument entirely
  (`onError={() => setImageFailed(true)}`), so the differing
  `ImageErrorEventData` vs. RN's `NativeSyntheticEvent` shape is a
  non-issue — no runtime behavior change. `resizeMode="cover"/"contain"`
  renamed to `contentFit` (expo-image dropped `resizeMode`). `tsc`/`jest`
  clean after the change; live auth-gated visual smoke test (avatar
  broken-image → initials fallback) was blocked by the auto-mode
  classifier on credential entry mid-session and not completed — flagged
  here rather than silently skipped.
- ✅ **Fixed, live-verified** — `applyToVacancy`'s subscription-summary
  fetch and the candidate profile lookup are now `Promise.all`'d instead of
  sequential (the profile lookup is also now a narrow `id, cv_url` select
  via a new `fetchCandidateIdAndCv`, not the full 5-collection profile —
  the daily-limit check moved to after both resolve, a small trade-off:
  the profile fetch is no longer skipped in the rare already-at-limit
  case, in exchange for one fewer round trip on every successful apply).
  `updateCandidateProfile`'s 4 independent `sync*` calls (work experience/
  education/languages/certifications, each its own advisory-locked RPC
  call per table — see the reconcile-RPC fix in §2.1, different lock keys
  so no contention from parallelizing) are now `Promise.all`'d instead of
  4 sequential awaits. Also caught and fixed an existing hardcoded English
  string surfaced while touching this code
  (`errors.dailyLimitReached`, was "Daily application limit reached for
  current subscription plan").
- ✅ **Fixed, live-verified** — the two launch-path logo PNGs (1,351,774 and
  593,082 bytes at 4096×4096, decoded on the splash/onboarding route) were
  resized via `sips -Z` uniform downsample to 512×512 (38,818 bytes) and
  1024×1024 (88,400 bytes) — both still ≥4× their largest on-screen render
  size. Alpha channel preserved (confirmed via `sips` metadata pre/post).
  Verified via `expo export --platform web` that the content-hashed bundle
  picks up the smaller files, and visually via Playwright screenshots of
  `/auth/sign-in` and `/onboarding` (both logos render crisp, no distortion,
  0 console errors) — same composition, ~93-97% smaller.
- P2 remainder (admin moderation ScrollView of ~150 cards, `ListHeaderComponent`
  passed as JSX losing filter-input focus, `Avatar` no loading placeholder,
  unused `useThemeStyles` hook, N+1 in `fetchEngagement`/`fetchDashboardStats`,
  `searchTalent`/`fetchEmployerVacancies` filtering after a `.limit()`
  truncation — a correctness bug, not just perf) — file:line list in the
  perf transcript.

---

## 5. Closed / false leads (re-verified this pass — do not re-open)

- **T-028 bundle trim** — `nativewind`/`tailwindcss` confirmed absent from
  `package.json` **and** `node_modules`. `react-native-worklets` is a
  required Reanimated-4 peer. No dependency in `package.json` is provably
  unused (three have zero direct imports but are required: `expo-font` as a
  config plugin, `react-native-screens` as an expo-router peer,
  `expo-splash-screen` backing the legacy `splash` key).
- **Permissions** — iOS camera/photo/microphone-suppression and Android
  permissions all verified correct and all actually used (per `app.json` as
  currently committed; see §3.4 for the *stale local build* caveat, which is
  a different issue).
- **Encryption export declaration** — `ITSAppUsesNonExemptEncryption: false`
  is set and present in the generated `Info.plist`. No action.
- **Account deletion code path** — traced end-to-end, correct: JWT-scoped
  self-delete, cascading FK, genuine double-confirm, shared component reused
  by all three settings surfaces (candidate/employer/admin), cross-platform
  dialog wrapper. Deployment status confirmed live (§6). Only open item was
  the redirect allow-list check, folded into §3.5.
- **`app.json`/`eas.json` identity fields** — bundle ID, package name,
  version, icons, splash, adaptive icon, scheme, EAS project link all
  correct, not placeholders.
- **Edge Function auth** — all four functions (`ai-assist`, `parse-resume`,
  `delete-account`, `send-push`) correctly reject unauthenticated calls;
  `send-push` correctly fails closed on a missing/wrong `x-push-secret`; no
  `verify_jwt=false` anywhere.
- **Storage RLS** (as opposed to the service-role bypass in F3) — anon
  cannot list/read `cv-uploads`, cannot write to `avatars`; bucket
  public/private split is correct by design.
- **Secret hygiene** — no service-role key, JWT, or push secret anywhere in
  tracked files, git history, or the built web bundle;
  `SUPABASE_SERVICE_ROLE_KEY` referenced only from `supabase/functions/**`
  and `scripts/**`.
- **i18n key parity** — az/ru/en have identical key sets across all 764 leaf
  keys, zero dangling `tr()` calls, zod validation messages fully localized.
- **RU truncation assumption** — corrected: **Azerbaijani (44% of keys) is
  the longest locale, not Russian (42%)**, and AZ is also the default
  locale. Validate truncation fixes in AZ first.
- **Duplicate sub-entity save-time regression** (the *old* bug, non-
  concurrent) — the self-healing reconcile still works correctly for
  sequential saves; the *new* P0 in §2.1 is specifically the concurrent-save
  case, a different failure mode.
- **Quota parity** (client vs DB, both 10 for pro) — still correct on both
  sides. Minor hygiene note: `202607150001` redefines the resolver to 10,
  and the original `202605060000` migration file was also hand-edited in
  place to read 10 — an already-applied migration was edited after the
  fact, which is fine functionally but confusing for anyone diffing history.
- **All 17 migrations are applied live**, 1:1 with the remote project, zero
  version drift. RLS is enabled on 24/24 public tables with 60 policies —
  the migration files the security audit reviewed do reflect live reality
  (except the anon-EXECUTE grant drift in F6, and the price mismatch in
  §3.3, which are data/permission-state issues, not missing migrations).

---

## 6. Backend / Edge Function live-deployment status (verified, no owner action needed for deployment itself)

Everything below is **already deployed and live** — no `functions deploy` or
`db push` is needed for any of it:

| Component | Status |
|---|---|
| `ai-assist` | ACTIVE, `OPENAI_API_KEY` + `OPENAI_MODEL` set |
| `send-push` | ACTIVE, `PUSH_SECRET` set, correctly rejects bad/missing header |
| `delete-account` | ACTIVE |
| `parse-resume` | ACTIVE, shares `OPENAI_API_KEY` (has the F3 IDOR — §1.2) |
| Vault secret `push_secret` | exists |
| Push delivery trigger + all other triggers (notify-candidate, invite-notify, quota-guard, role-escalation-guard, auth-user-created) | exist, enabled, correctly `SECURITY DEFINER` with pinned `search_path` |
| `pg_net` | installed, request queue backlog 0 |
| AI graceful fallback when unconfigured | verified intact in code |

**Open items (owner-only, can't be probed further without secrets/a device):**
- 🧑 **Push has never actually delivered an end-to-end notification** — wired
  correctly, but only 1 profile in the whole DB has a non-null push token,
  and the response log is empty (consistent with "never exercised," not
  necessarily "broken" — pg_net expires response rows after ~6h). Needs a
  real device test before relying on it for launch.
- 🧑 **`PUSH_SECRET` (function secret) vs Vault `push_secret` value equality
  is unverifiable** from this audit (both are opaque digests). If they
  differ, `send-push` returns 401 and the trigger swallows it silently — a
  completely silent push failure. Cheapest check: regenerate both from one
  new value rather than trying to compare the old ones.
- 🧑 Confirm the OpenAI API key is valid and funded (not probeable without
  burning a real call on a user JWT).

---

## 7. Deploy/setup steps still required (from the previous punchlist — unchanged, still needed)

```bash
# Re-seed only if you want demo data rebuilt with canonical UUIDs (optional)
npm run supabase:seed
```

Everything else previously listed here (migration apply, function deploy) is
now confirmed **already done** — see §6.

---

## 8. Owner-only items (cannot be closed in code) — full list

1. **Real, lawyer-reviewed privacy policy + terms**, hosted at a public HTTPS
   URL, covering OpenAI CV processing, analytics, push tokens, profile-view
   tracking, public avatar buckets, `is_discoverable` default-on, controller
   identity, retention, international transfer (§3.2).
2. **Decision: free-during-beta vs charge at launch** (§3.1) — everything in
   §3.1/§3.3 depends on this.
3. **Support URL + support email; web account-deletion URL** for Play's Data
   Safety form.
4. **DPAs with OpenAI and Supabase** (needed to answer "not shared" on Play).
5. **Rotate `hr@azercell.com` / `ali@example.com` passwords** once F10's seed
   script is fixed (their current live password is the one hardcoded in the
   repo).
6. **Confirm Supabase Auth redirect allow-list** includes
   `axtaris://auth/reset-password` (§3.5, dashboard access needed).
7. **Real device push test** + confirm `PUSH_SECRET` ≡ Vault `push_secret`
   (§6).
8. **Confirm OpenAI key validity/funding** (§6).
9. **Screenshots** (incl. iPad if `supportsTablet` stays `true` — consider
   setting it `false` instead), **1024×500 feature graphic**, **512×512 Play
   icon**, app description/subtitle/keywords/category in az/ru/en, content +
   age rating questionnaires, a demo reviewer account (one candidate + one
   employer) with credentials in App Review notes.
10. **Apple Developer Program + Google Play Console accounts**, `ascAppId`,
    `appleTeamId`, Play service-account JSON key.
11. **Sentry DSN** (crash reporting — not yet wired, out of scope of this
    audit pass, flagging as still open from the original punchlist).

---

## 9. Execution plan for this pass (Phase 3)

1. **Wave 1 — Security migration** (§1.1-§1.6): one migration, applied via
   the IPv4 pooler, smoke-tested against live data before/after.
2. **Wave 2 — Crash/data-loss fixes** (§2): reconcile RPC, deep-link guard,
   killed-state push handling.
3. **Wave 3 — Store-compliance code changes** (§3.1 pending owner's
   free-vs-charge decision — implementing free-during-beta as the default
   recommendation unless redirected; §3.3, §3.4 immediately).
4. **Wave 4 — P1 i18n + perf + remaining bugs** (§4).
5. **Gates after every wave**: `npx tsc --noEmit`, `npx jest`, `npx expo
   export --platform web`, plus a live smoke check for anything
   RLS-adjacent.
6. **Final**: `RELEASE_CHECKLIST.md`, an Android production AAB build
   attempt, this file updated with final status.
