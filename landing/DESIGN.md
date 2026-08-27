---
name: AxtarIS Landing
description: The hiring file made beautiful — a career as a document two sides complete and stamp together.
colors:
  cover-950: "#060d1f"
  cover-900: "#0a1628"
  cover-700: "#14257d"
  brand-600: "#2d4797"
  brand-500: "#3f60a8"
  brand-400: "#5c78b5"
  brand-300: "#7990c2"
  brand-200: "#9fb0d4"
  brand-100: "#c5d0e6"
  brand-50: "#e8edf5"
  carbon-800: "#006978"
  carbon-700: "#00838f"
  carbon-600: "#0097a7"
  carbon-500: "#00acc1"
  carbon-400: "#26c6da"
  carbon-300: "#4dd0e1"
  carbon-100: "#b2ebf2"
  sheet: "#fafbfc"
  sheet-shade: "#edf0f5"
  sheet-line: "#d5dae3"
  ink: "#0a1628"
  ink-soft: "#515c6b"
  ink-faint: "#8f99a8"
typography:
  display:
    fontFamily: "Alumni Sans, Arial Narrow, sans-serif"
    fontSize: "clamp(2.875rem, 2rem + 4.4vw, 6rem)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Alumni Sans, Arial Narrow, sans-serif"
    fontSize: "clamp(2.125rem, 1.6rem + 2.6vw, 3.75rem)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Commissioner, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.375
  body:
    fontFamily: "Commissioner, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.625
  body-small:
    fontFamily: "Commissioner, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Martian Mono, Courier New, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    letterSpacing: "0.14em"
  label-small:
    fontFamily: "Martian Mono, Courier New, monospace"
    fontSize: "0.625rem"
    fontWeight: 400
    letterSpacing: "0.12em"
  note:
    fontFamily: "Martian Mono, Courier New, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "0.02em"
rounded:
  sheet: "2px"
  cta: "4px"
  stamp: "6px"
spacing:
  gutter: "1rem"
  gutter-lg: "1.5rem"
  sheet-pad: "1.25rem"
  sheet-pad-lg: "1.5rem"
  sheet-pad-xl: "2rem"
  chapter-y: "4rem"
  chapter-y-lg: "6rem"
components:
  button-stamp:
    backgroundColor: "{colors.carbon-600}"
    textColor: "{colors.cover-950}"
    rounded: "{rounded.sheet}"
    padding: "0.625rem 1.5rem"
    height: "2.75rem"
  button-stamp-hover:
    backgroundColor: "{colors.carbon-500}"
  button-countersign:
    backgroundColor: "transparent"
    textColor: "{colors.brand-100}"
    rounded: "{rounded.sheet}"
    padding: "0.625rem 1.5rem"
    height: "2.75rem"
  button-countersign-on-sheet:
    textColor: "{colors.brand-600}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "currentColor"
    padding: "0.125rem 0.25rem"
  cta-stamp:
    backgroundColor: "{colors.carbon-600}"
    textColor: "{colors.cover-950}"
    typography: "{typography.title}"
    rounded: "{rounded.cta}"
    padding: "0 1.75rem"
    height: "3rem"
  doc-sheet:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    padding: "1.25rem"
  doc-sheet-carbon:
    backgroundColor: "color-mix(in srgb, #0097a7 14%, #060d1f)"
    textColor: "{colors.carbon-100}"
    rounded: "{rounded.sheet}"
    padding: "1.25rem"
  stamp:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.carbon-600}"
    rounded: "{rounded.stamp}"
    padding: "0.3em 0.75em 0.25em"
  field-row-highlight:
    backgroundColor: "rgb(0 151 167 / 0.1)"
    textColor: "{colors.carbon-800}"
  nav-bar:
    backgroundColor: "rgb(6 13 31 / 0.9)"
    height: "4rem"
  lang-chip:
    backgroundColor: "transparent"
    textColor: "{colors.brand-200}"
    height: "2.25rem"
    width: "2.75rem"
  lang-chip-active:
    backgroundColor: "{colors.carbon-600}"
    textColor: "{colors.cover-950}"
  mobile-sheet:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    padding: "1.5rem"
    width: "min(20rem, 86vw)"
---

# Design System: AxtarIS Landing

Scope: the marketing web app in `landing/` only. The Expo mobile app has its own separate incumbent design system in `src/theme/` (`colors.ts`, `typography.ts`, `spacing.ts`), which this document does not describe and has no authority over.

