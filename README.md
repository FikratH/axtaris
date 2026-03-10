# AxtarIS — Premium Employment Platform for Azerbaijan

A near-production MVP mobile application built with React Native (Expo), designed as a modern, premium, two-sided employment platform for the Azerbaijan market.

## Overview

AxtarIS combines the trusted clarity of traditional job platforms with the speed and elegance of premium consumer apps. It features AI-assisted productivity for candidates, refined employer workflows, and a strong visual identity.

### Key Features

**Job Seekers:**
- Smart job recommendations & advanced search with filters
- AI-assisted resume building & profile improvement suggestions
- CV upload & management
- Application tracking with status pipeline
- Save/bookmark jobs
- Profile builder with skills, experience, education, languages, certifications

**Employers:**
- Company profile management with verification workflow
- Vacancy creation & management (draft → active → closed)
- Applicant pipeline (review → shortlist → reject → accept)
- Analytics dashboard (views, applicants, response rates)
- Notification center

**Platform:**
- Full i18n: Azerbaijani (default), Russian, English
- Dark & Light theme with semantic design tokens
- Email + password auth with OTP email verification
- Role-based navigation (candidate vs employer)
- Admin/moderation backend architecture
- Supabase backend with RLS policies

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo SDK 55 |
| Routing | Expo Router (file-based) |
| Language | TypeScript (strict) |
| State | Zustand (app state), TanStack Query (server state) |
| Forms | React Hook Form + Zod |
| Auth | Supabase Auth + SecureStore |
| i18n | i18next + react-i18next |
| Backend | Supabase (PostgreSQL + Auth + Storage + RLS) |
| AI | Modular AI service layer (mock, ready for LLM integration) |

---

## Project Structure

```
axtaris/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout (providers)
│   ├── index.tsx                 # Splash screen
│   ├── onboarding.tsx            # Onboarding flow
│   ├── notifications.tsx         # Notification center
│   ├── settings.tsx              # Language & theme settings
│   ├── auth/                     # Auth flow
│   │   ├── _layout.tsx
│   │   ├── role-select.tsx       # Role selection
│   │   ├── sign-in.tsx           # Sign in
│   │   ├── sign-up.tsx           # Sign up (candidate/employer)
│   │   ├── verify-otp.tsx        # Email OTP verification
│   │   └── forgot-password.tsx   # Password reset
│   ├── (candidate)/              # Candidate tab navigation
│   │   ├── _layout.tsx           # Tab bar layout
│   │   ├── home.tsx              # Home with recommendations
│   │   ├── search.tsx            # Job search + filters
│   │   ├── saved.tsx             # Saved/bookmarked jobs
│   │   ├── applications.tsx      # Application tracking
│   │   └── profile.tsx           # Profile view + edit
│   ├── (employer)/               # Employer tab navigation
│   │   ├── _layout.tsx           # Tab bar layout
│   │   ├── dashboard.tsx         # Analytics dashboard
│   │   ├── vacancies.tsx         # Vacancy management
│   │   ├── applicants.tsx        # Applicant pipeline
│   │   ├── company.tsx           # Company profile
│   │   └── settings.tsx          # Employer settings
│   └── vacancy/
│       └── [id].tsx              # Vacancy detail + apply
├── src/
│   ├── components/ui/            # Reusable design system
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Chip.tsx
│   │   ├── EmptyState.tsx
│   │   ├── Input.tsx
│   │   ├── OTPInput.tsx
│   │   ├── ProfileCompletionCard.tsx
│   │   ├── SearchBar.tsx
│   │   ├── SectionHeader.tsx
│   │   ├── SkeletonLoader.tsx
│   │   ├── StatCard.tsx
│   │   ├── VacancyCard.tsx
│   │   └── index.ts
│   ├── hooks/
│   │   └── useThemeStyles.ts     # Theme-aware StyleSheet factory
│   ├── i18n/
│   │   ├── index.ts              # i18n configuration
│   │   └── locales/
│   │       ├── az.ts             # Azerbaijani (default)
│   │       ├── ru.ts             # Russian
│   │       └── en.ts             # English
│   ├── services/
│   │   ├── api.ts                # API client
│   │   ├── aiService.ts          # AI assistant service layer
│   │   ├── authService.ts        # Auth service (mock + Supabase)
│   │   ├── mockData.ts           # Seed/mock data
│   │   └── supabase.ts           # Supabase client
│   ├── store/
│   │   ├── authStore.ts          # Auth state (Zustand)
│   │   └── appStore.ts           # App state (Zustand)
│   ├── theme/
│   │   ├── colors.ts             # Color palette + semantic tokens
│   │   ├── typography.ts         # Typography scale
│   │   ├── spacing.ts            # Spacing, radius, elevation, etc.
│   │   ├── ThemeContext.tsx       # Theme provider + hook
│   │   └── index.ts
│   └── types/
│       └── models.ts             # Domain models & types
├── backend/
│   └── supabase/
│       └── schema.sql            # Full PostgreSQL schema
├── assets/                       # App icons, splash
├── app.json                      # Expo config
├── tsconfig.json                 # TypeScript config
├── package.json
├── .env.example
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npx expo`)
- iOS Simulator or Android Emulator (or Expo Go)

