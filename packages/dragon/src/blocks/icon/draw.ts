/**
 * 絵の描き方 (#3345)。
 *
 * 絵柄は絵柄の表 (`icons.ts` の `ICONS`) の形を、置く所へ動かして縮めた 1 本の path で描く。
 * 箱、区画、中身の帯、時間軸の図の節目、木の図の根の箱など、絵柄を置く部品はどれもこの file から引く。
 * 描く下請け (`render/parts.ts`) も箱と区画の絵柄をここから引くので、この file は下請けを読まない。
 * `tabler:<名前>` は絵柄集の絵柄で、登録簿 (`sets.ts`) に登録した表から引く (#3493)。手描きの絵柄と同じ格子なので、同じ縮みで描く。
 */
import { LOOK } from "../../look/values";
import { userBlock } from "../../user-blocks";
import { ICONS } from "./icons";
import { tablerPath } from "./sets";

/** 座標を小数 2 桁に丸める。描く下請けの `r1` と同じ丸めで、下請けを読むと輪になるのでここに置く */
const r1 = (v: number): number => Math.round(v * 100) / 100;

/** 絵柄を描ける名前か。`ICONS` の継いだ鍵 (`constructor` など) は描けない名前に数える */
export const drawsIcon = (name: string | undefined): boolean => name !== undefined && pathOf(name) !== undefined;

/**
 * 絵柄の形。`+` で始まる名前は、使う人が足した印のブロックの path (#3399)。
 * `tabler:` で始まる名前は絵柄集の絵柄で、絵柄集を読んでいなければ形を持たない (描く処理が読む前に断る、#3493)
 */
function pathOf(name: string): string | undefined {
  if (name.startsWith("+")) return userBlock(name, "icon")?.path;
  return tablerPath(name) ?? (Object.hasOwn(ICONS, name) ? ICONS[name] : undefined);
}

export function glyph(name: string | undefined, x: number, y: number, scale: number, cls = "dg-gl"): string {
  const d = name === undefined ? undefined : pathOf(name);
  return d ? `<path class="${cls}" transform="translate(${r1(x)} ${r1(y)}) scale(${scale})" d="${d}"/>` : "";
}

/**
 * 絵柄を 1 つだけ描いた SVG (#3172)。見本帳の部品「絵」の頁が、使える絵柄を並べる時に使う。
 * 線の太さは箱の印と同じ割合 (印の線の太さ × 印の縮み) で、色は置いた所の字の色 (`currentColor`) を使う。知らない名前は `undefined`
 */
export function iconSvg(name: string): string | undefined {
  if (!Object.hasOwn(ICONS, name)) return undefined;
  const width = LOOK.stroke.glyph * LOOK.box.iconScale;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -12 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[name]}"/></svg>`;
}
