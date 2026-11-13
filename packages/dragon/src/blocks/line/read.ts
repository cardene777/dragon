/**
 * `line` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import { fail } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import type { BlockReading, ParseState } from "../block";
import { namesAt } from "../item/read";
import { LANE_MOST, type LineupOrder } from "./block";

/** 列の図の `line <列>:` の行の列 */
const ORDER = /^line\s+([^\s:[]+)\s*:/du;

export interface LineMessages {
  lineShape: string;
  /** `line` の行に、宣言していないチップを書いた */
  noSuchItem: (id: string) => string;
  /** 同じ `line` の行に、同じチップを 2 度書いた */
  itemTwice: (id: string) => string;
  /** `line` の行のチップが、1 列の上限を超えた */
  laneFull: (lane: string, limit: number) => string;
  /** `line` の行のチップが、箱の行の `limit` に書いた上限を超えた (#3624) */
  overLimit: (lane: string, limit: number) => string;
  lineOnSealed: (lane: string) => string;
}

/**
 * 列の図の `line <列>: <チップ>, <チップ>` の行。チップは宣言したチップで、列に 1 枚ずつ、上限まで。封をした列には書けない。
 * 上限は箱の行の `limit` (#3624) か、書かない箱は 1 列に並べられる札の数 (`LANE_MOST`)。
 * `:` の後ろに何も書かない `line <列>:` は列を空にする (#3624)
 */
function readOrder(source: SourceLine, state: ParseState): LineupOrder {
  const { m } = state;
  const { items, sealed } = state.figure.lineup;
  const found = ORDER.exec(source.text);
  const lane = found?.[1];
  if (!found || lane === undefined) throw fail(source, 0, m.lineShape);
  const at = found.indices?.[1]?.[0] ?? 0;
  const box = state.boxAt(source, lane, at);
  if (sealed.has(box)) throw fail(source, at, m.lineOnSealed(box));
  const limit = state.figure.boxes.find((b) => b.id === box)?.limit;
  const chips = source.text.slice(found[0].length).trim() === "" ? [] : namesAt(source, found[0].length, source.text.length, m.lineShape, state);
  const seen = new Set<string>();
  chips.forEach(({ value, at: chipAt }, k) => {
    if (!items.some((item) => item.id === value)) throw fail(source, chipAt, m.noSuchItem(value));
    if (seen.has(value)) throw fail(source, chipAt, m.itemTwice(value));
    if (limit !== undefined && k >= limit) throw fail(source, chipAt, m.overLimit(box, limit));
    if (k >= LANE_MOST) throw fail(source, chipAt, m.laneFull(box, LANE_MOST));
    seen.add(value);
  });
  return { type: "line", box, items: chips.map((chip) => chip.value) };
}

export const reading: BlockReading<LineMessages> = {
  read: {
    line: (source, state) => {
      const step = state.inStep(source);
      step.events.push(readOrder(source, state));
    },
  },
  print: {
    events: {
      // 試す図の line は待ち行列のブロックが書き戻す (#3349)。出来事の形は列と部品の 2 つを持つので、両方を読む
      // 列を空にする列の図の line (#3624) は `:` の後ろに何も書かない
      line: (e) => `line ${"part" in e ? e.part : "box" in e ? e.box : ""}:${e.items.length > 0 ? ` ${e.items.join(", ")}` : ""}`,
    },
  },
  messages: {
    ja: {
      lineShape: "line は line <列>: <チップ>, <チップ> の形で書く",
      noSuchItem: (id) => `${id} というチップは宣言していない`,
      itemTwice: (id) => `${id} はこの行に 2 度書いている。同じ列に同じチップは 1 枚だけ`,
      laneFull: (lane, limit) => `${lane} の列に並べられるチップは ${limit} 枚まで`,
      overLimit: (lane, limit) => `${lane} の列は limit: ${limit} なので、並べられるチップは ${limit} 枚まで。上限を超える分は別の列に並べる`,
      lineOnSealed: (lane) => `${lane} の列は封をしているので並びを書けない。先に open で開ける`,
    },
    en: {
      lineShape: "Write a line as line <lane>: <chip>, <chip>",
      noSuchItem: (id) => `The chip ${id} is not declared`,
      itemTwice: (id) => `${id} is written twice on this line. A lane holds one of each chip`,
      laneFull: (lane, limit) => `The lane ${lane} holds at most ${limit} chips`,
      overLimit: (lane, limit) => `The lane ${lane} has limit: ${limit}, so it holds at most ${limit === 1 ? "1 chip" : `${limit} chips`}. Put the rest in another lane`,
      lineOnSealed: (lane) => `The lane ${lane} is sealed, so its order cannot be written. Open it first`,
    },
  },
};
