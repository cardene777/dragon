#!/usr/bin/env node
/**
 * dragon-lint CLI (author 向け修正システム CLI)。
 *
 * 使い方:
 *   node scripts/dragon-lint.mjs <path-to-cdl.ts>
 *
 * 例:
 *   node packages/dragon/scripts/dragon-lint.mjs \
 *     apps/playground-spa/src/topics/catalog/presets.cdl.ts
 *
 * 動作:
 *   1. 指定 file を tsx で動的 import
 *   2. 全 CdlDiagram export を lintDiagram() で検査
 *   3. 標準出力に issue を rule / severity / target / message で列挙
 *   4. autoFixable な issue 件数を末尾に summary
 *   5. --fix flag 付きなら autoFix() を適用して修正版を .lint-fix.ts に書く
 *
 * LLM 不要、 pure rule-based。
 */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { writeFileSync } from "node:fs";
import { tsImport } from "tsx/esm/api";
import { lintDiagram, autoFix } from "../dist/index.js";
import { 指摘の行 } from "./lint-output.mjs";

const args = process.argv.slice(2);
const applyFix = args.includes("--fix");
const targets = args.filter((a) => !a.startsWith("--"));

if (targets.length === 0) {
  console.error("使い方: `node packages/dragon/scripts/dragon-lint.mjs <図を書いた .cdl.ts>… [--fix]`");
  process.exit(1);
}

let totalIssues = 0;
let totalAutoFixable = 0;
let totalDiagrams = 0;

for (const target of targets) {
  const absPath = resolve(process.cwd(), target);
  // 素の import() は拡張子なしの相対読み込み (`./relation-focus`) を解決できず、最初の見本で落ちて
  // 残りのファイルも検査しなくなる。 カタログと同じく拡張子なしで読めるよう tsx の読み込み口を使う (#1918)
  const mod = await tsImport(pathToFileURL(absPath).href, import.meta.url);
  const diagrams = Object.entries(mod).filter(
    ([, v]) => v && typeof v === "object" && "id" in v && "nodes" in v && "topic" in v,
  );

  if (diagrams.length === 0) {
    console.warn(`[記法の検査] \`${target}\` に図 (\`CdlDiagram\`) の書き出し (\`export\`) が無い`);
    continue;
  }

  console.log(`\n== \`${target}\` (図 ${diagrams.length} 件) ==\n`);

  const fixed = {};
  for (const [exportName, d] of diagrams) {
    const report = lintDiagram(d);
    totalDiagrams++;
    if (report.issues.length === 0) continue;

    console.log(`  \`${exportName}\` (\`${d.id}\`) の指摘 ${report.issues.length} 件`);
    for (const issue of report.issues) {
      for (const 行 of 指摘の行(issue, "    ")) console.log(行);
    }
    totalIssues += report.issues.length;
    totalAutoFixable += report.autoFixableCount;

    if (applyFix) {
      fixed[exportName] = autoFix(d);
    }
  }

  if (applyFix && Object.keys(fixed).length > 0) {
    const outPath = absPath.replace(/\.ts$/, ".lint-fix.json");
    writeFileSync(outPath, JSON.stringify(fixed, null, 2));
    console.log(
      `  \`--fix\`: 図 ${Object.keys(fixed).length} 件に自動修正を当てた結果を \`${outPath}\` に書き出した`,
    );
  }
}

console.log(`\n== まとめ ==`);
console.log(`  検査した図: ${totalDiagrams} 件`);
console.log(`  指摘: ${totalIssues} 件`);
console.log(`  自動修正できる指摘: ${totalAutoFixable} 件`);

if (totalIssues > 0 && !applyFix) {
  console.log(`  → 自動修正を当てるには \`--fix\` を付けて走らせ直す`);
}
process.exit(0);
