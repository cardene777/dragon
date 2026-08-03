/**
 * 図枠 (viewBox) が動いた分を pan で打ち消す量を出す。
 *
 * cdl の viewBox は内容の外接矩形に自動追従する。 要素を右へ動かすと枠の左端も右へ寄るため、
 * 画面上は「動かした要素はその場に留まり、 触っていない要素が左へずれる」 という逆の見え方に
 * なる。 枠の原点が動いた分だけ pan を逆に振ると、 触っていない要素が画面に留まり、 動かした
 * 要素だけが動く。
 *
 * 画面座標は `tx + pan·k·(p − vbX)` で表せる (`k` = 図全体の倍率、 `pan` = 編集画面の拡大率)。
 * SVG の表示サイズを viewBox に比例させているので、 枠が変わっても拡大率 `k` は変わらない。
 * つまり枠の変化は平行移動だけになり、 1 つの `tx` 補正で全点を同時に固定できる。
 *
 * 表示サイズを固定していた頃は、 枠が縮むと拡大率まで変わったため、 どう pan を振っても
 * 全点を揃えることはできなかった。
 */

export type ViewBoxOrigin = { x: number; y: number; k: number };

/**
 * pan に加える補正量。 補正しない場合は `null`。
 *
 * 倍率 `k` が変わった回は補正しない。 拡大縮小そのものが画面を変える操作なので、
 * 打ち消すと倍率が効かなくなる。
 */
export function panCompensation(
  prev: ViewBoxOrigin | null,
  next: ViewBoxOrigin,
  pan: number,
): { dtx: number; dty: number } | null {
  if (!prev) return null;
  if (prev.k !== next.k) return null;
  if (!Number.isFinite(pan) || pan <= 0) return null;
  const dx = next.x - prev.x;
  const dy = next.y - prev.y;
  if (dx === 0 && dy === 0) return null;
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return null;
  return { dtx: pan * next.k * dx, dty: pan * next.k * dy };
}

/** 補正後に、 user 座標 `p` が画面上のどこに来るか。 test で不変性を確かめるために使う。 */
export function screenX(tx: number, pan: number, k: number, vbX: number, p: number): number {
  return tx + pan * k * (p - vbX);
}
