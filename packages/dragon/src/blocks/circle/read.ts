/**
 * 集まりの円のブロックの読み方 (#3620)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む。
 *
 * 集合の重なりの図の `item <名札> as <名前> [color: <色>]` の行と、段の中の `set` の行を、行の形 (`take`) で読む。
 * `set` の行は `&` で繋いだ名札の数で、名札が 1 つなら集まりの数、2 つ以上なら重なりの数、`none` だけならどれにも入らない数になる。
 * 重なりの数が、その重なりの集まりか、その重なりを含む組の数より大きくなった行は、その行の数を指して止める。
 * 集まりの数は 2 つか 3 つで、4 つ目の集まりの行か、読み終えた時 (`finish`) に頭の行を指して止める。
 * 読み終えた時は段ごとにそれぞれだけの区画の数を出し、0 より小さくなる区画があれば、その区画の数を決めた最後の行を指して止める。
 * 集合の重なりの図に書ける行は集まりと数と段の行だけで、ほかの行の頭の語 (`checkHead`) と線の行は誤りで止める。
 *
 * 図の種類の行の `[shape: dots]` (#3635) は区画ごとの数を点の数で数える見た目で、`shape` にはほかの値を書けない。
 * 1 点の件数の `[unit: <数>]` は点で数える見た目だけに書け、0 より大きい数かを最初の段を始める時 (`settle`) に確かめる。
 * 読み終えた時は段ごとの全体 (区画のそれぞれだけの数とどれにも入らない数の和) を数え、点の数が上限を超える段があれば頭の行を指して止める
 */
import { attrs, shown } from "../../print-kit";
import { fail, isOneOf, readDeclared } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import { type BlockReading, none, type ParseState } from "../block";
import { VENN_SHAPES } from "../chart-shape/block";
import { isUnit, tooManyDots, unitOf } from "../../dot-count";
import { DOTS_TEXT } from "../chart-shape/dots";
import { type Color, COLORS } from "../color/block";
import type { VennSet } from "./block";
import { NONE, VENN_SETS } from "./limits";
import { exclusiveOf, provisionalOf, regionKey, regionName, regionsOf } from "./regions";

/** 集合の重なりの図の `item` の行に書ける属性の鍵 */
const VENN_ITEM_ATTRS: readonly string[] = ["color"];

/** 集合の重なりの図に書ける行の頭の語。集まりと数の行と、段の行 */
const VENN_LINES: readonly string[] = ["item", "set", "step", "say", "code", "source"];

/** `set <名札> & <名札>: <数>` の行。名札の並びと数の位置を取る */
const SET = /^set\s+([^:]*?)\s*:\s*(.*)$/du;
/** 0 以上の数。小数も書ける */
const AMOUNT = /^[0-9]+(?:\.[0-9]+)?$/u;
/** 並びの中の名札 */
const NAME = /[^\s&]+/gu;
/** 名札どうしの間。`&` を 1 つ挟む */
const JOIN = /^\s*&\s*$/u;

export interface CircleMessages {
  /** 集まりの数が 2 つか 3 つでない */
  vennSetCount: (least: number, most: number, count: number) => string;
  /** 集まりの名札に `&` を書いた */
  vennAmpId: (id: string) => string;
  /** 集まりの名札に `none` を書いた */
  vennNoneId: string;
  /** 集合の重なりの図に書けない行を書いた */
  vennNoLine: (word: string) => string;
  /** 集合の重なりの図に線の行を書いた */
  vennNoEdge: string;
  /** `set` の行の形 */
  vennSetShape: string;
  /** 宣言していない集まりの数を書いた */
  vennUndeclared: (id: string) => string;
  /** 数が 0 以上の数でない */
  vennAmount: (value: string) => string;
  /** 重なりに同じ集まりを 2 度書いた */
  vennRepeat: (id: string) => string;
  /** `none` を `&` で繋いだ */
  vennNoneAlone: string;
  /** 重なり `overlap` の数 `value` が、`of` の数 `most` より大きい */
  vennOverlapTooLarge: (overlap: string, value: number, of: string, most: number) => string;
  /** 区画 `region` だけの数が 0 より小さい `value` になる */
  vennRegionNegative: (region: string, value: number) => string;
  /** `shape` に `dots` のほかの値を書いた (#3635) */
  vennBadShape: (shapes: readonly string[]) => string;
  /** 点で数える見た目でない集合の重なりの図に `unit` を書いた (#3635) */
  vennUnitNeedsDots: string;
  /** `unit` の値が 0 より大きい数でない (#3635) */
  vennUnitAmount: (value: string) => string;
  /** 点で数える見た目で、点が `count` 個になる段がある (#3635)。`unit` は使った 1 点の件数 */
  vennDotsTooMany: (count: number, unit: number) => string;
}

