/**
 * 2つの軸で置く図の課題のブロックの読み方 (#3622)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む。
 *
 * 2つの軸で置く図の `item <名札> as <名前>` と `line <区画>: <課題>, <課題>` の行を、行の形 (`take`) で読む。
 * 宣言していない区画と課題と、同じ行に 2 度書いた課題は、その名札を指して止める
 */
import { shown } from "../../print-kit";
import { fail, readDeclared } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import { type BlockReading, none, type ParseState } from "../block";
import { namesAt } from "../item/read";
import type { LineupOrder } from "../line/block";
import type { MatrixItem } from "./block";

/** `line <区画>:` の行の区画 */
const PLACE = /^line\s+([^\s:[]+)\s*:/du;

export interface MatrixItemMessages {
  /** `line` の行の形 */
  matrixLineShape: string;
  /** `line` の行に、宣言していない課題 `id` を書いた */
  matrixNoSuchItem: (id: string) => string;
  /** 同じ `line` の行に、同じ課題 `id` を 2 度書いた */
  matrixItemTwice: (id: string) => string;
}

/** `item <名札> as <名前>` の行。名前を書かない課題は名札を名前にする */
function readItem(source: SourceLine, state: ParseState): void {
  const { m } = state;
  state.beforeSteps(source);
  const declared = readDeclared(source, "item", [], m);
  state.claim(source, declared.id, declared.idAt);
  state.figure.matrix.items.push({ id: declared.id, name: declared.name ?? declared.id });
}

/** `line <区画>: <課題>, <課題>` の行。区画は宣言した箱で、課題は宣言した課題を 1 行に 1 度ずつ */
function readPlace(source: SourceLine, state: ParseState): LineupOrder {
  const { m } = state;
  const found = PLACE.exec(source.text);
  const area = found?.[1];
  if (!found || area === undefined) throw fail(source, 0, m.matrixLineShape);
  const box = state.boxAt(source, area, found.indices?.[1]?.[0] ?? 0);
  const items = namesAt(source, found[0].length, source.text.length, m.matrixLineShape, state);
  const seen = new Set<string>();
  for (const { value, at } of items) {
    if (!state.figure.matrix.items.some((item) => item.id === value)) throw fail(source, at, m.matrixNoSuchItem(value));
    if (seen.has(value)) throw fail(source, at, m.matrixItemTwice(value));
    seen.add(value);
  }
  return { type: "line", box, items: items.map((item) => item.value) };
}

/** 課題の宣言の行。名前が名札と同じ課題は `as` を書かない */
const itemLine = (item: MatrixItem): string => `item ${item.id}${shown(item.id, item.name)}`;

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
    events: { line: (e) => `line ${"part" in e ? e.part : e.box}: ${e.items.join(", ")}` },
  },
  messages: {
    ja: {
      matrixLineShape: "2つの軸で置く図の line は段の中に line <区画>: <課題>, <課題> の形で書く",
      matrixNoSuchItem: (id) => `${id} という課題は宣言していない。最初の step より前に item ${id} の行で宣言する`,
      matrixItemTwice: (id) => `${id} はこの行に 2 度書いている。1 つの行に同じ課題は 1 度だけ書く`,
    },
    en: {
      matrixLineShape: "Write a two-axis matrix line inside a step as line <area>: <task>, <task>",
      matrixNoSuchItem: (id) => `No task named ${id} is declared. Declare it with an item ${id} line before the first step`,
      matrixItemTwice: (id) => `${id} is written twice on this line. Write each task once per line`,
    },
  },
};
