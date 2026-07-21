/**
 * parts click / resize / zoom 実 UX forensic e2e (user 目視 3 bug、 2026-07-19)。
 *
 * user 実 dev-server で報告された 3 bug:
 *   I1 = parts をクリックしても点線 outline (Miro 相当の hover 枠) が出ない
 *   I2 = parts の個別 resize ができない (4 隅 handle が出ない、 掴んで拡大不可)
 *   I3 = 図 zoom (transform.scale) で 点線 outline / handle が図と乖離、 拡大で図がぐちゃぐちゃ
 *
 * 前の canvas-pivot-ux-forensic は sequence header / spacer 相当のみ verify で parts 未対応、
 * D1-forensic は DSL 上の位置のみ verify で実 SVG interaction 未検証だった = user 目視で bug 継続。
 * 本 file は実 SVG DOM の hover / handle / zoom 追随を直接 assert して真の UX を担保する。
 */
import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

const OUT_DIR = "/Users/cardene/Desktop/projects/dragon/.context/verify/parts-interaction-forensic";

async function setup(page: Page) {
  mkdirSync(OUT_DIR, { recursive: true });
  page.on("dialog", (d) => { void d.accept(); });
  await page.goto("/editor", { waitUntil: "networkidle" });
  await page.waitForSelector(".v4-editor-preview svg", { timeout: 10000 });
  await page.waitForTimeout(600);
}

async function addPartsAndGetSubNode(page: Page): Promise<{ id: string; cx: number; cy: number; w: number; h: number }> {
  await page.click('[data-testid="editor-parts-tab"]');
  await page.waitForTimeout(600);
  await page.click('[data-part-id="parts-achievement"]');
  await page.waitForTimeout(1500);
  const info = await page.evaluate(() => {
    const svg = document.querySelector(".v4-editor-preview svg");
    if (!svg) return null;
    const parts = Array.from(svg.querySelectorAll('[data-cdl-node]'))
      .filter((el) => (el.getAttribute("data-cdl-node") ?? "").includes("__"));
    if (parts.length === 0) return null;
    const el = parts[0]!;
    const r = el.getBoundingClientRect();
    return {
      id: el.getAttribute("data-cdl-node") ?? "",
      cx: r.x + r.width / 2,
      cy: r.y + r.height / 2,
      w: r.width,
      h: r.height,
    };
  });
  if (!info) throw new Error("parts sub-node not found after click add");
  return info;
}

// 既存 sequence node (parts merge 由来 `__` prefix 除外) の WORLD 座標 (SVG user space) を測定する。
// client 座標 (getBoundingClientRect) は part 追加 / resize で viewBox が拡張されると全体が再スケール
// されてシフトするため、 「既存 layout が reflow したか」 の判定には getScreenCTM inverse で client →
// world 変換した座標を使う (viewBox 変化を打ち消す)。
async function measureSeqWorld(page: Page): Promise<Record<string, { x: number; y: number }>> {
  return page.evaluate(() => {
    const svg = document.querySelector(".v4-editor-preview svg") as SVGSVGElement | null;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return {} as Record<string, { x: number; y: number }>;
    const inv = ctm.inverse();
    const out: Record<string, { x: number; y: number }> = {};
    document.querySelectorAll("[data-cdl-node]").forEach((el) => {
      const id = el.getAttribute("data-cdl-node") ?? "";
      if (id.includes("__")) return;
      const r = el.getBoundingClientRect();
      const pt = svg.createSVGPoint();
      pt.x = r.x + r.width / 2;
      pt.y = r.y + r.height / 2;
      const w = pt.matrixTransform(inv);
      out[id] = { x: w.x, y: w.y };
    });
    return out;
  });
}

