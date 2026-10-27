#!/usr/bin/env node
/**
 * 頁の `index.html` の写しを、画面の経路ごとの `.html` と、GitHub Pages が無い path に返す `404.html` として作る。
 *
 * 頁は開いた path から 7 画面のどれを出すかを決める (`src/site/routes.ts`、#3030)。
 * Pages は拡張子の無い経路 (`/dragon/docs`) に同じ名前の `.html` (`docs.html`) を 200 で返すので、
 * 画面の経路を直に開いた人にも同じ頁を 200 で出せる (#3157)。表に無い path は `404.html` の写しで 404 のまま出す (#2995)。
 * 下にも経路を持つ経路 (`catalog`) は、Pages が dir の側を選んだ時のために dir の `index.html` も置く。
 *
 * 使い方: `node scripts/copy-404.mjs [build した dir]`。dir を渡さなければ `dist`。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * 画面の経路 (頁の置き場の後ろ)。帯の行き先の経路の表 (`src/site/routes.ts` の `PATHS`) と、
 * カタログの分類 (`src/catalog/catalog.ts` の `KINDS`) から導いた一覧と同じかを、頁の検査が突き合わせる
 */
const ROUTES = ["catalog", "editor", "docs", "release-notes", "catalog/sequence", "catalog/architecture"];

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(process.argv[2] ?? resolve(__dirname, "..", "dist"));
const indexHtml = resolve(distDir, "index.html");

if (!existsSync(indexHtml)) {
  console.error(`[copy-404] ${indexHtml} が無い。先に build する`);
  process.exit(1);
}

const content = readFileSync(indexHtml, "utf8");
const parents = ROUTES.filter((route) => ROUTES.some((other) => other.startsWith(`${route}/`)));
const copies = ["404.html", ...ROUTES.map((route) => `${route}.html`), ...parents.map((route) => `${route}/index.html`)];
for (const copy of copies) {
  const path = resolve(distDir, copy);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, "utf8");
}
console.log(`[copy-404] index.html の写しを ${copies.join("、")} として作った (${content.length} bytes)`);
