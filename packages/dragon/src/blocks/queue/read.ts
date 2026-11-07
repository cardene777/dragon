/**
 * `queue` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import { attrs } from "../../print-kit";
import { type Attr, fail, ID, list, readDeclared } from "../../read-kit";
import type { TryPart } from "../../schema";
import type { SourceLine } from "../../tokenize";
import { faultOf, fieldAt, valueAt } from "../../try-read";
import { askFields } from "../../try-state";
import type { BlockReading, ParseState } from "../block";
import { namesAt } from "../item/read";

const PART_LINE = /^line\s+([^\s:[]+)\s*:/du;

export interface QueueMessages {
  queueShape: string;
  tryLineShape: string;
  /** チップ `id` が、もう部品 `part` に在る */
  chipElsewhere: (id: string, part: string) => string;
  /** 待ち行列 `part` が満杯 (`most` 枚) */
  queueFull: (part: string, most: number) => string;
  /** 機械の列 `part` のブロックに入れられるチップの上限 `most` を超えた */
  blockFull: (part: string, most: number) => string;
  /** 空の待ち行列 `part` から取り出す釦 `press` を押した */
  queueEmpty: (part: string, press: string) => string;
  /** 2 つ以上の待ち行列から集める釦 `press` を、待ち行列 `part` が `take` 件に満たない時に押した (#3453) */
  queueShort: (part: string, press: string, take: number) => string;
  /** 待ち行列 `part` が受け入れない名前 `name` のチップを送った (#3453) */
  queueRefuses: (part: string, name: string) => string;
  /** `accept` に名前 `name` を 2 度書いた (#3453) */
  acceptTwice: (name: string) => string;
  /** `accept` の名前 `name` が、最初の欄 `field` の選択肢 `choices` に無い (#3453) */
  acceptNotChoice: (name: string, field: string, choices: readonly string[]) => string;
}

/**
 * `accept` の値の、`,` で区切った名前と位置 (#3453)。2 つ以上の名前は `"` で囲んで書くので、属性は囲みの中を 1 つの値で渡す。
 * 名前は名札に使える字で、同じ名前を 2 度書かない
 */
function acceptNames(source: SourceLine, attr: Attr, state: ParseState): { value: string; at: number }[] {
  const { m } = state;
  const names: { value: string; at: number }[] = [];
  let from = valueAt(source, attr);
  for (const piece of attr.value.split(",")) {
    const value = piece.trim();
    const at = value === "" ? from : source.text.indexOf(value, from);
    if (value === "") throw fail(source, at, m.queueShape);
    if (!ID.test(value)) throw fail(source, at, m.badId(value));
    if (names.some((n) => n.value === value)) throw fail(source, at, m.acceptTwice(value));
    names.push({ value, at });
    from = at + value.length;
  }
  return names;
}

/**
 * `queue <名札> [order: <欄>, accept: <名前>]` の行。欄は入力の帯の欄 (最初の欄を除く)。
 * `accept` は入れてよいチップの名前で、2 つ以上は `"` で囲んで `,` で並べる (#3453)。
 * 最初の欄が選択肢を持つ時、名前はその選択肢のどれか。選択肢の行は後ろにも書けるので、全ての宣言を読んでから確かめる
 */
function readQueue(source: SourceLine, state: ParseState): void {
  const { m } = state;
  if (state.current()) throw fail(source, 0, m.tryPartInStep("queue"));
  const declared = readDeclared(source, "queue", state.attrs.queue ?? [], m);
  if (declared.name !== undefined) throw fail(source, 0, m.queueShape);
  state.declare(source, declared.id, declared.idAt);
  const field = declared.attrs.get("order");
  if (field) state.figure.try.pending.push(() => fieldAt(source, field.value, valueAt(source, field), state));
  const acceptAttr = declared.attrs.get("accept");
  const accept = acceptAttr ? acceptNames(source, acceptAttr, state) : undefined;
  if (accept)
    state.figure.try.pending.push(() => {
      const { parts } = state.figure.try;
      const first = askFields(parts)[0];
      const ask = parts.find((p): p is Extract<TryPart, { type: "ask" }> => p.type === "ask");
      const choices = first === undefined ? undefined : ask?.choices?.[first];
      if (first === undefined || !choices) return;
      const stray = accept.find((name) => !choices.includes(name.value));
      if (stray) throw fail(source, stray.at, m.acceptNotChoice(stray.value, first, choices));
    });
  state.figure.try.parts.push({
    type: "queue",
    id: declared.id,
    ...(field ? { order: field.value } : {}),
    ...(accept ? { accept: accept.map((name) => name.value) } : {}),
  });
}

