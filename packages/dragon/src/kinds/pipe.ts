/** 配管の図の描く部品の組 (#3389、#3656)。並べ方と畳み方は図の種類の置き場 (`kinds/pipe/layout.ts`)、描き方は `render/pipe.ts` が持つ */
import { drawPipe } from "../render/pipe";
import type { KindParts } from "./parts";
import { foldPipe, layoutPipe, type PipeLayout } from "./pipe/layout";

export const parts: KindParts<PipeLayout> = {
  // `[fold]` の呼び出しの内側の段を、開くと頼まれていなければ 1 つの段にまとめてから並べる
  fold: (model, options, lang) => foldPipe(model, options.open ?? [], lang, options.words?.pipe),
  // 幅に関わらず横に長いまま並べ、再生の部品が枠の中を横に送る (#3398)
  layout: (diagram, lang, options) =>
    layoutPipe(diagram, {
      lang,
      ...(options.words?.pipe === undefined ? {} : { words: options.words.pipe }),
      ...(options.width === undefined ? {} : { width: options.width }),
    }),
  // 段ごとに図の全てを 1 枚の絵に描くので、描き方が全ての層を持つ
  draw: (layout, _diagram, ctx) => drawPipe(layout, ctx.t, ctx),
  // その段に関わる関係者の列を見る
  focus: (layout, _diagram, step) => layout.focus.filter((f) => f.step === step),
};

/** 配管の図の再生の部品の、図の下の段の矢印と呼び出しの結果 (#3418、#3450)。再生の部品は配管の図を描けた後に、登録簿から引いて置く */
export { mountPipeCalls, type PipeCalls } from "../pipe-player";
