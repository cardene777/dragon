/**
 * 図面の紙の色を **画面から読む** (#1060)。
 *
 * 書き出す絵の紙は、画面で見えている紙と同じ色でなければならない。 値を書き写すと CSS 側を
 * 変えた時にこちらだけ古くなり、書き出した絵の紙だけが別の色になる (実測 = 画面の紙を
 * `#3a2f22` に変えた後も、書き出し側は `#241c14` のままで箱との明るさの差が `ΔL* 4.7` に
 * 潰れていた)。
 */

/**
 * 画面と色が合わなくなった時に使う最後の手段。 実際に読めた時は使わない。
 *
 * 値は `globals.css` の `--d-surface` (明暗それぞれ) と揃える。 図の紙は一覧でも編集画面でも
 * この面の色なので、 ずれると読めなかった時だけ別の紙で書き出される。
 */
const FALLBACK_DARK = "#241f18";
const FALLBACK_LIGHT = "#fffdf7";

/** 透けている色 (`rgba(...,0)` / `transparent`) か。 */
function isTransparent(color: string): boolean {
  if (!color) return true;
  if (color === "transparent") return true;
  const m = color.match(/^rgba?\(([^)]+)\)$/);
  if (!m) return false;
  const parts = m[1]!.split(",").map((s) => Number(s.trim()));
  return parts.length === 4 && parts[3] === 0;
}

/**
 * 図面が載っている面の色を返す。
 *
 * 要素自身が透けている場合は、色を持つ祖先まで遡る。 どこまで遡っても色が無ければ
 * 画面の明暗に応じた既定に落ちる (書き出しを止めるより、近い色で出す方が良い)。
 */
export function stagePaperColor(stage: Element | null | undefined): string {
  const doc = stage?.ownerDocument ?? (typeof document === "undefined" ? null : document);
  const dark = doc?.documentElement.classList.contains("dark") ?? false;
  const fallback = dark ? FALLBACK_DARK : FALLBACK_LIGHT;
  if (!stage || typeof getComputedStyle !== "function") return fallback;

  let node: Element | null = stage;
  while (node) {
    const color = getComputedStyle(node).backgroundColor;
    if (!isTransparent(color)) return color;
    node = node.parentElement;
  }
  return fallback;
}