## Overview

**Creative North Star: "The Carbon File" (Şəxsi iş)**

A career here is a document. The site is the file that document lives in: deep-navy covers at page scale, cool typed sheets laid on them, teal carbon-copy duplicates of those sheets travelling to the other side of the hire, and a teal rubber stamp that lands when the two halves agree. Nothing in the world is borrowed from the SaaS marketing kit — there is no centered hero, no feature-card grid, no logo cloud, no badge chrome. The page is furniture from an employment office, rendered with precision instead of nostalgia.

The material vocabulary is print, and it is honest print. Paper is a 1px-ruled rectangle with a real cast shadow; a carbon copy is a translucent teal wash with a teal hairline; a stamp is a hard double ring on its own opaque chit. There is no bevel, no gloss, no paper texture image, no faux-tactile gradient. Density is high and typographic: hierarchy comes from typeface, case, weight and rule lines, never from adding a container. Two grounds carry everything — navy cover and light sheet — and the third material, teal carbon, exists to mean one specific thing.

**The One Law of Motion.** Everything travels lower-left → upper-right. Every entrance animation on the page starts down-left of its resting place (`x: -28…-150`, `y: +28…+100`) and arrives; the hero's SVG routing line draws along the same diagonal; the stamp CTA sits rotated -1.5° and straightens on hover. There is exactly one approved exception, documented under the match sequence. Motion is a scroll-linked reading aid, not decoration: under `prefers-reduced-motion` and with JavaScript off, every section renders in its full final composition with nothing hidden and nothing missing.

**Key Characteristics:**
- Two grounds, one meaning-bearing third material: navy cover, light sheet, teal carbon copy.
- Three typographic voices with strict jobs: condensed display, humanist text, monospaced document metadata.
- Ruled fields and dotted fill-in lines instead of cards, panels, or badges.
- Squared 2px corners everywhere; 4–6px only on the two stamp forms.
- Shadows belong to paper alone; dark grounds get depth from hairlines and tonal mixing.
- One diagonal law of motion, fully degradable to a static composition.
- Trilingual by construction (az / en / ru) — Azerbaijani `Əə` and Cyrillic are load-bearing glyph requirements.

## Colors

A cold two-ground palette — near-black navy and near-white paper — with a single saturated teal that carries all agreement, action, and duplication. Values live in `src/app/globals.css` as CSS custom properties and are re-exported into Tailwind v4 via `@theme inline`, so every token is available as a utility (`bg-cover-950`, `text-carbon-300`).

### Primary

- **Carbon Teal** (`#0097a7`, `carbon-600`): the file's one accent and its only fill color for action. Primary buttons, the active language chip, the stamp's ring and letterforms, matched-field highlight bars, text selection. Used sparingly on any single screen — its rarity is what makes the stamp land.
- **Stamp-Pad Deep** (`#00838f`, `carbon-700`): the hard 2px ledge shadow under every teal button, and the tint source for the employer chapter's ground.
- **Ink Teal** (`#006978`, `carbon-800`): teal that has to sit on paper — AI margin notes, the direct-contact email link, matched values inside a light sheet. The only teal with enough depth to pass as text on `sheet`.
- **Carbon Bright** (`#00acc1`, `carbon-500`) and **Carbon Light** (`#26c6da`, `carbon-400`): hover state for teal fills, and small marks on dark — route arrows, the beta dot, the caret.
- **Carbon Pale** (`#4dd0e1`, `carbon-300`) and **Carbon Wash** (`#b2ebf2`, `carbon-100`): the readable text pair inside a carbon-copy surface — pale for labels and secondary prose, wash for the values and headings.

### Neutral — the navy covers

- **File Cover Black** (`#060d1f`, `cover-950`): the page ground and the browser theme color. Every dark surface starts here.
- **Cover Shade** (`#0a1628`, `cover-900`): the one recessed navy — the desk inside the match-sequence stage.
- **Deep Blue** (`#14257d`, `cover-700`): declared in the ramp, currently unused by any component.

### Neutral — the navy ramp

