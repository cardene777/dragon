/**
 * `source` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import type { BlockReading } from "../block";
import type { Messages } from "../../messages";
import { attrs, name } from "../../print-kit";
import { fail, readAttrs, readName } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import { urlOf } from "../link/read";
import { ATTRS, type StepSource } from "./block";

/** 出典の誤りの文 */
export interface SourceMessages {
  /** 段の出典の行の形 (#3199) */
  sourceShape: string;
}

/** `source <名前> [url: <URL>]` の行 */
function readSource(source: SourceLine, m: Messages): StepSource {
  const named = readName(source, "source".length, m);
  const url = named.rest < source.text.length ? readAttrs(source, named.rest, ATTRS, m).get("url") : undefined;
  if (named.value === "" || !url) throw fail(source, 0, m.sourceShape);
  return { name: named.value, url: urlOf(source, "url", url, m) };
}

export const reading: BlockReading<SourceMessages> = {
  read: {
    source: (source, state) => {
      state.inStep(source).sources.push(readSource(source, state.m));
    },
  },
  print: { step: (step) => (step.sources ?? []).map((s) => `source ${name(s.name)}${attrs([["url", s.url]])}`) },
  messages: {
    ja: { sourceShape: "source は source <名前> [url: <URL>] の形で書く" },
    en: { sourceShape: "Write a source as source <name> [url: <URL>]" },
  },
};
