# AxtarIS — Product Roadmap (living doc)

Two-sided Azerbaijani jobs marketplace. This file tracks what has shipped and
what's next. Last updated after the messaging / analytics / chat-attachments pass.

## 🎯 North star

**Close the hiring loop with in-app messaging + employer response mechanics.**
Status: **shipped** — realtime candidate↔employer chat + admin support threads.

## ✅ Shipped

| Area | What shipped |
|---|---|
| **Cross-platform dialogs** | `react-native-web`'s `Alert` is a no-op; built `@/utils/dialog` + `<DialogHost>` so all confirmations/deletes/errors work on web |
| **In-app messaging** | `conversations`/`messages` + RLS + **Supabase Realtime**; thread + list UI; image attachments; tappable header; application-gated |
| **Admin support** | `support` conversation kind; premium-gated "Contact support"; admin support inbox |
| **Screening questions** | Optional per-vacancy questions; candidates answer on apply; employers see answers |
| **CV** | Fixed employer 400 (storage RLS); in-app CV preview (web iframe / native viewer) |
| **AI (gpt-4o-mini proxy)** | Vacancy translator; AI bio; AI skill suggestions; experience rewrite; **resume parsing → profile auto-fill** |
| **Input suggestions** | Curated az/ru/en dataset (skills, titles, degrees, cities, benefits…) with highlight-selected chips across profile + vacancy forms |
| **Matching depth** | Skill/city taxonomy normalization (Baku/Bakı/Баку fold to one token) |
| **Admin finance** | MRR / ARR / ARPU + revenue-by-plan |
| **Product analytics** | `analytics_events` + funnel instrumentation (view → apply → message → publish) + admin engagement + view→apply conversion |
| **Guest experience** | Pre-login browsing of chosen role; account-required actions prompt sign-in |
| **Multi-account** | Persisted accounts + switcher + add-account |
| **Tests** | Jest + jest-expo; 97+ tests (utils, data, services, components) |
| **Admin** | Dashboard KPIs, moderation, user & company management, finance, seeded admin account |

## Remaining gaps (prioritized)

| # | Area | Gap | Severity |
|---|---|---|---|
| 1 | Monetization | Subscription upgrade is a stub; no AZ payment gateway (Stripe unavailable) — Azericard/Kapital, m10/Birbank, ASAN Pay | 🔴 critical |
| 2 | Candidate retention | No job alerts / saved searches / "new matches" digest | 🟠 high |
| 3 | Employer liquidity | Inbound-only; no talent/CV search to invite candidates | 🟠 high |
| 4 | Trust & safety | No reviews/ratings, scam reporting, verified badges in feed | 🟠 high |
| 5 | Matching | Keyword + normalization only; no semantic (pgvector) matching | 🟡 medium |
| 6 | Interviews | No scheduling / structured rejection feedback | 🟡 medium |
| 7 | Web push | Realtime chat works; browser push (VAPID) not wired | 🟡 medium |
| 8 | i18n edges | Per-locale salary/number/date formatting | 🟢 low |

## Sequenced recommendations

**NOW**
1. **Real payments + monetization** (local AZ gateways) + boosted/featured vacancies — XL. Unblocks revenue.
2. **Job alerts + saved searches + weekly "new matches" digest** — M. Core retention loop on the existing match + push infra.
3. **Employer talent search / CV database** (premium SKU, invite-to-apply) — L. Fixes cold-start on the paying side.

**NEXT**
4. **Trust layer** (company reviews/ratings, scam reporting, verified badges) — M. Reuses the moderation queue.
5. **Semantic matching** (pgvector embeddings) — L. Upgrades the core value prop beyond keywords.
6. **AI employer suite** (JD generation, auto screening questions, applicant ranking) — L. Extends the AI proxy to the paying side.

**LATER**
7. **Interview scheduling + automated status feedback** — M.
8. **Web push (VAPID)** + candidate growth loops (public profile link, "employers viewed you", referrals) — M.
