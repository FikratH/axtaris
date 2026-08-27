# Claude Fable 5 master prompt — AxtarIS landing page

Copy everything below the divider into Claude Code while your working directory is the AxtarIS repository root.

---

You are the design director and senior frontend engineer responsible for creating the launch-quality marketing website for **AxtarIS**, a premium two-sided employment marketplace mobile application for Azerbaijan.

This is an implementation task, not a moodboard, tutorial, or planning-only exercise. Inspect the repository, make decisions, build the complete page, run it, inspect it in a real browser at desktop and mobile sizes, fix what you find, and leave the project in a verified state. Do not stop after describing a plan.

## Non-negotiable tool and skill workflow

Before writing UI code:

1. Load and follow the installed **Impeccable** skill/plugin for a new **Persuade** surface. Actually execute its required context, product-truth, concept, and quality-floor workflow. Do not merely mention it in the final summary.
2. Load and follow **ui-ux-pro-max**. Use its design-system search/recommendation workflow for a landing page in the chosen React stack. Apply its findings to typography, palette roles, spacing, responsive behavior, accessibility, and interaction design. Do not paste a stock template from its catalog.
3. Reconcile the two systems this way:
   - Impeccable owns product truth, art direction, composition, distinctiveness, motion intent, and the anti-slop bar.
   - ui-ux-pro-max supplies research-backed UX, token, accessibility, and stack-specific implementation checks.
   - This brief and the repository’s factual product evidence override either skill if there is a conflict.
4. Use **shadcn/ui** as accessible, editable primitives—not as a visual preset. Restyle every used component so the result belongs unmistakably to AxtarIS. Use only components that improve the experience.
5. Use **GSAP** with `@gsap/react` for purposeful choreography and **Lenis** for desktop smooth scrolling. Integrate Lenis with GSAP’s ticker/ScrollTrigger correctly. Keep native touch scrolling on touch devices if that is more robust. Respect `prefers-reduced-motion`, clean up animation contexts, avoid hydration errors, and never let animation hide essential content.
6. Use Lucide icons or another existing icon library already in the selected web app. Do not draw arbitrary SVG icons or use emoji as interface icons.
7. Use browser automation/Playwright or the available browser tool for bounded visual QA: inspect desktop and mobile together, make one batched correction pass, then one confirmation pass.

If either requested skill is unavailable, say exactly which one is missing and how to install it, but continue as far as safely possible with the available system. Never silently pretend a skill ran.

## First: understand the real product

Read the repository before choosing copy, structure, or visuals. At minimum inspect:

- `README.md`, `ROADMAP.md`, `LATEST_PLAN.md`, and relevant current implementation files; treat older planning documents as historical when code contradicts them.
- `src/theme/colors.ts`, `src/theme/typography.ts`, `src/theme/spacing.ts`, and representative UI components.
- Candidate surfaces such as `app/(candidate)/home.tsx`, search, vacancy detail, profile, CV review, AI assistant, saved jobs, and applications.
- Employer surfaces such as dashboard, vacancies, talent search, applicants, company profile, and analytics.
- English, Azerbaijani, and Russian locale files for real product vocabulary.
- Subscription definitions and presentation utilities, but do not put pricing on the landing page unless the current source of truth and business intent make it appropriate.
- Brand assets in `assets/`, including the icon and wordmark.
- Current runtime/configuration so you do not break the Expo mobile app.

Use repository evidence as the source of truth. AxtarIS currently serves two audiences:

- Candidates who want relevant vacancies, profile/CV help, application tracking, saved searches/jobs, match explanations, chat, and career visibility.
- Employers who want to publish and manage vacancies, discover talent, review applicants, communicate, and understand hiring activity.

It is Azerbaijan-first and supports Azerbaijani, Russian, and English. Preserve the existing AxtarIS name and logo. The incumbent palette is built around deep navy (`#2D4797`) and teal (`#0097A7`), but expand it into a sophisticated web system rather than producing a generic blue SaaS page. Do not alter factual product claims or imply capabilities that the code does not support.

## Default decisions — proceed without blocking

Unless repository evidence or the human says otherwise, use these defaults:

- Create a self-contained production web app under `landing/` so the Expo application remains untouched. Use a current stable **Next.js App Router + TypeScript + Tailwind CSS + shadcn/ui** setup suitable for SEO and deployment.
- If a dedicated landing app already exists, improve it in place instead of creating a duplicate.
- Primary language: Azerbaijani. Include a polished AZ / EN / RU language control and structure copy so it can be fully localized. Do not leave mixed-language sections.
- Primary conversion: begin as a candidate / get the app. Secondary conversion: employer path / post a vacancy.
- If real App Store, Google Play, web-app, or employer-registration URLs are absent, centralize them in one typed config file with explicit TODO comments. Do not invent store availability, ratings, or URLs. Render honest “Tezliklə” states where necessary while preserving a useful route into any live web experience found in the repo.
- Use real app screens as the product proof. Run the app and capture representative screens if practical. Never use unrelated dashboard mockups. If a faithful live capture is impossible, build restrained, clearly illustrative product previews from real repo copy and UI structure and keep all claims true.