/** 集合の重なりの図の `item <名札> as <名前> [color: <色>]` の行。名前を書かない集まりは名札を名前にする */
function readSet(source: SourceLine, state: ParseState): void {
  const { m } = state;
  state.beforeSteps(source);
  const declared = readDeclared(source, "item", VENN_ITEM_ATTRS, m);
  const color = declared.attrs.get("color");
  if (color && !isOneOf(COLORS, color.value)) throw fail(source, color.at, m.badColor);
  if (declared.id.includes("&")) throw fail(source, declared.idAt, m.vennAmpId(declared.id));
  state.claim(source, declared.id, declared.idAt);
  const { sets } = state.figure.venn;
  if (sets.length >= VENN_SETS.most) throw fail(source, 0, m.vennSetCount(VENN_SETS.least, VENN_SETS.most, sets.length + 1));
  sets.push({ id: declared.id, name: declared.name ?? declared.id, ...(color ? { color: color.value as Color } : {}) });
}

/** 段の中の `set` の行。名札を `&` で繋いだ並びと数を読み、重なりの数が集まりの数を超えないかを今の数と比べる */
function readCount(source: SourceLine, state: ParseState): void {
  const { m } = state;
  const step = state.inStep(source);
  const found = SET.exec(source.text);
  const part = found?.[1] ?? "";
  const partAt = found?.indices?.[1]?.[0];
  const raw = (found?.[2] ?? "").trim();
  const rawAt = found?.indices?.[2]?.[0];
  if (!found || partAt === undefined || rawAt === undefined || raw === "") throw fail(source, 0, m.vennSetShape);
  const names: { id: string; at: number }[] = [];
  let end = 0;
  for (const hit of part.matchAll(NAME)) {
    const index = hit.index ?? 0;
    const gap = part.slice(end, index);
    if (names.length === 0 ? gap !== "" : !JOIN.test(gap)) throw fail(source, 0, m.vennSetShape);
    names.push({ id: hit[0], at: partAt + index });
    end = index + hit[0].length;
  }
  if (names.length === 0 || part.slice(end) !== "") throw fail(source, 0, m.vennSetShape);
  if (!AMOUNT.test(raw)) throw fail(source, rawAt, m.vennAmount(raw));
  const value = Number(raw);
  const venn = state.figure.venn;
  if (names.length === 1 && names[0]?.id === NONE) {
    step.events.push({ type: "none", value });
    venn.nones.push({ value, step: venn.step });
    return;
  }
  const order = venn.sets.map((set) => set.id);
  const ids: string[] = [];
  for (const { id, at } of names) {
    if (id === NONE) throw fail(source, at, m.vennNoneAlone);
    if (!order.includes(id)) throw fail(source, at, m.vennUndeclared(id));
    if (ids.includes(id)) throw fail(source, at, m.vennRepeat(id));
    ids.push(id);
  }
  const key = regionKey(order, ids);
  // 重なりの数は、その重なりの集まりと、それを含む組の数を超えない。決まった数どうしだけを比べ、超えた時は今の行の数を指す
  for (const other of regionsOf(order)) {
    const otherKey = other.join("&");
    const known = venn.now.get(otherKey);
    if (known === undefined || otherKey === key) continue;
    const below = other.every((id) => ids.includes(id));
    const above = ids.every((id) => other.includes(id));
    if (below && value > known) throw fail(source, rawAt, m.vennOverlapTooLarge(regionName(key), value, regionName(otherKey), known));
    if (above && known > value) throw fail(source, rawAt, m.vennOverlapTooLarge(regionName(otherKey), known, regionName(key), value));
  }
  venn.now.set(key, value);
  venn.writes.push({ key, value, source, at: rawAt, step: venn.step });
  step.events.push({ type: "count", sets: ids, value });
}

