/**
 * 図表の種別の印が、その種別を持たない図に出ていないことの検査 (#1704)。
 *
 * ## 何を見るか
 *
 * 見本帳の全図を 1 度だけ描き、**その図が持たない種別の役割名が 1 つも出ていない** ことを見る。
 * 拾い方が図の種類を見ずに何でも拾っていたら、ここで落ちる。
 *
 * これは `catalog-axis-text` と `catalog-bar-look` が別々に持っていた陰性対照を 1 つに束ねた
 * もの。 2 つは棒と折れ線の役割名を手で並べていたが、ここでは **種別の一覧を見本帳から導き、
 * 役割名は種別の名前で始まるという engine の規則で照らす** ので、種別が増えても追随する。
 *
 * | 元の検査 | ここで言い換えると |
 * |---|---|
 * | 軸を持たない見本に `chart-bar-tick` / `chart-bar-label` 等が出ない | `chart-bar` を持たない図に `chart-bar` で始まる役割名が出ない |
 * | 棒グラフを持たない見本に `chart-bar` の棒が出ない | 同上 |
 *
 * ## なぜ 1 つに束ねたか
 *
 * 2 つとも見本帳のほぼ全図を描いており、**同じ図を 2 度描いていた**。
 * 全件走査では 12 の worker が同時に走るので 1 件あたりが 2 倍前後に伸びる。 交互に 3 往復
 * 測ると 3843 / 3882 / 3964 / 3985 ms で、1 回は 5147ms まで伸びて既定の上限 (5 秒) を
 * 越えて落ちた。 **図は壊れていないのに赤くなる** = 落ちたことが情報を持たない。
 *
 * 上限を上げる形は採らない。 上げると同じことが次の閾値で起き、遅くなったことにも気付けない。
 */
