/**
 * 中身の帯のブロック (#3345)。
 *
 * 最初の `step` より前の `strip <題>: <欄>, <欄>` の行で帯と欄を宣言し、段の中の `set <欄>: <値> [tag: <札>]` の行で欄の値と札を変える。
 * 時間軸の図 (#3165) では、欄の名前の後ろに `[meter: <割合>]` を書いた欄を物差しにし、物差しの欄の値は割合で書く。
 * ほかの図の種類では欄の名前の一部として読んでいた形なので、欄が属性の形で終わる時だけ断る。
 * 帯の宣言は図の原本の `strip` の欄で、読んだ帯と物差しは読んでいる記法の状態の `figure` に置き、parser が図の原本に置く。
 * `strip` と `set` は語の表の離れた所に並ぶので、`set` は `words.headRanks` で並びの番号を持つ。
 */
import { attrs, name, quote } from "../../print-kit";
import { fail, readAttrs, readList, readName, readQuoted, skipSpaces } from "../../read-kit";
import type { DiagramEvent } from "../../schema";
import type { SourceLine } from "../../tokenize";
import type { Block, ParseState } from "../block";

export interface StripMessages {
  stripTwice: string;
  stripShape: string;
  emptyStripField: string;
  stripUndeclared: string;
  noSuchField: (field: string) => string;
  stripNeedsValue: string;
  badRatio: string;
  /** 物差しの欄 `field` の値が割合でない */
  meterValue: (field: string) => string;
}

/** `strip` の行の欄と、`set` の行に書ける属性の鍵 */
const STRIP_ATTRS: readonly string[] = ["meter"];
const SET_ATTRS: readonly string[] = ["tag"];
/** 割合。原本の JSON の割合の形と同じ */
const RATIO = /^([0-9]+\/[0-9]+|[0-9]+(\.[0-9]+)?%)$/u;

/** 書き戻す時に `:` の前に置く字 (帯の題と、`set` の欄) */
const keyText = (text: string): string => (text.includes(":") || text.includes("[") || text.startsWith('"') ? quote(text) : text);
/** 書き戻す時に `strip` の行に `,` で並べる欄。時間軸の図の欄は後ろに物差しの属性を書けるので、`[` を含む名前も囲む */
const fieldText = (text: string, time: boolean): string => (text.includes(",") || text.startsWith('"') || (time && text.includes("[")) ? quote(text) : text);

/** `strip <題>: <欄>, <欄>` の行 */
function readStrip(source: SourceLine, state: ParseState): void {
  const { m, figure } = state;
  state.beforeSteps(source);
  if (figure.strip) throw fail(source, 0, m.stripTwice);
  const text = source.text;
  const start = skipSpaces(text, "strip".length);
  let stripTitle: string;
  let colon: number;
  if (text[start] === '"') {
    const quoted = readQuoted(source, start, m);
    stripTitle = quoted.value;
    colon = skipSpaces(text, quoted.end);
  } else {
    colon = text.indexOf(":", start);
    stripTitle = colon < 0 ? "" : text.slice(start, colon).trim();
  }
  if (stripTitle === "" || text[colon] !== ":") throw fail(source, 0, m.stripShape);
  if (state.kind === "time") {
    figure.strip = { title: stripTitle, fields: readFields(source, colon + 1, state) };
    return;
  }
  const fields = readList(source, colon + 1, m);
  // 物差しは時間軸の図だけが書ける。ほかの図では欄の名前の一部として読んでいた形なので、欄が属性の形で終わる時だけ断る
  const metered = /\[\s*meter\s*:/u.exec(text);
  if (metered && fields.some((f) => /\[\s*meter\s*:[^\]]*\]$/u.test(f))) throw fail(source, metered.index + 1, m.timeOnly("meter"));
  figure.strip = { title: stripTitle, fields };
}

/**
 * 時間軸の図の `strip` の行の欄。`,` で区切り、欄の名前の後ろに `[meter: <割合>]` を書いた欄は物差しにする。
 * `[` を含む名前は `"` で囲む
 */
function readFields(source: SourceLine, at: number, state: ParseState): string[] {
  const { m, figure } = state;
  const text = source.text;
  const items: string[] = [];
  for (let i = at; ; ) {
    const start = skipSpaces(text, i);
    let value: string;
    let end: number;
    if (text[start] === '"') {
      const quoted = readQuoted(source, start, m);
      value = quoted.value;
      end = skipSpaces(text, quoted.end);
    } else {
      end = start;
      while (end < text.length && text[end] !== "," && text[end] !== "[") end++;
      value = text.slice(start, end).trim();
    }
    if (value === "") throw fail(source, start, m.emptyStripField);
    if (text[end] === "[") {
      const close = text.indexOf("]", end);
      if (close < 0) throw fail(source, end, m.attrUnclosed);
      const inside = text.slice(end + 1, close);
      const inner = /^\s*([a-z]*)\s*:\s*(.*?)\s*$/u.exec(inside);
      if (!inner) throw fail(source, end + 1, m.attrNoColon(inside.trim()));
      const key = inner[1] ?? "";
      if (!STRIP_ATTRS.includes(key)) throw fail(source, end + 1, m.badAttr(key, STRIP_ATTRS));
      if (!RATIO.test(inner[2] ?? "")) throw fail(source, end + 1, m.badRatio);
      figure.meters.push({ field: value, line: inner[2] ?? "" });
      end = skipSpaces(text, close + 1);
    }
    if (end < text.length && text[end] !== ",") throw fail(source, end, m.afterQuote);
    items.push(value);
    if (end >= text.length) return items;
    i = end + 1;
  }
}

