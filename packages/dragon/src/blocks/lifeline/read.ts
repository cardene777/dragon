/**
 * `lifeline` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む。
 *
 * 時系列図の種類の行の `shape` (#3720) は最初の段を始める時 (`settle`) に確かめる。確かめた見た目は、記法を読む処理 (`parser.ts`) が原本の根の `sequence` の欄に置く。
 * `[shape: pipe]` を書いた図は、生存線を管で描くパイプ図の部品で並べて描く (Tracelyth #86、#91、#93、#97)
 */
import { fail, isOneOf } from "../../read-kit";
import { type Box, SEQUENCE_SHAPES } from "../../schema";
import { type BlockReading, none } from "../block";

export const lifelinesOf = (boxes: readonly Box[]): { lifelines: string[] } => ({ lifelines: boxes.map((box) => box.id) });

export interface LifelineMessages {
  /** 時系列図の種類の行の `shape` に `pipe` のほかの値を書いた (#3720) */
  sequenceBadShape: string;
}

export const reading: BlockReading<LifelineMessages> = {
  read: none("生存線の行は無い。描く処理の形へ組み直す時に、toModel が lifelinesOf で箱の並びから組む"),
  print: none("生存線の並びは箱の並びと同じなので書かない。読み直す時に箱の宣言から組み直す。種類の行の shape は書き戻す処理が根の欄から書く"),
  messages: {
    ja: { sequenceBadShape: "時系列図の shape は pipe だけを書ける。書かない図は今の見た目で描く" },
    en: { sequenceBadShape: "The shape of a sequence diagram can only be pipe. A diagram without shape is drawn in the default look" },
  },
  settle: (state, head) => {
    const shape = state.head.get("shape");
    if (shape && !isOneOf(SEQUENCE_SHAPES, shape.value)) throw fail(head, shape.at, state.m.sequenceBadShape);
  },
};
