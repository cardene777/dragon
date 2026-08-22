import { test, expect } from "@playwright/test";
import { PREVIEW_URL } from "../ports";

/**
 * 公開前の a11y / 表示崩れ確認。
 *
 * 自動 test で拾えるのは機械的に判定できる部分だけ (代替テキストの有無、 対比、
 * 横スクロールの発生、 キーボード到達性)。 見た目の良し悪しは別途目視で確認する。
 */

const BASE = process.env.PROD_BASE_URL ?? PREVIEW_URL;
const PAGES = ["/", "/editor", "/catalog/ethereum"];

test.use({ viewport: { width: 1440, height: 900 } });

for (const path of PAGES) {
  test(`a11y: ${path} — 画像と図に代替テキストがある`, async ({ page }) => {
    await page.goto(`${BASE}${path}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    const missing = await page.evaluate(() => {
      const out: string[] = [];
      document.querySelectorAll("img").forEach((el) => {
        if (!el.getAttribute("alt") && el.getAttribute("role") !== "presentation") {
          out.push(`img[src=${(el.getAttribute("src") ?? "").slice(0, 40)}]`);
        }
      });
      // 図の SVG は role="img" + aria-label を持つべき (装飾 icon は除く)
      document.querySelectorAll("svg[viewBox]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width < 60) return; // icon 相当は対象外
        const hasLabel = el.getAttribute("aria-label") || el.querySelector("title");
        if (!hasLabel) out.push(`svg[${Math.round(r.width)}x${Math.round(r.height)}]`);
      });
      return out;
    });
    expect(missing, `${path} の代替テキスト欠落`).toEqual([]);
  });

  test(`表示: ${path} — 横スクロールが出ない`, async ({ page }) => {
    await page.goto(`${BASE}${path}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    const overflow = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
    }));
    // 数 px の誤差は許容 (scrollbar 分)
    expect(overflow.scrollW - overflow.clientW, `${path} の横はみ出し`).toBeLessThan(20);
  });

  test(`表示: ${path} — 狭い画面でも横スクロールが出ない`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}${path}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    const overflow = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollW - overflow.clientW, `${path} の横はみ出し (390px)`).toBeLessThan(20);
  });
}

test("a11y: 操作可能な要素にキーボードで到達できる", async ({ page }) => {
  await page.goto(`${BASE}/editor`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);
  // Tab を数回押して focus が動くことを確認する
  const seen = new Set<string>();
  for (let i = 0; i < 12; i += 1) {
    await page.keyboard.press("Tab");
    const tag = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return "";
      return `${el.tagName}:${(el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 20)}`;
    });
    if (tag) seen.add(tag);
  }
  expect(seen.size, "Tab で到達できた要素数").toBeGreaterThanOrEqual(5);
});

