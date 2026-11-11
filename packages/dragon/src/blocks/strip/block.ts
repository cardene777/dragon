/**
 * 中身の帯のブロック (#3345)。
 *
 * 最初の `step` より前の `strip <題>: <欄>, <欄>` の行で帯と欄を宣言し、段の中の `set <欄>: <値> [tag: <札>]` の行で欄の値と札を変える。
 * 時間軸の図 (#3165) では、欄の名前の後ろに `[meter: <割合>]` を書いた欄を物差しにし、物差しの欄の値は割合で書く。
 * ほかの図の種類では欄の名前の一部として読んでいた形なので、欄が属性の形で終わる時だけ断る。
 * 帯の宣言は図の原本の `strip` の欄で、読んだ帯と物差しは読んでいる記法の状態の `figure` に置き、parser が図の原本に置く。
 * `strip` と `set` は語の表の離れた所に並ぶので、`set` は `words.headRanks` で並びの番号を持つ。
 * 量の図 (#3560) の `set` の行は項目の値で、量の図の値のブロックが読むので、中身の帯のブロックを描かない図の種類に書く。
 * 考えを広げる地図 (#3619) は真ん中の題から枝と葉を広げる図で帯の置き場を持たないので、中身の帯のブロックを描かない図の種類に書く。
 * 表どうしの関係の図 (#3618) の `set` の行は表の項目の値で、表のブロックが読むので、中身の帯のブロックを描かない図の種類に書く。
 * 集合の重なりの図 (#3620) の `set` の行は集まりと重なりの数で、集まりの円のブロックが読むので、中身の帯のブロックを描かない図の種類に書く。
 * 量の行き先の図 (#3626) は量を帯の幅と棒の脇の字で見せ、帯の置き場を持たないので、中身の帯のブロックを描かない図の種類に書く。
 */
import type { Block } from "../block";

/** `strip` の行の欄と、`set` の行に書ける属性の鍵 */
export const STRIP_ATTRS: readonly string[] = ["meter"];

export const SET_ATTRS: readonly string[] = ["tag"];

export const block: Block = {
  name: "strip",
  rank: 30,
  attach: { how: "attach-to-figure", except: ["try", "pipe", "chart", "mind", "er", "venn", "sankey"] },
  words: { heads: ["strip", "set"], headRanks: { set: 80 }, attrs: { strip: STRIP_ATTRS, set: SET_ATTRS } },
};