import { beforeAll, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView, layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { CATALOG_ITEMS } from "./catalog-items";

const 描く = (d: CdlDiagram): string => renderToStaticMarkup(<CdlDiagramView diagram={layout(d)} />);

/** 描いた結果に出てくる役割名 */
const 役割名 = (svg: string): string[] =>
  [...svg.matchAll(/data-cdl-role="([^"]+)"/g)].map((m) => m[1]!);

/**
 * 見本帳の全図 (変種を含む)。
 *
 * 変種は一覧の行を持たず `パターン` の切替に入るので (`catalog-items.ts` の `patterns`)、
 * 元の図だけ見ると母集団から落ちる。
 */
const 全部の図 = (): CdlDiagram[] =>
  Object.values(CATALOG_ITEMS)
    .flat()
    .flatMap((item) =>
      item.patterns && item.patterns.length > 0
        ? item.patterns.map((p) => p.diagram)
        : [item.diagram],
    );

/** 見本帳に出ている図表の種別。 手で並べない = 種別が増えたら自動で対象になる */
const 図表の種別 = (図: CdlDiagram[]): string[] => [
  ...new Set(図.flatMap((d) => d.nodes.map((n) => n.kind)).filter((k) => k.startsWith("chart-"))),
];

interface 下ごしらえ {
  種別: string[];
  図たち: Array<{ id: string; 持つ種別: Set<string>; 役割: string[] }>;
}

/** 1 度だけ描いて、図ごとに「持っている種別」 と「出た役割名」 を並べる */
const 下ごしらえする = (): 下ごしらえ => {
  const 図 = 全部の図();
  return {
    種別: 図表の種別(図),
    図たち: 図.map((d) => ({
      id: d.id,
      持つ種別: new Set(d.nodes.map((n) => n.kind)),
      役割: 役割名(描く(d)),
    })),
  };
};

/**
 * 持たない種別の印が出ている組を探す。
 *
 * **本番と植え込み対照で同じ関数を使う**。 探し方を 2 度書くと片方だけ直して drift する
 * (`rules/quality.md § 検査の母集団が守りたい集合と同じことを確認済`)。
 */
function 混ざりを探す(
  図たち: 下ごしらえ["図たち"],
  種別: string[],
): { 混ざった: string[]; 測れた: number } {
  const 混ざった: string[] = [];
  let 測れた = 0;
  for (const { id, 持つ種別, 役割 } of 図たち) {
    for (const k of 種別) {
      if (持つ種別.has(k)) continue;
      測れた += 1;
      // 役割名は種別の名前で始まる (`chart-bar` → `chart-bar-tick` 等)。
      // `chart-stacked-bar` は `chart-bar` で始まらないので、種別どうしが混ざらない
      const 出た = 役割.filter((r) => r === k || r.startsWith(`${k}-`));
      if (出た.length > 0) 混ざった.push(`${id}: ${k} (${[...new Set(出た)].join(", ")})`);
    }
  }
  return { 混ざった, 測れた };
}

describe("種別の印は、その種別を持つ図にしか出ない (#1704)", () => {
  let 種別: string[] = [];
  let 図たち: 下ごしらえ["図たち"] = [];

  /*
   * **描くのは 1 度だけ、`beforeAll` の中で**。
   *
   * 検査ごとに描き直すと束ねた意味が消える。 `describe` の直下で描くと集める段で走るので、
   * どの検査にも所要が付かず、上限にも掛からない = 遅くなっても誰も気付けない。
   *
   * 30 秒は実測 (単独 0.9-1.2 秒 / 全件走査で 3.7-4.1 秒) に対する余裕。
   * 同じ形の明示は `packages/dragon/test/typecheck-ratchet.test.ts` が既に採っている。
   */
  beforeAll(() => {
    ({ 種別, 図たち } = 下ごしらえする());
  }, 30_000);

  it("見本帳の図と図表の種別をどちらも 1 件以上走査できている", () => {
    // 空振り検知。 どちらかが 0 件だと下の検査は何も見ずに通る
    expect(図たち.length, "見本帳の図が 1 件も無い").toBeGreaterThan(0);
    expect(種別.length, "図表の種別が 1 つも無い").toBeGreaterThan(0);
    // 変種は一覧の行を持たないので、辿れていれば必ず一覧より多くなる。
    // 元の図だけ見る形に戻ると母集団が痩せるが、上の 2 つは 0 件でないので気付けない
    const 一覧の件数 = Object.values(CATALOG_ITEMS).flat().length;
    expect(図たち.length, `変種を辿れていない (一覧 ${一覧の件数} 件)`).toBeGreaterThan(一覧の件数);
    console.log(`[走査] 図 ${図たち.length} 件 (一覧 ${一覧の件数} 件 + 変種) / 種別 ${種別.length} 種`);
  });

  it("持たない種別の役割名が出ない", () => {
    const { 混ざった, 測れた } = 混ざりを探す(図たち, 種別);
    expect(混ざった, `持たない種別の印が出た\n  ${混ざった.join("\n  ")}`).toEqual([]);
    expect(測れた, "1 組も測れていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("違反を 1 件置くと見つかる (植え込み対照)", () => {
    /*
     * 上は「0 件」 を期待する形なので、探し方が何にも当たらなくても通る。
     * 違反する図を 1 件だけ組み、**本番と同じ探し方** が見つけることを見る
     * (`rules/quality.md § 期待する件数で対照の向きが変わる`)。
     */
    const 植えた = [
      { id: "植え込み", 持つ種別: new Set(["chart-pie"]), 役割: ["chart-pie", "chart-bar-tick"] },
    ];
    const { 混ざった } = 混ざりを探す(植えた, ["chart-pie", "chart-bar"]);
    expect(混ざった, "違反を置いても見つからない (探し方が何にも当たっていない)").toEqual([
      "植え込み: chart-bar (chart-bar-tick)",
    ]);
  });

  it("持っている種別の役割名は出る (陰性対照)", () => {
    /*
     * 「どの図でも役割名が 1 つも出ない」 なら上の検査は通っても意味を持たない。
     * 種別を持つ図では、その種別の役割名が実際に出ることを見る。
     *
     * 図として成立しない件数の見本 (点が 1 つの折れ線 等) は種別そのものの印を持たないので、
     * **図ごとではなく種別ごとに 1 件以上** で見る。
     */
    let 測れた = 0;
    const 出なかった: string[] = [];
    for (const k of 種別) {
      const 持つ図 = 図たち.filter((x) => x.持つ種別.has(k));
      if (持つ図.length === 0) continue;
      測れた += 1;
      const 出た = 持つ図.some((x) => x.役割.some((r) => r === k || r.startsWith(`${k}-`)));
      if (!出た) 出なかった.push(k);
    }
    expect(出なかった, `種別の印がどの図にも出ない: ${出なかった.join(", ")}`).toEqual([]);
    expect(測れた, "1 種別も測れていない (検査が空振りしている)").toBeGreaterThan(0);
  });
});
