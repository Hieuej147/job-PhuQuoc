import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://phuquoc.jobs";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/candidate/",
          "/employer/",
          "/auth/",
          "/template/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
