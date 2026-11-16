/**
 * `op` のブロックの読み方 (#3720)。番号は時系列図の線の行の属性で、行を読んで書き戻すのは線のブロック (`edge/read.ts`)。
 * 番号の誤りの文も、どの図でも必ず読む線のブロックが持つ
 */
import { type BlockReading, none } from "../block";

export const reading: BlockReading = {
  read: none("op の番号は線の行の属性で、線のブロックが線の行と一緒に読む"),
  print: none("op の番号は線のブロックが線の行の属性として書き戻す"),
  messages: none("op の番号の誤りの文は、どの図でも必ず読む線のブロックが持つ"),
};