test.describe("parts 実 UX forensic (I1 click hover / I2 individual resize / I3 zoom sync)", () => {
  test.beforeEach(async ({ page }) => {
    await setup(page);
  });

  test("I1-forensic = parts 中央 hover で 点線 outline が parts rect と ±10px 以内で一致", async ({ page }) => {
    const parts = await addPartsAndGetSubNode(page);

    // parts の中央に mouse move
    await page.mouse.move(parts.cx, parts.cy);
    await page.waitForTimeout(500);

    // 点線 outline overlay の client rect を取得
    const outline = await page.evaluate(() => {
      const stage = document.querySelector(".v4-editor-preview");
      if (!stage) return null;
      const candidates = Array.from(stage.querySelectorAll("div"));
      for (const el of candidates) {
        const style = (el as HTMLElement).style;
        const isDashed = style.borderStyle === "dashed" || (style.border && style.border.includes("dashed"));
        if (isDashed) {
          const r = el.getBoundingClientRect();
          return { x: r.x, y: r.y, w: r.width, h: r.height };
        }
      }
      return null;
    });

    await page.screenshot({ path: `${OUT_DIR}/I1-parts-hover.png`, fullPage: false });

    expect(outline, `parts hover で 点線 outline が生成される (parts=${JSON.stringify(parts)})`).not.toBeNull();
    if (outline) {
      const partsRect = { x: parts.cx - parts.w / 2, y: parts.cy - parts.h / 2, w: parts.w, h: parts.h };
      const dx = Math.abs(outline.x - partsRect.x);
      const dy = Math.abs(outline.y - partsRect.y);
      const dw = Math.abs(outline.w - partsRect.w);
      const dh = Math.abs(outline.h - partsRect.h);
      expect(dx, `outline.x が parts.x と ±10px (outline=${JSON.stringify(outline)}, parts=${JSON.stringify(partsRect)})`).toBeLessThan(10);
      expect(dy).toBeLessThan(10);
      expect(dw).toBeLessThan(10);
      expect(dh).toBeLessThan(10);
    }
  });

  test("I2-forensic = parts hover 時に 4 隅 handle が 表示され、 SE handle drag で parts のみ resize", async ({ page }) => {
    const parts = await addPartsAndGetSubNode(page);

    await page.mouse.move(parts.cx, parts.cy);
    await page.waitForTimeout(500);

    // 4 隅 handle の存在確認 (data-corner="nw/ne/sw/se")
    const cornerCount = await page.evaluate(() => {
      return document.querySelectorAll('.v4-editor-preview div[data-corner]').length;
    });
    expect(cornerCount, "hover で 4 隅 handle (data-corner nw/ne/sw/se) が表示").toBe(4);

    // 既存 sequence 全 node の WORLD 座標を記録 (drag 前)
    const beforeMap = await measureSeqWorld(page);

    // SE handle drag = parts の右下 corner を +100/+100 CSS px 移動 → parts のみ拡大される期待
    const seX = parts.cx + parts.w / 2;
    const seY = parts.cy + parts.h / 2;
    await page.mouse.move(seX, seY);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(seX + 10 * i, seY + 10 * i);
      await page.waitForTimeout(20);
    }
    await page.mouse.up();
    await page.waitForTimeout(800);

    // parts sub-node が存続すること (client rect の存在確認)
    const partsAfter = await page.evaluate((partsId) => {
      const el = document.querySelector(`[data-cdl-node="${partsId}"]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { w: r.width, h: r.height };
    }, parts.id);
    expect(partsAfter, "parts sub-node が存続").not.toBeNull();
    // 拡大判定は WORLD size (DSL posW/posH) で = client rect は part 追加/resize で viewBox が拡張されると
    // 全体が再スケールされて縮小しうるため (part を既存図の下の空きエリアに置く新配置で顕在化)。 SE handle
    // を +100 CSS px drag し achievement part の自然幅 (~380 world) より明確に拡大する。
    const dslText = await page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");
    const posWMatch = dslText.match(/achievement1[^{]*\{[^}]*posW\s*:\s*(\d+)/);
    const posHMatch = dslText.match(/achievement1[^{]*\{[^}]*posH\s*:\s*(\d+)/);
    const posW = posWMatch ? parseInt(posWMatch[1]!, 10) : 0;
    const posH = posHMatch ? parseInt(posHMatch[1]!, 10) : 0;
    const grew = posW > 450 && posH > 450;
    expect(grew, `parts が world size で拡大 (posW=${posW}, posH=${posH} > 自然幅 ~380)。 client rect は再スケールで縮小しうるため world 判定。 DSL:\n${dslText.slice(0, 500)}`).toBe(true);

    // 既存 sequence node の WORLD 座標が resize 後も不変 = parts のみ resize、 他 reflow なし (± 30 world)。
    // client 座標は part resize で viewBox が拡張されると再スケールされるため world 座標で判定する。
    const afterMap = await measureSeqWorld(page);

    let worstShift = 0;
    let worstId = "";
    for (const id of Object.keys(beforeMap)) {
      if (!(id in afterMap)) continue;
      const b = beforeMap[id]!;
      const a = afterMap[id]!;
      const shift = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
      if (shift > worstShift) { worstShift = shift; worstId = id; }
    }
    await page.screenshot({ path: `${OUT_DIR}/I2-parts-after-resize.png`, fullPage: false });
    expect(worstShift, `sequence node ${worstId} の world 座標 shift (${worstShift.toFixed(1)}) が 30 以下 = parts のみ resize、 既存 layout は reflow しない`).toBeLessThan(30);
  });

  test("I3-forensic = zoom で 点線 outline が図と同じ scale で追随 (sequence header)", async ({ page }) => {
    // sequence header (最初 data-cdl-node) を hover → zoom → outline / handle が図と同じ scale
    const nodes = await page.$$("[data-cdl-node]");
    const headerBox = await nodes[0].boundingBox();
    expect(headerBox).not.toBeNull();
    const headerId = await nodes[0].getAttribute("data-cdl-node");

    await page.mouse.move(headerBox!.x + headerBox!.width / 2, headerBox!.y + headerBox!.height / 2);
    await page.waitForTimeout(500);

    const before = await page.evaluate((id) => {
      const el = document.querySelector(`[data-cdl-node="${id}"]`);
      const stage = document.querySelector(".v4-editor-preview");
      if (!el || !stage) return null;
      const nR = el.getBoundingClientRect();
      let outlineR: DOMRect | null = null;
      for (const d of Array.from(stage.querySelectorAll("div"))) {
        const style = (d as HTMLElement).style;
        if (style.borderStyle === "dashed" || (style.border && style.border.includes("dashed"))) {
          outlineR = d.getBoundingClientRect();
          break;
        }
      }
      return { node: { w: nR.width, h: nR.height }, outline: outlineR ? { w: outlineR.width, h: outlineR.height } : null };
    }, headerId);

    expect(before, "zoom 前の header / outline 取得").not.toBeNull();
    expect(before!.outline, "zoom 前 outline 存在").not.toBeNull();

    // wheel で zoom (mouse を header 上に置いたまま = hoveredHandle 維持されるはず)
    await page.mouse.move(headerBox!.x + headerBox!.width / 2, headerBox!.y + headerBox!.height / 2);
    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(200);
    }
    await page.waitForTimeout(500);

    const after = await page.evaluate((id) => {
      const el = document.querySelector(`[data-cdl-node="${id}"]`);
      const stage = document.querySelector(".v4-editor-preview");
      if (!el || !stage) return null;
      const nR = el.getBoundingClientRect();
      let outlineR: DOMRect | null = null;
      for (const d of Array.from(stage.querySelectorAll("div"))) {
        const style = (d as HTMLElement).style;
        if (style.borderStyle === "dashed" || (style.border && style.border.includes("dashed"))) {
          outlineR = d.getBoundingClientRect();
          break;
        }
      }
      return { node: { w: nR.width, h: nR.height }, outline: outlineR ? { w: outlineR.width, h: outlineR.height } : null };
    }, headerId);

    await page.screenshot({ path: `${OUT_DIR}/I3-after-zoom.png`, fullPage: false });

    expect(after, `zoom 後 header 存続 (headerId=${headerId})`).not.toBeNull();
    expect(after!.outline, "zoom 後も outline 存続").not.toBeNull();

    const nodeScale = after!.node.w / before!.node.w;
    const outlineScale = after!.outline!.w / before!.outline!.w;
    expect(nodeScale, "図が zoom で拡大").toBeGreaterThan(1.05);
    const scaleDiff = Math.abs(nodeScale - outlineScale) / nodeScale;
    expect(
      scaleDiff,
      `outline scale (${outlineScale.toFixed(2)}) が figure scale (${nodeScale.toFixed(2)}) と ±10% 以内`,
    ).toBeLessThan(0.1);
  });
});
