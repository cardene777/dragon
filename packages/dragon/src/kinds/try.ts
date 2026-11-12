/**
 * 試す図の描く部品の組 (#3337、#3656)。並べ方と、寄って追う窓が段ごとに見る所と、全体図に描く部品は図の種類の置き場 (`kinds/try/layout.ts`)、
 * 網と待ち行列と機械の列とチップの描き方と、窓を寄せる所は `render/try.ts` が持つ
 */
import { anchoredCenter, drawTry } from "../render/try";
import type { KindParts } from "./parts";
import { layoutTry, type TryLayout, tryFocusParts, tryOverview } from "./try/layout";

export const parts: KindParts<TryLayout> = {
  layout: (diagram, lang, options) => layoutTry(diagram, lang, options.width === undefined ? {} : { width: options.width }),
  draw: (layout, diagram, ctx) => drawTry(layout, diagram, ctx.t, ctx),
  // その段の出来事が触る部品を、出来事が着く所から順に見る
  focus: tryFocusParts,
  // 出来事が着く所 (送った先の待ち行列、作ったブロック、書き換えたブロック) を窓から外さずに寄せる
  aim: (_layout, _timeline, _step, rects, vw, vh) => anchoredCenter(rects, vw, vh),
  // 待ち行列の枠を地に、網の節と出ているブロックを札に描く
  overview: tryOverview,
};

/** 試す図の再生の部品の操作 (#3337)。再生の部品は試す図を描けた後に、登録簿から引いて置く */
export { mountTryControls, type TryControls } from "../try-player";