### Installation

```bash
cd axtaris
npm install --legacy-peer-deps
```

### Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Set your Supabase project URL and anon key in `.env`

3. Run the SQL schema in your Supabase project:
   - Go to Supabase Dashboard → SQL Editor
   - Paste contents of `backend/supabase/schema.sql`
   - Execute

### Running

```bash
# Start development server
npx expo start

# iOS
npx expo start --ios

# Android
npx expo start --android
```

### Mock Mode

The app runs in **mock mode** by default (`USE_MOCK = true` in `authService.ts`). This allows full UI testing without a Supabase backend. To connect to a real backend, set `USE_MOCK = false` and configure your `.env`.

**Test credentials (mock mode):**
- Any email/password works for candidate login
- Email containing "employer" or "hr" logs in as employer
- OTP code: `123456`

---

## Design System

### Color Palette

- **Primary:** Deep Navy (#2D4797) — trust, authority
- **Accent:** Elegant Teal (#0097A7) — modern highlight
- **Neutrals:** Cool grays from #FFFFFF to #111827
- **Semantic:** Success (green), Warning (amber), Error (red), Info (blue)

### Typography Scale

| Token | Size | Weight | Usage |
|---|---|---|---|
| displayLarge | 34 | Bold | Hero headings |
| displayMedium | 28 | Bold | Section headings |
| headingMedium | 20 | Semibold | Card titles |
| bodyMedium | 15 | Regular | Body text |
| labelMedium | 15 | Medium | Buttons, labels |
| caption | 12 | Regular | Metadata |

### Components

All components support: variants, dark/light themes, disabled/loading states, consistent spacing.

- `Button` — primary, secondary, outline, ghost, destructive
- `Input` — with label, error, hints, icons
- `OTPInput` — 6-digit code input
- `Card` — default, elevated, outlined
- `Badge` — status indicators
- `Chip` — filter pills
- `VacancyCard` — job listing card
- `StatCard` — analytics metric
- `Avatar` — image or initials
- `SearchBar` — with filter button
- `EmptyState` — illustrated empty views
- `SkeletonLoader` — content loading

---

## Data Models

See `src/types/models.ts` for full TypeScript types and `backend/supabase/schema.sql` for the database schema.

**Core entities:** User, CandidateProfile, Company, EmployerProfile, Vacancy, Application, SavedJob, Notification, AIResumeSession, ModerationFlag

---

## AI Features

The AI service layer (`src/services/aiService.ts`) provides:

- **Profile analysis** — suggestions to improve completeness
- **Skill suggestions** — role-based skill recommendations
- **Experience rewriting** — bullet point enhancement
- **Resume summary builder** — generate professional summaries

Currently uses mock/simulated responses. Ready for integration with OpenAI, Anthropic, or other LLM providers.

---

## Backend Architecture

### Supabase Setup

The schema includes:
- 15+ tables with proper foreign keys and constraints
- Custom PostgreSQL enums for type safety
- Row Level Security (RLS) policies for all tables
- Auto-triggers for timestamps and applicant counting
- Auth hook for automatic profile creation on signup
- Proper indexes for query performance

### Admin/Moderation

Backend supports (schema-level):
- Vacancy moderation workflow (pending → approved/rejected)
- Company verification status tracking
- Content flagging/reporting system
- Moderation queue via `moderation_flags` table

---

## Future Roadmap

- [ ] In-app chat/messaging between candidates and employers
- [ ] Push notifications (Expo Notifications)
- [ ] AI candidate-job matching algorithm
- [ ] Advanced analytics with charts
- [ ] Recruiter messaging system
- [ ] Full admin dashboard (web)
- [ ] Payment integration for premium features
- [ ] Social login (Google, Apple)
- [ ] Resume PDF generation
- [ ] Real LLM integration for AI features

---

## License

Private — All rights reserved.
