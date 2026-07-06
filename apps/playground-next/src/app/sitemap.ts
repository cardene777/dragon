import type { MetadataRoute } from "next";
import { PRESETS } from "@/lib/presets";

/**
 * Sitemap generation — search engine indexing 用。
 * app router で `sitemap.ts` を export すると /sitemap.xml が自動 route。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://dragon-playground.vercel.app";
  const lastModified = new Date("2026-07-07");

  return [
    {
      url: base,
      lastModified,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${base}/editor`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/docs`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...PRESETS.map((p) => ({
      url: `${base}/preset/${p.id}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
