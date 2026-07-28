import { test, expect } from "@playwright/test";

/**
 * 全 diagram type で editor の基本操作が成立することを保証する (CAR-2160)。
 *
 * type ごとに lane / node の id 規約が違う (sequence は `{slug}-header`、 flow は素の slug、
 * state は `lane-{slug}`、 gantt は `gantt-{slug}`) ため、 1 type で動いても他が動く保証がない。
 * sample を順に開いて、 選択 / 移動 / 図の倍率 / 文字倍率 の 4 操作を全 type で確認する。
 */

const BASE_URL = process.env.AI_VERIFY_BASE_URL ?? "http://localhost:4323";
test.use({ baseURL: BASE_URL, viewport: { width: 1920, height: 1080 } });

/** sidebar の「サンプル」 tab から slug 指定で開く。 */
async function openSample(page: import("@playwright/test").Page, slug: string): Promise<void> {
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
  await page.getByRole("tab", { name: "サンプル" }).click();
  await page.waitForTimeout(300);
  const btn = page.locator(`[data-testid="editor-sample-${slug}"]`).first();
  if ((await btn.count()) === 0) throw new Error(`sample not found: ${slug}`);
  await btn.click();
  await page.waitForTimeout(1800);
}

/** 図の SVG (viewBox を持つもの) を返す。 icon の SVG を掴まないための絞り込み。 */
const DIAGRAM_SVG = '[data-testid="editor-preview-stage"] svg[viewBox]';

/** 対象 type の代表 sample。 label の部分一致で引く。 */
const TYPES: Array<{ type: string; label: string }> = [
  { type: "sequence", label: "sequence" },
  { type: "flow", label: "flow" },
  { type: "swimlane", label: "swimlane" },
  { type: "topology", label: "topology" },
  { type: "er", label: "er" },
  { type: "state", label: "state-machine" },
  { type: "class", label: "class" },
  { type: "gantt", label: "gantt" },
  { type: "mind", label: "mind" },
  { type: "pie", label: "pie" },
  { type: "c4", label: "c4" },
];

