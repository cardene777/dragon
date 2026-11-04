/**
 * 封のブロック (#3239、#3348)。
 *
 * 列の図の部品 (`only: lineup`)。段の中の `seal <列>` の行で縞の封が列の左から伸びて中身を隠し、`open <列>` の行で封が消えて中身が戻る。
 * 封は 1 列に 1 つで、封をした列だけを開けられる。封をした列の並びは開けるまで書けない (列の並びのブロックが確かめる)。
 * 列を名指す行の形 (`<語> <列>`) は選ぶブロックの `pick` の行と同じなので、読む下請け (`laneAt`) と形の誤りの文をこのブロックが持つ。
 */
import { fail } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import type { Block, ParseState } from "../block";

/** 列の図の `seal`、`open`、`pick` の行の列 */
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

export const block: Block<SealMessages> = {
  name: "seal",
  rank: 101,
  attach: { how: "attach-to-box", only: "lineup" },
  words: { heads: ["seal", "open"] },
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
