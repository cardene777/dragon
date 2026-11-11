/**
 * 線の名前のブロック (#3345)。
 *
 * 線の行の `:` の後ろの名前 (`<名札> -> <名札>: <線の名前>`) と、名前を置く側を指す `[side: <側>]` を受け持つ。
 * 名前と側は線の行の一部で行の頭の語を持たないので、線の行を読む処理が `readLabel` と `readSide` を呼び、
 * 線の行を書き戻す処理が名前と `side` の属性を書く。
 * 原本では線の出来事 (`edge`) の欄 (`label` と `labelSide`) で、線の出来事の形の一部になる。
 * 回り続ける図の線は名前を持たず、走る札 (`[tag: <字>]`) で何が渡るかを見せるので、名前と側を受けない (#3623)。
 * 表どうしの関係の図の線も名前を持たず、走る札で項目から項目へ渡る値を見せるので、名前と側を受けない (#3618)。
 */
import type { Block } from "../block";

export type LabelSide = "above" | "below" | "left" | "right";

/** `side` に書ける側。型が欠けを止める (原本の側の値に語が無い時は型の検査が落ちる) */
export const SIDES = Object.keys({ above: true, below: true, left: true, right: true } satisfies Record<LabelSide, true>) as LabelSide[];

export const block: Block = {
  name: "edge-label",
  rank: 86,
  attach: { how: "ride-on-line", except: ["pipe", "cycle", "er"] },
  words: { attrs: { edge: ["side"] } },
};
