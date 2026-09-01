# AxtarIS Legal Document Set — Operator Checklist

This directory contains the production legal documents for AxtarIS in English (masters), Azerbaijani, and Russian. **Do not publish until every placeholder below is filled and Azerbaijani counsel has reviewed the set.**

## Files

| Document | EN | AZ | RU |
|---|---|---|---|
| Terms of Service | `en/terms-of-service.md` | `az/istifade-sertleri.md` | `ru/usloviya-ispolzovaniya.md` |
| Employer Terms (B2B) | `en/employer-terms.md` | `az/isegoturen-sertleri.md` | — (B2B doc; EN/AZ sufficient) |
| Privacy Policy | `en/privacy-policy.md` | `az/mexfilik-siyaseti.md` | `ru/politika-konfidencialnosti.md` |
| Community Guidelines | `en/community-guidelines.md` | `az/icma-qaydalari.md` | `ru/pravila-soobshchestva.md` |
| Subscription & Refund Terms | `en/subscription-refund-terms.md` | `az/abunelik-ve-geri-odenis.md` | — (link EN/AZ from pricing) |

EN is the drafting master. If you amend a clause, amend it in all languages, and state in the ToS which language controls (recommended: Azerbaijani version controls for AZ-law interpretation; note this decision with counsel).

## 1. Placeholders to fill (all files)

- `[AXTARIS MMC — registration pending; VÖEN: __________]` — the registered legal name + VÖEN, everywhere (also in AZ/RU variants of the bracket).
- `[REGISTERED ADDRESS]` / `[QEYDİYYAT ÜNVANI]` / `[ЮРИДИЧЕСКИЙ АДРЕС]` — registered office.
- `[EFFECTIVE DATE]` / `[QÜVVƏYƏ MİNMƏ TARİXİ]` / `[ДАТА ВСТУПЛЕНИЯ В СИЛУ]` — launch date of the documents.
- Privacy Policy only: `[SUPABASE REGION — confirm in dashboard]` — check the production project's region in the Supabase dashboard; `[WEB DELETION URL]` — the public web account-deletion page (required by Google Play; must exist before store submission).
- Subscription & Refund Terms only: `[PLAN NAMES/PRICES]` note — confirm the live tier names/prices at launch (document intentionally avoids hardcoding prices).

## 2. Where each document must be published

**Landing site (axtaris.app):**
- Footer links to: Terms of Service, Privacy Policy, Community Guidelines, Subscription & Refund Terms (all three locales, matching the page locale).
- Pricing/checkout page must link Subscription & Refund Terms and show renewal/cancellation facts near the buy button (Paddle domain review also checks that the site's ToS carries the seller's legal name).
- A public **account deletion page** (the `[WEB DELETION URL]`) — required by Google Play's Data deletion policy.

**In the app (`app/legal/` screens):**
- Terms of Service, Privacy Policy, Community Guidelines must replace any placeholder text, in az/en/ru, reachable from Settings and from the sign-up screen ("By creating an account you agree to…" links).
- The sign-up consent text should mirror Privacy Policy §13 (AZ Law 998-IIIQ statutory consent elements).

**App Store Connect:**
- Privacy Policy URL (metadata field) → the landing privacy page.
- Privacy nutrition labels must match Privacy Policy §1/§5.
- EULA: leave Apple's standard EULA (do not upload a custom one).

**Google Play Console:**
- Privacy Policy URL; Data safety form must match Privacy Policy §1/§5; Account deletion URL = `[WEB DELETION URL]`.

**Paddle:**
- During domain verification, Paddle checks the site shows: legal name, ToS, Privacy Policy, refund terms. All satisfied by the above once placeholders are filled.

## 3. Regulatory steps (Azerbaijan)

1. **Register the MMC first** (free, ~3 business days, e-gov / ASAN Imza). All documents assume an MMC operator.
2. **State Register of personal-data information systems**: after the MMC exists, register the app's data system via the e-gov portal (Ministry of Digital Development and Transport authority). Processing in such systems is formally allowed *after* registration — schedule it before public launch.
3. **KOBIA startup certificate** — apply immediately after registration (potential 3-year profit-tax exemption on innovation income).

## 4. Counsel review — specific open questions to put to an Azerbaijani lawyer

1. Whether the **2% simplified tax regime** is unavailable because payors are legal entities (Tax Code Art. 218.5 reading) and the correct VAT treatment of exported e-services.
2. **KOBIA certificate scope** — does a job platform's income qualify as "innovation activity income"?
3. **Employment-intermediation licensing** — confirm a pure job board/marketplace needs no private-employment-agency licence under the AZ Law on Employment.
4. **Written-consent formality** under Law 998-IIIQ (checkbox vs enhanced e-signature) — confirm the mitigation (statutory-element consent text at sign-up, mirrored in Privacy Policy §13) is acceptable practice.
5. Whether the **AZ version of the ToS should control** over EN, and review of the Baku forum clause + consumer carve-out.
6. Timing of **GDPR Art. 27 EU representative** and **DSA Art. 13 legal representative** appointments (~€100–300/yr each) relative to EU launch scale.

## 5. Consistency duties after launch

- Keep the **Data safety form / privacy labels** in sync with the Privacy Policy whenever processors or data categories change.
- Version consent texts: the waitlist table and sign-up flow store `consent_text_version` — bump it whenever consent wording changes.
- The moderation commitments (24-hour report review, human appeal) are now **published promises** — staff them.
