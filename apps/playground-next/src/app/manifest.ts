import type { MetadataRoute } from "next";

/**
 * Web app manifest — PWA installability + native-like UX。
 * app router で `manifest.ts` を export すると /manifest.webmanifest が自動 route。
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "dragon — animated diagram DSL",
    short_name: "dragon",
    description:
      "Text DSL から animated SVG diagram を生成する OSS。 6 theme × 10 preset × live editor。",
    start_url: "/",
    display: "standalone",
    background_color: "#e8ecf1",
    theme_color: "#4a7fc8",
    orientation: "any",
    lang: "ja",
    dir: "ltr",
    categories: ["developer", "productivity", "utilities"],
    icons: [
      {
        src: "/og/default.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
