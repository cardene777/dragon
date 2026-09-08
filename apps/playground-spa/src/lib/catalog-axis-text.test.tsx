/**
 * 見本帳の軸を持つ図で、字の大きさの順と役割名を確かめる検査 (#1688)。
 *
 * 描画側 (`cdl#753` / `cdl#755`) が折れ線の値札を軸の名前より大きくし、
 * 縦軸の目盛りと横軸の名前に役割名を足した。 **版を上げただけでは効かない** ので、
 * 実際に見本の図を描いて字を測る。
 *
 * | 見たもの | 上げる前 | 上げた後 |
 * |---|---|---|
 * | 折れ線の値札 / 横軸の名前 | 11 / 12 | 12 / 11 |
 * | 折れ線の目盛りの役割名 | なし | chart-line-tick |
 * | 折れ線の横軸の名前の役割名 | なし | chart-line-label |
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView, layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { CATALOG_ITEMS } from "./catalog-items";

const 描く = (d: CdlDiagram): string => renderToStaticMarkup(<CdlDiagramView diagram={layout(d)} />);

/** 役割名を持つ字を集める。 中身と大きさの両方を読む */
function 役の字(svg: string, role: string): { 文: string; 級: number }[] {
  const 出た: { 文: string; 級: number }[] = [];
  const re = new RegExp(`<text[^>]*data-cdl-role="${role}"[^>]*>([^<]*)<`, "g");
  for (const m of svg.matchAll(re)) {
    const 級 = /font-size="([\d.]+)"/.exec(m[0]);
    出た.push({ 文: m[1] ?? "", 級: 級 ? Number(級[1]) : Number.NaN });
  }
  return 出た;
}

/** 見本帳から、その種別の節を持つ図を集める */
const 見本 = (kind: string): CdlDiagram[] =>
  Object.values(CATALOG_ITEMS)
    .flat()
    .filter(({ diagram }) => diagram.nodes.some((n) => n.kind === kind))
    .map(({ diagram }) => diagram);

describe("見本帳の軸を持つ図の字 (#1688)", () => {
  it("棒と折れ線の見本をどちらも 1 件以上走査できている", () => {
    // 空振り検知。 片方でも 0 件なら、下の比べ合いは何も見ていない
    expect(見本("chart-bar").length, "棒グラフの見本が 1 件も無い").toBeGreaterThan(0);
    expect(見本("chart-line").length, "折れ線グラフの見本が 1 件も無い").toBeGreaterThan(0);
  });

  it("折れ線の値札が横軸の名前より大きい", () => {
    // 上げる前は値札 11 / 軸名 12 で、値の方が小さかった
    let 測れた = 0;
    for (const d of 見本("chart-line")) {
      const svg = 描く(d);
      const 値 = 役の字(svg, "chart-line-value");
      const 名 = 役の字(svg, "chart-line-label");
      expect(値.length, "値札を 1 つも拾えない").toBeGreaterThan(0);
      expect(名.length, "横軸の名前を 1 つも拾えない").toBeGreaterThan(0);
      測れた += 値.length + 名.length;
      expect(値[0]!.級, `値札 ${値[0]!.級} / 軸名 ${名[0]!.級}`).toBeGreaterThan(名[0]!.級);
    }
    expect(測れた, "字を 1 つも測れていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("折れ線の縦軸の目盛りを役割名で拾える", () => {
    // `chart-line-tick` は 0.40.8 で増えた名前。 上げていないと 0 件になる
    let 測れた = 0;
    for (const d of 見本("chart-line")) {
      const 目盛り = 役の字(描く(d), "chart-line-tick");
      expect(目盛り.length, "目盛りを 1 つも拾えない").toBeGreaterThan(0);
      測れた += 目盛り.length;
    }
    expect(測れた, "目盛りを 1 つも測れていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("棒と折れ線で値札と軸の名前の大きさが揃う", () => {
    const 棒 = 描く(見本("chart-bar")[0]!);
    const 線 = 描く(見本("chart-line")[0]!);
    const 棒の値 = 役の字(棒, "chart-bar-value")[0]?.級;
    const 棒の名 = 役の字(棒, "chart-bar-label")[0]?.級;
    const 線の値 = 役の字(線, "chart-line-value")[0]?.級;
    const 線の名 = 役の字(線, "chart-line-label")[0]?.級;
    for (const [名, v] of [
      ["棒の値札", 棒の値],
      ["棒の軸名", 棒の名],
      ["折れ線の値札", 線の値],
      ["折れ線の軸名", 線の名],
    ] as const)
      expect(v, `${名} を拾えない (検査が空振りしている)`).toBeDefined();
    expect(線の値).toBe(棒の値);
    expect(線の名).toBe(棒の名);
  });

  it("軸を持たない見本には軸の役割名が出ない", () => {
    // 陰性対照。 拾い方が図の種類を見ずに何でも拾うなら、円グラフなどが混ざって落ちる
    const 軸でない = Object.values(CATALOG_ITEMS)
      .flat()
      .filter(({ diagram }) =>
        diagram.nodes.every((n) => n.kind !== "chart-bar" && n.kind !== "chart-line"),
      )
      .map(({ diagram }) => diagram);
    expect(軸でない.length, "軸を持たない見本が 1 件も無い").toBeGreaterThan(0);
    for (const d of 軸でない) {
      const svg = 描く(d);
      for (const 役 of ["chart-bar-tick", "chart-bar-label", "chart-line-tick", "chart-line-label"])
        expect(役の字(svg, 役), `${役} が出た`).toEqual([]);
    }
  });
});
