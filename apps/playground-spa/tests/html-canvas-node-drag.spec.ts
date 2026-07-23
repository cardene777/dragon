/**
 * HTML div canvas node drag behavior test (CAR-1952 Phase 2 PR 1 + Round 1 findings regression)。
 *
 * Phase 1 (CAR-1947、 PR #906) で lane drag は実装済、 Phase 2 PR 1 で node (sequence step / class /
 * flow node 等 sub-node) を HTML div として描画 + drag 可能化。
 *
 * Round 1 Codex adversarial review 7 findings 対応 (Phase 2 PR 1):
 * - F1 = 中心座標契約 (DSL posX/posY = 中心)、 render で cx - w/2 補正、 write-back で中心座標を渡す
 * - F2 = subKey === null の単一 node 経路で parent lane pin から除外
 * - F3 = parts merge sub-node (`alias__subId`) は node layer から除外
 * - F4 = origPosW/origPosH のみ渡す (自動計算 posW/posH は書換禁止)
 * - F5 = unused pinAllLanes 削除
 * - F6 = 本 spec に regression test 追加 (parts skip / pointercancel / multi-pointer)
 * - F7 = DSL index を 1 パス構築、 willChange は drag 中のみ
 *
 * baseURL = 4323 (vite dev)。
 */
import { test, expect, type Page } from "@playwright/test";

const NODE_SELECTOR = "[data-html-canvas-node]";
const CANVAS_TEST_MIRROR_KEY = "__htmlCanvasState";

interface NodeMirror {
  nodeId: string;
  laneSlug: string;
  actorName: string;
  subKey: string | null;
  worldCX: number;
  worldCY: number;
  worldW: number;
  worldH: number;
  origPosW: number | null;
  origPosH: number | null;
  kind: string;
  title: string;
}

interface LaneMirror {
  name: string;
  slug: string;
  worldX: number;
  worldY: number;
  worldW: number;
  worldH: number;
  origPosW: number | null;
  origPosH: number | null;
}

interface CanvasStateMirror {
  viewBox: { x: number; y: number; w: number; h: number } | null;
  viewportTransform: { tx: number; ty: number; scale: number };
  lanes: LaneMirror[];
  nodes: NodeMirror[];
}

async function readCanvasState(page: Page): Promise<CanvasStateMirror | null> {
  return page.evaluate((key) => {
    const mirror = (window as unknown as Record<string, CanvasStateMirror | undefined>)[key];
    return mirror ?? null;
  }, CANVAS_TEST_MIRROR_KEY);
}

async function getEditorText(page: Page): Promise<string> {
  return page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");
}

