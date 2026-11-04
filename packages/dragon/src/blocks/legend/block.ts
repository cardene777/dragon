/**
 * 凡例のブロック (#3351、#3348)。
 *
 * 列の図の部品 (`only: lineup`)。`item` の行に `[note: <説明>]` と書くと、図の下の凡例にチップの説明が出る。
 * 同じ説明は最初のチップの色で 1 行にまとまる。凡例は図に 1 つ置くので、付け方は図に付く。
 * `note` はチップの行の鍵なので、チップのブロックがチップの行と一緒に読み書きし、原本の形はチップの形 (`definitions.item`) が持つ。
 */
import { type Block, none } from "../block";

export const block: Block = {
  name: "legend",
  rank: 106,
  attach: { how: "attach-to-figure", only: "lineup" },
  words: { attrs: { item: ["note"] } },
  read: none("凡例の説明はチップの行の鍵で、行の頭の語を持たない。チップの行を読む処理が note の鍵を読む"),
  print: none("凡例の説明はチップの行の鍵で、チップの宣言を書き戻す処理が note の鍵を書く"),
  messages: none("凡例の説明は字を自由に書けるので、誤りの文を持たない"),
};