- **Navy Rule** (`#2d4797`, `brand-600`): borders and text for countersign actions sitting on paper; the focus ring on light surfaces.
- **Structure Blue** (`#3f60a8`, `brand-500`): the hairline that divides the whole page. Every section separator, the nav underline, the 1px grid gaps, the scrollbar thumb, the hero routing line — nearly always at 20–40% opacity.
- **Steel Blue** (`#5c78b5`, `brand-400`): declared in the ramp, currently unused by any component.
- **Muted Blue** (`#7990c2`, `brand-300`): the quietest legible text on navy — the copyright line, secondary outline borders.
- **Cool Grey-Blue** (`#9fb0d4`, `brand-200`): body prose on navy. The workhorse reading color of the dark sections.
- **Pale Blue** (`#c5d0e6`, `brand-100`): interactive text on navy — countersign buttons, the menu trigger.
- **Paper White-Blue** (`#e8edf5`, `brand-50`): all display headings on navy, and the page's default text color.

### Neutral — the sheets

- **Typed Sheet** (`#fafbfc`, `sheet`): every paper surface. Cool and slightly blue, never cream.
- **Sheet Shade** (`#edf0f5`, `sheet-shade`): the recessed tone inside paper — the employer's chat bubble, hover fill on paper controls.
- **Sheet Rule** (`#d5dae3`, `sheet-line`): the printed rule line — paper borders, `.rule-b` dividers, chip outlines.
- **Ink** (`#0a1628`, `ink`): typed text on paper. Deliberately the same value as Cover Shade — the ink and the cover are one color seen at two scales.
- **Soft Ink** (`#515c6b`, `ink-soft`): secondary typed text, field labels, annotations.
- **Faint Ink** (`#8f99a8`, `ink-faint`): the dotted fill-in line and pipeline connectors. Effectively never used for reading text.

### Named Rules

**The Two Grounds Rule.** Every surface resolves to one of two grounds: a navy cover or a light sheet. There is no third background family and no mid-grey. If a new surface can't say which ground it is, it doesn't belong.

**The Carbon Means Employer Rule.** The teal carbon material (`.carbon`) is not a decorative variant of paper — it is the duplicate that travels to the other side of the hire. Use it for the employer's copy of a document and for the employer chapter, and nowhere else. A candidate-side surface is always white paper.

**The Stamp Monopoly Rule.** Solid `carbon-600` fill is reserved for actions and the stamp. It never appears as a section background, a decorative block, or an illustration fill. The employer chapter's tinted ground is a 12% mix, not a fill.

## Typography

**Display Font:** Alumni Sans (fallback Arial Narrow, sans-serif) — `--font-display`
**Body Font:** Commissioner (fallback system-ui, sans-serif) — `--font-text`
**Label/Mono Font:** Martian Mono (fallback Courier New, monospace) — `--font-doc`

All three load through `next/font/google` in `src/app/[[...locale]]/layout.tsx` with `latin`, `latin-ext` and `cyrillic` subsets. Every face was chosen and verified to carry Azerbaijani `Əə` and full Cyrillic; a replacement face that fails either is disqualified regardless of how it looks.

**Character:** A condensed grotesque shouting the headline, a warm neutral humanist doing the reading, and a wide monospace typing the file's own metadata. The pairing reads as an official document that someone took real care over — the display voice supplies the drama, and Martian Mono keeps insisting that this is paperwork.

### Hierarchy

- **Display** (Alumni Sans 700, `clamp(2.875rem, 2rem + 4.4vw, 6rem)`, line-height 0.95, tracking -0.01em, `text-wrap: balance`): the hero H1 only. Applied through the `.display` class plus `--text-hero`.
- **Headline** (Alumni Sans 700, `clamp(2.125rem, 1.6rem + 2.6vw, 3.75rem)`, same metrics): every chapter H2, via `.display` plus `--text-chapter`. On navy it is Paper White-Blue; inside the closing sheet it flips to Ink.
- **Title** (Commissioner 600, 1.125rem, leading-snug): feature and item H3s inside sheets and carbon copies.
- **Body** (Commissioner 400, 1.0625rem, leading-relaxed): hero sub and chapter intros. Capped at 44–54ch depending on column.
- **Body Small** (Commissioner 400, 0.9375rem, leading-relaxed): feature descriptions, field values, nav links, chat bubbles. Capped at 58ch.
- **Label** (Martian Mono, 0.6875rem, tracking 0.14em, uppercase): document headers and section-level typed labels, via `.doc-label`.
- **Label Small** (Martian Mono, 0.625rem, tracking 0.12em, uppercase): field labels, pipeline steps, language chips, sample annotations, via `.doc-label-sm`.
- **Note** (Martian Mono, 0.75rem, tracking 0.02em, line-height 1.7, sentence case): the only monospace that sets a full sentence — beta notes, statistics footnotes, the copy-confirmation status, via `.doc-note`.

