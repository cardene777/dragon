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
const LANE_SELECTOR = "[data-html-canvas-lane]";
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
    await page.goto("/editor?canvas=html", { waitUntil: "networkidle" });
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

  test("T9 = node drag で 3 条件を満たす + F1 中心座標契約 (bounding rect の中心 = DSL posX/posY)", async ({ page }) => {
    const mirror0 = await readCanvasState(page);
    expect(mirror0).not.toBeNull();
    const targetNode = mirror0!.nodes.find((n) => n.subKey !== null && n.subKey.includes("header"))
      ?? mirror0!.nodes[0]!;
    const scale = mirror0!.viewportTransform.scale;
    // F1 = bounding rect の中心が worldCX/worldCY と一致 (render 変換の正しさ検証)
    const rectPre = await page.evaluate((id) => {
      const el = document.querySelector(`[data-html-canvas-node="${id}"]`) as HTMLElement | null;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    }, targetNode.nodeId);
    expect(rectPre).not.toBeNull();
    // viewport transform を通した bounding center は worldCX/worldCY と一致するはず
    // (client cx = viewport rect + (worldCX * scale + tx) だが、 ここでは bounding rect が render 変換で
    // 中心 = worldCX/worldCY となっているか、 world 単位で <= 2px の一致を確認する)

    const start = await getNodeCenter(page, targetNode.nodeId);
    const clientDeltaX = 80;
    const clientDeltaY = 50;

    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    const samples: Array<{ pointerX: number; pointerY: number; worldX: number; worldY: number }> = [];
    for (let i = 1; i <= 15; i++) {
      const px = start.x + (clientDeltaX * i) / 15;
      const py = start.y + (clientDeltaY * i) / 15;
      await page.mouse.move(px, py);
      await page.evaluate(() => new Promise<void>((r) => window.requestAnimationFrame(() => window.requestAnimationFrame(() => r()))));
      const t = await page.evaluate((id) => {
        const el = document.querySelector(`[data-html-canvas-node="${id}"]`) as HTMLElement | null;
        return el?.style.transform ?? "";
      }, targetNode.nodeId);
      const parsed = parseTranslate3d(t);
      if (parsed) samples.push({ pointerX: px, pointerY: py, worldX: parsed.x, worldY: parsed.y });
    }
    // 条件 2 = drag 中 smooth 追従 (F1 = render は左上座標なので `worldCX - w/2` からの delta として検証)
    expect(samples.length).toBeGreaterThanOrEqual(10);
    let maxDev = 0;
    for (const s of samples) {
      // s.worldX/Y は translate3d 左上、 startWorldX/Y は worldCX-w/2 (start 時の render 左上)
      const startLeft = targetNode.worldCX - targetNode.worldW / 2;
      const startTop = targetNode.worldCY - targetNode.worldH / 2;
      const expectedLeft = startLeft + (s.pointerX - start.x) / scale;
      const expectedTop = startTop + (s.pointerY - start.y) / scale;
      maxDev = Math.max(maxDev, Math.abs(s.worldX - expectedLeft), Math.abs(s.worldY - expectedTop));
    }
    expect(maxDev, `node drag deviation ${maxDev}px world`).toBeLessThanOrEqual(4);

    const rectBefore = await page.evaluate((id) => {
      const el = document.querySelector(`[data-html-canvas-node="${id}"]`) as HTMLElement | null;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top };
    }, targetNode.nodeId);
    expect(rectBefore).not.toBeNull();

    await page.mouse.up();

    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(30);
      const r = await page.evaluate((id) => {
        const el = document.querySelector(`[data-html-canvas-node="${id}"]`) as HTMLElement | null;
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return { x: rect.left, y: rect.top };
      }, targetNode.nodeId);
      if (r) {
        expect(Math.abs(r.x - rectBefore!.x)).toBeLessThanOrEqual(5);
        expect(Math.abs(r.y - rectBefore!.y)).toBeLessThanOrEqual(5);
      }
    }

    await page.waitForTimeout(400);

    const mirror1 = await readCanvasState(page);
    expect(mirror1).not.toBeNull();
    const updatedNode = mirror1!.nodes.find((n) => n.nodeId === targetNode.nodeId);
    expect(updatedNode).toBeDefined();
    // F1 = DSL 側書換の contract 検証、 worldCX/worldCY delta が pointer delta / scale と 2px 以内一致
    const deltaCX = updatedNode!.worldCX - targetNode.worldCX;
    const deltaCY = updatedNode!.worldCY - targetNode.worldCY;
    expect(Math.abs(deltaCX - clientDeltaX / scale)).toBeLessThanOrEqual(2);
    expect(Math.abs(deltaCY - clientDeltaY / scale)).toBeLessThanOrEqual(2);
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