Ask at most one concise round of questions only if a missing answer would materially change product truth, the build location, or the conversion action. Do not ask the human to choose CSS values, a generic style adjective, or a template. If there is no response mechanism, state your assumptions and continue.

## Creative standard

The page must feel commissioned, culturally relevant, and specific to the act of matching people with opportunities—not like a generated SaaS landing page.

Use the AxtarIS mechanism as material: profiles, skills, vacancy criteria, match signals, career movement, candidate-to-employer connection, and the passage from discovery to conversation. The arrow in the logo may influence movement and directional rhythm, but do not repeat arrows as a superficial pattern or make the entire concept a literal logo animation.

Before implementation, use Impeccable’s required concept-selection process. Commit to one coherent visual world with a named design thesis and apply its grammar across page regions, type, color fields, controls, imagery, and motion. The landing page should have one memorable, product-specific signature interaction that demonstrates matching or career progression without becoming a gimmick.

Aim for controlled editorial energy: premium, optimistic, assured, and human. The design can be bold and colorful, but clarity and trust must survive. Make the mobile composition intentional rather than a stacked desktop page.

Choose typography with a real point of view and full Azerbaijani character support (`Ə ə Ğ ğ İ ı Ö ö Ş ş Ü ü Ç ç`). Verify the actual font files and glyph coverage. Do not default to Inter, Space Grotesk, Plus Jakarta Sans, Outfit, DM Sans, or a fashionable display serif unless the concept has a specific, defensible reason. Define a disciplined type scale with fluid `clamp()` values and readable line lengths.

## Explicit anti-slop constraints

Do not use:

- generic purple/blue aurora gradients, glowing blobs, star fields, grid backgrounds, random noise overlays, or decorative particles;
- glassmorphism as the main visual language;
- a giant headline consuming almost the entire first viewport;
- a centered hero followed by three generic feature cards and a logo cloud;
- excessive rounded cards, pills, badges, nested containers, or a bento grid used as a substitute for composition;
- fake testimonials, employer logos, download counts, “trusted by thousands,” ratings, awards, percentages, case studies, or invented analytics;
- vague copy such as “revolutionize your career,” “unlock your potential,” “seamless experience,” “AI-powered platform,” or “the future of hiring” without concrete evidence;
- decorative dashboards, charts, maps, or match scores that are not grounded in the product;
- gradients on every heading, excessive text outlines, gratuitous 3D, scroll hijacking, long cinematic loaders, custom cursors, or constant motion;
- stock photos of smiling office workers, handshake clichés, anonymous 3D people, or generated imagery that could belong to any HR product;
- shadcn’s default neutral styling, default border radius everywhere, default shadow recipes, or component-demo-page aesthetics;
- repetitive section titles, repetitive “Learn more” links, or every section having identical spacing and alignment;
- placeholder copy, dead buttons, horizontal overflow, tiny mobile text, layout shifts, or desktop-only hover affordances.

Avoiding AI slop does not mean making the page sterile. Use strong art direction, expressive type, asymmetry where it improves rhythm, deliberate negative space, real product detail, and one or two moments of genuine delight.

## Page experience and content architecture

Do not treat the following as a rigid template. Use the chosen concept to compose a continuous story, but ensure every job is covered:

1. **Navigation** — concise, sticky only if useful, with the real wordmark, candidate/employer pathways, language switch, and one clear primary action. Make the mobile menu fully accessible using a shadcn Sheet or equivalent.
2. **First viewport** — communicate within seconds what AxtarIS is, who it is for, and what to do next. Show real product evidence above the fold. Include a primary candidate CTA and a visually subordinate employer CTA. Draft sharp Azerbaijani copy from the repository vocabulary; do not simply translate English marketing clichés.
3. **The matching mechanism** — make AxtarIS’s value tangible through an interactive, scroll-linked sequence built from real concepts: candidate profile/skills → relevant vacancy/match explanation → application/conversation. This should be the signature interaction. It must still read clearly with JavaScript disabled or reduced motion enabled.
4. **Candidate story** — demonstrate relevant search, transparent match signals, profile/CV improvement, saved jobs/searches, application tracking, and communication. Prioritize the few strongest capabilities instead of dumping every feature into cards.
5. **Employer story** — show vacancy publishing/management, talent discovery, applicant review, messaging, and useful activity signals. Give employers a distinct visual chapter without making the page feel like two unrelated sites.
6. **AI assistance** — present AI as a specific supporting tool for CV/profile writing, cover-letter or vacancy-writing assistance only where the current code supports it. Avoid robot iconography and magical claims. Human agency stays explicit.
7. **Localization and trust** — show that AxtarIS is built for Azerbaijan through language, AZN-aware product details where relevant, real local vocabulary, and the actual interface—not flags, tourist imagery, or cultural stereotypes. Do not claim security certifications or partnerships that are not documented.
8. **Final conversion** — a decisive closing composition with candidate and employer choices. It should feel like the conclusion of the page’s visual argument, not a generic CTA card.
9. **Footer** — real navigation, contact/social/legal links only when they exist, language access, and product identity. Never fabricate company address, registration details, or social accounts.

