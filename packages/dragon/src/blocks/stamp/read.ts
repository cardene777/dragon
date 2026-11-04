/**
 * `stamp` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import { name } from "../../print-kit";
import { fail, readName } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import type { BlockReading, ParseState } from "../block";
import type { LineupStamp } from "./block";

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

export const reading: BlockReading<StampMessages> = {
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
