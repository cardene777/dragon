/**
 * HTML div canvas node drag behavior test (CAR-1952 Phase 2 PR 1)。
 *
 * Phase 1 (CAR-1947、 PR #906) で lane drag は実装済、 Phase 2 PR 1 で node (sequence step / class /
 * flow node 等 sub-node) を HTML div として描画 + drag 可能化。 3 条件 (掴んだ点=置いた点 / drag 中
 * smooth 追従 / release 後 flicker ゼロ) を node 対象に適用検証。
 *
 * 実装 SSOT = `apps/playground-spa/src/components/HtmlDivCanvasEditor.tsx`。
 * 判断 log = `~/projects/claude-memory/decisions/personal/decision-log/2026-07-23-dragon-editor-phase2-comprehensive-rewrite.md`。
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
  worldX: number;
  worldY: number;
  worldW: number;
  worldH: number;
  kind: string;
  title: string;
}

interface CanvasStateMirror {
  viewBox: { x: number; y: number; w: number; h: number } | null;
  viewportTransform: { tx: number; ty: number; scale: number };
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

test.describe("HTML div canvas node drag (CAR-1952 Phase 2 PR 1)", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => { void d.accept(); });
    await page.goto("/editor?canvas=html", { waitUntil: "networkidle" });
    await page.waitForSelector(NODE_SELECTOR, { timeout: 10000 });
    await page.waitForTimeout(500);
  });

  test("T8 = node が HTML div として描画される (sequence preset で header / footer / step の複数 node が存在)", async ({ page }) => {
    const mirror = await readCanvasState(page);
    expect(mirror).not.toBeNull();
    expect(mirror!.nodes.length).toBeGreaterThan(0);
    // sequence preset (login API sample) は 3 actor × (header + footer + spacer + s0-s3) = 大量の node
    // 少なくとも header / footer / step 系が含まれる
    const subKeys = new Set(mirror!.nodes.map((n) => n.subKey).filter((k) => k !== null));
    expect(subKeys.size).toBeGreaterThan(0);
    // 全 node の world 座標が有限数
    for (const node of mirror!.nodes) {
      expect(Number.isFinite(node.worldX)).toBe(true);
      expect(Number.isFinite(node.worldY)).toBe(true);
      expect(node.worldW).toBeGreaterThan(0);
      expect(node.worldH).toBeGreaterThan(0);
    }
    // DOM 側にも該当数の node div が存在
    const nodeDivs = await page.$$(NODE_SELECTOR);
    expect(nodeDivs.length).toBeGreaterThan(0);
  });

  test("T9 = node drag で 3 条件 (掴んだ点=置いた点 / smooth 追従 / flicker ゼロ) を満たす", async ({ page }) => {
    const mirror0 = await readCanvasState(page);
    expect(mirror0).not.toBeNull();
    // subKey が非 null で明確に識別可能な node を選ぶ (header 系が最も安定)
    const targetNode = mirror0!.nodes.find((n) => n.subKey !== null && n.subKey.includes("header"))
      ?? mirror0!.nodes[0]!;
    const scale = mirror0!.viewportTransform.scale;
    const start = await getNodeCenter(page, targetNode.nodeId);
    const clientDeltaX = 100;
    const clientDeltaY = 60;

    // drag 中 RAF sample (smooth 追従検証)
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
    // 条件 2 = drag 中 smooth 追従 (world 単位 max deviation < 4px)
    expect(samples.length).toBeGreaterThanOrEqual(10);
    let maxDev = 0;
    for (const s of samples) {
      const expectedWX = targetNode.worldX + (s.pointerX - start.x) / scale;
      const expectedWY = targetNode.worldY + (s.pointerY - start.y) / scale;
      maxDev = Math.max(maxDev, Math.abs(s.worldX - expectedWX), Math.abs(s.worldY - expectedWY));
    }
    expect(maxDev, `node drag deviation ${maxDev}px world`).toBeLessThanOrEqual(4);

    // release 前 rect を capture (flicker ゼロ検証用)
    const rectBefore = await page.evaluate((id) => {
      const el = document.querySelector(`[data-html-canvas-node="${id}"]`) as HTMLElement | null;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    }, targetNode.nodeId);
    expect(rectBefore).not.toBeNull();

    await page.mouse.up();

    // 条件 3 = release 後 300ms window で shift < 5px
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

    // 条件 1 = 掴んだ点 = 置いた点 (world 座標 delta が pointer delta / scale と 1px 以内一致)
    const mirror1 = await readCanvasState(page);
    expect(mirror1).not.toBeNull();
    const updatedNode = mirror1!.nodes.find((n) => n.nodeId === targetNode.nodeId);
    expect(updatedNode).toBeDefined();
    const deltaX = updatedNode!.worldX - targetNode.worldX;
    const deltaY = updatedNode!.worldY - targetNode.worldY;
    expect(Math.abs(deltaX - clientDeltaX / scale)).toBeLessThanOrEqual(2);
    expect(Math.abs(deltaY - clientDeltaY / scale)).toBeLessThanOrEqual(2);
  });

  test("T10 = node drag 後 DSL に該当 node の nodes: { subKey: { posX, posY } } が現れる (subKey 経路)", async ({ page }) => {
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
    // subKey に対応する posX/posY が現れる (`nodes: { ${subKey}: { posX: N, posY: N } }`)
    const subKey = targetNode.subKey!;
    // subKey は `header` / `s0` / `s1` 等、 nodes 内に列挙される
    const nodesRegex = new RegExp(`nodes\\s*:\\s*\\{[^}]*${subKey.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\s*:\\s*\\{[^}]*posX\\s*:\\s*-?\\d+`);
    expect(nodesRegex.test(after), `expected nodes: { ${subKey}: { posX } } in DSL, got:\n${after.slice(0, 800)}`).toBe(true);
  });
});
