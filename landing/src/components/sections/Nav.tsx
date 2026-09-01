"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu } from "lucide-react";
import { AnchorLink } from "@/components/AnchorLink";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SECTION_IDS } from "@/lib/anchors";
import { localePath, locales, type Dictionary, type Locale } from "@/content";
import { cn } from "@/lib/utils";

function LangSwitch({
  current,
  label,
  onSheet = false,
}: {
  current: Locale;
  label: string;
  onSheet?: boolean;
}) {
  return (
    <nav aria-label={label}>
      <ul
        className={cn(
          "flex items-center gap-0.5 border",
          onSheet ? "border-sheet-line" : "border-brand-500/40",
        )}
      >
        {locales.map((locale) => (
          <li key={locale}>
            <a
              href={localePath(locale)}
              hrefLang={locale}
              aria-current={locale === current ? "true" : undefined}
              className={cn(
                "doc-label-sm flex min-h-11 min-w-11 items-center justify-center px-2 transition-colors",
                locale === current
                  ? "bg-carbon-600 font-bold text-cover-950"
                  : onSheet
                    ? "text-ink-soft hover:bg-sheet-shade hover:text-ink"
                    : "text-brand-200 hover:bg-brand-50/10 hover:text-brand-50",
              )}
            >
              {locale.toUpperCase()}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Nav({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const [open, setOpen] = useState(false);

  const links = [
    { href: `#${SECTION_IDS.how}`, label: dict.nav.how },
    { href: `#${SECTION_IDS.candidates}`, label: dict.nav.candidates },
    { href: `#${SECTION_IDS.employers}`, label: dict.nav.employers },
  ];

  // Below lg the backdrop blur is dropped for scroll performance;
  // a nearly opaque cover carries the separation instead.
  return (
    <header className="sticky top-0 z-30 border-b border-brand-500/25 bg-cover-950/95 lg:bg-cover-950/90 lg:backdrop-blur-sm">
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
            priority
            className="h-[26px] w-auto"
          />
        </a>

        <nav
          aria-label={dict.a11y.mainNav}
          className="hidden items-center gap-1 lg:flex"
        >
          {links.map((link) => (
            <AnchorLink
              key={link.href}
              href={link.href}
              className="flex min-h-11 items-center px-3 text-[0.9375rem] font-medium text-brand-200 no-underline transition-colors hover:text-brand-50"
            >
              {link.label}
            </AnchorLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LangSwitch current={locale} label={dict.a11y.langSwitch} />
          <AnchorLink
            href={`#${SECTION_IDS.join}`}
            className="flex min-h-11 items-center rounded-[2px] bg-carbon-600 px-5 text-[0.9375rem] font-semibold text-cover-950 no-underline shadow-[0_2px_0_0_var(--carbon-700)] transition-[background-color,translate,box-shadow] duration-150 hover:bg-carbon-500 active:translate-y-px active:bg-carbon-500 active:shadow-none"
          >
            {dict.nav.join}
          </AnchorLink>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            aria-label={dict.a11y.openMenu}
            className="flex size-11 cursor-pointer items-center justify-center rounded-[2px] text-brand-100 transition-colors hover:bg-brand-50/10 lg:hidden"
          >
            <Menu className="size-6" strokeWidth={1.75} aria-hidden />
          </SheetTrigger>
          <SheetContent closeLabel={dict.a11y.closeMenu}>
            <SheetTitle className="doc-label mb-4 text-ink-soft">
              AxtarIS
            </SheetTitle>
            <nav aria-label={dict.a11y.mainNav} className="flex flex-col">
              {links.map((link) => (
                <AnchorLink
                  key={link.href}
                  href={link.href}
                  onNavigate={() => setOpen(false)}
                  className="rule-b flex min-h-12 items-center text-[1.0625rem] font-medium text-ink no-underline transition-colors hover:text-brand-600"
                >
                  {link.label}
                </AnchorLink>
              ))}
              <AnchorLink
                href={`#${SECTION_IDS.join}`}
                onNavigate={() => setOpen(false)}
                className="mt-6 flex min-h-12 items-center justify-center rounded-[2px] bg-carbon-600 px-5 font-semibold text-cover-950 no-underline shadow-[0_2px_0_0_var(--carbon-700)] transition-[background-color,translate,box-shadow] duration-150 hover:bg-carbon-500 active:translate-y-px active:bg-carbon-500 active:shadow-none"
              >
                {dict.nav.join}
              </AnchorLink>
            </nav>
            <div className="mt-8">
              <p className="doc-label-sm mb-2 text-ink-soft">
                {dict.footer.langLabel}
              </p>
              <LangSwitch
                current={locale}
                label={dict.a11y.langSwitch}
                onSheet
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
