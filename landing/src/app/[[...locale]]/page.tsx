import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPage } from "@/components/LandingPage";
import { DeleteAccountPage } from "@/components/legal/DeleteAccountPage";
import { LegalDocPage } from "@/components/legal/LegalDocPage";
import { LegalIndexPage } from "@/components/legal/LegalIndexPage";
import {
  isLegalSlug,
  LEGAL_PAGE_SLUGS,
  legalPath,
  type LegalSlug,
} from "@/lib/legal";
import { legalUi, type LegalPageSlug } from "@/content/legal-ui";
import { defaultLocale, isLocale, locales, type Locale } from "@/content";

type Parsed =
  | { kind: "landing"; locale: Locale }
  | { kind: "legal-index"; locale: Locale }
  | { kind: "legal-doc"; locale: Locale; slug: LegalSlug }
  | { kind: "delete-account"; locale: Locale };

/** URL shapes: / · /en · /legal · /en/legal/terms — az lives at the root. */
function parseSegments(segments: string[] | undefined): Parsed | null {
  let rest = segments ?? [];
  let locale: Locale = defaultLocale;
  if (rest.length > 0 && isLocale(rest[0])) {
    if (rest[0] === defaultLocale) return null;
    locale = rest[0];
    rest = rest.slice(1);
  }
  if (rest.length === 0) return { kind: "landing", locale };
  if (rest[0] !== "legal") return null;
  if (rest.length === 1) return { kind: "legal-index", locale };
  if (rest.length === 2) {
    if (rest[1] === "delete-account") return { kind: "delete-account", locale };
    if (isLegalSlug(rest[1]))
      return { kind: "legal-doc", locale, slug: rest[1] };
  }
  return null;
}

export function generateStaticParams(): { locale: string[] }[] {
  const params: { locale: string[] }[] = [];
  for (const locale of locales) {
    const prefix = locale === defaultLocale ? [] : [locale];
    params.push({ locale: prefix });
    params.push({ locale: [...prefix, "legal"] });
    for (const slug of LEGAL_PAGE_SLUGS) {
      params.push({ locale: [...prefix, "legal", slug] });
    }
  }
  return params;
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string[] }>;
}): Promise<Metadata> {
  const parsed = parseSegments((await params).locale);
  // The landing page keeps the layout's metadata untouched.
  if (!parsed || parsed.kind === "landing") return {};

  const { locale } = parsed;
  const ui = legalUi[locale];
  const slug: LegalPageSlug | undefined =
    parsed.kind === "legal-doc"
      ? parsed.slug
      : parsed.kind === "delete-account"
        ? "delete-account"
        : undefined;
  const title = slug ? ui.docLabels[slug] : ui.indexTitle;

  return {
    title: `${title} — AxtarIS`,
    description: ui.metaDescription,
    alternates: {
      canonical: legalPath(locale, slug),
      languages: {
        az: legalPath("az", slug),
        en: legalPath("en", slug),
        ru: legalPath("ru", slug),
        "x-default": legalPath("az", slug),
      },
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale?: string[] }>;
}) {
  const parsed = parseSegments((await params).locale);
  if (!parsed) notFound();

  switch (parsed.kind) {
    case "landing":
      return <LandingPage locale={parsed.locale} />;
    case "legal-index":
      return <LegalIndexPage locale={parsed.locale} />;
    case "legal-doc":
      return <LegalDocPage locale={parsed.locale} slug={parsed.slug} />;
    case "delete-account":
      return <DeleteAccountPage locale={parsed.locale} />;
  }
}
