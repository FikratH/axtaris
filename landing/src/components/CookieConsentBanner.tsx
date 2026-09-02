"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import type { Dictionary, Locale } from "@/content";
import { legalPath } from "@/lib/legal-path";
import { applyStoredConsent, CONSENT_STORAGE_KEY, updateConsent } from "@/lib/analytics";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getConsent(): string | null {
  return window.localStorage.getItem(CONSENT_STORAGE_KEY);
}

/** No stored choice exists on the server — keeps the banner out of SSR HTML. */
function getServerConsent(): string | null {
  return "denied";
}

/**
 * A visitor's choice here is what lets Google Consent Mode switch
 * analytics_storage from its default "denied" to "granted" — see the
 * consent-default Script in the root layout. Privacy Policy §14 promises
 * we ask before setting analytics cookies; this is that ask.
 */
export function CookieConsentBanner({
  dict,
  locale,
}: {
  dict: Dictionary["cookieConsent"];
  locale: Locale;
}) {
  const consent = useSyncExternalStore(subscribe, getConsent, getServerConsent);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (consent === "granted") applyStoredConsent();
  }, [consent]);

  function decide(granted: boolean) {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, granted ? "granted" : "denied");
    if (granted) updateConsent("granted");
    setDismissed(true);
  }

  if (dismissed || consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-label={dict.message}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-carbon-600/60 bg-sheet px-4 py-4 shadow-[0_-8px_24px_rgba(6,13,31,0.35)] sm:px-6"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="doc-note max-w-[60ch] text-ink-soft">
          {dict.message}{" "}
          <a
            href={legalPath(locale, "privacy")}
            className="text-brand-600 underline decoration-current/40 underline-offset-4 hover:decoration-current"
          >
            {dict.privacyLink}
          </a>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="countersign"
            data-on="sheet"
            onClick={() => decide(false)}
          >
            {dict.decline}
          </Button>
          <Button type="button" variant="stamp" onClick={() => decide(true)}>
            {dict.accept}
          </Button>
        </div>
      </div>
    </div>
  );
}
