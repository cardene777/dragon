#!/usr/bin/env node
/**
 * dragon 主要 page × 3 viewport × 2 lang (ja/en) で layout 崩れ audit。
 * 前提 = dev server が localhost:4322 で起動中。
 */
import { chromium } from "playwright";

const PAGES = [
  "/",
  "/editor",
  "/catalog/",
  "/catalog/presets",
  "/catalog/patterns",
  "/catalog/text-dsl",
  "/contribute",
  "/changelog",
];
const DOCS_PAIRS = [
  ["/docs/", "/docs/en/"],
  ["/docs/cdl/", "/docs/en/cdl/"],
  ["/docs/cdl/quickstart/", "/docs/en/cdl/quickstart/"],
];
const WIDTHS = [1440, 900, 640];
const HEIGHT = 900;
const BASE = process.env.URL || "http://localhost:4322";

async function audit(page) {
  return page.evaluate(() => {
    const body = document.body;
    const scrollW = body.scrollWidth;
    const clientW = body.clientWidth;
    const overflow_els = [];
    for (const el of document.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      if (r.right > clientW + 0.5 && r.width > 0 && r.width < clientW * 3) {
        overflow_els.push({ tag: el.tagName, cls: (el.className || "").toString().slice(0, 40) });
        if (overflow_els.length >= 2) break;
      }
    }
    return { scrollW, clientW, h_scroll: scrollW > clientW + 1, overflow_first: overflow_els[0] };
  });
}

async function run() {
  const browser = await chromium.launch();
  const results = [];

  // 共通 page × lang toggle 経由
  for (const w of WIDTHS) {
    for (const lang of ["ja", "en"]) {
      const context = await browser.newContext({ viewport: { width: w, height: HEIGHT }, locale: lang === "en" ? "en-US" : "ja-JP" });
      const page = await context.newPage();
      for (const p of PAGES) {
        try {
          await page.goto(BASE + p, { waitUntil: "networkidle", timeout: 15000 });
        } catch (e) { results.push({ w, lang, p, error: "load" }); continue; }
        await page.evaluate((l) => {
          try {
            localStorage.setItem("v4-lang", l);
            localStorage.setItem("docs-lang", l);
            document.documentElement.setAttribute("lang", l);
          } catch (e) {}
        }, lang);
        await page.waitForTimeout(600);
        const info = await audit(page);
        results.push({ w, lang, p, ...info });
      }
      await context.close();
    }
  }

  // docs は URL 別で ja/en
  for (const w of WIDTHS) {
    const context = await browser.newContext({ viewport: { width: w, height: HEIGHT } });
    const page = await context.newPage();
    for (const [ja, en] of DOCS_PAIRS) {
      for (const [lang, url] of [["ja", ja], ["en", en]]) {
        try {
          await page.goto(BASE + url, { waitUntil: "networkidle", timeout: 15000 });
        } catch (e) { results.push({ w, lang, p: url, error: "load" }); continue; }
        await page.waitForTimeout(600);
        const info = await audit(page);
        results.push({ w, lang, p: url, ...info });
      }
    }
    await context.close();
  }

  const issues = results.filter(r => r.error || r.h_scroll);
  console.log(`=== pages i18n audit (${results.length} cases) ===`);
  console.log(`ok: ${results.length - issues.length}, issues: ${issues.length}`);
  if (issues.length > 0) {
    for (const i of issues.slice(0, 15)) {
      const detail = i.error || `H_SCROLL ${i.scrollW}>${i.clientW}${i.overflow_first ? ` (${i.overflow_first.tag}.${i.overflow_first.cls})` : ""}`;
      console.log(`  ${i.w} ${i.lang} ${i.p}: ${detail}`);
    }
  }

  await browser.close();
  process.exit(issues.length > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(2);
});
