/**
 * Overlap detector (Tier C-1 ... user 視認 bug 再発防止 SSOT)。
 *
 * cdl が render する全 [data-cdl-diagram] に対し、 DOM の getBoundingClientRect で
 * node / edge-label の AABB を実測し、 collision を検出する。
 *
 * 検出対象。
 *   - node × edge-label の overlap (user 報告 = swimlane の dispatch / forward が node に重なる)
 *   - edge-label × edge-label の overlap
 *
 * 除外。
 *   - node × node ... 同 stack 配置 / overlap 設計の余地あり、 engine 側 visualValidate 任せ
 *   - 同一 edge の path × label (intentional contact)
 *   - SSR + client hydration による同一 [data-cdl-diagram] が複数 mount される 2 重 render
 *
 * 1 件でも overlap 検出されたら test fail → verify-passed marker block。
 */
import { test, expect, type Page } from "@playwright/test";
import { waitForAllCdlDiagrams } from "./helpers/wait-for-cdl";

interface DiagramBox {
  diagramRootKey: string;
  diagramId: string;
  kind: "node" | "edge-label";
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

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

// cdl engine 側 routing v8 (fan-in / fan-out orthogonal 抜本改良) + label auto shift v5 で
// border case は全て engine 層で解消済。 allowlist なしで全 diagram を必須 gating 化する。
const BORDER_CASE_DIAGRAMS = new Set<string>();

async function collectBoxes(page: Page): Promise<DiagramBox[]> {
  return await page.evaluate(() => {
    const out: Array<{
      diagramRootKey: string;
      diagramId: string;
      kind: "node" | "edge-label";
      id: string;
      x: number;
      y: number;
      w: number;
      h: number;
    }> = [];
    const diagrams = Array.from(document.querySelectorAll("[data-cdl-diagram]"));
    let rootIdx = 0;
    for (const diag of diagrams) {
      const diagramId = diag.getAttribute("data-cdl-diagram") ?? "";
      // SSR + hydration で同一 [data-cdl-diagram] が複数 mount される場合あり、
      // rootKey = "${diagramId}#${出現順}" で dedupe する。
      const rootKey = `${diagramId}#${rootIdx++}`;
      const nodes = Array.from(diag.querySelectorAll("[data-cdl-node]"));
      for (const n of nodes) {
        const r = (n as Element).getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        out.push({
          diagramRootKey: rootKey,
          diagramId,
          kind: "node",
          id: n.getAttribute("data-cdl-node") ?? "",
          x: r.left,
          y: r.top,
          w: r.width,
          h: r.height,
        });
      }
      const labels = Array.from(diag.querySelectorAll("[data-cdl-edge-label-for]"));
      for (const l of labels) {
        const r = (l as Element).getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        out.push({
          diagramRootKey: rootKey,
          diagramId,
          kind: "edge-label",
          id: l.getAttribute("data-cdl-edge-label-for") ?? "",
          x: r.left,
          y: r.top,
          w: r.width,
          h: r.height,
        });
      }
    }
    return out;
  });
}

interface Overlap {
  diagramId: string;
  diagramRootKey: string;
  a: { kind: "node" | "edge-label"; id: string };
  b: { kind: "node" | "edge-label"; id: string };
  overlapArea: number;
}

function detectOverlaps(boxes: DiagramBox[]): Overlap[] {
  // root 内 detection
  const rawByRoot = new Map<string, Overlap[]>();
  const grouped = new Map<string, DiagramBox[]>();
  for (const b of boxes) {
    if (BORDER_CASE_DIAGRAMS.has(b.diagramId)) continue;
    const arr = grouped.get(b.diagramRootKey) ?? [];
    arr.push(b);
    grouped.set(b.diagramRootKey, arr);
  }
  for (const [rootKey, list] of grouped) {
    const diagramId = list[0]?.diagramId ?? "";
    const rootList: Overlap[] = [];
    const seenPair = new Set<string>();
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i]!;
        const b = list[j]!;
        if (a.kind === "node" && b.kind === "node") continue;
        if (a.kind === "edge-label" && b.kind === "edge-label" && a.id === b.id) continue;
        const xOverlap = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
        const yOverlap = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
        const area = xOverlap * yOverlap;
        if (area <= 0) continue;
        const keyA = `${a.kind}:${a.id}`;
        const keyB = `${b.kind}:${b.id}`;
        const pairKey = keyA < keyB ? `${keyA}|${keyB}` : `${keyB}|${keyA}`;
        if (seenPair.has(pairKey)) continue;
        seenPair.add(pairKey);
        rootList.push({
          diagramId,
          diagramRootKey: rootKey,
          a: { kind: a.kind, id: a.id },
          b: { kind: b.kind, id: b.id },
          overlapArea: Math.round(area),
        });
      }
    }
    rawByRoot.set(rootKey, rootList);
  }
  // 同 diagramId が複数 root mount (SSR + hydration / 同 page 内重複表示) されている場合、
  // 1 diagramId × 1 pair = 1 件にまとめる。 別 diagramId は別件として残す。
  const seenDiagramPair = new Set<string>();
  const out: Overlap[] = [];
  for (const list of rawByRoot.values()) {
    for (const o of list) {
      const keyA = `${o.a.kind}:${o.a.id}`;
      const keyB = `${o.b.kind}:${o.b.id}`;
      const pairKey = keyA < keyB ? `${keyA}|${keyB}` : `${keyB}|${keyA}`;
      const dedupeKey = `${o.diagramId}::${pairKey}`;
      if (seenDiagramPair.has(dedupeKey)) continue;
      seenDiagramPair.add(dedupeKey);
      out.push(o);
    }
  }
  return out;
}

function formatReport(pageLabel: string, overlaps: Overlap[]): string {
  if (overlaps.length === 0) return `${pageLabel} ... OK (overlap 0 件)`;
  const byDiagram = new Map<string, Overlap[]>();
  for (const o of overlaps) {
    const arr = byDiagram.get(o.diagramId) ?? [];
    arr.push(o);
    byDiagram.set(o.diagramId, arr);
  }
  const lines = [`${pageLabel} ... FAIL (overlap ${overlaps.length} 件 / ${byDiagram.size} diagram)`];
  for (const [diagramId, list] of byDiagram) {
    lines.push(`  diagram "${diagramId}"`);
    for (const o of list) {
      lines.push(`    - ${o.a.kind}:${o.a.id} × ${o.b.kind}:${o.b.id} (area=${o.overlapArea}px²)`);
    }
  }
  return lines.join("\n");
}

test.describe("Overlap detector (Tier C-1)", () => {
  for (const { url, label } of PAGES) {
    test(`${label} (${url}) は node × edge-label / edge-label × edge-label の overlap が 0 件`, async ({
      page,
    }) => {
      await page.goto(url, { waitUntil: "networkidle" });
      // SSR + hydration 後の bbox 安定化を条件明示で待つ (waitForTimeout 撤廃)
      await waitForAllCdlDiagrams(page);
      const boxes = await collectBoxes(page);
      const overlaps = detectOverlaps(boxes);
      const report = formatReport(label, overlaps);
      if (overlaps.length > 0) {
        console.error(`[overlap-detector] ${report}`);
      }
      expect(overlaps, report).toEqual([]);
    });
  }
});
