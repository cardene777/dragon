import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";
import remarkDocTabs from "./src/lib/remark-doc-tabs.mjs";

export default defineConfig({
  output: "static",
  site: process.env.SITE_URL || "https://cdl-playground.vercel.app",
  integrations: [
    mdx(),
    react(),
    tailwind({ applyBaseStyles: false }),
    sitemap(),
  ],
  markdown: {
    remarkPlugins: [remarkDocTabs],
    // Shiki シンタックスハイライト ... デュアル theme (light / dark) で html.dark 切替に対応。
    // Astro Shiki が dual theme 設定時に各 token を <span style="--shiki-light:..; --shiki-dark:..">
    // で出力し、 CSS variable で切替可能になる。 docs-site.css で .astro-code を dark 時に dark 変数優先。
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark-dimmed",
      },
      defaultColor: false, // CSS variable のみ、 inline color 直書きを抑制
      wrap: false,
    },
  },
});