/** 段ごとにそれぞれだけの区画の数を出し、0 より小さくなる区画を、その区画の数を決めた最後の行を指して止める */
function checkRegions(state: ParseState): void {
  const { sets, writes, step: last } = state.figure.venn;
  const order = sets.map((set) => set.id);
  const written = new Set(writes.map((w) => w.key));
  const now = new Map<string, (typeof writes)[number]>();
  for (let s = 0; s <= last; s++) {
    for (const w of writes) if (w.step === s) now.set(w.key, w);
    for (const members of regionsOf(order)) {
      const value = exclusiveOf(order, members, (key) => now.get(key)?.value, (key) => written.has(key));
      if (value === undefined || value >= 0) continue;
      const deps = [...now.values()].filter((w) => w.key.split("&").every((id) => members.includes(id)) || members.every((id) => w.key.split("&").includes(id)));
      const latest = deps.reduce((a, b) => (b.source.line > a.source.line ? b : a));
      throw fail(latest.source, latest.at, state.m.vennRegionNegative(regionName(members.join("&")), value));
    }
  }
}

/** 点で数える見た目の、段ごとの全体の数。区画のそれぞれだけの数は今の段までに書いた数だけで出す (`provisionalOf`) */
function dotTotals(state: ParseState): number[] {
  const { sets, writes, nones, step: last } = state.figure.venn;
  const order = sets.map((set) => set.id);
  const now = new Map<string, number>();
  let rest = 0;
  const totals: number[] = [];
  for (let s = 0; s <= last; s++) {
    for (const w of writes) if (w.step === s) now.set(w.key, w.value);
    for (const n of nones) if (n.step === s) rest = n.value;
    totals.push([...provisionalOf(order, (key) => now.get(key)).values()].reduce((a, b) => a + b, rest));
  }
  return totals;
}

/** 集まりの宣言の行。名前が名札と同じ集まりは `as` を書かない */
const itemLine = (set: VennSet): string => `item ${set.id}${shown(set.id, set.name)}${attrs([["color", set.color]])}`;

