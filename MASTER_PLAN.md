# PROJECT COMPLETION & PRODUCTION READINESS MASTER PLAN

## AxtarIS — Premium Employment Platform for Azerbaijan

**Document Version:** 1.0  
**Date:** 2026-03-11  
**Classification:** Internal Engineering — Confidential  

---

# 1. Reconstructed System Overview

## 1.1 Product Identity

AxtarIS is a two-sided employment marketplace mobile application targeting the Azerbaijan market. It connects **job seekers (candidates)** with **employers**, augmented by AI-assisted profile/resume features. The application supports three languages (Azerbaijani, Russian, English) and light/dark themes.

## 1.2 Technology Stack

| Layer | Technology | Status |
|---|---|---|
| Framework | React Native + Expo SDK 55 | ✅ Configured |
| Routing | Expo Router (file-based, typed routes) | ✅ Working |
| Language | TypeScript (strict mode) | ✅ Configured |
| Client State | Zustand (authStore, appStore, dataStore) | ⚠️ Mock-only |
| Server State | TanStack React Query | ❌ Installed but **never used** |
| Forms | React Hook Form + Zod | ❌ Installed but **never used** |
| Auth | Supabase Auth + SecureStore | ⚠️ Stubbed, not integrated |
| i18n | i18next + react-i18next (az/ru/en) | ✅ Working |
| Backend | Supabase (PostgreSQL + Auth + Storage + RLS) | ⚠️ Schema exists, no integration |
| AI | Mock service layer | ⚠️ Simulated only |
| Styling | Manual StyleSheet + Theme system | ✅ Working (NativeWind installed but unused) |
| Animations | React Native Reanimated | ⚠️ Plugin loaded but barely used |

## 1.3 Architecture Summary

```
┌─────────────────────────────────────────────────┐
│                  Expo Router                     │
│  ┌──────────┐ ┌──────────┐ ┌─────────────────┐  │
│  │  Auth     │ │Candidate │ │   Employer       │  │
│  │  Stack    │ │  Tabs    │ │   Tabs           │  │
│  └──────────┘ └──────────┘ └─────────────────┘  │
│        │             │              │            │
│  ┌─────┴─────────────┴──────────────┴──────┐    │
│  │           Zustand Stores                │    │
│  │   authStore / appStore / dataStore      │    │
│  └─────────────────────────────────────────┘    │
│        │                                        │
│  ┌─────┴─────────────────────────────────────┐  │
│  │  Services (authService / aiService / api) │  │
│  │  ALL MOCK — No real backend integration   │  │
│  └───────────────────────────────────────────┘  │
│        │                                        │
│  ┌─────┴──────────────────────────┐             │
│  │  Supabase Client (configured)  │             │
│  │  NEVER CALLED in production    │             │
│  └────────────────────────────────┘             │
└─────────────────────────────────────────────────┘
```

## 1.4 Current State Assessment

The application is an **advanced UI prototype / high-fidelity mockup**. Every screen is built with polished UI, theming, and i18n, but **no real data flows through the system**. All data is hardcoded mock data initialized in Zustand. The Supabase client is configured but guarded behind `USE_MOCK = true`. TanStack Query and React Hook Form + Zod are dependencies that are never imported or used in any screen.

**Estimated completion: ~30% of production-ready product.**

---

# 2. Intended Product Capabilities

Based on README, schema, types, screen structure, and naming conventions, the intended product includes:

### Candidate Features
1. Onboarding flow with 3-slide intro
2. Role selection (candidate/employer)
3. Email + password sign-up with OTP email verification
4. Sign-in with forgot-password / reset flow
5. Home screen with personalized job recommendations
6. Advanced job search with filters (work type, city, salary, experience)
7. Job detail view with full vacancy info + apply action
8. Application tracking with status pipeline (pending → reviewed → shortlisted → accepted/rejected)
9. Save/bookmark jobs
10. Profile builder (title, bio, skills, work experience, education, languages, certifications, portfolio URL)
11. CV upload (PDF/DOC/DOCX) to Supabase Storage
12. AI-assisted profile improvement (bio suggestions, skill suggestions, experience rewriting)
13. AI resume summary builder
14. Notification center
15. Settings (language, theme)

### Employer Features
1. Analytics dashboard (active vacancies, applicants, views, hired count)
2. Vacancy creation (title, description, requirements, responsibilities, benefits, salary, work type, experience level, skills)
3. Vacancy management (active/paused/closed, edit, delete)
4. Applicant pipeline (review, shortlist, reject, accept)
5. Company profile management (name, industry, description, website, location, employee count)
6. Company verification workflow
7. Employer settings + sign out

### Platform Features
1. Full i18n (az/ru/en)
2. Dark/light/system theme
3. Supabase backend with RLS policies
4. Admin/moderation system (schema-level only)
5. Content flagging/reporting

---

# 3. Incomplete & Missing Features Catalog

## 3.1 CRITICAL: Backend Integration (Everything is Mock)

| Item | Current State | What's Missing |
|---|---|---|
| `USE_MOCK = true` in authService.ts | All auth calls return fake data | Toggle to real Supabase auth |
| dataStore.ts | All data from mockData.ts, in-memory only | Replace with Supabase queries via TanStack Query |
| TanStack React Query | Installed, QueryClient configured in _layout.tsx | Zero `useQuery`/`useMutation` hooks anywhere |
| React Hook Form + Zod | Installed as dependencies | Zero usage — all forms use raw useState |
| apiClient (api.ts) | Generic fetch wrapper built | Never imported or called by any screen |
| Supabase client (supabase.ts) | Created with lazy initialization | Only called via authService when USE_MOCK=false |
| CV upload | DocumentPicker works, file saved to local state | No Supabase Storage upload |
| Saved jobs | In-memory array in Zustand | No persistence to Supabase saved_jobs table |
| Applications | In-memory in Zustand | No persistence to Supabase applications table |
| Notifications | Hardcoded mock arrays | No real-time subscription or server fetch |
| Analytics | Static mock object | No computed analytics from real data |
| Company data | Hardcoded 5 mock companies | No CRUD against Supabase companies table |
| Vacancy data | Hardcoded 6 mock vacancies | No CRUD against Supabase vacancies table |

