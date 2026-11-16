/**
 * `hold` のブロックの読み方 (#3389)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む。
 *
 * `hold <持ち主>: <量> <トークン>, <量> <トークン>` は残高を 1 つずつに分けて持ち、`hold <持つ Contract>: <名前> <値>` は残高でない値を持つ。
 * 続きの最初の語が量として読めれば残高、そうでなければ値。量として読める名前と `[` を含む名前は `"` で囲む。
 * 書き戻す時は、続けて宣言した同じ持ち主の残高を 1 行に並べ、値は 1 行に 1 つずつ書く
 */
import { faultAt, inPipeStep, pipeLine, readValueName, textAt, valueName } from "../../pipe-read";
import { isAmount } from "../../pipe-run";
import { fail, readAttrs, skipSpaces } from "../../read-kit";
import type { DiagramModel } from "../../schema";
import type { SourceLine } from "../../tokenize";
import type { BlockReading, ParseState } from "../block";
import { ETH } from "../definition-values";
import type { PipeHold, PipeMove } from "./block";

/** `move` の行の続き。量、送り手、受け手と、後ろの属性 */
const MOVE = /^(\S+)\s+([^\s[]+?)\s*->\s*([^\s[]+)\s*(\[.*)?$/du;

export interface HoldMessages {
  holdShape: string;
  moveShape: string;
  /** 量として読めない字を量に書いた */
  badAmount: (text: string) => string;
  /** 残高の単位に、関係者の名前でも ETH でもない字を書いた */
  noToken: (token: string) => string;
  /** 同じ持ち主の同じトークンか同じ名前の値を 2 度宣言した */
  holdTwice: (owner: string, what: string) => string;
  /** ETH を move で動かそうとした */
  moveEth: string;
}

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
    const [amount = "", token, ...more] = text.slice(start, end).trim().split(/\s+/u);
    if (token === undefined || more.length > 0) throw fail(source, start, m.holdShape);
    if (!isAmount(amount)) throw fail(source, start, m.badAmount(amount));
    const tokenAt = textAt(source, token, start + amount.length);
    if (token !== ETH && !state.figure.boxes.some((b) => b.name === token)) throw fail(source, tokenAt, m.noToken(token));
    if (state.figure.pipe.holds.some((h) => "token" in h && h.box === box && h.token === token) || out.some((h) => "token" in h && h.token === token))
      throw fail(source, tokenAt, m.holdTwice(box, token));
    out.push({ box, amount, token });
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
  if (text[rest] !== '"' && isAmount(first)) {
    state.figure.pipe.holds.push(...readBalances(source, box, rest, state));
    return;
  }
  const named = readValueName(source, rest, state);
  const value = named ? text.slice(named.end).trim() : "";
  if (!named || value === "") throw fail(source, 0, m.holdShape);
  if (state.figure.pipe.holds.some((h) => "name" in h && h.box === box && h.name === named.name)) throw fail(source, rest, m.holdTwice(box, named.name));
  state.figure.pipe.holds.push({ box, name: named.name, value });
}

/** `move` の行。トークンの Contract の管を通して、送り手の残高から受け手へ移す */
function readMove(source: SourceLine, state: ParseState): PipeMove {
  const { m } = state;
  const { run } = inPipeStep(source, state);
  const head = /^move\s+([^\s:[]+)/du.exec(source.text);
  if (head?.[1] === ETH) throw fail(source, head.indices?.[1]?.[0] ?? 0, m.moveEth);
  const { box, at, rest } = pipeLine(source, "move", state, m.moveShape);
  const found = MOVE.exec(source.text.slice(rest));
  const [, amount = "", from = "", to = "", marks] = found ?? [];
  if (!found) throw fail(source, 0, m.moveShape);
  const spot = (k: number): number => rest + (found.indices?.[k]?.[0] ?? 0);
  if (marks !== undefined) readAttrs(source, spot(4), [], m);
  if (!isAmount(amount)) throw fail(source, spot(1), m.badAmount(amount));
  const event: PipeMove = { type: "move", box, amount, from: state.boxAt(source, from, spot(2)), to: state.boxAt(source, to, spot(3)) };
  const fault = run.move(event);
  if (fault) {
    const owner = fault.fault === "noTank" && fault.owner === to ? spot(3) : spot(2);
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
      last.balances.push(`${hold.amount} ${hold.token}`);
      continue;
    }
    if (last) lines.push(`hold ${last.box}: ${last.balances.join(", ")}`);
    last = undefined;
    if ("token" in hold) last = { box: hold.box, balances: [`${hold.amount} ${hold.token}`] };
    else lines.push(`hold ${hold.box}: ${valueName(hold.name)} ${hold.value}`);
  }
  if (last) lines.push(`hold ${last.box}: ${last.balances.join(", ")}`);
  return lines.length === 0 ? [] : [lines.join("\n")];
}

export const reading: BlockReading<HoldMessages> = {
  read: {
    hold: readHold,
    move: (source, state) => {
      const event = readMove(source, state);
      state.inStep(source).events.push(event);
    },
  },
  print: {
    figure: holdLines,
    events: {
      move: (e) => `move ${e.box}: ${e.amount} ${e.from} -> ${e.to}`,
    },
  },
  messages: {
    ja: {
      holdShape: "hold は hold <持ち主>: <量> <トークン>, <量> <トークン> か hold <持つ Contract>: <名前> <値> の形で書く",
      moveShape: "move は move <トークンの Contract>: <量> <送り手> -> <受け手> の形で書く",
      badAmount: (text) => `${text} は量として読めない。量は 0.05 のような数で書く`,
      noToken: (token) => `${token} という名前の関係者が無い。トークンは box <名札> as ${token} で宣言した名前か ETH で書く`,
      holdTwice: (owner, what) => `${owner} の ${what} は 2 度宣言している`,
      moveEth: "ETH は move で動かせない。呼び出しの行に [value: <量> ETH] を付けて送る",
    },
    en: {
      holdShape: "Write hold as hold <owner>: <amount> <token>, <amount> <token> or hold <contract>: <name> <value>",
      moveShape: "Write move as move <token contract>: <amount> <sender> -> <receiver>",
      badAmount: (text) => `${text} cannot be read as an amount. Write an amount as a number like 0.05`,
      noToken: (token) => `No party is named ${token}. Write a token as a name declared with box <id> as ${token}, or as ETH`,
      holdTwice: (owner, what) => `${what} of ${owner} is declared twice`,
      moveEth: "ETH cannot be moved with move. Send it with [value: <amount> ETH] on a call line",
    },
  },
};

