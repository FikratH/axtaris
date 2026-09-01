import { LegalShell } from "@/components/legal/LegalShell";
import { loadLegalDocument, type LegalSlug } from "@/lib/legal";
import { legalUi } from "@/content/legal-ui";
import type { Locale } from "@/content";

/**
 * One hosted legal document: markdown loaded at build time (SSG), rendered
 * into the `.legal-doc` reading surface. RU pages for the two B2B documents
 * serve the EN master and say so.
 */
export function LegalDocPage({
  locale,
  slug,
}: {
  locale: Locale;
  slug: LegalSlug;
}) {
  const ui = legalUi[locale];
  const doc = loadLegalDocument(slug, locale);

  return (
    <LegalShell locale={locale} slug={slug}>
      {doc.isEnFallback ? (
        <p className="doc-note mb-6 border-b border-sheet-line pb-4 text-ink-soft">
          {ui.enOnlyNote}
        </p>
      ) : null}
      <div
        lang={doc.contentLocale}
        className="legal-doc"
        dangerouslySetInnerHTML={{ __html: doc.html }}
      />
    </LegalShell>
  );
}
