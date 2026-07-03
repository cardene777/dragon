#!/usr/bin/env node
/**
 * editor の全 sample × dark/light theme で SVG 内 text 位置を viewBox 座標系で audit。
 * 実行 = `pnpm --filter dragon-playground exec node scripts/audit/editor-svg-text-overflow.mjs`
 * 前提 = editor が localhost:4322 で起動中 (`pnpm dev`)
 */
import { chromium } from "playwright";
import { svgWorldAuditLib } from "./svg-world.mjs";

const SAMPLES = [
  "ログインAPI呼び出し",
  "注文チェックアウト",
  "CIパイプライン",
  "ユーザー登録",
  "システム構成",
  "ユーザーと投稿のスキーマ",
  "認証状態遷移",
  "OOP クラス階層",
  "スプリントロードマップ",
  "プロジェクト構想",
  "言語シェア",
  "C4コンテキスト",
];
const URL = process.env.URL || "http://localhost:4322/editor";

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForSelector(".v4-editor-stage", { timeout: 10000 });
  const summary = await page.$(".v4-editor-side-samples-summary");
  if (summary) { await summary.click(); await page.waitForTimeout(500); }

  const results = [];
  let prevId = "";
  for (const s of SAMPLES) {
    const btns = await page.$$(".v4-editor-side-item");
    let clicked = false;
    for (const b of btns) {
      const t = (await b.textContent())?.trim();
      if (t === s) { await b.click({ force: true }); clicked = true; break; }
    }
    if (!clicked) { results.push({ sample: s, error: "not_found" }); continue; }
    let compileFail = false;
    try {
      await page.waitForFunction((prev) => {
        const id = document.querySelector(".v4-editor-stage [data-cdl-diagram]")?.getAttribute("data-cdl-diagram");
        return id && id !== prev;
      }, { timeout: 5000 }, prevId);
    } catch (e) { compileFail = true; }
    await page.waitForTimeout(1500);
    const info = await page.evaluate((auditLib) => {
      eval(auditLib);
      const svg = document.querySelector(".v4-editor-stage svg");
      if (!svg) return { error: "no_svg" };
      const vb = svg.viewBox.baseVal;
      const wrapper = document.querySelector(".v4-editor-stage [data-cdl-diagram]");
      const overflows = [];
      for (const t of svg.querySelectorAll("text")) {
        const worldBB = svgWorldBBox(t, svg);
        if (!worldBB) continue;
        if (!isInsideViewBox(worldBB, vb)) {
          const over = overflowAmount(worldBB, vb);
          overflows.push({
            text: t.textContent?.slice(0, 30),
            over: { L: Math.round(over.L), R: Math.round(over.R), T: Math.round(over.T), B: Math.round(over.B) },
          });
        }
      }
      return {
        diagram_id: wrapper?.getAttribute("data-cdl-diagram"),
        overflow_count: overflows.length,
        samples: overflows.slice(0, 3),
      };
    }, svgWorldAuditLib);
    results.push({ sample: s, compile_fail: compileFail, ...info });
    prevId = info.diagram_id || prevId;
  }

  console.log("sample\tdiagram_id\toverflow\tstatus");
  for (const r of results) {
    if (r.error) { console.log(`${r.sample}\t${r.error}`); continue; }
    const fail = r.compile_fail ? " (COMPILE_FAIL)" : "";
    const status = r.overflow_count === 0 ? `OK${fail}` : `OVERFLOW (${r.samples.map(s => `"${s.text}" [B=${s.over.B}]`).join(", ")})${fail}`;
    console.log(`${r.sample}\t${r.diagram_id}\t${r.overflow_count}\t${status}`);
  }

  const withOverflow = results.filter(r => !r.error && r.overflow_count > 0);
  const compileFails = results.filter(r => r.compile_fail);
  console.log(`\n=== SUMMARY: ${results.length - withOverflow.length}/${results.length} OK, ${withOverflow.length} sample(s) with overflow, ${compileFails.length} sample(s) with COMPILE_FAIL ===`);
  if (compileFails.length > 0) {
    console.log("COMPILE_FAIL samples (前 diagram の SVG が残存、 audit 結果は当該 sample のものではない):");
    for (const r of compileFails) console.log(`  - ${r.sample}`);
  }

  await browser.close();
  process.exit(withOverflow.length > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(2);
});
