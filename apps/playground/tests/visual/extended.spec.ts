/**
 * Visual regression ... 拡張 preset (gantt / class / pie / c4 / mind / solidity)。
 *
 * これら preset は /catalog 配下に専用ページが無いため、 /visual-test-extended
 * (visual regression 専用 hidden page) を経由して render する。
 *
 * baseline 不一致 = gantt の bar position / pie の slice / c4 box layout / mind の
 *   radial 配置 等の崩れ regression。
 */
import { test, expect } from "@playwright/test";

const extended = [
  { slug: "ロ-ドマップ-dsl", label: "gantt (ロードマップ DSL)" },
  { slug: "uml-dsl", label: "class (UML DSL)" },
  { slug: "シェア-dsl", label: "pie (シェア DSL)" },
  { slug: "c4-dsl", label: "c4 (C4 DSL)" },
  { slug: "アイデア-dsl", label: "mind (アイデア DSL)" },
  // textDslCode ("Service call + write + emit") = 旧 solidity (ERC-20 transfer) の後継、
  // /visual-test-extended page 側 items で code preset として mount される。
  { slug: "service-call-write-emit", label: "code (Service call + write + emit)" },
];

const PAGE_URL = "/visual-test-extended";

test.describe("Visual regression - extended presets (/visual-test-extended)", () => {
  for (const { slug, label } of extended) {
    test(`extended ${label} SVG snapshot`, async ({ page }) => {
      await page.goto(PAGE_URL, { waitUntil: "networkidle" });
      await page.waitForSelector(`[data-cdl-diagram="${slug}"] svg`, { timeout: 10_000 });
      await page.waitForTimeout(800);
      const el = page.locator(`[data-cdl-diagram="${slug}"]`).first();
      // 日本語 slug は file 名で問題が出るため、 ascii safe な snapshot 名に変換
      const fileSlug = encodeURIComponent(slug).replace(/%/g, "_").slice(0, 60);
      await expect(el).toHaveScreenshot(`extended-${fileSlug}.png`, {
        maxDiffPixelRatio: 0.01,
        animations: "disabled",
      });
    });
  }
});
