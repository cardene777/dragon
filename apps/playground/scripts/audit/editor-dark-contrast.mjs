#!/usr/bin/env node
/**
 * editor UI 全体を dark theme で contrast audit、 WCAG 3:1 未満を defect として検出。
 * 前提 = editor が localhost:4322 で起動中 (`pnpm dev`)
 */
import { chromium } from "playwright";
import { contrastAuditLib } from "./contrast.mjs";

const URL = process.env.URL || "http://localhost:4322/editor";
const MIN_RATIO = +(process.env.MIN_RATIO || 3.0);

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.waitForTimeout(2500);
  const summary = await page.$(".v4-editor-side-samples-summary");
  if (summary) { await summary.click(); await page.waitForTimeout(300); }

  const result = await page.evaluate(({ auditLib, threshold }) => {
    eval(auditLib);
    const problems = [];
    const editorRoot = document.querySelector(".v4-editor");
    if (!editorRoot) return { error: "no_editor_root" };
    for (const el of editorRoot.querySelectorAll("button, a, span, label, input, h1, h2, h3, p, li, summary, td, th")) {
      const hasDirectText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 0);
      if (!hasDirectText) continue;
      const text = el.textContent?.trim().slice(0, 30);
      if (!text) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      const fg = parseRgba(getComputedStyle(el).color);
      if (!fg) continue;
      const bg = composeChain(el);
      const ratio = contrastRatio(fg, bg);
      if (ratio < threshold) {
        problems.push({
          tag: el.tagName,
          cls: (el.className || "").toString().slice(0, 40),
          text,
          fg: `rgba(${Math.round(fg.r)},${Math.round(fg.g)},${Math.round(fg.b)})`,
          bg: `rgba(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})`,
          ratio: +ratio.toFixed(2),
        });
      }
    }
    return { total: problems.length, samples: problems.slice(0, 10) };
  }, { auditLib: contrastAuditLib, threshold: MIN_RATIO });

  if (result.error) {
    console.error("audit failed:", result.error);
    await browser.close();
    process.exit(2);
  }

  console.log(`=== editor dark contrast audit (threshold ${MIN_RATIO}) ===`);
  console.log(`total defects: ${result.total}`);
  for (const p of result.samples) {
    console.log(`  [${p.tag}.${p.cls.slice(0, 30)}] "${p.text}" ratio=${p.ratio} fg=${p.fg} bg=${p.bg}`);
  }

  await browser.close();
  process.exit(result.total > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(2);
});
