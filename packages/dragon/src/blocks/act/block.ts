/**
 * 箱の中の処理のブロック (#3345)。
 *
 * 段の中の `act <名札>: <処理の名前>` の行で、線を引かずに箱の中で起きる処理を出す。
 * 時系列図は生存線の上の札 (`draw.ts`) で見せ、ほかの図の種類は箱の下の字の書き換え (`blocks/note/draw.ts`) で見せる。
 * 列の図は線と処理を持たないので、列の図の `act` の行は断る。
 */
import type { Block } from "../block";

export const block: Block = {
  name: "act",
  rank: 60,
  attach: { how: "attach-to-box", except: ["lineup"] },
  words: { heads: ["act"] },
};
