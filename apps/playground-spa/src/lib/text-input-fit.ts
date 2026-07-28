/**
 * 文字編集の入力欄の幅を決める。
 *
 * `input` の `scrollWidth` は使えない。 `input` は内容に関係なく既定幅 (`size` 属性、
 * 既定 20 文字相当) を持ち、 `width: auto` にしてもその幅に解決するため、 中身が
 * 短くても長くても同じ値が返る (実測で 256px 固定)。
 *
 * そのため文字そのものを測る。 幅は入力のたびに変わるので、 位置は左端ではなく中心で
 * 固定する (左端固定だと打つほど右へ伸びて元の文字から離れていく)。
 */

/** 左右の padding + caret + border の分。 これが無いと最後の文字が枠に触れる。 */
export const TEXT_INPUT_PADDING = 20;

/** 空にしても掴める大きさを残す。 */
export const TEXT_INPUT_MIN_WIDTH = 48;

/** 極端に長い入力で画面外まで伸びないようにする。 */
export const TEXT_INPUT_MAX_WIDTH = 900;

/**
 * 測った文字幅から入力欄の幅を出す。
 *
 * 測定そのものは呼び出し側に任せる (canvas が要るため)。 ここは丸めだけを持ち、
 * 上下限と余白の規則を 1 箇所に閉じる。
 */
export function textInputWidth(measuredTextWidth: number): number {
  const w = Number.isFinite(measuredTextWidth) ? measuredTextWidth : 0;
  const withPadding = Math.max(0, w) + TEXT_INPUT_PADDING;
  return Math.min(TEXT_INPUT_MAX_WIDTH, Math.max(TEXT_INPUT_MIN_WIDTH, withPadding));
}

/** canvas は 1 つ作って使い回す (入力のたびに作ると GC を無駄に呼ぶ)。 */
let ctx: CanvasRenderingContext2D | null = null;

/**
 * 指定の font で文字を測る。 canvas が使えない環境では `null` を返す。
 *
 * `null` の時は呼び出し側が幅を変えない = 既定幅のまま。 測れないことを 0 幅として
 * 扱うと入力欄が最小幅に潰れて、 測れる環境より使いにくくなる。
 */
export function measureTextWidth(text: string, font: string): number | null {
  if (ctx === null) {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    ctx = canvas.getContext("2d");
    if (ctx === null) return null;
  }
  ctx.font = font;
  return ctx.measureText(text).width;
}
