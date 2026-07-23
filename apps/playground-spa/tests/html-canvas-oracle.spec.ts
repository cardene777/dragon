/**
 * HTML div canvas independent oracle test (CAR-1965、 test 品質改善)。
 *
 * user フィードバック「意味のないテストしてやったと言われても意味ない」 への応答。
 * html-canvas-drag.spec / html-canvas-node-drag.spec の T2/T3/T9 は mirror + element.style.transform
 * に依存した自己参照的 test だったため、 本 spec で以下 2 経路の独立検証を追加。
 *
 * - T14 = @cardenelabs/cdl の compile() を独立 oracle として呼出し、 期待 world 座標と DOM 実 rendered
 *   位置の一致を linear transform 経由で検証。 canvas が cdl.compile() 出力を忠実に描画しているかを
 *   自作 code の mirror に依存せず verify する経路。
 * - T15 = DSL を CodeMirror 経由で書換 → canvas 更新の bidirectional sync を検証。 sample 切替 button を
 *   使って別 preset を load、 canvas の DOM 構造が新 sample に応じて更新されることを verify。
 *
 * baseURL = 4323 (vite dev)。
 */
import { test, expect, type Page } from "@playwright/test";
import { compile, type LaidDiagram } from "@cardenelabs/cdl";
import { textDslToDiagram } from "@cardenelabs/dragon";

const LANE_SELECTOR = "[data-html-canvas-lane]";
const NODE_SELECTOR = "[data-html-canvas-node]";

/**
 * CodeMirror の DSL 内容を行区切り付きで取得。 `.cm-content` textContent は line 間の改行を落とすため、
 * `.cm-line` の各要素を newline join で連結する経路を使う (cdl parse に line 情報必須のため)。
 */
async function getEditorText(page: Page): Promise<string> {
  return page.evaluate(() => {
    const lines = document.querySelectorAll(".cm-content .cm-line");
    return Array.from(lines).map((l) => l.textContent ?? "").join("\n");
  });
}

