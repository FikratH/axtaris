import Image from "next/image";
import { DocHeader, DocSheet } from "@/components/doc/primitives";
import { legalPath } from "@/lib/legal";
import { legalUi, type LegalPageSlug } from "@/content/legal-ui";
import { getDictionary, localePath, locales, type Locale } from "@/content";
import { cn } from "@/lib/utils";

/**
 * The frame every legal page shares: a plain document pulled from the file —
 * wordmark header, one paper sheet, a quiet closing strip. Fully static;
 * no motion, no client code.
 */
export function LegalShell({
  locale,
  slug,
  children,
}: {
  locale: Locale;
  /** current page slug (undefined on the index) — keeps lang chips on-page */
  slug?: LegalPageSlug;
  children: React.ReactNode;
}) {
  const dict = getDictionary(locale);
  const ui = legalUi[locale];

  return (
    <>
      <header className="border-b border-brand-500/25 bg-cover-950">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <a
            href={localePath(locale)}
            className="flex items-center py-1.5"
            aria-label="AxtarIS"
          >
            <Image
              src="/brand/wordmark-dark.png"
              alt="AxtarIS"
              width={730}
              height={183}
              className="h-[24px] w-auto"
            />
          </a>
          <nav aria-label={dict.a11y.langSwitch}>
            <ul className="flex items-center gap-1">
              {locales.map((l) => (
                <li key={l}>
                  <a
                    href={legalPath(l, slug)}
                    hrefLang={l}
                    aria-current={l === locale ? "true" : undefined}
                    className={cn(
                      "doc-label-sm flex min-h-11 min-w-11 items-center justify-center border px-2 no-underline transition-colors",
                      l === locale
                        ? "border-carbon-600 bg-carbon-600 font-bold text-cover-950"
                        : "border-brand-500/40 text-brand-200 hover:bg-brand-50/10 hover:text-brand-50",
                    )}
                  >
                    {l.toUpperCase()}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main id="main">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
          <DocSheet className="mx-auto max-w-3xl p-6 sm:p-10">
            <DocHeader title={ui.headerLabel} annotation="axtaris.app" />
            {children}
            {slug ? (
              <p className="mt-10 border-t border-sheet-line pt-5">
                <a
                  href={legalPath(locale)}
                  className="doc-label-sm text-carbon-800 underline decoration-carbon-800/40 underline-offset-4 hover:decoration-carbon-800"
                >
                  {ui.backToIndex}
                </a>
              </p>
            ) : null}
          </DocSheet>
        </div>
      </main>

      <footer className="border-t border-brand-500/20">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-3 sm:px-6">
          <p className="doc-label-sm py-2 text-brand-300">
            {dict.footer.copyright}
          </p>
          <a
            href={localePath(locale)}
            className="doc-label-sm inline-flex min-h-9 items-center text-brand-300 no-underline transition-colors hover:text-brand-50"
          >
            axtaris.app
          </a>
        </div>
      </footer>
    </>
  );
}
