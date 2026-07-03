#!/usr/bin/env node
/**
 * dragon 主要 page × 6 viewport 幅で body 横スクロール発生 (PAGE_SCROLL_H) を検出。
 * 前提 = dev server が localhost:4322 で起動中 (`pnpm dev`)
 */
import { chromium } from "playwright";

const PAGES = [
  "/",
  "/editor",
  "/catalog/",
  "/catalog/presets",
  "/catalog/patterns",
  "/catalog/animation",
  "/catalog/styles",
  "/catalog/cookbook",
  "/catalog/primitives",
  "/catalog/text-dsl",
  "/docs/",
  "/contribute",
  "/changelog",
  "/release-notes",
];
const WIDTHS = [1920, 1440, 1024, 900, 768, 640];
const HEIGHT = 900;
const BASE = process.env.URL || "http://localhost:4322";

async function run() {
  const browser = await chromium.launch();
  const results = [];

  for (const w of WIDTHS) {
    const context = await browser.newContext({ viewport: { width: w, height: HEIGHT } });
    const page = await context.newPage();
    for (const p of PAGES) {
      try {
        const resp = await page.goto(BASE + p, { waitUntil: "networkidle", timeout: 15000 });
        if (!resp || resp.status() >= 400) {
          results.push({ w, p, error: "load_fail" });
          continue;
        }
      } catch (e) {
        results.push({ w, p, error: "timeout" });
        continue;
      }
      await page.waitForTimeout(800);
      const info = await page.evaluate(() => {
        const body = document.body;
        const scrollW = body.scrollWidth;
        const clientW = body.clientWidth;
        const overflow_els = [];
        for (const el of document.querySelectorAll("*")) {
          const r = el.getBoundingClientRect();
          if (r.right > clientW + 0.5 && r.width > 0 && r.width < clientW * 3) {
            overflow_els.push({ tag: el.tagName, cls: (el.className || "").toString().slice(0, 40) });
            if (overflow_els.length >= 3) break;
          }
        }
        return { scrollW, clientW, h_scroll: scrollW > clientW + 1, overflow_first: overflow_els[0] };
      });
      results.push({ w, p, ...info });
    }
    await context.close();
  }

  const issues = results.filter(r => r.error || r.h_scroll);
  console.log(`=== pages responsive audit (${WIDTHS.length} widths × ${PAGES.length} pages) ===`);
  console.log(`total: ${results.length}, ok: ${results.length - issues.length}, issues: ${issues.length}`);
  if (issues.length > 0) {
    for (const i of issues.slice(0, 15)) {
      const detail = i.error || `H_SCROLL scrollW=${i.scrollW} clientW=${i.clientW}${i.overflow_first ? ` (${i.overflow_first.tag}.${i.overflow_first.cls})` : ""}`;
      console.log(`  ${i.w}x${HEIGHT} ${i.p}: ${detail}`);
    }
  }

  await browser.close();
  process.exit(issues.length > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(2);
});