A fourth scale step, `--text-head` (`clamp(1.375rem, 1.2rem + 0.9vw, 1.875rem)`), is declared but no component currently uses it.

### Named Rules

**The Three Voices Rule.** Alumni Sans speaks headings and stamps. Commissioner speaks prose and controls. Martian Mono speaks only the document's own metadata — what a form has printed on it before anyone fills it in. No voice does another's job; in particular, never set body prose in Martian Mono except through `.doc-note`, which exists precisely because that boundary needed one sanctioned crossing.

**The No Eyebrow Rule.** There is no kicker line above the H1. The display headline leads the first viewport unaccompanied, and the file's identity is established by the sheet's own printed header beside it. The `fileKicker` string exists in the dictionaries for the OpenGraph card only.

**The Tabular Column Rule.** Any numeric column carries `.tabular` (`font-variant-numeric: tabular-nums`) — the employer statistics list and the match-sequence step numbers do. Figures in a document line up.

## Layout

A single centered measure of 72rem (`max-w-6xl`) governs every section, gutters at 1rem rising to 1.5rem from 640px. Only two breakpoints are in use: `sm` (640px) and `lg` (1024px); there is no `md` tier and no custom breakpoint.

Chapters are two-column at `lg` and stacked below it, and the column ratio alternates deliberately so the page never settles into a rhythm: hero `1.05fr / 0.95fr`, candidate `0.85fr / 1.15fr` (narrative left, document right), employer `1.15fr / 0.85fr` with `order` swapped so the carbon copy reads first on mobile, AI `0.85fr / 1.15fr`, trust `0.9fr / 1.1fr`. In the three chapters with a narrow narrative column, that column is `lg:sticky lg:top-24` so the heading holds while its document scrolls.

Vertical rhythm is `py-16` per chapter rising to `py-24` at `lg` (hero runs `py-14 / py-20 / py-28`). Sheet padding steps `1.25rem → 1.5rem → 2rem` with viewport. Anchor targets clear the 4rem sticky header via `scroll-padding-top: 5.5rem` on `html`, and Lenis-routed anchors use a matching -80px offset.

Sections are divided by a single hairline, `border-t` in Structure Blue at 25% — the employer chapter is the one exception, separated in Carbon Teal at 40% because the material changes there. Where a group of peer items needs division, the page uses a **1px gap grid** rather than borders on each child: the container takes `gap-px` plus the divider color as its background and each child paints its own ground over it (match steps use Structure Blue over Cover Black; the closing store rows use Sheet Rule over Typed Sheet).

Line length is capped explicitly and often: 36ch for the footer tagline, 44ch for chapter intros, 46ch for the hero sub, 52ch for trust descriptions, 54ch for the closing intro, 58ch for feature body.

## Elevation & Depth

The system is flat on dark and lifted on light. Navy grounds and carbon copies never take a shadow; depth there comes from hairlines, tonal mixing (`color-mix` into the cover), and overlap. Paper is the only material with weight, and it casts a real, cool, navy-tinted shadow — the shadow is derived from Cover Black, never from neutral black, so a sheet always reads as lying on this file rather than floating in a generic UI.

### Shadow Vocabulary

- **Sheet at rest** (`box-shadow: 0 1px 2px rgb(6 13 31 / 0.18), 0 12px 28px -10px rgb(6 13 31 / 0.45)`, `--shadow-sheet`): every `.paper` surface. A tight contact shadow plus a wide soft cast.
- **Sheet lifted** (`box-shadow: 0 2px 4px rgb(6 13 31 / 0.2), 0 22px 44px -14px rgb(6 13 31 / 0.55)`, `--shadow-sheet-lift`): the two sheets that are meant to sit above the composition — the hero's candidate sheet and the match sequence's conversation sheet.
- **Button ledge** (`box-shadow: 0 2px 0 0 var(--carbon-700)`): a hard, un-blurred 2px edge under every teal button. It is a printed ledge, not a glow, and it collapses to `none` on `:active` while the button translates 1px down.
- **Stamp ring** (`box-shadow: inset 0 0 0 2px var(--sheet), inset 0 0 0 3.5px var(--carbon-600)`): purely inset. Combined with the 3px outer border it produces the stamp's crisp double ring; the primary stamp CTA uses the same construction with the navy cover as the inner gap color.

