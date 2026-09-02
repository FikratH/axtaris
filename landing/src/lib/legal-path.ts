import { localePath, type Locale } from "@/content";

/**
 * Split out from lib/legal.ts (which imports node:fs for build-time markdown
 * loading) so client components can build a legal URL without pulling a
 * Node-only module into the browser bundle.
 */

/** /legal/terms · /en/legal/terms · /ru/legal — locale-aware legal URLs. */
export function legalPath(locale: Locale, slug?: string): string {
  const prefix = locale === "az" ? "" : localePath(locale);
  return `${prefix}/legal${slug ? `/${slug}` : ""}`;
}
