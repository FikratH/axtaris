import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";
import { localePath, type Locale } from "@/content";

/**
 * Build-time loader for the hosted legal documents.
 *
 * Source of truth is docs/legal at the repo root; scripts/sync-legal.mjs
 * mirrors it into src/content/legal (committed) so Vercel builds rooted at
 * landing/ never reach outside their own directory. All legal routes are
 * SSG (dynamicParams=false), so fs access happens at build time only.
 */

export const LEGAL_SLUGS = [
  "terms",
  "privacy",
  "community",
  "subscriptions",
  "employer-terms",
] as const;

export type LegalSlug = (typeof LEGAL_SLUGS)[number];

/** delete-account is authored in TSX, not markdown, but shares the URL space. */
export const LEGAL_PAGE_SLUGS = [...LEGAL_SLUGS, "delete-account"] as const;

export function isLegalSlug(value: string): value is LegalSlug {
  return (LEGAL_SLUGS as readonly string[]).includes(value);
}

/** Markdown file per slug per locale; null = no translation (falls back to EN). */
const FILE_MAP: Record<
  LegalSlug,
  { en: string; az: string; ru: string | null }
> = {
  terms: {
    en: "en/terms-of-service.md",
    az: "az/istifade-sertleri.md",
    ru: "ru/usloviya-ispolzovaniya.md",
  },
  privacy: {
    en: "en/privacy-policy.md",
    az: "az/mexfilik-siyaseti.md",
    ru: "ru/politika-konfidencialnosti.md",
  },
  community: {
    en: "en/community-guidelines.md",
    az: "az/icma-qaydalari.md",
    ru: "ru/pravila-soobshchestva.md",
  },
  // The two B2B documents ship in EN/AZ only; RU pages serve the EN master.
  subscriptions: {
    en: "en/subscription-refund-terms.md",
    az: "az/abunelik-ve-geri-odenis.md",
    ru: null,
  },
  "employer-terms": {
    en: "en/employer-terms.md",
    az: "az/isegoturen-sertleri.md",
    ru: null,
  },
};

/**
 * The one sanctioned placeholder transform: the effective-date bracket
 * renders as "to be announced" in the document's own language. Every other
 * bracketed placeholder stays verbatim until the operator fills it upstream.
 */
const EFFECTIVE_DATE_TOKENS: [string, string][] = [
  ["[EFFECTIVE DATE]", "to be announced"],
  ["[QÜVVƏYƏ MİNMƏ TARİXİ]", "dərc ediləcək"],
  ["[ДАТА ВСТУПЛЕНИЯ В СИЛУ]", "будет объявлена"],
];

/**
 * cwd is landing/ both locally (`npm run build` there) and on Vercel
 * (root directory = landing); the second candidate covers a build run from
 * the repo root. Paths stay statically scoped so Turbopack's file tracing
 * only pulls in src/content/legal, not the whole project.
 */
function readLegalFile(relative: string): string {
  try {
    return fs.readFileSync(
      path.join(process.cwd(), "src", "content", "legal", relative),
      "utf8",
    );
  } catch {
    return fs.readFileSync(
      path.join(process.cwd(), "landing", "src", "content", "legal", relative),
      "utf8",
    );
  }
}

export interface LegalDocument {
  /** Rendered HTML for the document body. */
  html: string;
  /** True when a RU page serves the EN master (B2B docs). */
  isEnFallback: boolean;
  /** The language the served document is actually written in. */
  contentLocale: Locale;
}

export function loadLegalDocument(
  slug: LegalSlug,
  locale: Locale,
): LegalDocument {
  const localized = FILE_MAP[slug][locale];
  const file = localized ?? FILE_MAP[slug].en;
  const isEnFallback = localized === null;

  let markdown = readLegalFile(file);
  // Strip the operator checklist comment — it is internal, not content.
  markdown = markdown.replace(/^\s*<!--[\s\S]*?-->\s*/, "");
  for (const [token, replacement] of EFFECTIVE_DATE_TOKENS) {
    markdown = markdown.split(token).join(replacement);
  }

  const html = marked.parse(markdown, { async: false });
  return {
    html,
    isEnFallback,
    contentLocale: isEnFallback ? "en" : locale,
  };
}

/** /legal/terms · /en/legal/terms · /ru/legal — locale-aware legal URLs. */
export function legalPath(locale: Locale, slug?: string): string {
  const prefix = locale === "az" ? "" : localePath(locale);
  return `${prefix}/legal${slug ? `/${slug}` : ""}`;
}
