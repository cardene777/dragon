/**
 * 持ち主ごとのカードの図の描く部品の組 (#3846)。並べ方は図の種類の置き場 (`kinds/cards/layout.ts`)、列と合計の帯の描き方は `render/cards.ts`、
 * カードの写しと断られた札の描き方は持ち主ごとのカードのブロックの置き場が持つ。
 * 列の見出しからカードへの呼び出しの線は運ぶ物を走らせないので、運ぶ物の見えている間を持たない。
 * 列とカードは描く部品が描くので、共通の箱の札と線を描かない。
 * 並べ方は共通の区画と箱を持たないので、寄って追う形の全体図に描く部品 (列と合計の帯とカード) をここで挙げる (#3912)
 */
import type { Rect } from "../layout/scene";
import { drawCards } from "../render/cards";
import { type CardsLayout, layoutCards } from "./cards/layout";
import type { KindParts, OverviewShape } from "./parts";

/** 段 `step` で動く物。段の中で作ったか消したか動かしたカードの写しと、断られた札 */
function moving(layout: CardsLayout, step: number): Rect[] {
  const seats = layout.cards.filter((seat) => seat.step === step && seat.event !== undefined);
  const refusals = layout.refusals.filter((refusal) => refusal.step === step);
  return [...seats, ...refusals].map(({ x, y, w, h }) => ({ x, y, w, h }));
}

/** 全体図に描く部品。列と合計の帯を地に、最後の段のカードの写しを札に描く。全体図は段で替わらないので、図の終わりの形を見せる */
function overview(layout: CardsLayout): OverviewShape[] {
  const last = Math.max(0, ...layout.cards.map((seat) => seat.step));
  return [
    ...layout.columns.map((column): OverviewShape => ({ rect: column, band: true, color: "slate" })),
    ...(layout.band ? [{ rect: layout.band, band: true, color: "slate" } satisfies OverviewShape] : []),
    ...layout.cards.filter((seat) => seat.step === last).map((seat): OverviewShape => ({ rect: seat, band: false, color: "slate" })),
  ];
}

export const parts: KindParts<CardsLayout> = {
  layout: (diagram, lang) => layoutCards(diagram, lang),
  carried: () => [],
  draw: (layout, _diagram, ctx) => ({ ...drawCards(layout, ctx), edge: () => undefined }),
  focus: (layout, _diagram, step) => moving(layout, step),
  overview,
  ownBoxes: true,
};

// 登録簿の型にこの種類の行を足す。登録簿はこの file を読まない (#3763)
declare module "./registry" {
  interface LaterKinds {
    cards: typeof import("./cards");
  }
}
