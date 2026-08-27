import type { MetadataRoute } from "next";
import { site } from "@/config/site";

const languages = {
  az: site.url,
  en: `${site.url}/en`,
  ru: `${site.url}/ru`,
};

export default function sitemap(): MetadataRoute.Sitemap {
  return Object.values(languages).map((url) => ({
    url,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: url === site.url ? 1 : 0.8,
    alternates: { languages },
  }));
}
