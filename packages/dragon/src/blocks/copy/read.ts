/**
 * `copy` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import { type BlockReading, none } from "../block";

export const reading: BlockReading = {
  read: none("copy の語は commit の行の中に書くので、commit のブロックが commit の行と一緒に読む"),
  print: none("copy の語は commit の行の中に書くので、commit のブロックが commit の行と一緒に書く"),
  messages: none("当て直しの元を確かめる誤りの文 (まだ積んでいない commit) は、commit のブロックが持つ"),
};
