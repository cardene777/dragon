/**
 * SVG audit の SSOT。 SVG 内 element の位置を viewBox 座標系で正確に計測。
 *
 * ## 使い方
 *
 * ```js
 * import { chromium } from "playwright";
 * import { svgWorldAuditLib } from "./svg-world.mjs";
 *
 * const browser = await chromium.launch();
 * const page = await browser.newContext().then(c => c.newPage());
 * await page.goto("http://localhost:4322/editor");
 *
 * const result = await page.evaluate((auditLib) => {
 *   eval(auditLib); // svgWorldBBox / isInsideViewBox / overflowAmount を注入
 *   const svg = document.querySelector(".v4-editor-stage svg");
 *   const vb = svg.viewBox.baseVal;
 *   const overflows = [];
 *   for (const t of svg.querySelectorAll("text")) {
 *     const worldBB = svgWorldBBox(t, svg);
 *     if (worldBB && !isInsideViewBox(worldBB, vb)) {
 *       overflows.push({ text: t.textContent, over: overflowAmount(worldBB, vb) });
 *     }
 *   }
 *   return overflows;
 * }, svgWorldAuditLib);
 * ```
 *
 * ## SVG 座標系の 3 段階
 *
 * 1. `el.getBBox()` = element の **local coordinate** (親 g の transform 前)
 * 2. `el.getCTM()` を適用 = element の **screen coordinate** (親 chain の transform + SVG root の
 *    viewBox → screen mapping 込み)
 * 3. `svg.getCTM()` の逆変換 = **viewBox coordinate** (SVG root の internal mapping を戻す)
 *
 * 前 audit は 2 を viewBox 座標として比較して false positive を大量発生させていた。
 * 本 SSOT は 3 まで完全変換して viewBox 座標系で比較する。
 *
 * ## 制約
 *
 * - SVG root は translate + uniform scale のみ想定 (shear / rotate なし、 通常の CdlDiagramView 出力は該当)
 * - text 以外の element (rect / path / circle 等) にも同 API で使える
 * - getBBox は phase autoplay 中の実 render 位置を返す、 phase 別 audit は sample 切替後 wait 必須
 */

export const svgWorldAuditLib = `
function svgWorldBBox(el, svg) {
  const bb = el.getBBox();
  const ctm = el.getCTM();
  const svgCtm = svg.getCTM();
  if (!ctm || !svgCtm) return null;
  const corners = [
    { x: bb.x, y: bb.y },
    { x: bb.x + bb.width, y: bb.y },
    { x: bb.x + bb.width, y: bb.y + bb.height },
    { x: bb.x, y: bb.y + bb.height },
  ];
  const world = corners.map(p => {
    const sx = p.x * ctm.a + p.y * ctm.c + ctm.e;
    const sy = p.x * ctm.b + p.y * ctm.d + ctm.f;
    return {
      x: (sx - svgCtm.e) / svgCtm.a,
      y: (sy - svgCtm.f) / svgCtm.d,
    };
  });
  const xs = world.map(w => w.x);
  const ys = world.map(w => w.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function isInsideViewBox(worldBB, vb) {
  return worldBB.x >= vb.x && worldBB.y >= vb.y &&
    worldBB.x + worldBB.w <= vb.x + vb.width &&
    worldBB.y + worldBB.h <= vb.y + vb.height;
}

function overflowAmount(worldBB, vb) {
  return {
    L: Math.max(0, vb.x - worldBB.x),
    R: Math.max(0, worldBB.x + worldBB.w - (vb.x + vb.width)),
    T: Math.max(0, vb.y - worldBB.y),
    B: Math.max(0, worldBB.y + worldBB.h - (vb.y + vb.height)),
  };
}
`;
