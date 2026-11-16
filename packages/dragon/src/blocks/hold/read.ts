/**
 * `hold` のブロックの読み方 (#3389)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む。
 *
 * `hold <持ち主>: <量> <トークン>, <量> <トークン>` は残高を 1 つずつに分けて持ち、`hold <持つ Contract>: <名前> <値>` は残高でない値を持つ。
 * 続きの最初の語が量として読めるか `#` で始まれば残高、そうでなければ値。量として読める名前と `[` を含む名前と `#` で始まる名前は `"` で囲む。
 * 書き戻す時は、続けて宣言した同じ持ち主の残高を 1 行に並べ、値は 1 行に 1 つずつ書く。
 *
 * 量の後ろか量の代わりに `#<番号>` を書くと NFT と ERC-1155 のトークンの番号になり (`hold alice: 5 #1 ITEMS`、`move art: #1 alice -> bob`)、
 * 数を省いた `#1` は 1 つを表す (#3722)。`mint` と `burn` は、原本では受け手か送り手を省いた `move` として持つ
 */
import { faultAt, inPipeStep, pipeLine, readValueName, textAt, valueName } from "../../pipe-read";
import { isAmount, quantityText } from "../../pipe-run";
import { fail, isOneOf, readAttrs, skipSpaces } from "../../read-kit";
import { type DiagramModel, PIPE_LAYOUTS, type PipeLayoutName } from "../../schema";
import type { SourceLine } from "../../tokenize";
import type { BlockReading, FigureDraft, ParseState } from "../block";
import { ETH } from "../definition-values";
import type { PipeHold, PipeHoldLink, PipeMove } from "./block";

