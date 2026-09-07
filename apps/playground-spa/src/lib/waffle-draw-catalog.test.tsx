/**
 * 100 個の印が、見本帳で読む向きに埋まることの検査 (#1670)。
 *
 * 記法の `draw: waffle` → 組み立て (`compile.ts`) → 描画 (`cdl` の塗り) の 3 層を通す。
 * どこか 1 つでも欠けると「書けるのに動かない」 状態に戻るため、実際に描いた SVG で見る。
 *
 * 弧の 3 種 (#1668) と違って切り抜きを使わないため、判定は **色の付いた印の数** で行う。
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView, layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { CATALOG_ITEMS } from "./catalog-items";

/** 見本の中で 100 個の印を持つ図。 id を手で書かず、箱の種類から引く */
function 印の図(): CdlDiagram {
  const 一覧 = Object.values(CATALOG_ITEMS)
    .flat()
    .filter(({ diagram }) => diagram.nodes.some((n) => n.kind === "chart-waffle"));
  expect(一覧.length, "100 個の印の見本が 1 件も無い (検査が空振りしている)").toBeGreaterThan(0);
  return 一覧[0]!.diagram;
}

const 描く = (diagram: CdlDiagram): string =>
  renderToStaticMarkup(<CdlDiagramView diagram={layout(diagram)} />);

/** 印の総数 */
const 印の数 = (svg: string): number =>
  (svg.match(/data-cdl-role="chart-waffle-cell"/g) ?? []).length;

/** 色の付いた印 = 地の色ではない印 */
const 埋まった数 = (svg: string): number =>
  (svg.match(/data-cdl-role="chart-waffle-cell"[^>]*fill-opacity="1"/g) ?? []).length;

/** 起点から描く指定を外した図。 埋まり切った状態の絵を見るため */
function 描き切った図(diagram: CdlDiagram): CdlDiagram {
  return { ...diagram, phases: diagram.phases?.map(({ draw: _draw, ...残り }) => 残り) };
}

describe("100 個の印が見本帳で読む向きに埋まる (#1670)", () => {
  it("見本の 1 段目が箱を指す", () => {
    const 図 = 印の図();
    const 箱 = 図.nodes.find((n) => n.kind === "chart-waffle");
    expect(箱, "100 個の印の箱が無い").toBeDefined();
    expect(図.phases?.[0]?.draw, "1 段目が描く相手を持っていない").toEqual([箱!.id]);
  });

  it("最初の絵では色の付いた印が 1 つも無い", () => {
    const svg = 描く(印の図());
    expect(印の数(svg), "印を 1 つも測れていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(埋まった数(svg), "最初の絵で印が埋まっている").toBe(0);
  });

  it("描く指定を外すと全部埋まる", () => {
    const svg = 描く(描き切った図(印の図()));
    const 数 = 印の数(svg);
    expect(数, "印を 1 つも測れていない (検査が空振りしている)").toBeGreaterThan(0);
    // 見本は 62 / 23 / 15 で合計 100 = 持ち主のいない印は無い
    expect(埋まった数(svg), "描き切った絵で埋まっていない印がある").toBe(数);
  });

  it("印の数は描く指定の有無で変わらない (塗りだけが変わる)", () => {
    expect(印の数(描く(印の図()))).toBe(印の数(描く(描き切った図(印の図()))));
  });

  it("切り抜きは使わない (升が半分で切れると数えられない)", () => {
    expect(描く(印の図()), "100 個の印に切り抜きが付いている").not.toContain("<clipPath");
  });
});
