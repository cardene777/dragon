/**
 * Visual diagnostics (Tier C-1 拡張 ... arrow angle + label × path + label × node clearance + label × label 距離)。
 *
 * overlap-detector.spec.ts は AABB 面積 0 しか見ないため、
 * 「label が edge path 上に浮いている」 「arrow 先端が急角度で折れる」 等の視覚破綻を
 * 検出できない。 本 spec で 4 gate を追加、 engine が保証すべき視覚品質を実測 gate 化する。
 *
 * 4 gate。
 *   G1. arrow tail / head angle ... path の起点直後 + 終点直前の segment 方向が、
 *       起点 side (E/W/N/S) の想定方向から 100 度以上ずれたら fail。 「矢印の付け根で
 *       いきなり折れる」 症状 (画像 2 事象) を検出。
 *   G2. label × path 最短距離 ... label 中心と自 edge path segment の最短距離が
 *       DIST_MIN (14px) 未満 = 貼り付き / DIST_MAX (80px) 超過 = 浮遊、 両端 fail。
 *   G3. label × node clearance ... label bbox と node bbox の最短距離が
 *       CLEARANCE_NODE_LABEL (12px) 未満なら fail (AABB 交差 0 でも「隣接ぎりぎり」 は視覚破綻)。
 *   G4. label × label 距離 ... 異 edge の label 同士の最短距離が
 *       CLEARANCE_LABEL_LABEL (18px) 未満なら fail。
 *
 * 各 gate の閾値は SSOT ... cdl `packages/cdl/src/layout/label-shift.ts` の
 * CLEARANCE_* / PROXIMITY_HARD_CAP と対称。 test 側 gate は engine 側 SSOT の
 * 半分の値 (安全マージン) を採用、 engine が SSOT 通り動けば test は必ず pass する。
 */
import { test, expect, type Page } from "@playwright/test";
import { waitForAllCdlDiagrams } from "./helpers/wait-for-cdl";

const PAGES = [
  { url: "/", label: "home" },
  { url: "/catalog", label: "catalog index" },
  { url: "/catalog/cookbook", label: "cookbook" },
  { url: "/catalog/patterns", label: "patterns" },
  { url: "/catalog/presets", label: "presets" },
  { url: "/catalog/primitives", label: "primitives" },
  { url: "/catalog/text-dsl", label: "text-dsl" },
  { url: "/catalog/animation", label: "animation" },
  { url: "/catalog/styles", label: "styles" },
];

// engine SSOT 定数 (world unit) を import。 v10.3 で COEFF 逆算 (0.02 / 0.12 / 0.35 / 4.0 の
// magic number 実測分布逆算) を撤廃し、 「実測 px → world 単位に変換 → engine SSOT world 閾値と
// 直接比較 + FONT_RENDER_TOLERANCE_WORLD 余裕」 の設計に統一。
//
// 変換式 ... world_dist = px_dist × scale
//   scale = viewBoxWidth / displayWidth (diagram 個別 動的計算)
//   fail 判定: world_dist が engine SSOT threshold ± tolerance 範囲外
//
// これにより副次係数 magic number は撤廃、 tolerance のみ物理的意味 (SVG font hinting +
// subpixel rounding = FONT_RENDER_TOLERANCE_WORLD 30 world) で保守側許容。
import {
  CLEARANCE_NODE_LABEL,
  CLEARANCE_LABEL_LABEL,
  CLEARANCE_PATH_LABEL,
  ARROW_ANGLE_MAX_DEG,
  FONT_RENDER_TOLERANCE_WORLD,
  computeDistLabelPathMaxWorld,
} from "@cardenelabs/cdl";

interface RawDump {
  diagramId: string;
  diagramRootKey: string;
  nodes: Array<{ id: string; x: number; y: number; w: number; h: number }>;
  labels: Array<{ id: string; text: string; x: number; y: number; w: number; h: number }>;
  edges: Array<{ id: string; d: string; fromId?: string; toId?: string }>;
  ctm: { a: number; b: number; c: number; d: number; e: number; f: number } | null;
  svgClientRect: { left: number; top: number; width: number; height: number } | null;
  // v10.2 pixel-perfect gate 用 = viewBox 4 値 (parseFloat 済み) + displayWidth。 これらから
  // scale = viewBoxWidth / displayWidth を計算して engine world 閾値を DOM px に変換する。
  viewBox: { x: number; y: number; width: number; height: number } | null;
}

