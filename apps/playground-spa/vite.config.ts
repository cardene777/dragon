import { readFileSync } from "node:fs";
import path from "node:path";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import { DEV_PORT, PREVIEW_PORT } from "./ports";

/**
 * 記法の版。 画面の札に出す (#1320)。
 *
 * 手で書くと版を上げた時に追随せず、実際に 3 版分古いまま残っていた (`v0.7` に対して
 * package は `0.10.0`)。 `package.json` を唯一の出どころにする。
 *
 * 差し込みにするのは、`package.json` を client から import すると依存の一覧ごと束に
 * 乗るため。 出したいのは版の文字列 1 つだけ。
 */
const 記法の版 = (
  JSON.parse(
    readFileSync(path.resolve(__dirname, "../../packages/dragon/package.json"), "utf8"),
  ) as { version?: string }
).version;
if (typeof 記法の版 !== "string" || 記法の版 === "") {
  throw new Error("packages/dragon/package.json から version を読めない");
}

// GitHub Pages 配信 = https://cardene777.github.io/dragon/ の subpath 前提で
// `base: "/dragon/"` を production (build + preview) 時に適用。 dev server (mode=development) は `/` で serve。
// mode 判定で vite preview も /dragon/ 配信となり、 deploy 前の local production 検証経路が成立する。
// custom domain 使用時は env `GH_PAGES_BASE=/` で override 可 (CNAME で root 配信)。
export default defineConfig(({ command, mode }) => ({
  base:
    command === "build" || mode === "production"
      ? (process.env.GH_PAGES_BASE ?? "/dragon/")
      : "/",
  define: {
    // 画面から `__DRAGON_VERSION__` で読む (#1320)
    __DRAGON_VERSION__: JSON.stringify(記法の版),
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: DEV_PORT,
    strictPort: true,
  },
  // **開発 server と別の port にする** (#1326)。 同じにすると本番 build の検査を回すたびに
  // 開発 server を落とすことになり、実際には誰も立てないまま 22 件が落ち続けていた
  preview: {
    port: PREVIEW_PORT,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    target: "es2022",
  },
}));
