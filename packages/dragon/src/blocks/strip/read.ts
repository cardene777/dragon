/**
 * `strip` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import { attrs, name, quote } from "../../print-kit";
import { fail, readAttrs, readList, readName, readQuoted, skipSpaces } from "../../read-kit";
import type { DiagramEvent } from "../../schema";
import type { SourceLine } from "../../tokenize";
import type { BlockReading, ParseState } from "../block";
import { SET_ATTRS, STRIP_ATTRS } from "./block";

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

export const reading: BlockReading<StripMessages> = {
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