## 3.2 Missing Screens & Flows

| Missing Feature | Evidence | Impact |
|---|---|---|
| Vacancy edit screen | "Edit" button on vacancies.tsx routes to vacancy detail, not an edit form | Employers cannot edit vacancies |
| Add/edit work experience | Profile shows experience but no add/edit UI | Candidates stuck with mock data |
| Add/edit education | Same as above | Candidates stuck with mock data |
| Add/edit languages | Same | No CRUD |
| Add/edit certifications | Same | No CRUD |
| Password change screen | settings.tsx shows "Privacy" as "Coming Soon" | Users cannot change password |
| Account deletion flow | settings.tsx has `deleteAccount` i18n key but no implementation | GDPR/compliance gap |
| Company detail screen for candidates | "Top Companies" section links to search, not company profile | Dead-end UX |
| Candidate detail screen for employers | Applicant cards show skills but no tap-through to full profile | Employers can't review candidates |
| Admin/moderation dashboard | Schema has moderation_flags table | No admin screens at all |
| Terms of Service page | Sign-up references terms link, just styled text | No actual ToS/Privacy content |
| Privacy Policy page | Same as above | Legal compliance gap |
| Deep link handling | `scheme: "axtaris"` configured but no link handlers | Password reset links won't work |
| Social login (Google/Apple) | Listed in README roadmap | Not started |
| In-app messaging/chat | Listed in README roadmap | Not started |
| Push notifications | Listed in README roadmap | Not started |
| Resume PDF generation | Listed in README roadmap | Not started |
| Payment integration | Listed in README roadmap | Not started |

## 3.3 Incomplete Implementations

| Area | Problem |
|---|---|
| **Profile edit screen** | Only edits title, bio, location, salary, skills, portfolio. Missing: work experience CRUD, education CRUD, languages CRUD, certifications CRUD, availability, work preference |
| **Profile completeness calculation** | Hardcoded at 85% in mock data; edit screen just adds +5 arbitrarily. No real calculation algorithm |
| **Vacancy create screen** | "Save as Draft" button just calls `router.back()` — does not actually save a draft |
| **OTP verification** | On sign-up, user/token are set BEFORE OTP verification, meaning unverified users can access the app |
| **Forgot password** | Sends reset email but no "set new password" screen exists for handling the deep link callback |
| **Sign-in validation** | Password min length is 6 in sign-in but 8 in sign-up — inconsistency |
| **Splash/loading bar** | Loading bar is static (always 60% width), not animated to completion |
| **Employer analytics** | All numbers are static mock. No time-range filtering. No charts |
| **Employer company screen** | Always reads `companies[0]` — doesn't associate company with logged-in employer |
| **Applicant screen** | All applicants enriched with same `mockCandidateProfile` — every applicant appears identical |
| **Notification deep links** | Notifications have `data` field with IDs but tapping only marks as read, doesn't navigate |
| **Search pagination** | All vacancies loaded at once from mock array. No infinite scroll / pagination |
| **Image/logo handling** | Avatar component generates initials only. No image upload for profile photos or company logos |

---

# 4. Broken & Risky Implementation Areas

## 4.1 Authentication & Security Risks

| Issue | Severity | Details |
|---|---|---|
| **Token validation absent** | 🔴 Critical | `loadSession` deserializes stored JSON as User with no token validation. A tampered JSON string grants access |
| **No token refresh logic** | 🔴 Critical | Token stored once, never refreshed. Supabase tokens expire in 1 hour by default |
| **No route protection** | 🔴 Critical | No auth guards on (candidate) or (employer) tab groups. Direct URL navigation bypasses auth |
| **OTP bypass on sign-up** | 🟠 High | Sign-up sets user+token in store before OTP screen. User can kill app and relaunch as authenticated |
| **Role not validated server-side** | 🟠 High | Role is stored in client state only. A candidate could manually navigate to employer routes |
| **No session expiry handling** | 🟠 High | If Supabase session expires, app continues showing stale data with no re-auth prompt |
| **SecureStore value limit** | 🟡 Medium | SecureStore has 2048-byte limit on iOS. Serialized User JSON could exceed this for complex profiles |
| **API client has no auth interceptor** | 🟡 Medium | `apiClient` requires manual token passing. No automatic header injection from auth store |

## 4.2 Data Integrity Risks

| Issue | Severity | Details |
|---|---|---|
| **No offline/network error handling** | 🔴 Critical | Zero try/catch around data operations. App will crash or show blank on network failure |
| **No data validation** | 🟠 High | Forms use manual validation. Zod schemas (installed) are never defined or used |
| **ID generation with Date.now()** | 🟡 Medium | New vacancies/applications use `Date.now().toString()` as IDs. Collision risk and not UUID |
| **Zustand state not persisted** | 🟠 High | All data (saved jobs, profile edits, new vacancies) lost on app restart |
| **No optimistic updates** | 🟡 Medium | Apply-to-vacancy shows success alert before any real persistence |

## 4.3 Performance Risks

| Issue | Details |
|---|---|
| **Nested FlatList in ScrollView** | `home.tsx` nests horizontal FlatLists inside a ScrollView — known RN performance anti-pattern |
| **No list virtualization optimization** | No `getItemLayout`, `windowSize`, `maxToRenderPerBatch` on any FlatList |
| **No image caching** | Avatar uses View-based initials only, but when real images are added, no caching strategy exists |
| **NativeWind installed but unused** | 240KB+ library in bundle doing nothing |
| **react-native-worklets installed but unused** | Additional bundle bloat |

