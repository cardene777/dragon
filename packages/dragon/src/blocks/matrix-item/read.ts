/**
 * 2つの軸で置く図の課題のブロックの読み方 (#3622)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む。
 *
 * 2つの軸で置く図の `item <名札> as <名前> [x: <横>, y: <縦>]` と `line <区画>: <課題>, <課題>` と `line: <課題>` の行を、行の形 (`take`) で読む。
 * 宣言していない区画と課題と、同じ行に 2 度書いた課題は、その名札を指して止める。
 * 点数 (#3637) は 0 から 10 の数を小数 1 桁まで書き、横と縦の 2 つを揃えて書く。区画を書かない行は点数を持つ課題だけを打ち、
 * 区画を書いた行に点数を持つ課題を書いた時は、点数から決まる区画 (`spot.ts`) と書いた区画が同じかを確かめる
 */
import { attrs, shown } from "../../print-kit";
import { fail, readDeclared } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import { type BlockReading, none, type ParseState } from "../block";
import { namesAt } from "../item/read";
import type { LineupOrder } from "../line/block";
import type { MatrixItem, MatrixPlot } from "./block";
import { SCORE_MAX, spotOf } from "./spot";

/** `line <区画>:` と `line:` の行の区画。区画を書かない行は区画が無い */
const PLACE = /^line(?:\s+([^\s:[]+))?\s*:/du;

/** 点数の字。0 から 10 の数を小数 1 桁まで書く */
const SCORE = /^(?:10(?:\.0)?|\d(?:\.\d)?)$/u;

/** 課題の行に書ける属性。横と縦の点数 */
const ITEM_ATTRS: readonly string[] = ["x", "y"];

export interface MatrixItemMessages {
  /** `line` の行の形 */
  matrixLineShape: string;
  /** `line` の行に、宣言していない課題 `id` を書いた */
  matrixNoSuchItem: (id: string) => string;
  /** 同じ `line` の行に、同じ課題 `id` を 2 度書いた */
  matrixItemTwice: (id: string) => string;
  /** 課題 `id` の点数 `value` が 0 から 10 の小数 1 桁までの数でない (#3637) */
  matrixScoreRange: (id: string, value: string) => string;
  /** 課題 `id` に横と縦の点数の片方だけを書いた */
  matrixScorePair: (id: string) => string;
  /** 区画を書かない `line:` の行に、点数を持たない課題 `id` を書いた */
  matrixNoScore: (id: string) => string;
  /** 区画 `area` を書いた行の課題 `id` の点数 `x` と `y` から決まる区画 `want` が、書いた区画と違う */
  matrixAreaScores: (area: string, id: string, x: number, y: number, want: string) => string;
}

/** 点数の字を数にする。形に合わない字は課題と字を名指して止める */
function scoreOf(source: SourceLine, id: string, value: string, at: number, state: ParseState): number {
  const score = Number(value);
  if (!SCORE.test(value) || score > SCORE_MAX) throw fail(source, at, state.m.matrixScoreRange(id, value));
  return score;
}

/** `item <名札> as <名前> [x: <横>, y: <縦>]` の行。名前を書かない課題は名札を名前にし、点数は横と縦を揃えて書く */
function readItem(source: SourceLine, state: ParseState): void {
  const { m } = state;
  state.beforeSteps(source);
  const declared = readDeclared(source, "item", ITEM_ATTRS, m);
  state.claim(source, declared.id, declared.idAt);
  const x = declared.attrs.get("x");
  const y = declared.attrs.get("y");
  if ((x === undefined) !== (y === undefined)) throw fail(source, (x ?? y)?.at ?? 0, m.matrixScorePair(declared.id));
  const scores = x && y ? { x: scoreOf(source, declared.id, x.value, x.at, state), y: scoreOf(source, declared.id, y.value, y.at, state) } : {};
  state.figure.matrix.items.push({ id: declared.id, name: declared.name ?? declared.id, ...scores });
}

/** `line <区画>: <課題>, <課題>` と `line: <課題>` の行。区画は宣言した箱で、課題は宣言した課題を 1 行に 1 度ずつ */
function readPlace(source: SourceLine, state: ParseState): LineupOrder | MatrixPlot {
  const { m } = state;
  const found = PLACE.exec(source.text);
  if (!found) throw fail(source, 0, m.matrixLineShape);
  const area = found[1];
  const areaAt = found.indices?.[1]?.[0] ?? 0;
  const box = area === undefined ? undefined : state.boxAt(source, area, areaAt);
  const items = namesAt(source, found[0].length, source.text.length, m.matrixLineShape, state);
  const { axes } = state.figure.matrix;
  const seen = new Set<string>();
  for (const { value, at } of items) {
    const item = state.figure.matrix.items.find((i) => i.id === value);
    if (!item) throw fail(source, at, m.matrixNoSuchItem(value));
    if (seen.has(value)) throw fail(source, at, m.matrixItemTwice(value));
    seen.add(value);
    const spot = spotOf(item, axes);
    if (spot === undefined) {
      if (box === undefined) throw fail(source, at, m.matrixNoScore(value));
      continue;
    }
    const want = state.figure.boxes[spot]?.id;
    if (box !== undefined && want !== undefined && want !== box) throw fail(source, areaAt, m.matrixAreaScores(box, value, item.x as number, item.y as number, want));
  }
  const ids = items.map((item) => item.value);
  return box === undefined ? { type: "line", items: ids } : { type: "line", box, items: ids };
}

/** 点数を書いた形。整数は小数点を付けない */
const score = (value: number | undefined): string | undefined => (value === undefined ? undefined : String(value));

/** 課題の宣言の行。名前が名札と同じ課題は `as` を書かない */
const itemLine = (item: MatrixItem): string =>
  `item ${item.id}${shown(item.id, item.name)}${attrs([
    ["x", score(item.x)],
    ["y", score(item.y)],
  ])}`;

export const reading: BlockReading<MatrixItemMessages> = {
  take: (source, state, view) => {
    if (view.word === "item") readItem(source, state);
    else state.inStep(source).events.push(readPlace(source, state));
    return true;
  },
  read: none("2つの軸で置く図の item と line の行は、列の図のチップと並びの語なので行の形 (take) で読む"),
  print: {
    // 区画の箱の後ろ、最初の step より前に、宣言した順に 1 行ずつ書く
    declare: (diagram) => (diagram.matrix && diagram.matrix.items.length > 0 ? [diagram.matrix.items.map(itemLine).join("\n")] : []),
    // 区画を書かない出来事は `line:` の形で書く
    events: { line: (e) => `line${"part" in e ? ` ${e.part}` : "box" in e ? ` ${e.box}` : ""}: ${e.items.join(", ")}` },
  },
  messages: {
    ja: {
      matrixLineShape: "2つの軸で置く図の line は段の中に line <区画>: <課題>, <課題> か line: <課題> の形で書く",
      matrixNoSuchItem: (id) => `${id} という課題は宣言していない。最初の step より前に item ${id} の行で宣言する`,
      matrixItemTwice: (id) => `${id} はこの行に 2 度書いている。1 つの行に同じ課題は 1 度だけ書く`,
      matrixScoreRange: (id, value) => `${id} の点数 ${value} は書けない。点数は 0 から 10 の数を小数 1 桁までで書く`,
      matrixScorePair: (id) => `${id} の点数は [x: <横>, y: <縦>] の形で 2 つ揃えて書く`,
      matrixNoScore: (id) => `${id} は点数を持たないので区画を決められない。item の行に [x: <横>, y: <縦>] を書くか、line <区画>: ${id} と区画を書く`,
      matrixAreaScores: (area, id, x, y, want) => `${id} の点数 (横 ${x}、縦 ${y}) は ${want} の区画に入り、書いた ${area} と違う。区画を書かずに line: ${id} と書くか、点数を直す`,
    },
    en: {
      matrixLineShape: "Write a two-axis matrix line inside a step as line <area>: <task>, <task> or line: <task>",
      matrixNoSuchItem: (id) => `No task named ${id} is declared. Declare it with an item ${id} line before the first step`,
      matrixItemTwice: (id) => `${id} is written twice on this line. Write each task once per line`,
      matrixScoreRange: (id, value) => `The score ${value} of ${id} cannot be used. Write a number from 0 to 10 with at most one decimal place`,
      matrixScorePair: (id) => `Write both scores of ${id} as [x: <across>, y: <up>]`,
      matrixNoScore: (id) => `${id} has no scores, so its area cannot be worked out. Add [x: <across>, y: <up>] to its item line, or name the area as line <area>: ${id}`,
      matrixAreaScores: (area, id, x, y, want) => `The scores of ${id} (across ${x}, up ${y}) put it in ${want}, not ${area}. Write line: ${id} without an area, or fix the scores`,
    },
  },
};