/** `set <欄>: <値> [tag: <札>]` か `set <欄> [tag: <札>]` の行 */
function readSet(source: SourceLine, state: ParseState): DiagramEvent {
  const { m, figure } = state;
  const declared = figure.strip;
  if (!declared) throw fail(source, 0, m.stripUndeclared);
  const text = source.text;
  const start = skipSpaces(text, "set".length);
  let field: string;
  let at: number;
  if (text[start] === '"') {
    const quoted = readQuoted(source, start, m);
    field = quoted.value;
    at = skipSpaces(text, quoted.end);
  } else {
    at = start;
    while (at < text.length && text[at] !== ":" && text[at] !== "[") at++;
    field = text.slice(start, at).trim();
  }
  if (!declared.fields.includes(field)) throw fail(source, start, m.noSuchField(field));
  let value: string | undefined;
  if (text[at] === ":") {
    const named = readName(source, at + 1, m);
    if (named.value === "") throw fail(source, at, m.stripNeedsValue);
    value = named.value;
    at = named.rest;
  }
  if (at < text.length && text[at] !== "[") throw fail(source, at, m.stripNeedsValue);
  const tag = at < text.length ? readAttrs(source, at, SET_ATTRS, m).get("tag")?.value : undefined;
  if (value === undefined && tag === undefined) throw fail(source, 0, m.stripNeedsValue);
  if (value !== undefined && figure.meters.some((meter) => meter.field === field) && !RATIO.test(value)) throw fail(source, start, m.meterValue(field));
  return {
    type: "strip",
    field,
    ...(value !== undefined ? { value } : {}),
    ...(tag !== undefined ? { tag } : {}),
  };
}

export const block: Block<StripMessages> = {
  name: "strip",
  rank: 30,
  attach: { how: "attach-to-figure" },
  words: { heads: ["strip", "set"], headRanks: { set: 80 }, attrs: { strip: STRIP_ATTRS, set: SET_ATTRS } },
  shape: {
    field: { $ref: "#/definitions/strip" },
    definitions: {
      plainStrip: { description: "時間軸の図でない図の中身の帯。物差しを書けない", properties: { meters: { $ref: "#/definitions/absent" } } },
      strip: {
        type: "object",
        additionalProperties: false,
        required: ["title", "fields"],
        properties: {
          title: { $ref: "#/definitions/text" },
          fields: { type: "array", minItems: 1, items: { $ref: "#/definitions/text" } },
          meters: { description: "物差しにする欄。時間軸の図だけが書ける", type: "array", minItems: 1, items: { $ref: "#/definitions/meter" } },
        },
      },
      meter: {
        description: "物差しの欄。line の割合の所に線を引き、set の値まで針と一緒に満ちる",
        type: "object",
        additionalProperties: false,
        required: ["field", "line"],
        properties: { field: { $ref: "#/definitions/text" }, line: { $ref: "#/definitions/ratio" } },
      },
      ratio: { description: "割合。分数 (2/3) か百分率 (97%)", type: "string", pattern: "^([0-9]+/[0-9]+|[0-9]+(\\.[0-9]+)?%)$" },
    },
    events: {
      strip: {
        description: "中身の帯の欄の値と札",
        type: "object",
        additionalProperties: false,
        required: ["type", "field"],
        anyOf: [{ required: ["value"] }, { required: ["tag"] }],
        properties: { type: { const: "strip" }, field: { $ref: "#/definitions/text" }, value: { $ref: "#/definitions/text" }, tag: { $ref: "#/definitions/text" } },
      },
    },
  },
  read: {
    strip: (source, state) => {
      readStrip(source, state);
    },
    set: (source, state) => {
      state.inStep(source).events.push(readSet(source, state));
    },
  },
  print: {
    events: { strip: (e) => `set ${keyText(e.field)}${e.value === undefined ? "" : `: ${name(e.value)}`}${attrs([["tag", e.tag]])}` },
    figure: (diagram) => {
      if (!diagram.strip) return [];
      const time = diagram.kind === "time";
      const meters = new Map((diagram.strip.meters ?? []).map((m) => [m.field, m.line]));
      const fields = diagram.strip.fields.map((f) => `${fieldText(f, time)}${attrs([["meter", meters.get(f)]])}`);
      return [`strip ${keyText(diagram.strip.title)}: ${fields.join(", ")}`];
    },
  },
  messages: {
    ja: {
      stripTwice: "strip は 1 つだけ宣言する",
      stripShape: "strip は strip <題>: <欄>, <欄> の形で書く",
      emptyStripField: "strip の欄の名前が空",
      stripUndeclared: "set を書く前に、strip <題>: <欄>, <欄> で帯を宣言する",
      noSuchField: (field) => `${field} という欄は strip に無い`,
      stripNeedsValue: "set は set <欄>: <値> か set <欄> [tag: <札>] の形で書く",
      badRatio: "物差しの線は分数 (2/3) か百分率 (97%) で書く",
      meterValue: (field) => `${field} は物差しの欄なので、値を分数 (2/3) か百分率 (97%) で書く`,
    },
    en: {
      stripTwice: "Declare only one strip",
      stripShape: "Write a strip as strip <title>: <field>, <field>",
      emptyStripField: "A strip field name is empty",
      stripUndeclared: "Declare the strip as strip <title>: <field>, <field> before writing set",
      noSuchField: (field) => `The strip has no field named ${field}`,
      stripNeedsValue: "Write set as set <field>: <value> or set <field> [tag: <tag>]",
      badRatio: "Write the meter line as a fraction (2/3) or a percentage (97%)",
      meterValue: (field) => `${field} is a meter, so write its value as a fraction (2/3) or a percentage (97%)`,
    },
  },
};