---

# 5. Production Readiness Gaps

## 5.1 Build & Distribution

| Gap | Details |
|---|---|
| **No EAS Build configuration** | No `eas.json` file. Cannot build for App Store / Play Store |
| **No app signing setup** | No iOS provisioning profiles, no Android keystore configuration |
| **No over-the-air update setup** | No `expo-updates` configured |
| **No bundle analysis** | No way to measure / optimize JS bundle size |
| **No Proguard / Hermes optimization** | Hermes is default in SDK 55 but no verification of optimization |

## 5.2 Environment & Configuration

| Gap | Details |
|---|---|
| **No `.env` file** | Only `.env.example` exists. No documentation on required environment setup |
| **Hardcoded fallback URLs** | Supabase URL defaults to `'https://your-project.supabase.co'` — would fail silently in production |
| **No environment validation** | No startup check that required env vars are present |
| **No staging/production environment separation** | Single env file, no multi-environment config |
| **EXPO_PUBLIC_API_URL unused** | References `https://api.axtaris.az` but no backend API exists |

## 5.3 Error Handling & Monitoring

| Gap | Details |
|---|---|
| **No crash reporting** | No Sentry, Bugsnag, or Firebase Crashlytics |
| **No analytics** | No event tracking (Mixpanel, Amplitude, Firebase Analytics) |
| **No performance monitoring** | No React Native Performance monitoring |
| **Silent error swallowing** | `storage.ts` catches all errors silently. `i18n/index.ts` catches all errors silently |
| **No global error boundary** | No React error boundary component. Unhandled errors crash the app |
| **No network connectivity monitoring** | No NetInfo checks or offline detection |

## 5.4 Testing

| Gap | Details |
|---|---|
| **Zero test files** | No unit tests, integration tests, or E2E tests exist |
| **No test configuration** | No Jest config, no testing-library setup, no Detox/Maestro |
| **No test scripts** | `package.json` has no `test` script |
| **No CI/CD pipeline** | No GitHub Actions, no Bitrise, no CircleCI configuration |

## 5.5 App Store Requirements

| Gap | Details |
|---|---|
| **No privacy manifest** | iOS requires privacy manifest for App Store submission (SDK 55 requirement) |
| **No NSCameraUsageDescription** | Image picker requires Info.plist entries |
| **No app icon variants** | Adaptive icon exists for Android but no proper App Store Connect assets |
| **No screenshots** | No store listing screenshots |
| **No app description/metadata** | No ASO (App Store Optimization) content |
| **No app review information** | No demo credentials document for Apple review team |

---

# 6. UX & User Journey Completion Tasks

## 6.1 Onboarding & Auth Flow

| Issue | Impact |
|---|---|
| Onboarding slides use hardcoded dark theme colors, ignoring user's theme setting | Visual inconsistency in light mode |
| No "back to role selection" from sign-in screen top level | User trapped in wrong role flow |
| Phone number field on sign-up has no formatting or validation | Bad data entry |
| Terms/Privacy links are non-functional styled text | Legal non-compliance |
| No "Remember me" option on sign-in | Poor returning user experience |
| No biometric authentication (Face ID / fingerprint) | Missing premium feature |

## 6.2 Candidate Journey

| Issue | Impact |
|---|---|
| Cannot add/edit/delete work experience entries | Profile permanently incomplete |
| Cannot add/edit/delete education entries | Same |
| Cannot add/edit/delete language entries | Same |
| Cannot add/edit/delete certification entries | Same |
| No profile photo upload | Impersonal profiles |
| "Apply Now" shows Alert only — no cover letter attachment or CV selection | Thin application flow |
| No application withdrawal capability | User locked in |
| No salary filter in search | Key filter missing |
| No experience level filter in search | Key filter missing |
| No sort options (newest, salary, relevance) | Discovery limitation |
| "Top Companies" → "See All" is a no-op | Dead-end |
| Company card taps route to search, not company detail | Confusing navigation |

## 6.3 Employer Journey

| Issue | Impact |
|---|---|
| Cannot view candidate full profile from applicant list | Cannot evaluate candidates |
| Cannot download/view candidate CV | Critical hiring gap |
| No candidate comparison or notes feature | Poor hiring workflow |
| No messaging/contact candidate feature | Cannot progress hiring |
| Vacancy "Edit" navigates to detail view, not edit form | Cannot modify vacancies |
| No vacancy duplication/template feature | Repeated manual entry |
| Analytics are static — no date range, no charts | Useless dashboard |
| Company logo/cover image upload not implemented | Unprofessional company profiles |

## 6.4 Missing UX States

| Missing State | Where |
|---|---|
| **Loading/skeleton states** | SkeletonLoader component exists but is never used on any screen |
| **Pull-to-refresh** | No `RefreshControl` on any list |
| **Haptic feedback** | `expo-haptics` installed but never imported |
| **Error retry states** | No "retry" buttons after failed operations |
| **Empty states for all lists** | EmptyState component exists and is used — ✅ (one of few complete patterns) |
| **Confirmation dialogs** | Only vacancy delete has confirmation. No confirm for: sign out, application submit, status changes |

---

# 7. Architecture & Scalability Improvements

## 7.1 State Management

| Problem | Recommendation |
|---|---|
| `dataStore.ts` is a monolithic store holding all domain data | Split into domain-specific stores: vacancyStore, applicationStore, companyStore, notificationStore |
| Server data in Zustand (should be in TanStack Query) | Move all server-fetched data to `useQuery`/`useMutation` hooks with proper caching, invalidation, and background refetch |
| No data normalization | Vacancy objects embed full Company objects — leads to stale copies. Normalize with ID references |
| No pagination support | Add cursor-based pagination for vacancy lists, applicant lists |

## 7.2 Service Layer

