/**
 * 出典のブロック (#3199、#3345)。
 *
 * 段の中に `source <名前> [url: <URL>]` の行で書き、1 つの段に何行でも書ける。
 * 原本の JSON では段の `sources` に書いた順に並び、出典を書かない段は欄を持たない。
 * 図の SVG には描かず、頁に置いた図の読み上げの段の一覧に、名前を URL への link にして出す (`draw.ts`)。
 * どの図の種類の段にも書けるコアブロックで、図に付く。
 * URL は箱の飛び先と同じく、頁を移る形 (`/` で始まる path か、`http://` か `https://` で始まる URL) だけを受ける。
 */
import type { Messages } from "../../messages";
import { attrs, name } from "../../print-kit";
import { fail, readAttrs, readName } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import type { Block } from "../block";
import { urlOf } from "../link/block";

/** 段の出典。読み上げの段の一覧に、名前を URL への link にして出す。URL の形は箱の飛び先と同じ (#3199) */
export interface StepSource {
  name: string;
  url: string;
}

/** 出典の誤りの文 */
export interface SourceMessages {
  /** 段の出典の行の形 (#3199) */
  sourceShape: string;
}

/** `source` の行に書ける属性の鍵 */
const ATTRS = ["url"] as const;

/** `source <名前> [url: <URL>]` の行 */
function readSource(source: SourceLine, m: Messages): StepSource {
  const named = readName(source, "source".length, m);
  const url = named.rest < source.text.length ? readAttrs(source, named.rest, ATTRS, m).get("url") : undefined;
  if (named.value === "" || !url) throw fail(source, 0, m.sourceShape);
  return { name: named.value, url: urlOf(source, "url", url, m) };
}

export const block: Block<SourceMessages> = {
  name: "source",
  rank: 50,
  attach: { how: "attach-to-figure" },
  words: { heads: ["source"], attrs: { source: ATTRS } },
  shape: {
    definitions: {
      source: {
        type: "object",
        additionalProperties: false,
        required: ["name", "url"],
        properties: { name: { $ref: "#/definitions/text" }, url: { $ref: "#/definitions/url" } },
      },
    },
  },
  read: {
    source: (source, state) => {
      state.inStep(source).sources.push(readSource(source, state.m));
    },
  },
  // 段の中で起きることより前に、JSON の並びのまま 1 つずつ書く
  print: { step: (step) => (step.sources ?? []).map((s) => `source ${name(s.name)}${attrs([["url", s.url]])}`) },
  messages: {
    ja: { sourceShape: "source は source <名前> [url: <URL>] の形で書く" },
    en: { sourceShape: "Write a source as source <name> [url: <URL>]" },
  },
};
