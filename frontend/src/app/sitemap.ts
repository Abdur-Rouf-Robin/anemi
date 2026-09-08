import type { MetadataRoute } from "next";

import { getHome, getStudios, getTitles } from "@/lib/api";
import { siteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteUrl();
  const [titles, home, studios] = await Promise.all([getTitles({ take: "200" }), getHome(), getStudios()]);
  const now = new Date();
  return [
    { url: origin, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${origin}/browse`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${origin}/discover`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${origin}/latest`, lastModified: now, changeFrequency: "hourly", priority: 0.7 },
    { url: `${origin}/feed/latest.xml`, lastModified: now, changeFrequency: "hourly", priority: 0.4 },
    { url: `${origin}/schedule`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
    { url: `${origin}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${origin}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${origin}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${origin}/charts`, lastModified: now, changeFrequency: "daily", priority: 0.5 },
    { url: `${origin}/studios`, lastModified: now, changeFrequency: "weekly", priority: 0.4 },
    ...studios.map((studio) => ({
      url: `${origin}/studio/${studio.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.4
    })),
    { url: `${origin}/feed/schedule.ics`, lastModified: now, changeFrequency: "daily", priority: 0.3 },
    ...(home.collections ?? []).map((shelf) => ({
      url: `${origin}/collection/${shelf.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.5
    })),
    ...titles.items.map((title) => ({
      url: `${origin}/title/${title.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7
    }))
  ];
}
