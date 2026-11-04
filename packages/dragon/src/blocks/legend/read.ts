/**
 * `legend` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import { type BlockReading, none } from "../block";

export const reading: BlockReading = {
  read: none("凡例の説明はチップの行の鍵で、行の頭の語を持たない。チップの行を読む処理が note の鍵を読む"),
  print: none("凡例の説明はチップの行の鍵で、チップの宣言を書き戻す処理が note の鍵を書く"),
  messages: none("凡例の説明は字を自由に書けるので、誤りの文を持たない"),
};
