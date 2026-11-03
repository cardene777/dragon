/**
 * 当て直しの描き方 (#3164、#3347)。
 *
 * 当て直しの線は、元の commit から写しへ点線で引き、写しを積んだ時に出して繰り返す前まで残す。伸ばさずに出す。
 * この file は枝分かれの図を描く部品 (`render/git.ts`) だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import { pathOf } from "../../render/parts";
import { cs } from "../color/draw";
import type { LinkLine } from "../commit/draw";

/** 元の commit から写しへの点線 */
export const copyLine: LinkLine = (l, time, ctx) => {
  const { m } = ctx;
  return `<g style="${cs(l.color)}"><path class="dg-git-cp dg-a" d="${pathOf(l.points)}" style="${m.vis(time.start, m.last)}"/></g>`;
};
