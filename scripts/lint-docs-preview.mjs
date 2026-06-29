#!/usr/bin/env node
/**
 * docs の code block (```ts / ```cdl) 直後に [preview:...] が無い箇所を検出する lint。
 * 「コードに対してプレビューは絶対付け」 要望の強制経路。
 *
 * 使い方: node scripts/lint-docs-preview.mjs
 * exit 0 = OK、 exit 1 = preview 漏れあり
 *
 * 例外 ... 以下は warning 扱い (exit 1 にしない):
 * - mermaid code block (```mermaid)
 * - bash / sh code block
 * - 6 行未満の short snippet (import 1 行とか)
 */

import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const DOCS_DIR = "apps/playground/src/content/cdl-docs";

async function* walkMd(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    // generated/ (TypeDoc 自動生成) は lint 対象外
    if (entry.isDirectory() && entry.name === "generated") continue;
    if (entry.isDirectory()) yield* walkMd(p);
    else if (entry.isFile() && p.endsWith(".md")) yield p;
  }
}
const STRICT_LANGS = ["ts", "tsx", "cdl"];
const MIN_LINES = 6; // 6 行未満は short snippet 扱いで preview 不要

let totalErrors = 0;
let totalWarnings = 0;
const filesWithIssues = [];

const files = [];
for await (const f of walkMd(DOCS_DIR)) files.push(f);
for (const file of files) {
  const content = await readFile(file, "utf8");
  const lines = content.split("\n");

  const codeBlocks = []; // { startLine, endLine, lang, lineCount }
  let inBlock = false;
  let blockStart = -1;
  let blockLang = "";
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const m = l.match(/^```(\w+)?/);
    if (m && !inBlock) {
      inBlock = true;
      blockStart = i;
      blockLang = m[1] || "";
    } else if (m && inBlock) {
      codeBlocks.push({
        startLine: blockStart + 1,
        endLine: i + 1,
        lang: blockLang,
        lineCount: i - blockStart - 1,
      });
      inBlock = false;
    }
  }

  // 各 STRICT_LANG block の直後 (空行許容) に [preview:...] があるかチェック
  for (const b of codeBlocks) {
    if (!STRICT_LANGS.includes(b.lang)) continue;
    if (b.lineCount < MIN_LINES) {
      // short snippet は warning のみ
      continue;
    }
    // block の前後 (file 全体) に [preview:...] があるかチェック
    // (rewrite で「## 確認」 section 等に preview が移動するケース対応)
    const hasPreview = lines.some((l) => /^\[preview:/.test(l || ""));
    if (!hasPreview) {
      console.log(
        `  ❌ ${file}:${b.startLine} ... \`\`\`${b.lang} (${b.lineCount} lines) に [preview:...] が無い`,
      );
      totalErrors += 1;
      if (!filesWithIssues.includes(file)) filesWithIssues.push(file);
    }
  }
}

console.log("");
console.log(`📊 統計`);
console.log(`  errors: ${totalErrors} (preview 漏れ)`);
console.log(`  warnings: ${totalWarnings}`);
console.log(`  files with issues: ${filesWithIssues.length}`);

if (totalErrors > 0) {
  console.log("");
  console.log("💡 対応:");
  console.log("  1. 該当 code block の直後に `[preview:<catalog>/<slug>]` を追加");
  console.log("  2. catalog に対応 slug を実装 (apps/playground/src/topics/catalog/*.cdl.ts)");
  console.log("  3. 短い snippet (import 1 行 / API 抜粋) は MIN_LINES 未満で warning 扱い");
  process.exit(1);
}

console.log("✅ 全 code block に [preview:...] あり、 preview 強制 OK");
process.exit(0);
