import type { MetadataRoute } from "next";

/**
 * robots.txt generation — search engine crawler ルール。
 * app router で `robots.ts` を export すると /robots.txt が自動 route。
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
    ],
    sitemap: "https://dragon-playground.vercel.app/sitemap.xml",
    host: "https://dragon-playground.vercel.app",
  };
}
