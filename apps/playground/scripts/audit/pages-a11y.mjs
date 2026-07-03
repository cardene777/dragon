#!/usr/bin/env node
/**
 * dragon 主要 page で accessibility audit。 aria label / image alt / heading order の欠陥検出。
 * 前提 = dev server が localhost:4322 で起動中 (`pnpm dev`)
 *
 * 検出項目:
 * - **aria label 欠落**: button / a / input で visible text も aria-label も aria-labelledby も title も持たない
 * - **image alt 欠落**: img に alt 属性なし (role="presentation" / aria-hidden="true" は除外)
 * - **heading order skip**: h1 → h3 のように 2 level 以上 skip
 *
 * focus outline audit は本 script では対象外 (`:focus-visible` の CSS 検出は Playwright evaluate で
 * 全 button に対して個別 focus trigger 必要で実行時間が跳ねる、 別 script で対応推奨)。
 */
import { chromium } from "playwright";

const PAGES = [
  "/",
  "/editor",
  "/catalog/",
  "/catalog/presets",
  "/catalog/patterns",
  "/catalog/animation",
  "/catalog/text-dsl",
  "/docs/",
  "/contribute",
  "/changelog",
];
const BASE = process.env.URL || "http://localhost:4322";

async function auditPage(page) {
  return page.evaluate(() => {
    const issues = [];

    // 1. aria label 欠落
    for (const el of document.querySelectorAll("button, a, input:not([type=hidden])")) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      const visibleText = el.textContent?.trim();
      const ariaLabel = el.getAttribute("aria-label")?.trim();
      const ariaLabelledby = el.getAttribute("aria-labelledby")?.trim();
      const title = el.getAttribute("title")?.trim();
      const inputPlaceholder = el.tagName === "INPUT" ? el.getAttribute("placeholder")?.trim() : null;
      const associatedLabel = el.tagName === "INPUT" && el.id ? document.querySelector(`label[for="${el.id}"]`)?.textContent?.trim() : null;
      if (!visibleText && !ariaLabel && !ariaLabelledby && !title && !inputPlaceholder && !associatedLabel) {
        issues.push({
          kind: "no_accessible_name",
          tag: el.tagName,
          cls: (el.className || "").toString().slice(0, 40),
        });
      }
    }

    // 2. image alt 欠落 (装飾用は除外)
    for (const img of document.querySelectorAll("img")) {
      const role = img.getAttribute("role");
      const ariaHidden = img.getAttribute("aria-hidden");
      if (role === "presentation" || ariaHidden === "true") continue;
      const alt = img.getAttribute("alt");
      if (alt === null) {
        issues.push({
          kind: "img_no_alt",
          src: img.getAttribute("src")?.slice(0, 40),
        });
      }
    }

    // 3. heading order skip (footer / aside / nav 内は独立 section なので除外)
    const headings = [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")].filter(h => !h.closest("footer, aside, nav"));
    let prevLevel = 0;
    for (const h of headings) {
      const level = +h.tagName.slice(1);
      if (prevLevel > 0 && level > prevLevel + 1) {
        issues.push({
          kind: "heading_skip",
          from: `h${prevLevel}`,
          to: h.tagName.toLowerCase(),
          text: h.textContent?.trim().slice(0, 30),
        });
      }
      prevLevel = level;
    }

    return issues;
  });
}

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const results = [];

  for (const p of PAGES) {
    try {
      await page.goto(BASE + p, { waitUntil: "networkidle", timeout: 15000 });
    } catch (e) { results.push({ p, error: "load" }); continue; }
    await page.waitForTimeout(800);
    const issues = await auditPage(page);
    results.push({ p, issues });
  }

  const total = results.reduce((s, r) => s + (r.issues?.length ?? 0), 0);
  console.log(`=== pages a11y audit (${PAGES.length} pages) ===`);
  console.log(`total issues: ${total}`);
  for (const r of results) {
    if (r.error) { console.log(`  ${r.p}: ${r.error}`); continue; }
    if (r.issues.length === 0) continue;
    console.log(`  ${r.p}: ${r.issues.length} issues`);
    // 各 kind の count
    const byKind = {};
    for (const i of r.issues) byKind[i.kind] = (byKind[i.kind] || 0) + 1;
    for (const [k, v] of Object.entries(byKind)) console.log(`    ${k}: ${v}`);
    // 最初 3 件だけ詳細
    for (const i of r.issues.slice(0, 3)) console.log(`    ${JSON.stringify(i)}`);
  }

  await browser.close();
  process.exit(total > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(2);
});
