import type { MetadataRoute } from "next";
import { site } from "@/config/site";

const languages = {
  az: site.url,
  en: `${site.url}/en`,
  ru: `${site.url}/ru`,
  "x-default": site.url,
};

const pages = [site.url, `${site.url}/en`, `${site.url}/ru`];

export default function sitemap(): MetadataRoute.Sitemap {
  // No lastModified: a build-time timestamp would stamp every deploy as a
  // content change, teaching crawlers to distrust the signal entirely.
  return pages.map((url) => ({
    url,
    changeFrequency: "monthly",
    priority: url === site.url ? 1 : 0.8,
    alternates: { languages },
  }));
}
