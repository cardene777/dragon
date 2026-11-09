/**
 * `row` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import { attrs, shown } from "../../print-kit";
import { fail, isOneOf, readAttrs, readDeclared, skipSpaces } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import type { BlockReading, ParseState } from "../block";
import { type Color, COLORS } from "../color/block";
import { range, rangeAt, unitAt } from "../scale/read";
import type { TimeMarkEvent, TimeRow } from "./block";

/** 時間軸の図の段の中の `mark <列> <範囲>` の行 */
const MARK = /^mark\s+([^\s[]+)\s+([^\s[]+)/du;

export interface RowMessages {
  noRows: string;
  rowShape: string;
  markShape: string;
  undeclaredRow: (id: string) => string;
}

/** `row <名札> as <名前> [color: <色>, empty: <目盛り> <目盛り>]` の行。箱と同じ名札を持てる */
function readRow(source: SourceLine, state: ParseState): void {
  const { m } = state;
  const { rows, points, tasks, pending } = state.figure.time;
  state.beforeSteps(source);
  const declared = readDeclared(source, "row", state.attrs.row ?? [], m);
  state.notReserved(source, declared.id, declared.idAt);
  const taken = (list: readonly { id: string }[]): boolean => list.some((x) => x.id === declared.id);
  if (taken(rows) || taken(points) || taken(tasks)) throw fail(source, declared.idAt, m.duplicate(declared.id));
  const color = declared.attrs.get("color");
  if (color && !isOneOf(COLORS, color.value)) throw fail(source, color.at, m.badColor);
  const empty = declared.attrs.get("empty");
  const row: TimeRow = { id: declared.id, name: declared.name ?? declared.id, ...(color ? { color: color.value as Color } : {}) };
  rows.push(row);
  if (empty) {
    const words = empty.value.split(/\s+/u);
    // 目盛りの数が決まってから確かめる。欄の並びを宣言の形で残すため、先に空の並びを置く
    row.empty = [];
    pending.push(() => {
      row.empty = words.map((word) => unitAt(source, empty.at, word, state));
    });
  }
}

/** `mark <列> <範囲> [color: <色>]` の行 */
function readMark(source: SourceLine, state: ParseState): TimeMarkEvent {
  const { m } = state;
  const text = source.text;
  const found = MARK.exec(text);
  const row = found?.[1];
  const span = found?.[2];
  if (!found || row === undefined || span === undefined) throw fail(source, 0, m.markShape);
  if (!state.figure.time.rows.some((r) => r.id === row)) throw fail(source, found.indices?.[1]?.[0] ?? 0, m.undeclaredRow(row));
  const { from, to } = rangeAt(source, found.indices?.[2]?.[0] ?? 0, span, state);
  const rest = skipSpaces(text, found[0].length);
  if (rest >= text.length || text[rest] !== "[") throw fail(source, rest, m.markShape);
  const color = readAttrs(source, rest, state.attrs.mark ?? [], m).get("color");
  if (!color) throw fail(source, rest, m.markShape);
  if (!isOneOf(COLORS, color.value)) throw fail(source, color.at, m.badColor);
  return { type: "mark", row, from, to, color: color.value };
}

/** 印の列の行の書き戻し。作業を持つ図は、作業のブロックがこの行を作業の行と宣言した順に並べて書く (#3562) */
export const rowLine = (r: TimeRow): string =>
  `row ${r.id}${shown(r.id, r.name)}${attrs([
    ["color", r.color],
    ["empty", r.empty && r.empty.length > 0 ? r.empty.join(" ") : undefined],
  ])}`;

export const reading: BlockReading<RowMessages> = {
  read: {
    row: readRow,
    mark: (source, state) => {
      const step = state.inStep(source);
      step.events.push(readMark(source, state));
    },
  },
  print: {
    // 印の列の行は、目盛りの塊の後ろに 1 つの塊で書く。作業を持つ図は作業のブロックが作業の行と並べて書く (#3562)
    lead: (diagram) => {
      const time = diagram.time;
      if (!time || time.rows.length === 0 || (time.tasks ?? []).length > 0) return [];
      return [time.rows.map(rowLine).join("\n")];
    },
    events: {
      mark: (e) => `mark ${e.row} ${range(e.from, e.to)}${attrs([["color", e.color]])}`,
    },
  },
  messages: {
    ja: {
      noRows: "row の行で印の列を、task の行で作業を、どちらか 1 つ以上宣言する",
      rowShape: "row は row <名札> as <名前> [color: <色>, empty: <目盛り> <目盛り>] の形で書く",
      markShape: "mark は mark <列> <目盛り>-<目盛り> [color: <色>] の形で書く",
      undeclaredRow: (id) => `${id} という印の列は宣言していない`,
    },
    en: {
      noRows: "Declare at least one row with a row line or one task with a task line",
      rowShape: "Write a row as row <id> as <name> [color: <color>, empty: <unit> <unit>]",
      markShape: "Write a mark as mark <row> <unit>-<unit> [color: <color>]",
      undeclaredRow: (id) => `No row named ${id} is declared`,
    },
  },
};
