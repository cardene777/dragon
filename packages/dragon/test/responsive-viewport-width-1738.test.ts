/**
 * 見回りの「読みにくい」 の注意が、画面上の字が小さい図と一致することを見る (#1738)。
 *
 * 描画エンジンの軸 23 `responsive-viewport` は判定を 2 度作り直している。
 *
 * | いつ | 何を見ていたか | 何が誤りだったか |
 * |---|---|---|
 * | `0.41.1` まで | 縦横比 6:1 | 画面上の字の式に縦横比は出てこない |
 * | `0.43.0` まで | viewBox 幅の上限 (cdl#785) | 高さの項が抜けており、縦が長い図を見逃す |
 * | `0.44.0` から | 器に収めた倍率の下限 (cdl#793) | — |
 *
 * 図は `preserveAspectRatio="xMidYMid meet"` で器に収まるよう中で縮む。 効く倍率は
 * `min(器の幅 ÷ viewBox 幅, 器の高さ ÷ viewBox 高さ)` で、**横が余っていても縦が足りなければ
 * 縦が決める**。 `er-complex-demo` と `多対多が-2-組-8-表-8-関係` は縦が決めるため、幅だけで
 * 見込んだ大きさの半分以下になる。 逆に `swim-demo` は横が決めるので見込みとほぼ変わらない。
 *
 * 個別の実寸はここに書き写さない。 `support/responsive-accepted.ts` の `代表的な図` が持ち、
 * `readability-representative.test.ts` が描き直して突き合わせる (書き写すと、図を直した時に
 * この注釈だけが古い値で残る。 実際に viewBox が 2190×2904 のまま古くなっていた)。
 *
 * ## 数を書き写さない
 *
 * 境 (器の寸法 / 下限 / その辺で届く寸法) は engine が注意の文面に出す。 この検査はそれを
 * 読み取って使う。 書き写すと engine が器を変えた時に、この検査だけが古い値で通る。
 *
 * 幅だけの判定に戻ると文面が変わって読み取れなくなるため、その時点で落ちる。
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

/** カタログの全図。 枚数は増えるので書かない。 */
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

interface 境 {
  readonly 器の幅: number;
  readonly 器の高さ: number;
  readonly 倍率: number;
  readonly 画面上の字: number;
  readonly 下限: number;
  readonly 効いた辺: "横" | "縦";
  readonly 届く寸法: number;
}

/** 文面から engine が使った器と倍率を読む。 読めなければ `undefined` を返す (0 に潰さない)。 */
const 境を読む = (文面: string): 境 | undefined => {
  const 器 = 文面.match(/器 (\d+(?:\.\d+)?)×(\d+(?:\.\d+)?)px/);
  const 倍率 = 文面.match(/([\d.]+) 倍に縮み/)?.[1];
  const 画面上の字 = 文面.match(/箱の題が ([\d.]+)px/)?.[1];
  const 下限 = 文面.match(/下限 (\d+(?:\.\d+)?)px/)?.[1];
  const 効いた辺 = 文面.match(/倍率を決めたのは (横|縦)/)?.[1];
  const 届く = 文面.match(/(幅|高さ) (\d+(?:\.\d+)?) 以下/);
  if (
    !器 ||
    倍率 === undefined ||
    画面上の字 === undefined ||
    下限 === undefined ||
    効いた辺 === undefined ||
    !届く
  ) {
    return undefined;
  }
  // 効いた辺と、届く寸法がどちらの辺のものかが食い違う文面は読めたことにしない
  if ((効いた辺 === "横") !== (届く[1] === "幅")) return undefined;
  return {
    器の幅: Number(器[1]),
    器の高さ: Number(器[2]),
    倍率: Number(倍率),
    画面上の字: Number(画面上の字),
    下限: Number(下限),
    効いた辺: 効いた辺 as "横" | "縦",
    届く寸法: Number(届く[2]),
  };
};

/**
 * 下限に届く倍率。 `届く寸法` はその辺だけが効く時に下限へ届く viewBox の寸法なので、
 * 器の同じ辺で割ると倍率の境になる。
 *
 * 字の world 寸法を逆算しないのは、文面が丸めた値しか出さないため
 * (`倍率` は小数 3 桁、`画面上の字` は 1 桁)。 この形なら丸めは `届く寸法` の 1 箇所で済む。
 */
const 届く倍率 = (b: 境): number => (b.効いた辺 === "横" ? b.器の幅 : b.器の高さ) / b.届く寸法;

/** 器に収めた時に効く倍率。 engine と同じ式。 */
const 効く倍率 = (b: 境, w: number, h: number): number =>
  Math.min(b.器の幅 / w, b.器の高さ / h);

/** 図ごとの viewBox。 layout に失敗する図と描画不能な寸法は外す。 */
const 寸法: ReadonlyArray<{ id: string; w: number; h: number }> = 全図.flatMap((d) => {
  let laid;
  try {
    laid = layout(d);
  } catch {
    return [];
  }
  const { w, h } = laid.viewBox;
  return w > 0 && h > 0 ? [{ id: d.id, w, h }] : [];
});

/**
 * 丸めで集合が揺れる幅。 `届く寸法` は小数 0 桁で出るため、境の倍率は最大でも
 * 0.1% 程度しかずれない。 この帯に図が入っていないことを検査で押さえる。
 */
