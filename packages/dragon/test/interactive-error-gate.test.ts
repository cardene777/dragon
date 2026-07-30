import { describe, it, expect } from "vitest";
import { visualValidateAll, layout, requiredNearClearance } from "@cardenelabs/cdl";
import type { BBox, CdlDiagram } from "@cardenelabs/cdl";
import {
  timelineDrive,
  kpiDashboard,
  oauthFlow,
  trafficSankey,
  exemplarNotificationFlow,
} from "../../../apps/playground-spa/src/topics/catalog/interactive.cdl";

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
  // stage 3 (#892) = exemplar 3 件。 いずれも「label を置く場所が足りない」 が原因で、 layout の
  // 作り替えは要らなかった。 詳細は各図の comment。
  //   - oauth-flow ... lane 間隔を広げて label を 2 列 × 2 段に置ける幅を作る (7 → 0)
  //   - traffic-sankey ... 縦区間 2 本の間に挟まれた label を横へ 90 逃がす (4 → 0)
  //   - notification-flow ... 同じ高さに並んだ label を縦区間の上へ 120 逃がす (1 → 0)
  { name: "interactive-oauth-flow", diagram: oauthFlow },
  { name: "interactive-traffic-sankey", diagram: trafficSankey },
  { name: "interactive-exemplar-notification-flow", diagram: exemplarNotificationFlow },
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

/**
 * #892 = exemplar 3 件の配置を validator とは別経路で固定する。
 *
 * error 0 は validator の判定で、 validator が見ていない崩れは通ってしまう (stage 2 で実証済)。
 * ここでは `laid.bboxes` の矩形を直接測る。 距離と閾値は cdl 側と同じものを使う =
 * 距離は `computeGap` と同じ hypot、 閾値は `requiredNearClearance` (edge-label 同士は 36)。
 *
 * 全対の一括 assert だけでは、 offset を 1 つ戻した時に落ちない組合せがある (実測)。 各図で
 * 実際に問題だった対を個別に assert して、 どの offset を戻しても落ちる状態にする。
 */