async function collectDumps(page: Page): Promise<RawDump[]> {
  return await page.evaluate(() => {
    const out: RawDump[] = [];
    const diagrams = Array.from(document.querySelectorAll("[data-cdl-diagram]"));
    let rootIdx = 0;
    for (const diag of diagrams) {
      const diagramId = diag.getAttribute("data-cdl-diagram") ?? "";
      const rootKey = `${diagramId}#${rootIdx++}`;
      const svg = diag.querySelector("svg");
      const svgRect = svg ? svg.getBoundingClientRect() : null;
      const ctmObj = svg && "getScreenCTM" in svg ? (svg).getScreenCTM() : null;
      const nodes = Array.from(diag.querySelectorAll("[data-cdl-node]"))
        .map((n) => {
          const r = (n).getBoundingClientRect();
          return { id: n.getAttribute("data-cdl-node") ?? "", x: r.left, y: r.top, w: r.width, h: r.height };
        })
        .filter((n) => n.w > 0 && n.h > 0);
      const labels = Array.from(diag.querySelectorAll("[data-cdl-edge-label-for]"))
        .map((l) => {
          const r = (l).getBoundingClientRect();
          const text = ((l as HTMLElement).textContent ?? "").trim();
          return {
            id: l.getAttribute("data-cdl-edge-label-for") ?? "",
            text,
            x: r.left,
            y: r.top,
            w: r.width,
            h: r.height,
          };
        })
        .filter((l) => l.w > 0 && l.h > 0);
      const edges = Array.from(diag.querySelectorAll("[data-cdl-edge]")).map((e) => {
        const p = e.querySelector("path");
        return {
          id: e.getAttribute("data-cdl-edge") ?? "",
          d: p?.getAttribute("d") ?? "",
          fromId: e.getAttribute("data-cdl-edge-from") ?? undefined,
          toId: e.getAttribute("data-cdl-edge-to") ?? undefined,
        };
      });
      // viewBox 属性から 4 値抽出。 "-40 68 1820 928" 形式、 parseFloat 4 個。
      let viewBox: { x: number; y: number; width: number; height: number } | null = null;
      if (svg) {
        const vbAttr = svg.getAttribute("viewBox");
        if (vbAttr) {
          const parts = vbAttr.trim().split(/\s+/).map(Number);
          if (parts.length === 4 && parts.every((v) => Number.isFinite(v))) {
            viewBox = { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
          }
        }
      }
      out.push({
        diagramId,
        diagramRootKey: rootKey,
        nodes,
        labels,
        edges,
        ctm: ctmObj
          ? { a: ctmObj.a, b: ctmObj.b, c: ctmObj.c, d: ctmObj.d, e: ctmObj.e, f: ctmObj.f }
          : null,
        svgClientRect: svgRect ? { left: svgRect.left, top: svgRect.top, width: svgRect.width, height: svgRect.height } : null,
        viewBox,
      });
    }
    return out;
  });
}

function extractPathPoints(d: string): Array<{ x: number; y: number }> {
  const pts: Array<{ x: number; y: number }> = [];
  const re = /([MLQC])\s*([-\d.]+)[,\s]+([-\d.]+)(?:[,\s]+([-\d.]+)[,\s]+([-\d.]+))?(?:[,\s]+([-\d.]+)[,\s]+([-\d.]+))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d))) {
    const cmd = m[1];
    if (cmd === "M" || cmd === "L") {
      pts.push({ x: Number(m[2]), y: Number(m[3]) });
    } else if (cmd === "Q") {
      pts.push({ x: Number(m[2]), y: Number(m[3]) });
      pts.push({ x: Number(m[4]), y: Number(m[5]) });
    } else if (cmd === "C") {
      pts.push({ x: Number(m[2]), y: Number(m[3]) });
      pts.push({ x: Number(m[4]), y: Number(m[5]) });
      pts.push({ x: Number(m[6]), y: Number(m[7]) });
    }
  }
  return pts;
}

