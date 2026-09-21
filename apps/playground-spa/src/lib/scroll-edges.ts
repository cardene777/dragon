/**
 * 巻き取る要素の、どちらの端に続きが隠れているか (#2427)。
 *
 * 器に入らない図は内側が巻き取って余りを隠す (#2268 / #2269)。 隠れていることを示すのは
 * 掴める形のカーソルだけで、**触れないと出ず、どちら側に続くかも言わない**。
 * 携帯には hover が無いので、指を載せるまで判らない。
 *
 * ## 画面から切り離す
 *
 * 判定を 3 つの数だけで行う形にする。 `jsdom` は配置を計算せず `scrollWidth` が常に 0 に
 * なるため、要素を受け取る形にすると検査が書けない (要素を偽装すると、偽装した値と
 * 実物の食い違いを検査が見逃す)。
 *
 * ## 誤差を許す
 *
 * `scrollLeft` は小数を返す。 倍率を指定した図では `scrollWidth - clientWidth` と
 * `scrollLeft` が 0.5px ほどずれ、**送り切っても右の手がかりが消えない**。
 * 1px 以下の残りは送り切ったものとして扱う。
 */

/** 続きが隠れている端 */
export type 隠れた端 = "無し" | "左" | "右" | "両方";

/**
 * 送り切ったとみなす残り (px)。
 *
 * 1px 以下にするのは、手がかりが指す先が 1px なら見えるものが無いため。
 * ちょうど 1px を残した時も「続きが無い」 側に倒す。
 */
const 誤差 = 1;

/**
 * 3 つの数から、続きが隠れている端を返す。
 *
 * 数として読めない値 (`NaN` / 無限) は **端が無い** 側に倒す = 読めないことを
 * 「続きがある」 と読み替えると、溢れていない図にも手がかりが出る。
 */
export function 隠れている端(送り: {
  scrollLeft: number;
  scrollWidth: number;
  clientWidth: number;
}): 隠れた端 {
  const { scrollLeft, scrollWidth, clientWidth } = 送り;
  if (![scrollLeft, scrollWidth, clientWidth].every((n) => Number.isFinite(n))) return "無し";

  const 余り = scrollWidth - clientWidth;
  if (余り <= 誤差) return "無し";

  const 左に続く = scrollLeft > 誤差;
  const 右に続く = scrollLeft < 余り - 誤差;
  if (左に続く && 右に続く) return "両方";
  if (左に続く) return "左";
  if (右に続く) return "右";
  return "無し";
}
