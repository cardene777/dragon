import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// GitHub Pages 配信 = https://cardene777.github.io/dragon/ の subpath 前提で
// `base: "/dragon/"` を production build のみ適用。 dev server は `/` で serve。
// custom domain 使用時は env `GH_PAGES_BASE=/` で override 可 (CNAME で root 配信)。
export default defineConfig(({ command }) => ({
  base: command === "build" ? (process.env.GH_PAGES_BASE ?? "/dragon/") : "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 4323,
    strictPort: true,
  },
  preview: {
    port: 4323,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    target: "es2022",
  },
}));
