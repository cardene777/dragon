/**
 * `seal` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import { fail } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import type { BlockReading, ParseState } from "../block";

const ON_LANE = /^(?:seal|open|pick)\s+(\S+)\s*$/du;

export interface SealMessages {
  /** `seal`、`open`、`pick` の行の形 */
  laneShape: (word: string) => string;
  sealTwice: (lane: string) => string;
  openUnsealed: (lane: string) => string;
}

/** 列の図の `<語> <列>` の行 (`seal`、`open`、`pick`) の列。宣言した箱の名札と、その列の位置 */
export function laneAt(source: SourceLine, word: "seal" | "open" | "pick", state: ParseState): { box: string; at: number } {
  const found = ON_LANE.exec(source.text);
  const lane = found?.[1];
  if (!found || lane === undefined) throw fail(source, 0, state.m.laneShape(word));
  const at = found.indices?.[1]?.[0] ?? 0;
  return { box: state.boxAt(source, lane, at), at };
}

/** 列の図の `seal <列>` と `open <列>` の行。封は 1 列に 1 つで、封をした列だけを開けられる */
function readSeal(source: SourceLine, state: ParseState, word: "seal" | "open"): { type: "seal" | "open"; box: string } {
  const { m } = state;
  const { sealed } = state.figure.lineup;
  const { box, at } = laneAt(source, word, state);
  if (word === "seal") {
    if (sealed.has(box)) throw fail(source, at, m.sealTwice(box));
    sealed.add(box);
  }
  if (word === "open" && !sealed.delete(box)) throw fail(source, at, m.openUnsealed(box));
  return { type: word, box };
}

export const reading: BlockReading<SealMessages> = {
  read: {
    seal: (source, state) => {
      const step = state.inStep(source);
      step.events.push(readSeal(source, state, "seal"));
    },
    open: (source, state) => {
      const step = state.inStep(source);
      step.events.push(readSeal(source, state, "open"));
    },
  },
  print: {
    events: {
      seal: (e) => `${e.type} ${e.box}`,
      open: (e) => `${e.type} ${e.box}`,
    },
  },
  messages: {
    ja: {
      laneShape: (word) => `${word} は ${word} <列> の形で書く`,
      sealTwice: (lane) => `${lane} の列にはもう封をしている`,
      openUnsealed: (lane) => `${lane} の列には封をしていない`,
    },
    en: {
      laneShape: (word) => `Write ${word} as ${word} <lane>`,
      sealTwice: (lane) => `The lane ${lane} is already sealed`,
      openUnsealed: (lane) => `The lane ${lane} is not sealed`,
    },
  },
};
