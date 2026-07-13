#!/usr/bin/env node
/**
 * layout diversity structural check (CAR layout monotony 対応)。
 *
 * 全 catalog diagram を巡回、 各 diagram の SVG 内 `[data-cdl-lane]` 要素数 >= 2 を assert。
 * 単一 lane pattern (lane 1 + 中央 card + readouts 縦 stack) を機械的に禁止し、
 * multi-lane refactor 状態 (99/99 = 100%) を regression 防止する。
 *
 * 検出対象 = 全 sidebar catalog item を順次 click → SVG の data-cdl-lane 要素 count 確認。
 */

import { chromium } from "playwright";

const URL = process.env.CDL_STRUCTURAL_URL || "http://localhost:4323/catalog/interactive";

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  const page = await context.newPage();

  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  const btns = await page.$$("button.catalog-list-item");
  const items = [];
  for (const b of btns) {
    const idEl = await b.$(".catalog-list-item-id");
    const t = idEl ? await idEl.textContent() : "";
    if (t) items.push({ id: t.trim(), handle: b });
  }

  console.log(`total sidebar items: ${items.length}`);
  console.log("─".repeat(60));

  let pass = 0;
  let fail = 0;
  const failures = [];

  for (const item of items) {
    await item.handle.click();
    await page.waitForTimeout(400);
    const laneCount = await page.$$eval(".catalog-preview-stage [data-cdl-lane]", (els) => els.length);
    if (laneCount >= 2) {
      console.log(`✅ ${item.id} (lane count = ${laneCount})`);
      pass++;
    } else {
      console.log(`❌ ${item.id} (lane count = ${laneCount}, expected >= 2)`);
      failures.push({ id: item.id, laneCount });
      fail++;
    }
  }

  await browser.close();
  console.log("");
  console.log("─".repeat(60));
  console.log(`total: ${items.length}, pass: ${pass}, fail: ${fail}`);
  if (fail > 0) {
    console.log("failures (single-lane catalogs):");
    for (const f of failures) console.log(`  - ${f.id} (lane=${f.laneCount})`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("fatal:", e);
  process.exit(2);
});
