/**
 * 弧と帯で量を表す 3 種が、カタログで起点から現れることの検査 (#1668)。
 *
 * 記法の `draw:` → 組み立て (`compile.ts`) → 描画 (`cdl` の切り抜き) の 3 層を通す。
 * どこか 1 つでも欠けると「書けるのに動かない」 状態に戻るため、実際に描いた SVG で見る。
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView, layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { CATALOG_ITEMS } from "./catalog-items";

/** 語 / 図の箱の種類 / 量を表す形の役割。 **手で並べる** = 実装から導くと恒真になる */
const 三種 = [
  ["gauge", "chart-gauge", "chart-gauge-arc"],
  ["radial", "chart-radial", "chart-radial-arc"],
  ["stacked", "chart-stacked-bar", "chart-stacked-bar-slice"],
] as const;

/** 見本の中でその種類の箱を持つ図。 id を手で書かず、箱の種類から引く */
function 見本の図(kind: string): CdlDiagram {
  const 一覧 = Object.values(CATALOG_ITEMS)
    .flat()
    .filter(({ diagram }) => diagram.nodes.some((n) => n.kind === kind));
  expect(一覧.length, `${kind} の見本が 1 件も無い (検査が空振りしている)`).toBeGreaterThan(0);
  return 一覧[0]!.diagram;
}

const 描く = (diagram: CdlDiagram): string =>
  renderToStaticMarkup(<CdlDiagramView diagram={layout(diagram)} />);

const roleの数 = (svg: string, role: string): number =>
  (svg.match(new RegExp(`data-cdl-role="${role}"`, "g")) ?? []).length;

/** 起点から描く指定を外した図。 描き切った状態の絵を見るため */
function 描き切った図(diagram: CdlDiagram): CdlDiagram {
  return { ...diagram, phases: diagram.phases?.map(({ draw: _draw, ...残り }) => 残り) };
}

describe("弧と帯で量を表す 3 種がカタログで起点から現れる (#1668)", () => {
  it.each(三種)("%s の見本が 1 段目で箱を指す", (_語, kind) => {
    const 図 = 見本の図(kind);
    const 箱 = 図.nodes.find((n) => n.kind === kind);
    expect(箱, `${kind} の箱が無い`).toBeDefined();
    const 段 = 図.phases?.[0];
    expect(段?.draw, `${kind} の 1 段目が描く相手を持っていない`).toEqual([箱!.id]);
  });

  it.each(三種)("%s は進みで形の件数が変わらない (切り抜きは形を消さない)", (_語, kind, 役割) => {
    // Given = 描き切った絵。 量を表す形が何件出るかを、この図から導く
    const 図 = 見本の図(kind);
    const 件数 = roleの数(描く(描き切った図(図)), 役割);
    expect(件数, `${役割} を 1 つも測れていない (検査が空振りしている)`).toBeGreaterThan(0);

    // Then = 最初の絵 (1 段目の進み 0) でも同じ件数が DOM にある
    expect(roleの数(描く(図), 役割), "形の件数が進みで変わっている").toBe(件数);
  });

  it.each(["chart-gauge", "chart-radial"])("%s の最初の絵は切り抜きが空 (弧が 1 つも見えない)", (kind) => {
    const 切り抜き = 描く(見本の図(kind)).match(/<clipPath[^>]*>(.*?)<\/clipPath>/s);
    expect(切り抜き, `${kind} の最初の絵に切り抜きが無い`).not.toBeNull();
    expect(切り抜き![1], "切り抜きの中身が空でない").toBe("");
  });

  it("積層帯の最初の絵は切り抜きの右端が帯の左端と揃う (帯が 1 も見えない)", () => {
    // 帯は四角で切り抜くので、切り抜きは空にならない。 **帯の左端から右へ 0 だけ広がる**
    const svg = 描く(見本の図("chart-stacked-bar"));
    const 区画のx = [
      ...svg.matchAll(/data-cdl-role="chart-stacked-bar-slice"[^>]*\sx="([\d.]+)"/g),
    ].map((m) => Number(m[1]));
    expect(区画のx.length, "区画を 1 つも測れていない (検査が空振りしている)").toBeGreaterThan(0);
    const 帯の左端 = Math.min(...区画のx);
    const 幅 = Number(svg.match(/<clipPath[^>]*><rect[^>]*\swidth="([\d.]+)"/)![1]);
    expect(幅, "切り抜きが帯の左端より右へ広がっている").toBeCloseTo(帯の左端, 6);
  });

  it.each(三種)("%s の描く指定を外すと切り抜きが付かない", (_語, kind) => {
    const 図 = 見本の図(kind);
    expect(描く(描き切った図(図))).not.toContain("<clipPath");
    expect(描く(図), "見本のままでは切り抜きが付く").toContain("<clipPath");
  });
});