Possible copy territory to refine—not mandatory final copy:

- Azerbaijani hero direction: **“Uyğun iş. Uyğun insan. Bir addım yaxın.”**
- Candidate CTA direction: **“İş axtarmağa başla”**
- Employer CTA direction: **“Vakansiya yerləşdir”**

Validate all Azerbaijani phrasing against the existing locale voice. Improve it if a more natural, ownable line emerges. Provide complete English and Russian equivalents in the localization files.

## Visual and interaction system

Build a small, explicit web design system:

- Semantic CSS variables for background fields, text, brand, accent, border, focus, status, and elevation.
- A restrained color strategy rooted in AxtarIS navy and teal, with intentional page-scale color fields and excellent contrast. Do not scatter the accent in every section.
- A spacing scale, fluid containers, readable max widths, a purposeful radius system, and no arbitrary one-off values without reason.
- Distinctive display and workhorse text typography with correct Azerbaijani/Russian glyphs.
- Accessible focus states that fit the visual world.
- Buttons with clear hierarchy and complete hover/focus/pressed/disabled behavior.
- Image and device-preview treatment that feels designed rather than dropped into generic phone mockups.
- Responsive behavior designed for approximately 360, 390, 768, 1024, 1440, and wide desktop widths.

Motion requirements:

- Establish a motion grammar first: what moves, why, and how the motion expresses matching/progression.
- Use GSAP for the hero entrance, the product-specific match sequence, and a small number of section transitions.
- Use CSS transitions for simple control states.
- Keep Lenis subtle. Never fight user input, trap scrolling, or break anchor links/back navigation.
- No blanket animation of every heading and card. No arbitrary alternating slide-ins.
- Disable or simplify transforms and scrubbed timelines for reduced motion, small screens, low-power contexts, and hidden tabs where appropriate.
- Maintain 60fps on a realistic mid-range phone; animate transform/opacity, batch DOM reads/writes, and avoid oversized continuously filtered layers.

## Engineering requirements

- Keep the existing mobile application working. Do not refactor unrelated Expo or Supabase code.
- Use TypeScript strictly. Avoid `any` and suppressions.
- Keep client components as small as practical. Default to server components where appropriate.
- Use `next/font` or a comparably optimized local font strategy. No render-blocking font imports.
- Use optimized images and appropriate responsive sizing. Re-export oversized transparent logo assets for web if necessary while preserving the original files.
- Build semantic HTML with one `h1`, logical headings, landmarks, keyboard access, visible focus, meaningful alt text, and adequate touch targets.
- Target WCAG 2.2 AA contrast and interaction behavior.
- Add metadata: title, description, canonical placeholder/config, Open Graph/Twitter structure, favicon, theme color, and structured data only when truthful.
- Avoid unnecessary dependencies. Document every newly added runtime dependency.
- Ensure the page works without console errors, hydration warnings, missing assets, or broken links.
- If analytics, forms, or external URLs are not configured, create typed integration seams rather than fake implementations.
- Keep source organization clear: page sections, motion hooks, content/locales, config, and design tokens should not be tangled in one giant component.

## Required verification

Before declaring completion:

1. Install dependencies using the package manager already established for the new/existing landing app.
2. Run formatting/linting, TypeScript checks, and a production build.
3. Start the site and inspect it in the browser at both `1440×900` and `390×844`; also spot-check tablet width.
4. Test keyboard navigation, mobile menu, language switching, CTAs, anchor navigation, reduced motion, and no-JavaScript/basic content fallback where feasible.
5. Use Lighthouse or equivalent checks for accessibility, performance, SEO, and best practices. Fix material issues; do not chase vanity scores by deleting the design.
6. Run Impeccable’s mechanical detector once on the finished changed UI, then make one batched correction pass.
7. Perform one final confirmation pass and stop polishing.

## Definition of done

The result is done only when it is:

- visually distinctive enough that it could not be mistaken for a generic HR/SaaS template;
- immediately understandable to both candidates and employers;
- rooted in AxtarIS’s real product, language, logo, and interface;
- responsive and thoughtfully composed on mobile, tablet, and desktop;
- animated with purpose and safe fallbacks;
- accessible, fast, SEO-ready, and production-buildable;
- honest—no invented proof or capability;
- implemented in code, verified in a browser, and documented with exact run/build commands.

At the end, give me a concise handoff containing:

- the chosen visual thesis in one sentence;
- what you built and where;
- exact commands to run it;
- validation results;
- any deliberately unresolved external links/assets/claims requiring my input;
- a short list of changed files.

Begin now by inspecting the repository and invoking the two required design skills. Then continue through implementation and verification without waiting for approval unless you encounter a genuinely material product-truth decision.
