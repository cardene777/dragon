/**
 * `side` のブロックの読み方 (#3429)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import { fail } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import type { BlockReading, ParseState } from "../block";
import { namesAt } from "../item/read";

const SIDE = /^side(?=\s|$)/u;
/** 同じ行に置ける部品の種類 (記録の列は #3506)。入力の帯と釦は頁の部品が描き、図の上に置き場所を持たない */
const PLACED = ["route", "queue", "chain", "log"] as const;

export interface SideMessages {
  sideShape: string;
  /** 部品が 2 つ未満の `side` の行 */
  sideFew: string;
  /** 部品 `id` を、もう別の `side` の行か同じ行に書いた */
  sideTwice: (id: string) => string;
}

/** `side <部品>, <部品>` の行。部品は全ての宣言を読んでから確かめる */
function readSide(source: SourceLine, state: ParseState): void {
  const { m } = state;
  if (state.current()) throw fail(source, 0, m.tryPartInStep("side"));
  const head = SIDE.exec(source.text);
  if (!head) throw fail(source, 0, m.sideShape);
  const names = namesAt(source, head[0].length, source.text.length, m.sideShape, state);
  const { sides } = state.figure.try;
  const taken = new Set(sides.flat());
  for (const { value, at } of names) {
    if (taken.has(value)) throw fail(source, at, m.sideTwice(value));
    taken.add(value);
  }
  if (names.length < 2) throw fail(source, names[0]?.at ?? 0, m.sideFew);
  sides.push(names.map((n) => n.value));
  state.figure.try.pending.push(() => {
    for (const { value, at } of names) {
      const part = state.figure.try.parts.find((p) => p.id === value);
      if (!part) throw fail(source, at, m.undeclaredPart(value));
      if (!(PLACED as readonly string[]).includes(part.type)) throw fail(source, at, m.wrongPart(value, PLACED));
    }
  });
}

export const reading: BlockReading<SideMessages> = {
  read: { side: readSide },
  print: {
    // 部品の行の直ぐ後ろ、チップの行より前に、書いた順に書く
    lead: (diagram) => (diagram.try?.sides ?? []).map((row) => `side ${row.join(", ")}`),
  },
  messages: {
    ja: {
      sideShape: "side は side <部品>, <部品> の形で書く",
      sideFew: "side の行には同じ行に置く部品を , で区切って 2 つ以上書く",
      sideTwice: (id) => `${id} はもう side の行に書いた。部品は 1 つの行にだけ置ける`,
    },
    en: {
      sideShape: "Write side as side <part>, <part>",
      sideFew: "Write two or more parts on a side line, separated by ,",
      sideTwice: (id) => `${id} is already on a side line. A part sits on one row only`,
    },
  },
};
