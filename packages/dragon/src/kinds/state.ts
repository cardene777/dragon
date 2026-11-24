/** 状態遷移図の描く部品の組 (#3248、#3656)。並べ方は図の種類の置き場 (`kinds/state/layout.ts`) が持ち (#3347)、描き方は描く所 (`render/draw.ts`) の共通の描き方が持つ */
import { followEnds } from "../render/follow-ends";
import type { KindParts } from "./parts";
import { layoutState } from "./state/layout";

export const parts: KindParts = {
  layout: layoutState,
  // 段で変わった値を今の状態の色で描き、帯の通った状態の点を着いた時刻に塗る (#3171)
  states: true,
  // 段で引いた線の両端の状態を線の端の箱に挙げる (#3836)
  ends: followEnds((layout, _diagram, step) => {
    const edges = layout.edges.filter((edge) => edge.step === step);
    const on = (id: string) => edges.filter((edge) => edge.from === id || edge.to === id);
    return {
      added: [],
      ends: layout.boxes.filter((box) => on(box.id).length > 0).map((box) => ({ rect: box, name: box.name, color: box.color, paths: on(box.id).map((edge) => edge.points) })),
    };
  }),
};

// 登録簿の型にこの種類の行を足す。登録簿はこの file を読まない (#3763)
declare module "./registry" {
  interface LaterKinds {
    state: typeof import("./state");
  }
}