const 丸めの帯 = 0.002;

describe("読みにくいの注意が画面上の字と一致する (#1738)", () => {
  it("カタログの図を 1 枚以上集められている (空振り防止)", () => {
    expect(全図.length, "カタログの図を 1 枚も集められていない (検査が空振りしている)").toBeGreaterThan(
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

  it("文面から器と倍率を読み取れる (幅だけの判定に戻っていない)", () => {
    /*
     * 0 件を期待する形なので、探し方が実際に見つけることを植え込みで確かめる
     * (`rules/quality.md § 検査の母集団が守りたい集合と同じことを確認済`)。
     * 何を渡しても読めてしまう読み方だと、この検査は永久に通る。
     */
    const 古い文面 =
      "viewBox width 3353 は上限 2016 超え (親幅 1100px 時に箱の題が 7.2px、 下限 12px)";
    expect(境を読む(古い文面), "幅だけの文面を読めてしまう (読み方が緩すぎる)").toBeUndefined();

    const 読めない = 注意.filter((n) => 境を読む(n.文面) === undefined).map((n) => n.文面);
    expect(読めない, "文面から器と倍率を読めない (判定が器に収めた倍率を見ていない)").toEqual([]);
  });

  it("文面が出す倍率が、その図の viewBox から計算した値と一致する", () => {
    /*
     * 器の値が文面の飾りでなく、実際に判定へ使われていることを見る。
     * これが無いと、器を書き換えても文面だけが動いて検査は通ってしまう。
     */
    const 寸法表 = new Map(寸法.map((x) => [x.id, x]));
    let 照合数 = 0;
    const 食い違い = 注意.flatMap((n) => {
      const b = 境を読む(n.文面);
      const v = 寸法表.get(n.id);
      if (!b || !v) return [];
      照合数 += 1;
      const 計算 = 効く倍率(b, v.w, v.h);
      return Math.abs(計算 - b.倍率) > 0.001 ? [`${n.id}: 文面 ${b.倍率} / 計算 ${計算}`] : [];
    });
    expect(照合数, "倍率を 1 件も突き合わせられていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(食い違い, `文面の倍率と viewBox からの計算が食い違う (${照合数} 件を照合)`).toEqual([]);
  });

  it("境のすぐ近くに図が居ない (丸めで集合が揺れない)", () => {
    const b = 境を読む(注意[0]!.文面);
    expect(b, "境を読めていない").toBeDefined();
    const 境の倍率 = 届く倍率(b!);
    const 帯に入るか = (v: { id: string; w: number; h: number }) =>
      Math.abs(効く倍率(b!, v.w, v.h) / 境の倍率 - 1) < 丸めの帯;

    // 0 件を期待する形なので植え込みで対照を取る。 境ちょうどの寸法を 1 枚置いて、
    // 同じ探し方が見つけることを見る (本番の走査結果は変えない)。
    const 境ちょうど = { id: "植え込み", w: b!.器の幅 / 境の倍率, h: 1 };
    expect(帯に入るか(境ちょうど), "境ちょうどの図を帯に入れられない (探し方が効いていない)").toBe(
      true,
    );

    const 帯の中 = 寸法.filter(帯に入るか).map((v) => ({ id: v.id }));
    expect(
      帯の中,
      `境から ${丸めの帯 * 100}% 以内に図が居る。 丸めた値で集合を作ると揺れるので、字の world 寸法を別の経路で取る`,
    ).toEqual([]);
  });

  it("注意が出た図の集合が、器に収めた倍率が境を割る図の集合と一致する", () => {
    const b = 境を読む(注意[0]!.文面);
    expect(b, "境を読めていない").toBeDefined();
    const 境の倍率 = 届く倍率(b!);

    const 小さい = 寸法
      .filter((v) => 効く倍率(b!, v.w, v.h) < 境の倍率)
      .map((v) => v.id)
      .sort();

    const 出た = [...new Set(注意.map((n) => n.id))].sort();
    expect(出た, "注意の集合と、器に収めた倍率が境を割る図の集合が食い違う").toEqual(小さい);
  });

  it("幅だけを見ていたら拾えない図が 1 枚以上ある (`cdl#793` で拾うようになった側)", () => {
    /*
     * 幅は器に収まるのに、縦が足りなくて字が小さくなる図。 この形が 0 枚なら、
     * 高さの項を外す変異を当てても集合が変わらず、上の一致は幅だけの判定でも通る。
     */
    const b = 境を読む(注意[0]!.文面);
    expect(b, "境を読めていない").toBeDefined();
    const 境の倍率 = 届く倍率(b!);

    const 縦が効いて落ちる = 寸法
      .filter((v) => b!.器の幅 / v.w >= 境の倍率 && 効く倍率(b!, v.w, v.h) < 境の倍率)
      .map((v) => v.id)
      .sort();

    expect(
      縦が効いて落ちる.length,
      `幅だけの判定でも同じ集合になる (図 ${寸法.length} 枚を走査)。 高さの項が効いている証拠が無い`,
    ).toBeGreaterThan(0);
    // 実測で 10 枚。 件数は増減するので書かず、代表 1 枚が居ることだけ見る
    expect(縦が効いて落ちる, "縦が効いて落ちる図に、実測で最も小さい図が入っていない").toContain(
      "多対多が-2-組-8-表-8-関係",
    );
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
