/**
 * `op` のブロックの読み方 (#3720)。番号は時系列図の線の行の属性で、行を読んで書き戻すのは線のブロック (`edge/read.ts`)。
 * 番号の誤りの文も、どの図でも必ず読む線のブロックが持つ
 */
import { type BlockReading, none } from "../block";

/** 読む処理と書き戻す処理と誤りの文は、どれも線のブロックが持つ */
const BY_EDGE = none("線のブロックが持つ");

export const reading: BlockReading = { read: BY_EDGE, print: BY_EDGE, messages: BY_EDGE };