| Problem | Recommendation |
|---|---|
| `authService.ts` uses `require()` for dynamic import | Use proper static imports with tree-shaking |
| No repository pattern | Create typed repository classes per domain entity that abstract Supabase queries |
| `apiClient` (api.ts) is unused and disconnected | Either remove or integrate with auth interceptor for any non-Supabase endpoints |
| AI service has no abstraction for provider swapping | Create `AIProvider` interface so mock/OpenAI/Anthropic can be swapped via config |

## 7.3 Component Architecture

| Problem | Recommendation |
|---|---|
| Screens are 200-340 lines with inline styles and logic | Extract business logic into custom hooks (`useVacancyDetail`, `useCandidateHome`, etc.) |
| Form logic duplicated across screens | Implement React Hook Form + Zod for all forms with shared validation schemas |
| No form field components for complex types | Build DatePicker, Select/Dropdown, MultiSelect, PhoneInput components |
| Hardcoded color values in several screens | Replace all hardcoded hex colors (`#5B7FD6`, `rgba(255,255,255,0.5)`) with theme tokens |

## 7.4 Code Quality

| Problem | Recommendation |
|---|---|
| No ESLint configuration | Add ESLint with expo/recommended + prettier |
| No Prettier configuration | Add `.prettierrc` for consistent formatting |
| `VacancyCard` has hardcoded English work type labels | Use i18n keys instead |
| `vacancy/[id].tsx` has hardcoded English work type labels | Same |
| `vacancy/create.tsx` has hardcoded English labels for work types and experience levels | Same |
| `vacancies.tsx` has hardcoded English status labels | Same |
| Several `as any` type casts | Replace with proper types |

---

# 8. Security & Infrastructure Hardening Tasks

## 8.1 Authentication Hardening

