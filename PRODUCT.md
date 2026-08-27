# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

(The shipped product is a native iOS + Android app from one Expo codebase, with an Expo web export used for testing. The design language is a single unified AxtarIS system across platforms — native guidance applies to ergonomics and affordances, not per-OS visual forking. The marketing/landing surface is `web`.)

## Stack

- App (existing): React Native + Expo SDK 55, Expo Router, TypeScript strict, Zustand + TanStack Query, React Hook Form + Zod, i18next, Supabase (PostgreSQL + Auth + Storage + RLS).
- Landing site (greenfield, user-pinned in `CLAUDE_FABLE_5_LANDING_PAGE_PROMPT.md`): self-contained Next.js App Router + TypeScript + Tailwind CSS + shadcn/ui app under `landing/`, plus GSAP (`@gsap/react`) and Lenis. The Expo app must remain untouched by landing work.

## Users

- **Candidates (primary):** job seekers in Azerbaijan who want relevant vacancies, transparent match signals, profile/CV help, saved jobs/searches, application tracking, and direct chat with employers. Mobile-first usage.
- **Employers (secondary):** companies in Azerbaijan who publish and manage vacancies, discover talent, review applicant pipelines, message candidates, and read hiring activity analytics.
- Languages: Azerbaijani (default), Russian, English — full parity enforced by a locale parity test.

## Product Purpose

AxtarIS is a premium two-sided employment marketplace for Azerbaijan. It exists to move both sides from discovery to conversation: candidates from relevant vacancy to application to chat, employers from vacancy to qualified applicant to hire. Success is real matches — applications that turn into conversations and hires — not raw listing volume.

## Positioning

Combines the trusted clarity of traditional job platforms with the speed and elegance of premium consumer apps, built Azerbaijan-first (language, vocabulary, AZN, local market) rather than localized as an afterthought. The matching mechanism — profile/skills ↔ vacancy criteria ↔ match explanation ↔ conversation — is the substance a generic job board could not truthfully copy.

## Operating Context

- Azerbaijan market; currency AZN; trilingual az/ru/en with Azerbaijani leading.
- Distribution today: **not publicly available anywhere** — no App Store or Google Play listing, no public web URL (confirmed 2026-08-27). Marketing surfaces must use honest coming-soon states ("Tezliklə") and centralize future links in typed TODO config; never invent store availability, ratings, or URLs.
- Monetization: subscription plans exist in-app (candidate Free / 5 / 15 AZN per 30 days; employer Free / 19 / 49 AZN per 30 days) with an entitlements module and checkout. **Decision (2026-08-27): exact prices stay off marketing surfaces** — marketing may describe plans qualitatively only.
- Backend: live Supabase project (`cwmjyonylopsqrtujuvo`) with hardened RLS; admin/moderation dashboard; report/block compliance flows.

## Capabilities and Constraints

Confirmed, code-backed capabilities (safe to show/claim):
- Candidate: smart recommendations, advanced search + filters, saved jobs and saved searches, application tracking pipeline, profile builder (skills, experience, education, languages, certifications), CV upload/management and CV preview, chat with employers, notifications, invites from employers.
- Employer: company profile with verification workflow, vacancy lifecycle (draft → active → closed), applicant pipeline (review → shortlist → reject → accept), talent search and candidate invites, messaging, analytics dashboard (views, applicants, response rates).
- Platform: dark/light themes with semantic tokens, role-based navigation, email+password auth with OTP verification, in-app legal pages (terms, privacy).

Constraints and honesty limits:
- **AI assistance is a modular service layer currently mocked** (ready for LLM integration). Marketing may present AI-assisted CV/profile/writing help only as far as shipped UI supports it — no "AI-powered platform" claims, no magical framing.
- Push notifications are implemented end-to-end but delivery is blocked on FCM/APNs credentials — not a user-facing claim to make.
- No invented proof of any kind: no testimonials, employer logos, download counts, "trusted by thousands", ratings, awards, case studies, benchmarks, partnerships, or security certifications.

## Brand Commitments

- Name **AxtarIS** and the existing logo/wordmark are binding (`assets/axtaris_text_logo_png.png`, `assets/axtaris_logo_icon_png.png`, icon, splash). The name reads as Azerbaijani "axtarış" (search) with "İŞ" (job/work) embedded — observed wordplay, useful design material. The logo carries an arrow motif; it may inform movement and directional rhythm but must not be repeated as superficial decoration.
- Palette anchored in deep navy `#2D4797` and teal `#0097A7` (full ramps in `src/theme/colors.ts`); web surfaces may expand this into a sophisticated system but must not drift into a generic blue-SaaS look (binding per the user's landing brief).
- Voice: premium, optimistic, assured, human. Azerbaijani copy is written natively from the app's own locale vocabulary, never translated English marketing clichés.

## Evidence on Hand

- Real product UI: the running Expo app (`npx expo start --web`; exported web build in `dist/`) — the only legitimate product imagery. No unrelated mockups or stock photography.
- Real product vocabulary: `src/i18n/locales/{az,en,ru}.ts`.
- Brand assets: `assets/`. Design tokens: `src/theme/`.
- Real support email: **info@axtaris.app** (the only public contact; no social accounts, no company registration details to show — confirmed 2026-08-27).
- Landing brief: `CLAUDE_FABLE_5_LANDING_PAGE_PROMPT.md` (user-authored, binding for the landing surface).

## Product Principles

1. **Honesty before persuasion** — never claim distribution, proof, metrics, or capabilities the product does not have today; render honest coming-soon states instead.
2. **Azerbaijan-first** — Azerbaijani leads, Russian and English keep full parity; local vocabulary comes from the product's own locales.
3. **Two-sided, one product** — candidates are the primary conversion, employers the secondary; both are served without splitting the brand.
4. **The mechanism is the story** — matching (profile ↔ vacancy ↔ match signal ↔ conversation) is what gets shown, with real product detail.
5. **Premium restraint** — bold and colorful is welcome, but clarity and trust survive every move.

## Accessibility & Inclusion

- Web surfaces target WCAG 2.2 AA (contrast and interaction behavior), per the user's landing brief.
- All typography must fully cover Azerbaijani glyphs (Ə ə Ğ ğ İ ı Ö ö Ş ş Ü ü Ç ç) and Cyrillic for Russian; verify actual font files, not foundry claims.
- `prefers-reduced-motion` respected; essential content never gated behind animation.
