import { az } from "./az";
import { en } from "./en";
import { ru } from "./ru";
import type { Dictionary, Locale } from "./types";

export { defaultLocale, locales } from "./types";
export type { Dictionary, DocField, Locale } from "./types";

const dictionaries: Record<Locale, Dictionary> = { az, en, ru };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Path prefix for a locale: az lives at the root. */
export function localePath(locale: Locale): string {
  return locale === "az" ? "/" : `/${locale}`;
}

export function isLocale(value: string): value is Locale {
  return value === "az" || value === "en" || value === "ru";
}
