import { LegalShell } from "@/components/legal/LegalShell";
import { legalPath, LEGAL_SLUGS } from "@/lib/legal";
import { legalUi, type LegalPageSlug } from "@/content/legal-ui";
import type { Locale } from "@/content";

/** Which documents have no translation in this locale (served in EN). */
const EN_ONLY_FOR_RU: LegalPageSlug[] = ["subscriptions", "employer-terms"];

/** The legal index: a ruled list of the file's official documents. */
export function LegalIndexPage({ locale }: { locale: Locale }) {
  const ui = legalUi[locale];
  const slugs: LegalPageSlug[] = [...LEGAL_SLUGS, "delete-account"];

  return (
    <LegalShell locale={locale}>
      <h1 className="display text-[length:var(--text-chapter)] text-ink">
        {ui.indexTitle}
      </h1>
      <p className="mt-3 max-w-[54ch] text-[0.9375rem] leading-relaxed text-ink-soft">
        {ui.indexIntro}
      </p>
      <ul className="mt-8 flex flex-col">
        {slugs.map((slug) => (
          <li key={slug} className="rule-b">
            <a
              href={legalPath(locale, slug)}
              className="flex min-h-12 items-center justify-between gap-4 py-3 no-underline"
            >
              <span className="text-[1.0625rem] leading-snug font-medium text-ink underline decoration-sheet-line underline-offset-4 hover:decoration-carbon-800">
                {ui.docLabels[slug]}
              </span>
              {locale === "ru" && EN_ONLY_FOR_RU.includes(slug) ? (
                <span className="doc-label-sm shrink-0 border border-sheet-line px-1.5 py-0.5 text-ink-soft">
                  EN
                </span>
              ) : null}
            </a>
          </li>
        ))}
      </ul>
    </LegalShell>
  );
}
