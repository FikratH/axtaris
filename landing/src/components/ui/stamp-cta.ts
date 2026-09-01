/**
 * The stamp-pad CTA treatment — the page's conversion stamps (hero and
 * closing) share this single definition so they cannot drift apart.
 * Radius 6px deliberately matches `.stamp`'s impression radius (globals.css),
 * not the 2px document corner: this element belongs to the stamp family.
 * The hover straightening is decorative-only by design; it conveys nothing.
 * The active state mirrors it for touch: the stamp straightens, brightens,
 * and presses 1px down as its ledge collapses (the inset ring stays).
 */
export const stampCtaClass =
  "inline-flex min-h-12 -rotate-[1.5deg] items-center justify-center gap-2 rounded-[6px] bg-carbon-600 px-7 font-[family-name:var(--font-display)] text-[1.125rem] font-bold tracking-[0.07em] text-cover-950 uppercase no-underline shadow-[inset_0_0_0_2px_var(--carbon-600),inset_0_0_0_3.5px_var(--cover-950),0_2px_0_0_var(--carbon-700)] transition-[background-color,rotate,translate,box-shadow] duration-150 hover:rotate-0 hover:bg-carbon-500 active:translate-y-px active:rotate-0 active:bg-carbon-500 active:shadow-[inset_0_0_0_2px_var(--carbon-600),inset_0_0_0_3.5px_var(--cover-950)]";
