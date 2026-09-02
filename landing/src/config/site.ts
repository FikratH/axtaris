/**
 * Central integration seam for every external URL the landing page may need.
 * The product is not publicly distributed yet (confirmed 2026-08-27), so
 * distribution links are null and the UI renders honest "coming soon" states.
 * Replace a null with a real URL and the UI upgrades to a live link.
 */
export interface DistributionLinks {
  /** TODO: set when the iOS app ships on the App Store */
  appStore: string | null;
  /** TODO: set when the Android app ships on Google Play */
  googlePlay: string | null;
  /** TODO: set when a public web-app URL exists (e.g. the Netlify deploy) */
  webApp: string | null;
  /** TODO: set when a dedicated employer registration flow is public */
  employerSignup: string | null;
}

export const distribution: DistributionLinks = {
  appStore: null,
  googlePlay: null,
  webApp: null,
  employerSignup: null,
};

export const site = {
  /** production domain (confirmed 2026-08-27; deployed on Vercel) */
  url: "https://axtaris.app",
  /** the only real public contact (confirmed 2026-08-27) */
  supportEmail: "info@axtaris.app",
  /** E.164, for tel: links and schema.org telephone (added 2026-09-02) */
  supportPhone: "+994505050280",
  supportPhoneDisplay: "+994 50 505 02 80",
  whatsappUrl: "https://wa.me/994505050280",
  name: "AxtarIS",
} as const;
