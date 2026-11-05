/**
 * `call` のブロックの読み方 (#3389)。印は配管の図の呼び出しの行の属性で、行を読んで書き戻すのは呼び出しの管のブロック (`return/read.ts`)。
 * 印の誤りの文も、配管の図なら必ず読む呼び出しの管のブロックが持つ
 */
import { type BlockReading, none } from "../block";

export const reading: BlockReading = {
  read: none("call の印は呼び出しの行の属性で、呼び出しの管のブロックが呼び出しの行と一緒に読む"),
  print: none("call の印は呼び出しの管のブロックが呼び出しの行の属性として書き戻す"),
  messages: none("call の印の誤りの文は、配管の図なら必ず読む呼び出しの管のブロックが持つ"),
};
