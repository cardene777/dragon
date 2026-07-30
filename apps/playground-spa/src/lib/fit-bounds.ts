/**
 * 「フィット」 で画面に収める範囲を決める。
 *
 * 図の枠 (`viewBox`) だけを見ると、 図の外に置いたパーツが視野に入らない。 パーツは cdl の
 * 図とは別に重ねて描くため、 図の枠が広がらないためである (実測 = 自動配置のパーツが
 * 画面の下 230px の位置に出て、 フィットしても見えなかった)。
 *
 * 図とパーツの両方を囲む矩形を返す。 単位は倍率を掛ける前の px。
 */

export type Rect = { left: number; top: number; width: number; height: number };

export type FitBounds = { left: number; top: number; width: number; height: number };

/**
 * 図とパーツを囲む矩形。
 *
 * `header` は図の上に並ぶ見出しの高さ。 図の枠の外にあるので、 高さにだけ足す。
 * パーツが 1 つも無ければ、 従来通り図の枠そのものを返す。
 */
export function fitBounds(diagram: { width: number; height: number }, header: number, parts: Rect[]): FitBounds {
  let left = 0;
  let top = 0;
  let right = diagram.width;
  let bottom = diagram.height;
  for (const p of parts) {
    // 大きさが 0 以下 / 数でないものは範囲を壊すので数えない
    if (!Number.isFinite(p.left) || !Number.isFinite(p.top)) continue;
    if (!Number.isFinite(p.width) || !Number.isFinite(p.height)) continue;
    if (p.width <= 0 || p.height <= 0) continue;
    left = Math.min(left, p.left);
    top = Math.min(top, p.top);
    right = Math.max(right, p.left + p.width);
    bottom = Math.max(bottom, p.top + p.height);
  }
  return {
    left,
    top,
    width: Math.max(1, right - left),
    // 見出しは図の上に積まれるので、 囲んだ高さに足す
    height: Math.max(1, bottom - top) + Math.max(0, header),
  };
}
