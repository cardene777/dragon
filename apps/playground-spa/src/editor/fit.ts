/**
 * 図を枠に合わせる倍率と、拡大と縮小の段 (#3031)。
 *
 * 図を枠の幅と高さの両方に収める倍率を出し、箱の名前の字が `READABLE_PX` を割らない下限と、
 * 小さな図を大きくしすぎない上限 (`MAX_FIT`) で挟む。下限で枠からはみ出す分は、枠の中で送って見る。
 * 前の図が高さに合わせて縮み、箱の字が読めなかった形をここで止める。
 */

/** 箱の名前の字の、画面の上の大きさの下限 (px) */
export const READABLE_PX = 11;
/** 枠に合わせる時に大きくする上限。小さな図が枠いっぱいに膨らまないようにする */
export const MAX_FIT = 1.5;
/** 拡大と縮小の 1 段の比 */
export const ZOOM_STEP = 1.2;
/** 拡大と縮小を掛けた倍率の範囲 */
export const ZOOM_RANGE = [0.25, 4] as const;

export interface Size {
  width: number;
  height: number;
}

/**
 * 枠に合わせる倍率。`namePx` は図の原寸での箱の名前の字の大きさで、描いた図から読む。
 * `readablePx` は字の下限で、渡さなければ `READABLE_PX`。
 * 枠の大きさが測れない時 (0 以下) は原寸の 1 を返す。
 */
export function fitScale(frame: Size, figure: Size, namePx: number, readablePx: number = READABLE_PX): number {
  if (frame.width <= 0 || frame.height <= 0 || figure.width <= 0 || figure.height <= 0) return 1;
  const fit = Math.min(frame.width / figure.width, frame.height / figure.height);
  const floor = namePx > 0 ? readablePx / namePx : 0;
  return Math.min(MAX_FIT, Math.max(floor, fit));
}

/** 拡大と縮小を掛けた倍率。範囲の外へ出さない */
export const zoomed = (fit: number, factor: number): number => Math.min(ZOOM_RANGE[1], Math.max(ZOOM_RANGE[0], fit * factor));