| Task | Priority |
|---|---|
| Implement proper auth state machine (unauthenticated → authenticating → authenticated → refreshing) | 🔴 Critical |
| Add route guards (middleware) that redirect unauthenticated users | 🔴 Critical |
| Implement Supabase `onAuthStateChange` listener for token refresh and session management | 🔴 Critical |
| Add role-based route protection (candidates can't access employer routes and vice versa) | 🔴 Critical |
| Block app access until OTP is verified (don't set auth state pre-verification) | 🟠 High |
| Implement biometric auth unlock for returning users | 🟡 Medium |
| Add rate limiting on auth attempts (client-side throttle) | 🟡 Medium |

## 8.2 Data Security

| Task | Priority |
|---|---|
| Validate all user inputs with Zod schemas before sending to backend | 🔴 Critical |
| Sanitize all text inputs to prevent XSS in WebView contexts | 🟠 High |
| Implement proper file type validation for CV uploads (not just MIME type, but magic bytes) | 🟠 High |
| Add file size limits enforcement for uploads | 🟠 High |
| Review and test all RLS policies with edge cases | 🔴 Critical |
| Add database-level constraints for salary ranges (min <= max) | 🟡 Medium |
| Implement API key rotation strategy for Supabase anon key | 🟡 Medium |

## 8.3 Infrastructure

| Task | Priority |
|---|---|
| Set up Supabase project with proper organization and access controls | 🔴 Critical |
| Configure Supabase Storage buckets with proper policies for CV uploads and images | 🔴 Critical |
| Set up database backups schedule | 🟠 High |
| Configure Supabase Edge Functions for server-side operations (notifications, moderation) | 🟠 High |
| Set up Supabase Realtime for notifications | 🟡 Medium |
| Implement proper CORS configuration | 🟡 Medium |

---

# 9. DevOps, Testing & Release Engineering Tasks

## 9.1 CI/CD Pipeline

| Task | Details |
|---|---|
| Create `eas.json` with development, preview, and production build profiles | Required for any build |
| Set up GitHub Actions workflow for: lint, type-check, test on every PR | Quality gate |
| Set up EAS Build for iOS and Android | Automated builds |
| Set up EAS Submit for App Store Connect and Google Play Console | Automated submission |
| Configure OTA updates via `expo-updates` | Hot-fix capability |
| Set up branch-based deployment (develop → preview, main → production) | Release management |

## 9.2 Testing Strategy

| Layer | Tools | Scope |
|---|---|---|
| **Unit tests** | Jest + @testing-library/react-native | All services, stores, utility functions, validation schemas |
| **Component tests** | Jest + @testing-library/react-native | All UI components (Button, Input, Card, etc.) |
| **Integration tests** | Jest + MSW (Mock Service Worker) | Auth flows, data fetching, form submissions |
| **E2E tests** | Maestro or Detox | Critical user journeys: onboarding → sign-up → OTP → home → search → apply |
| **Visual regression** | Storybook for React Native (optional) | Design system consistency |

## 9.3 Monitoring & Observability

| Task | Details |
|---|---|
| Integrate Sentry for crash reporting | Mobile + JS errors |
| Set up Firebase Analytics or Mixpanel | User behavior tracking |
| Add performance monitoring (app startup time, screen render time) | UX quality metrics |
| Set up Supabase dashboard alerts for error rates | Backend health |
| Create runbook for common production issues | Operational readiness |

---

# 10. PRIORITIZED TASK MASTER LIST

Tasks are ordered by execution priority. Dependencies are noted. Risk levels: 🔴 Critical, 🟠 High, 🟡 Medium, 🟢 Low.

## 10.1 Execution Tracking

- **Tracking Rule:** This document must be updated during every implementation cycle.
- **Current Execution Phase:** Phase 1 — Foundation & Backend Integration
- **Last Completed Cycle:** Cycle 4 — `T-002: Replace Mock Data Layer with Supabase Integration` (Candidate vacancy actions slice)
- **Current Active Cycle:** Cycle 5 — `T-002: Replace Mock Data Layer with Supabase Integration` (Applications and notifications slice)

---

## PHASE 1: Foundation & Backend Integration (Weeks 1-3)

### T-001: Implement Auth State Machine & Route Guards
- **Area:** Frontend / Security
- **Execution Status:** ✅ Completed
- **Implementation Note:** Root auth listener, guarded routing, role-based protection, session expiry handling, and OTP-gated authentication were implemented in Cycle 1.
- **Problem:** No authentication enforcement. Any user can access any route. Token never refreshes.
- **Why it matters:** Without this, the app is fundamentally insecure and cannot go to production.
- **What must be implemented:**
  - Add `onAuthStateChange` listener in root layout
  - Implement auth middleware/guards that redirect unauthenticated users to auth flow
  - Add role-based route protection (candidate routes vs employer routes)
  - Handle token refresh automatically
  - Handle session expiry with re-auth prompt
  - Fix OTP flow: don't set authenticated state until verification completes
- **Dependencies:** None
- **Risk:** 🔴 Critical
- **Complexity:** High
- **Production impact:** Blocking — cannot ship without this

### T-002: Replace Mock Data Layer with Supabase Integration
- **Area:** Backend / Frontend
- **Execution Status:** 🟡 In Progress
- **Completed Slice:** Typed Supabase vacancy/company read service plus React Query hooks for candidate vacancy lists, vacancy detail, and employer vacancy preview.
- **Implemented Consumers:** `app/(candidate)/home.tsx`, `app/(candidate)/search.tsx`, `app/(candidate)/saved.tsx`, `app/vacancy/[id].tsx`, `app/(employer)/dashboard.tsx`
- **Completed Mutation Slice:** Employer company lookup, vacancy create mutation, vacancy status mutation, vacancy delete mutation, and migration of employer vacancy management screens.
- **Implemented Management Screens:** `app/vacancy/create.tsx`, `app/(employer)/vacancies.tsx`
- **Completed Candidate Action Slice:** Saved jobs query/mutation hooks, candidate applications query/mutation hooks, and migration of candidate vacancy save/apply consumers.
- **Implemented Candidate Action Screens:** `app/(candidate)/home.tsx`, `app/(candidate)/search.tsx`, `app/(candidate)/saved.tsx`, `app/vacancy/[id].tsx`, `app/(candidate)/applications.tsx`
- **Current Slice:** Applications and notifications migration.
- **Problem:** All data is hardcoded. `USE_MOCK = true` blocks all real functionality.
- **Why it matters:** The app is non-functional without real data persistence.
- **What must be implemented:**
  - Create typed Supabase query functions for all tables (profiles, candidate_profiles, companies, vacancies, applications, saved_jobs, notifications)
  - Implement TanStack Query hooks for each domain: `useVacancies`, `useApplications`, `useSavedJobs`, `useCompany`, `useNotifications`, `useCandidateProfile`, `useAnalytics`
  - Replace all `useDataStore` usages with corresponding query hooks
  - Implement mutations with optimistic updates for: apply, save, status changes
  - Add proper error handling and loading states
  - Set `USE_MOCK = false` and remove mock data dependency from production build
- **Dependencies:** T-001
- **Risk:** 🔴 Critical
- **Complexity:** High
- **Production impact:** Blocking — core functionality

### T-003: Implement Form Validation with React Hook Form + Zod
- **Area:** Frontend
- **Problem:** All forms use raw `useState` with ad-hoc validation. Zod and React Hook Form are installed but unused.
- **Why it matters:** Data quality, UX consistency, and security depend on proper validation.
- **What must be implemented:**
  - Define Zod schemas for: SignIn, SignUp, VacancyCreate, ProfileEdit, CompanyEdit
  - Refactor all form screens to use `useForm` + `zodResolver`
  - Add proper phone number validation (Azerbaijan format +994)
  - Add proper salary validation (min ≤ max, positive integers)
  - Add URL validation for website/portfolio fields
  - Add password strength indicator on sign-up
- **Dependencies:** None
- **Risk:** 🟠 High
- **Complexity:** Medium
- **Production impact:** Data integrity and UX quality

### T-004: Implement CV Upload to Supabase Storage
- **Area:** Backend / Frontend
- **Problem:** DocumentPicker works but file is only saved to local Zustand state, never uploaded.
- **Why it matters:** CV is the core artifact for job applications. Without real upload, applications are empty.
- **What must be implemented:**
  - Configure Supabase Storage bucket `cv-uploads` with RLS policies
  - Implement upload function with progress indicator
  - Add file size validation (max 10MB)
  - Store file URL in candidate_profiles table
  - Allow employers to download/preview CV from applicant view
  - Handle upload failures with retry
- **Dependencies:** T-002
- **Risk:** 🟠 High
- **Complexity:** Medium
- **Production impact:** Core feature

### T-005: Implement Image Upload for Avatars and Company Logos
- **Area:** Backend / Frontend
- **Problem:** Avatar component only shows initials. No image upload capability. `expo-image-picker` is installed but unused.
- **Why it matters:** Professional profiles and company pages require images.
- **What must be implemented:**
  - Configure Supabase Storage bucket `avatars` and `company-logos`
  - Build image picker flow with crop/resize
  - Implement upload with compression
  - Update Avatar component to display remote images with fallback to initials
  - Cache images locally
- **Dependencies:** T-002
- **Risk:** 🟡 Medium
- **Complexity:** Medium
- **Production impact:** User experience / professionalism

---

## PHASE 2: Feature Completion (Weeks 3-6)

### T-006: Build Profile Section CRUD Screens
- **Area:** Frontend
- **Problem:** Candidate profile displays experience, education, languages, certifications from mock data but has no add/edit/delete UI.
- **Why it matters:** Candidates cannot build their profile, which is the core value proposition.
- **What must be implemented:**
  - Add Experience form screen: job title, company, location, start/end date, current toggle, description, highlights
  - Add Education form screen: degree, field of study, institution, start/end date, current toggle
  - Add Language form screen: language name, proficiency level picker
  - Add Certification form screen: name, issuer, issue date, expiry date, credential URL
  - Add date picker component (missing from UI library)
  - Add select/dropdown component (missing from UI library)
  - Wire all forms to Supabase mutations
  - Implement swipe-to-delete on list items
  - Recalculate profile completeness on each change
- **Dependencies:** T-002, T-003
- **Risk:** 🟠 High
- **Complexity:** High
- **Production impact:** Core feature

### T-007: Build Vacancy Edit Screen
- **Area:** Frontend
- **Problem:** Vacancy "Edit" button navigates to vacancy detail, not an edit form. Employers cannot modify posted vacancies.
- **Why it matters:** Employers need to update salary, requirements, status of active vacancies.
- **What must be implemented:**
  - Create `/vacancy/edit/[id].tsx` screen pre-populated with existing vacancy data
  - Share form logic with vacancy create screen (extract shared component)
  - Implement Supabase update mutation
  - Add save confirmation
- **Dependencies:** T-002, T-003
- **Risk:** 🟠 High
- **Complexity:** Medium
- **Production impact:** Employer workflow

### T-008: Build Candidate Detail Screen for Employers
- **Area:** Frontend
- **Problem:** Employer applicant list shows candidate cards but tapping doesn't open full profile. All applicants show identical mock data.
- **Why it matters:** Employers cannot evaluate candidates without seeing their full profile.
- **What must be implemented:**
  - Create `/applicant/[id].tsx` screen showing full candidate profile
  - Include: bio, skills, experience, education, languages, certifications
  - Add CV download button
  - Add shortlist/reject/accept action buttons
  - Add notes field for employer to annotate candidates
- **Dependencies:** T-002
- **Risk:** 🟠 High
- **Complexity:** Medium
- **Production impact:** Core employer feature

### T-009: Implement Real Application Flow
- **Area:** Frontend
- **Problem:** "Apply Now" creates in-memory record and shows Alert. No cover letter, no CV attachment, no server persistence.
- **Why it matters:** Applications are the transactional core of the platform.
- **What must be implemented:**
  - Build application modal/screen with: cover letter text area, CV selection (from uploaded CVs), confirm button
  - Submit to Supabase applications table
  - Send notification to employer via Supabase function
  - Show success confirmation with application tracking link
  - Block duplicate applications (already in schema with UNIQUE constraint)
  - Allow application withdrawal
- **Dependencies:** T-002, T-004
- **Risk:** 🟠 High
- **Complexity:** Medium
- **Production impact:** Core transactional feature

### T-010: Implement Notification System
- **Area:** Backend / Frontend
- **Problem:** Notifications are hardcoded mock arrays. No real-time delivery. Tapping doesn't navigate.
- **Why it matters:** Users need timely updates on application status, new matches, etc.
- **What must be implemented:**
  - Fetch notifications from Supabase notifications table
  - Set up Supabase Realtime subscription for new notifications
  - Implement notification deep linking (tap → navigate to relevant screen)
  - Add unread badge count on tab bar icons
  - Create Supabase Edge Function to generate notifications on: new application, status change, new matching vacancy
  - Integrate `expo-notifications` for push notifications
  - Add notification preferences screen
- **Dependencies:** T-002
- **Risk:** 🟠 High
- **Complexity:** High
- **Production impact:** User engagement

### T-011: Implement Real Analytics Dashboard
- **Area:** Frontend / Backend
- **Problem:** Employer dashboard shows static mock numbers. No charts, no time filtering.
- **Why it matters:** Analytics are a premium employer feature and key value proposition.
- **What must be implemented:**
  - Create Supabase view/function for aggregated analytics per employer
  - Implement time range filters (this week, this month, all time)
  - Add chart library (victory-native or react-native-chart-kit)
  - Display: applicant trends, vacancy performance comparison, response rate over time
  - Add export capability (CSV)
- **Dependencies:** T-002
- **Risk:** 🟡 Medium
- **Complexity:** Medium
- **Production impact:** Employer value

### T-012: Implement Company Detail Screen for Candidates
- **Area:** Frontend
- **Problem:** "Top Companies" section and vacancy company names have no tap-through to company profile.
- **Why it matters:** Candidates want to research companies before applying.
- **What must be implemented:**
  - Create `/company/[id].tsx` screen showing: company info, description, verification badge, active vacancies list
  - Link from: home company cards, vacancy detail company name, search results
  - Implement server fetch for company + their vacancies
- **Dependencies:** T-002
- **Risk:** 🟡 Medium
- **Complexity:** Low
- **Production impact:** User experience

### T-013: Implement Search Pagination & Advanced Filters
- **Area:** Frontend / Backend
- **Problem:** All vacancies loaded at once. No salary filter, no experience level filter, no sort options.
- **Why it matters:** Search is the primary discovery mechanism. Must handle 10K+ vacancies.
- **What must be implemented:**
  - Implement cursor-based pagination with infinite scroll
  - Add salary range filter (min/max slider)
  - Add experience level filter
  - Add sort options: newest, salary (high to low), relevance
  - Add full-text search via Supabase `to_tsvector` / `ts_rank`
  - Implement debounced search input
  - Add search history / recent searches
- **Dependencies:** T-002
- **Risk:** 🟡 Medium
- **Complexity:** Medium
- **Production impact:** User experience at scale

---

## PHASE 3: Polish & Quality (Weeks 6-8)

### T-014: Implement Global Error Boundary & Network Handling
- **Area:** Frontend
- **Problem:** No error boundaries, no network state monitoring, no retry mechanisms.
- **Why it matters:** App crashes on any unhandled error. No feedback on connectivity issues.
- **What must be implemented:**
  - Add React error boundary component wrapping root layout
  - Integrate `@react-native-community/netinfo` for connectivity monitoring
  - Show offline banner when disconnected
  - Add retry buttons on all failed data fetches
  - Queue mutations when offline and replay when reconnected
  - Add global toast/snackbar for operation feedback
- **Dependencies:** T-002
- **Risk:** 🟠 High
- **Complexity:** Medium
- **Production impact:** Stability

### T-015: Add Loading & Skeleton States to All Screens
- **Area:** Frontend / UX
- **Problem:** SkeletonLoader component exists but is never used. No loading states on data fetches.
- **Why it matters:** Users see blank screens while data loads, creating perception of broken app.
- **What must be implemented:**
  - Add skeleton states to: home, search, saved, applications, vacancies, applicants, dashboard, profile, notifications
  - Add pull-to-refresh (`RefreshControl`) on all list screens
  - Add loading overlays on mutation actions
  - Use `expo-haptics` for tactile feedback on key actions (apply, save, etc.)
- **Dependencies:** T-002
- **Risk:** 🟡 Medium
- **Complexity:** Low
- **Production impact:** Perceived performance

### T-016: Fix Hardcoded Colors & Strings
- **Area:** Frontend
- **Problem:** Multiple screens use hardcoded hex colors and English strings instead of theme tokens and i18n keys.
- **Why it matters:** Theme switching and language switching produce inconsistent results.
- **What must be implemented:**
  - Audit all screens for hardcoded color values (`#5B7FD6`, `#0A1628`, `rgba(...)` etc.) and replace with `colors.*` tokens
  - Audit all screens for hardcoded English strings and replace with `tr('...')` calls
  - Specifically fix: `VacancyCard` work type labels, `vacancy/[id].tsx` work type labels, `vacancy/create.tsx` labels, `vacancies.tsx` status labels, `verify-otp.tsx` error text, `company.tsx` hardcoded "Details" and "Founded", employer settings "Coming Soon" alerts
  - Verify all three locales (az/ru/en) have complete key coverage
- **Dependencies:** None
- **Risk:** 🟡 Medium
- **Complexity:** Low
- **Production impact:** i18n/theme correctness

### T-017: Implement Deep Linking & Password Reset Completion
- **Area:** Frontend
- **Problem:** `scheme: "axtaris"` is configured but no link handlers exist. Password reset emails have nowhere to land.
- **Why it matters:** Password reset flow is broken end-to-end. Magic links won't work.
- **What must be implemented:**
  - Configure Expo linking to handle `axtaris://` scheme
  - Add `reset-password` screen to handle deep link with token
  - Handle Supabase auth callback URLs
  - Test universal links / app links for both iOS and Android
- **Dependencies:** T-001
- **Risk:** 🟠 High
- **Complexity:** Medium
- **Production impact:** Auth flow completion

### T-018: Build Legal Pages (Terms of Service, Privacy Policy)
- **Area:** Frontend / Legal
- **Problem:** Sign-up references Terms and Privacy but they're non-functional styled text.
- **Why it matters:** App Store / Play Store require privacy policy. Legal compliance for user data.
- **What must be implemented:**
  - Create Terms of Service screen with scrollable content
  - Create Privacy Policy screen with scrollable content
  - Link from sign-up screen
  - Add to settings menu
  - Content must cover: data collection, usage, storage, GDPR-equivalent rights, cookie policy
  - Must be available in all three languages
- **Dependencies:** Legal team input
- **Risk:** 🟠 High
- **Complexity:** Low (technical), High (legal content)
- **Production impact:** App Store submission blocker

### T-019: Implement Account Deletion Flow
- **Area:** Frontend / Backend
- **Problem:** `deleteAccount` i18n key exists but no implementation. Required by App Store guidelines.
- **Why it matters:** Apple requires account deletion capability for App Store approval since June 2022.
- **What must be implemented:**
  - Add "Delete Account" button in settings with multi-step confirmation
  - Implement Supabase Edge Function for cascading account deletion
  - Clear all local storage and state
  - Redirect to role-select screen
  - Send confirmation email
- **Dependencies:** T-001, T-002
- **Risk:** 🟠 High
- **Complexity:** Medium
- **Production impact:** App Store submission blocker

---

## PHASE 4: Production Readiness (Weeks 8-10)

### T-020: Set Up EAS Build & Release Pipeline
- **Area:** DevOps
- **Problem:** No build configuration, no CI/CD, no release process.
- **Why it matters:** Cannot build distributable binaries or submit to stores.
- **What must be implemented:**
  - Create `eas.json` with development, preview, and production profiles
  - Configure iOS build with provisioning and certificates
  - Configure Android build with keystore
  - Set up GitHub Actions for: lint → type-check → test → build on PR merge
  - Configure EAS Submit for automated store submission
  - Set up environment variable management in EAS
- **Dependencies:** None
- **Risk:** 🔴 Critical
- **Complexity:** Medium
- **Production impact:** Deployment blocker

### T-021: Set Up Crash Reporting & Analytics
- **Area:** DevOps / Frontend
- **Problem:** No visibility into production errors, crashes, or user behavior.
- **Why it matters:** Cannot diagnose issues or measure product success without observability.
- **What must be implemented:**
  - Integrate Sentry SDK with source maps
  - Set up Firebase Analytics or Mixpanel for event tracking
  - Track key events: sign_up, sign_in, search, apply, vacancy_create, profile_edit
  - Add performance monitoring for screen load times
  - Set up alerting for error rate spikes
- **Dependencies:** T-020
- **Risk:** 🟠 High
- **Complexity:** Medium
- **Production impact:** Operational visibility

### T-022: Write Core Test Suite
- **Area:** QA
- **Problem:** Zero tests exist.
- **Why it matters:** No way to verify correctness or prevent regressions.
- **What must be implemented:**
  - Configure Jest with React Native preset
  - Install @testing-library/react-native
  - Unit tests for: authStore, dataStore, storage utility, validation schemas, aiService
  - Component tests for: Button, Input, OTPInput, VacancyCard, Badge, EmptyState
  - Integration tests for: sign-in flow, sign-up flow, job search & filter, apply flow
  - Add test script to package.json
  - Minimum 60% code coverage target
- **Dependencies:** T-003
- **Risk:** 🟠 High
- **Complexity:** High
- **Production impact:** Quality assurance

### T-023: Configure Multi-Environment Setup
- **Area:** DevOps
- **Problem:** Single environment configuration. No separation between development, staging, and production.
- **Why it matters:** Cannot safely test against production-like environment.
- **What must be implemented:**
  - Create separate Supabase projects for dev/staging/prod
  - Configure environment variables per EAS build profile
  - Add startup environment validation (fail fast if missing vars)
  - Remove hardcoded fallback URLs
  - Document environment setup in README
- **Dependencies:** T-020
- **Risk:** 🟠 High
- **Complexity:** Medium
- **Production impact:** Operational safety

### T-024: App Store Submission Preparation
- **Area:** Release
- **Problem:** No store assets, metadata, or submission configuration.
- **Why it matters:** Cannot submit to App Store or Play Store.
- **What must be implemented:**
  - Generate all required app icon sizes
  - Create App Store screenshots (6.7", 6.5", 5.5" iPhone, iPad)
  - Create Play Store feature graphic and screenshots
  - Write app descriptions in all three languages
  - Prepare App Store review notes with demo credentials
  - Configure `expo-splash-screen` properly for launch screen
  - Add iOS privacy manifest (NSPrivacyTracking, NSPrivacyCollectedDataTypes)
  - Add required Info.plist entries (camera, photo library descriptions)
  - Configure Android permissions properly
- **Dependencies:** T-018, T-019, T-020
- **Risk:** 🟠 High
- **Complexity:** Medium
- **Production impact:** Store submission blocker

### T-025: Implement Vacancy Moderation System
- **Area:** Backend / Frontend
- **Problem:** Schema has moderation tables and vacancy `pending_moderation` status but no admin flow.
- **Why it matters:** Unmoderated content creates legal and reputation risk.
- **What must be implemented:**
  - Create Supabase Edge Function for auto-moderation (keyword filtering)
  - Set vacancy default status to `pending_moderation` instead of `active`
  - Create admin notification for new vacancies pending review
  - (Optional) Build minimal web-based admin dashboard for moderation queue
  - Add content reporting flow for users (flag inappropriate vacancies/companies)
- **Dependencies:** T-002
- **Risk:** 🟡 Medium
- **Complexity:** Medium
- **Production impact:** Content quality and legal safety

---

## PHASE 5: AI & Premium Features (Weeks 10-12)

### T-026: Integrate Real LLM for AI Features
- **Area:** Backend / AI
- **Problem:** AI service returns hardcoded mock suggestions. No real intelligence.
- **Why it matters:** AI features are a key differentiator promised in the product.
- **What must be implemented:**
  - Create Supabase Edge Function as AI proxy (keeps API keys server-side)
  - Implement `AIProvider` interface with OpenAI/Anthropic adapter
  - Wire profile analysis to real LLM calls
  - Wire skill suggestion to real LLM with Azerbaijan job market context
  - Wire experience rewriting to real LLM
  - Wire resume summary builder to real LLM
  - Add cost tracking and rate limiting per user
  - Add AI usage analytics
- **Dependencies:** T-002
- **Risk:** 🟡 Medium
- **Complexity:** High
- **Production impact:** Premium feature

### T-027: Implement Job Matching Algorithm
- **Area:** Backend
- **Problem:** "Recommended jobs" section just shows first 4 vacancies from mock array.
- **Why it matters:** Personalized recommendations are the primary discovery and engagement mechanism.
- **What must be implemented:**
  - Create matching algorithm based on: skills overlap, location preference, salary range, work type preference, experience level
  - Implement as Supabase function or Edge Function
  - Cache recommendations with periodic refresh
  - Add "Why recommended" explanation per vacancy
- **Dependencies:** T-002, T-006
- **Risk:** 🟡 Medium
- **Complexity:** High
- **Production impact:** User engagement

### T-028: Remove Unused Dependencies & Optimize Bundle
- **Area:** DevOps
- **Problem:** NativeWind (unused), react-native-worklets (unused) add to bundle size.
- **Why it matters:** Smaller bundle = faster install, faster startup.
- **What must be implemented:**
  - Remove `nativewind` and `tailwindcss` (completely unused)
  - Remove `react-native-worklets` (unused)
  - Audit all dependencies for actual usage
  - Run bundle analysis with `npx expo export` size report
  - Configure tree-shaking for lucide-react-native (import individual icons)
  - Verify Hermes is enabled and optimized
- **Dependencies:** None
- **Risk:** 🟢 Low
- **Complexity:** Low
- **Production impact:** Performance optimization

---

## Summary Execution Matrix

| Phase | Weeks | Tasks | Focus |
|---|---|---|---|
| **Phase 1** | 1-3 | T-001 → T-005 | Foundation: Auth, Backend, Storage |
| **Phase 2** | 3-6 | T-006 → T-013 | Feature Completion: CRUD, Flows, Search |
| **Phase 3** | 6-8 | T-014 → T-019 | Polish: Errors, UX, Legal, Hardcoded fixes |
| **Phase 4** | 8-10 | T-020 → T-025 | Production: CI/CD, Tests, Stores, Moderation |
| **Phase 5** | 10-12 | T-026 → T-028 | Premium: AI, Matching, Optimization |

**Estimated total effort:** 12 weeks with 2-3 engineers  
**Critical path:** T-001 → T-002 → T-006/T-009 → T-020 → T-024  

---

*End of Master Plan*
