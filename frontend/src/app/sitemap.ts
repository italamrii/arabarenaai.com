import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/seo/metadata";

const PUBLIC_PATHS = [
  { path: "/", priority: 1 },
  { path: "/compare", priority: 0.9 },
  { path: "/about", priority: 0.8 },
  { path: "/privacy", priority: 0.7 },
  { path: "/terms", priority: 0.7 },
  { path: "/contact", priority: 0.7 },
  { path: "/insights", priority: 0.8 },
  { path: "/models", priority: 0.7 },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  return PUBLIC_PATHS.map(({ path, priority }) => ({
    url: path === "/" ? siteUrl : `${siteUrl}${path}`,
    lastModified,
    changeFrequency: "weekly",
    priority,
  }));
}
