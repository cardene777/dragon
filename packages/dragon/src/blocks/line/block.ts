/**
 * 列の並びのブロック (#3239、#3348)。
 *
 * 列の図の部品 (`only: lineup`)。段の中の `line <列>: <チップ>, <チップ>` の行で、列 (箱) のチップを書いた順に並べ直す。
 * ほかの列に居たチップはその席から滑って来て、どこにも居なかったチップは弾んで現れ、列から外したチップは消える。
 * 列は箱なので、付け方は箱に付く。1 列に並べられるチップは 12 枚までで、封をした列の並びは開けるまで書けない。
 * 試す図の段の中の `line <部品>: <チップ>` の行は部品の中身を書くので、待ち行列のブロックが読む (#3337)。出来事の形と書き戻しは列の図と同じ `line` なので、このブロックが持つ。
 */
import { fail } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import type { Block, ParseState } from "../block";
import { namesAt } from "../item/block";

/** 1 列に並べられるチップの上限。図の幅はこの枚数の列の幅で決まる */
export const LANE_MOST = 12;

/** 列の図 (#3239) の、列 `box` の並びを `items` に書き換える出来事。前の段との差分を描く部品が滑る動きに変える */
export interface LineupOrder {
  type: "line";
  box: string;
  items: string[];
}

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
  lineOnSealed: (lane: string) => string;
}

/** 列の図の `line <列>: <チップ>, <チップ>` の行。チップは宣言したチップで、列に 1 枚ずつ、上限まで。封をした列には書けない */
function readOrder(source: SourceLine, state: ParseState): LineupOrder {
  const { m } = state;
  const { items, sealed } = state.figure.lineup;
  const found = ORDER.exec(source.text);
  const lane = found?.[1];
  if (!found || lane === undefined) throw fail(source, 0, m.lineShape);
  const at = found.indices?.[1]?.[0] ?? 0;
  const box = state.boxAt(source, lane, at);
  if (sealed.has(box)) throw fail(source, at, m.lineOnSealed(box));
  const chips = namesAt(source, found[0].length, source.text.length, m.lineShape, state);
  const seen = new Set<string>();
  chips.forEach(({ value, at: chipAt }, k) => {
    if (!items.some((item) => item.id === value)) throw fail(source, chipAt, m.noSuchItem(value));
    if (seen.has(value)) throw fail(source, chipAt, m.itemTwice(value));
    if (k >= LANE_MOST) throw fail(source, chipAt, m.laneFull(box, LANE_MOST));
    seen.add(value);
  });
  return { type: "line", box, items: chips.map((chip) => chip.value) };
}

export const block: Block<LineMessages> = {
  name: "line",
  rank: 100,
  attach: { how: "attach-to-box", only: "lineup" },
  words: { heads: ["line"] },
  read: {
    line: (source, state) => {
      const step = state.inStep(source);
      step.events.push(readOrder(source, state));
    },
  },
  print: {
    events: {
      // 試す図の line は列 (box) でなく部品 (part) を名指す (#3337)
      line: (e) => `line ${"part" in e ? e.part : e.box}: ${e.items.join(", ")}`,
    },
  },
  messages: {
    ja: {
      lineShape: "line は line <列>: <チップ>, <チップ> の形で書く",
      noSuchItem: (id) => `${id} というチップは宣言していない`,
      itemTwice: (id) => `${id} はこの行に 2 度書いている。同じ列に同じチップは 1 枚だけ`,
      laneFull: (lane, limit) => `${lane} の列に並べられるチップは ${limit} 枚まで`,
      lineOnSealed: (lane) => `${lane} の列は封をしているので並びを書けない。先に open で開ける`,
    },
    en: {
      lineShape: "Write a line as line <lane>: <chip>, <chip>",
      noSuchItem: (id) => `The chip ${id} is not declared`,
      itemTwice: (id) => `${id} is written twice on this line. A lane holds one of each chip`,
      laneFull: (lane, limit) => `The lane ${lane} holds at most ${limit} chips`,
      lineOnSealed: (lane) => `The lane ${lane} is sealed, so its order cannot be written. Open it first`,
    },
  },
};
