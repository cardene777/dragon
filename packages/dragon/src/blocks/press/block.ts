/**
 * 釦のブロック (#3337、#3348)。
 *
 * 試す図の部品 (`only: try`)。最初の `step` より前の `press <名札> [from: <待ち行列>, into: <機械の列か記録の列>, take: <件数>, at: <部品>]` の行で、押せる釦を宣言する。
 * 押すと待ち行列の上から `take` 件を機械の列の新しいブロックか記録の列の新しい記録へ移す。`at` に部品を書くとその部品の所に置き、書かなければ入力の帯に置く。
 * `from: "<待ち行列>, <待ち行列>"` と 2 つ以上の待ち行列を並べると、書いた順にそれぞれの上から `take` 件ずつを 1 つにまとめ、
 * どれかが `take` 件に満たない間は押せない (#3453)。
 * 段の中の `press <名札>` は書き手の例として押し、空の待ち行列から取り出す釦は押せない。
 * 釦は図の上に置き場所を持たず、再生の部品 (`try-player.ts`) が描く。
 */
import type { Block } from "../block";

export const block: Block = {
  name: "press",
  rank: 111,
  attach: { how: "place", only: "try" },
  words: { heads: ["press"], attrs: { press: ["from", "into", "take", "at"] } },
};
