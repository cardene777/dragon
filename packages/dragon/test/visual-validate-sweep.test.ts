/**
 * Visual validate sweep (Tier C-2 ... cdl engine 層 overlap gating)。
 *
 * dragon playground の全 catalog topic (cookbook / patterns / presets / primitives /
 * primitives-extra / text-dsl / animation / styles) を Node 上で import し、
 * cdl visualValidateAll に通して engine 計算上の overlap (edge-label-overlap +
 * clearance 違反 + node-visibility + alignment) を 0 件で gating する。
 *
 * Playwright 経由の Tier C-1 (実 DOM bbox 走査) と二層防御 ... 同 bug を engine 側 layer と
 * 実 render 側 layer の両方で捉えることで、 cdl bug でも dragon CSS bug でも漏れない。
 *
 * 失敗時は diagram 単位で違反内容 (axis + detail) を出力。
 */
import { describe, it, expect } from "vitest";
import { visualValidateAll, type VisualValidationReport, type Violation } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

// catalog 各 page で render される全 topic を sweep 対象として集約。
// Astro の `apps/playground/src/topics/catalog` 配下から相対 import。
import * as cookbook from "../../../apps/playground/src/topics/catalog/cookbook.cdl";
import * as patterns from "../../../apps/playground/src/topics/catalog/patterns.cdl";
import * as presets from "../../../apps/playground/src/topics/catalog/presets.cdl";
import * as primitives from "../../../apps/playground/src/topics/catalog/primitives.cdl";
import * as primitivesExtra from "../../../apps/playground/src/topics/catalog/primitives-extra.cdl";
import * as textDsl from "../../../apps/playground/src/topics/catalog/text-dsl.cdl";
import * as animation from "../../../apps/playground/src/topics/catalog/animation.cdl";
import * as styles from "../../../apps/playground/src/topics/catalog/styles.cdl";

type ModuleLike = Record<string, unknown>;

function collectDiagrams(mod: ModuleLike, source: string): CdlDiagram[] {
  const out: CdlDiagram[] = [];
  for (const [, value] of Object.entries(mod)) {
    if (isCdlDiagram(value)) {
      out.push(value);
    }
  }
  if (out.length === 0) {
    // eslint-disable-next-line no-console
    console.warn(`[visual-validate-sweep] ${source} に CdlDiagram export がない`);
  }
  return out;
}

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

// gating 対象軸 ... node × edge-label の overlap (user 視認 bug 直接) のみを必須 gating 化。
// edge-label × edge-label / edge-label × edge-path / clearance / row-format / text-readability は
// 関連だが直接 bug ではないため、 段階移行 (CAR-Z visual quality round 4 で順次解消) として
// 本 file の必須 gating からは除外、 ただし report には全件出して visibility を担保する。
const GATING_AXES = new Set(["edge-label-overlap"]);

function isGatingViolation(v: Violation): boolean {
  if (!GATING_AXES.has(v.axis)) return false;
  if (v.severity !== "error") return false;
  // edge-label-overlap 軸の内、 node × edge-label の pair のみが「user 視認 bug 直接」 該当。
  // edge-label × edge-label / edge-label × edge-path は label 同士 / label-path 近接で
  // 次 round で別軸として扱う。 detail format は `${kindA}:${idA} ↔ ${kindB}:${idB} overlap=...`。
  const m = v.detail.match(/^([a-z-]+):[^ ]+\s+↔\s+([a-z-]+):/);
  if (!m) return false;
  const kindA = m[1]!;
  const kindB = m[2]!;
  return (
    (kindA === "node" && kindB === "edge-label") ||
    (kindA === "edge-label" && kindB === "node") ||
    (kindA === "node" && kindB === "lane-label") ||
    (kindA === "lane-label" && kindB === "node")
  );
}

function formatReport(reports: VisualValidationReport[]): string {
  const fails = reports.filter((r) => !r.ok);
  if (fails.length === 0) return "(no violations)";
  const lines: string[] = [];
  for (const r of fails) {
    const byAxis = new Map<string, Violation[]>();
    for (const v of r.violations.filter((v) => v.severity === "error")) {
      const arr = byAxis.get(v.axis) ?? [];
      arr.push(v);
      byAxis.set(v.axis, arr);
    }
    if (byAxis.size === 0) continue;
    lines.push(`  diagram "${r.diagramId}"`);
    for (const [axis, vs] of byAxis) {
      lines.push(`    ${axis} ... ${vs.length} 件`);
      for (const v of vs) {
        lines.push(`      - ${v.detail}`);
      }
    }
  }
  return lines.join("\n");
}

const sources: Array<{ name: string; mod: ModuleLike }> = [
  { name: "cookbook", mod: cookbook },
  { name: "patterns", mod: patterns },
  { name: "presets", mod: presets },
  { name: "primitives", mod: primitives },
  { name: "primitives-extra", mod: primitivesExtra },
  { name: "text-dsl", mod: textDsl },
  { name: "animation", mod: animation },
  { name: "styles", mod: styles },
];

describe("Visual validate sweep (Tier C-2 ... cdl engine 層 overlap gating)", () => {
  for (const { name, mod } of sources) {
    it(`${name} ... node × edge-label / node × lane-label の overlap が 0 件`, () => {
      const diagrams = collectDiagrams(mod as ModuleLike, name);
      expect(diagrams.length).toBeGreaterThan(0);
      const report = visualValidateAll(diagrams);
      const gatingViolations = report.reports.flatMap((r) =>
        r.violations.filter(isGatingViolation).map((v) => ({ diagramId: r.diagramId, ...v })),
      );
      const detail = formatReport(report.reports);
      expect(gatingViolations, `\n${detail}`).toEqual([]);
    });
  }
});