/** 試す図の段の中の `line <待ち行列か機械の列>: <チップ>, <チップ>` の行 */
export function readTryLine(source: SourceLine, state: ParseState): void {
  const { m } = state;
  const step = state.inStep(source);
  const found = PART_LINE.exec(source.text);
  const part = found?.[1];
  if (!found || part === undefined) throw fail(source, 0, m.tryLineShape);
  const partAt = found.indices?.[1]?.[0] ?? 0;
  const declared = state.figure.try.parts.find((p) => p.id === part);
  if (!declared) throw fail(source, partAt, m.undeclaredPart(part));
  if (declared.type !== "queue" && declared.type !== "chain") throw fail(source, partAt, m.wrongPart(part, ["queue", "chain"]));
  const chips = namesAt(source, found[0].length, source.text.length, m.tryLineShape, state);
  const items = chips.map((chip) => chip.value);
  const fault = state.figure.try.run?.line(part, items).fault;
  if (fault) throw faultOf(source, fault, state, chips);
  step.events.push({ type: "line", part, items });
}

export const reading: BlockReading<QueueMessages> = {
  // 試す図の `line` の行は待ち行列か機械の列の中身を書くので、列の図のブロックでなく待ち行列のブロックが読む
  take: (source, state) => {
    readTryLine(source, state);
    return true;
  },
  read: { queue: readQueue },
  print: {
    events: {
      // 試す図の line は列 (box) でなく部品 (part) を名指す (#3337)。書き戻す処理は図の種類で使えるブロックから引くので、列の図の並びのブロックと分けて持つ (#3349)
      line: (e) => `line ${"part" in e ? e.part : e.box}: ${e.items.join(", ")}`,
    },
    part: (part) =>
      part.type === "queue"
        ? `queue ${part.id}${attrs([
            ["order", part.order],
            ["accept", part.accept?.join(", ")],
          ])}`
        : "",
  },
  messages: {
    ja: {
      queueShape: 'queue は queue <名札> [order: <欄>, accept: <名前>] の形で書き、accept の名前を 2 つ以上書く時は accept: "<名前>, <名前>" と囲む',
      tryLineShape: "line は line <待ち行列か機械の列>: <チップ>, <チップ> の形で書く",
      chipElsewhere: (id, part) => `${id} はもう ${part} に在る。チップは 1 か所にだけ置ける`,
      queueFull: (part, most) => `${part} は満杯で、チップは ${most} 枚までしか入らない`,
      blockFull: (part, most) => `${part} の 1 つのブロックに入れられるチップは ${most} 枚まで`,
      queueEmpty: (part, press) => `${part} が空なので、${press} を押しても取り出すチップが無い`,
      queueShort: (part, press, take) => `${part} のチップが ${take} 件に満たないので、${press} を押せない`,
      queueRefuses: (part, name) => `${part} は ${name} を受け入れないので、送れない`,
      acceptTwice: (name) => `${name} は accept にもう書いた`,
      acceptNotChoice: (name, field, choices) => `${name} は ${field} の choose の値に無いので、accept に書けない。書けるのは ${list(choices)}`,
    },
    en: {
      queueShape: 'Write a queue as queue <id> [order: <field>, accept: <name>], and wrap two or more names as accept: "<name>, <name>"',
      tryLineShape: "Write a line as line <queue or chain>: <chip>, <chip>",
      chipElsewhere: (id, part) => `${id} is already in ${part}. A chip sits in one place only`,
      queueFull: (part, most) => `${part} is full. It holds at most ${most} chips`,
      blockFull: (part, most) => `A block of ${part} holds at most ${most} chips`,
      queueEmpty: (part, press) => `${part} is empty, so pressing ${press} takes no chips`,
      queueShort: (part, press, take) => `${part} holds fewer than ${take} chips, so ${press} cannot be pressed`,
      queueRefuses: (part, name) => `${part} does not accept ${name}, so it cannot be sent`,
      acceptTwice: (name) => `${name} is already in accept`,
      acceptNotChoice: (name, field, choices) => `${name} is not a choice for ${field}, so accept cannot name it. Write ${list(choices)}`,
    },
  },
};
