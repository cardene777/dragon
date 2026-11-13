/**
 * 2つの軸で置く図の、点数から区画の場所を決める決まり (#3637)。
 *
 * 区画は 2 つの軸を真ん中の 5 で分けた 4 つで、軸ごとに 5 以上を大きい側にする。大きい側は右と上で、`reverse` の軸は左と下になる。
 * 区画の場所は box を書いた順の番号で、左上が 0、右上が 1、左下が 2、右下が 3。
 * 記法を読む処理 (区画を書いた行が点数と合うか) と並べ方 (区画を書かない行の札と光らせる区画) の両方がこの決まりを使い、2 か所で決め直さない
 */
import type { MatrixAxis } from "../axis/block";
import type { MatrixItem } from "./block";

/** 点数の目盛りの最大。目盛りは 0 から数える */
export const SCORE_MAX = 10;

/** 区画を分ける点数。この点数以上を大きい側にする */
export const SCORE_SPLIT = 5;

/** 課題の点数から決まる区画の場所。点数を持たない課題は `undefined` */
export function spotOf(item: MatrixItem, axes: readonly MatrixAxis[]): number | undefined {
  if (item.x === undefined || item.y === undefined) return undefined;
  const [xAxis, yAxis] = axes;
  const right = (item.x >= SCORE_SPLIT) !== (xAxis?.reverse === true);
  const top = (item.y >= SCORE_SPLIT) !== (yAxis?.reverse === true);
  return (top ? 0 : 2) + (right ? 1 : 0);
}
