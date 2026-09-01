import { LegalShell } from "@/components/legal/LegalShell";
import { legalPath } from "@/lib/legal";
import { legalUi } from "@/content/legal-ui";
import { site } from "@/config/site";
import type { Locale } from "@/content";

/**
 * The public account-deletion page (Google Play Data Safety requirement):
 * how deletion works in the app and by email, what is deleted, and the
 * 30-day handling window. Static, trilingual, in the document grammar.
 */
export function DeleteAccountPage({ locale }: { locale: Locale }) {
  const ui = legalUi[locale];
  const copy = ui.deleteAccount;

  return (
    <LegalShell locale={locale} slug="delete-account">
      <h1 className="display text-[length:var(--text-chapter)] text-ink">
        {copy.title}
      </h1>
      <p className="mt-3 max-w-[54ch] text-[0.9375rem] leading-relaxed text-ink-soft">
        {copy.intro}
      </p>

      <div className="mt-8 flex max-w-[65ch] flex-col gap-7">
        <section>
          <h2 className="doc-label-sm mb-2 border-b border-sheet-line pb-2 text-ink-soft">
            {copy.inAppTitle}
          </h2>
          <p className="text-[0.9375rem] leading-relaxed text-ink">
            {copy.inAppBody}
          </p>
        </section>

        <section>
          <h2 className="doc-label-sm mb-2 border-b border-sheet-line pb-2 text-ink-soft">
            {copy.emailTitle}
          </h2>
          <p className="text-[0.9375rem] leading-relaxed text-ink">
            {copy.emailBodyBefore}
            <a
              href={`mailto:${site.supportEmail}`}
              className="font-semibold text-carbon-800 underline decoration-carbon-800/40 underline-offset-4 hover:decoration-carbon-800"
            >
              {site.supportEmail}
            </a>
            {copy.emailBodyAfter}
          </p>
        </section>

        <section>
          <h2 className="doc-label-sm mb-2 border-b border-sheet-line pb-2 text-ink-soft">
            {copy.whatTitle}
          </h2>
          <ul className="flex flex-col">
            {copy.whatItems.map((item) => (
              <li
                key={item}
                className="rule-b py-2 text-[0.9375rem] leading-relaxed text-ink"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        <p className="doc-note text-ink-soft">{copy.windowNote}</p>

        <p>
          <a
            href={legalPath(locale, "privacy")}
            className="doc-label-sm text-carbon-800 underline decoration-carbon-800/40 underline-offset-4 hover:decoration-carbon-800"
          >
            {copy.moreLabel}
          </a>
        </p>
      </div>
    </LegalShell>
  );
}
