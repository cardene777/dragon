/**
 * 色付きの絵柄 (`paint` の行を持つ印のブロック、#3633) の決まりと描き方。
 *
 * 色付きの絵柄は定義を読んだ図にしか無いので、定義を読む処理 (`user-blocks-read.ts`) と一緒に後から読み、最初に読む束に入れない。
 * 絵柄を描く処理 (`draw.ts`) は登録した定義を読む処理からこの描き方を引く。
 * 描く時は元の表示の枠を、手描きの絵柄と同じ 20 四方に縮め、形ごとに定義の色で塗る。箱の色の線では描かない
 */
import { isUserPath, type UserPaint, userBlock } from "../../user-blocks";

/** 色付きの絵柄の形 1 つの path の長さの上限。事業者が配る絵柄の形は 1 つの path が長いので、1 色の形より長く取る */
export const PAINT_PATH_MAX = 20000;
/** 色付きの絵柄の色。`#` と 16 進の 3 桁か 6 桁だけで、`url(...)` も色の名前も書けない */
export const PAINT_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/u;

/** 絵柄を描く四角の一辺。手描きの絵柄と絵柄集の絵柄は (0, 0) を中心にこの四方に収まる */
const ICON_SQUARE = 20;

/** 座標を小数 2 桁に丸める。絵柄を描く処理の丸めと同じ */
const r1 = (v: number): number => Math.round(v * 100) / 100;

/** 色付きの絵柄として描いてよい形の並びか。定義を読む時と描く時に同じ決まりで確かめる */
export const isUserPaints = (view: readonly number[] | undefined, paints: readonly UserPaint[]): boolean =>
  view !== undefined &&
  view.length === 4 &&
  view.every(Number.isFinite) &&
  (view[2] ?? 0) > 0 &&
  (view[3] ?? 0) > 0 &&
  paints.length > 0 &&
  paints.every((p) => PAINT_COLOR.test(p.color) && isUserPath(p.path, PAINT_PATH_MAX));

/**
 * 名前 `name` の印のブロックの色付きの絵柄を、絵柄の真ん中 (`x`, `y`) に倍率 `scale` で描く SVG の要素。
 * 元の表示の枠の真ん中を (0, 0) に動かし、長い辺を 20 四方に縮める。`+` で始まらない名前と、`paint` の行を持たない定義と、描いてよい形でない定義は `undefined`
 */
export function paintGlyph(name: string | undefined, x: number, y: number, scale: number): string | undefined {
  const block = name?.startsWith("+") ? userBlock(name, "icon") : undefined;
  const view = block?.view;
  const paints = block?.paints;
  if (!view || !paints || !isUserPaints(view, paints)) return undefined;
  const [vx, vy, vw, vh] = view;
  const k = Math.round((ICON_SQUARE / Math.max(vw, vh)) * scale * 1e4) / 1e4;
  // 塗り方の決まりは `evenodd` の時だけ書く。引数で渡した定義のほかの字を属性に入れない
  const body = paints.map((p) => `<path fill="${p.color}"${p.rule === "evenodd" ? ' fill-rule="evenodd"' : ""} d="${p.path}"/>`).join("");
  return `<g transform="translate(${r1(x)} ${r1(y)}) scale(${k}) translate(${r1(-vx - vw / 2)} ${r1(-vy - vh / 2)})" stroke="none">${body}</g>`;
}
