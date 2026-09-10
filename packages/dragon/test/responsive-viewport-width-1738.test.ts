/**
 * 見回りの「読みにくい」 の注意が、画面上の字が小さい図と一致することを見る (#1738)。
 *
 * 描画エンジンの軸 23 `responsive-viewport` は `0.41.1` まで **縦横比 6:1** を境にしていた。
 * 画面上の字の大きさは `字の world 寸法 × (親の幅 px ÷ viewBox 幅)` で決まり、この式に
 * 縦横比は出てこない。 実測 (親の幅 1100px)。
 *
 * | 図 | 縦横比 | viewBox 幅 | 画面上の字 | 旧判定で拾えるか |
 * |---|---|---|---|---|
 * | `class-complex-demo` | 1.4 | 3353 | 7.2px | 拾えない |
 * | `interactive-year-roadmap` | 4.0 | 2534 | 9.6px | 拾えない |
 * | `lane-multi` | 8.0 | 1535 | 15.8px | 拾える (読める字) |
 *
 * `0.42.0` で判定を viewBox 幅の上限へ移してある (cdl#785)。
 *
 * ## 数を書き写さない
 *
 * 境 (親の幅 / 下限 / 上限) は engine が注意の文面に出す。 この検査はそれを読み取って使う。
 * 書き写すと engine が境を変えた時に、この検査だけが古い値で通る。
 *
 * 縦横比の判定に戻ると文面が変わって読み取れなくなるため、その時点で落ちる。
 */
import { describe, it, expect } from "vitest";
import { visualValidateAll, layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

import * as cookbook from "../../../apps/playground-spa/src/topics/catalog/cookbook.cdl";
import * as patterns from "../../../apps/playground-spa/src/topics/catalog/patterns.cdl";
import * as presets from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";
import * as primitives from "../../../apps/playground-spa/src/topics/catalog/primitives.cdl";
import * as primitivesExtra from "../../../apps/playground-spa/src/topics/catalog/primitives-extra.cdl";
import * as textDsl from "../../../apps/playground-spa/src/topics/catalog/text-dsl.cdl";
import * as animation from "../../../apps/playground-spa/src/topics/catalog/animation.cdl";
import * as styles from "../../../apps/playground-spa/src/topics/catalog/styles.cdl";
import * as interactive from "../../../apps/playground-spa/src/topics/catalog/interactive.cdl";
import * as ethereum from "../../../apps/playground-spa/src/topics/catalog/ethereum.cdl";
import * as parts from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import * as charts from "../../../apps/playground-spa/src/topics/catalog/charts.cdl";

const 図か = (v: unknown): v is CdlDiagram =>
  typeof v === "object" &&
  v !== null &&
  Array.isArray((v as CdlDiagram).nodes) &&
  Array.isArray((v as CdlDiagram).lanes);

/** 見本帳の全図。 枚数は増えるので書かない。 */
const 全図: CdlDiagram[] = [
  cookbook,
  patterns,
  presets,
  primitives,
  primitivesExtra,
  textDsl,
  animation,
  styles,
  interactive,
  ethereum,
  parts,
  charts,
].flatMap((m) => Object.values(m as Record<string, unknown>).filter(図か));

const 結果 = visualValidateAll(全図);

/** 図の id と、その図が出した `responsive-viewport` の文面。 */
const 注意: ReadonlyArray<{ id: string; 文面: string }> = 結果.reports.flatMap((r) =>
  r.violations
    .filter((v) => v.axis === "responsive-viewport")
    .map((v) => ({ id: r.diagramId, 文面: v.detail })),
);

/** 文面から engine が使った境を読む。 読めなければ `undefined` を返す (0 に潰さない)。 */
const 境を読む = (文面: string): { 上限: number; 親幅: number; 下限: number } | undefined => {
  const 上限 = 文面.match(/上限 (\d+(?:\.\d+)?) 超え/)?.[1];
  const 親幅 = 文面.match(/親幅 (\d+(?:\.\d+)?)px/)?.[1];
  const 下限 = 文面.match(/下限 (\d+(?:\.\d+)?)px/)?.[1];
  if (上限 === undefined || 親幅 === undefined || 下限 === undefined) return undefined;
  return { 上限: Number(上限), 親幅: Number(親幅), 下限: Number(下限) };
};

describe("読みにくいの注意が画面上の字と一致する (#1738)", () => {
  it("見本帳の図を 1 枚以上集められている (空振り防止)", () => {
    expect(全図.length, "見本帳の図を 1 枚も集められていない (検査が空振りしている)").toBeGreaterThan(
      0,
    );
  });

  it("注意が 1 件以上出ている (空振り防止)", () => {
    /*
     * 0 件だと下の一致は自明に成り立つ。 いま実際に境を割る図があることを押さえる。
     * 全ての図が境の内側に入ったらこの行を消す判断をする (その時は上の表も直す)。
     */
    expect(注意.length, "responsive-viewport の注意が 1 件も無い (検査が空振りしている)").toBeGreaterThan(
      0,
    );
  });

  it("文面から境を読み取れる (縦横比の判定に戻っていない)", () => {
    const 読めない = 注意.filter((n) => 境を読む(n.文面) === undefined).map((n) => n.文面);
    expect(読めない, "文面から幅の境を読めない (判定が幅を見ていない)").toEqual([]);
  });

  it("注意が出た図の集合が、画面上の字が下限を割る図の集合と一致する", () => {
    const 境 = 境を読む(注意[0]!.文面);
    expect(境, "境を読めていない").toBeDefined();
    const { 上限, 親幅, 下限 } = 境!;

    const 小さい = 全図
      .flatMap((d) => {
        let laid;
        try {
          laid = layout(d);
        } catch {
          return [];
        }
        const w = laid.viewBox.w;
        if (!(w > 0)) return [];
        // engine が使うのと同じ式。 字の world 寸法は上限と親幅と下限から逆算する
        const 字のworld = (上限 * 下限) / 親幅;
        return (字のworld * 親幅) / w < 下限 ? [d.id] : [];
      })
      .sort();

    const 出た = [...new Set(注意.map((n) => n.id))].sort();
    expect(出た, "注意の集合と、画面上の字が下限を割る図の集合が食い違う").toEqual(小さい);
  });

  it("消えた軸 (subpixel-precision) が軸の一覧に無い", () => {
    /*
     * 違反の `axis` と文字列を比べる形は書けない = 型の要素から消えたので、
     * `tsc` が「重ならない比較」 として弾く。 一覧の鍵 (`string`) の側で見る。
     *
     * 母数を併記する = 0 件が「該当なし」 か「測っていない」 かを分けられるようにする。
     */
    const 軸 = Object.keys(結果.totalCounts);
    expect(軸.length, "軸の一覧が空 (検査が空振りしている)").toBeGreaterThan(50);
    expect(軸, `消えた軸が一覧に残っている (軸 ${軸.length} 個を走査)`).not.toContain(
      "subpixel-precision",
    );
    // 残っている側の軸が一覧に居ることまで見る (一覧そのものが壊れていないか)
    expect(軸).toContain("responsive-viewport");
  });
});