### Named Rules

**The Paper Casts, Chrome Doesn't Rule.** Only `.paper` gets a box-shadow. Navy surfaces, carbon copies, the nav bar, and every button except the teal ledge are shadowless. If a dark element needs to separate from its ground, give it a hairline or a tonal mix, not elevation.

**The Opaque Stamp Rule.** The stamp is drawn on its own opaque `sheet` chit with no blend mode, precisely so it reads identically over navy, over paper, and over a carbon copy. Never reach for `mix-blend-mode` to make a stamp sit into its background — the moment it depends on what's underneath, it stops being a stamp.

## Shapes

Corners are squared to the point of being a rule: **2px** on every sheet, carbon copy, button, chat bubble, chip, and focus ring. The two stamp forms are the only exceptions — the stamp chit at 6px and the primary stamp CTA at 4px — and they earn it by being physical objects rather than surfaces. Nothing on the page is pill-shaped. The only true circles are the 6px beta indicator dot in the hero and the punched dots of the perforated edge.

Rotation is a shape property here, always slight and always fixed: the stamp sits at -5°, the hero's candidate sheet at -1.25° with its carbon copy at +1.5°, and the primary stamp CTA at -1.5° straightening to 0° on hover. Nothing rotates past 5°.

Lines carry the form language. `.rule-b` is a solid 1px Sheet Rule under a row — the printed ruling of a form. `.fill-line` is a 1px **dotted** Faint Ink underline — the blank a value was written into, and it stays visible under filled values so the field always reads as a field. `.perf-x` punches a repeating 16px radial-gradient scallop along a top edge for the tear-off effect used once, on the closing sheet.

### Named Rules

**The Squared Corner Rule.** 2px, or it isn't part of this system. Reaching for 8px, 12px, or `rounded-full` imports the app-chip language the world exists to refuse.

**The Never-A-Card Rule.** Related items are separated by a rule line or a 1px gap grid, never by wrapping each one in its own bordered container. A `.paper` sheet is a document, and a document holds many ruled rows — it is not a card, and there is never a grid of them.

## Components

### Buttons

`src/components/ui/button.tsx` is a shadcn-pattern `cva` button restyled to the world, exposing `Button` and `ButtonLink` (for real `mailto:`/route links) across three variants. Baseline for all three: `min-h-11` (44px), 2px corners, Commissioner 600 at 0.9375rem, a 150ms `ease-out` transition over color/transform/shadow, `active:translate-y-px`, and 45% opacity when disabled.

- **Shape:** squared (2px).
- **Stamp (primary):** solid Carbon Teal on Cover Black text, with the hard `carbon-700` ledge. Hover brightens the fill to Carbon Bright; `:active` drops the ledge as the button presses down.
- **Countersign (secondary):** transparent with a `border-current` outline in Pale Blue — a ruled line awaiting a signature. Hover washes 10% Paper White-Blue. Carries `data-[on=sheet]` which reflows the whole variant to Navy Rule for use on paper.
- **Quiet (tertiary):** an inline typed action — no min-height, underlined at 40% of its own color, brightening to full on hover.

Several sections render the stamp-button shape inline rather than importing `Button`, because they need to be an `AnchorLink` (Lenis-routed) or carry chapter-specific color. Any new inline instance must keep the ledge shadow, the 2px corner, and the Cover Black text.

### Signature CTA (signature component)

`src/components/SignatureCta.tsx` is the page's terminal action and the physical high point of the world: Alumni Sans 700 uppercase at 1.125rem, tracking 0.07em, Cover Black on Carbon Teal, 3rem tall, 4px corners, rotated -1.5°, carrying both the inset double stamp-ring and the ledge shadow. Hover straightens it to 0° and brightens the fill. The hero's primary CTA is the same object at 1.1875rem.

Its non-primary sibling is a plain Navy Rule outline with a `MoveUpRight` diagonal arrow. Both keep a real `mailto:` navigation and additionally copy the address to the clipboard, confirming in a `role="status"` `.doc-note` line that reserves its own height so nothing shifts when the confirmation appears.

