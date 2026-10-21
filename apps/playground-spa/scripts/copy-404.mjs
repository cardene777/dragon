#!/usr/bin/env node
/**
 * GitHub Pages が無い path に返す `404.html` を、頁の `index.html` の写しとして作る。
 *
 * 前の見本帳の経路 (`/dragon/catalog` や `/dragon/editor` など) を開いた人にも、この写しで新しい頁を出す (#2995)。
 * 頁は開いた後にアドレス欄を `/dragon/` へ書き換える (`src/main.tsx`)。応答の status は 404 のまま残る。
 *
 * 使い方: `node scripts/copy-404.mjs [build した dir]`。dir を渡さなければ `dist`。
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(process.argv[2] ?? resolve(__dirname, "..", "dist"));
const indexHtml = resolve(distDir, "index.html");
const notFoundHtml = resolve(distDir, "404.html");

if (!existsSync(indexHtml)) {
  console.error(`[copy-404] ${indexHtml} が無い。先に build する`);
  process.exit(1);
}

const content = readFileSync(indexHtml, "utf8");
writeFileSync(notFoundHtml, content, "utf8");
console.log(`[copy-404] ${notFoundHtml} を index.html の写しとして作った (${content.length} bytes)`);
