/**
 * `lifeline` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import type { Box } from "../../schema";
import { type BlockReading, none } from "../block";

export const lifelinesOf = (boxes: readonly Box[]): { lifelines: string[] } => ({ lifelines: boxes.map((box) => box.id) });

export const reading: BlockReading = {
  read: none("生存線の行は無い。描く処理の形へ組み直す時に、toModel が lifelinesOf で箱の並びから組む"),
  print: none("生存線の並びは箱の並びと同じなので書かない。読み直す時に箱の宣言から組み直す"),
  messages: none("生存線は記法に行を持たないので、誤りの文を持たない"),
};
