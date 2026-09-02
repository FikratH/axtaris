export const GA_MEASUREMENT_ID = "G-E3RQNWY1BX";

export const CONSENT_STORAGE_KEY = "axtaris-analytics-consent";

type GtagConsentState = "granted" | "denied";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function gtag(...args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

/** Applies the visitor's stored cookie choice to Google Consent Mode. */
export function applyStoredConsent() {
  const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  if (stored === "granted") updateConsent("granted");
}

export function updateConsent(state: GtagConsentState) {
  gtag("consent", "update", { analytics_storage: state });
}

/** Fires a GA4 event; safe to call even before consent is granted. */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  gtag("event", name, params);
}
