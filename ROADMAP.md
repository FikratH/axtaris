# AxtarIS — Product Roadmap (CPO audit)

Generated from a deep product audit of the two‑sided Azerbaijani jobs marketplace.

## 🎯 North star

**Close the hiring loop with in‑app messaging + employer response mechanics.**
Today the flow dead‑ends the moment an employer shortlists or a candidate applies —
there's no channel to talk, schedule, or follow up, so both sides go quiet and churn.
Messaging (gated by application/shortlist, wired to the existing push + deep‑link
infra) is the connective tissue that turns one‑way applications into two‑way
conversations and measurable hires. It's also the substrate the real revenue model
needs — paid direct contact, talent‑search outreach, and boosted visibility all only
pay off once a live conversation channel exists.

## Biggest gaps today

| # | Area | Gap | Severity |
|---|---|---|---|
| 1 | Messaging | No channel after apply/shortlist — the flow dead‑ends at a status change | 🔴 critical |
| 2 | Monetization | Subscription upgrade is a stub (`comingSoon`); no payment gateway (Stripe unavailable in AZ) | 🔴 critical |
| 3 | Analytics | Zero event instrumentation — blind on the view→apply→shortlist→hire funnel | 🔴 critical |
| 4 | Candidate retention | No job alerts / saved searches / "new matches" digest | 🟠 high |
| 5 | Employer liquidity | Inbound‑only; no talent/CV search to invite candidates | 🟠 high |
| 6 | Trust & safety | No reviews, no scam/fake‑job reporting, no candidate verification | 🟠 high |
| 7 | Application quality | One‑tap apply ignores the existing `coverLetter` field; no screening questions | 🟠 high |
| 8 | Matching depth | Keyword overlap only; "Bakı/Baku/Baki" silently breaks scoring | 🟡 medium |
| 9 | Onboarding | CV upload exists but no resume parsing to auto‑fill the profile | 🟡 medium |
| 10 | Status transparency | No interview scheduling / rejection feedback | 🟡 medium |
| 11 | i18n edges | Salary‑currency + number/date formatting per locale; non‑normalized place/skill spellings | 🟢 low |

## Sequenced recommendations

**NOW**
1. **In‑app messaging** (application‑gated, push‑enabled) — L. Highest single lever on liquidity + retention; reuse `send-push` + deep‑links.
2. **Real payments + monetization** (local AZ gateways: Azericard/Kapital, m10/Birbank, ASAN Pay) + featured/boosted vacancies + application boost — XL. Unblocks revenue.
3. **Employer talent search / CV database** (premium employer SKU, invite‑to‑apply) — L. Fixes cold‑start on the paying side.
4. **Job alerts + saved searches + weekly "new matches" digest** — M. Core candidate retention loop on existing match + push infra.
5. **Product analytics + liquidity dashboard** (funnel events, employer response SLA, time‑to‑first‑application) — M. Makes every other bet measurable.

**NEXT**
6. **Structured apply** (optional cover letter + per‑vacancy knockout questions) — M. Raises application signal.
7. **AI employer suite** (JD generation, auto screening questions, applicant summarization/ranking) — L. Extends the gpt‑4o‑mini proxy to the paying side.
8. **Trust layer** (company reviews/ratings, scam reporting, verified badges in feed) — M. Reuses the moderation queue.
9. **Semantic matching + skill/city taxonomy normalization** (pgvector embeddings) — L. Fixes "Baku/Bakı" breakage; upgrades the core value prop.
10. **Resume parsing** to auto‑fill the profile from an uploaded CV — M. Removes the biggest onboarding drop‑off.

**LATER**
11. **Candidate growth loops** (shareable public profile link, "employers viewed you", referral invites) — M.
12. **Interview scheduling + automated status feedback** — M. Completes the post‑shortlist workflow.
