/**
 * 量の帯のブロック (#3626)。
 *
 * 量の行き先の図の部品 (`only: sankey`)。行の頭の語を持たず、量の行き先の図の決まりだけを持つ。
 * `box` の行で宣言した出どころと行き先を、段の中の `<出どころ> -> <行き先>: <量>` の線で結び、線の名前の初めの数を量として読む。
 * 線の名前が数で始まらない線、流れを辿ると元の箱へ戻る線、同じ 2 つの箱を結ぶ 2 本目の線、入る量より出る量の和が大きい箱は誤りで止める。
 * 量の札は線の名前を出すので、線に札 (`tag` と `carry`) と線の名前を置く側 (`side`) は書けない。
 * `act` と `group` と `note` と中身の帯の行と、箱の添え書きと絵と飛び先も書けない。決まりは読み方 (`read.ts`) の `checkHead` と `afterEdge` と `finish` が持つ。
 * 原本の欄は持たず、箱の数の決まりは骨組み (`schemas/base.schema.json`) が持つ。
 */
import type { Block } from "../block";

export const block: Block = {
  name: "band",
  rank: 148,
  attach: { how: "connect", only: "sankey" },
  words: {},
  // 量の行き先の図の線の名前の量と、線の向きと、箱に入る量と出る量の決まりを持つ
  always: true,
};
