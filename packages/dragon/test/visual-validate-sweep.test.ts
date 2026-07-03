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

// gating 対象軸 ... visualValidate の全 axis の error severity を必須 gating 化。
// cdl routing v6 (PR #44) + shift v5 (PR #45) + baseline (PR #46) + 空 label bbox guard (PR #48)
// の 4 段改良で border case は全て engine 側で解消済。 手作業 labelOffset は sample DSL から
// 全撤廃、 allowlist なしで全 diagram を必須 gating 化する。
function isGatingViolation(v: Violation & { diagramId?: string }): boolean {
  if (v.severity !== "error") return false;
  // pattern-passthrough は「a → router → c」 の意図的な通過設計、 edge-node-cross は design 通り。
  // pattern-hook は「a → hook → c」 の hook 割込み design、 同様に intentional 交差。
  if (
    (v.diagramId === "pattern-passthrough" || v.diagramId === "pattern-hook") &&
    v.axis === "edge-node-cross"
  ) {
    return false;
  }
  return true;
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
    it(`${name} ... visualValidate 全 axis error 0 件 (border case allowlist なし)`, () => {
      const diagrams = collectDiagrams(mod, name);
      expect(diagrams.length).toBeGreaterThan(0);
      const report = visualValidateAll(diagrams);
      const gatingViolations = report.reports.flatMap((r) =>
        r.violations.filter(isGatingViolation).map((v) => ({ diagramId: r.diagramId, ...v })),
      );
      const detail = formatReport(report.reports);
      // 5 新軸 (PR #75) 込みの warn / error 集計を stderr に流す (info は vitest で suppress される)
      const warnByAxis = new Map<string, number>();
      const errByAxis = new Map<string, number>();
      for (const r of report.reports) {
        for (const v of r.violations) {
          const bucket = v.severity === "warn" ? warnByAxis : errByAxis;
          bucket.set(v.axis, (bucket.get(v.axis) ?? 0) + 1);
        }
      }
      if (warnByAxis.size + errByAxis.size > 0) {
        const wSummary = Array.from(warnByAxis.entries()).map(([a, n]) => `${a}=${n}`).join(" ");
        const eSummary = Array.from(errByAxis.entries()).map(([a, n]) => `${a}=${n}`).join(" ");
        process.stderr.write(`[visual-validate-sweep ${name}] err(${eSummary || "-"}) warn(${wSummary || "-"})\n`);
        // group-boundary-clearance / lane-lane-gap / node-vertical-clearance sample 3 件
        const interestingAxes = new Set([
          "group-boundary-clearance",
          "lane-lane-gap",
          "node-vertical-clearance",
          "arrow-marker-clearance",
          "responsive-viewport",
          "grid-alignment",
          "phase-layout-stability",
          "accessibility-basics",
          "animation-frame-integrity",
          "i18n-cjk-detection",
          "contrast-basics",
          "print-media-compat",
          "svg-filter-integrity",
          "neumorphism-shadow-budget",
          "color-blind-safety",
          "marker-gradient-def-integrity",
        ]);
        const samples = report.reports
          .flatMap((r) => r.violations.filter((v) => interestingAxes.has(v.axis)))
          .slice(0, 3);
        for (const s of samples) {
          process.stderr.write(`  sample: ${s.axis} — ${s.detail} (diag=${(s as any).diagramId ?? "?"})\n`);
        }
      }
      expect(gatingViolations, `\n${detail}`).toEqual([]);
    });
  }
});
