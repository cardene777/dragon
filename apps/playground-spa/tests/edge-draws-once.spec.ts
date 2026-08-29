/**
 * 矢印が伸びるのは初めて出るシーンだけ、を実画面で確かめる (#1474)。
 *
 * 組み立てだけを見る検査では捕まらない。 伸ばすかは描き手が段の並びから決めており、
 * 図の中に `data-cdl-drawing` として出る = 実際に描かれた結果を読むしかない。
 *
 * **画面を人が見て気付いた**。 3 度続けて同じ形 (シーンが進むたびに既に見えている線が
 * 引き直される / まだ出番でない線が最初から見えている) を実機で指摘され、その都度直した。
 * 検査に落とさないと 4 度目が来る。
 */
import { test, expect, type Page } from "@playwright/test";

/** 段を持ち、矢印を段で光らせる見本。 図種ごとに骨格が違うので 4 つとも見る */
const 見本 = [
  { label: "クラス図", 矢印あり: true },
  { label: "ER図", 矢印あり: true },
  { label: "ステート図", 矢印あり: true },
  // 順序図は 1 枚の板で描き、言づては矢印ではなく板の中の行になる (#1466)
  { label: "シーケンス図", 矢印あり: false },
];

async function 見本を開く(page: Page, label: string): Promise<void> {
  await page.goto("catalog/presets", { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await page.locator("aside.catalog-sidebar").getByText(label, { exact: false }).first().click();
  await page.waitForTimeout(900);
}

/** その時点の図から、出ている矢印と伸びているかを読む */
async function 図を読む(page: Page): Promise<{ 本数: number; 伸びている: string[] }> {
  return page.evaluate(() => {
    const edges = [...document.querySelectorAll("[data-cdl-edge]")];
    return {
      本数: edges.length,
      伸びている: edges
        .filter((g) => g.getAttribute("data-cdl-drawing") === "true")
        .map((g) => g.getAttribute("data-cdl-edge-label") || g.getAttribute("data-cdl-edge") || ""),
    };
  });
}

test.describe("矢印が伸びるのは 1 度だけ (#1474)", () => {
  for (const { label, 矢印あり } of 見本) {
    test(`${label}`, async ({ page }) => {
      await 見本を開く(page, label);

      /*
       * **段は図の中から数える**。 札 (`PhaseChrome`) と図は別の更新で描かれるため、
       * 境目で 1 コマずれる (実測 = 暗い地の表の図で「シーン 3 なのに 4 の矢印が伸びている」
       * と読めた)。 出ている矢印の本数はその時点の図そのものなので、ずれない。
       */
      const 伸びた段 = new Map<number, Set<string>>();
      for (let i = 0; i < 90; i++) {
        const { 本数, 伸びている } = await 図を読む(page);
        if (伸びている.length > 0) {
          const set = 伸びた段.get(本数) ?? new Set<string>();
          for (const x of 伸びている) set.add(x);
          伸びた段.set(本数, set);
        }
        await page.waitForTimeout(200);
      }

      if (!矢印あり) {
        expect((await 図を読む(page)).本数, "板の図に矢印がある").toBe(0);
        return;
      }

      // 矢印ごとに「伸びた段」 を数える。 2 つ以上あれば引き直している
      const 段の数 = new Map<string, number>();
      for (const set of 伸びた段.values()) {
        for (const 名 of set) 段の数.set(名, (段の数.get(名) ?? 0) + 1);
      }

      expect(段の数.size, "矢印が 1 本も伸びていない (検査が空振りしている)").toBeGreaterThan(0);

      const 引き直し = [...段の数.entries()]
        .filter(([, n]) => n > 1)
        .map(([名, n]) => `${名} (${n} 段)`);
      expect(引き直し, `既に見えている矢印が引き直されている: ${引き直し.join(", ")}`).toEqual([]);
    });
  }
});
