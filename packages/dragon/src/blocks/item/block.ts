/**
 * チップのブロック (#3239、#3348)。
 *
 * 列の図の部品 (`only: lineup`)。最初の `step` より前の `item <名札>, <名札> [color: <色>, label: <字>]` の行で、列に並べるチップを宣言する。
 * 並べた名札ごとに同じ色と字のチップを宣言する。色を付けたチップは色で塗り、`label` の字は 4 字まで載る。
 * `item` の行の `note` の鍵は凡例のブロックの語で、同じ行に書くのでこのブロックが一緒に読み書きする (#3351)。
 * 列の図にチップが 1 つも無い誤りは、全ての行を読んだ後に parser が確かめ、その文をこのブロックが持つ。
 * 試す図の `item` の行は入力の帯の欄の値を持つチップなので、入力の帯のブロックが読む (#3337)。列の図でも試す図でもない図に書いた `item` と `line` の行の誤りの文 (`lineupOrTryOnly`) はこのブロックが持つ。
 */
import { attrs } from "../../print-kit";
import { type Attr, fail, ID, isOneOf, readAttrs, skipSpaces } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import type { Block, ParseState } from "../block";
import { type Color, COLORS } from "../color/block";

/** チップの字の上限 */
export const LABEL_MOST = 4;

/** 列の図のチップ。`color` を書かないチップは薄い色で、`label` を書かないチップは名前を出す。`note` は凡例に出す説明 (#3351) */
export interface LineupItem {
  id: string;
  color?: Color;
  label?: string;
  note?: string;
}

export interface ItemMessages {
  /** 列の図だけの行 (`item`、`line`、`seal`、`open`、`pick`、`stamp`、`role`) を、別の種類の図に書いた (#3239) */
  lineupOnly: (word: string) => string;
  /** 列の図と試す図だけの行 (`item` と `line`) を、どちらでもない図に書いた (#3337) */
  lineupOrTryOnly: (word: string) => string;
  noItems: string;
  itemShape: string;
  /** チップの字が上限の字数を超えた */
  labelTooLong: (limit: number) => string;
}

/** `from` から `to` の前までの、`,` で区切った名札と、それぞれの位置。名札が空の時は `shape` の誤りで止める */
export function namesAt(source: SourceLine, from: number, to: number, shape: string, state: ParseState): { value: string; at: number }[] {
  const text = source.text;
  const names: { value: string; at: number }[] = [];
  for (let i = from; ; ) {
    const start = skipSpaces(text, i);
    const comma = text.indexOf(",", start);
    const end = comma < 0 || comma > to ? to : comma;
    const value = text.slice(start, end).trim();
    if (value === "") throw fail(source, start, shape);
    if (!ID.test(value)) throw fail(source, start, state.m.badId(value));
    names.push({ value, at: start });
    if (end >= to) return names;
    i = end + 1;
  }
}

/** 列の図の `item <名札>, <名札> [color: <色>, label: <字>, note: <説明>]` の行。並べた名札ごとに、同じ色と字のチップを宣言する */
function readItem(source: SourceLine, state: ParseState): void {
  const { m } = state;
  state.beforeSteps(source);
  const open = source.text.indexOf("[");
  const end = open < 0 ? source.text.length : open;
  const read = open < 0 ? new Map<string, Attr>() : readAttrs(source, open, state.attrs.item ?? [], m);
  const color = read.get("color");
  if (color && !isOneOf(COLORS, color.value)) throw fail(source, color.at, m.badColor);
  const label = read.get("label");
  if (label && [...label.value].length > LABEL_MOST) throw fail(source, label.at, m.labelTooLong(LABEL_MOST));
  const note = read.get("note")?.value;
  for (const { value, at } of namesAt(source, "item".length, end, m.itemShape, state)) {
    state.declare(source, value, at);
    state.figure.lineup.items.push({ id: value, ...(color ? { color: color.value as Color } : {}), ...(label ? { label: label.value } : {}), ...(note !== undefined ? { note } : {}) });
  }
}

/** 列の図のチップの宣言の行。色と説明が同じで字を持たないチップが続く所は 1 行に並べる */
function itemLines(items: readonly LineupItem[]): string {
  const rows: LineupItem[][] = [];
  for (const item of items) {
    const row = rows.at(-1);
    if (row && item.label === undefined && row[0]?.label === undefined && row[0]?.color === item.color && row[0]?.note === item.note) row.push(item);
    else rows.push([item]);
  }
  return rows
    .map(
      (row) =>
        `item ${row.map((item) => item.id).join(", ")}${attrs([
          ["color", row[0]?.color],
          ["label", row[0]?.label],
          ["note", row[0]?.note],
        ])}`,
    )
    .join("\n");
}

export const block: Block<ItemMessages> = {
  name: "item",
  rank: 99,
  attach: { how: "place", only: "lineup" },
  words: { heads: ["item"], attrs: { item: ["color", "label"] } },
  read: { item: readItem },
  print: {
    // 箱の宣言の後ろ、中身の帯より前に書く
    declare: (diagram) => (diagram.lineup && diagram.lineup.items.length > 0 ? [itemLines(diagram.lineup.items)] : []),
  },
  messages: {
    ja: {
      lineupOnly: (word) => `${word} の行は lineup (列の図) でだけ書ける`,
      lineupOrTryOnly: (word) => `${word} の行は lineup (列の図) と try (試す図) でだけ書ける`,
      noItems: "item の行でチップを 1 つ以上宣言する",
      itemShape: "item は item <名札>, <名札> [color: <色>, label: <字>, note: <説明>] の形で書く",
      labelTooLong: (limit) => `label は ${limit} 字までにする`,
    },
    en: {
      lineupOnly: (word) => `${word} lines can be written only in lineup diagrams`,
      lineupOrTryOnly: (word) => `${word} lines can be written only in lineup and try diagrams`,
      noItems: "Declare at least one chip with an item line",
      itemShape: "Write an item as item <id>, <id> [color: <color>, label: <text>, note: <text>]",
      labelTooLong: (limit) => `A label is at most ${limit} characters`,
    },
  },
};
