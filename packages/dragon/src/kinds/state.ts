/** 状態遷移図の描く部品の組 (#3248、#3656)。並べ方は図の種類の置き場 (`kinds/state/layout.ts`) が持ち (#3347)、描き方は描く所 (`render/draw.ts`) の共通の描き方が持つ */
import type { KindParts } from "./parts";
import { layoutState } from "./state/layout";

export const parts: KindParts = {
  layout: layoutState,
  // 段で変わった値を今の状態の色で描き、帯の通った状態の点を着いた時刻に塗る (#3171)
  states: true,
};
