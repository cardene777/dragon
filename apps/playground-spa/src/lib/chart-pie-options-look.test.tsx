/**
 * 円グラフの見せ方が engine の描画へ届く検査 (#1645)。
 *
 * node の欄だけでなく、実際に描いた SVG の役割を見る。既定の絵を欄を書かない元の絵と
 * 完全一致させることで、画面の初期状態と engine の既定がずれないことも固定する。
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView, layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { CATALOG_ITEMS } from "./catalog-items";
import { 図の円の見せ方を変える, 円の見せ方を選べる, 既定の円の見せ方 } from "./chart-pie-options";

function 円の図(): CdlDiagram {
  const items = CATALOG_ITEMS.presets;
  if (items === undefined) throw new Error("presets の一覧が無い");
  const item = items.find((x) => x.id === "chart-pie-demo");
  expect(item, "chart-pie-demo の見本が見つからない").toBeDefined();
  return item!.diagram;
}

/** 系列の数。 期待値を手で書かず、図の datum から導く */
function 系列の数(diagram: CdlDiagram): number {
  const 円 = diagram.nodes.find((n) => n.kind === "chart-pie") as
    | { chartData?: unknown[] }
    | undefined;
  const 数 = 円?.chartData?.length ?? 0;
  expect(数, "系列が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
  return 数;
}

/** 起点から描く指定を外した図。 描き終わった状態の絵を見るため */
function 描き切った図(): CdlDiagram {
  const 元 = 円の図();
  const 外した = 元.phases?.map(({ draw: _draw, ...残り }) => 残り);
  expect(元.phases?.some((p) => p.draw !== undefined), "見本が draw を持っていない").toBe(true);
  return { ...元, phases: 外した };
}

const 描く = (diagram: CdlDiagram): string =>
  renderToStaticMarkup(<CdlDiagramView diagram={layout(diagram)} />);

const roleの数 = (svg: string, role: string): number =>
  (svg.match(new RegExp(`data-cdl-role="${role}"`, "g")) ?? []).length;

/** React の `useId` が振る連番だけを伏せる。 図の中身は 1 文字も変えない */
const idを伏せる = (html: string): string => html.replace(/_r_[0-9a-z]+_/g, "_r_x_");

describe("円グラフの見せ方を描いた絵で見る (#1645)", () => {
  it("既定の絵は欄を書かない元の絵と 1 文字も違わない", () => {
    // Given
    const 元 = 円の図();

    // When
    const 既定 = 図の円の見せ方を変える(元, 既定の円の見せ方);

    // Then
    expect(idを伏せる(描く(既定)), "既定の絵が元と違う").toBe(idを伏せる(描く(元)));
  });

  it("積層の弧では弧が系列の数だけ出て、扇が 1 つも出ない", () => {
    // Given
    const 元 = 円の図();
    const 数 = 系列の数(元);

    // When
    const svg = 描く(図の円の見せ方を変える(元, "arcs"));

    // Then
    expect(roleの数(svg, "chart-pie-arc"), "弧の数が系列と合わない").toBe(数);
    expect(roleの数(svg, "chart-pie-arc-track"), "背後の輪が弧と揃っていない").toBe(数);
    expect(roleの数(svg, "chart-pie-slice"), "扇が残っている").toBe(0);
  });

  it("銘板では罫が 見出し 1 + 行数 だけ出て、輪は残る", () => {
    // Given = 起点から描く指定を外した図。 見本は 1 段目で円を描き起こすため、静止した
    // 最初の絵では行がまだ 1 つも出ていない (下の検査で別に見る)
    const 元 = 描き切った図();
    const 数 = 系列の数(元);

    // When
    const svg = 描く(図の円の見せ方を変える(元, "table"));

    // Then
    expect(roleの数(svg, "chart-pie-table-rule"), "罫の数が行数と合わない").toBe(数 + 1);
    expect(roleの数(svg, "chart-pie-slice"), "輪が消えている").toBe(数);
    expect(roleの数(svg, "chart-pie-arc"), "弧が混ざっている").toBe(0);
  });

  it("銘板でも起点から描く = 最初の絵では行が出ていない", () => {
    // Given = 見本のまま (1 段目に `draw` を持つ)
    const 元 = 円の図();

    // When
    const svg = 描く(図の円の見せ方を変える(元, "table"));

    // Then = 見出しの罫だけが出る。 行は扇が開くのに合わせて増える
    expect(roleの数(svg, "chart-pie-table-rule"), "最初から行が出ている").toBe(1);
  });

  it("3 つの絵は互いに違う (陰性対照の裏返し)", () => {
    // Given = 同じ図を 3 つの見せ方で描く
    const 元 = 円の図();
    const 絵 = (["ring", "arcs", "table"] as const).map((v) =>
      idを伏せる(描く(図の円の見せ方を変える(元, v))),
    );

    // Then = 3 つとも互いに違う。 同じなら切替が届いていない
    expect(new Set(絵).size, "見せ方を変えても絵が変わっていない").toBe(3);
  });
});

/**
 * 前の時点を持つ図では見せ方の切替を出さない (#1702)。
 *
 * ## 判定材料を実装と同じ式にしない
 *
 * 「`previous` が書いてあるか」 を両側で見ると、同じ式を 2 度書いて突き合わせることになり、
 * 実装が変わると検査も一緒にずれる。
 *
 * ここは **engine の描画結果** を材料にする。 内側の輪 (`chart-pie-slice-previous`) が
 * 出るかどうかが「engine が前の値を使っている」 ことの実物で、切替を出してよいかは
 * その裏返しになる。
 */
describe("前の時点を持つ円グラフでは見せ方を選べない (#1702)", () => {
  /** カタログに出ている全部の図 (変種を含む)。 変種は一覧の行を持たないので `patterns` も辿る */
  const 全部の図 = (): CdlDiagram[] =>
    Object.values(CATALOG_ITEMS)
      .flat()
      .flatMap((item) =>
        item.patterns && item.patterns.length > 0
          ? item.patterns.map((p) => p.diagram)
          : [item.diagram],
      );

  /** 円グラフを持つ図を、内側の輪を描くかで 2 つに分ける */
  const 円の図たち = () => {
    const 円あり = 全部の図().filter((d) => d.nodes.some((n) => n.kind === "chart-pie"));
    const 内輪あり: CdlDiagram[] = [];
    const 内輪なし: CdlDiagram[] = [];
    for (const d of 円あり)
      (roleの数(描く(d), "chart-pie-slice-previous") > 0 ? 内輪あり : 内輪なし).push(d);
    return { 内輪あり, 内輪なし };
  };

  it("両方の図を 1 件以上拾えている", () => {
    // 空振り検知。 片側が 0 件だと下の 2 件のどちらかが何も見ずに通る
    const { 内輪あり, 内輪なし } = 円の図たち();
    expect(内輪あり.length, "内側の輪を描く図が 1 件も無い").toBeGreaterThan(0);
    expect(内輪なし.length, "内側の輪を描かない円グラフが 1 件も無い").toBeGreaterThan(0);
  });

  it("内側の輪を描く図では選べない", () => {
    // engine は `輪` 以外の形へ前の値を渡さないので、切り替えると内側の輪が黙って消える
    for (const d of 円の図たち().内輪あり)
      expect(円の見せ方を選べる(d), `${d.id} で選べてしまう`).toBe(false);
  });

  it("内側の輪を描かない円グラフでは選べる (陰性対照)", () => {
    // 「円グラフなら一律で出さない」 に倒れていれば、ここが落ちる
    for (const d of 円の図たち().内輪なし)
      expect(円の見せ方を選べる(d), `${d.id} で選べない`).toBe(true);
  });

  it("1 件だけ前の時点を持つ図でも選べない", () => {
    /*
     * engine は `data.some((d) => d.previous !== undefined)` で輪を 2 つにする。
     * 画面側を「全件が持つか」 で見ると、engine が内側の輪を描いている図を
     * 「持っていない」 と判定して切替を出してしまう。
     *
     * 見本は 4 件とも前の時点を書いているので、`some` と `every` の差が出ない。
     * **差の出る入力をここで作る** = 1 件だけ書いた図を組む。
     */
    const 元 = 全部の図().find(
      (d) => d.nodes.some((n) => n.kind === "chart-pie") && roleの数(描く(d), "chart-pie-slice-previous") === 0,
    );
    expect(元, "前の時点を持たない円グラフの見本が無い").toBeDefined();

    const 一件だけ: CdlDiagram = {
      ...元!,
      nodes: 元!.nodes.map((n) =>
        n.kind === "chart-pie"
          ? {
              ...n,
              chartData: (n.chartData ?? []).map((d, i) => (i === 0 ? { ...d, previous: 5 } : d)),
            }
          : n,
      ),
    };

    // 前提 = この図で engine は実際に内側の輪を描く (組み方が効いていることの確認)
    expect(
      roleの数(描く(一件だけ), "chart-pie-slice-previous"),
      "1 件だけ書いた図で内側の輪が出ていない (組み方が効いていない)",
    ).toBeGreaterThan(0);

    expect(円の見せ方を選べる(一件だけ), "1 件だけ前の時点を持つ図で選べてしまう").toBe(false);
  });
});