interface DomLaneRect {
  slug: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

interface DomNodeRect {
  nodeId: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

async function getDomLaneRects(page: Page): Promise<DomLaneRect[]> {
  return page.evaluate((sel) => {
    const out: Array<{ slug: string; left: number; top: number; width: number; height: number }> = [];
    for (const el of Array.from(document.querySelectorAll(sel))) {
      const slug = (el as HTMLElement).getAttribute("data-html-canvas-lane") ?? "";
      const r = (el as HTMLElement).getBoundingClientRect();
      out.push({ slug, left: r.left, top: r.top, width: r.width, height: r.height });
    }
    return out;
  }, LANE_SELECTOR);
}

async function getDomNodeRects(page: Page): Promise<DomNodeRect[]> {
  return page.evaluate((sel) => {
    const out: Array<{ nodeId: string; left: number; top: number; width: number; height: number }> = [];
    for (const el of Array.from(document.querySelectorAll(sel))) {
      const nodeId = (el as HTMLElement).getAttribute("data-html-canvas-node") ?? "";
      const r = (el as HTMLElement).getBoundingClientRect();
      out.push({ nodeId, left: r.left, top: r.top, width: r.width, height: r.height });
    }
    return out;
  }, NODE_SELECTOR);
}

/**
 * cdl compile 出力の laid.lanes から、 world 座標 → CSS pixel 座標 の linear transform を fit する。
 * 2 点 (最左 / 最右 の lane) を基準にして scale + offset を計算、 他 lane を fit して逸脱を verify。
 */
function fitWorldToCssTransform(
  laidLanes: LaidDiagram["lanes"],
  domRects: DomLaneRect[],
): { scale: number; offsetLeft: number; offsetTop: number; sampleCount: number } {
  // world 座標昇順で 2 点選ぶ (fit 精度を上げるため対角に近い pair を使う)
  const pairs: Array<{ laid: LaidDiagram["lanes"][number]; dom: DomLaneRect }> = [];
  for (const l of laidLanes) {
    const d = domRects.find((r) => r.slug === l.id);
    if (d) pairs.push({ laid: l, dom: d });
  }
  if (pairs.length < 2) {
    return { scale: NaN, offsetLeft: NaN, offsetTop: NaN, sampleCount: pairs.length };
  }
  // sort by world x ascending
  pairs.sort((a, b) => a.laid.x - b.laid.x);
  const leftmost = pairs[0]!;
  const rightmost = pairs[pairs.length - 1]!;
  const worldDx = rightmost.laid.x - leftmost.laid.x;
  if (worldDx === 0) {
    return { scale: NaN, offsetLeft: NaN, offsetTop: NaN, sampleCount: pairs.length };
  }
  const cssDx = rightmost.dom.left - leftmost.dom.left;
  const scale = cssDx / worldDx;
  // offset は左端の lane で算出、 world_x * scale + offset = css_left の関係
  const offsetLeft = leftmost.dom.left - leftmost.laid.x * scale;
  const offsetTop = leftmost.dom.top - leftmost.laid.y * scale;
  return { scale, offsetLeft, offsetTop, sampleCount: pairs.length };
}

test.describe("HTML div canvas independent oracle (CAR-1965 test 品質改善)", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => { void d.accept(); });
    await page.goto("/editor?canvas=html", { waitUntil: "networkidle" });
    await page.waitForSelector(LANE_SELECTOR, { timeout: 10000 });
    await page.waitForTimeout(500);
  });

  test("T14 = cdl compile 独立 oracle と DOM 実 rendered 位置が linear transform で一致 (canvas 描画忠実性)", async ({ page }) => {
    // 1. CodeMirror から現在の DSL を読取
    const dsl = await getEditorText(page);
    expect(dsl.length).toBeGreaterThan(50);
    // 2. @cardenelabs/cdl + @cardenelabs/dragon を独立に呼出し、 期待 laid を計算
    const diagram = textDslToDiagram(dsl);
    const laid = compile(diagram);
    expect(laid.lanes.length).toBeGreaterThanOrEqual(2);
    // 3. DOM 側の実 rendered 位置を測定
    const domRects = await getDomLaneRects(page);
    expect(domRects.length).toBe(laid.lanes.length);
    // 4. 世界座標 → CSS pixel の linear transform を fit
    const transform = fitWorldToCssTransform(laid.lanes, domRects);
    expect(transform.sampleCount).toBeGreaterThanOrEqual(2);
    expect(Number.isFinite(transform.scale)).toBe(true);
    expect(transform.scale, `scale ${transform.scale} > 0`).toBeGreaterThan(0);
    // 5. 全 lane について transform の予測位置と DOM 実位置が 3px 以内一致 (実 rendered 忠実性)
    let maxDev = 0;
    for (const lane of laid.lanes) {
      const dom = domRects.find((r) => r.slug === lane.id);
      if (!dom) continue;
      const predictedCssLeft = lane.x * transform.scale + transform.offsetLeft;
      const predictedCssTop = lane.y * transform.scale + transform.offsetTop;
      const devX = Math.abs(dom.left - predictedCssLeft);
      const devY = Math.abs(dom.top - predictedCssTop);
      maxDev = Math.max(maxDev, devX, devY);
    }
    expect(maxDev, `cdl oracle vs DOM max deviation ${maxDev}px CSS`).toBeLessThanOrEqual(3);
    // 6. node 側も同じ transform で予測位置と DOM 実位置が 5px 以内一致
    //    (node は cx/cy 中心座標 + w/h、 render で cx - w/2 補正あり、 buffer 5px)
    const domNodes = await getDomNodeRects(page);
    let nodeMaxDev = 0;
    for (const node of laid.nodes) {
      if (node.id.includes("__")) continue; // parts skip (Round 1 F3)
      const dom = domNodes.find((r) => r.nodeId === node.id);
      if (!dom) continue;
      // predicted CSS center = (cx * scale + offsetLeft, cy * scale + offsetTop)
      const predictedCssCX = node.cx * transform.scale + transform.offsetLeft;
      const predictedCssCY = node.cy * transform.scale + transform.offsetTop;
      const actualCssCX = dom.left + dom.width / 2;
      const actualCssCY = dom.top + dom.height / 2;
      const devX = Math.abs(actualCssCX - predictedCssCX);
      const devY = Math.abs(actualCssCY - predictedCssCY);
      nodeMaxDev = Math.max(nodeMaxDev, devX, devY);
    }
    expect(nodeMaxDev, `cdl node oracle vs DOM max deviation ${nodeMaxDev}px CSS`).toBeLessThanOrEqual(5);
  });

  test("T15 = sample 切替で canvas が新 DSL に応じて更新される (bidirectional sync の canvas 側)", async ({ page }) => {
    // 1. 初期 DSL + canvas 状態を capture
    const dslBefore = await getEditorText(page);
    const rectsBefore = await getDomLaneRects(page);
    const laneNamesBefore = new Set(rectsBefore.map((r) => r.slug));
    // 2. 別 sample (「注文チェックアウト」 = Client / Cart / Payment、 default の Client/API/DB と違う actor)
    //    をクリック
    const nextSample = await page.$('[data-testid^="editor-sample-"]:not(.active)');
    if (!nextSample) {
      // sample 切替 button が active でない別 sample が見つからない = skip (fixture 依存)
      test.skip();
      return;
    }
    await nextSample.click();
    // 3. debounce (300ms) + rAF settle を待つ
    await page.waitForTimeout(700);
    // 4. DSL が変わったこと
    const dslAfter = await getEditorText(page);
    expect(dslAfter).not.toBe(dslBefore);
    // 5. canvas 側 lane 構成が更新されたこと (異なる actor 名 or 数)
    const rectsAfter = await getDomLaneRects(page);
    const laneNamesAfter = new Set(rectsAfter.map((r) => r.slug));
    // 集合として異なる (追加 / 削除 / 名前変化)
    const same =
      laneNamesBefore.size === laneNamesAfter.size &&
      Array.from(laneNamesBefore).every((n) => laneNamesAfter.has(n));
    expect(same, `lane set が sample 切替で変わる before=${JSON.stringify([...laneNamesBefore])} after=${JSON.stringify([...laneNamesAfter])}`).toBe(false);
    // 6. 新 DSL でも cdl oracle と DOM が一致すること (T14 相当を新 sample にも適用)
    const diagramAfter = textDslToDiagram(dslAfter);
    const laidAfter = compile(diagramAfter);
    const transformAfter = fitWorldToCssTransform(laidAfter.lanes, rectsAfter);
    expect(transformAfter.sampleCount).toBeGreaterThanOrEqual(2);
    expect(Number.isFinite(transformAfter.scale)).toBe(true);
    let maxDevAfter = 0;
    for (const lane of laidAfter.lanes) {
      const dom = rectsAfter.find((r) => r.slug === lane.id);
      if (!dom) continue;
      const predictedCssLeft = lane.x * transformAfter.scale + transformAfter.offsetLeft;
      const predictedCssTop = lane.y * transformAfter.scale + transformAfter.offsetTop;
      maxDevAfter = Math.max(maxDevAfter, Math.abs(dom.left - predictedCssLeft), Math.abs(dom.top - predictedCssTop));
    }
    expect(maxDevAfter, `sample 切替後 cdl vs DOM ${maxDevAfter}px CSS`).toBeLessThanOrEqual(3);
  });
});
