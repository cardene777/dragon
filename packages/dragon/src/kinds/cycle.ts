/**
 * 回り続ける図の描く部品の組 (#3623、#3656)。並べ方は図の種類の置き場 (`kinds/cycle/layout.ts`)、輪の真ん中の字の描き方は `render/cycle.ts`、
 * 隣どうしの手順を結ぶ弧の描き方は輪のブロックの置き場が持つ。札の時刻の直しは表どうしの関係の図と同じ処理を使う。
 * 図の種類の行に `shape: clock` を書いた図は、時計の文字盤の見た目 (#3638) で並べて描く。並べ方は同じ置き場の `layoutClock`、描き方は `render/clock.ts` が持つ
 */
import { stepCarriers } from "../blocks/carry/step-times";
import { drawClock } from "../render/clock";
import { drawCycle } from "../render/cycle";
import { type ClockLayout, type CycleLayout, layoutClock, layoutCycle } from "./cycle/layout";
import type { KindParts } from "./parts";

export const parts: KindParts<CycleLayout | ClockLayout> = {
  layout: (diagram, lang, options) =>
    diagram.cycle?.shape === "clock" ? layoutClock(diagram, lang, options) : layoutCycle(diagram),
  times: stepCarriers,
  // 手順を結ぶ線は弧が描くので、共通の線は描かない
  // 輪の真ん中の値の移り変わりは描く本体から受け取り、中身の帯を描く処理を読まない (#3657)
  draw: (layout, _diagram, ctx, _subs, _follow, fields) => ({
    ...("shape" in layout ? drawClock(layout, fields, ctx) : drawCycle(layout, fields, ctx)),
    edge: () => undefined,
  }),
};