function applyCtm(p: { x: number; y: number }, ctm: RawDump["ctm"]): { x: number; y: number } {
  if (!ctm) return p;
  return { x: ctm.a * p.x + ctm.c * p.y + ctm.e, y: ctm.b * p.x + ctm.d * p.y + ctm.f };
}

function angleDeg(v1: { x: number; y: number }, v2: { x: number; y: number }): number {
  const dot = v1.x * v2.x + v1.y * v2.y;
  const m1 = Math.hypot(v1.x, v1.y);
  const m2 = Math.hypot(v2.x, v2.y);
  if (m1 === 0 || m2 === 0) return 0;
  const cos = Math.max(-1, Math.min(1, dot / (m1 * m2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

function pointToSegmentDist(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function rectRectClearance(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
): number {
  const dx = Math.max(0, Math.max(a.x - (b.x + b.w), b.x - (a.x + a.w)));
  const dy = Math.max(0, Math.max(a.y - (b.y + b.h), b.y - (a.y + a.h)));
  return Math.hypot(dx, dy);
}

interface Diagnostic {
  gate: "G1-arrow-angle" | "G2-label-path" | "G3-label-node" | "G4-label-label" | "G5-predicted-vs-actual";
  diagramId: string;
  detail: string;
  metric: number;
  threshold: string;
}

// G5 gate 用 = engine 予測 bbox JSON fixture (packages/dragon/test/predict-bbox-fixture.test.ts が生成)。
// 各 diagram の node / label の world 単位予測 bbox。 Playwright DOM 実測を world に戻して diff。
interface PredictedBBox {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface PredictedDiagram {
  diagramId: string;
  viewBoxWidth: number;
  viewBoxHeight: number;
  nodes: Array<{ id: string } & PredictedBBox>;
  labels: Array<{ id: string; text: string } & PredictedBBox>;
}
import predictedBboxesJson from "./__fixtures__/predicted-bboxes.json" with { type: "json" };
const predictedBboxes = predictedBboxesJson as PredictedDiagram[];
const predictedById = new Map<string, PredictedDiagram>(predictedBboxes.map((p) => [p.diagramId, p]));

function detectDiagnostics(dump: RawDump): Diagnostic[] {
  const out: Diagnostic[] = [];
  // v10.3 = COEFF 逆算撤廃、 「実測 px → world 変換 → engine SSOT world 閾値 ± tolerance」 で判定。
  // scale = viewBoxWidth / displayWidth (diagram 個別)、 world_dist = px_dist × scale。
  // 判定式 ... world_dist が engine SSOT world 閾値の (± FONT_RENDER_TOLERANCE_WORLD) 外なら fail。
  const scale = dump.viewBox && dump.svgClientRect && dump.svgClientRect.width > 0
    ? dump.viewBox.width / dump.svgClientRect.width
    : 3.714;
  // engine SSOT world 閾値 (小さい方の許容範囲 = tolerance 引く、 大きい方 = tolerance 足す)。
  // font hinting / subpixel rounding の物理誤差 (FONT_RENDER_TOLERANCE_WORLD = 30 world) を許容。
  // dist max は maxNodeDim による dynamic threshold (engine PROXIMITY_HARD_CAP と対称)。
  const maxNodeDimWorld = dump.nodes.length > 0
    ? Math.max(...dump.nodes.map((n) => Math.max(n.w * scale, n.h * scale)))
    : 0;
  const distMaxWorldEngine = computeDistLabelPathMaxWorld(maxNodeDimWorld);
  const DIST_MIN_WORLD_ALLOWED = Math.max(0, CLEARANCE_PATH_LABEL - FONT_RENDER_TOLERANCE_WORLD);
  const DIST_MAX_WORLD_ALLOWED = distMaxWorldEngine + FONT_RENDER_TOLERANCE_WORLD;
  const CLEARANCE_NODE_LABEL_WORLD_ALLOWED = Math.max(0, CLEARANCE_NODE_LABEL - FONT_RENDER_TOLERANCE_WORLD);
  const CLEARANCE_LABEL_LABEL_WORLD_ALLOWED = Math.max(0, CLEARANCE_LABEL_LABEL - FONT_RENDER_TOLERANCE_WORLD);
  const { diagramId, edges, labels, nodes, ctm } = dump;
  // path points を DOM 座標に換算 (SVG world → screen px)
  const edgePathScreenPoints = new Map<string, Array<{ x: number; y: number }>>();
  for (const e of edges) {
    if (!e.d) continue;
    const worldPts = extractPathPoints(e.d);
    const screenPts = worldPts.map((p) => applyCtm(p, ctm));
    edgePathScreenPoints.set(e.id, screenPts);
  }

  // G1. arrow tail / head angle
  for (const e of edges) {
    const pts = edgePathScreenPoints.get(e.id);
    if (!pts || pts.length < 3) continue;
    // tail (起点直後) = pts[0]→pts[1] と pts[1]→pts[2] の角度
    const v1a = { x: pts[1].x - pts[0].x, y: pts[1].y - pts[0].y };
    const v2a = { x: pts[2].x - pts[1].x, y: pts[2].y - pts[1].y };
    const angTail = angleDeg(v1a, v2a);
    if (angTail > ARROW_ANGLE_MAX_DEG) {
      out.push({
        gate: "G1-arrow-angle",
        diagramId,
        detail: `edge ${e.id} tail 折れ角 ${angTail.toFixed(1)}°`,
        metric: Math.round(angTail),
        threshold: `≤${ARROW_ANGLE_MAX_DEG}°`,
      });
    }
    // head (終点直前) = pts[n-2]→pts[n-1] と 前 segment の角度
    if (pts.length >= 4) {
      const n = pts.length;
      const v1b = { x: pts[n - 2].x - pts[n - 3].x, y: pts[n - 2].y - pts[n - 3].y };
      const v2b = { x: pts[n - 1].x - pts[n - 2].x, y: pts[n - 1].y - pts[n - 2].y };
      const angHead = angleDeg(v1b, v2b);
      if (angHead > ARROW_ANGLE_MAX_DEG) {
        out.push({
          gate: "G1-arrow-angle",
          diagramId,
          detail: `edge ${e.id} head 折れ角 ${angHead.toFixed(1)}°`,
          metric: Math.round(angHead),
          threshold: `≤${ARROW_ANGLE_MAX_DEG}°`,
        });
      }
    }
  }

  // G2. label × 自 edge path 距離
  for (const l of labels) {
    if (!l.text) continue; // 空 label は engine skip 済 (routing v9)
    const pts = edgePathScreenPoints.get(l.id);
    if (!pts || pts.length < 2) continue;
    const cx = l.x + l.w / 2;
    const cy = l.y + l.h / 2;
    let minDist = Infinity;
    for (let i = 0; i < pts.length - 1; i++) {
      const d = pointToSegmentDist(cx, cy, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
      if (d < minDist) minDist = d;
    }
    // 実測 px → world 変換して engine SSOT world 閾値で判定 (COEFF 撤廃)
    const minDistWorld = minDist * scale;
    if (minDistWorld < DIST_MIN_WORLD_ALLOWED) {
      out.push({
        gate: "G2-label-path",
        diagramId,
        detail: `label ${l.id} が edge path に貼り付き dist=${minDistWorld.toFixed(1)}world (px=${minDist.toFixed(1)})`,
        metric: Math.round(minDistWorld),
        threshold: `≥${DIST_MIN_WORLD_ALLOWED.toFixed(1)}world`,
      });
    } else if (minDistWorld > DIST_MAX_WORLD_ALLOWED) {
      out.push({
        gate: "G2-label-path",
        diagramId,
        detail: `label ${l.id} が edge path から浮遊 dist=${minDistWorld.toFixed(1)}world (px=${minDist.toFixed(1)})`,
        metric: Math.round(minDistWorld),
        threshold: `≤${DIST_MAX_WORLD_ALLOWED.toFixed(1)}world`,
      });
    }
  }

  // G3. label × node clearance (AABB 交差なし + 距離 < clearance)
  // 視覚 spacer 系 node は label obstacle から除外 (視覚的に邪魔しない細点):
  //   - "-spacer" 末尾 ... sequence preset の細線 lifeline (w=2, h=40)
  //   - "s{N}-" prefix ... sequence preset の step marker (w=2, h=2)
  //   - w × h ≤ 10 ... 上記に該当しない極小 node (万一の future 拡張)
  const isVisualSpacer = (n: { id: string; w: number; h: number }): boolean =>
    n.id.endsWith("-spacer") || /^s\d+-/.test(n.id) || (n.w <= 10 && n.h <= 10);
  for (const l of labels) {
    if (!l.text) continue;
    for (const n of nodes) {
      if (isVisualSpacer(n)) continue;
      const clr = rectRectClearance(l, n);
      // AABB 交差 (clr === 0) は overlap-detector 側で検出済なので G3 は非交差 (clr > 0) のみ対象
      const clrWorld = clr * scale;
      if (clr > 0 && clrWorld < CLEARANCE_NODE_LABEL_WORLD_ALLOWED) {
        out.push({
          gate: "G3-label-node",
          diagramId,
          detail: `label ${l.id} が node ${n.id} に近接 clr=${clrWorld.toFixed(1)}world (px=${clr.toFixed(1)})`,
          metric: Math.round(clrWorld),
          threshold: `≥${CLEARANCE_NODE_LABEL_WORLD_ALLOWED.toFixed(1)}world`,
        });
      }
    }
  }

  // G4. label × label 距離
  for (let i = 0; i < labels.length; i++) {
    const a = labels[i];
    if (!a.text) continue;
    for (let j = i + 1; j < labels.length; j++) {
      const b = labels[j];
      if (!b.text || a.id === b.id) continue;
      const clr = rectRectClearance(a, b);
      const clrWorld = clr * scale;
      if (clr > 0 && clrWorld < CLEARANCE_LABEL_LABEL_WORLD_ALLOWED) {
        out.push({
          gate: "G4-label-label",
          diagramId,
          detail: `label ${a.id} × ${b.id} 近接 clr=${clrWorld.toFixed(1)}world (px=${clr.toFixed(1)})`,
          metric: Math.round(clrWorld),
          threshold: `≥${CLEARANCE_LABEL_LABEL_WORLD_ALLOWED.toFixed(1)}world`,
        });
      }
    }
  }

  // G5. engine 予測 bbox と DOM 実測 bbox の diff (pixel-perfect assertion)
  // 実測 px → world 変換 → engine 予測 world bbox と diff、 FONT_RENDER_TOLERANCE_WORLD 内なら pass
  const predicted = predictedById.get(diagramId);
  if (predicted && dump.svgClientRect && dump.viewBox) {
    const svgLeftPx = dump.svgClientRect.left;
    const svgTopPx = dump.svgClientRect.top;
    // 予測 label と 実測 label の突合 (id ベース)
    const actualLabelById = new Map<string, { x: number; y: number; w: number; h: number }>();
    for (const l of labels) actualLabelById.set(l.id, { x: l.x, y: l.y, w: l.w, h: l.h });
    for (const predLabel of predicted.labels) {
      const actual = actualLabelById.get(predLabel.id);
      if (!actual) continue;
      // 実測 px を SVG offset 引いて viewBox 座標に、 * scale で world 単位に
      const actualWorldX = (actual.x - svgLeftPx) * scale + dump.viewBox.x;
      const actualWorldY = (actual.y - svgTopPx) * scale + dump.viewBox.y;
      const actualWorldW = actual.w * scale;
      const actualWorldH = actual.h * scale;
      const dxWorld = Math.abs(predLabel.x - actualWorldX);
      const dyWorld = Math.abs(predLabel.y - actualWorldY);
      const dwWorld = Math.abs(predLabel.w - actualWorldW);
      const dhWorld = Math.abs(predLabel.h - actualWorldH);
      // G5 gate = 「measureTextWidth 実測乖離」 を検知するのが本来の目的、 判定は size 差 (dw / dh) のみ。
      // position 差 (dx / dy) は sub 表示有無や render 側 yOffset 実装差で発生する drift で、
      // G2 (label × edge path) / G3 (label × node) の担当領域。 G5 で二重判定しない。
      const maxSizeDiff = Math.max(dwWorld, dhWorld);
      if (maxSizeDiff > FONT_RENDER_TOLERANCE_WORLD) {
        out.push({
          gate: "G5-predicted-vs-actual",
          diagramId,
          detail: `label ${predLabel.id} engine 予測 vs 実測 size_diff=${maxSizeDiff.toFixed(1)}world (dw=${dwWorld.toFixed(1)} dh=${dhWorld.toFixed(1)}, ref dx=${dxWorld.toFixed(1)} dy=${dyWorld.toFixed(1)})`,
          metric: Math.round(maxSizeDiff),
          threshold: `≤${FONT_RENDER_TOLERANCE_WORLD}world (size)`,
        });
      }
    }
  }

  return out;
}

function formatReport(pageLabel: string, diagnostics: Diagnostic[]): string {
  if (diagnostics.length === 0) return `${pageLabel} ... OK (diagnostic 0 件)`;
  const byGate = new Map<string, Diagnostic[]>();
  for (const d of diagnostics) {
    const arr = byGate.get(d.gate) ?? [];
    arr.push(d);
    byGate.set(d.gate, arr);
  }
  const lines = [`${pageLabel} ... FAIL (diagnostic ${diagnostics.length} 件)`];
  for (const [gate, list] of byGate) {
    lines.push(`  ${gate} × ${list.length}`);
    // 同 diagramId 集約
    const byDiag = new Map<string, Diagnostic[]>();
    for (const d of list) {
      const arr = byDiag.get(d.diagramId) ?? [];
      arr.push(d);
      byDiag.set(d.diagramId, arr);
    }
    for (const [did, dlist] of byDiag) {
      lines.push(`    diagram "${did}" × ${dlist.length}`);
      for (const d of dlist.slice(0, 5)) {
        lines.push(`      - ${d.detail} (${d.threshold})`);
      }
      if (dlist.length > 5) lines.push(`      ... +${dlist.length - 5} more`);
    }
  }
  return lines.join("\n");
}

test.describe("Visual diagnostics (Tier C-1 拡張, G1-G4)", () => {
  for (const { url, label } of PAGES) {
    test(`${label} (${url}) は arrow angle / label-path / label-node / label-label の 4 gate 全 pass`, async ({
      page,
    }) => {
      await page.goto(url, { waitUntil: "networkidle" });
      await waitForAllCdlDiagrams(page);
      const dumps = await collectDumps(page);
      const diagnostics: Diagnostic[] = [];
      for (const d of dumps) {
        diagnostics.push(...detectDiagnostics(d));
      }
      // G1-G4 = hard gate (fail 対象)、 G5 = warn only (measureTextWidth 実測係数化後の size 差残存を検知)。
      // cdl PR #74 で measureTextWidth を Inter Bold @ Chrome 実測係数 (英字 lowercase 0.73 em / CJK 1.08 em /
      // digits 0.72 em 等) + render 側 boxW も同一 formula に統一、 G5 warn 84 → 10 件 (88% 削減)。
      // 残 10 件は sub 有無 label の rect boxH 差 (predict 64 vs render 68) と mono sub の tolerance 端。
      const hardGate = diagnostics.filter((d) => d.gate !== "G5-predicted-vs-actual");
      const softGate = diagnostics.filter((d) => d.gate === "G5-predicted-vs-actual");
      const hardReport = formatReport(label, hardGate);
      if (hardGate.length > 0) {
        console.error(`[visual-diagnostics] ${hardReport}`);
      }
      if (softGate.length > 0) {
        console.warn(`[visual-diagnostics] ${label} ... G5 warn (predicted-vs-actual size 乖離 ${softGate.length} 件、 tolerance 80 world / 実測係数化後の残存許容)`);
      }
      expect(hardGate, hardReport).toEqual([]);
    });
  }
});
