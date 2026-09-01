import Image from "next/image";
import { SECTION_IDS } from "@/lib/anchors";
import { legalPath } from "@/lib/legal";
import { site } from "@/config/site";
import { localePath, locales, type Dictionary, type Locale } from "@/content";
import { cn } from "@/lib/utils";

export function Footer({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const navLinks = [
    { href: `#${SECTION_IDS.how}`, label: dict.nav.how },
    { href: `#${SECTION_IDS.candidates}`, label: dict.nav.candidates },
    { href: `#${SECTION_IDS.employers}`, label: dict.nav.employers },
    { href: `#${SECTION_IDS.join}`, label: dict.nav.join },
  ];

  return (
    <footer className="border-t border-brand-500/25">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:py-16">
        <div>
          <span className="inline-flex items-center py-1.5">
            <Image
              src="/brand/wordmark-dark.png"
              alt="AxtarIS"
              width={730}
              height={183}
              className="h-[24px] w-auto"
            />
          </span>
          <p className="mt-4 max-w-[36ch] text-[0.9375rem] leading-relaxed text-brand-200">
            {dict.footer.tagline}
          </p>
        </div>

        <nav aria-label={dict.footer.navLabel}>
          <p className="doc-label-sm mb-3 text-carbon-300">
            {dict.footer.navLabel}
          </p>
          <ul className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="inline-flex min-h-9 items-center text-[0.9375rem] text-brand-200 no-underline transition-colors hover:text-brand-50"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="doc-label-sm mb-3 text-carbon-300">
            {dict.footer.contactLabel}
          </p>
          <a
            href={`mailto:${site.supportEmail}`}
            className="inline-flex min-h-9 items-center text-[0.9375rem] text-brand-200 underline decoration-brand-500 underline-offset-4 transition-colors hover:text-brand-50"
          >
            {site.supportEmail}
          </a>
          <p className="doc-label-sm mt-6 mb-3 text-carbon-300">
            {dict.footer.langLabel}
          </p>
          <ul className="flex items-center gap-1">
            {locales.map((l) => (
              <li key={l}>
                <a
                  href={localePath(l)}
                  hrefLang={l}
                  aria-current={l === locale ? "true" : undefined}
                  className={cn(
                    "doc-label-sm flex min-h-9 min-w-10 items-center justify-center border px-2 no-underline transition-colors",
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
        </div>
      </div>
      <div className="border-t border-brand-500/20">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2 sm:px-6">
          <p className="doc-label-sm py-3 text-brand-300">
            {dict.footer.copyright}
          </p>
          <ul className="flex flex-wrap items-center gap-x-5">
            <li>
              <a
                href={legalPath(locale, "privacy")}
                className="doc-label-sm inline-flex min-h-9 items-center text-brand-300 no-underline transition-colors hover:text-brand-50"
              >
                {dict.footer.legalPrivacy}
              </a>
            </li>
            <li>
              <a
                href={legalPath(locale, "terms")}
                className="doc-label-sm inline-flex min-h-9 items-center text-brand-300 no-underline transition-colors hover:text-brand-50"
              >
                {dict.footer.legalTerms}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
