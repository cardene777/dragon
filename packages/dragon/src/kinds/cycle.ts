/**
 * 回り続ける図の描く部品の組 (#3623、#3656)。並べ方は図の種類の置き場 (`kinds/cycle/layout.ts`)、輪の真ん中の字の描き方は `render/cycle.ts`、
 * 隣どうしの手順を結ぶ弧の描き方は輪のブロックの置き場が持つ。札の時刻の直しは表どうしの関係の図と同じ処理を使う。
 * 図の種類の行に `shape: clock` を書いた図は、時計の文字盤の見た目 (#3638) で並べて描く。並べ方は同じ置き場の `layoutClock`、描き方は `render/clock.ts` が持つ。
 * `shape: band` を書いた図は、輪を開いた帯の見た目 (#3639) で並べて描く。並べ方は同じ置き場の `layoutBand`、描き方は `render/band.ts` が持つ
 */
import { stepCarriers } from "../blocks/carry/step-times";
import { drawBand } from "../render/band";
import { drawClock } from "../render/clock";
import { drawCycle } from "../render/cycle";
import { type BandLayout, type ClockLayout, type CycleLayout, layoutBand, layoutClock, layoutCycle } from "./cycle/layout";
import type { KindParts } from "./parts";

export const parts: KindParts<CycleLayout | ClockLayout | BandLayout> = {
  layout: (diagram, lang, options) => {
    const shape = diagram.cycle?.shape;
    if (shape === "clock") return layoutClock(diagram, lang, options);
    return shape === "band" ? layoutBand(diagram, lang, options) : layoutCycle(diagram);
  },
  times: stepCarriers,
  // 手順を結ぶ線は弧が描くので、共通の線は描かない
  // 輪の真ん中の値の移り変わりは描く本体から受け取り、中身の帯を描く処理を読まない (#3657)
  draw: (layout, _diagram, ctx, _subs, _follow, fields) => ({
    ...(!("shape" in layout) ? drawCycle(layout, fields, ctx) : layout.shape === "clock" ? drawClock(layout, fields, ctx) : drawBand(layout, fields, ctx)),
    edge: () => undefined,
  }),
};
