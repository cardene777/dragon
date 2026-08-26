import { describe, it, expect } from "vitest";
import { visualValidateAll, layout, requiredNearClearance } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

/**
 * 図の要素が占める矩形 (#1416)。
 *
 * cdl は内部で同じ形を `BBox` として持つが、**公開 API に含めていない**
 * (`dist/index.d.ts` の export に無い)。 dragon 側からは直せないので、検査が使う形を
 * ここに宣言する。
 *
 * cdl 側が公開したら import に戻す。 それまでは形がずれていないかを
 * § 宣言した矩形が実物と噛み合う が見る。
 */
type BBox = {
  kind: "node" | "lane-label" | "edge-label" | "edge-path";
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
};
import {
  timelineDrive,
  kpiDashboard,
  interactiveOauthFlow,
  trafficSankey,
  exemplarNotificationFlow,
} from "../../../apps/playground-spa/src/topics/catalog/interactive.cdl";
import { at } from "./support/at";

/**
 * #401 interactive error-0 gate (段階拡張)。
 *
 * #401 の壁打ち (2026-07-22) で「interactive の残 visualValidate error を error-0 に解消し、 全 interactive
 * diagram を error-0 で gating する」 と再 scope した。 error のみが sweep gate を fail させる (warn は
 * block しない) ため、 本 gate は error 0 を段階的に固定する。
 *
 * 本 file は解消済 diagram を列挙して error 0 を assert する。
 *
 * 【段階拡張の到達点 (Issue #398)】
 * 「全 interactive diagram を error-0 で gating」 は visual-validate-sweep.test.ts が
 * interactive category 全 129 diagram を収録したことで達成済。 error-0 だけを足す目的で
 * 下の FIXED に diagram を追加する必要はもう無い。
 * 本 file が引き続き担うのは、 validator が見ていない崩れを座標で直接固定する assert 群
 * (crest Y 実分離 / label と弧の対応 等) = error 0 では検知できない false green の guard。
 *
 * #401 は機械修正 (timeline-drive + kpi-dashboard、 interactive error 14→11) の scope、 残件の
 * 3 exemplar は #892 に分離した。 3 exemplar はいずれも edge-label 過密だが原因は個別に異なり、
 * labelOffset tuning では error-0 に収束しなかった (oauth で 8 iteration 検証、 6→1〜3 で oscillation):
 *   - oauth-flow = 3 node + 6 edge (client↔consent の 4 bidirectional labeled edge が中間帯に集中)
 *   - traffic-sankey = 6 node + 8 一方向 edge (funnel の合流で label が sub-path に重なる)
 *   - notification-flow = 7 node + 7 edge (fcm hub への fan-out 集中で label が hub 周辺に密集)
 * 3 exemplar は #892 で解消済で、 下の FIXED (stage 3) に入っている。
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
  //   - oauth-flow ... 同じ横線を通る 4 本の label の置き場所。 当初は手作業で 2 列 × 2 段に
  //     散らしていたが、 engine が重ねずに置けるようになったので手作業を外した (cdl#372 /
  //     cdl#374、 dragon#968)。 lane 間隔は効かない = cdl が label 幅に合わせて自動で広げる
  //   - traffic-sankey ... 縦区間 2 本の間に挟まれた label を横へ 90 逃がす (4 → 0)
  //   - notification-flow ... 同じ高さに並んだ label を縦区間の上へ 120 逃がす (1 → 0)
  { name: "interactive-oauth-flow", diagram: interactiveOauthFlow },
  { name: "interactive-traffic-sankey", diagram: trafficSankey },
  { name: "interactive-exemplar-notification-flow", diagram: exemplarNotificationFlow },
];

/** SVG path `d` の M/L/Q(終点) から絶対点列を抽出する。 */
function pathPoints(d: string): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  const re = /([MLQ])\s*([\d.]+)\s+([\d.]+)(?:\s*,\s*([\d.]+)\s+([\d.]+))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d)) !== null) {
    // **`at()` を通さない**。 任意の群 (`(?:...)?`) は一致しなければ `undefined` になるのが
    // 正常で、`at()` は「無い = 前提が崩れた」 として落とす道具なので噛み合わない
    if (m[1] === "Q" && m[4] !== undefined) pts.push([parseFloat(m[4]), parseFloat(m[5]!)]);
    else pts.push([parseFloat(m[2]!), parseFloat(m[3]!)]);
  }
  return pts;
}

/**
 * 実際に描かれる曲線の中央の高さ。
 *
 * `pathPoints` は `Q` の制御点を捨てて終点だけを拾うため、 端点が同じ高さで膨らむ弧は全て
 * 同じ値になる (実測 = oauth の 4 本が全て 203)。 弧どうしの上下を比べる用途では使えない。
 * ここでは制御点を含めて二次曲線を刻み、 通る点の平均を取る。
 */
