/**
 * 札のブロック (#3239、#3348)。
 *
 * 列の図の部品 (`only: lineup`)。段の中の `stamp <列>: <字>` の行で、列の右に傾いた札を押す。
 * 署名や承認のように、列の中身に触れずに起きたことを見せる。
 */
import { name } from "../../print-kit";
import { fail, readName } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import type { Block, ParseState } from "../block";

/** 列の図の、列 `box` の右に `text` の札を押す出来事 */
export interface LineupStamp {
  type: "stamp";
  box: string;
  text: string;
}

/** 列の図の `stamp <列>:` の行の列 */
const STAMP = /^stamp\s+([^\s:[]+)\s*:/du;

export interface StampMessages {
  stampShape: string;
}

/** 列の図の `stamp <列>: <字>` の行 */
function readStamp(source: SourceLine, state: ParseState): LineupStamp {
  const { m } = state;
  const found = STAMP.exec(source.text);
  const lane = found?.[1];
  if (!found || lane === undefined) throw fail(source, 0, m.stampShape);
  const box = state.boxAt(source, lane, found.indices?.[1]?.[0] ?? 0);
  const named = readName(source, found[0].length, m);
  if (named.value === "" || named.rest < source.text.length) throw fail(source, 0, m.stampShape);
  return { type: "stamp", box, text: named.value };
}

export const block: Block<StampMessages> = {
  name: "stamp",
  rank: 103,
  attach: { how: "attach-to-box", only: "lineup" },
  words: { heads: ["stamp"] },
  read: {
    stamp: (source, state) => {
      const step = state.inStep(source);
      step.events.push(readStamp(source, state));
    },
  },
  print: {
    events: {
      stamp: (e) => `stamp ${e.box}: ${name(e.text)}`,
    },
  },
  messages: {
    ja: { stampShape: "stamp は stamp <列>: <字> の形で書く" },
    en: { stampShape: "Write a stamp as stamp <lane>: <text>" },
  },
};
