import { test, expect } from "@playwright/test";

/**
 * Ethereum 解説図の描画保証 (CAR-2160)。
 *
 * これらの図は「数値が動く様子」 が本体なので、 静止した DOM の有無だけでは
 * 意味を検証できない。 phase を進めた後の値と図形を実測する。
 *
 * 実装中に踏んだ 2 つの落とし穴を detector として固定する。
 *
 * 1. 円弧の `sweepMax` を 360 にすると始点と終点が重なり SVG が何も描かない
 *    (実測 = path の bbox 幅 0)。 270 度に収める必要がある
 * 2. `sweepMax` に % 値 (100) を渡すと 100 度分しか使われず弧が欠けて見える
 */

const BASE_URL = process.env.AI_VERIFY_BASE_URL ?? "http://localhost:4323";
test.use({ baseURL: BASE_URL, viewport: { width: 1920, height: 1200 } });

const DIAGRAMS = ["erc20Transfer", "eip1559Gas", "erc4337Flow", "blockProduction"] as const;

async function openDiagram(page: import("@playwright/test").Page, id: string): Promise<void> {
  await page.goto("/catalog/ethereum");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
  await page.getByText(id, { exact: true }).first().click();
  await page.waitForTimeout(1500);
}

test("カタログに 4 図が並ぶ", async ({ page }) => {
  await page.goto("/catalog/ethereum");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);
  for (const id of DIAGRAMS) {
    expect(await page.getByText(id, { exact: true }).count(), id).toBeGreaterThan(0);
  }
});

for (const id of DIAGRAMS) {
  test(`${id} = 図が描画され JS エラーが出ない`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await openDiagram(page, id);
    const svg = page.locator("svg[viewBox]").last();
    const box = await svg.boundingBox();
    expect(box, `${id} の SVG`).not.toBeNull();
    expect(box!.width, `${id} の幅`).toBeGreaterThan(200);
    expect(errors, `${id} の JS エラー`).toEqual([]);
  });

  test(`${id} = phase が進むと値が変わる`, async ({ page }) => {
    await openDiagram(page, id);
    const snapshot = async (): Promise<string> =>
      await page.evaluate(() => {
        // 動く要素 (波の水位 / 円弧の角度) を文字列化して比較する。
        // page 内には thumbnail の SVG も居るので、 図形を持つものだけを対象にする。
        const shapes = Array.from(document.querySelectorAll('[data-cdl-shape] path, [data-cdl-shape] rect'));
        return shapes.map((s) => s.getAttribute("d") ?? s.getAttribute("y") ?? "").join("|");
      });
    const before = await snapshot();
    await page.waitForTimeout(6000);
    const after = await snapshot();
    expect(after, `${id} の図形が phase で変化する`).not.toBe(before);
  });
}

test("円弧は実体のある弧として描かれる (sweepMax 360 だと消える)", async ({ page }) => {
  // blockProduction の「賛成の割合」 は円弧。 phase を進めて値を持たせてから測る。
  await openDiagram(page, "blockProduction");
  await page.waitForTimeout(9000);
  const arc = await page.evaluate(() => {
    const g = document.querySelector('[data-cdl-shape="arc"]');
    if (!g) return null;
    const r = (g as SVGGraphicsElement).getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), paths: g.querySelectorAll("path").length };
  });
  expect(arc, "円弧が存在する").not.toBeNull();
  // 始点と終点が重なると bbox 幅 0 になる = 何も描かれていない
  expect(arc!.w, "円弧の幅").toBeGreaterThan(30);
  expect(arc!.h, "円弧の高さ").toBeGreaterThan(30);
});

test("波は水位が上下する (level / amplitude の比で決まる)", async ({ page }) => {
  await openDiagram(page, "erc20Transfer");
  const waterY = async (): Promise<number[]> =>
    await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-cdl-shape="wave"]')).map((g) => {
        const r = (g as SVGGraphicsElement).getBoundingClientRect();
        return Math.round(r.height);
      }));
  const before = await waterY();
  // 送り手が減り受け手が増える phase まで進める
  await page.waitForTimeout(8000);
  const after = await waterY();
  expect(before.length, "波が 2 つある").toBe(2);
  // 送り手 (0 番目) と受け手 (1 番目) が逆方向に動く
  expect(after[0] !== before[0] || after[1] !== before[1], "水位が変わる").toBe(true);
});
