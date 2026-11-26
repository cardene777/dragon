/** 考えを広げる地図の描く部品の組 (#3619、#3656)。並べ方は図の種類の置き場 (`kinds/mind/layout.ts`)、考えと線の描き方は `render/mind.ts` が持つ */
import { followEnds } from "../render/follow-ends";
import { drawMind } from "../render/mind";
import { layoutMind, type MindLayout } from "./mind/layout";
import type { KindParts } from "./parts";

export const parts: KindParts<MindLayout> = {
  layout: layoutMind,
  draw: (layout, _diagram, ctx) => drawMind(layout, ctx),
  // その段で書いた考えを見る
  focus: (layout, _diagram, step) => layout.ideas.filter((idea) => idea.step === step),
  // 段で書いた考えの親を線の端の箱に挙げる (#3836)。窓を引いた段で窓の端で切れる、段で書いた考えにも名前の札を出す (#3871)
  ends: followEnds((layout, _diagram, step) => {
    const added = layout.ideas.filter((idea) => idea.step === step);
    const ids = new Set(added.map((idea) => idea.id));
    const links = layout.links.filter((link) => link.step === step);
    return {
      added: [],
      ends: layout.ideas
        .filter((idea) => !ids.has(idea.id) && added.some((a) => a.parent === idea.id))
        .map((idea) => ({ rect: idea, name: idea.name, color: idea.color, paths: links.filter((link) => link.from === idea.id).map((link) => link.points) })),
      named: added.map((idea) => ({ rect: idea, name: idea.name, color: idea.color, paths: links.filter((link) => link.to === idea.id).map((link) => link.points) })),
    };
  }),
  overview: (layout) => layout.ideas.map((idea) => ({ rect: idea, band: false, color: idea.color })),
};

// 登録簿の型にこの種類の行を足す。登録簿はこの file を読まない (#3763)
declare module "./registry" {
  interface LaterKinds {
    mind: typeof import("./mind");
  }
}
