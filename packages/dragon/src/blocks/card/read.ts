/**
 * 持ち主ごとのカードのブロックの読み方 (#3846)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む。
 *
 * カードの `item` の行と消す `delete` の行は、列の図と枝分かれの図の語なので行の形 (`take`) で読み、断る `refuse` の行は行の頭の語で読む。
 * カードの行は最初の `step` より前ならカードを置き、段の中なら新しい名札のカードを作るか、在るカードを動かす。段の中で作るカードは `as` を必ず書く。
 * 列は宣言した箱で、知らない列と、印の語を持たない列を `mark` に選んだカードは、その名札の所を指して止める。
 * 線の行は列からカードへの呼び出しで、受ける側にカードを書ける (`endAt`)。送る側のカードと受ける側の列と、運ぶ物と名前の側の属性は断る。
 * 持ち主ごとのカードの図に書ける行は、列とカードと段と呼び出しの行だけで、ほかの行の頭の語 (`checkHead`) は止める
 */
import { attrs, name, shown } from "../../print-kit";
import { AS, type Attr, fail, ID, readAttrs, readQuoted, skipSpaces } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import type { BlockReading, ParseState } from "../block";
import type { EdgeEvent } from "../edge/block";
import { amountOf } from "./amount";
import type { CardItem } from "./block";

/** カードの行に書ける属性の鍵。`mark` は印を出す列ごとに繰り返せる */
const CARD_ATTRS: readonly string[] = ["amount", "total", "mark"];
/** 繰り返せる属性の鍵 */
const MANY: readonly string[] = ["mark"];

/** 持ち主ごとのカードの図に書ける、行の頭の語で読む行。カードと消す行は行の形で先に読む */
const CARD_LINES: readonly string[] = ["box", "step", "say", "code", "source", "refuse"];

/** カードの行の、列を並べる前の語 */
const IN = "in";

/** `as <名前> in <列>` の、名前と列の間の `in`。名前の中の `in` を飛ばすよう、最後の `in` で分ける */
const NAMED = /^(.*\S)\s+in(?=\s)/su;

