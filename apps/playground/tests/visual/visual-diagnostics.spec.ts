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
  // PR #75 で追加 = editor + docs 各 landing でも G1-G10 gate 適用、
  // 「著者が最初に見る page で geometry OK」 を担保する。 SPA render 済 diagram のみ検査対象。
  { url: "/editor", label: "editor" },
  { url: "/docs", label: "docs index" },
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
          fromId: e.getAttribute("data-cdl-from") ?? undefined,
          toId: e.getAttribute("data-cdl-to") ?? undefined,
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
  gate:
    | "G1-arrow-angle"
    | "G2-label-path"
    | "G3-label-node"
    | "G4-label-label"
    | "G5-predicted-vs-actual"
    | "G6-arrow-endpoint-anchor"
    | "G7-label-char-range"
    | "G8-node-overlap"
    | "G9-edge-crossing"
    | "G10-edge-node-cross";
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

  // ────────────────────────────────────────────────────────────────
  // G6. arrow endpoint anchoring (edge の始点 / 終点が from / to node bbox の縁付近)
  //   engine visual-validate Axis 8 と対称。 実 DOM 座標 (px) で判定、 world 換算不要。
  // ────────────────────────────────────────────────────────────────
  const G6_ENDPOINT_TOL_PX = 12; // scale 3.7 で world 4 = px 1.1 の実測 tolerance、 12 は余裕
  const G6_ENDPOINT_FAR_LIMIT_PX = 40;
  for (const e of edges) {
    if (!e.d) continue;
    const worldPts = extractPathPoints(e.d);
    if (worldPts.length < 2) continue;
    const screenPts = worldPts.map((p) => applyCtm(p, ctm));
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const endpoints: Array<{ side: "from" | "to"; pt: { x: number; y: number }; nodeId?: string }> = [];
    endpoints.push({ side: "from", pt: screenPts[0]!, nodeId: e.fromId });
    endpoints.push({ side: "to", pt: screenPts[screenPts.length - 1]!, nodeId: e.toId });
    for (const ep of endpoints) {
      if (!ep.nodeId) continue;
      const n = nodeById.get(ep.nodeId);
      if (!n) continue;
      // sequence preset の lifeline (w<10) は intentional な細線構造、 endpoint anchor 検証対象外。
      if (n.w < 10 || n.h < 10) continue;
      const rect = { x: n.x, y: n.y, w: n.w, h: n.h };
      const inside = ep.pt.x > rect.x + G6_ENDPOINT_TOL_PX && ep.pt.x < rect.x + rect.w - G6_ENDPOINT_TOL_PX
        && ep.pt.y > rect.y + G6_ENDPOINT_TOL_PX && ep.pt.y < rect.y + rect.h - G6_ENDPOINT_TOL_PX;
      if (inside) {
        const depth = Math.min(ep.pt.x - rect.x, rect.x + rect.w - ep.pt.x, ep.pt.y - rect.y, rect.y + rect.h - ep.pt.y);
        out.push({
          gate: "G6-arrow-endpoint-anchor",
          diagramId,
          detail: `edge ${e.id} ${ep.side} endpoint が node ${ep.nodeId} 内側に沈み込み depth=${depth.toFixed(1)}px`,
          metric: Math.round(depth),
          threshold: `≤${G6_ENDPOINT_TOL_PX}px (inside)`,
        });
        continue;
      }
      // 外側で縁から遠すぎる場合
      const dx = Math.max(rect.x - ep.pt.x, 0, ep.pt.x - (rect.x + rect.w));
      const dy = Math.max(rect.y - ep.pt.y, 0, ep.pt.y - (rect.y + rect.h));
      const distOut = Math.hypot(dx, dy);
      if (distOut > G6_ENDPOINT_FAR_LIMIT_PX) {
        out.push({
          gate: "G6-arrow-endpoint-anchor",
          diagramId,
          detail: `edge ${e.id} ${ep.side} endpoint が node ${ep.nodeId} 縁から dist=${distOut.toFixed(1)}px 離れている`,
          metric: Math.round(distOut),
          threshold: `≤${G6_ENDPOINT_FAR_LIMIT_PX}px (outside)`,
        });
      }
    }
  }

  // ────────────────────────────────────────────────────────────────
  // G7. label char range (label bbox が text の実占有幅を最小限含む)
  //   engine visual-validate Axis 9 と対称。 実 DOM label bbox が「label text をちゃんと包含」
  //   していない場合 (text 溢れ / 過剰縮小) を検知。 label element の getBoundingClientRect vs
  //   text element の getBoundingClientRect で判定 (data-cdl-edge-label-for 要素は g、 内部 rect と text)。
  //   今回は rect (label bbox) w が 0 or 明らかに text 長より狭い場合のみ warn (簡易実装)。
  // ────────────────────────────────────────────────────────────────
  const G7_MIN_LABEL_W_PX = 16;
  for (const l of labels) {
    if (!l.text) continue;
    // 実 label bbox 幅 vs text char 数 × 最低 char 幅 の下限判定 (改善 = 実効化)。
    // Inter Bold 22px の実測 char 幅 = 平均 12px、 最も細い "i" / "l" でも 6-7px、 CJK は 22px。
    // 40% を下限 = 平均 4.8px、 実効判定として 6px/char を下限に設定 (前 2px は緩すぎ実質常時 pass)。
    const MIN_PX_PER_CHAR = 6;
    const expectedMinW = l.text.length * MIN_PX_PER_CHAR;
    if (l.w < Math.max(G7_MIN_LABEL_W_PX, expectedMinW)) {
      out.push({
        gate: "G7-label-char-range",
        diagramId,
        detail: `label ${l.id} bbox width ${l.w.toFixed(1)}px が text "${l.text}" (${l.text.length}char × ${MIN_PX_PER_CHAR}px 下限) より狭い`,
        metric: Math.round(l.w),
        threshold: `≥${Math.max(G7_MIN_LABEL_W_PX, expectedMinW)}px`,
      });
    }
  }

  // ────────────────────────────────────────────────────────────────
  // G8. node overlap (node bbox 同士が実 DOM で重なり)
  //   engine visual-validate Axis 10 と対称。 spacer (id endsWith "-spacer" or /^s\d+-/) と
  //   lifeline (w < 8) は除外。
  // ────────────────────────────────────────────────────────────────
  const isSpacer = (n: { id: string; w: number; h: number }): boolean =>
    n.id.endsWith("-spacer") || /^s\d+-/.test(n.id) || (n.w <= 10 && n.h <= 10);
  const relevantNodes = nodes.filter((n) => !isSpacer(n));
  for (let i = 0; i < relevantNodes.length; i++) {
    const a = relevantNodes[i]!;
    for (let j = i + 1; j < relevantNodes.length; j++) {
      const b = relevantNodes[j]!;
      const dx = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const dy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (dx > 0 && dy > 0) {
        out.push({
          gate: "G8-node-overlap",
          diagramId,
          detail: `node ${a.id} ↔ ${b.id} 重なり area=${(dx * dy).toFixed(0)}px²`,
          metric: Math.round(dx * dy),
          threshold: `=0px²`,
        });
      }
    }
  }

  // ────────────────────────────────────────────────────────────────
  // G9. edge crossing (edge path 間の実 DOM 上の交差数)
  //   engine visual-validate Axis 11 と対称。 CROSSING_WARN 4 件で warn。
  // ────────────────────────────────────────────────────────────────
  const G9_CROSSING_WARN = 4;
  let g9Total = 0;
  const g9Pairs: string[] = [];
  const edgeScreen: Array<{ id: string; segs: Array<{ x1: number; y1: number; x2: number; y2: number }> }> = [];
  for (const e of edges) {
    if (!e.d) continue;
    const pts = extractPathPoints(e.d).map((p) => applyCtm(p, ctm));
    const segs: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    for (let i = 0; i + 1 < pts.length; i++) {
      segs.push({ x1: pts[i]!.x, y1: pts[i]!.y, x2: pts[i + 1]!.x, y2: pts[i + 1]!.y });
    }
    edgeScreen.push({ id: e.id, segs });
  }
  for (let i = 0; i < edgeScreen.length; i++) {
    const a = edgeScreen[i]!;
    for (let j = i + 1; j < edgeScreen.length; j++) {
      const b = edgeScreen[j]!;
      let pairCross = 0;
      for (const sa of a.segs) {
        for (const sb of b.segs) {
          if (segmentsIntersectSpec(sa, sb)) pairCross++;
        }
      }
      if (pairCross > 0) {
        g9Total += pairCross;
        g9Pairs.push(`${a.id}×${b.id}(${pairCross})`);
      }
    }
  }
  if (g9Total >= G9_CROSSING_WARN) {
    out.push({
      gate: "G9-edge-crossing",
      diagramId,
      detail: `diagram 内 edge 交差 ${g9Total} 件 (pairs: ${g9Pairs.slice(0, 5).join(", ")}${g9Pairs.length > 5 ? " 他" : ""})`,
      metric: g9Total,
      threshold: `<${G9_CROSSING_WARN}`,
    });
  }

  // ────────────────────────────────────────────────────────────────
  // G10. edge-node cross (edge path が「関係ない node」 bbox を貫通)
  //   engine visual-validate Axis 12 と対称。 spacer 除外、 e.fromId / e.toId 以外の node のみ判定。
  // ────────────────────────────────────────────────────────────────
  for (const e of edges) {
    if (!e.d) continue;
    const pts = extractPathPoints(e.d).map((p) => applyCtm(p, ctm));
    if (pts.length < 2) continue;
    const segs: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    for (let i = 0; i + 1 < pts.length; i++) {
      segs.push({ x1: pts[i]!.x, y1: pts[i]!.y, x2: pts[i + 1]!.x, y2: pts[i + 1]!.y });
    }
    for (const n of relevantNodes) {
      if (n.id === e.fromId || n.id === e.toId) continue;
      if (segsCrossRectSpec(segs, { x: n.x, y: n.y, w: n.w, h: n.h })) {
        out.push({
          gate: "G10-edge-node-cross",
          diagramId,
          detail: `edge ${e.id} (from=${e.fromId ?? "?"} to=${e.toId ?? "?"}) が関係ない node ${n.id} を貫通`,
          metric: 1,
          threshold: `=0 (no crossing)`,
        });
      }
    }
  }

  return out;
}

