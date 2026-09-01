# AxtarIS — Feature & Design Suggestions (post-launch roadmap)

Compiled 2026-09-01 from a full codebase walk + competitive analysis
(boss.az, jobsearch.az, hh1.az, smartjob.az; LinkedIn/Indeed/Djinni globally).
Scores: impact for the AZ market / effort given this codebase / monetization fit (1-5).

## The top-10 next-3-months roadmap

1. **AZ payment gateway integration** — nothing else earns revenue until
   checkout is real (see docs/payments/payment-system-analysis.md for the
   decided architecture: Paddle B2B web + RevenueCat IAP + Payriff phase 2).
2. **FCM/APNs credentials + switch on the existing notification triggers** —
   the entire engagement system is built and dark; this is configuration, not
   construction (store-publishing-guide.md Phase 2).
3. **Saved-search alerts + weekly digest producer job (5/2/4)** — the best
   impact-per-effort item in the repo: saved_searches, notification types,
   send-push, and match scoring all exist; only a scheduled job (pg_cron or
   scheduled Edge Function) producing `new_job_match` notifications is missing.
   Monetize frequency: daily for free users, instant for Pro.
4. **Search facets: salary range, experience level, category + a "negotiable"
   label when salary is hidden** — the most-noticed table-stakes gap vs every
   AZ incumbent. (The filter sheet exists; this extends it.)
5. **Messages tab + unread badges for both roles** — chat is the product's
   north star but is buried behind an icon on a secondary screen. The 30s
   unread polling hook already exists to power badges. Candidate tab bar:
   fold Saved into Search as a segment, give the slot to Messages.
6. **Telegram integration (5/3/4)** — Telegram is the de-facto AZ job channel.
   (a) auto-post vacancies to an official channel with deep links =
   acquisition; (b) an alert bot = retention AND a push-independent channel.
   Featured vacancies get channel priority — gives the existing featuredSlots
   entitlement a visible benefit.
7. **Wire or remove the two vaporware paid entitlements (4/2/5)** —
   `spotlightProfile` (ordering boost + badge in talent search results) and
   `messageBeforeApply` (bypass application-gated chat creation). They are
   sold on the paywall today and do nothing; monetization integrity requires
   fixing this before the first paid customer.
8. **One-tap apply (4/1/3)** — when a vacancy has no screening questions,
   collapse the apply modal to a single confirm with a profile-snapshot
   preview ("Applying with: CV.pdf · profile 85% · 4/6 skills matched").
   The view→apply funnel is already instrumented, so the lift is measurable.
9. **"Responds quickly" employer badge (4/2/3)** — compute median response
   time from existing chat + analytics data; badge fast responders on
   VacancyCard; nudge slow ones. Attacks the #1 job-board complaint (silence).
   Keep the badge unbuyable.
10. **Salary insights MVP (4/3/4)** — aggregate candidate expected salaries +
    vacancy ranges into per-title/city medians. No AZ board publishes salary
    data (Djinni proved the model). Start aggregating NOW so the data moat
    compounds; ship the UI later. Free teaser median / full distribution Pro /
    employer benchmark Premium.

## Retention mechanics (mapped to existing infrastructure)

- **"A company viewed your profile" push** — add one trigger on
  profile_views insert (rows already written by talent search). The strongest
  dopamine loop in the hh/LinkedIn playbook, and every push is an upsell
  surface for the existing whoViewedYou paid tier.
- **Weekly "new matches" digest** per saved search (with №3).
- **Profile freshness tap** — weekly "still looking? confirm availability"
  that boosts talent-search ranking (hh.ru's "raise resume" mechanic — their
  most habit-forming feature). Improves employer-side data quality too.
- **Streaks: tie to profile quality/freshness, NOT application count**
  (application streaks incentivize spam and damage the employer side).
- Milestone rewards: 100% profile = +1 daily application — NOTE: the DB check
  constraint on daily limits requires a coordinated migration (see
  monetization-enforcement notes) — do not ship the reward without it.

## Design/UX fixes worth scheduling (not yet done)

- **Profile completion as a wizard**: 9 of 13 checklist items deep-link to the
  same edit screen; a "next incomplete field" stepper converts far better.
- **Match explanation below score 40**: currently hidden — show "what's
  missing" (e.g. 2 skills to add) to convert weak matches into
  profile-improvement actions; carry match reasons into notification copy.
- **Onboarding**: cut the language and theme slides (both auto-defaultable and
  changeable later) — value first.
- **Employer tab bar (6 tabs)**: merge Company into Settings; longer-term,
  nest applicants under each vacancy (per-vacancy pipeline board).
- **Applicant count on cards**: bucket at "50+" or hide above a threshold —
  large counts suppress applications.
- **Vacancy deadlines**: `expiresAt` exists in the model but isn't surfaced;
  "son müraciət tarixi" is standard on AZ boards and creates urgency.
- **Application withdrawal**: no withdraw action exists anywhere; candidates
  expect it and Apple reviewers occasionally probe for it in account flows.
- **Company reviews**: the company rating stat renders from a bare DB column
  with no review mechanism — either build reviews or hide the number.
- **Share button on vacancies + public web vacancy pages**: job boards grow
  via Telegram/WhatsApp forwarding and indexed listings; both channels are
  currently closed. (Pairs with the landing site infrastructure.)
- **Search pagination / server-side filtering**: client-side filtering over
  the full vacancy list hits a cliff at ~1000 rows (PostgREST default cap) —
  schedule `.range()` + server filters before marketing pushes volume.

## Deliberately deferred (right ideas, wrong quarter)

pgvector semantic matching (the transparent weighted matcher is more
explainable and good enough), 30-second video intros, referral program,
ATS-kanban for employers, CV PDF export, social sign-in (would trigger
Apple's Sign-in-with-Apple requirement — add all providers in one pass).
