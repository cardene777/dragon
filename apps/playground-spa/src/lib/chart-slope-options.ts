import type { CdlDiagram, ChartSlopeForm } from "@cardenelabs/cdl";

/**
 * 見本帳から、傾き図の見せ方を切り替えられるようにする (#1659 / #1664)。
 *
 * 描画エンジンは同じ 2 時点の値を 3 つの形で描ける。 右に今の値を出す形と、増減
 * (`+40` / `-90`) を出す形 (cdl#702) と、縦の位置そのものを順位の段にする形 (cdl#707)。
 * 記法を手で書き換えないと見比べられないので、画面から選べるようにする。
 *
 * **傾き図は増減を読ませる図**なのに、差はどこにも字になっていない。 増減の形はそれを字に
 * するが、engine の既定ではない = 見本帳から出せないと「使えるが誰も見ない」 まま残る。
 *
 * **既定は今の値**。 engine は欄を書かない図を今の値で描く。 画面の初期状態と engine の
 * 既定を揃えないと、切替を触っていない図が「触った後の形」 で出る。
 *
 * **既定では元の object をそのまま返す**。 新しい object を返すと図が最初から描き直される
 * (`palette-switch.ts` と同じ理由)。
 *
 * 円グラフ (`chart-pie-options.ts`) と同じ形。 互いに排他なので、画面の並びは
 * 押した状態を持つ `group` ではなく `radiogroup` にする。
 */

/**
 * 図に書く値と、表に出す名前の対応。
 *
 * **値の側を key にする**。 `Record<ChartSlopeForm, string>` を満たす形にしてあるので、
 * engine が見せ方を足した時に `tsc` が落ちる = 選択肢から黙って漏れない。
 * 名前の側を key にすると部分集合でも通り、漏れが検査まで届かない。
 *
 * 実際に効いた = engine を `0.37.0` へ上げた時 (#1664) に、この行が
 * `Property 'rank' is missing` で落ちて `rank` の漏れを止めた。
 */
const 値と表 = {
  values: "今の値",
  delta: "増減",
  rank: "順位",
} as const satisfies Record<ChartSlopeForm, string>;

/** 表に出す順は、値を並べた順に従う (今の値 → 増減 → 順位) */
export const 傾きの見せ方の選択肢 = Object.values(値と表);
export type 傾きの見せ方 = (typeof 傾きの見せ方の選択肢)[number];

/** 名前から値を引く。 上の対応を 2 度書かずに裏返す */
const 表と値 = Object.fromEntries(
  Object.entries(値と表).map(([値, 表]) => [表, 値]),
) as Record<傾きの見せ方, ChartSlopeForm>;

/** 既定。 engine が欄を書かない図をどう描くかに揃える */
export const 既定の傾きの見せ方: 傾きの見せ方 = 値と表.values;

/** その図に、見せ方を切り替えられる傾き図があるか */
export function 傾きの見せ方を選べる(diagram: CdlDiagram): boolean {
  return diagram.nodes.some((n) => n.kind === "chart-slope");
}

/** 傾き図 node の見せ方を、画面で選んだ値に揃える */
export function 図の傾きの見せ方を変える(diagram: CdlDiagram, 見せ方: 傾きの見せ方): CdlDiagram {
  if (!傾きの見せ方を選べる(diagram)) return diagram;

  const 値 = 表と値[見せ方];
  const 全て同じ = diagram.nodes
    .filter((n) => n.kind === "chart-slope")
    .every((n) => (n.chartSlopeForm ?? "values") === 値);
  if (全て同じ) return diagram;

  return {
    ...diagram,
    nodes: diagram.nodes.map((n) => (n.kind === "chart-slope" ? { ...n, chartSlopeForm: 値 } : n)),
  };
}
