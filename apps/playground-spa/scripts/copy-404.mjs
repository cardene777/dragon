#!/usr/bin/env node
/**
 * 頁の `index.html` の写しを、画面の経路ごとの `.html` と、GitHub Pages が無い path に返す `404.html` として作る。
 *
 * 頁は開いた path から 8 画面と埋め込みの頁のどれを出すかを決める (`src/site/routes.ts`、#3030、#3166、#3700)。
 * Pages は拡張子の無い経路 (`/dragon/docs`) に同じ名前の `.html` (`docs.html`) を 200 で返すので、
 * 画面の経路を直に開いた人にも同じ頁を 200 で出せる (#3157)。表に無い path は `404.html` の写しで 404 のまま出す (#2995)。
 * 下にも経路を持つ経路 (`catalog`) は、Pages が dir の側を選んだ時のために dir の `index.html` も置く。
 *
 * 使い方: `node scripts/copy-404.mjs [build した dir]`。dir を渡さなければ `dist`。
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * カタログの部品の名札は、部品の図の記法の file (`packages/dragon/src/blocks/<名前>/gallery/<名札>.<図の種類>.dragon`) の名前から引く。
 * file は部品の表 (`src/catalog/parts.ts` の `PARTS`) の部品と、その部品を描ける図の種類ごとにあり、過不足を頁の検査が数える (#3166)。
 * 図の種類は、専用の入力を持つ図も含め、図の種類の置き場の dir から引く。
 * 部品の図は全てブロックの置き場に在る (#3345、#3348)
 */
const BLOCKS = resolve(__dirname, "../../../packages/dragon/src/blocks");
const FIGURE_DIRS = readdirSync(BLOCKS)
  .map((name) => resolve(BLOCKS, name, "gallery"))
  .filter((dir) => existsSync(dir));
const SNIPPETS = FIGURE_DIRS.flatMap((dir) => readdirSync(dir).filter((name) => name.endsWith(".dragon"))).sort();
const PART_IDS = [...new Set(SNIPPETS.map((name) => name.split(".")[0]))];
const KIND_DIR = resolve(__dirname, "../../../packages/dragon/src/kinds");
const KINDS = readdirSync(KIND_DIR, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name);

/**
 * 画面の経路 (頁の置き場の後ろ)。帯の行き先の経路の表 (`src/site/routes.ts` の `PATHS`) と、埋め込みの頁の経路 (`EMBED_PATH`、#3700) と、
 * カタログの分類 (`src/catalog/catalog.ts` の `KINDS`) と部品の表から導いた一覧と同じかを、頁の検査が突き合わせる
 */
const ROUTES = ["catalog", "editor", "docs", "release-notes", "embed", "embedding", ...KINDS.map((kind) => `catalog/${kind}`), ...PART_IDS.map((id) => `catalog/part/${id}`)];

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
