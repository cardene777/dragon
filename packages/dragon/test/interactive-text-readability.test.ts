import { describe, it, expect } from "vitest";
import { visualValidateAll } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import * as interactive from "../../../apps/playground-spa/src/topics/catalog/interactive.cdl";

/**
 * #885 text-readability regression guard (interactive.cdl catalog、 全 diagram 検査)。
 *
 * 背景 ... visualValidate の text-readability axis は `title.length * 22 + 52 > node.w + 8` で
 * 「title が node 幅を超えて切れる可能性」 を warn する。 interactive catalog は当初 128 warn。
 *
 * 方針 ... node の `w` (幅) と lane の x / width は一切変えず、 title (と一部 subtitle) の文字列だけを
 * node 幅に収まる長さへ短縮して解消した。 width を広げる方式は multi-lane 図 (例 xypad-nav = 4 lane
 * pitch 180) で隣 lane の node と視覚的に重なり catalog が崩れる (clearance axis は cross-lane 横 overlap
 * を検査しないため validator は素通りする) ため不採用。
 *
 * 本 test は 2 つを固定する。
 * 1. interactive 全 diagram の text-readability warn を全件検査し、 許容 13 件 (下記 ALLOWED) 以外が
 *    0 件かつ総数が 13 を超えないことを assert する。 代表 diagram だけでなく全体を lock するため、
 *    未検証 diagram での warn 再発も検知できる (cc-codex #885 MAJOR = coverage gap の対応)。 これが
 *    本 test の本丸。
 * 2. cross-lane overlap の heuristic guard (補助 check)。 本 change 自体の overlap 安全性は「diff が
 *    node.w / lane を一切変えない」 width invariant で担保する (title/subtitle 短縮のみ)。 本 guard は
 *    将来 explicit w を広げる先祖返りを早期検知する補助であり、 完全な overlap 検査ではない。 built
 *    diagram 上で default 幅 node は w=undefined (render 時に default 適用) のため真の AABB を取れず、
 *    「explicit w を持つ node が隣接 lane との中点を越えて、 その隣 lane 同 stack に node が居る」 class
 *    のみを midpoint proxy で検知する (xypad-nav を widen した崩れ class = RED→GREEN 実証済)。 default
 *    幅 neighbor の張出しや中間 lane が空の非隣接 overlap は検知対象外。
 *
 * 許容 13 件 ... node 幅 60-100px の極小 shape node (shape-rect の bar 4 / shape-chain の block 3 /
 * repeat-chain の block 5 / timeline-drive の r 1)。 幅 100px で最大 2 文字、 80px で 1 文字、 60px で
 * 0 文字しか収まらず、 意味を保つ label に短縮できないため対象外 (無理に潰すと教育的価値を壊す)。
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

/** 極小 shape node で短縮不能な許容 warn (`${diagramId}::${nodeId}`)。 */
const ALLOWED = new Set<string>([
  "interactive-shape-rect::barLow",
  "interactive-shape-rect::barMid",
  "interactive-shape-rect::barHigh",
  "interactive-shape-rect::bar",
  "interactive-shape-chain::r1",
  "interactive-shape-chain::r2",
  "interactive-shape-chain::r3",
  "interactive-repeat-chain::r0",
  "interactive-repeat-chain::r1",
  "interactive-repeat-chain::r2",
  "interactive-repeat-chain::r3",
  "interactive-repeat-chain::r4",
  "interactive-timeline-drive::r",
]);

describe("#885 interactive text-readability (全 diagram 検査)", () => {
  const diagrams = collectDiagrams();
  const report = visualValidateAll(diagrams, { profile: "catalog" });

  it("interactive の全 diagram が存在する (import が空でない)", () => {
    expect(diagrams.length).toBeGreaterThan(50);
  });

  it("text-readability warn は許容 13 件 (極小 shape node) 以外 0 件", () => {
    const offenders: string[] = [];
    for (const r of report.reports) {
      for (const v of r.violations) {
        if (v.axis !== "text-readability" || v.severity !== "warn") continue;
        const m = /node "([^"]+)"/.exec(v.detail);
        const nodeId = m ? m[1] : "?";
        const key = `${r.diagramId}::${nodeId}`;
        if (!ALLOWED.has(key)) offenders.push(`${key} — ${v.detail}`);
      }
    }
    expect(offenders, `allowlist 外の text-readability warn:\n${offenders.join("\n")}`).toHaveLength(0);
  });

  it("text-readability warn 総数は allowlist 件数を超えない (回帰検知)", () => {
    let total = 0;
    for (const r of report.reports) {
      for (const v of r.violations) {
        if (v.axis === "text-readability" && v.severity === "warn") total++;
      }
    }
    expect(total).toBeLessThanOrEqual(ALLOWED.size);
  });

  it("cross-lane overlap heuristic = explicit w の node が隣 lane 中点を越えない (widen 先祖返りの早期検知)", () => {
    // 補助 guard (完全 overlap 検査ではない、 § 冒頭 comment 参照)。 built diagram 上 default 幅 node は
    // w=undefined のため真の span を取れず、 「明示 w を持つ node が隣接 lane との中点を越え、 かつその
    // 隣 lane 同 stack に node が居る」 class のみを midpoint proxy で検知する。 本 change の overlap 安全性
    // 自体は diff の width invariant (w/lane 不変) で担保済で、 本 guard は将来の widen 先祖返り検知用。
    const overlaps: string[] = [];
    for (const d of diagrams) {
      const lanes = d.lanes
        .filter((l) => l.x !== undefined)
        .map((l) => ({ id: l.id, center: (l.x as number) + l.width / 2 }))
        .sort((a, b) => a.center - b.center);
      const laneIdx = new Map(lanes.map((l, i) => [l.id, i]));
      const occupied = new Set(d.nodes.map((n) => `${n.lane}::${n.stack}`));
      for (const n of d.nodes) {
        if (typeof n.w !== "number") continue;
        const idx = laneIdx.get(n.lane);
        if (idx === undefined) continue;
        const center = lanes[idx]!.center;
        const right = center + n.w / 2;
        const left = center - n.w / 2;
        const rN = lanes[idx + 1];
        if (rN && occupied.has(`${rN.id}::${n.stack}`)) {
          const mid = (center + rN.center) / 2;
          if (right > mid + 1) overlaps.push(`${d.id} stack ${n.stack}: ${n.id} (w${n.w}) が右隣 ${rN.id} 領域へ食込み (right ${right.toFixed(0)} > mid ${mid.toFixed(0)})`);
        }
        const lN = lanes[idx - 1];
        if (lN && occupied.has(`${lN.id}::${n.stack}`)) {
          const mid = (center + lN.center) / 2;
          if (left < mid - 1) overlaps.push(`${d.id} stack ${n.stack}: ${n.id} (w${n.w}) が左隣 ${lN.id} 領域へ食込み (left ${left.toFixed(0)} < mid ${mid.toFixed(0)})`);
        }
      }
    }
    expect(overlaps, `cross-lane overlap:\n${overlaps.join("\n")}`).toHaveLength(0);
  });
});
