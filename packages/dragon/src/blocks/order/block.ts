/**
 * 置き場のブロック (#3351、#3348)。
 *
 * 列の図の部品 (`only: lineup`)。`box <名札> [order: none]` と書くと、その箱は順番の無い置き場になり、チップを散らして置いて点線の枠で描く。
 * ほかの箱は札になり、チップを書いた順に上から積む。置き場と札の間には矢印を引く。
 * `order` は箱の行の鍵なので、箱のブロックが箱の行と一緒に読み書きし、原本の形は箱の形 (`definitions.box`) が持つ。
 */
import { type Block, none } from "../block";

export const block: Block = {
  name: "order",
  rank: 105,
  attach: { how: "attach-to-box", only: "lineup" },
  words: { attrs: { box: ["order"] } },
  read: none("order は箱の行の鍵で、行の頭の語を持たない。箱の行を読む処理が order の鍵を読む"),
  print: none("order は箱の行の鍵で、箱の宣言を書き戻す処理が order の鍵を書く"),
  messages: none("order の誤りの文は、箱の行を読む処理が出すので箱のブロックが持つ"),
};