for (const { type, label } of TYPES) {
  test(`全 type: ${type} = 要素を click して選択できる`, async ({ page }) => {
    await openSample(page, label);
    const node = page.locator("[data-cdl-node]").first();
    const bb = await node.boundingBox();
    if (!bb) throw new Error(`${type}: node bbox null`);
    await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await page.waitForTimeout(350);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(500);
    expect(await page.locator("[data-cdl-selection-ui]").count(), `${type} の選択 UI`).toBeGreaterThan(0);
  });

  test(`全 type: ${type} = 要素を drag すると DSL に座標が書かれる`, async ({ page }) => {
    await openSample(page, label);
    const before = await page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");
    const node = page.locator("[data-cdl-node]").first();
    const bb = await node.boundingBox();
    if (!bb) throw new Error(`${type}: node bbox null`);
    await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await page.waitForTimeout(350);
    await page.mouse.down();
    await page.mouse.move(bb.x + bb.width / 2 + 70, bb.y + bb.height / 2, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(900);
    const after = await page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");
    expect(after, `${type} の DSL が変わる`).not.toBe(before);
    expect(after, `${type} に posX が書かれる`).toContain("posX");
  });

  test(`全 type: ${type} = 図の倍率が等比で効く`, async ({ page }) => {
    await openSample(page, label);
    // 測るのは **実描画サイズ** (getBoundingClientRect)。
    //
    // 以前はここで viewBox 属性を測っていたが、 それでは倍率が効いたことにならない。
    // viewBox を k 倍すると表示倍率が 1/k になるので、 中身も k 倍していると両者が
    // 打ち消し合って画面は 1 pixel も変わらない。 属性は増えるので test は通ってしまう。
    const size = async (): Promise<{ w: number; h: number; vb: string }> =>
      await page.evaluate((sel) => {
        const svg = document.querySelector(sel)!;
        const r = svg.getBoundingClientRect();
        return { w: r.width, h: r.height, vb: svg.getAttribute("viewBox")! };
      }, DIAGRAM_SVG);
    const b = await size();
    await page.locator('[data-testid="editor-diagram-scale-up"]').click();
    await page.waitForTimeout(1200);
    const a = await size();
    // 縦横とも拡大し、 縦横比が保たれる (歪まない)
    expect(a.w, `${type} の描画幅`).toBeGreaterThan(b.w);
    expect(a.h, `${type} の描画高さ`).toBeGreaterThan(b.h);
    expect(Math.abs(a.w / a.h - b.w / b.h), `${type} の縦横比`).toBeLessThan(0.01);
    // 1 段 = 1.25 倍。 「大きくなった」 だけでなく倍率どおりであることまで見る。
    expect(a.w / b.w, `${type} の倍率`).toBeCloseTo(1.25, 2);
    // 座標系は変えない (当たり判定や座標の読み書きが倍率で狂わない)
    expect(a.vb, `${type} の viewBox`).toBe(b.vb);
  });

  test(`全 type: ${type} = 文字サイズを一律で変えられる`, async ({ page }) => {
    await openSample(page, label);
    const font = async (): Promise<number> =>
      await page.evaluate((sel) => {
        const t = document.querySelector(`${sel} text`);
        return t ? parseFloat(getComputedStyle(t).fontSize) : 0;
      }, DIAGRAM_SVG);
    const b = await font();
    expect(b, `${type} に text がある`).toBeGreaterThan(0);
    await page.locator('[data-testid="editor-font-scale-up"]').click();
    await page.waitForTimeout(700);
    expect(await font(), `${type} の文字`).toBeGreaterThan(b);
  });
}

test("sequence では縦に drag しても縦位置が変わらない (時系列軸を壊さない)", async ({ page }) => {
  await openSample(page, "sequence");
  const y = async (): Promise<number> =>
    await page.evaluate(() => document.querySelector("[data-cdl-node]")!.getBoundingClientRect().y);
  const b = await y();
  const node = page.locator("[data-cdl-node]").first();
  const bb = await node.boundingBox();
  await page.mouse.move(bb!.x + bb!.width / 2, bb!.y + bb!.height / 2);
  await page.waitForTimeout(350);
  await page.mouse.down();
  await page.mouse.move(bb!.x + bb!.width / 2, bb!.y + bb!.height / 2 + 120, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(900);
  // 縦の drag は無視される = 位置がほぼ変わらない
  expect(Math.abs((await y()) - b)).toBeLessThan(10);
});

test("flow では縦にも drag できる (時系列軸を持たない type)", async ({ page }) => {
  await openSample(page, "flow");
  const before = await page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");
  const node = page.locator("[data-cdl-node]").first();
  const bb = await node.boundingBox();
  await page.mouse.move(bb!.x + bb!.width / 2, bb!.y + bb!.height / 2);
  await page.waitForTimeout(350);
  await page.mouse.down();
  await page.mouse.move(bb!.x + bb!.width / 2, bb!.y + bb!.height / 2 + 100, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(900);
  const after = await page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");
  expect(after).not.toBe(before);
  expect(after).toContain("posY");
});

/**
 * 図全体を拡大した時、 canvas に置いた部品 (overlay parts) も一緒に拡大する。
 *
 * 部品は cdl の図と同じ world 座標に置かれるが、 cdl の SVG は 1 world unit = 倍率 k px で
 * 描かれる。 部品側に k を掛けないと図だけが伸びて部品がその場に取り残される。
 *
 * 倍率が画面上で何も変えなかった間は、 この不整合は起こりようがなかった (どちらも動かない)。
 * 倍率が効くようになって初めて表に出る。
 */

/** 部品を 1 つ canvas に置く。 */
async function dropPart(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);
  await page.locator('[data-testid="editor-parts-tab"]').click();
  await page.waitForTimeout(400);
  const stage = page.locator('[data-testid="editor-preview-stage"]');
  await page.locator('[data-testid="editor-part-item-parts-achievement"]').dragTo(stage, {
    targetPosition: { x: 300, y: 300 },
  });
  await page.waitForTimeout(1000);
}

test("図を拡大すると canvas の部品も同じ倍率で拡大する", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await dropPart(page);

  const read = async () =>
    await page.evaluate(() => {
      const node = document.querySelector("[data-cdl-node]")!.getBoundingClientRect();
      const part = document.querySelector("[data-overlay-part]")!.getBoundingClientRect();
      return { nodeW: node.width, nodeH: node.height, partW: part.width, partH: part.height };
    });

  const before = await read();
  await page.locator('[data-testid="editor-diagram-scale-up"]').click();
  await page.waitForTimeout(1200);
  const after = await read();

  // 図と部品が同じ倍率で拡大する (片方だけ動くと部品が図から外れる)
  expect(after.nodeW / before.nodeW, "図の倍率").toBeCloseTo(1.25, 2);
  expect(after.partW / before.partW, "部品の倍率").toBeCloseTo(1.25, 2);
  expect(after.partH / before.partH, "部品の縦倍率").toBeCloseTo(1.25, 2);
  expect(errors, "JS エラー").toEqual([]);
});

test("拡大した状態でも部品を drag した分だけ動く", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await dropPart(page);
  await page.locator('[data-testid="editor-diagram-scale-up"]').click();
  await page.waitForTimeout(1200);

  // client 座標 → world 座標の変換に倍率を入れ忘れると、 倍率の分だけ移動量がずれる
  // (1.25 倍なら指定の 1.25 倍動く = 100px 指定で 125px 動く)。
  //
  // shift 押下で 20 world unit の grid 吸着を切る。 吸着したままだと丸め分の許容が
  // 必要になり、 倍率を掛け忘れた時のずれ (25px) が許容内に収まって検知できない。
  const part = page.locator("[data-overlay-part]").first();
  const b = (await part.boundingBox())!;
  await page.keyboard.down("Shift");
  await page.mouse.move(b.x + 20, b.y + 20);
  await page.mouse.down();
  await page.mouse.move(b.x + 20 + 100, b.y + 20 + 60, { steps: 10 });
  await page.mouse.up();
  await page.keyboard.up("Shift");
  await page.waitForTimeout(700);
  const a = (await part.boundingBox())!;

  expect(a.x - b.x, "横の移動量").toBeCloseTo(100, 0);
  expect(a.y - b.y, "縦の移動量").toBeCloseTo(60, 0);
  expect(errors, "JS エラー").toEqual([]);
});

test("拡大した状態で図の要素を drag しても drag した分だけ動く", async ({ page }) => {
  // 図枠 (viewBox) の移動を打ち消す補正が、 倍率込みで計算されているかを見る。
  //
  // 補正量は `pan × k × Δ枠原点`。 k を落とすと倍率を上げた時だけ補正が足りなくなり、
  // 動かした要素の移動量が指定より小さくなる。 倍率 1 では k = 1 なので、 倍率を
  // 上げた状態で測らないとこの取りこぼしは見えない。
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await openSample(page, "sequence");
  await page.locator('[data-testid="editor-diagram-scale-up"]').click();
  await page.waitForTimeout(1200);

  const header = page.locator('[data-cdl-node="client-header"]').first();
  const b = (await header.boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.waitForTimeout(300);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 + 150, b.y + b.height / 2, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(1000);
  const a = (await header.boundingBox())!;

  // drag した 150px 分だけ動く (補正が足りないと 150 未満になる)
  expect(a.x - b.x, "横の移動量").toBeGreaterThan(120);
  expect(a.x - b.x, "横の移動量").toBeLessThan(180);
  expect(errors, "JS エラー").toEqual([]);
});
