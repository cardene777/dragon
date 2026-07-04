#!/usr/bin/env node
/**
 * dragon 全 5 audit を 1 コマンドで連続実行する orchestrator。
 * 全 exit 0 なら 0、 1 つでも defect 検出したら 1 で exit、 script error は 2。
 *
 * 使い方 (dev server localhost:4322 起動中):
 *   pnpm exec node scripts/audit/all.mjs
 *
 * 個別 script の実行と等価:
 *   node scripts/audit/pages-a11y.mjs
 *   node scripts/audit/editor-svg-text-overflow.mjs
 *   node scripts/audit/editor-dark-contrast.mjs
 *   node scripts/audit/pages-responsive.mjs
 *   node scripts/audit/pages-i18n.mjs
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SCRIPTS = [
  { name: "a11y", file: "pages-a11y.mjs" },
  { name: "svg-text-overflow", file: "editor-svg-text-overflow.mjs" },
  { name: "dark-contrast", file: "editor-dark-contrast.mjs" },
  { name: "responsive", file: "pages-responsive.mjs" },
  { name: "i18n", file: "pages-i18n.mjs" },
];

function runScript(name, file) {
  return new Promise((resolve) => {
    const start = Date.now();
    const proc = spawn("node", [join(__dirname, file)], { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => { stdout += d.toString(); });
    proc.stderr.on("data", (d) => { stderr += d.toString(); });
    proc.on("close", (code) => {
      const duration = Math.round((Date.now() - start) / 1000);
      resolve({ name, code, duration, stdout, stderr });
    });
  });
}

async function run() {
  console.log(`=== dragon audit all orchestrator (${SCRIPTS.length} scripts) ===\n`);
  const results = [];
  for (const s of SCRIPTS) {
    console.log(`[${s.name}] running ${s.file}...`);
    const r = await runScript(s.name, s.file);
    results.push(r);
    const status = r.code === 0 ? "OK" : r.code === 1 ? "DEFECT" : "ERROR";
    console.log(`[${s.name}] ${status} (exit ${r.code}, ${r.duration}s)\n`);
  }

  console.log("=== SUMMARY ===");
  for (const r of results) {
    const status = r.code === 0 ? "✓ OK    " : r.code === 1 ? "✗ DEFECT" : "! ERROR ";
    console.log(`  ${status} ${r.name.padEnd(20)} exit=${r.code} time=${r.duration}s`);
  }

  const defectCount = results.filter(r => r.code === 1).length;
  const errorCount = results.filter(r => r.code >= 2).length;
  const totalDuration = results.reduce((s, r) => s + r.duration, 0);
  console.log(`\ntotal: ${results.length} scripts, ${defectCount} with defects, ${errorCount} with errors, ${totalDuration}s`);

  if (errorCount > 0) {
    console.log("\n=== ERROR DETAIL ===");
    for (const r of results.filter(x => x.code >= 2)) {
      console.log(`--- ${r.name} stderr ---`);
      console.log(r.stderr.slice(0, 1000));
    }
    process.exit(2);
  }
  if (defectCount > 0) {
    console.log("\n=== DEFECT DETAIL ===");
    for (const r of results.filter(x => x.code === 1)) {
      console.log(`--- ${r.name} stdout tail ---`);
      console.log(r.stdout.split("\n").slice(-20).join("\n"));
    }
    process.exit(1);
  }
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(2);
});
