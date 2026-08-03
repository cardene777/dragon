import { describe, it, expect } from "vitest";
import { visualValidateAll } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import * as interactive from "../../../apps/playground-spa/src/topics/catalog/interactive.cdl";

/**
 * #398: interactive catalog の lane-spacing 由来 clearance error 回帰 test。
 *
 * shape-circle / shape-arc / week-calendar は node が lane 内で中心配置され、 lane pitch が
 * 過小だと隣接 node の端間 gap が NEAR_COLLISION_POLICY (node|node 70px) を下回り clearance
 * error になっていた。 lane pitch を広げて gap >= 70px を確保する fix の回帰を防ぐ。
 *
 * 対象 3 diagram は全 axis error 0 まで解消済のため、 clearance 以外も含めた error 0 を assert
 * する。
 *
 * interactive category 全 129 diagram は visual-validate-sweep 側で gating 済 (#398)。 本 file は
 * その部分集合を個別に持つが、 3 diagram に絞って fail させることで「どの図の lane pitch が
 * 戻ったか」 を sweep より早く名指しできる。 sweep が category 単位でしか落ちないのを補う役割。
 */
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

function collectDiagrams(): CdlDiagram[] {
  const out: CdlDiagram[] = [];
  for (const [, value] of Object.entries(interactive)) {
    if (isCdlDiagram(value)) out.push(value);
  }
  return out;
}

describe("#398 interactive catalog lane-spacing clearance", () => {
  const diagrams = collectDiagrams();
  const report = visualValidateAll(diagrams, { profile: "catalog" });
  const byId = new Map(report.reports.map((r) => [r.diagramId, r]));

  const fixedIds = ["interactive-shape-circle", "interactive-shape-arc", "interactive-week-calendar"];

  for (const id of fixedIds) {
    it(`${id} は clearance error 0 件 (lane pitch >= node gap 70px)`, () => {
      const r = byId.get(id);
      expect(r, `${id} が report に存在する`).toBeDefined();
      const clearance = r!.violations.filter((v) => v.axis === "clearance" && v.severity === "error");
      expect(clearance, clearance.map((v) => v.detail).join("\n")).toHaveLength(0);
    });
  }

  it("3 diagram は全 axis error 0 件 (fix で新規 error を持ち込まない)", () => {
    for (const id of fixedIds) {
      const r = byId.get(id);
      const errors = r!.violations.filter((v) => v.severity === "error");
      expect(errors, `${id}: ${errors.map((v) => `${v.axis}=${v.detail}`).join("; ")}`).toHaveLength(0);
    }
  });
});
