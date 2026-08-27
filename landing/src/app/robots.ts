import type { MetadataRoute } from "next";
import { site } from "@/config/site";

/**
 * Everything is public marketing copy, so all crawlers are allowed.
 * AI-search crawlers that power answer-engine citations are named
 * explicitly — a documented policy rather than allow-by-silence.
 * Training-only crawlers (CCBot, Bytespider, …) remain allowed via the
 * wildcard; revisit if that stance ever changes.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ClaudeBot",
          "PerplexityBot",
          "Google-Extended",
        ],
        allow: "/",
      },
      { userAgent: "*", allow: "/" },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
