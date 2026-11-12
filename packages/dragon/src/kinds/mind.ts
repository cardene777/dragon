/** 考えを広げる地図の描く部品の組 (#3619、#3656)。並べ方は図の種類の置き場 (`kinds/mind/layout.ts`)、考えと線の描き方は `render/mind.ts` が持つ */
import { drawMind } from "../render/mind";
import { layoutMind, type MindLayout } from "./mind/layout";
import type { KindParts } from "./parts";

export const parts: KindParts<MindLayout> = {
  layout: layoutMind,
  draw: (layout, _diagram, ctx) => drawMind(layout, ctx),
  // その段で書いた考えを見る
  focus: (layout, _diagram, step) => layout.ideas.filter((idea) => idea.step === step),
  overview: (layout) => layout.ideas.map((idea) => ({ rect: idea, band: false, color: idea.color })),
};
