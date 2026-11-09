/**
 * `scale` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import { attrs, name, num } from "../../print-kit";
import { type Attr, fail, isOneOf, list, readAttrs, readName, skipSpaces } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import type { BlockReading, ParseState } from "../block";
import { type Color, COLORS } from "../color/block";
import { DURATION_UNITS, NOW, SPAN_SHAPES, type TimeSpanEvent } from "./block";

/** 時間軸の図の宣言の行。`scale <単位> <長さ> <数>` と `period <名前> <数>` */
const SCALE = /^scale\s+(\S+)\s+(\S+)\s+([^\s[]+)/du;

const PERIOD = /^period\s+(\S+)\s+([^\s[]+)/du;

const NOW_LINE = new RegExp(`^${NOW}\\s*->\\s*(\\S+)\\s*$`, "du");

const SPAN = /^span\s+([^\s:[]+)\s*:/du;

/** 目盛りの長さ。原本の JSON の長さの形と同じ */
const LENGTH = /^[0-9]+(\.[0-9]+)?(ms|s|min|h|d)$/u;

/** 1 以上の整数と、0 以上の整数 */
const COUNT = /^[1-9][0-9]*$/u;

export const NUMBER = /^(0|[1-9][0-9]*)$/u;

/** 目盛りの範囲。`0-31` か `0` */
const RANGE = /^(0|[1-9][0-9]*)(?:-(0|[1-9][0-9]*))?$/u;

export interface ScaleMessages {
  /** 時間軸の図の宣言の行を 2 つ書いた */
  timeTwice: (word: string) => string;
  noScale: string;
  scaleShape: string;
  periodShape: string;
  nowShape: string;
  spanShape: string;
  badLength: string;
  badCount: (word: string) => string;
  /** 目盛りの位置か範囲 (`text`) が、0 から `count - 1` の外か、範囲の形でない */
  badUnit: (text: string, count: number) => string;
  /** 針を前の時刻 (`at` の目盛りの終わり) より先へ進めない `now` */
  nowBack: (text: string, at: number) => string;
  nowReserved: (name: string) => string;
  badShape: string;
}

/** 目盛りの数。目盛りを宣言する前は 0 */
const countOf = (state: ParseState): number => state.figure.time.scale?.count ?? 0;

/** `text` を目盛りの位置として読む。0 から目盛りの数より 1 小さい数まで */
export function unitAt(source: SourceLine, at: number, text: string, state: ParseState): number {
  if (!NUMBER.test(text) || Number(text) >= countOf(state)) throw fail(source, at, state.m.badUnit(text, countOf(state)));
  return Number(text);
}

/** `text` を目盛りの範囲として読む。`0-31` か `0` */
export function rangeAt(source: SourceLine, at: number, text: string, state: ParseState): { from: number; to: number } {
  const found = RANGE.exec(text);
  const from = Number(found?.[1]);
  const to = Number(found?.[2] ?? found?.[1]);
  if (!found || from > to || to >= countOf(state)) throw fail(source, at, state.m.badUnit(text, countOf(state)));
  return { from, to };
}

/** 目盛りの範囲の書き戻し。1 つの目盛りは番号だけを書く */
export const range = (from: number, to: number): string => (from === to ? `${from}` : `${from}-${to}`);

/** `scale <単位> <長さ> <数> [from: <最初の番号>]` の行 */
function readScale(source: SourceLine, state: ParseState): void {
  const { m } = state;
  const time = state.figure.time;
  state.beforeSteps(source);
  if (time.scale) throw fail(source, 0, m.timeTwice("scale"));
  const text = source.text;
  const found = SCALE.exec(text);
  const at = (k: number): number => found?.indices?.[k]?.[0] ?? 0;
  if (!found) throw fail(source, 0, m.scaleShape);
  const rest = skipSpaces(text, found[0].length);
  if (rest < text.length && text[rest] !== "[") throw fail(source, rest, m.scaleShape);
  const length = found[2] ?? "";
  if (!LENGTH.test(length)) throw fail(source, at(2), m.badLength);
  const count = found[3] ?? "";
  if (!COUNT.test(count)) throw fail(source, at(3), m.badCount("scale"));
  const first = rest < text.length ? readAttrs(source, rest, state.attrs.scale ?? [], m).get("from") : undefined;
  if (first && !NUMBER.test(first.value)) throw fail(source, first.at, m.scaleShape);
  time.scale = { unit: found[1] ?? "", length, count: Number(count), ...(first ? { from: Number(first.value) } : {}) };
}

/** `period <名前> <目盛りの数> [from: <最初の番号>]` の行 */
function readPeriod(source: SourceLine, state: ParseState): void {
  const { m } = state;
  const time = state.figure.time;
  state.beforeSteps(source);
  if (time.period) throw fail(source, 0, m.timeTwice("period"));
  const text = source.text;
  const found = PERIOD.exec(text);
  if (!found) throw fail(source, 0, m.periodShape);
  const rest = skipSpaces(text, found[0].length);
  if (rest < text.length && text[rest] !== "[") throw fail(source, rest, m.periodShape);
  const length = found[2] ?? "";
  if (!COUNT.test(length)) throw fail(source, found.indices?.[2]?.[0] ?? 0, m.badCount("period"));
  const first = rest < text.length ? readAttrs(source, rest, state.attrs.period ?? [], m).get("from") : undefined;
  if (first && !NUMBER.test(first.value)) throw fail(source, first.at, m.periodShape);
  time.period = { name: found[1] ?? "", length: Number(length), ...(first ? { from: Number(first.value) } : {}) };
}

/** `now -> <目盛り>` の行。針をその目盛りの終わりまで進める。前の針より後の目盛りに限る */
export function readNow(source: SourceLine, state: ParseState): { type: "now"; to: number } {
  const { m } = state;
  const time = state.figure.time;
  const found = NOW_LINE.exec(source.text);
  const unit = found?.[1];
  if (!found || unit === undefined) throw fail(source, 0, m.nowShape);
  const at = found.indices?.[1]?.[0] ?? 0;
  const to = unitAt(source, at, unit, state);
  if (to + 1 <= time.needle) throw fail(source, at, m.nowBack(unit, time.needle - 1));
  time.needle = to + 1;
  return { type: "now", to };
}

/** `span <範囲>: <字> [shape: box, color: <色>]` の行 */
function readSpan(source: SourceLine, state: ParseState): TimeSpanEvent {
  const { m } = state;
  const found = SPAN.exec(source.text);
  const span = found?.[1];
  if (!found || span === undefined) throw fail(source, 0, m.spanShape);
  const { from, to } = rangeAt(source, found.indices?.[1]?.[0] ?? 0, span, state);
  const named = readName(source, found[0].length, m);
  if (named.value === "") throw fail(source, 0, m.spanShape);
  const read = named.rest < source.text.length ? readAttrs(source, named.rest, state.attrs.span ?? [], m) : new Map<string, Attr>();
  const shape = read.get("shape");
  if (shape && !isOneOf(SPAN_SHAPES, shape.value)) throw fail(source, shape.at, m.badShape);
  const color = read.get("color");
  if (color && !isOneOf(COLORS, color.value)) throw fail(source, color.at, m.badColor);
  return { type: "span", from, to, text: named.value, ...(shape ? { shape: "box" as const } : {}), ...(color ? { color: color.value as Color } : {}) };
}

export const reading: BlockReading<ScaleMessages> = {
  // 針を進める行 (`now -> <目盛り>`) は線と同じ形なので、行の頭の語より先に読む
  take: (source, state) => {
    state.inStep(source).events.push(readNow(source, state));
    return true;
  },
  reserved: (source, id, at, state) => {
    if (id === NOW) throw fail(source, at, state.m.nowReserved(id));
  },
  // 目盛りが無い図と、印の列も作業 (#3562) も無い図は誤り。目盛りの数が決まってから、宣言の行の目盛りを確かめる
  settle: (state, head) => {
    const { m } = state;
    const time = state.figure.time;
    time.settled = true;
    if (!time.scale) throw fail(head, 0, m.noScale);
    if (time.rows.length === 0 && time.tasks.length === 0) throw fail(head, 0, m.noRows);
    for (const check of time.pending) check();
  },
  read: {
    scale: readScale,
    period: readPeriod,
    span: (source, state) => {
      const step = state.inStep(source);
      step.events.push(readSpan(source, state));
    },
  },
  print: {
    // 目盛りと区切りの行は、図の種類の行の直ぐ後ろに 1 つの塊で書く
    lead: (diagram) => {
      const time = diagram.time;
      if (!time) return [];
      return [
        [
          `scale ${time.scale.unit} ${time.scale.length} ${time.scale.count}${attrs([["from", num(time.scale.from)]])}`,
          ...(time.period ? [`period ${time.period.name} ${time.period.length}${attrs([["from", num(time.period.from)]])}`] : []),
        ].join("\n"),
      ];
    },
    events: {
      now: (e) => `${NOW} -> ${e.to}`,
      span: (e) =>
        `span ${range(e.from, e.to)}: ${name(e.text)}${attrs([
          ["shape", e.shape],
          ["color", e.color],
        ])}`,
    },
  },
  messages: {
    ja: {
      timeTwice: (word) => `${word} は 1 つだけ宣言する`,
      noScale: "scale の行で目盛りを宣言する",
      scaleShape: "scale は scale <単位> <長さ> <数> [from: <番号>] の形で書く",
      periodShape: "period は period <名前> <目盛りの数> [from: <番号>] の形で書く",
      nowShape: "針を進める行は now -> <目盛り> の形で書く",
      spanShape: `span は span <目盛り>-<目盛り>: <字> [shape: ${list(SPAN_SHAPES)}, color: <色>] の形で書く`,
      badLength: `長さは数と単位 (${list(DURATION_UNITS)}) の組で書く (12s など)`,
      badCount: (word) => `${word} の目盛りの数は 1 以上の整数にする`,
      badUnit: (text, count) => `${text} は目盛りの位置にできない。0 から ${count - 1} の数か、その範囲 (0-3 など) を書く`,
      nowBack: (text, at) => `now -> ${text} は針を進めない。前の now (${at}) より後の目盛りを書く`,
      nowReserved: (name) => `${name} は時間軸の図で針を進める行の語で、名札に使えない`,
      badShape: `shape は ${list(SPAN_SHAPES)} だけ書ける。括弧は shape を書かない`,
    },
    en: {
      timeTwice: (word) => `Declare only one ${word}`,
      noScale: "Declare the scale with a scale line",
      scaleShape: "Write a scale as scale <unit> <length> <count> [from: <number>]",
      periodShape: "Write a period as period <name> <units> [from: <number>]",
      nowShape: "Write a needle line as now -> <unit>",
      spanShape: `Write a span as span <unit>-<unit>: <text> [shape: ${list(SPAN_SHAPES)}, color: <color>]`,
      badLength: `Write a length as a number and a unit (${list(DURATION_UNITS)}), such as 12s`,
      badCount: (word) => `The unit count of ${word} is a whole number of 1 or more`,
      badUnit: (text, count) => `${text} cannot be a unit. Write a number from 0 to ${count - 1}, or a range such as 0-3`,
      nowBack: (text, at) => `now -> ${text} does not move the needle forward. Write a unit after the previous now (${at})`,
      nowReserved: (name) => `${name} starts the needle line of a time diagram and cannot be an id`,
      badShape: `shape takes only ${list(SPAN_SHAPES)}. A bracket takes no shape`,
    },
  },
};
