import { describe, it, expect } from "vitest";
import { visualValidateAll } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import * as interactive from "../../../apps/playground-spa/src/topics/catalog/interactive.cdl";

/**
 * #885 text-readability regression guard (interactive.cdl catalog、 全 diagram 検査)。
 *
 * 背景 ... visualValidate の text-readability axis は「題の幅 + 余白 > node.w + 8」 で
 * 「title が node 幅を超えて切れる可能性」 を warn する。 interactive catalog は当初 128 warn。
 *
 * 題の幅の出し方は engine が 3 度直している (`^0.107.0` 時点)。 字数に 22 を掛ける形から、
 * 種別ごとの字の大きさ (cdl#946)、字ごとの実幅 (cdl#949) を経て、実描画に合わせた見積り
 * (cdl#951) になった。 挙がっていた件はいずれも実際には収まっており、いまは 1 件も挙がらない。
 *
 * 方針 ... node の `w` (幅) と lane の x / width は一切変えず、 title (と一部 subtitle) の文字列だけを
 * node 幅に収まる長さへ短縮して解消した。 width を広げる方式は multi-lane 図 (例 xypad-nav = 4 lane
 * pitch 180) で隣 lane の node と視覚的に重なり catalog が崩れる (clearance axis は cross-lane 横 overlap
 * を検査しないため validator は素通りする) ため不採用。
 *
 * 本 test は 2 つを固定する。
 * 1. interactive 全 diagram の text-readability warn を全件検査し、 許容した件 (下記 ALLOWED) 以外が
 *    0 件かつ総数が `ALLOWED.size` を超えないことを assert する (件数は ALLOWED が SSOT)。 代表 diagram だけでなく全体を lock するため、
 *    未検証 diagram での warn 再発も検知できる (代表の図だけを見る形では届かない範囲)。 これが
 *    本 test の本丸。
 * 2. cross-lane overlap の heuristic guard (補助 check)。 本 change 自体の overlap 安全性は「diff が
 *    node.w / lane を一切変えない」 width invariant で担保する (title/subtitle 短縮のみ)。 本 guard は
 *    将来 explicit w を広げる先祖返りを早期検知する補助であり、 完全な overlap 検査ではない。 built
 *    diagram 上で default 幅 node は w=undefined (render 時に default 適用) のため真の AABB を取れず、
 *    「explicit w を持つ node が隣接 lane との中点を越えて、 その隣 lane 同 stack に node が居る」 class
 *    のみを midpoint proxy で検知する (xypad-nav を widen した崩れ class = RED→GREEN 実証済)。 default
 *    幅 neighbor の張出しや中間 lane が空の非隣接 overlap は検知対象外。
 *
 * 許容した件は **0 件** (#2701)。 見本帳の題 407 か所を `getComputedTextLength()` で測ると、
 * 箱の端まで 8px を切る題は 1 件も無かった。 残っていた 2 件も実測では箱の中に 26px の余白を
 * 残しており、engine 側の見積りが実描画より広かっただけだった (cdl#951 で直した)。
 *
 * **一覧は空のまま置く**。 新しく挙がった時に、何を許したのかではなく「1 件も許していない」
 * ことが読めるようにするため。 追記する時は理由と行き先を必ず添える。
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

/** 題が箱を超えることを許した warn (`${diagramId}::${nodeId}`)。 いまは 0 件 (#2701)。 */
const ALLOWED = new Set<string>([]);

describe("#885 interactive text-readability (全 diagram 検査)", () => {
  const diagrams = collectDiagrams();
  const report = visualValidateAll(diagrams, { profile: "catalog" });

  it("interactive の全 diagram が存在する (import が空でない)", () => {
    expect(diagrams.length).toBeGreaterThan(50);
  });

  it("text-readability warn が 0 件 (許容した件は無い)", () => {
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
