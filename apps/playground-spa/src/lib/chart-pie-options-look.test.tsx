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
import { 図の円の見せ方を変える, 既定の円の見せ方 } from "./chart-pie-options";

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
    const svg = 描く(図の円の見せ方を変える(元, "積層の弧"));

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
    const svg = 描く(図の円の見せ方を変える(元, "銘板"));

    // Then
    expect(roleの数(svg, "chart-pie-table-rule"), "罫の数が行数と合わない").toBe(数 + 1);
    expect(roleの数(svg, "chart-pie-slice"), "輪が消えている").toBe(数);
    expect(roleの数(svg, "chart-pie-arc"), "弧が混ざっている").toBe(0);
  });

  it("銘板でも起点から描く = 最初の絵では行が出ていない", () => {
    // Given = 見本のまま (1 段目に `draw` を持つ)
    const 元 = 円の図();

    // When
    const svg = 描く(図の円の見せ方を変える(元, "銘板"));

    // Then = 見出しの罫だけが出る。 行は扇が開くのに合わせて増える
    expect(roleの数(svg, "chart-pie-table-rule"), "最初から行が出ている").toBe(1);
  });

  it("3 つの絵は互いに違う (陰性対照の裏返し)", () => {
    // Given = 同じ図を 3 つの見せ方で描く
    const 元 = 円の図();
    const 絵 = (["輪", "積層の弧", "銘板"] as const).map((v) =>
      idを伏せる(描く(図の円の見せ方を変える(元, v))),
    );

    // Then = 3 つとも互いに違う。 同じなら切替が届いていない
    expect(new Set(絵).size, "見せ方を変えても絵が変わっていない").toBe(3);
  });
});
