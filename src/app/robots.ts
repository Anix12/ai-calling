import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    // The sitemap needs an absolute URL, so it is only advertised once the domain is configured.
    ...(siteUrl && { sitemap: `${siteUrl}/sitemap.xml`, host: siteUrl }),
  };
}
