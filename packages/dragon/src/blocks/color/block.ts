/**
 * 色の役のブロック (#3345)。
 *
 * 箱と区画に付ける色の役。`box` と `group` の行の `[color: <色>]` で、7 つの役 (`COLORS`) から選ぶ。色そのものは色味 (`look/values.ts`) が決める。
 * 色は箱と区画の行の属性で行の頭の語を持たないので、箱と区画の行を読む処理がこのブロックの `readLook` で見た目の属性 (添え書き、色、絵) をまとめて読み、
 * 箱と区画の宣言を書き戻す処理が `color` の鍵を書く。
 * 時間軸の図の印の列と節目、列の図のチップも同じ色の役の一覧と誤りの文を使う。
 */
import type { Block } from "../block";

export type Color = "blue" | "amber" | "green" | "violet" | "rose" | "slate" | "coin";

/** 色の役の一覧。記法の `color:` に書ける値と、誤りの文に並べる値 */
export const COLORS: readonly Color[] = ["blue", "amber", "green", "violet", "rose", "slate", "coin"];

export const block: Block = {
  name: "color",
  rank: 87,
  attach: { how: "attach-to-box", except: ["pipe"] },
  words: { attrs: { group: ["color"], box: ["color"] } },
};