describe("#892 exemplar 3 件の配置を座標で固定", () => {
  /** cdl の `computeGap` と同じ計算。 交差していれば 0、 離れていれば最短距離。 */
  const gapOf = (a: BBox, b: BBox): number => {
    const dx = Math.max(0, Math.max(a.x - (b.x + b.w), b.x - (a.x + a.w)));
    const dy = Math.max(0, Math.max(a.y - (b.y + b.h), b.y - (a.y + a.h)));
    return Math.hypot(dx, dy);
  };
  const boxOf = (laid: ReturnType<typeof layout>, kind: BBox["kind"], id: string): BBox => {
    const b = laid.bboxes.find((x) => x.kind === kind && x.id === id);
    expect(b, `${kind} "${id}" の矩形が無い`).toBeDefined();
    return b!;
  };
  /**
   * label 矩形と path の最短距離。
   *
   * cdl は AABB ではなく「label の 8 点 (4 隅 + 4 辺中央) から線分列までの最短距離」 で測る
   * (迂回する path では AABB が実距離より大きく出て見逃すため)。 同じ測り方をする。
   * cdl 側の helper は package から export されていないので、 同 file の `pathPoints` を使う。
   */
  const labelToPathGap = (box: BBox, d: string): number => {
    const pts = pathPoints(d);
    const probes: Array<[number, number]> = [
      [box.x, box.y], [box.x + box.w, box.y], [box.x, box.y + box.h], [box.x + box.w, box.y + box.h],
      [box.x + box.w / 2, box.y], [box.x + box.w / 2, box.y + box.h],
      [box.x, box.y + box.h / 2], [box.x + box.w, box.y + box.h / 2],
    ];
    let best = Infinity;
    for (let i = 1; i < pts.length; i++) {
      const [x1, y1] = pts[i - 1]!;
      const [x2, y2] = pts[i]!;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len2 = dx * dx + dy * dy;
      for (const [px, py] of probes) {
        const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
        best = Math.min(best, Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t)));
      }
    }
    return best;
  };
  const LABEL_MIN = requiredNearClearance("edge-label", "edge-label");
  const PATH_MIN = requiredNearClearance("edge-label", "edge-path");
  const NODE_MIN = requiredNearClearance("node", "edge-label");

  it(`edge-label 同士の spec が 36 である (閾値を実装から引いている)`, () => {
    // 16 は path 用の default。 取り違えると緩い判定を固定してしまう。
    expect(LABEL_MIN).toBe(36);
    expect(PATH_MIN).toBe(14);
    expect(NODE_MIN).toBe(32);
  });

  it("oauth-flow = 往復 4 本の label が 2 列 × 2 段で離れている", () => {
    const laid = layout(oauthFlow);
    const ids = ["client-consent", "consent-client", "code-exchange", "token-issue"];
    const boxes = ids.map((id) => boxOf(laid, "edge-label", id));
    // 縦 1 列に積むと段の間が 60 で pill 高 68 に足りない。 2 列にして全対を 36 以上にする。
    const tight: string[] = [];
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const g = gapOf(boxes[i]!, boxes[j]!);
        if (g < LABEL_MIN) tight.push(`${ids[i]} ↔ ${ids[j]} gap ${g.toFixed(1)}`);
      }
    }
    expect(tight, `近すぎる label 対:\n${tight.join("\n")}`).toHaveLength(0);
    // 2 列であること = 中心 X が 2 つの値に分かれ、 列の間が pill 幅より広い。 左端で比べると
    // pill 幅が label の文字数で変わるため一致しない。
    const cxs = boxes.map((b) => b.x + b.w / 2).sort((a, b) => a - b);
    expect(cxs[1]! - cxs[0]!, "左列の 2 つの中心 X が揃っていない").toBeLessThan(1);
    expect(cxs[3]! - cxs[2]!, "右列の 2 つの中心 X が揃っていない").toBeLessThan(1);
    expect(cxs[2]! - cxs[0]!, "2 列が横に離れていない").toBeGreaterThan(300);
  });

  it("oauth-flow = 迂回する 2 本の label が上下に分かれている", () => {
    const laid = layout(oauthFlow);
    const up = boxOf(laid, "edge-label", "client-api");
    const down = boxOf(laid, "edge-label", "api-client");
    // 何もしないと同じ点に乗る (実測 = 重なり面積 12215)。
    expect(gapOf(up, down), "迂回 2 本の label が近すぎる").toBeGreaterThanOrEqual(LABEL_MIN);
    expect(down.y, "6 の label が 5 より下に無い").toBeGreaterThan(up.y);
    // 迂回の向きも分かれている = 2 本の主水平区間の Y が離れている
    const crest = (id: string): number => mainCrestY(laid.edges.find((e) => e.id === id)!.d);
    expect(Math.abs(crest("client-api") - crest("api-client"))).toBeGreaterThan(100);
  });

  it("traffic-sankey = search → product の label が縦区間 2 本から離れている", () => {
    const laid = layout(trafficSankey);
    const label = boxOf(laid, "edge-label", "search-product");
    // 自 path の縦区間 (x=540) と direct-home の縦区間 (x=507) の間に置くと、 どちらの path も
    // 貫く。 label を右へ逃がした結果、 別 edge の path から PATH_MIN 以上離れる。
    const others = laid.edges.filter((e) => e.id !== "search-product");
    const tight = others
      .map((e) => ({ id: e.id, g: labelToPathGap(label, e.d) }))
      .filter((x) => x.g < PATH_MIN);
    expect(tight, `path に近すぎる:\n${tight.map((x) => `${x.id} gap ${x.g.toFixed(1)}`).join("\n")}`).toHaveLength(0);
    // node にも重なっていない
    const nodes = laid.bboxes.filter((b) => b.kind === "node");
    const onNode = nodes.filter((n) => gapOf(n, label) < NODE_MIN).map((n) => n.id);
    expect(onNode, `node に近すぎる: ${onNode.join(",")}`).toHaveLength(0);
  });

  it("notification-flow = kafka → fcm と fcm → iphone の label が離れている", () => {
    const laid = layout(exemplarNotificationFlow);
    const a = boxOf(laid, "edge-label", "kafka-fcm");
    const b = boxOf(laid, "edge-label", "fcm-iphone");
    // 元は同じ高さ (y=438) に並んで 12.1px しか離れていなかった。
    expect(gapOf(a, b), "2 label が近すぎる").toBeGreaterThanOrEqual(LABEL_MIN);
  });

  it("oauth-flow = label を 1 文字伸ばしても error 0 のまま (余裕がある配置)", () => {
    // ±45 では 0 件だが `2. consent screen` に 1 文字足すと 5 件戻った。 文言の修正や翻訳で
    // 崩れる配置は「たまたま今の文字数で成立している」 だけなので、 1 文字分の余裕を固定する。
    const ids = ["client-consent", "consent-client", "code-exchange", "token-issue"];
    const broke: string[] = [];
    for (const target of [...ids, "(全部)"]) {
      const d = JSON.parse(JSON.stringify(oauthFlow)) as CdlDiagram;
      for (const id of ids) {
        if (target !== "(全部)" && id !== target) continue;
        const e = d.edges.find((x) => x.id === id) as { label: string };
        e.label = `${e.label}X`;
      }
      const errs = (visualValidateAll([d]).reports[0]?.violations ?? []).filter((v) => v.severity === "error");
      if (errs.length > 0) broke.push(`${target} を 1 文字伸ばすと ${errs.length} 件: ${errs.map((v) => v.axis).join(",")}`);
    }
    expect(broke, `1 文字で崩れる:\n${broke.join("\n")}`).toHaveLength(0);
  });

  it("3 図とも全 edge-label 対が spec 以上離れている (取りこぼし防止)", () => {
    for (const d of [oauthFlow, trafficSankey, exemplarNotificationFlow]) {
      const laid = layout(d);
      const labels = laid.bboxes.filter((x) => x.kind === "edge-label");
      expect(labels.length, `${d.id} の edge-label が取れていない`).toBeGreaterThan(1);
      const tight: string[] = [];
      for (let i = 0; i < labels.length; i++) {
        for (let j = i + 1; j < labels.length; j++) {
          const g = gapOf(labels[i]!, labels[j]!);
          if (g < LABEL_MIN) tight.push(`${d.id}: ${labels[i]!.id} ↔ ${labels[j]!.id} gap ${g.toFixed(1)}`);
        }
      }
      expect(tight, `近すぎる label 対:\n${tight.join("\n")}`).toHaveLength(0);
    }
  });
});
