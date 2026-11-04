/**
 * `order` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import { type BlockReading, none } from "../block";

export const reading: BlockReading = {
  read: none("order は箱の行の鍵で、行の頭の語を持たない。箱の行を読む処理が order の鍵を読む"),
  print: none("order は箱の行の鍵で、箱の宣言を書き戻す処理が order の鍵を書く"),
  messages: none("order の誤りの文は、箱の行を読む処理が出すので箱のブロックが持つ"),
};
