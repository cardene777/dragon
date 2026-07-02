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

// engine SSOT (cdl label-shift.ts) との対称閾値。 engine 側の半分 (安全マージン)。
const DIST_LABEL_PATH_MIN = 14; // engine CLEARANCE_PATH_LABEL 14 と一致
const DIST_LABEL_PATH_MAX = 80; // engine PROXIMITY_HARD_CAP 80 と一致
const CLEARANCE_LABEL_NODE = 12; // engine CLEARANCE_NODE_LABEL 32 の 3/8 (実測 DOM px は SVG world の 1/4 程度)
const CLEARANCE_LABEL_LABEL = 18; // engine CLEARANCE_LABEL_LABEL 36 の 1/2
const ARROW_ANGLE_MAX_DEG = 100; // 起点 sidepoint 直後の path 折れ角許容

interface RawDump {
  diagramId: string;
  diagramRootKey: string;
  nodes: Array<{ id: string; x: number; y: number; w: number; h: number }>;
  labels: Array<{ id: string; text: string; x: number; y: number; w: number; h: number }>;
  edges: Array<{ id: string; d: string; fromId?: string; toId?: string }>;
  ctm: { a: number; b: number; c: number; d: number; e: number; f: number } | null;
  svgClientRect: { left: number; top: number; width: number; height: number } | null;
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
      const ctmObj = svg && "getScreenCTM" in svg ? (svg as SVGSVGElement).getScreenCTM() : null;
      const nodes = Array.from(diag.querySelectorAll("[data-cdl-node]"))
        .map((n) => {
          const r = (n as Element).getBoundingClientRect();
          return { id: n.getAttribute("data-cdl-node") ?? "", x: r.left, y: r.top, w: r.width, h: r.height };
        })
        .filter((n) => n.w > 0 && n.h > 0);
      const labels = Array.from(diag.querySelectorAll("[data-cdl-edge-label-for]"))
        .map((l) => {
          const r = (l as Element).getBoundingClientRect();
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
      pts.push({ x: Number(m[2]!), y: Number(m[3]!) });
      pts.push({ x: Number(m[4]!), y: Number(m[5]!) });
    } else if (cmd === "C") {
      pts.push({ x: Number(m[2]!), y: Number(m[3]!) });
      pts.push({ x: Number(m[4]!), y: Number(m[5]!) });
      pts.push({ x: Number(m[6]!), y: Number(m[7]!) });
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
  gate: "G1-arrow-angle" | "G2-label-path" | "G3-label-node" | "G4-label-label";
  diagramId: string;
  detail: string;
  metric: number;
  threshold: string;
}

function detectDiagnostics(dump: RawDump): Diagnostic[] {
  const out: Diagnostic[] = [];
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
    const v1a = { x: pts[1]!.x - pts[0]!.x, y: pts[1]!.y - pts[0]!.y };
    const v2a = { x: pts[2]!.x - pts[1]!.x, y: pts[2]!.y - pts[1]!.y };
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
      const v1b = { x: pts[n - 2]!.x - pts[n - 3]!.x, y: pts[n - 2]!.y - pts[n - 3]!.y };
      const v2b = { x: pts[n - 1]!.x - pts[n - 2]!.x, y: pts[n - 1]!.y - pts[n - 2]!.y };
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
      const d = pointToSegmentDist(cx, cy, pts[i]!.x, pts[i]!.y, pts[i + 1]!.x, pts[i + 1]!.y);
      if (d < minDist) minDist = d;
    }
    if (minDist < DIST_LABEL_PATH_MIN) {
      out.push({
        gate: "G2-label-path",
        diagramId,
        detail: `label ${l.id} が edge path に貼り付き dist=${minDist.toFixed(1)}px`,
        metric: Math.round(minDist),
        threshold: `≥${DIST_LABEL_PATH_MIN}px`,
      });
    } else if (minDist > DIST_LABEL_PATH_MAX) {
      out.push({
        gate: "G2-label-path",
        diagramId,
        detail: `label ${l.id} が edge path から浮遊 dist=${minDist.toFixed(1)}px`,
        metric: Math.round(minDist),
        threshold: `≤${DIST_LABEL_PATH_MAX}px`,
      });
    }
  }

  // G3. label × node clearance (AABB 交差なし + 距離 < clearance)
  for (const l of labels) {
    if (!l.text) continue;
    for (const n of nodes) {
      const clr = rectRectClearance(l, n);
      // AABB 交差 (clr === 0) は overlap-detector 側で検出済なので G3 は非交差 (clr > 0) のみ対象
      if (clr > 0 && clr < CLEARANCE_LABEL_NODE) {
        out.push({
          gate: "G3-label-node",
          diagramId,
          detail: `label ${l.id} が node ${n.id} に近接 clr=${clr.toFixed(1)}px`,
          metric: Math.round(clr),
          threshold: `≥${CLEARANCE_LABEL_NODE}px`,
        });
      }
    }
  }

  // G4. label × label 距離
  for (let i = 0; i < labels.length; i++) {
    const a = labels[i]!;
    if (!a.text) continue;
    for (let j = i + 1; j < labels.length; j++) {
      const b = labels[j]!;
      if (!b.text || a.id === b.id) continue;
      const clr = rectRectClearance(a, b);
      if (clr > 0 && clr < CLEARANCE_LABEL_LABEL) {
        out.push({
          gate: "G4-label-label",
          diagramId,
          detail: `label ${a.id} × ${b.id} 近接 clr=${clr.toFixed(1)}px`,
          metric: Math.round(clr),
          threshold: `≥${CLEARANCE_LABEL_LABEL}px`,
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
      const report = formatReport(label, diagnostics);
      if (diagnostics.length > 0) {
        console.error(`[visual-diagnostics] ${report}`);
      }
      expect(diagnostics, report).toEqual([]);
    });
  }
});
