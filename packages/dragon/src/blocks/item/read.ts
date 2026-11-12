/**
 * `item` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import { attrs } from "../../print-kit";
import { type Attr, fail, ID, isOneOf, readAttrs, skipSpaces } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import type { BlockReading, ParseState } from "../block";
import { type Color, COLORS } from "../color/block";
import { LABEL_MOST, type LineupItem } from "./block";
import { checkShapeHead, LAYERS_MESSAGES, type LayersMessages, settleShape } from "./layers";

export interface ItemMessages extends LayersMessages {
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

export const reading: BlockReading<ItemMessages> = {
  // 列の図の見た目 (#3625、#3624) の値と、層の見た目と流れの線で描かない行は、見た目の決まり (`layers.ts`) が確かめる
  settle: settleShape,
  checkHead: checkShapeHead,
  finish: (state, head) => {
    if (state.figure.lineup.items.length === 0) throw fail(head, 0, state.m.noItems);
  },
  read: { item: readItem },
  print: {
    // 箱の宣言の後ろ、中身の帯より前に書く
    declare: (diagram) => (diagram.lineup && diagram.lineup.items.length > 0 ? [itemLines(diagram.lineup.items)] : []),
  },
  messages: {
    ja: {
      noItems: "item の行でチップを 1 つ以上宣言する",
      itemShape: "item は item <名札>, <名札> [color: <色>, label: <字>, note: <説明>] の形で書く",
      labelTooLong: (limit) => `label は ${limit} 字までにする`,
      ...LAYERS_MESSAGES.ja,
    },
    en: {
      noItems: "Declare at least one chip with an item line",
      itemShape: "Write an item as item <id>, <id> [color: <color>, label: <text>, note: <text>]",
      labelTooLong: (limit) => `A label is at most ${limit} characters`,
      ...LAYERS_MESSAGES.en,
    },
  },
};
