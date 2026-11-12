/**
 * 時間軸の図の描く部品の組 (#3248、#3656)。並べ方は図の種類の置き場 (`kinds/time/layout.ts`、#3348)、
 * 目盛りと印と拡大の帯の箱と節目と物差しの欄の描き方と、寄って追う窓が見せる所は `render/time.ts` が持つ (#3165)
 */
import { drawTime, meterField, timeFocus } from "../render/time";
import type { KindParts } from "./parts";
import { layoutTime, type TimeLayout } from "./time/layout";

export const parts: KindParts<TimeLayout> = {
  layout: layoutTime,
  draw: (layout, diagram, ctx, subs) => {
    // 拡大の帯の線は他の図と同じ線で描き、それ以外の線は描かない
    const wired = new Set(layout.wires.map((w) => `${w.step}/${w.event}`));
    return { ...drawTime(layout, diagram, ctx.t, ctx, subs), edge: (e) => (wired.has(`${e.step}/${e.event}`) ? 0 : undefined) };
  },
  // 物差しの欄は、満ち具合の動きで棒を伸ばす
  meter: meterField,
  // 針と印の列を必ず窓に入れる。番号の丸へ寄せ直すと、針が窓から外れるため
  aim: (layout, timeline, step, rects, vw, vh) => {
    const f = timeFocus(layout, timeline, step, rects, vw, vh);
    return [f.x + f.w / 2, f.y + f.h / 2];
  },
  ownBoxes: true,
};
