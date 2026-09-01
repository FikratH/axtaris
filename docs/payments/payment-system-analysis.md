# AxtarIS Payment System — Architecture Analysis & Decision

**Status:** Recommended architecture, pending founder sign-off
**Date:** 2026-09-01
**Scope:** Candidate subscriptions ($0/5/15), employer subscriptions ($0/19/49), Azerbaijan-first market with global reach
**Companion doc:** `odenis-sistemi-ceo-xulasesi.md` (Azerbaijani, non-technical summary)

---

## 1. Executive summary — the decision

**Employer (B2B) subscriptions are sold on the web via Paddle (merchant of record). Candidate (consumer) subscriptions are sold in-app via Apple/Google In-App Purchase, integrated through RevenueCat. Both channels converge on the existing Supabase entitlements table, which remains the single source of truth the app reads. Phase 2 (2027) adds local AZN checkout via Payriff for the Azerbaijan mass market.**

Why this split is not a preference but a constraint: Apple mandates IAP for consumer digital subscriptions in every storefront relevant to us, while B2B plans sold to companies on the web and merely *used* in the app are an accepted pattern (the Slack/Zoom model). Paddle is the only tier-1 web-checkout provider that accepts Azerbaijan-based sellers — including individuals, before the MMC even exists — and as merchant of record it absorbs global tax, invoicing, and chargeback liability for ~5% + $0.50 per transaction.

No foreign entity is required to start charging. The entity question (see the legal workstream: Azerbaijan MMC recommended) matters for store organization accounts and tax optimization, not payment access.

---

## 2. Decision drivers

