import type { Page } from "@playwright/test";

/**
 * cdl diagram SVG が完全に安定化した状態を待つ共通 helper。
 *
 * flaky 予防の 4 段構え:
 *   1. networkIdle ... 初回 asset load 完了
 *   2. selector attached ... [data-cdl-diagram=<slug>] svg が DOM に出現
 *   3. node count > 0 ... svg 内に data-cdl-node が 1 個以上 (hydration + initial phase 完了)
 *   4. fonts.ready ... Inter / Newsreader font 読込み完了 (text bbox 変動防止)
 *
 * ここまで揃えば SVG path / text 位置は安定、 screenshot diff の flaky はほぼ発生しない。
 * waitForTimeout の任意 sleep は使わず、 条件明示で待つ。
 */
export async function waitForCdlDiagram(
  page: Page,
  slug: string,
  options: { timeout?: number } = {},
): Promise<void> {
  const timeout = options.timeout ?? 10_000;
  const selector = `[data-cdl-diagram="${slug}"] svg`;
  await page.waitForSelector(selector, { state: "attached", timeout });
  await page.waitForFunction(
    (sel) => {
      const svg = document.querySelector(sel);
      if (!svg) return false;
      const nodes = svg.querySelectorAll("[data-cdl-node]");
      return nodes.length > 0;
    },
    selector,
    { timeout },
  );
  await page.evaluate(() => document.fonts.ready);
}

/**
 * page 内の全 cdl diagram が安定化を待つ (catalog page 等 複数 diagram mount 用)。
 *
 * diagram が 0 件の page (index 系 category link のみ) では待たずに fonts.ready のみ実行する。
 */
export async function waitForAllCdlDiagrams(
  page: Page,
  options: { timeout?: number } = {},
): Promise<void> {
  const timeout = options.timeout ?? 10_000;
  // 0 件許容 = index 系 page は diagram を持たない、 その場合は wait せず即 fonts.ready へ
  const hasDiagrams = await page.evaluate(
    () => document.querySelectorAll("[data-cdl-diagram]").length > 0,
  );
  if (hasDiagrams) {
    await page.waitForFunction(
      () => {
        const diagrams = document.querySelectorAll("[data-cdl-diagram]");
        for (const d of diagrams) {
          const svg = d.querySelector("svg");
          if (!svg) return false;
          const nodes = svg.querySelectorAll("[data-cdl-node]");
          if (nodes.length === 0) return false;
        }
        return true;
      },
      undefined,
      { timeout },
    );
  }
  await page.evaluate(() => document.fonts.ready);
}
