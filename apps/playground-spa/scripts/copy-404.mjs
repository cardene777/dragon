#!/usr/bin/env node
/**
 * GitHub Pages SPA fallback = dist/404.html を dist/index.html の複製として生成する。
 *
 * GH Pages は存在しない path で 404.html を返す。 SPA (React Router BrowserRouter) では
 * `/editor` 直 access 時、 server 側に該当 file がなく 404 になるが、 404.html = SPA index の
 * 複製にしておけば browser が SPA を load、 React Router が URL pathname を読んで対応 route を render する。
 *
 * 404 status code は残るが SPA 動作は成立 (analytics 側で 200/404 区別が要るなら別途対応)。
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, "..", "dist");
const indexHtml = resolve(distDir, "index.html");
const notFoundHtml = resolve(distDir, "404.html");

if (!existsSync(indexHtml)) {
  console.error(`[copy-404] dist/index.html が存在しません。 先に \`pnpm build\` を実行してください。`);
  process.exit(1);
}

const content = readFileSync(indexHtml, "utf8");
writeFileSync(notFoundHtml, content, "utf8");
console.log(`[copy-404] ${notFoundHtml} を index.html の複製として生成しました (${content.length} bytes)`);
