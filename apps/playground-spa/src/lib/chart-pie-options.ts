import type { CdlDiagram, ChartPieForm } from "@cardenelabs/cdl";

/**
 * カタログから、円グラフの見せ方を切り替えられるようにする (#1645)。
 *
 * 描画エンジンは同じ内訳を 3 つの形で描ける (cdl#684)。 輪を扇に切り分ける形、系列ごとに
 * 1 本の弧を積む形、輪の右に表を組む形。 記法を手で書き換えないと見比べられないので、
 * 画面から選べるようにする。
 *
 * **既定は輪**。 engine は欄を書かない図を輪として描く。 画面の初期状態と engine の既定を
 * 揃えないと、切替を触っていない図が「触った後の形」 で出る。
 *
 * **既定では元の object をそのまま返す**。 新しい object を返すと図が最初から描き直される
 * (`palette-switch.ts` と同じ理由)。
 *
 * 折れ線の 3 指定 (`chart-line-options.ts`) と違い、3 つは互いに排他。
 * 画面の並びも `group` ではなく `radiogroup` にする。
 */

/**
 * 図に書く値と、表に出す名前の対応。
 *
 * **値の側を key にする**。 `Record<ChartPieForm, string>` を満たす形にしてあるので、
 * engine が 4 つ目の見せ方を足した時に `tsc` が落ちる = 選択肢から黙って漏れない。
 * 名前の側を key にすると部分集合でも通り、漏れが検査まで届かない。
 */
const 値と表 = {
  ring: "輪",
  arcs: "積層の弧",
  table: "銘板",
} as const satisfies Record<ChartPieForm, string>;

/** 表に出す順は、値を並べた順に従う (輪 → 積層の弧 → 銘板) */
export const 円の見せ方の選択肢 = Object.values(値と表);
export type 円の見せ方 = (typeof 円の見せ方の選択肢)[number];

/** 名前から値を引く。 上の対応を 2 度書かずに裏返す */
const 表と値 = Object.fromEntries(
  Object.entries(値と表).map(([値, 表]) => [表, 値]),
) as Record<円の見せ方, ChartPieForm>;

/** 既定。 engine が欄を書かない図をどう描くかに揃える */
export const 既定の円の見せ方: 円の見せ方 = 値と表.ring;

/**
 * 前の時点を持つ円グラフの節か (#1702)。
 *
 * 判定は **engine と同じ条件** にする。 `chart-pie.tsx` は
 * `data.some((d) => d.previous !== undefined)` で輪を 2 つにするので、1 件でも書いてあれば
 * 前の時点を持つ図。 「全件が書いてあるか」 で見ると、engine が輪を 2 つ描いている図を
 * 画面側が「持っていない」 と判定する。
 */
const 前の時点を持つ = (n: { chartData?: Array<{ previous?: unknown }> }): boolean =>
  (n.chartData ?? []).some((d) => d.previous !== undefined);

/**
 * その図に、見せ方を切り替えられる円グラフがあるか。
 *
 * **前の時点を持つ図では選べない** (#1702)。 engine が前の値を渡すのは `輪` だけで
 * (`chart-pie.tsx` の `形 !== "ring"` で分岐する時点で前の値は落ちる)、`積層の弧` と
 * `銘板` へ切り替えると **内側の輪が黙って消える**。
 *
 * これは engine の誤りではない = `積層の弧` は系列の長さを比べる形、`銘板` は今の値を読む
 * 表として設計されており、前の時点を足すと形の狙いが変わる。 見せられない形の切替を
 * 出している画面側が誤り。 カタログの他の切替と同じく「効かない操作は出さない」 に揃える。
 */
export function 円の見せ方を選べる(diagram: CdlDiagram): boolean {
  const 円 = diagram.nodes.filter((n) => n.kind === "chart-pie");
  return 円.length > 0 && !円.some(前の時点を持つ);
}

/** 円グラフ node の見せ方を、画面で選んだ値に揃える */
export function 図の円の見せ方を変える(diagram: CdlDiagram, 見せ方: 円の見せ方): CdlDiagram {
  if (!円の見せ方を選べる(diagram)) return diagram;

  const 値 = 表と値[見せ方];
  const 全て同じ = diagram.nodes
    .filter((n) => n.kind === "chart-pie")
    .every((n) => (n.chartPieForm ?? "ring") === 値);
  if (全て同じ) return diagram;

  return {
    ...diagram,
    nodes: diagram.nodes.map((n) => (n.kind === "chart-pie" ? { ...n, chartPieForm: 値 } : n)),
  };
}