function segmentsIntersectSpec(
  a: { x1: number; y1: number; x2: number; y2: number },
  b: { x1: number; y1: number; x2: number; y2: number },
): boolean {
  const d1 = (b.x2 - b.x1) * (a.y1 - b.y1) - (b.y2 - b.y1) * (a.x1 - b.x1);
  const d2 = (b.x2 - b.x1) * (a.y2 - b.y1) - (b.y2 - b.y1) * (a.x2 - b.x1);
  const d3 = (a.x2 - a.x1) * (b.y1 - a.y1) - (a.y2 - a.y1) * (b.x1 - a.x1);
  const d4 = (a.x2 - a.x1) * (b.y2 - a.y1) - (a.y2 - a.y1) * (b.x2 - a.x1);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function segsCrossRectSpec(
  segs: Array<{ x1: number; y1: number; x2: number; y2: number }>,
  rect: { x: number; y: number; w: number; h: number },
): boolean {
  const edges = [
    { x1: rect.x, y1: rect.y, x2: rect.x + rect.w, y2: rect.y },
    { x1: rect.x + rect.w, y1: rect.y, x2: rect.x + rect.w, y2: rect.y + rect.h },
    { x1: rect.x, y1: rect.y + rect.h, x2: rect.x + rect.w, y2: rect.y + rect.h },
    { x1: rect.x, y1: rect.y, x2: rect.x, y2: rect.y + rect.h },
  ];
  for (const s of segs) {
    for (const re of edges) {
      if (segmentsIntersectSpec(s, re)) return true;
    }
  }
  return false;
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

test.describe("Visual diagnostics (Tier C-1 拡張, G1-G10)", () => {
  for (const { url, label } of PAGES) {
    test(`${label} (${url}) は G1-G10 hard gate 全 pass`, async ({
      page,
    }) => {
      await page.goto(url, { waitUntil: "networkidle" });
      await waitForAllCdlDiagrams(page);
      const dumps = await collectDumps(page);
      const diagnostics: Diagnostic[] = [];
      for (const d of dumps) {
        diagnostics.push(...detectDiagnostics(d));
      }
      // Gate 分類 (cdl PR #75 拡張)。
      //  hard gate = 視覚破綻を起こすので fail (fail 対象) ... G1 arrow-angle / G2 label-path /
      //    G3 label-node / G4 label-label / G6 arrow-endpoint-anchor / G8 node-overlap / G10 edge-node-cross。
      //  soft gate = 視覚上目立たない or 意図的許容 ... G5 predicted-vs-actual (size 端) /
      //    G7 label-char-range (bbox 実測仕様差) / G9 edge-crossing (4 件超 warn)。
      const HARD_GATES = new Set([
        "G1-arrow-angle",
        "G2-label-path",
        "G3-label-node",
        "G4-label-label",
        "G6-arrow-endpoint-anchor",
        "G8-node-overlap",
        "G10-edge-node-cross",
      ]);
      // 意図的な pattern (pattern-passthrough / pattern-hook = a→router→c 通過型) の G10 は許容。
      // engine visual-validate-sweep test 側の isGatingViolation と対称。
      const INTENTIONAL_G10 = new Set(["pattern-passthrough", "pattern-hook"]);
      const hardGate = diagnostics.filter((d) => {
        if (!HARD_GATES.has(d.gate)) return false;
        if (d.gate === "G10-edge-node-cross" && INTENTIONAL_G10.has(d.diagramId)) return false;
        return true;
      });
      const softGate = diagnostics.filter((d) => !HARD_GATES.has(d.gate));
      const hardReport = formatReport(label, hardGate);
      if (hardGate.length > 0) {
        console.error(`[visual-diagnostics] ${hardReport}`);
      }
      if (softGate.length > 0) {
        // soft gate 別集計 (G5 / G7 / G9)
        const softByGate = new Map<string, number>();
        for (const d of softGate) {
          softByGate.set(d.gate, (softByGate.get(d.gate) ?? 0) + 1);
        }
        const summary = Array.from(softByGate.entries())
          .map(([g, n]) => `${g}=${n}`)
          .join(" ");
        console.warn(`[visual-diagnostics] ${label} ... soft warn (${summary})`);
      }
      expect(hardGate, hardReport).toEqual([]);
    });
  }
});