/** 段の中の `delete <カード>` の行 */
const DELETE = /^delete\s+([^\s[]+)\s*$/du;

/** 段の中の `refuse <カードか列>: <理由>` の行 */
const REFUSE = /^refuse\s+([^\s:]+)\s*:\s*(.*\S)\s*$/du;

export interface CardMessages {
  /** カードの行の形 */
  cardsItemShape: string;
  /** 段の中で在るカードを動かす行に、名前か属性を書いた */
  cardsMoveShape: (id: string) => string;
  /** 知らないカードを、段の中の行に書いた */
  cardsUnknown: (id: string) => string;
  /** 消す行の形 */
  cardsDeleteShape: string;
  /** 消したカードを、消した後の行に書いた */
  cardsGone: (id: string) => string;
  /** カードの行に同じ列を 2 度書いた */
  cardsColumnTwice: (id: string) => string;
  /** 量が数と単位の形でない */
  cardsAmount: (value: string) => string;
  /** `total` に `none` のほかの値を書いた */
  cardsTotal: string;
  /** 印の語を持たない列を `mark` に選んだ */
  cardsMarkWord: (id: string) => string;
  /** `mark` に同じ列を 2 度書いた */
  cardsMarkTwice: (id: string) => string;
  /** 断る行の形 */
  cardsRefuseShape: string;
  /** カードでも列でもない名札を断った */
  cardsRefuseTarget: (id: string) => string;
  /** 呼び出しの線をカードから出した */
  cardsCallFrom: (id: string) => string;
  /** 呼び出しの線を列へ引いた */
  cardsCallTo: (id: string) => string;
  /** 呼び出しの線に運ぶ物か名前の側を書いた */
  cardsEdgeAttr: string;
  /** 持ち主ごとのカードの図に書けない行を書いた */
  cardsNoLine: (word: string) => string;
}

/** 読んでいる持ち主ごとのカードの図のカード。最初のカードの行を読んだ時に作る */
function draftOf(state: ParseState): NonNullable<ParseState["figure"]["cards"]> {
  state.figure.cards ??= { items: [], live: new Set(), gone: new Set() };
  return state.figure.cards;
}

/** 宣言した列 (箱) の名札か */
const isColumn = (state: ParseState, id: string): boolean => state.figure.boxes.some((box) => box.id === id);

/** `text` の `at` に語 `word` が在り、後ろが空白か行の終わりか */
const wordAt = (text: string, at: number, word: string): boolean => text.startsWith(word, at) && /^(\s|$)/u.test(text.slice(at + word.length, at + word.length + 1));

/** `from` から `to` までの `,` で区切った列の名札。知らない列と 2 度書いた列は、その名札の所を指して止める */
function readColumns(source: SourceLine, from: number, to: number, state: ParseState): string[] {
  const { m } = state;
  const text = source.text;
  const columns: string[] = [];
  let at = from;
  for (const part of text.slice(from, to).split(",")) {
    const id = part.trim();
    const idAt = at + part.length - part.trimStart().length;
    at += part.length + 1;
    if (id === "") throw fail(source, idAt, m.cardsItemShape);
    if (!isColumn(state, id)) throw fail(source, idAt, m.undeclaredBox(id));
    if (columns.includes(id)) throw fail(source, idAt, m.cardsColumnTwice(id));
    columns.push(id);
  }
  return columns;
}

/** 属性の値の位置。鍵の後ろで値を探す */
const valueAt = (source: SourceLine, key: string, attr: Attr): number => source.text.indexOf(attr.value, attr.at + key.length);

/** カードの `mark` の列。知らない列と、印の語を持たない列と、2 度書いた列は、その列の名札の所を指して止める */
function readMarks(source: SourceLine, mark: Attr | undefined, state: ParseState): string[] {
  const { m } = state;
  const marks: string[] = [];
  for (const attr of mark ? [mark, ...(mark.more ?? [])] : []) {
    const at = valueAt(source, "mark", attr);
    const box = state.figure.boxes.find((b) => b.id === attr.value);
    if (!box) throw fail(source, at, m.undeclaredBox(attr.value));
    if (box.mark === undefined) throw fail(source, at, m.cardsMarkWord(attr.value));
    if (marks.includes(attr.value)) throw fail(source, at, m.cardsMarkTwice(attr.value));
    marks.push(attr.value);
  }
  return marks;
}

/**
 * `item <名札> [as <名前>] in <列>, <列> [<属性>]` の行。最初の `step` より前ならカードを置き、段の中なら作るか動かす。
 * 段の中の在る名札の行は動かす行で、名前と属性を書けない。段の中の知らない名札は、`as` を書いた時だけ作る
 */
function readItem(source: SourceLine, state: ParseState): void {
  const { m } = state;
  const text = source.text;
  const start = skipSpaces(text, "item".length);
  const id = /^[^\s[]+/u.exec(text.slice(start))?.[0];
  if (id === undefined) throw fail(source, 0, m.needsId("item"));
  if (!ID.test(id)) throw fail(source, start, m.badId(id));
  const draft = draftOf(state);
  const step = state.current();
  const rest = skipSpaces(text, start + id.length);
  let label: string | undefined;
  let from: number;
  if (wordAt(text, rest, AS)) {
    const nameAt = skipSpaces(text, rest + AS.length);
    if (text[nameAt] === '"') {
      const quoted = readQuoted(source, nameAt, m);
      const after = skipSpaces(text, quoted.end);
      if (!wordAt(text, after, IN)) throw fail(source, after, m.cardsItemShape);
      label = quoted.value;
      from = after + IN.length;
    } else {
      const open = text.indexOf("[", nameAt);
      const named = NAMED.exec(text.slice(nameAt, open < 0 ? text.length : open));
      if (!named) throw fail(source, nameAt, m.cardsItemShape);
      label = named[1] ?? "";
      from = nameAt + named[0].length;
    }
    if (label === "") throw fail(source, rest, m.emptyName(id));
  } else if (wordAt(text, rest, IN)) {
    from = rest + IN.length;
  } else throw fail(source, rest, m.cardsItemShape);
  const open = text.indexOf("[", from);
  const to = open < 0 ? text.length : open;
  const known = draft.live.has(id) || draft.gone.has(id);
  // 段の中で在るカードの行は、カードを書いた列へ動かす
  if (step && known) {
    if (draft.gone.has(id)) throw fail(source, start, m.cardsGone(id));
    if (label !== undefined || open >= 0) throw fail(source, start, m.cardsMoveShape(id));
    step.events.push({ type: "card-move", card: id, in: readColumns(source, from, to, state) });
    return;
  }
  if (step && label === undefined) throw fail(source, start, m.cardsUnknown(id));
  state.claim(source, id, start);
  const columns = readColumns(source, from, to, state);
  const read = open < 0 ? new Map<string, Attr>() : readAttrs(source, open, CARD_ATTRS, m, [], MANY);
  const amount = read.get("amount");
  if (amount && amountOf(amount.value) === undefined) throw fail(source, valueAt(source, "amount", amount), m.cardsAmount(amount.value));
  const total = read.get("total");
  if (total && total.value !== "none") throw fail(source, valueAt(source, "total", total), m.cardsTotal);
  const marks = readMarks(source, read.get("mark"), state);
  const card: CardItem = {
    id,
    name: label ?? id,
    in: columns,
    ...(amount ? { amount: amount.value } : {}),
    ...(total ? { total: "none" as const } : {}),
    ...(marks.length > 0 ? { mark: marks } : {}),
  };
  draft.live.add(id);
  if (step) step.events.push({ type: "card", ...card });
  else draft.items.push(card);
}

/** 段の中の `delete <カード>` の行。知らないカードと消したカードは止める */
function readDelete(source: SourceLine, state: ParseState): void {
  const { m } = state;
  const step = state.inStep(source);
  const found = DELETE.exec(source.text);
  const id = found?.[1];
  if (!found || id === undefined) throw fail(source, 0, m.cardsDeleteShape);
  const at = found.indices?.[1]?.[0] ?? 0;
  const draft = draftOf(state);
  if (draft.gone.has(id)) throw fail(source, at, m.cardsGone(id));
  if (!draft.live.has(id)) throw fail(source, at, m.cardsUnknown(id));
  draft.live.delete(id);
  draft.gone.add(id);
  step.events.push({ type: "card-delete", card: id });
}

/** 段の中の `refuse <カードか列>: <理由>` の行。カードでも列でもない名札と、消したカードは止める */
function readRefuse(source: SourceLine, state: ParseState): void {
  const { m } = state;
  const step = state.inStep(source);
  const found = REFUSE.exec(source.text);
  const id = found?.[1];
  const reason = found?.[2];
  if (!found || id === undefined || reason === undefined) throw fail(source, 0, m.cardsRefuseShape);
  const at = found.indices?.[1]?.[0] ?? 0;
  const draft = draftOf(state);
  if (draft.gone.has(id)) throw fail(source, at, m.cardsGone(id));
  if (!draft.live.has(id) && !isColumn(state, id)) throw fail(source, at, m.cardsRefuseTarget(id));
  step.events.push({ type: "refuse", target: id, reason });
}

/** カードの行。最初の段より前のカードは名前が名札と同じなら `as` を省き、段の中で作るカードは動かす行と分けるため `as` を必ず書く */
const itemLine = (card: CardItem, made: boolean): string =>
  `item ${card.id}${made ? ` as ${name(card.name)}` : shown(card.id, card.name)} in ${card.in.join(", ")}${attrs([
    ["amount", card.amount],
    ["total", card.total],
    ...(card.mark ?? []).map((id): [string, string] => ["mark", id]),
  ])}`;

export const reading: BlockReading<CardMessages> = {
  take: (source, state, view) => {
    if (view.word === "item") readItem(source, state);
    else readDelete(source, state);
    return true;
  },
  checkHead: (source, word, state) => {
    if (!CARD_LINES.includes(word)) throw fail(source, 0, state.m.cardsNoLine(word));
  },
  endAt: (source, id, at, side, state) => {
    const { m } = state;
    const draft = draftOf(state);
    const card = draft.live.has(id) || draft.gone.has(id);
    if (side === "from") {
      if (card) throw fail(source, at, m.cardsCallFrom(id));
      return undefined;
    }
    if (draft.gone.has(id)) throw fail(source, at, m.cardsGone(id));
    if (card) return id;
    if (isColumn(state, id)) throw fail(source, at, m.cardsCallTo(id));
    throw fail(source, at, m.cardsUnknown(id));
  },
  afterEdge: (edge, state, source) => {
    const e = edge as EdgeEvent;
    if (e.carry.kind !== "envelope" || e.labelSide !== undefined) throw fail(source, 0, state.m.cardsEdgeAttr);
  },
  finish: (state) => {
    // 最初の段より前のカードは、描く処理の形の根の `cards` に置く。原本 (版2) では `blocks.card` になる
    state.figure.root = { ...state.figure.root, cards: { items: draftOf(state).items } };
  },
  read: { refuse: readRefuse },
  print: {
    // 箱の宣言の後ろ、最初の step より前に、書いた順に 1 行ずつ書く
    declare: (diagram) => (diagram.cards && diagram.cards.items.length > 0 ? [diagram.cards.items.map((card) => itemLine(card, false)).join("\n")] : []),
    events: {
      card: (e) => itemLine(e, true),
      "card-move": (e) => `item ${e.card} in ${e.in.join(", ")}`,
      "card-delete": (e) => `delete ${e.card}`,
      refuse: (e) => `refuse ${e.target}: ${e.reason}`,
    },
  },
  messages: {
    ja: {
      cardsItemShape: "カードは item <名札> as <名前> in <列>, <列> [amount: <量>] の形で書く",
      cardsMoveShape: (id) => `${id} のカードは在るので、この行はカードを動かす行になる。動かす行は item ${id} in <列> の形で書き、as と属性を書かない`,
      cardsUnknown: (id) => `${id} というカードは無い。段の中で新しく作るカードは item ${id} as <名前> in <列> の形で書く`,
      cardsDeleteShape: "消す行は delete <カード> の形で書く",
      cardsGone: (id) => `${id} のカードは消したので、もう使えない`,
      cardsColumnTwice: (id) => `${id} の列を 2 度書いている`,
      cardsAmount: (value) => `${value} はカードの量に書けない。量は 1000 USDC のように数と単位で書く`,
      cardsTotal: "total には none だけを書ける。量をカードに出すが列の合計に足さないカードに書く",
      cardsMarkWord: (id) => `${id} の列は印の語を持たない。box ${id} の行に [mark: <印の語>] を書く`,
      cardsMarkTwice: (id) => `mark に ${id} を 2 度書いている`,
      cardsRefuseShape: "断る行は refuse <カードか列>: <理由> の形で書く",
      cardsRefuseTarget: (id) => `${id} はカードでも列でもない。refuse にはカードか列の名札を書く`,
      cardsCallFrom: (id) => `${id} はカードなので、呼び出しの線を出せない。線は <列> -> <カード> の形で列から出す`,
      cardsCallTo: (id) => `${id} は列なので、呼び出しの線の先にできない。線は <列> -> <カード> の形でカードへ引く`,
      cardsEdgeAttr: "cards (持ち主ごとのカードの図) の線には運ぶ物 (carry と tag) と名前の側 (side) を書けない",
      cardsNoLine: (word) => `cards (持ち主ごとのカードの図) には ${word} の行を書けない。列は box、カードは item、段の中は item と delete と refuse と <列> -> <カード> の線で書く`,
    },
    en: {
      cardsItemShape: "Write a card as item <id> as <name> in <column>, <column> [amount: <amount>]",
      cardsMoveShape: (id) => `Card ${id} already exists, so this line moves it. Write a move as item ${id} in <column> without as and attributes`,
      cardsUnknown: (id) => `No card named ${id} exists. Write a card made in a step as item ${id} as <name> in <column>`,
      cardsDeleteShape: "Write a deletion as delete <card>",
      cardsGone: (id) => `Card ${id} has been deleted and cannot be used any more`,
      cardsColumnTwice: (id) => `The column ${id} is written twice`,
      cardsAmount: (value) => `${value} cannot be a card amount. Write a number and a unit, like 1000 USDC`,
      cardsTotal: "total takes only none. Write it on a card whose amount is shown but not added to the column total",
      cardsMarkWord: (id) => `The column ${id} has no mark word. Write [mark: <word>] on the box ${id} line`,
      cardsMarkTwice: (id) => `mark names ${id} twice`,
      cardsRefuseShape: "Write a refusal as refuse <card or column>: <reason>",
      cardsRefuseTarget: (id) => `${id} is neither a card nor a column. refuse takes the id of a card or a column`,
      cardsCallFrom: (id) => `${id} is a card, so no call can start from it. Write a call as <column> -> <card>`,
      cardsCallTo: (id) => `${id} is a column, so a call cannot end at it. Write a call as <column> -> <card>`,
      cardsEdgeAttr: "Lines of an owner card diagram (cards) take no carried item (carry or tag) and no label side (side)",
      cardsNoLine: (word) => `An owner card diagram (cards) takes no ${word} lines. Write columns with box, cards with item, and steps with item, delete, refuse and <column> -> <card> lines`,
    },
  },
};
