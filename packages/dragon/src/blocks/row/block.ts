/**
 * 印の列のブロック (#3165、#3348)。
 *
 * 時間軸の図の部品 (`only: time`)。最初の `step` より前の `row <名札> as <名前> [color: <色>, empty: <目盛り> <目盛り>]` の行で、
 * 印の列を上から順に宣言する。目盛りごとに細い印が並び、針が過ぎた所から塗られる。`empty` に書いた目盛りは空きの印になる。
 * 段の中の `mark <列> <範囲> [color: <色>]` の行で、範囲の印の色を変える。
 * 印の列は箱と同じ名札を持てる (空いた目盛りの列でその箱を空きの枠にするため)。
 * 時間軸の図に印の列が 1 つも無い誤りは、最初の段を始める時に parser が確かめ、その文をこのブロックが持つ。
 */
import { attrs, shown } from "../../print-kit";
import { fail, isOneOf, readAttrs, readDeclared, skipSpaces } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import type { Block, ParseState } from "../block";
import { type Color, COLORS } from "../color/block";
import { range, rangeAt, unitAt } from "../scale/block";

/** 時間軸の図の印の列。目盛りごとに印を 1 つ置き、`empty` の目盛りは空きの印にする */
export interface TimeRow {
  id: string;
  name: string;
  color?: Color;
  empty?: number[];
}

/** 時間軸の図 (#3165) の、印の列 `row` の `from` から `to` の目盛りの印の色を変える出来事 */
export interface TimeMarkEvent {
  type: "mark";
  row: string;
  from: number;
  to: number;
  color: Color;
}

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
  const { rows, points, pending } = state.figure.time;
  state.beforeSteps(source);
  const declared = readDeclared(source, "row", state.attrs.row ?? [], m);
  state.notReserved(source, declared.id, declared.idAt);
  if (rows.some((row) => row.id === declared.id) || points.some((point) => point.id === declared.id)) throw fail(source, declared.idAt, m.duplicate(declared.id));
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

export const block: Block<RowMessages> = {
  name: "row",
  rank: 91,
  attach: { how: "place", only: "time" },
  // 行の頭の語の一覧では、`mark` は拡大の帯の `zoom` の後ろに並ぶ
  words: { heads: ["row", "mark"], headRanks: { mark: 95 }, attrs: { row: ["color", "empty"], mark: ["color"] } },
  read: {
    row: readRow,
    mark: (source, state) => {
      const step = state.inStep(source);
      step.events.push(readMark(source, state));
    },
  },
  print: {
    // 印の列の行は、目盛りの塊の後ろに 1 つの塊で書く
    lead: (diagram) => {
      const time = diagram.time;
      if (!time) return [];
      return [
        time.rows
          .map(
            (r) =>
              `row ${r.id}${shown(r.id, r.name)}${attrs([
                ["color", r.color],
                ["empty", r.empty && r.empty.length > 0 ? r.empty.join(" ") : undefined],
              ])}`,
          )
          .join("\n"),
      ];
    },
    events: {
      mark: (e) => `mark ${e.row} ${range(e.from, e.to)}${attrs([["color", e.color]])}`,
    },
  },
  messages: {
    ja: {
      noRows: "row の行で印の列を 1 つ以上宣言する",
      rowShape: "row は row <名札> as <名前> [color: <色>, empty: <目盛り> <目盛り>] の形で書く",
      markShape: "mark は mark <列> <目盛り>-<目盛り> [color: <色>] の形で書く",
      undeclaredRow: (id) => `${id} という印の列は宣言していない`,
    },
    en: {
      noRows: "Declare at least one row with a row line",
      rowShape: "Write a row as row <id> as <name> [color: <color>, empty: <unit> <unit>]",
      markShape: "Write a mark as mark <row> <unit>-<unit> [color: <color>]",
      undeclaredRow: (id) => `No row named ${id} is declared`,
    },
  },
};