function parseTranslate3d(transform: string): { x: number; y: number } | null {
  const m = transform.match(/translate3d\((-?[\d.]+)px,\s*(-?[\d.]+)px/);
  if (!m) return null;
  return { x: parseFloat(m[1]!), y: parseFloat(m[2]!) };
}

async function getNodeCenter(page: Page, nodeId: string): Promise<{ x: number; y: number }> {
  return page.evaluate((id) => {
    const el = document.querySelector(`[data-html-canvas-node="${id}"]`) as HTMLElement | null;
    if (!el) throw new Error(`node not found: ${id}`);
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, nodeId);
}

test.describe("HTML div canvas node drag (CAR-1952 Phase 2 PR 1 + Round 1 regression)", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => { void d.accept(); });
    await page.goto("/editor", { waitUntil: "networkidle" });
    await page.waitForSelector(NODE_SELECTOR, { timeout: 10000 });
    await page.waitForTimeout(500);
  });

  test("T8 = node が HTML div として描画される、 parts sub-node (__ 含み) は除外される (F3)", async ({ page }) => {
    const mirror = await readCanvasState(page);
    expect(mirror).not.toBeNull();
    expect(mirror!.nodes.length).toBeGreaterThan(0);
    // F3 = mirror にも DOM にも parts sub-node (`alias__subId`) は含まれない
    for (const node of mirror!.nodes) {
      expect(node.nodeId.includes("__"), `${node.nodeId} が __ を含んでいない (parts skip)`).toBe(false);
    }
    // DOM 側 (可視 node div) も同数、 __ を含む selector は 0 個
    const nodeDivs = await page.$$(NODE_SELECTOR);
    expect(nodeDivs.length).toBe(mirror!.nodes.length);
    const partsDivs = await page.$$('[data-html-canvas-node*="__"]');
    expect(partsDivs.length).toBe(0);
    // 全 node の中心座標が有限数
    for (const node of mirror!.nodes) {
      expect(Number.isFinite(node.worldCX)).toBe(true);
      expect(Number.isFinite(node.worldCY)).toBe(true);
      expect(node.worldW).toBeGreaterThan(0);
      expect(node.worldH).toBeGreaterThan(0);
    }
  });

  test("T9 = node drag 3 条件 (CAR-1965 bounding rect 経由の実 CSS pixel verify)", async ({ page }) => {
    // CAR-1965 = 自己参照除去 = element.style.transform / mirror.worldCX ではなく getBoundingClientRect()
    // で drag 前 / drag 中 sample / drag 後 の 3 stage を実 CSS pixel で verify。
    const mirror0 = await readCanvasState(page);
    expect(mirror0).not.toBeNull();
    const targetNode = mirror0!.nodes.find((n) => n.subKey !== null && n.subKey.includes("header"))
      ?? mirror0!.nodes[0]!;
    const clientDeltaX = 80;
    const clientDeltaY = 50;

    // drag 前の実 rendered bounding rect
    const rectBefore = await page.evaluate((id) => {
      const el = document.querySelector(`[data-html-canvas-node="${id}"]`) as HTMLElement | null;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, width: r.width, height: r.height };
    }, targetNode.nodeId);
    expect(rectBefore).not.toBeNull();
    const start = { x: rectBefore!.left + rectBefore!.width / 2, y: rectBefore!.top + rectBefore!.height / 2 };

    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    // 条件 2 = drag 中 smooth 追従の CSS pixel sample
    const samples: Array<{ pointerX: number; pointerY: number; cssLeft: number; cssTop: number }> = [];
    for (let i = 1; i <= 15; i++) {
      const px = start.x + (clientDeltaX * i) / 15;
      const py = start.y + (clientDeltaY * i) / 15;
      await page.mouse.move(px, py);
      await page.evaluate(() => new Promise<void>((r) => window.requestAnimationFrame(() => window.requestAnimationFrame(() => r()))));
      const r = await page.evaluate((id) => {
        const el = document.querySelector(`[data-html-canvas-node="${id}"]`) as HTMLElement | null;
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return { left: rect.left, top: rect.top };
      }, targetNode.nodeId);
      // Round 1 F3 対応 = 要素消失 frame は即 fail、 sample 数完全一致を assert
      expect(r, `node ${targetNode.nodeId} が drag iter ${i} で消失していない`).not.toBeNull();
      samples.push({ pointerX: px, pointerY: py, cssLeft: r!.left, cssTop: r!.top });
    }
    expect(samples.length, `sample 数完全一致 (F3 skip 検出)`).toBe(15);
    let maxDev = 0;
    for (const s of samples) {
      const cssDeltaX = s.cssLeft - rectBefore!.left;
      const cssDeltaY = s.cssTop - rectBefore!.top;
      const pointerDeltaX = s.pointerX - start.x;
      const pointerDeltaY = s.pointerY - start.y;
      maxDev = Math.max(maxDev, Math.abs(cssDeltaX - pointerDeltaX), Math.abs(cssDeltaY - pointerDeltaY));
    }
    expect(maxDev, `node CSS pixel deviation ${maxDev}`).toBeLessThanOrEqual(3);

    // release 直前 rect (条件 3 = flicker 検証の基準)
    const rectAtRelease = await page.evaluate((id) => {
      const el = document.querySelector(`[data-html-canvas-node="${id}"]`) as HTMLElement | null;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top };
    }, targetNode.nodeId);
    expect(rectAtRelease).not.toBeNull();

    await page.mouse.up();

    // 条件 3 = release 後 300ms window で shift < 5px CSS (F3 = 消失 frame は即 fail)
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(30);
      const r = await page.evaluate((id) => {
        const el = document.querySelector(`[data-html-canvas-node="${id}"]`) as HTMLElement | null;
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return { left: rect.left, top: rect.top };
      }, targetNode.nodeId);
      expect(r, `release window iter ${i} で node ${targetNode.nodeId} が消失していない`).not.toBeNull();
      expect(Math.abs(r!.left - rectAtRelease!.left)).toBeLessThanOrEqual(5);
      expect(Math.abs(r!.top - rectAtRelease!.top)).toBeLessThanOrEqual(5);
    }

    await page.waitForTimeout(400);

    // 条件 1 = 掴んだ点 = 置いた点 = drag 前後の CSS pixel delta が pointer delta と 2px 以内一致
    const rectAfter = await page.evaluate((id) => {
      const el = document.querySelector(`[data-html-canvas-node="${id}"]`) as HTMLElement | null;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top };
    }, targetNode.nodeId);
    expect(rectAfter).not.toBeNull();
    const finalDeltaX = rectAfter!.left - rectBefore!.left;
    const finalDeltaY = rectAfter!.top - rectBefore!.top;
    expect(Math.abs(finalDeltaX - clientDeltaX), `node final CSS pixel deltaX ${finalDeltaX}`).toBeLessThanOrEqual(2);
    expect(Math.abs(finalDeltaY - clientDeltaY), `node final CSS pixel deltaY ${finalDeltaY}`).toBeLessThanOrEqual(2);
  });

  test("T10 = node drag 後 DSL に `nodes: { subKey: { posX, posY } }` が中心座標で書換される (F1 + F4)", async ({ page }) => {
    const before = await getEditorText(page);
    const mirror0 = await readCanvasState(page);
    expect(mirror0).not.toBeNull();
    const targetNode = mirror0!.nodes.find((n) => n.subKey !== null)!;
    expect(targetNode).toBeDefined();
    const start = await getNodeCenter(page, targetNode.nodeId);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(start.x + 80 * i / 10, start.y + 40 * i / 10);
      await page.waitForTimeout(15);
    }
    await page.mouse.up();
    await page.waitForTimeout(600);
    const after = await getEditorText(page);
    expect(after).not.toBe(before);
    const subKey = targetNode.subKey!;
    const nodesRegex = new RegExp(`nodes\\s*:\\s*\\{[^}]*${subKey.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\s*:\\s*\\{[^}]*posX\\s*:\\s*-?\\d+`);
    expect(nodesRegex.test(after), `expected nodes: { ${subKey}: { posX } } in DSL, got:\n${after.slice(0, 800)}`).toBe(true);
    // F4 = origPosW/origPosH が null (未指定 DSL) なら posW/posH は書換 DSL に現れない
    if (targetNode.origPosW === null) {
      const posWRegex = new RegExp(`nodes\\s*:\\s*\\{[^}]*${subKey.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\s*:\\s*\\{[^}]*posW\\s*:\\s*-?\\d+`);
      expect(posWRegex.test(after), `posW should NOT be written for auto-sized node (F4)`).toBe(false);
    }
  });

  test("T11 = pointercancel で node drag が rollback、 DSL 変更なし (F4 pointer cleanup 相当)", async ({ page }) => {
    const before = await getEditorText(page);
    const mirror0 = await readCanvasState(page);
    expect(mirror0).not.toBeNull();
    const targetNode = mirror0!.nodes.find((n) => n.subKey !== null)!;
    const start = await getNodeCenter(page, targetNode.nodeId);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    for (let i = 1; i <= 5; i++) {
      await page.mouse.move(start.x + 40 * i, start.y + 20 * i);
      await page.waitForTimeout(15);
    }
    // pointercancel dispatch
    await page.evaluate((id) => {
      const el = document.querySelector(`[data-html-canvas-node="${id}"]`) as HTMLElement | null;
      if (!el) return;
      const evt = new PointerEvent("pointercancel", { pointerId: 1, bubbles: true });
      el.dispatchEvent(evt);
    }, targetNode.nodeId);
    await page.waitForTimeout(300);
    await page.mouse.up().catch(() => { /* already up */ });
    const after = await getEditorText(page);
    expect(after, "pointer cancel で node DSL が変更されていない").toBe(before);
  });

  test("T12 = active drag 中の追加 pointer down は拒否 (multi-pointer 排他)", async ({ page }) => {
    const mirror0 = await readCanvasState(page);
    expect(mirror0).not.toBeNull();
    const nodeA = mirror0!.nodes.find((n) => n.subKey !== null)!;
    const nodeB = mirror0!.nodes.find((n) => n.nodeId !== nodeA.nodeId && n.subKey !== null);
    expect(nodeB).toBeDefined();
    const startA = await getNodeCenter(page, nodeA.nodeId);
    const startB = await getNodeCenter(page, nodeB!.nodeId);
    await page.mouse.move(startA.x, startA.y);
    await page.mouse.down();
    for (let i = 1; i <= 3; i++) {
      await page.mouse.move(startA.x + 20 * i, startA.y + 10 * i);
      await page.waitForTimeout(15);
    }
    // 別の node に対して 2 番目の pointer down を dispatchEvent で発火 (multi-pointer)
    const rectBBeforeSecondDown = await page.evaluate((id) => {
      const el = document.querySelector(`[data-html-canvas-node="${id}"]`) as HTMLElement | null;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top };
    }, nodeB!.nodeId);
    expect(rectBBeforeSecondDown).not.toBeNull();
    await page.evaluate(
      ({ id, cx, cy }) => {
        const el = document.querySelector(`[data-html-canvas-node="${id}"]`) as HTMLElement | null;
        if (!el) return;
        const evt = new PointerEvent("pointerdown", {
          pointerId: 99,
          bubbles: true,
          clientX: cx,
          clientY: cy,
          button: 0,
        });
        el.dispatchEvent(evt);
      },
      { id: nodeB!.nodeId, cx: startB.x, cy: startB.y },
    );
    await page.waitForTimeout(50);
    // nodeB は multi-pointer で drag 開始拒否されているはず、 rect が変わっていない
    const rectBAfter = await page.evaluate((id) => {
      const el = document.querySelector(`[data-html-canvas-node="${id}"]`) as HTMLElement | null;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top };
    }, nodeB!.nodeId);
    expect(rectBAfter).not.toBeNull();
    expect(Math.abs(rectBAfter!.x - rectBBeforeSecondDown!.x), "nodeB が multi-pointer 拒否で移動していない").toBeLessThanOrEqual(1);
    expect(Math.abs(rectBAfter!.y - rectBBeforeSecondDown!.y)).toBeLessThanOrEqual(1);
    // 元 drag を終了
    await page.mouse.up();
  });

  test("T13 = node drag が lane 経路に伝播しない (stopPropagation)", async ({ page }) => {
    const before = await getEditorText(page);
    const mirror0 = await readCanvasState(page);
    expect(mirror0).not.toBeNull();
    const targetNode = mirror0!.nodes.find((n) => n.subKey !== null)!;
    // 対象 node の親 lane
    const parentLane = mirror0!.lanes.find((l) => l.slug === targetNode.laneSlug);
    expect(parentLane).toBeDefined();
    const laneCenterBefore = await page.evaluate((slug) => {
      const el = document.querySelector(`[data-html-canvas-lane="${slug}"]`) as HTMLElement | null;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top };
    }, parentLane!.slug);
    expect(laneCenterBefore).not.toBeNull();
    const start = await getNodeCenter(page, targetNode.nodeId);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    for (let i = 1; i <= 5; i++) {
      await page.mouse.move(start.x + 30 * i, start.y + 15 * i);
      await page.waitForTimeout(15);
    }
    await page.mouse.up();
    await page.waitForTimeout(500);
    // node は移動、 lane は移動しない (stopPropagation で lane pointer down 発火なし)
    const after = await getEditorText(page);
    expect(after).not.toBe(before);
    // node 移動により nodes: { subKey: { posX, posY } } が現れる
    const subKey = targetNode.subKey!;
    const nodesRegex = new RegExp(`nodes\\s*:\\s*\\{[^}]*${subKey.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\s*:\\s*\\{[^}]*posX`);
    expect(nodesRegex.test(after), `node の posX が DSL に現れる`).toBe(true);
    // lane 側は F1/F2 に従い、 全 lane を現座標で pin (対象 lane の posX/posY は元 lane 座標のまま)
    const parentLaneName = parentLane!.name;
    const lanePosRegex = new RegExp(`${parentLaneName}[^\\n]*posX\\s*:\\s*${Math.round(parentLane!.worldX)}`);
    expect(lanePosRegex.test(after), `parent lane ${parentLaneName} が元座標で pin (${Math.round(parentLane!.worldX)})`).toBe(true);
  });
});