### Document primitives

`src/components/doc/primitives.tsx` holds the reusable grammar. Each takes a `tone` of `"ink"` (on paper) or `"carbon"` (on a carbon copy) where the distinction applies.

- **DocSheet** — a `.paper` rectangle at `p-5 sm:p-6`. The default container for anything the page presents as a document.
- **DocHeader** — the typed header row: `.doc-label` bold title left, `.doc-label-sm` annotation right, over a solid rule at 60% Ink or 60% Carbon Pale. This is where the sample annotation lives.
- **FieldRow** — one ruled field: a `6.5rem/7.5rem` monospace label column beside a `.fill-line` value, baseline-aligned. Its `highlight` flag washes the row in 10% Carbon Teal and shifts the value to Ink Teal — this is how a matched field is marked.
- **Stamp** — the rubber stamp, `clamp(1.25rem, 1rem + 1.2vw, 1.875rem)` by default. Rendered inline; parents supply any animation.
- **PipelineRow** — a horizontal row of monospace state chips joined by 1rem–1.5rem hairline connectors, with one `activeIndex` chip outlined and washed in teal. The ruled checkbox row of a form.
- **RouteMark** — a `MoveUpRight` arrow in Carbon Light, the canonical marker of the one law's direction. Currently exported but not consumed by any section; the sections that need a diagonal arrow inline `MoveUpRight` themselves.

### Navigation

A sticky 4rem header on 90%-opacity Cover Black with a small backdrop blur and a Structure Blue hairline beneath. The wordmark is `/brand/wordmark-dark.png` at 26px tall (24px in the footer), placed directly on the navy with **no backing plate** — the asset is recolored for dark grounds, so a plate would be a defect, not a fix (user-pinned).

Desktop links are Commissioner 500 at 0.9375rem in Cool Grey-Blue, brightening to Paper White-Blue, with a teal stamp button for the join action at the right. Below `lg` the links collapse into a `size-11` menu trigger. The language switch is a bordered strip of monospace two-letter chips (`min-h-9`, `min-w-11`), the current locale filled solid teal and marked `aria-current`; the shared `LangSwitch` serves the header and the mobile sheet (where its borders shift to Sheet Rule), and the footer repeats the same pattern inline as individually bordered chips at `min-w-10`. Secondary text links in the nav strip and footer sit at 36px rather than the 44px used for real controls.

### Mobile sheet

`src/components/ui/sheet.tsx` is a shadcn-pattern Radix Dialog restyled as a paper file pulled from the drawer: a `.paper` panel `min(20rem, 86vw)` wide sliding in from the right over a 70% Cover Black scrim with a 2px blur. Entry is CSS keyframes (`sheet-in` at 260ms on a `cubic-bezier(0.22, 1, 0.36, 1)`, `sheet-fade` at 200ms), both nulled by `motion-reduce:animate-none`. Its links are `.rule-b` rows in Ink, so the menu reads as a ruled index page.

### Match sequence (signature component)

`src/components/sections/MatchSequence.tsx` is the page's memorable moment. On a Cover Shade desk bounded by a Structure Blue hairline, a candidate `.paper` sheet on the left and an employer `.carbon` copy on the right converge, three field pairs light up in sequence, the teal stamp lands, and a conversation sheet rises beneath them.

At `lg` and above the stage pins (`start: "top 12%"`, `end: "+=1500"`, `scrub: 0.6`, `anticipatePin: 1`) and the whole sequence is scrubbed by scroll: the candidate sheet travels from `x: -150, y: 100, rotate: -3.5°` to `rotate: -1°`, the employer form counter-travels from `x: 150, y: -80, rotate: 3.5°` to `rotate: 1°` to meet it, then each pair's highlight bar and its connector mark fade in, then the stamp arrives on `back.out(1.6)` from `scale: 2.4, rotate: -16°` to `scale: 1, rotate: -5°`, and the conversation sheet rises 70px into place. Below `lg` there is no pin and no scrub — each element gets one light `expo.out` arrival on the diagonal as it enters view.

Two arrangements here are pinned by the user against the general rules, both approved on the rendered result:

