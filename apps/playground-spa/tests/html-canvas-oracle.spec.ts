/**
 * HTML div canvas independent oracle test (CAR-1965、 test 品質改善)。
 *
 * user フィードバック「意味のないテストしてやったと言われても意味ない」 への応答。
 * html-canvas-drag.spec / html-canvas-node-drag.spec の T2/T3/T9 は mirror + element.style.transform
 * に依存した自己参照的 test だったため、 本 spec で以下 2 経路の独立検証を追加。
 *
 * - T14 = @cardenelabs/cdl の compile() を独立 oracle として呼出し、 viewport rect + laid.viewBox から
 *   期待 scale/tx/ty を canonical fit formula (PADDING_RATIO=0.04) で直接算出、 全 lane の
 *   left/top/width/height + 全 node の中心座標 (F1 F1 中心座標契約) / w / h を予測位置と比較。
 *   ID set の完全一致も先に assert して DOM 欠落を検出できる強い oracle。
 * - T15 = 特定 sample (「注文チェックアウト (sequence)」) を targeted click → expect.poll で DSL 変化
 *   + lane set 変化を待機 → 新 DSL の cdl oracle と DOM 一致を verify。 bidirectional sync 経路の canvas 側。
 *
 * Round 1 Codex adversarial review 4 findings (F1 fit 逆算 / F2 continue skip / F3 sample skip /
 * F4 曖昧 sample) 全対応済。
 *
 * baseURL = 4323 (vite dev)。
 */
import { test, expect, type Page } from "@playwright/test";
import { compile, type LaidDiagram } from "@cardenelabs/cdl";
import { textDslToDiagram } from "@cardenelabs/dragon";

const LANE_SELECTOR = "[data-html-canvas-lane]";
const NODE_SELECTOR = "[data-html-canvas-node]";
const VIEWPORT_SELECTOR = "[data-testid='editor-preview-stage']";
const FIT_PADDING_RATIO = 0.04; // HtmlDivCanvasEditor.doFit の canonical 定数と同期

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

async function getViewportRect(page: Page): Promise<{ left: number; top: number; width: number; height: number }> {
  const r = await page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  }, VIEWPORT_SELECTOR);
  if (!r) throw new Error(`viewport element ${VIEWPORT_SELECTOR} not found`);
  return r;
}

/**
 * viewport rect + laid.viewBox から canonical fit formula で期待 transform (scale / tx / ty) を直接算出。
 * HtmlDivCanvasEditor.doFit と同じ formula を独立に実装、 2 点 fit の自己 fit を回避して true independent oracle にする。
 * tx / ty は viewport の client 起点 (getBoundingClientRect 系) に変換済 = world_x * scale + tx = CSS left の関係。
 */
function computeExpectedFitTransform(
  viewportRect: { left: number; top: number; width: number; height: number },
  viewBox: LaidDiagram["viewBox"],
): { scale: number; tx: number; ty: number } {
  const availW = viewportRect.width * (1 - FIT_PADDING_RATIO * 2);
  const availH = viewportRect.height * (1 - FIT_PADDING_RATIO * 2);
  const scale = Math.min(availW / viewBox.w, availH / viewBox.h);
  const tx = viewportRect.left + (viewportRect.width - viewBox.w * scale) / 2 - viewBox.x * scale;
  const ty = viewportRect.top + (viewportRect.height - viewBox.h * scale) / 2 - viewBox.y * scale;
  return { scale, tx, ty };
}

/**
 * lane / node の期待 CSS 位置 / サイズと DOM 実 rendered 位置を全件比較。
 * F1 対応 = 2 点 fit ではなく viewport + viewBox から直接算出した transform で予測、 全 lane の
 * width/height も verify。 F2 対応 = ID set 完全一致を先に assert、 lookup 不成立は即 fail。
 */