1. **Stripe does not serve Azerbaijan.** Its supported-country list (46 countries) excludes AZ. Direct Stripe requires a US LLC or Estonian OÜ first — cost, ops burden, and self-liable global VAT. (https://stripe.com/global)
2. **Paddle accepts Azerbaijani sellers, including sole traders/individuals.** Sellers anywhere except a short sanctions-driven prohibited list; AZ is not on it. Payouts monthly (≥$100) via bank transfer, PayPal, or Payoneer — all reachable from AZ. (https://www.paddle.com/help/start/intro-to-paddle/which-countries-are-supported-by-paddle)
3. **Google Play supports Azerbaijan for both developer and merchant registration** with USD payouts — native Android IAP works with an AZ-only entity. (https://support.google.com/googleplay/android-developer/answer/9306917)
4. **Apple requires IAP for candidate-type subscriptions in all storefronts except the US** (external links allowed there, currently at a temporary 0% Apple fee) and the EU (link-out with a 12–20% fee stack). The Azerbaijan storefront permits **no external purchase links and no steering**. (App Store Review Guidelines 3.1.1, 3.1.1(a), 3.1.3)
5. **Google's anti-steering walls fall on a schedule**: US/EEA/UK opened June 30, 2026 (Billing Choice, ~10% service fee for external subscription link-outs vs 15% Play billing); **rest of world including Azerbaijan opens September 30, 2027** under the court-approved Epic–Google settlement (approved March 4, 2026; runs to June 2032).
6. **Azerbaijan VAT trap (Sept 1, 2026):** non-resident digital providers selling B2C to AZ consumers above a $10k threshold must register for 18% AZ VAT; where the provider is unregistered, **AZ banks withhold 18% at the point of card payment**. Paddle is not AZ-registered, so AZ consumers paying Paddle in USD risk an effective +18%. Consequence: **AZ-resident candidates should pay through IAP** (stores handle tax) and, in phase 2, through local AZN rails. (https://vatcalc.com/azerbaijan/azerbaijan-vat-on-digital-services-update/)

---

## 3. Provider comparison

| | **Paddle** (chosen) | **Polar.sh** (fallback) | Lemon Squeezy | Stripe + foreign entity | **Payriff / epoint** (phase 2) |
|---|---|---|---|---|---|
| Entity required | None — AZ individual OK | None — AZ payouts supported | None, but platform sunsetting | US LLC ($500 Atlas) or EE OÜ (~€700–1,000) | AZ entity or sole entrepreneur (VÖEN) |
| Fees | 5% + $0.50 all-in | 5% + $0.50 + intl/payout extras | 5% + $0.50 + 1.5% intl + 0.5% subs | ~2.9% + 30¢ + 0.7% Billing + 0.5% Tax + entity costs | ~2–3% (negotiable) |
| Payout | AZ bank / PayPal / Payoneer, monthly ≥$100 | Stripe Connect Express → AZ (~170 countries) | PayPal / wire | Mercury / EE bank / Wise | AZ bank, AZN |
| Recurring | Full stack: trials, proration, dunning, Retain | Subscriptions (younger tooling) | Subscriptions | Stripe Billing (best-in-class) | Payriff cardSave/autoPay; epoint stored-card |
| Tax handling | MoR, 70+ jurisdictions (**not** AZ) | MoR | MoR | Self-liable, incl. new AZ non-resident regime | You handle AZ domestically |
| Chargebacks | MoR absorbs | MoR absorbs | MoR absorbs | Yours | Yours |
| AZN checkout | No (AZ buyers pay USD) | No | No | No | **Yes** |
| Time to first charge | Days | Days | Weeks | 4–10 weeks | 1–3 weeks after entity |

**Paddle — chosen for web checkout.** Merchant of record: it is the legal seller, so global VAT/sales tax, invoices, EU 14-day withdrawal handling, dunning/retries, and chargebacks are its problem, not ours. 5% + $0.50 all-in is more than raw card processing, but replaces a tax-compliance function we cannot staff. Paddle.js overlay drops into the Next.js landing site directly. KYC needs: passport, address, and a live site with Terms/Privacy/Refund pages carrying the seller's legal name.

**Polar.sh — pre-vetted fallback** if Paddle's sole-trader verification stalls: also MoR, explicitly lists Azerbaijan for payouts, same headline fee, but younger platform with thinner subscription tooling.

**Lemon Squeezy — rejected.** Acquired by Stripe (July 2024); onboarding delayed while the team builds its successor product (Stripe Managed Payments, preview Feb 2026). Building on a sunsetting platform is unjustifiable risk.

**Stripe via foreign entity — rejected for now.** Requires standing up and maintaining a US LLC (Form 5472 exposure, $25k penalty for a missed filing; Mercury's 2026 rules require genuine US operations) or Estonian OÜ (AZ CFC filings, 6,000 AZN penalties, management-and-control questions). We'd also become self-liable for global VAT including the AZ non-resident regime. Revisit only if enterprise EU customers demand it.

**Payriff / epoint / m10 — phase 2 local rails.** Payriff: AZN/USD/EUR acquiring with documented cardSave + autoPay (true card-on-file recurring), ~2–3% typical local acquiring commission. epoint (Kapital Bank-backed): free API integration, recurring via bank-stored card details, strong local trust. m10 (PashaPay, 5M+ users): excellent as an AZN payment *method* later, but no public recurring API — not a subscription engine. All require AZ merchant onboarding (MMC or VÖEN).

---

## 4. Store-rules compliance architecture

The single most expensive mistake available to us is an App Store rejection or removal over payment steering. The rules, precisely:

**Apple (App Store Review Guidelines, verified against the live text):**
- **3.1.1** — Digital features unlocked in-app (subscriptions named explicitly) must use IAP; own unlock mechanisms are banned.
- **3.1.1(a)** — External purchase links are permitted freely **only on the US storefront** (currently 0% Apple fee — temporary; the Ninth Circuit's Dec 11, 2025 modification lets Apple eventually charge a cost-based commission). Elsewhere, link-out requires the StoreKit External Purchase Link entitlement, granted for **specific storefronts only** (in practice EU at a 12–20% fee stack). **Azerbaijan: no link-out, no steering, full stop.**
- **3.1.3 preamble** — Outside the US storefront, the app cannot even *encourage* users toward non-IAP purchasing.
- **3.1.3(b) Multiplatform Services** — Users may access content/subscriptions **acquired on your website** inside the app, provided equivalent items are also available as IAP. This is the textual home of the Slack/Zoom pattern. Enforcement reality: parity is enforced loosely for B2B SaaS; keeping candidate plans available as IAP satisfies the proviso where it bites.
- **3.1.3(c) Enterprise Services** — Apps sold directly to organizations may use external purchasing; consumer/single-user sales must use IAP. Employer plans are argued under (b)+(c); candidate plans are unambiguously consumer.

**Google (Play Payments policy):**
- **Consumption-only apps are explicitly legal**: if nothing is purchasable in-app, users may log in and use externally-bought plans, and the app **may even say "you can purchase on our website" without a link** — more permissive than Apple.
- **Billing Choice** (US/EEA/UK since June 30, 2026): external subscription link-outs at ~10% service fee vs 15% via Play billing. **Azerbaijan and rest-of-world: September 30, 2027.**

**Resulting app-behavior matrix:**

| In the app | Allowed? |
|---|---|
| Read entitlements from Supabase and unlock features bought anywhere | ✅ Always, everywhere |
| Candidate subscription purchase via IAP (StoreKit / Play Billing through RevenueCat) | ✅ The only in-app purchase UI |
| Employer plan *status* display ("Plan managed on the web") without URL or price | ✅ |
| "Plans available on our website" text, no link | ✅ Android only |
| Links/buttons to web checkout, web prices, "cheaper on the site" copy | ❌ Everywhere except US storefront (region-gated builds only) |
| Employer purchase UI of any kind | ❌ (until/unless Apple forces employer IAP — see risks) |
| Steering in screenshots or store metadata | ❌ |

---

## 5. Recommended end-state architecture

```
 EMPLOYERS (B2B)                          CANDIDATES (consumer)
      │                                        │
      ▼                                        ▼
 Paddle checkout                        RevenueCat SDK in app
 (landing site, Paddle.js               (react-native-purchases,
  overlay, $19/$49, VAT-ID              StoreKit + Play Billing,
  field for reverse charge)              $5/$15, Apple SBP 15%)
      │                                        │
      │ webhooks (signed)                      │ webhooks (auth header)
      ▼                                        ▼
 supabase/functions/paddle-webhook      supabase/functions/revenuecat-webhook
      │                                        │
      └────────────────┬───────────────────────┘
                       ▼
        subscriptions table (Supabase Postgres)
        {user_id, audience, plan_code, status,
         provider, provider_ref, renews_at}
                       │
                       ▼
        src/utils/entitlements.ts  ← unchanged single source of truth
                       │
                       ▼
        App UI (React Query reads plan_code → feature gates)
```

**Entitlement-sync design rules:**
- **Idempotency** on the provider event id — replayed webhooks must be no-ops (store processed event ids or upsert deterministically).
- **One active subscription per (user_id, audience)**, higher plan wins on conflict.
- **Status machine**: `active` / `trialing` / `grace` gate entitlements ON; `past_due` maps to `grace` for the store/Paddle grace window (enable Play's 16-day grace and App Store Billing Grace Period; map RevenueCat `BILLING_ISSUE` and Paddle `past_due` accordingly); `canceled`/`expired` gate OFF at period end.
- **RevenueCat `app_user_id` = Supabase user id**, set at login, so events join without heuristics.
- **The DB-enforced applications-per-day constraint (3/10/∞) must move in lockstep** with any plan-code change — it is a check constraint in a migration, not app code (per the monetization-enforcement history). Any pricing/tier change is a coordinated migration + entitlements.ts change.
- Existing `app/checkout.tsx` (currently a free-during-beta simulation) becomes the native RevenueCat paywall (`purchasePackage()`); `app/subscription.tsx` continues rendering from Supabase entitlements untouched.

**Event mapping (both webhooks):** `INITIAL_PURCHASE`/`subscription.activated` → upsert active; `RENEWAL` → extend `renews_at`; `CANCELLATION` → mark cancel-at-period-end; `EXPIRATION` → status expired; `BILLING_ISSUE`/`past_due` → grace; `REFUND` → immediate downgrade.

---

## 6. Pricing & currency strategy

- **Web (Paddle): USD.** AZ buyers see USD at Paddle checkout anyway (Paddle's own currency table: Azerbaijan → USD); the AZ Apple storefront is also USD-denominated, so users are habituated.
- **IAP tiers:** candidate $4.99/$14.99, employer-equivalent none (no employer IAP). Use one subscription group on iOS with two auto-renewables.
- **Phase 2 (Payriff): whole-manat psychological pricing, not FX conversion** — candidate 9/25 AZN, employer 35/89 AZN (indicative; revalidate against willingness-to-pay before launch).
- Marketing copy may show approximate AZN equivalents; checkout stays in the channel's currency.

## 7. Dunning, refunds, chargebacks — per channel

| | Paddle (web) | IAP via RevenueCat |
|---|---|---|
| Failed renewals | Paddle auto-retry + dunning emails (Retain) | Store grace periods (Play 16-day, ASC Billing Grace) → `grace` status |
| Refunds | Paddle executes per our published refund policy; EU 14-day withdrawal handled by Paddle with the digital-content early-performance exception | Apple/Google decide; arrive as `REFUND` webhook → downgrade |
| Chargebacks | Paddle's liability (MoR) | N/A (store handles) |
| Invoices / B2B VAT | Paddle invoices; valid VAT ID → reverse charge; AZ corporate buyers self-account per their local rules | N/A |

Our ToS must identify Paddle as merchant of record for web purchases and defer billing mechanics to Paddle's Checkout Buyer Terms (legal workstream owns the wording).

## 8. Phased rollout

**Phase 1 — launch (4–6 weeks of focused work):**
1. Paddle seller onboarding + domain review (needs live legal pages) — days, parallel.
2. Landing checkout page with Paddle.js overlay + `paddle-webhook` Edge Function + `subscriptions` migration — ~1 week.
3. RevenueCat setup (both stores' products, App Store Server Notifications v2, Play RTDN via Pub/Sub) + `revenuecat-webhook` — ~1 week.
4. `app/checkout.tsx` → RevenueCat paywall; entitlement wiring + grace handling — ~1 week.
5. E2E across all six paths (2 audiences × {Paddle, RC-iOS, RC-Android}) in sandbox — ~1 week. Paddle Sandbox → staging Supabase; iOS sandbox Apple ID + StoreKit config + TestFlight; Play internal testing + license testers; RevenueCat sandbox events carry `environment: SANDBOX` — branch on it.

**Phase 2 (~Q1 2027):** Payriff (or epoint) AZN checkout on the web for both audiences (the app never steers to it); optional US-storefront link-out for candidates (0% Apple fee while it lasts, region-gated build); evaluate diaspora volume first.

**Phase 3 (Sept 30, 2027):** "Buy on web" buttons become legal in the Android app for AZ — weigh Google's ~10% link-attributed fee + Paddle 5% against 15% Play billing at then-current volumes.

## 9. Requirements checklist before the first real charge

**Accounts & agreements**
- [ ] Paddle seller account — KYC: passport, address proof, live site with Terms/Privacy/Refund pages carrying the legal seller name, product description
- [ ] Payout rail: AZ bank USD account and/or Payoneer (AZ-supported)
- [ ] Apple Developer Program ($99/yr) → Paid Apps Agreement + banking + tax forms (W-8BEN) → **Small Business Program enrollment** (~15 days, 15% from day one) → 2 auto-renewable subscriptions in one group
- [ ] **Open verification: Apple payout to an AZ bank** — confirm inside App Store Connect when signing the Paid Apps Agreement; if blocked, the MMC's bank or the runner-up entity solves it
- [ ] Google Play Console ($25 one-time) → payments/merchant profile (AZ supported, USD payouts) → 2 subscription products
- [ ] RevenueCat account (free tier) → app configs, ASSN v2 + RTDN wiring, webhook → Supabase

**Engineering**
- [ ] `subscriptions` table migration with provider columns + idempotency ledger
- [ ] `paddle-webhook` + `revenuecat-webhook` Edge Functions + secrets
- [ ] RevenueCat paywall in `app/checkout.tsx`; `app_user_id` = Supabase uid at login
- [ ] Landing checkout page + pricing page with conspicuous price/term/renewal/cancellation disclosure

**Legal/tax**
- [ ] Founder VÖEN (or MMC) for declaring Paddle/Payoneer income
- [ ] ToS/Privacy/Refund pages published (Paddle blocks approval without them)
- [ ] MMC + AZ merchant onboarding before Phase 2 (Payriff/epoint)

## 10. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Apple review challenges employer web-unlock (3.1.3(b) parity proviso) | Medium | Medium | Review notes framing B2B org sales; demo account; zero purchase UI for employer plans; worst case: add employer IAP at 15% |
| AZ 18% VAT withholding hits AZ consumers paying Paddle (from Sept 2026) | High for AZ B2C via web | Medium | Route AZ candidates to IAP; Phase-2 Payriff AZN checkout; monitor Paddle AZ registration |
| Paddle sole-trader onboarding friction | Low–Medium | Medium (delay) | Polar.sh pre-vetted as drop-in MoR fallback; MMC registration strengthens KYB |
| Apple US 0% external fee ends (cost-based fee coming) | Certain, timing unknown | Low for us | Don't build the business case on US link-out |
| Apple payouts to AZ banking unverified | Low | Medium | Verify early in ASC; entity bank as fallback |
| Payriff/epoint autoPay reliability on local cards | Unknown | Medium (phase 2) | Pilot with real cards before betting renewals on it |
| Fee/policy drift (Epic remedies evolving through 2027) | Medium | Low–Medium | Re-verify storefront rules each release cycle; keep the compliance matrix in §4 current |

## 11. Costs model — effective take-rates

Assume $100 gross on each channel:

| Channel | Fees | Net to AxtarIS |
|---|---|---|
| Employer via Paddle | 5% + $0.50 = $5.50 | **$94.50** |
| Candidate via Apple IAP (SBP) | 15% = $15; + RevenueCat 1% of tracked revenue above $2.5k MTR ≈ $1 | **$84–85** |
| Candidate via Play Billing (subs) | 15% + RC as above | **$84–85** |
| Phase-2 Payriff (AZN) | ~2–3% | **~$97–98** |
| (2027) Android link-out AZ | Google ~10% link fee + Paddle 5.5% | ~$84.50 — only wins vs Play billing with volume-negotiated Paddle rates |

RevenueCat: free below $2.5k monthly tracked revenue, then 1% of MTR — at early volumes this is $0.

## 12. Sources (load-bearing claims)

- Stripe country list: https://stripe.com/global
- Paddle supported sellers: https://www.paddle.com/help/start/intro-to-paddle/which-countries-are-supported-by-paddle · verification: https://www.paddle.com/help/start/account-verification/what-is-account-verification · payouts: https://www.paddle.com/help/manage/get-paid/when-and-how-do-i-get-paid · tax jurisdictions: https://www.paddle.com/help/sell/tax/which-countries-does-paddle-charge-sales-tax-or-vat-for · buyer currencies: https://developer.paddle.com/concepts/sell/supported-countries-locales/
- Polar payouts/countries: https://polar.sh/docs/merchant-of-record/supported-countries · pricing: https://polar.sh/resources/pricing
- Lemon Squeezy → Stripe: https://www.lemonsqueezy.com/blog/stripe-acquires-lemon-squeezy
- Google Play developer/merchant countries (AZ ✔/✔, USD): https://support.google.com/googleplay/android-developer/answer/9306917
- Apple guidelines (3.1.1, 3.1.1(a), 3.1.3(b)/(c)): https://developer.apple.com/app-store/review/guidelines/
- US external-fee status 2026: https://neonpay.com/blog/apple-app-store-alternative-payment-fees-what-developers-pay-in-2026 · https://techcrunch.com/2025/05/02/apple-changes-us-app-store-rules-to-let-apps-redirect-users-to-their-own-websites-for-payments
- EU link-out fee stack: https://ecorpit.com/ios-eu-external-purchase-links-storekit-guide-2026/
- Google consumption-only rule: https://support.google.com/googleplay/android-developer/answer/10281818
- Billing Choice (June 30, 2026): https://android-developers.googleblog.com/2026/06/play-expanded-billing.html · https://support.google.com/googleplay/android-developer/answer/17161464
- Epic–Google settlement approval (March 4, 2026): https://techcrunch.com/2026/03/04/google-settles-with-epic-games-drops-its-play-store-commissions-to-20
- Rest-of-world link-out timeline: https://stash.gg/blog/google-android-policy-update-what-it-means-for-your-dtc-strategy
- Apple Small Business Program: https://developer.apple.com/app-store/small-business-program/
- RevenueCat + Expo: https://www.revenuecat.com/docs/getting-started/installation/expo · https://docs.expo.dev/guides/in-app-purchases/
- AZ non-resident digital VAT 2026: https://vatcalc.com/azerbaijan/azerbaijan-vat-on-digital-services-update/ · https://bdo.az/en-gb/insights/new-vat-rules-for-digital-services-in-2026 · https://1stopvat.com/azerbaijan-vat-compliance-non-resident-digital-service-providers-2026/
- Payriff: https://payriff.com · https://docs.payriff.com · epoint: https://epoint.az/en · m10: https://m10.az/en/business
