import { describe, it, expect } from "vitest";
import { visualValidateAll } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { timelineDrive } from "../../../apps/playground-spa/src/topics/catalog/interactive.cdl";

/**
 * #401 interactive error-0 gate (段階拡張)。
 *
 * #401 の壁打ち (2026-07-22) で「interactive の残 visualValidate error を error-0 に解消し、 全 interactive
 * diagram を error-0 で gating する」 と再 scope した。 error のみが sweep gate を fail させる (warn は
 * block しない) ため、 本 gate は error 0 を段階的に固定する。
 *
 * 本 file は解消済 diagram を列挙して error 0 を assert する。 全 error 解消後に対象を全 interactive
 * diagram へ拡張して #401 を close する。
 *
 * stage 1 (本 commit) = interactive-timeline-drive。
 *   - node "r" (dyn-rect bar) を w:60 → 80 に拡張して node-visibility error (最小 80x40 未満) を解消。
 *   - fan-out edge label を短縮 + labelOffsetX で bar lane 内に収め、 lane-border-clearance error
 *     (edge label が非発着 lane bar の border を貫通) を解消。
 */
const FIXED: Array<{ name: string; diagram: CdlDiagram }> = [
  { name: "interactive-timeline-drive", diagram: timelineDrive },
];

describe("#401 interactive error-0 gate", () => {
  const report = visualValidateAll(FIXED.map((f) => f.diagram));

  for (const { name } of FIXED) {
    it(`${name} は visualValidate error 0 件`, () => {
      const r = report.reports.find((rep) => rep.diagramId === name);
      expect(r, `report for ${name} が見つからない`).toBeDefined();
      const errors = r!.violations.filter((v) => v.severity === "error");
      expect(
        errors.map((v) => `${v.axis}: ${v.detail}`),
        `${name} に error 残存`,
      ).toEqual([]);
    });
  }
});