function assertCdlOracleAgainstDom(
  laid: LaidDiagram,
  laneRects: DomLaneRect[],
  nodeRects: DomNodeRect[],
  transform: { scale: number; tx: number; ty: number },
  tolerancePx: { lane: number; node: number },
): { maxLaneDev: number; maxNodeDev: number } {
  // F2 対応 = expected ID set vs DOM ID set の完全一致 (欠落 / 余剰即 fail)
  const expectedLaneIds = new Set(laid.lanes.map((l) => l.id));
  const domLaneIds = new Set(laneRects.map((r) => r.slug));
  expect(domLaneIds, `lane ID set が cdl expected と一致`).toEqual(expectedLaneIds);
  // node は parts (`__` 含) を skip して比較 (F3 CAR-1952 契約)
  const expectedNodeIds = new Set(laid.nodes.filter((n) => !n.id.includes("__")).map((n) => n.id));
  const domNodeIds = new Set(nodeRects.map((r) => r.nodeId));
  expect(domNodeIds, `node ID set が cdl expected と一致 (parts skip 込)`).toEqual(expectedNodeIds);
  expect(expectedNodeIds.size, `期待 node 数 >= 1 (test fixture sanity)`).toBeGreaterThanOrEqual(1);
  // F1 対応 = 全 lane の left/top/width/height を canonical transform 経由で予測 → DOM と比較
  let maxLaneDev = 0;
  for (const lane of laid.lanes) {
    const dom = laneRects.find((r) => r.slug === lane.id);
    expect(dom, `lane ${lane.id} rect found`).toBeDefined();
    const predictedLeft = lane.x * transform.scale + transform.tx;
    const predictedTop = lane.y * transform.scale + transform.ty;
    const predictedW = lane.width * transform.scale;
    const predictedH = lane.height * transform.scale;
    const devL = Math.abs(dom!.left - predictedLeft);
    const devT = Math.abs(dom!.top - predictedTop);
    const devW = Math.abs(dom!.width - predictedW);
    const devH = Math.abs(dom!.height - predictedH);
    maxLaneDev = Math.max(maxLaneDev, devL, devT, devW, devH);
  }
  expect(maxLaneDev, `lane oracle vs DOM max deviation ${maxLaneDev}px CSS`).toBeLessThanOrEqual(tolerancePx.lane);
  // node は中心座標契約 (CAR-1952 F1)、 render 左上 = cx - w/2 * scale
  let maxNodeDev = 0;
  for (const node of laid.nodes) {
    if (node.id.includes("__")) continue;
    const dom = nodeRects.find((r) => r.nodeId === node.id);
    expect(dom, `node ${node.id} rect found (parts でない)`).toBeDefined();
    const predictedCenterX = node.cx * transform.scale + transform.tx;
    const predictedCenterY = node.cy * transform.scale + transform.ty;
    const predictedW = node.w * transform.scale;
    const predictedH = node.h * transform.scale;
    const actualCenterX = dom!.left + dom!.width / 2;
    const actualCenterY = dom!.top + dom!.height / 2;
    const devCX = Math.abs(actualCenterX - predictedCenterX);
    const devCY = Math.abs(actualCenterY - predictedCenterY);
    const devW = Math.abs(dom!.width - predictedW);
    const devH = Math.abs(dom!.height - predictedH);
    maxNodeDev = Math.max(maxNodeDev, devCX, devCY, devW, devH);
  }
  expect(maxNodeDev, `node oracle vs DOM max deviation ${maxNodeDev}px CSS`).toBeLessThanOrEqual(tolerancePx.node);
  return { maxLaneDev, maxNodeDev };
}

