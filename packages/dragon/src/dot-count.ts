/**
 * 点で数える見た目 (`[shape: dots]`、#3635) の点の数の決まり。量の図と集合の重なりの図が同じ決まりで数える。
 *
 * 点の数は件数を 1 点の件数 (`unit`) で割って四捨五入した数で、端数がちょうど半分なら切り上げる。
 * 1 点の件数を書かない図は、1 と 2 と 5 に 10 の累乗 (0 乗から) を掛けた数のうち、全体の件数が最も大きい段で点の数が `DOTS.aim` に最も近い値を選ぶ。
 * 同じだけ近い値が 2 つある時は小さい方を選ぶ。どの段でも同じ 1 点の件数を使い、段ごとに替えない。
 * 点の数が `DOTS.most` を超える段のある図は、ブロック `chart-set` と `circle` の記法を読む処理 (それぞれの `read.ts`) が頭の行を指して断る。
 * 読む処理と並べ方 (`kinds/chart/layout.ts` と `kinds/venn/layout.ts`) が同じ関数で数える。
 * 2 つの図の種類のブロックと並べ方が読むので、どちらのブロックの置き場にも置かず、何も読まない
 */

/** 点の数。`aim` は 1 点の件数を選ぶ時に狙う点の数、`most` は 1 つの段に描ける点の数の上限 */
export const DOTS = { aim: 100, most: 200 } as const;

/** 1 と 2 と 5 に 10 の累乗を掛けた数のうち、全体の件数 `most` を割った点の数が `DOTS.aim` に最も近い数。`most` が 0 以下なら 1 */
export function pickUnit(most: number): number {
  let best = 1;
  let gap = Number.POSITIVE_INFINITY;
  for (let power = 1; most > 0; power *= 10) {
    for (const base of [1, 2, 5]) {
      const unit = base * power;
      const off = Math.abs(most / unit - DOTS.aim);
      if (off < gap) {
        best = unit;
        gap = off;
      }
    }
    // これより大きい 1 点の件数は点が `aim` より少なくなるだけなので、近づかない
    if (most / power < DOTS.aim) break;
  }
  return best;
}

/** 件数 `value` を 1 点の件数 `unit` で数えた点の数。端数がちょうど半分なら切り上げる */
export const dotsOf = (value: number, unit: number): number => Math.round(value / unit);

/** 段ごとの全体の件数 `totals` で使う 1 点の件数。書いた値 `given` が無ければ全体が最も大きい段で選ぶ */
export const unitOf = (totals: readonly number[], given?: number): number => given ?? pickUnit(Math.max(0, ...totals));

/** 段ごとの全体の件数 `totals` を 1 点の件数 `unit` で数えた時に、上限を超える最初の段の点の数。超えなければ `undefined` */
export const tooManyDots = (totals: readonly number[], unit: number): number | undefined => totals.map((total) => dotsOf(total, unit)).find((count) => count > DOTS.most);

/** 0 より大きい数。小数も書ける */
const UNIT = /^[0-9]+(?:\.[0-9]+)?$/u;

/** 図の種類の行の `unit` の字が、1 点の件数に書ける 0 より大きい数か */
export const isUnit = (raw: string): boolean => UNIT.test(raw) && Number(raw) > 0;