export const reading: BlockReading<CircleMessages> = {
  take: (source, state, view) => {
    if (view.edgeFrom !== undefined) throw fail(source, 0, state.m.vennNoEdge);
    if (view.word === "item") readSet(source, state);
    else readCount(source, state);
    return true;
  },
  checkHead: (source, word, state) => {
    if (!VENN_LINES.includes(word)) throw fail(source, 0, state.m.vennNoLine(word));
  },
  reserved: (source, id, at, state) => {
    if (id === NONE) throw fail(source, at, state.m.vennNoneId);
  },
  settle: (state, head) => {
    const { shape, unit } = state.figure.venn;
    if (shape && !isOneOf(VENN_SHAPES, shape.value)) throw fail(head, shape.at, state.m.vennBadShape(VENN_SHAPES));
    if (unit && !shape) throw fail(head, unit.at, state.m.vennUnitNeedsDots);
    if (unit && !isUnit(unit.value)) throw fail(head, unit.at, state.m.vennUnitAmount(unit.value));
  },
  beginStep: (state) => {
    state.figure.venn.step += 1;
  },
  finish: (state, head) => {
    const { sets, shape, unit: given } = state.figure.venn;
    if (sets.length < VENN_SETS.least) throw fail(head, 0, state.m.vennSetCount(VENN_SETS.least, VENN_SETS.most, sets.length));
    checkRegions(state);
    if (!shape) return;
    const totals = dotTotals(state);
    const unit = unitOf(totals, given ? Number(given.value) : undefined);
    const count = tooManyDots(totals, unit);
    if (count !== undefined) throw fail(head, given?.at ?? 0, state.m.vennDotsTooMany(count, unit));
  },
  read: none("集合の重なりの図の item と set の行は、列の図のチップと中身の帯の語なので行の形 (take) で読む"),
  print: {
    // 図の種類の行の直ぐ後ろ、最初の step より前に、宣言した順に 1 行ずつ書く
    declare: (diagram) => (diagram.venn ? [diagram.venn.sets.map(itemLine).join("\n")] : []),
    events: {
      count: (e) => `set ${e.sets.join(" & ")}: ${e.value}`,
      none: (e) => `set ${NONE}: ${e.value}`,
    },
  },
  messages: {
    ja: {
      vennSetCount: (least, most, count) => `venn (集合の重なりの図) の集まり (item の行) は ${least} 行か ${most} 行書く。今は ${count} 行`,
      vennAmpId: (id) => `${id} は集まりの名札にできない。& は重なりを書く時に名札どうしを繋ぐ字なので、名札に入れない`,
      vennNoneId: "none は集まりの名札にできない。none はどれにも入らない数を set none: <数> で書く語",
      vennNoLine: (word) => `venn (集合の重なりの図) には ${word} の行を書けない。集まりは item の行で、数は段の中の set の行で書く`,
      vennNoEdge: "venn (集合の重なりの図) には線の行を書けない。数は段の中の set の行で書く",
      vennSetShape: "集合の重なりの図の数は段の中に set <名札>: <数>、重なりは set <名札> & <名札>: <数>、どれにも入らない数は set none: <数> の形で書く",
      vennUndeclared: (id) => `${id} という集まりは宣言していない。最初の step より前に item ${id} の行で宣言する`,
      vennAmount: (value) => `${value} は集合の重なりの図の数に書けない。数は 0 以上の数で、単位を付けずに書く`,
      vennRepeat: (id) => `重なりに ${id} を 2 度書いている。重なりは違う集まりを & で繋ぐ`,
      vennNoneAlone: "none は & で繋げない。どれにも入らない数は set none: <数> の 1 行で書く",
      vennOverlapTooLarge: (overlap, value, of, most) => `${overlap} の数 ${value} が ${of} の数 ${most} より大きい。重なりの数は、重なる集まりの数より大きくできない`,
      vennRegionNegative: (region, value) => `${region} だけの区画の数が ${value} になる。重なりの数を足すと、重なる集まりの数より大きい`,
      vennBadShape: DOTS_TEXT.ja.vennShape,
      vennUnitNeedsDots: DOTS_TEXT.ja.unitNeedsDots,
      vennUnitAmount: DOTS_TEXT.ja.unitAmount,
      vennDotsTooMany: DOTS_TEXT.ja.tooMany,
    },
    en: {
      vennSetCount: (least, most, count) => `A set overlap diagram (venn) takes ${least} or ${most} sets (item lines), not ${count}`,
      vennAmpId: (id) => `${id} cannot be a set id. & joins the ids of an overlap, so an id cannot contain it`,
      vennNoneId: "none cannot be a set id. none is the word for the count in no set, written as set none: <count>",
      vennNoLine: (word) => `A set overlap diagram takes no ${word} lines. Declare sets with item lines and write counts with set lines inside steps`,
      vennNoEdge: "A set overlap diagram takes no edge lines. Write counts with set lines inside steps",
      vennSetShape: "Write a count inside a step as set <id>: <count>, an overlap as set <id> & <id>: <count>, and the count in no set as set none: <count>",
      vennUndeclared: (id) => `No set named ${id} is declared. Declare it with an item ${id} line before the first step`,
      vennAmount: (value) => `${value} cannot be a count. Write a number of 0 or more, without a unit`,
      vennRepeat: (id) => `The overlap names ${id} twice. An overlap joins different sets with &`,
      vennNoneAlone: "none cannot be joined with &. Write the count in no set on its own line as set none: <count>",
      vennOverlapTooLarge: (overlap, value, of, most) => `The count ${value} of ${overlap} is larger than the count ${most} of ${of}. An overlap cannot be larger than the sets it overlaps`,
      vennRegionNegative: (region, value) => `The region only in ${region} comes to ${value}. The overlaps add up to more than the sets they overlap`,
      vennBadShape: DOTS_TEXT.en.vennShape,
      vennUnitNeedsDots: DOTS_TEXT.en.unitNeedsDots,
      vennUnitAmount: DOTS_TEXT.en.unitAmount,
      vennDotsTooMany: DOTS_TEXT.en.tooMany,
    },
  },
};