- The desktop stamp is fixed dead center of the stage at `text-[2.75rem]` and may overlap two vacancy label cells. Its size and centering are the point; do not shrink it or move it aside to clear the labels.
- The connector marks between matched rows point **right** (`MoveRight`), not up-right. This is the one sanctioned exception to the one law of motion: these marks describe a row-to-row mapping between two documents side by side, and a diagonal would misdescribe the relationship.

### Product previews

Every reproduction of product UI — the hero sheet, both match-sequence documents, the CV sheet in the AI chapter, the conversation sheet — carries a sample annotation in its `DocHeader`: **NÜMUNƏ** / **SAMPLE** / **ОБРАЗЕЦ**. The app is not publicly distributed, these are illustrations built from real product copy, and the label is what keeps them honest.

## Do's and Don'ts

### Do:

- **Do** put every new surface on one of the two grounds — a navy cover or a light `.paper` sheet — and use `.carbon` only when the thing genuinely is the employer's duplicate.
- **Do** compose from the document primitives (`DocSheet`, `DocHeader`, `FieldRow`, `PipelineRow`, `Stamp`) before writing new layout. If a new pattern is worth having, add it to `primitives.tsx` in the same grammar.
- **Do** keep corners at 2px, and reserve 4px and 6px for the two stamp forms.
- **Do** start every new entrance animation down-left of its resting place and travel up-right, and make it degrade to the composed final state under `prefers-reduced-motion` and with no JavaScript.
- **Do** label every reproduction of product UI as a sample in its document header (NÜMUNƏ / SAMPLE / ОБРАЗЕЦ).
- **Do** verify any new typeface renders Azerbaijani `Əə` and Cyrillic before adopting it, and add all three locale strings whenever you add copy.
- **Do** route new external URLs through `src/config/site.ts` as typed nullable seams, and render an honest "coming soon" state while the value is `null`.
- **Do** keep `info@axtaris.app` as the only contact anywhere on the page.
- **Do** hold the 44px minimum on anything that is a real control, and give sheet-mounted focusable elements the Navy Rule focus ring (`.paper` and `.paper-flat` already flip it).

### Don't:

- **Don't** build a card, a card grid, or a badge. Separate related items with `.rule-b` or a 1px gap grid.
- **Don't** add an eyebrow or kicker above a headline.
- **Don't** put a shadow on a navy surface or a carbon copy, and don't put a backing plate behind the wordmark.
- **Don't** use solid Carbon Teal as a background for anything that isn't an action or a stamp; the employer chapter's ground is a 12% mix for exactly this reason.
- **Don't** set body prose in Martian Mono outside `.doc-note`.
- **Don't** put pricing on this page (decision 2026-08-27), and don't invent proof of any kind — no fabricated logos, counts, testimonials, ratings, or press mentions.
- **Don't** ship a store link, social account, or company legal identity that doesn't exist yet; leave the seam `null` and let the UI say so.
- **Don't** reintroduce `scroll-behavior: smooth` (see Implementation Notes).

## Implementation Notes

Mechanical traps that have already cost time once. These are build constraints, not style guidance.

- **Tailwind arbitrary values cannot contain literal spaces.** Use underscores: `bg-[color-mix(in_srgb,var(--carbon-700)_12%,var(--cover-950))]`, `shadow-[inset_0_0_0_2px_var(--carbon-600)]`. A space silently breaks the class.
- **GSAP writes `translate: none` inline on the elements it animates.** Any CSS translate offset applied to a GSAP target will be wiped at animation start. Put positioning on a wrapper and let GSAP own the inner element — the match-sequence stamp does exactly this, with the centering transform on the outer div and `data-seq-stamp` on the child.
- **`scroll-behavior: smooth` must stay off.** It fights Lenis and breaks ScrollTrigger's scroll restoration on refresh. Lenis (`src/components/motion/MotionProvider.tsx`) provides smoothing on fine-pointer devices only; touch keeps native scrolling, and reduced-motion disables Lenis and GSAP entirely. In-page anchors go through `AnchorLink`, which routes to `lenis.scrollTo` when Lenis is live and falls back to native otherwise.
- **`.perf-x` hardcodes `var(--cover-950)` as its punch-out color.** The perforation only reads correctly on a Cover Black ground. On any other ground it needs a variant.
- **Declared but currently unused:** the `cover-700` and `brand-400` ramp steps, the `--text-head` scale step, the `.paper-flat` material, and the `RouteMark` primitive. They are live tokens available to Tailwind and to new work; nothing in the built page consumes them today.
