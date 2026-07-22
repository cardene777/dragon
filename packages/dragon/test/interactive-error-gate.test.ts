import { describe, it, expect } from "vitest";
import { visualValidateAll, layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { timelineDrive, kpiDashboard } from "../../../apps/playground-spa/src/topics/catalog/interactive.cdl";

/**
 * #401 interactive error-0 gate (段階拡張)。
 *
 * #401 の壁打ち (2026-07-22) で「interactive の残 visualValidate error を error-0 に解消し、 全 interactive
 * diagram を error-0 で gating する」 と再 scope した。 error のみが sweep gate を fail させる (warn は
 * block しない) ため、 本 gate は error 0 を段階的に固定する。
 *
 * 本 file は解消済 diagram を列挙して error 0 を assert する。
 *
 * #401 は機械修正 (timeline-drive + kpi-dashboard、 interactive error 14→11) の scope で完了し、
 * 残件は #892 に分離する (本 PR の merge で `Closes #401` を発火、 2026-07-23 判断)。 3 exemplar は
 * いずれも edge-label 過密だが原因は個別に異なり、 labelOffset tuning では error-0 に収束しない
 * (oauth で 8 iteration 検証、 6→1〜3 で oscillation) fundamental layout redesign が必要な別 class:
 *   - oauth-flow = 3 node + 6 edge (client↔consent の 4 bidirectional labeled edge が中間帯に集中)
 *   - traffic-sankey = 6 node + 8 一方向 edge (funnel の合流で label が sub-path に重なる)
 *   - notification-flow = 7 node + 7 edge (fcm hub への fan-out 集中で label が hub 周辺に密集)
 * #892 完了時に FIXED へ 3 exemplar を追加して gate を拡張する。
 *
 * stage 1 = interactive-timeline-drive。
 *   - node "r" (dyn-rect bar) を w:60 → 80 に拡張して node-visibility error (最小 80x40 未満) を解消。
 *   - fan-out edge label を短縮 + labelOffsetX で bar lane 内に収め、 lane-border-clearance error
 *     (edge label が非発着 lane bar の border を貫通) を解消。
 * stage 2 = interactive-kpi-dashboard。
 *   - Revenue→npsCard edge に side:"bottom" を追加し、 Revenue→churnCard の上方 detour (crest y≈78) と
 *     別に nps を下方 detour (crest y≈318) へ実 Y 分離して detour-slot-distinct error を解消。
 *   - 注意 = visualValidate の detour-slot-distinct は 2 edge の単一 peak 点比較で、 peak X 差が 60 超
 *     だと比較を skip する blind spot がある (cdl engine #890)。 side:"left" は peak X を動かすだけで
 *     水平 crest は同 y=78 で重なり validator を素通りする false green だった。 error 0 だけでは false
 *     green を検知できないため、 下記「crest Y 実分離」 assert で 2 detour edge の主水平区間 Y が実際に
 *     分離していることを座標で固定する (side:"left" に戻すと本 assert が fail する)。
 */
const FIXED: Array<{ name: string; diagram: CdlDiagram }> = [
  { name: "interactive-timeline-drive", diagram: timelineDrive },
  { name: "interactive-kpi-dashboard", diagram: kpiDashboard },
];

/** SVG path `d` の M/L/Q(終点) から絶対点列を抽出する。 */
function pathPoints(d: string): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  const re = /([MLQ])\s*([\d.]+)\s+([\d.]+)(?:\s*,\s*([\d.]+)\s+([\d.]+))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d)) !== null) {
    if (m[1] === "Q" && m[4] !== undefined) pts.push([parseFloat(m[4]), parseFloat(m[5]!)]);
    else pts.push([parseFloat(m[2]!), parseFloat(m[3]!)]);
  }
  return pts;
}

/** edge path の主水平区間 (最長の同一 Y segment) の Y = detour crest Y。 */
function mainCrestY(d: string): number {
  const pts = pathPoints(d);
  let bestLen = -1;
  let bestY = NaN;
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i - 1]!;
    const [x2, y2] = pts[i]!;
    if (Math.abs(y1 - y2) < 1) {
      const len = Math.abs(x2 - x1);
      if (len > bestLen) {
        bestLen = len;
        bestY = y1;
      }
    }
  }
  return bestY;
}

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

  it("kpi-dashboard の Revenue→churn / Revenue→nps detour が crest Y で実分離 (false green guard)", () => {
    const laid = (layout as (d: CdlDiagram) => { edges: Array<{ to?: string; d?: string }> })(kpiDashboard);
    const churn = laid.edges.find((e) => e.to === "churnCard");
    const nps = laid.edges.find((e) => e.to === "npsCard");
    expect(churn?.d, "churn edge path").toBeTruthy();
    expect(nps?.d, "nps edge path").toBeTruthy();
    const churnY = mainCrestY(churn!.d!);
    const npsY = mainCrestY(nps!.d!);
    // validator の blind spot を突く false green (side:"left" = 両 crest 同 y=78) を検知するため、
    // 2 detour edge の主水平区間 Y が最低 30px 分離していることを座標で固定する。
    expect(
      Math.abs(churnY - npsY),
      `churn crest Y=${churnY} と nps crest Y=${npsY} の分離が不足 (side:"left" 由来の false green?)`,
    ).toBeGreaterThanOrEqual(30);
  });
});
