/**
 * `ring` のブロックの読み方 (#3623)。回り続ける図の決まりを、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む。
 *
 * 段の中の線は、書いた所で輪の次の手順への線かを確かめ、手順の数は記法の終わりに確かめる。
 */
import { fail } from "../../read-kit";
import { type BlockReading, none } from "../block";
import { EDGE, type EdgeEvent } from "../edge/block";
import { RING_STEPS } from "./block";

export interface RingMessages {
  /** 手順の数が輪に置ける数の外 */
  cycleSteps: (least: number, most: number, count: number) => string;
  /** 輪の次の手順でない手順への線 */
  cycleNotNext: (from: string, to: string, next: string) => string;
  /** 名前を持つ線 */
  cycleNamed: string;
  /** 回り続ける図に書けない行 */
  cycleNoLine: (word: string) => string;
}

/** 回り続ける図に書けない行の頭の語 */
const NO_LINES: readonly string[] = ["act", "group", "end"];

export const reading: BlockReading<RingMessages> = {
  checkHead: (source, word, state) => {
    if (NO_LINES.includes(word)) throw fail(source, 0, state.m.cycleNoLine(word));
  },
  afterEdge: (edge, state, source) => {
    const read = edge as EdgeEvent;
    const found = EDGE.exec(source.text);
    const toAt = found?.indices?.[2]?.[0] ?? 0;
    if (read.label !== undefined || read.labelSide !== undefined) throw fail(source, found?.[0].length ?? 0, state.m.cycleNamed);
    const ids = state.figure.boxes.map((box) => box.id);
    const next = ids[(ids.indexOf(read.from) + 1) % ids.length] ?? read.from;
    if (read.to !== next) throw fail(source, toAt, state.m.cycleNotNext(read.from, read.to, next));
  },
  finish: (state, head) => {
    const count = state.figure.boxes.length;
    if (count < RING_STEPS.least || count > RING_STEPS.most) throw fail(head, 0, state.m.cycleSteps(RING_STEPS.least, RING_STEPS.most, count));
  },
  read: none("輪の行は無い。手順は box の行で、線は線のブロックが読み、ここは決まりだけを確かめる"),
  print: none("輪は手順の箱と線から並べるので、箱と線のブロックが書く"),
  messages: {
    ja: {
      cycleSteps: (least, most, count) => `回り続ける図の手順 (box の行) は ${least} 行から ${most} 行まで書く。今は ${count} 行`,
      cycleNotNext: (from, to, next) => `${from} の次の手順は ${next} なので、${to} へは線を引けない。回り続ける図の線は輪の次の手順へ引く`,
      cycleNamed: "回り続ける図の線は名前を持たない。走る札は [tag: <字>] で書く",
      cycleNoLine: (word) => `cycle (回り続ける図) には ${word} の行を書けない`,
    },
    en: {
      cycleSteps: (least, most, count) => `A cycle diagram takes ${least} to ${most} steps (box lines), not ${count}`,
      cycleNotNext: (from, to, next) => `The step after ${from} is ${next}, so a line cannot go to ${to}. In a cycle diagram a line goes to the next step on the ring`,
      cycleNamed: "Lines in a cycle diagram take no label. Write the chip that runs as [tag: <text>]",
      cycleNoLine: (word) => `A cycle diagram takes no ${word} lines`,
    },
  },
};
