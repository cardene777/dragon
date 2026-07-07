/**
 * edge-crossing の実測分布を計算する diagnostic test。
 *
 * 目的 = engine 側 CROSSING_WARN (現状 4 件超で warn) の閾値が妥当か検証。
 * 全 catalog diagram について「crossing 件数」 を集計、 中央値 + 95 percentile を stderr dump。
 * これに基づき閾値を「95 percentile を超えたら warn」 に tune する fact-based 判断。
 */
import { describe, it, expect } from "vitest";
import { layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import * as cookbook from "../../../apps/playground-spa/src/topics/catalog/cookbook.cdl";
import * as patterns from "../../../apps/playground-spa/src/topics/catalog/patterns.cdl";
import * as presets from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";
import * as primitives from "../../../apps/playground-spa/src/topics/catalog/primitives.cdl";
import * as primitivesExtra from "../../../apps/playground-spa/src/topics/catalog/primitives-extra.cdl";
import * as textDsl from "../../../apps/playground-spa/src/topics/catalog/text-dsl.cdl";
import * as animation from "../../../apps/playground-spa/src/topics/catalog/animation.cdl";
import * as styles from "../../../apps/playground-spa/src/topics/catalog/styles.cdl";

function isCdlDiagram(v: unknown): v is CdlDiagram {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    Array.isArray(o.nodes) &&
    Array.isArray(o.edges) &&
    Array.isArray(o.lanes) &&
    Array.isArray(o.phases)
  );
}

interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function segmentsIntersect(a: Segment, b: Segment): boolean {
  const d1 = (b.x2 - b.x1) * (a.y1 - b.y1) - (b.y2 - b.y1) * (a.x1 - b.x1);
  const d2 = (b.x2 - b.x1) * (a.y2 - b.y1) - (b.y2 - b.y1) * (a.x2 - b.x1);
  const d3 = (a.x2 - a.x1) * (b.y1 - a.y1) - (a.y2 - a.y1) * (b.x1 - a.x1);
  const d4 = (a.x2 - a.x1) * (b.y2 - a.y1) - (a.y2 - a.y1) * (b.x2 - a.x1);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function extractPathSegments(d: string): Segment[] {
  const out: Segment[] = [];
  const tokens = d.replace(/[A-Za-z]/g, " ").trim().split(/[\s,]+/).filter(Boolean);
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i + 1 < tokens.length; i += 2) {
    const x = parseFloat(tokens[i]!);
    const y = parseFloat(tokens[i + 1]!);
    if (Number.isFinite(x) && Number.isFinite(y)) points.push({ x, y });
  }
  for (let i = 0; i + 1 < points.length; i++) {
    out.push({ x1: points[i]!.x, y1: points[i]!.y, x2: points[i + 1]!.x, y2: points[i + 1]!.y });
  }
  return out;
}

function countCrossings(diag: CdlDiagram): number {
  const laid = layout(diag);
  const edgeSegs = laid.edges.map((e) => ({ id: e.id, segs: extractPathSegments(e.d) }));
  let total = 0;
  for (let i = 0; i < edgeSegs.length; i++) {
    const a = edgeSegs[i]!;
    for (let j = i + 1; j < edgeSegs.length; j++) {
      const b = edgeSegs[j]!;
      for (const sa of a.segs) {
        for (const sb of b.segs) {
          if (segmentsIntersect(sa, sb)) total++;
        }
      }
    }
  }
  return total;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
  return sorted[idx]!;
}

const sources = [cookbook, patterns, presets, primitives, primitivesExtra, textDsl, animation, styles];
const allDiagrams: CdlDiagram[] = sources.flatMap((mod) => Object.values(mod).filter(isCdlDiagram));

describe("edge-crossing distribution (深化 1 実測 tune 用)", () => {
  it("全 catalog diagram の crossing 分布を stderr dump", () => {
    const counts = allDiagrams.map((d) => ({ id: d.id, count: countCrossings(d) }));
    const nonZero = counts.filter((c) => c.count > 0);
    const sorted = nonZero.map((c) => c.count).sort((a, b) => a - b);
    const n = counts.length;
    const nzN = nonZero.length;
    const median = percentile(sorted, 0.5);
    const p90 = percentile(sorted, 0.9);
    const p95 = percentile(sorted, 0.95);
    const max = sorted.length > 0 ? sorted[sorted.length - 1]! : 0;
    const top5 = counts.sort((a, b) => b.count - a.count).slice(0, 5);

    process.stderr.write(
      `[crossing-distribution] total=${n} nonzero=${nzN} median=${median} p90=${p90} p95=${p95} max=${max}\n`,
    );
    for (const t of top5) {
      process.stderr.write(`  top: ${t.id} — ${t.count} crossings\n`);
    }
    expect(counts.length).toBeGreaterThan(0);
  });
});