test.describe("HTML div canvas independent oracle (CAR-1965 test 品質改善)", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => { void d.accept(); });
    await page.goto("/editor?canvas=html", { waitUntil: "networkidle" });
    await page.waitForSelector(LANE_SELECTOR, { timeout: 10000 });
    await page.waitForTimeout(500);
  });

  test("T14 = cdl compile 独立 oracle と DOM 実 rendered 位置が canonical fit transform で全件一致 (canvas 描画忠実性)", async ({ page }) => {
    // 1. CodeMirror から現在の DSL を読取
    const dsl = await getEditorText(page);
    expect(dsl.length).toBeGreaterThan(50);
    // 2. @cardenelabs/cdl + @cardenelabs/dragon を独立に呼出し、 期待 laid を計算
    const diagram = textDslToDiagram(dsl);
    const laid = compile(diagram);
    expect(laid.lanes.length).toBeGreaterThanOrEqual(2);
    // 3. DOM 側 viewport rect + lane rect + node rect を測定
    const viewportRect = await getViewportRect(page);
    const laneRects = await getDomLaneRects(page);
    const nodeRects = await getDomNodeRects(page);
    // 4. viewport + viewBox から canonical fit transform を直接算出 (2 点 fit ではない)
    const transform = computeExpectedFitTransform(viewportRect, laid.viewBox);
    expect(Number.isFinite(transform.scale)).toBe(true);
    expect(transform.scale, `scale > 0`).toBeGreaterThan(0);
    // 5. 全 lane / 全 node について予測位置 + サイズ と DOM 実位置の一致を verify (ID set 完全一致含む)
    //    tolerance = lane 3px CSS (rendered position + width/height 一致)、 node 8px CSS
    //    (中心座標契約 + w/h、 CSS 装飾 padding/border が bounding rect 経由で微差を生むため 5→8 buffer)
    assertCdlOracleAgainstDom(laid, laneRects, nodeRects, transform, { lane: 3, node: 8 });
  });

  test("T15 = 「注文チェックアウト」 sample click → DSL 変化 + canvas oracle 一致 (bidirectional sync canvas 側)", async ({ page }) => {
    // 1. 初期 DSL + lane 集合を capture
    const dslBefore = await getEditorText(page);
    const rectsBefore = await getDomLaneRects(page);
    const laneNamesBefore = new Set(rectsBefore.map((r) => r.slug));
    // 2. 特定 sample を targeted click (F4 = 曖昧 sample 選択回避)
    //    「注文チェックアウト」 = Client / Cart / Payment、 default の Client/API/DB と全 actor 名が異なる
    const targetLabel = "注文チェックアウト (sequence)";
    const nextSample = await page.$(`[data-sample-label="${targetLabel}"]`);
    expect(nextSample, `sample button "${targetLabel}" が存在する (fixture sanity)`).not.toBeNull();
    await nextSample!.click();
    // 3. expect.poll で DSL 変化 + lane 集合変化を待機 (F4 = 固定 sleep 廃止、 flaky 抑制)
    await expect.poll(
      async () => {
        const dsl = await getEditorText(page);
        const rects = await getDomLaneRects(page);
        const laneNames = new Set(rects.map((r) => r.slug));
        return { dslChanged: dsl !== dslBefore, laneSetChanged: !setsEqual(laneNames, laneNamesBefore) };
      },
      { timeout: 5000, message: "sample 切替後 DSL と canvas lane 集合が更新されるまで待機" },
    ).toEqual({ dslChanged: true, laneSetChanged: true });
    // 4. 新 DSL でも cdl oracle と DOM 実位置が一致すること (T14 相当を新 sample にも適用)
    const dslAfter = await getEditorText(page);
    const diagramAfter = textDslToDiagram(dslAfter);
    const laidAfter = compile(diagramAfter);
    const viewportRectAfter = await getViewportRect(page);
    const laneRectsAfter = await getDomLaneRects(page);
    const nodeRectsAfter = await getDomNodeRects(page);
    const transformAfter = computeExpectedFitTransform(viewportRectAfter, laidAfter.viewBox);
    expect(Number.isFinite(transformAfter.scale)).toBe(true);
    assertCdlOracleAgainstDom(laidAfter, laneRectsAfter, nodeRectsAfter, transformAfter, { lane: 3, node: 8 });
  });
});

function setsEqual<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}
