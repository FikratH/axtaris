import { site } from "@/config/site";
import { localePath, type Dictionary, type Locale } from "@/content";

/** Stable id so every locale page resolves to the same Organization entity. */
const ORGANIZATION_ID = `${site.url}/#organization`;

function organizationNode() {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: site.name,
    url: site.url,
    logo: {
      "@type": "ImageObject",
      url: `${site.url}/brand/mark.png`,
      width: 194,
      height: 190,
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: site.supportEmail,
      contactType: "customer support",
      areaServed: "AZ",
      availableLanguage: ["az", "en", "ru"],
    },
    areaServed: {
      "@type": "Country",
      name: "Azerbaijan",
    },
  };
}

function websiteNode(locale: Locale, dict: Dictionary) {
  // Matches Next's rendered canonical tag exactly: "/" resolves to the bare
  // origin (no trailing slash), unlike a literal `new URL("/", site.url)`.
  const url = locale === "az" ? site.url : `${site.url}${localePath(locale)}`;
  return {
    "@type": "WebSite",
    "@id": `${url}#website`,
    url,
    name: site.name,
    description: dict.meta.description,
    inLanguage: locale,
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/** JSON-LD graph (Organization + WebSite) for the given locale page. */
export function getJsonLd(locale: Locale, dict: Dictionary) {
  return {
    "@context": "https://schema.org",
    "@graph": [organizationNode(), websiteNode(locale, dict)],
  };
}