function curveMidY(d: string): number {
  const re = /([MLQ])\s*(-?[\d.]+)\s+(-?[\d.]+)(?:\s*,?\s*(-?[\d.]+)\s+(-?[\d.]+))?/g;
  const ys: number[] = [];
  let cur: [number, number] = [0, 0];
  let m: RegExpExecArray | null;
  while ((m = re.exec(d)) !== null) {
    if (at(m, 1, "m") === "M") {
      cur = [parseFloat(m[2]!), parseFloat(m[3]!)];
    } else if (at(m, 1, "m") === "L") {
      const next: [number, number] = [parseFloat(m[2]!), parseFloat(m[3]!)];
      ys.push((at(cur, 1, "cur") + at(next, 1, "next")) / 2);
      cur = next;
      // 任意の群 (`(?:...)?`) は一致しなければ `undefined` になるのが正常なので
      // `at()` を通さない (`at()` は「無い = 前提が崩れた」 として落とす道具)
    } else if (m[4] !== undefined) {
      // 制御点は y しか使わない (求めるのが `ys` のため)
      const cy = parseFloat(m[3]!);
      const next: [number, number] = [parseFloat(m[4]!), parseFloat(m[5]!)];
      // 二次曲線を 16 分割して通る点の平均を取る
      for (let i = 1; i <= 16; i++) {
        const t = i / 16;
        const u = 1 - t;
        ys.push(u * u * at(cur, 1, "cur") + 2 * u * t * cy + t * t * at(next, 1, "next"));
      }
      cur = next;
    }
  }
  return ys.length === 0 ? NaN : ys.reduce((a, b) => a + b, 0) / ys.length;
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
  const report = visualValidateAll(FIXED.map((f) => f.diagram), { profile: "catalog" });

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

describe("宣言した矩形が実物と噛み合う (#1416)", () => {
  it("組み立てが返す矩形をそのまま受けられる", () => {
    /*
     * cdl は `BBox` を公開していないので、この file が同じ形を宣言している。
     * **形がずれると読めない項目が出る** ので、実物を受けて 6 項目を確かめる。
     *
     * 型の上でも `boxOf` の戻り値が `BBox` なので、cdl 側が形を変えれば型検査が落ちる
     * (`typecheck-ratchet` が件数で見る。 実物に無い項目を足す変異で 22 → 31 件に増え、
     * 天井の検査が落ちることを確かめた)。
     *
     * **実行時の確認が守るのは別の壊れ方**。 cdl の型定義が実物と食い違う形
     * (宣言は `number` なのに実際は文字列) は、型検査では捕まらない。
     *
     * この形は **local では変異を当てられない** (`node_modules` を書き換える必要がある)。
     * `rules/quality.md` 条件 5 の「到達する入力を組めない」 に当たるため、覆えていないことを
     * ここに残す。
     */
    const laid = layout(timelineDrive);
    const b = laid.bboxes[0];
    expect(b, "組み立てが矩形を 1 つも返していない").toBeDefined();
    if (b === undefined) return;
    const 受けた: BBox = b;
    expect(["node", "lane-label", "edge-label", "edge-path"]).toContain(受けた.kind);
    expect(typeof 受けた.id).toBe("string");
    for (const k of ["x", "y", "w", "h"] as const) {
      expect(typeof 受けた[k], `${k} が数でない`).toBe("number");
    }
  });
});
/**
 * label 矩形と path の最短距離。
 *
 * cdl は AABB ではなく「label の 8 点 (4 隅 + 4 辺中央) から線分列までの最短距離」 で測る
 * (迂回する path では AABB が実距離より大きく出て見逃すため)。 同じ測り方をする。
 * cdl 側の helper は package から export されていないので、 同 file の `pathPoints` を使う。
 */
const labelToPathGap = (box: BBox, d: string): number => {
  const pts = pathPoints(d);
  // path が pill を貫く場合は 0 を返す。 8 点からの最短距離だけで測ると、 点の間を通り抜ける
  // 線分を「離れている」 と判定して guard がすり抜ける (cdl は矩形との交差を先に見て 0 にする)。
  const crosses = (x1: number, y1: number, x2: number, y2: number): boolean => {
    const inBox = (x: number, y: number) =>
      x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;
    if (inBox(x1, y1) || inBox(x2, y2)) return true;
    const seg = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx2: number, dy2: number) => {
      const o = (px: number, py: number, qx: number, qy: number, rx: number, ry: number) =>
        Math.sign((qx - px) * (ry - py) - (qy - py) * (rx - px));
      const d1 = o(ax, ay, bx, by, cx, cy);
      const d2 = o(ax, ay, bx, by, dx2, dy2);
      const d3 = o(cx, cy, dx2, dy2, ax, ay);
      const d4 = o(cx, cy, dx2, dy2, bx, by);
      return d1 !== d2 && d3 !== d4;
    };
    const x3 = box.x;
    const y3 = box.y;
    const x4 = box.x + box.w;
    const y4 = box.y + box.h;
    return (
      seg(x1, y1, x2, y2, x3, y3, x4, y3) ||
      seg(x1, y1, x2, y2, x4, y3, x4, y4) ||
      seg(x1, y1, x2, y2, x4, y4, x3, y4) ||
      seg(x1, y1, x2, y2, x3, y4, x3, y3)
    );
  };
  for (let i = 1; i < pts.length; i++) {
    if (crosses(pts[i - 1]![0], pts[i - 1]![1], pts[i]![0], pts[i]![1])) return 0;
  }
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

describe("#892 exemplar 3 件の配置を座標で固定", () => {
  const LABEL_MIN = requiredNearClearance("edge-label", "edge-label");
  const PATH_MIN = requiredNearClearance("edge-label", "edge-path");
  const NODE_MIN = requiredNearClearance("node", "edge-label");

  it(`edge-label 同士の spec が 36 である (閾値を実装から引いている)`, () => {
    // 16 は path 用の default。 取り違えると緩い判定を固定してしまう。
    expect(LABEL_MIN).toBe(36);
    expect(PATH_MIN).toBe(14);
    expect(NODE_MIN).toBe(32);
  });

  it("oauth-flow = 往復 4 本の label が engine の配置で 1 列に並ぶ", () => {
    const laid = layout(interactiveOauthFlow);
    const ids = ["client-consent", "consent-client", "code-exchange", "token-issue"];
    const boxes = ids.map((id) => boxOf(laid, "edge-label", id));
    const tight: string[] = [];
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const g = gapOf(boxes[i]!, boxes[j]!);
        if (g < LABEL_MIN) {
          tight.push(`${at(ids, i, "ids")} ↔ ${at(ids, j, "ids")} gap ${g.toFixed(1)}`);
        }
      }
    }
    expect(tight, `近すぎる label 対:\n${tight.join("\n")}`).toHaveLength(0);
    // 手作業の offset を外して engine に任せた (#968)。 engine は 4 本を 1 列に積み、 中心 X を
    // 揃えて並べる。 手作業を戻すと X が 2 値に割れるので落ちる。
    const cxs = boxes.map((b) => b.x + b.w / 2);
    expect(Math.max(...cxs) - Math.min(...cxs), "中心 X が揃っていない").toBeLessThan(1);
    // 間隔は 1 行 pill (36) + 要求 (36) = 72 が基準。 弧の束を挟む所だけ余分に開く (cdl#376)。
    const step = LABEL_MIN + 36;
    const cys = boxes.map((b) => b.y + b.h / 2).sort((a, b) => a - b);
    const gaps = cys.slice(1).map((y, i) => y - cys[i]!);
    for (const g of gaps) expect(g, "間隔が要求を下回っている").toBeGreaterThanOrEqual(step - 1e-6);
    const exact = gaps.filter((g) => Math.abs(g - step) < 1e-6).length;
    expect(exact, "束を挟む 1 箇所以外は要求ちょうどのはず").toBeGreaterThanOrEqual(gaps.length - 1);
  });

  it("oauth-flow = label の並び順が線の並び順と一致する", () => {
    // 1 列に積むと「どの label がどの線のものか」 は並び順でしか読み取れない。 engine が弧を
    // label の並びに合わせて振り分けることで順序が保たれる (cdl#374)。
    //
    // 高さは `curveMidY` で測る。 4 本は端点が同じ高さの弧なので、 制御点を捨てる `mainCrestY`
    // では全て 203 になって順序を比べられない (この test が最初 false green だった)。
    const laid = layout(interactiveOauthFlow);
    const ids = ["client-consent", "consent-client", "code-exchange", "token-issue"];
    const target = laid.edges.filter((e) => ids.includes(e.id));
    expect(new Set(target.map((e) => curveMidY(e.d).toFixed(3))).size, "4 本の高さが区別できない").toBe(4);
    const byLabel = [...target].sort((x, y) => x.labelY - y.labelY).map((e) => e.id);
    const byPath = [...target].sort((x, y) => curveMidY(x.d) - curveMidY(y.d)).map((e) => e.id);
    expect(byLabel).toEqual(byPath);
  });

  it("oauth-flow = 自分の弧から離れているのは束の両端 2 本だけ", () => {
    // 4 本を 1 列に積むと、 束の外側に出る 2 本は弧から離れる。 1 行 pill (36) にしたことで
    // 離れる量は 86 に収まり、 破綻 (160 超) にはならない (#376)。 `sub` を戻すと 2 行 pill
    // (68) になり、 外側が 222 まで離れて破綻する。
    const far = visualValidateAll([interactiveOauthFlow], { profile: "catalog" })
      .reports.flatMap((r) => r.violations)
      .filter((v) => v.axis === "edge-label-proximity")
      .map((v) => /edge "([^"]+)"/.exec(v.detail)?.[1] ?? "?")
      .sort();
    expect(far, "自分の弧から離れている label の顔ぶれが変わった").toEqual([
      "client-consent",
      "token-issue",
    ]);
    // 破綻していない = 全て warn 止まり
    const errors = visualValidateAll([interactiveOauthFlow], { profile: "catalog" })
      .reports.flatMap((r) => r.violations)
      .filter((v) => v.axis === "edge-label-proximity" && v.severity === "error");
    expect(errors, "弧から離れすぎて破綻している").toEqual([]);
  });

  it("oauth-flow = 迂回する 2 本の label が上下に分かれている", () => {
    const laid = layout(interactiveOauthFlow);
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
      const d = JSON.parse(JSON.stringify(interactiveOauthFlow)) as CdlDiagram;
      for (const id of ids) {
        if (target !== "(全部)" && id !== target) continue;
        const e = d.edges.find((x) => x.id === id) as { label: string };
        e.label = `${e.label}X`;
      }
      const errs = (visualValidateAll([d], { profile: "catalog" }).reports[0]?.violations ?? []).filter((v) => v.severity === "error");
      if (errs.length > 0) broke.push(`${target} を 1 文字伸ばすと ${errs.length} 件: ${errs.map((v) => v.axis).join(",")}`);
    }
    expect(broke, `1 文字で崩れる:\n${broke.join("\n")}`).toHaveLength(0);
  });

  it("gapOf = 斜めに離れた矩形で hypot を返す (max では過小評価になる)", () => {
    // cdl の `computeGap` は hypot。 max(dx, dy) で測ると斜め方向を近く見積もり、 spec を
    // 満たしていない対を「離れている」 と判定してしまう。 今の 3 図には斜めの対が無いため、
    // 上の assert では差が出ない。 直接叩いて式を固定する。
    const a: BBox = { kind: "edge-label", id: "a", x: 0, y: 0, w: 10, h: 10 };
    const b: BBox = { kind: "edge-label", id: "b", x: 30, y: 40, w: 10, h: 10 };
    // dx = 20 / dy = 30 → hypot 36.06 (max だと 30)
    expect(gapOf(a, b)).toBeCloseTo(Math.hypot(20, 30), 5);
    expect(gapOf(a, b)).not.toBeCloseTo(30, 1);
    // 交差していれば 0
    const c: BBox = { kind: "edge-label", id: "c", x: 5, y: 5, w: 10, h: 10 };
    expect(gapOf(a, c)).toBe(0);
    // 片軸だけ離れている場合はその距離
    const d: BBox = { kind: "edge-label", id: "d", x: 25, y: 0, w: 10, h: 10 };
    expect(gapOf(a, d)).toBeCloseTo(15, 5);
  });

  it("labelToPathGap = path が pill を貫く形で 0 を返す (8 点の間をすり抜けない)", () => {
    // 今の 3 図はどの path も pill を貫かないため、 上の assert では発火しない防御。 壊れても
    // 気付けないので直接叩く。 8 点からの最短距離だけで測ると、 点の間を通り抜ける線分を
    // 「離れている」 と判定して guard がすり抜ける。
    const box: BBox = { kind: "edge-label", id: "probe", x: 20, y: 0, w: 100, h: 100 };
    // 曲線の終点が矩形の外にあり、 弦が矩形を横切る形
    expect(labelToPathGap(box, "M 10 30 Q 70 0, 130 30")).toBe(0);
    // 直線が矩形を貫く形
    expect(labelToPathGap(box, "M 0 50 L 200 50")).toBe(0);
    // 端点が矩形の中にある形
    expect(labelToPathGap(box, "M 60 50 L 300 50")).toBe(0);
    // 矩形から離れている形は距離を返す
    expect(labelToPathGap(box, "M 0 200 L 200 200")).toBeCloseTo(100, 5);
  });

  it("3 図とも全 edge-label 対が spec 以上離れている (取りこぼし防止)", () => {
    for (const d of [interactiveOauthFlow, trafficSankey, exemplarNotificationFlow]) {
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
