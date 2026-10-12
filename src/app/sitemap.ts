import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/** Single-page site. Entries need absolute URLs, so the list stays empty until NEXT_PUBLIC_SITE_URL is set. */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!siteUrl) return [];
  return [{ url: `${siteUrl}/`, changeFrequency: "weekly", priority: 1 }];
}