/** `move` の行の続き。量か番号、数の後ろの番号、送り手、受け手と、後ろの属性 */
const MOVE = /^(\S+)(?:\s+(#\S*))?\s+([^\s[]+?)\s*->\s*([^\s[]+)\s*(\[.*)?$/du;
/** `mint` の行の続き。量か番号、数の後ろの番号、受け手と、後ろの属性 */
const MINT = /^(\S+?)(?:\s+(#\S*?))?\s*->\s*([^\s[]+)\s*(\[.*)?$/du;
/** `burn` の行の続き。量か番号、数の後ろの番号、持ち主と、後ろの属性 */
const BURN = /^(\S+)(?:\s+(#\S*))?\s+([^\s[]+)\s*(\[.*)?$/du;
/** トークンの番号。`#` の後の数字 */
const TOKEN_ID = /^#(\d+)$/u;

export interface HoldMessages {
  holdShape: string;
  moveShape: string;
  mintShape: string;
  burnShape: string;
  /** 量として読めない字を量に書いた */
  badAmount: (text: string) => string;
  /** `#` の後にトークンの番号が無い */
  noTokenId: string;
  /** 残高の単位に、関係者の名前でも ETH でもない字を書いた */
  noToken: (token: string) => string;
  /** 同じ持ち主の同じトークンか同じ名前の値を 2 度宣言した */
  holdTwice: (owner: string, what: string) => string;
  /** ETH を move で動かそうとした */
  moveEth: string;
  /** 置き方の行 (`layout`) を 2 行書いた (Tracelyth #165) */
  layoutTwice: string;
  /** 置き方の行に知らない形の名前 `shape` を書いたか、形を書かなかった (Tracelyth #165、#166、#168) */
  layoutBad: (shape: string) => string;
}

/** 読んだ量。番号を持つ時は NFT と ERC-1155 のトークンの番号 */
interface Quantity {
  amount: string;
  tokenId?: string;
}

/**
 * 量の字 (`first`) と、数の後ろの番号の字 (`second`) を読む。`at` と `secondAt` は行の中の位置。
 * `#<番号>` だけなら数は 1、`<数> #<番号>` なら数と番号、`<数>` だけなら数。番号の無い `#` は `#` を指して止める
 */
function readQuantity(source: SourceLine, state: ParseState, first: string, at: number, second?: string, secondAt = at): Quantity {
  const { m } = state;
  const idOf = (text: string, where: number): string => {
    const id = TOKEN_ID.exec(text)?.[1];
    if (id === undefined) throw fail(source, where, m.noTokenId);
    return id;
  };
  if (second !== undefined) {
    if (!isAmount(first)) throw fail(source, at, m.badAmount(first));
    return { amount: first, tokenId: idOf(second, secondAt) };
  }
  if (first.startsWith("#")) return { amount: "1", tokenId: idOf(first, at) };
  if (!isAmount(first)) throw fail(source, at, m.badAmount(first));
  return { amount: first };
}

/** 残高を書き戻す (`100 USDC`、`#1 ART`、`5 #1 ITEMS`) */
const balanceText = (hold: { amount: string; token: string; tokenId?: string }): string => `${quantityText(hold.amount, hold.tokenId)} ${hold.token}`;

/** 残高の並び (`<量> <トークン>, <量> <トークン>`) を 1 つずつ読む */
function readBalances(source: SourceLine, box: string, at: number, state: ParseState): PipeHold[] {
  const { m } = state;
  const text = source.text;
  const out: PipeHold[] = [];
  let i = at;
  for (;;) {
    const start = skipSpaces(text, i);
    const comma = text.indexOf(",", start);
    const end = comma < 0 ? text.length : comma;
    const words = text.slice(start, end).trim().split(/\s+/u);
    const [first = "", second, token = "", ...more] = words.length === 2 ? [words[0], undefined, words[1]] : words;
    if (words.length < 2 || more.length > 0 || (second !== undefined && !second.startsWith("#"))) throw fail(source, start, m.holdShape);
    const quantity = readQuantity(source, state, first, start, second, second === undefined ? start : textAt(source, second, start + first.length));
    const tokenAt = textAt(source, token, start + first.length + (second?.length ?? 0));
    if (token !== ETH && !state.figure.boxes.some((b) => b.name === token)) throw fail(source, tokenAt, m.noToken(token));
    const same = (h: PipeHold): boolean => "token" in h && h.token === token && h.tokenId === quantity.tokenId;
    const what = quantity.tokenId === undefined ? token : `#${quantity.tokenId} ${token}`;
    if (state.figure.pipe.holds.some((h) => h.box === box && same(h)) || out.some(same)) throw fail(source, tokenAt, m.holdTwice(box, what));
    out.push({ box, amount: quantity.amount, token, ...(quantity.tokenId !== undefined ? { tokenId: quantity.tokenId } : {}) });
    if (comma < 0) return out;
    i = comma + 1;
  }
}

/** `hold` の行。残高か値を始めの値に足す */
function readHold(source: SourceLine, state: ParseState): void {
  const { m } = state;
  state.beforeSteps(source);
  const { box, rest } = pipeLine(source, "hold", state, m.holdShape);
  const text = source.text;
  const first = /^\S+/u.exec(text.slice(rest))?.[0];
  if (first === undefined) throw fail(source, 0, m.holdShape);
  if (text[rest] !== '"' && (isAmount(first) || first.startsWith("#"))) {
    state.figure.pipe.holds.push(...readBalances(source, box, rest, state));
    return;
  }
  const named = readValueName(source, rest, state);
  const tail = named ? holdLinkTail(text, named.end) : undefined;
  const value = named ? text.slice(named.end, tail ?? text.length).trim() : "";
  if (!named || value === "") throw fail(source, 0, m.holdShape);
  if (state.figure.pipe.holds.some((h) => "name" in h && h.box === box && h.name === named.name)) throw fail(source, rest, m.holdTwice(box, named.name));
  const link = tail === undefined ? undefined : readHoldLink(source, tail, state);
  state.figure.pipe.holds.push({ box, name: named.name, value, ...(link ? { link } : {}) });
}

/**
 * 配管の図の置き方の行 (`layout <形>`、Tracelyth #165、#166、#168)。最初の段より前に 1 行だけ書く。
 * 置き方は描く処理の形の根の欄 `layout` に置く。根の欄の型 (`FigureDraft["root"]`) は図の種類のブロックが組む欄だけを名指すので、型を広げて足す (#3720)。
 * 配管の図の外に書いた行は、この読み方を読まない図でも断れるよう記法を読む処理が断る
 */
function readLayout(source: SourceLine, state: ParseState): void {
  const { m } = state;
  state.beforeSteps(source);
  const root: (FigureDraft["root"] & { layout?: PipeLayoutName }) | undefined = state.figure.root;
  if (root?.layout !== undefined) throw fail(source, 0, m.layoutTwice);
  const shape = source.text.slice("layout".length).trim();
  if (!isOneOf(PIPE_LAYOUTS, shape)) throw fail(source, 0, m.layoutBad(shape));
  state.figure.root = { ...root, layout: shape } as FigureDraft["root"];
}

/** 値の持ち分の線の属性の鍵 (Tracelyth #107) */
const HOLD_LINK_KEYS = ["from", "to", "on", "unit"];
/** 値の後ろに置いた持ち分の線の属性 (`[from: a, to: b]` か `[on: a]`) の頭の位置。無ければ undefined */
function holdLinkTail(text: string, from: number): number | undefined {
  const found = /\s(\[\s*(?:from|to|on|unit)\s*:[^[\]]*\])$/u.exec(text.slice(from));
  return found ? from + found.index + 1 : undefined;
}
/** 持ち分の線の属性を読む。別の2人の `from` と `to` か、1人の `on` だけを通す */
function readHoldLink(source: SourceLine, at: number, state: ParseState): PipeHoldLink {
  const { m } = state;
  const attrs = readAttrs(source, at, HOLD_LINK_KEYS, m);
  const box = (key: string): string | undefined => {
    const a = attrs.get(key);
    return a ? state.boxAt(source, a.value, a.at) : undefined;
  };
  const from = box("from");
  const to = box("to");
  const on = box("on");
  const unit = attrs.get("unit")?.value;
  if (on !== undefined && from === undefined && to === undefined) return { on, ...(unit ? { unit } : {}) };
  if (on === undefined && from !== undefined && to !== undefined && from !== to) return { from, to, ...(unit ? { unit } : {}) };
  throw fail(source, at, m.holdShape);
}
/** 持ち分の線の属性を書き戻す字。線を持たない値は空 */
function holdLinkText(link: PipeHoldLink | undefined): string {
  if (!link) return "";
  const unit = link.unit ? `, unit: ${link.unit}` : "";
  return link.on !== undefined ? ` [on: ${link.on}${unit}]` : ` [from: ${link.from}, to: ${link.to}${unit}]`;
}

/** 量を移す行の書き方。頭の語と、続きの形と、続きの中の量と送り手と受け手と属性の捕獲群の番号 */
interface MoveForm {
  word: "move" | "mint" | "burn";
  pattern: RegExp;
  shape: (m: HoldMessages) => string;
  from?: number;
  to?: number;
  marks: number;
}

const FORMS: Record<MoveForm["word"], MoveForm> = {
  move: { word: "move", pattern: MOVE, shape: (m) => m.moveShape, from: 3, to: 4, marks: 5 },
  mint: { word: "mint", pattern: MINT, shape: (m) => m.mintShape, to: 3, marks: 4 },
  burn: { word: "burn", pattern: BURN, shape: (m) => m.burnShape, from: 3, marks: 4 },
};

/**
 * 量を移す行。`move` はトークンの Contract の管を通して送り手の残高から受け手へ移し、
 * `mint` は受け手の残高だけを増やし、`burn` は持ち主の残高だけを減らす (#3722)
 */
function readMove(source: SourceLine, state: ParseState, form: MoveForm): PipeMove {
  const { m } = state;
  const shape = form.shape(m);
  const { run } = inPipeStep(source, state);
  const head = new RegExp(`^${form.word}\\s+([^\\s:[]+)`, "du").exec(source.text);
  if (head?.[1] === ETH) throw fail(source, head.indices?.[1]?.[0] ?? 0, m.moveEth);
  const { box, at, rest } = pipeLine(source, form.word, state, shape);
  const found = form.pattern.exec(source.text.slice(rest));
  if (!found) throw fail(source, 0, shape);
  const spot = (k: number): number => rest + (found.indices?.[k]?.[0] ?? 0);
  const marks = found[form.marks];
  if (marks !== undefined) readAttrs(source, spot(form.marks), [], m);
  const quantity = readQuantity(source, state, found[1] ?? "", spot(1), found[2], spot(2));
  const end = (k: number | undefined): string | undefined => (k === undefined ? undefined : state.boxAt(source, found[k] ?? "", spot(k)));
  const from = end(form.from);
  const to = end(form.to);
  const event: PipeMove = {
    type: "move",
    box,
    amount: quantity.amount,
    ...(from !== undefined ? { from } : {}),
    ...(to !== undefined ? { to } : {}),
    ...(quantity.tokenId !== undefined ? { tokenId: quantity.tokenId } : {}),
  };
  const fault = run.move(event);
  if (fault) {
    const owner = fault.fault === "noTank" && form.to !== undefined && fault.owner === to ? spot(form.to) : spot(form.from ?? form.to ?? 1);
    throw faultAt(source, fault, state, { notToken: at, short: spot(1), noTank: owner });
  }
  return event;
}

/** 始めの値の塊。続けて宣言した同じ持ち主の残高は 1 行に並べる */
function holdLines(diagram: DiagramModel): string[] {
  const holds = diagram.pipe?.holds ?? [];
  const lines: string[] = [];
  let last: { box: string; balances: string[] } | undefined;
  for (const hold of holds) {
    if ("token" in hold && last?.box === hold.box) {
      last.balances.push(balanceText(hold));
      continue;
    }
    if (last) lines.push(`hold ${last.box}: ${last.balances.join(", ")}`);
    last = undefined;
    if ("token" in hold) last = { box: hold.box, balances: [balanceText(hold)] };
    else lines.push(`hold ${hold.box}: ${valueName(hold.name)} ${hold.value}${holdLinkText(hold.link)}`);
  }
  if (last) lines.push(`hold ${last.box}: ${last.balances.join(", ")}`);
  return lines.length === 0 ? [] : [lines.join("\n")];
}

/** 量を移す行を書き戻す。送り手が無ければ `mint`、受け手が無ければ `burn` */
function moveLine(e: PipeMove): string {
  const quantity = quantityText(e.amount, e.tokenId);
  if (e.from === undefined) return `mint ${e.box}: ${quantity} -> ${e.to ?? ""}`;
  if (e.to === undefined) return `burn ${e.box}: ${quantity} ${e.from}`;
  return `move ${e.box}: ${quantity} ${e.from} -> ${e.to}`;
}

/** 量を移す行を読み、段の出来事に足す */
const moveReader =
  (form: MoveForm) =>
  (source: SourceLine, state: ParseState): void => {
    const event = readMove(source, state, form);
    state.inStep(source).events.push(event);
  };

export const reading: BlockReading<HoldMessages> = {
  read: {
    hold: readHold,
    layout: readLayout,
    move: moveReader(FORMS.move),
    mint: moveReader(FORMS.mint),
    burn: moveReader(FORMS.burn),
  },
  print: {
    figure: holdLines,
    events: {
      move: moveLine,
    },
  },
  messages: {
    ja: {
      holdShape: "hold は hold <持ち主>: <量> <トークン>, <量> <トークン> か hold <持つ Contract>: <名前> <値> の形で書く",
      moveShape: "move は move <トークンの Contract>: <量> <送り手> -> <受け手> の形で書く",
      mintShape: "mint は mint <トークンの Contract>: <量> -> <受け手> の形で書く",
      burnShape: "burn は burn <トークンの Contract>: <量> <持ち主> の形で書く",
      badAmount: (text) => `${text} は量として読めない。量は 0.05 のような数で書く`,
      noTokenId: "# の後にトークンの番号を書く。番号は 1 のような数で書く",
      noToken: (token) => `${token} という名前の関係者が無い。トークンは box <名札> as ${token} で宣言した名前か ETH で書く`,
      holdTwice: (owner, what) => `${owner} の ${what} は 2 度宣言している`,
      moveEth: "ETH は move で動かせない。呼び出しの行に [value: <量> ETH] を付けて送る",
      layoutTwice: "layout の行は1つの図に1行だけ書ける",
      layoutBad: (shape) =>
        shape === "" ? "layout の後に形の名前 (top、bottom、ledger、mesh、bus、auto のどれか) を書く" : `layout の形「${shape}」は書けない。top、bottom、ledger、mesh、bus、auto のどれかを書く`,
    },
    en: {
      holdShape: "Write hold as hold <owner>: <amount> <token>, <amount> <token> or hold <contract>: <name> <value>",
      moveShape: "Write move as move <token contract>: <amount> <sender> -> <receiver>",
      mintShape: "Write mint as mint <token contract>: <amount> -> <receiver>",
      burnShape: "Write burn as burn <token contract>: <amount> <holder>",
      badAmount: (text) => `${text} cannot be read as an amount. Write an amount as a number like 0.05`,
      noTokenId: "Write the token ID after #. Write the ID as a number like 1",
      noToken: (token) => `No party is named ${token}. Write a token as a name declared with box <id> as ${token}, or as ETH`,
      holdTwice: (owner, what) => `${what} of ${owner} is declared twice`,
      moveEth: "ETH cannot be moved with move. Send it with [value: <amount> ETH] on a call line",
      layoutTwice: "Write at most one layout line in a diagram",
      layoutBad: (shape) => (shape === "" ? "Write a shape name (top, bottom, ledger, mesh, bus or auto) after layout" : `The layout shape "${shape}" is unknown. Write top, bottom, ledger, mesh, bus or auto`),
    },
  },
};
