import { test, expect } from "@playwright/test";

/**
 * 公開前の a11y / 表示崩れ確認。
 *
 * 自動 test で拾えるのは機械的に判定できる部分だけ (代替テキストの有無、 対比、
 * 横スクロールの発生、 キーボード到達性)。 見た目の良し悪しは別途目視で確認する。
 */

const BASE = process.env.PROD_BASE_URL ?? "http://localhost:4324/dragon";
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

test("a11y: toolbar のボタンに名前がある (icon だけにしない)", async ({ page }) => {
  await page.goto(`${BASE}/editor`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);
  // 部品を置いて選択し toolbar を出す
  await page.locator('[data-testid="editor-parts-tab"]').click();
  await page.waitForTimeout(400);
  const stage = page.locator('[data-testid="editor-preview-stage"]');
  await page.locator('[data-testid="editor-part-item-parts-achievement"]').dragTo(stage, { targetPosition: { x: 300, y: 300 } });
  await page.waitForTimeout(900);
  const ov = page.locator("[data-overlay-part]").first();
  const b = await ov.boundingBox();
  await page.mouse.move(b!.x + b!.width / 2, b!.y + b!.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(500);
  const unnamed = await page.evaluate(() =>
    Array.from(document.querySelectorAll("[data-overlay-toolbar-btn]"))
      .filter((el) => !(el.getAttribute("aria-label") ?? "").trim())
      .map((el) => el.getAttribute("data-overlay-toolbar-btn") ?? "?"));
  expect(unnamed, "名前のない toolbar ボタン").toEqual([]);
});
