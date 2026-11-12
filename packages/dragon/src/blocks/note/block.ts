/**
 * 箱の下の小さな字のブロック (#3345)。
 *
 * 段の中の `note <名札>: <字>` の行で、その段から箱の下の字を書き換える。
 * 時間軸の図の `note` の行は節目にも書けて丸の色を持つので、時間軸の図の旗のブロックの読み方 (`point/read.ts` の `readTimeNote`) が読み、
 * 書き戻す時は `[` を含む字を `"` で囲んで色の属性を後ろに書く。
 * 箱と区画の宣言の行の `note:` の属性は箱と区画の欄 (`sub` と `note`) で、宣言の行と一緒に読む。
 * 量の行き先の図 (#3626) の箱は量の棒で、棒の脇に名前と量だけを書くので、小さな字のブロックを描かない図の種類に書く。
 */
import type { Block } from "../block";

export const block: Block = {
  name: "note",
  rank: 70,
  attach: { how: "attach-to-box", except: ["pipe", "sankey"] },
  words: { heads: ["note"] },
};
