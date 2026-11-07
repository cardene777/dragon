/**
 * `route` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む。
 * 網の節の関門 (`check`、#3476) は網の道の節に置くので、網のブロックが読んで書き戻す。網のブロックは試す図なら必ず読むので、軽い入口でも関門を読める
 */
import { attrs, value } from "../../print-kit";
import { fail, ID, readAttrs, skipSpaces } from "../../read-kit";
import type { TryCheck, TryPart } from "../../schema";
import type { SourceLine } from "../../tokenize";
import { fieldAt, needed, refer, valueAt } from "../../try-read";
import { numberOf, shortestPath } from "../../try-state";
import type { BlockReading, ParseState } from "../block";
import { ranked } from "../block";
import { CHECK_OP, type CheckOp } from "../check/block";
import { BLOCKS } from "../index";
import { settleTry } from "../../try-read";

/** 試す図に書ける行の頭の語。試す図だけのブロック (`attach.only` が try) の語と、チップと並びの行と、段の行 (#3337) */
const TRY_LINES: readonly string[] = [
  ...ranked(BLOCKS).flatMap((block) => (block.attach.only === "try" ? (block.words.heads ?? []) : [])),
  ...["item", "line", "step", "say", "code", "source"],
];

const ROUTE = /^route\s+([^\s:[]+)\s*:/du;
/** 関門の行の頭と、関門を置く網の節 (#3476) */
const GATE = /^check\s+([^\s:[]+)\s*:/du;
/** 大小で比べる比べ方。数でない値には使えない */
const ORDERS: readonly CheckOp[] = [">=", "<=", ">", "<"];

export interface RouteMessages {
  routeShape: string;
  /** 網の `from` か `to` が網の節に無い */
  notInRoute: (node: string, route: string) => string;
  /** 網の `from` から `to` へ道が無い */
  noPath: (from: string, to: string) => string;
  /** 宣言だけの部品の行 (`route`、`queue`、`chain`) を段の中に書いた */
  tryPartInStep: (word: string) => string;
  /** 試す図に書けない行 (箱や区画や線など) を書いた */
  tryNoLine: (word: string) => string;
  tryNoEdge: string;
  /** 部品の行が 1 つも無い試す図 */
  noParts: string;
  /** 部品の行に要る属性 `key` が無い */
  needsAttr: (word: string, key: string) => string;
  undeclaredPart: (id: string) => string;
  /** 部品 `id` が、名指した所に要る種類 `want` (`route` など) の部品でない */
  wrongPart: (id: string, want: readonly string[]) => string;
  /** 関門の行の形 (#3476) */
  gateShape: string;
  /** 試す図の段の中に `check` の行を書いた (#3476) */
  gateInStep: string;
  /** 関門を置く網が無い。入力の帯が無いか、`via` を書いていない (#3476) */
  gateNoVia: string;
  /** 関門の節 `node` が、網 `route` の最短の道 `path` に無い (#3476) */
  gateOffPath: (node: string, route: string, path: readonly string[]) => string;
  /** 数でない値 `value` を大小で比べた (#3476) */
  gateOrder: (value: string) => string;
  /** 関門の `into` の記録の列 `log` が `all` を持つ (#3476) */
  gateLogAll: (log: string) => string;
}

/** `route <名札>: <節> - <節>, <節> - <節> [from: <節>, to: <節>]` の行。from と to は網の節で、from から to へ道が要る */
function readRoute(source: SourceLine, state: ParseState): void {
  const { m } = state;
  if (state.current()) throw fail(source, 0, m.tryPartInStep("route"));
  const text = source.text;
  const found = ROUTE.exec(text);
  const id = found?.[1];
  if (!found || id === undefined) throw fail(source, 0, m.routeShape);
  const idAt = found.indices?.[1]?.[0] ?? 0;
  if (!ID.test(id)) throw fail(source, idAt, m.badId(id));
  state.declare(source, id, idAt);
  const open = text.indexOf("[", found[0].length);
  const end = open < 0 ? text.length : open;
  const paths: string[][] = [];
  for (let i = found[0].length; i <= end; ) {
    const comma = text.indexOf(",", i);
    const stop = comma < 0 || comma > end ? end : comma;
    const start = skipSpaces(text, i);
    const nodes = text.slice(start, stop).trim().split(/\s+-\s+/u);
    if (nodes.length < 2 || nodes.some((node) => node === "")) throw fail(source, start, m.routeShape);
    for (const node of nodes) if (!ID.test(node)) throw fail(source, start, m.badId(node));
    paths.push(nodes);
    i = stop + 1;
  }
  if (open < 0) throw fail(source, text.length, m.needsAttr("route", "from"));
  const read = readAttrs(source, open, state.attrs.route ?? [], m);
  const from = needed(source, read, "route", "from", open, state);
  const to = needed(source, read, "route", "to", open, state);
  const known = new Set(paths.flat());
  for (const side of [from, to]) if (!known.has(side.value)) throw fail(source, valueAt(source, side), m.notInRoute(side.value, id));
  const route: TryPart = { type: "route", id, paths, from: from.value, to: to.value };
  if (shortestPath(route).length < 2) throw fail(source, valueAt(source, to), m.noPath(from.value, to.value));
  state.figure.try.parts.push(route);
}

/**
 * 最初の step より前の `check <節>: <欄> <比べ方> <値> [no: <エラーの名前>, retry, into: <記録の列>]` の行 (#3476)。
 * 節は入力の帯の網 (`via`) の最短の道の節、欄は入力の帯の欄 (最初の欄を除く)、`into` は `all` を持たない記録の列で、全ての宣言を読んでから確かめる。
 * 数でない値は `==` と `!=` でだけ比べる
 */
function readGate(source: SourceLine, state: ParseState): void {
  const { m } = state;
  const text = source.text;
  const found = GATE.exec(text);
  const node = found?.[1];
  const open = text.indexOf("[");
  const head = found?.[0].length ?? 0;
  const body = text.slice(head, open < head ? head : open);
  const op = CHECK_OP.exec(body);
  const field = op ? body.slice(0, op.index).trim() : "";
  const compared = op ? body.slice(op.index + op[0].length).trim() : "";
  if (node === undefined || !op || field === "" || compared === "") throw fail(source, 0, m.gateShape);
  const nodeAt = found?.indices?.[1]?.[0] ?? 0;
  const fieldPos = text.indexOf(field, head);
  if (!ID.test(node)) throw fail(source, nodeAt, m.badId(node));
  if (!ID.test(field)) throw fail(source, fieldPos, m.badId(field));
  const how = op[1] as CheckOp;
  if (numberOf(compared) === undefined && ORDERS.includes(how)) throw fail(source, text.indexOf(compared, head + op.index + op[0].length), m.gateOrder(compared));
  const read = readAttrs(source, open, ["no", "retry", "into"], m, ["retry"]);
  const no = needed(source, read, "check", "no", open, state);
  const into = needed(source, read, "check", "into", open, state);
  const retry = read.get("retry");
  if (retry?.value) throw fail(source, retry.at, m.gateShape);
  const { parts } = state.figure.try;
  state.figure.try.pending.push(() => {
    const ask = parts.find((p): p is Extract<TryPart, { type: "ask" }> => p.type === "ask");
    const route = parts.find((p): p is Extract<TryPart, { type: "route" }> => p.type === "route" && p.id === ask?.via);
    if (!route) throw fail(source, nodeAt, m.gateNoVia);
    if (!route.paths.some((path) => path.includes(node))) throw fail(source, nodeAt, m.notInRoute(node, route.id));
    const path = shortestPath(route);
    if (!path.includes(node)) throw fail(source, nodeAt, m.gateOffPath(node, route.id, path));
    fieldAt(source, field, fieldPos, state);
  });
  refer(source, into, ["log"], state);
  state.figure.try.pending.push(() => {
    const log = parts.find((p) => p.id === into.value);
    if (log?.type === "log" && log.all) throw fail(source, valueAt(source, into), m.gateLogAll(into.value));
  });
  state.figure.try.checks.push({ node, field, op: how, value: compared, no: no.value, ...(retry ? { retry: true } : {}), into: into.value });
}

/** 関門の行。`retry` は書いた関門だけ、エラーの名前と記録の列の間に書く (#3476) */
const gateLine = (c: TryCheck): string =>
  `check ${c.node}: ${c.field} ${c.op} ${c.value} [${[`no: ${value(c.no)}`, ...(c.retry ? ["retry"] : []), `into: ${c.into}`].join(", ")}]`;

export const reading: BlockReading<RouteMessages> = {
  // 試す図に線は書けない。`check` の行は、最初の step より前なら網の節の関門で、段の中では配管の図を名指して断る (#3476)
  take: (source, state, view) => {
    if (view.edgeFrom !== undefined) throw fail(source, 0, state.m.tryNoEdge);
    if (state.current()) throw fail(source, 0, state.m.gateInStep);
    readGate(source, state);
    return true;
  },
  // 試す図は部品の行と段の行だけを書ける
  checkHead: (source, word, state) => {
    if (!TRY_LINES.includes(word)) throw fail(source, 0, state.m.tryNoLine(word));
  },
  settle: (state) => settleTry(state),
  beginStep: (state) => state.figure.try.run?.beginStep(),
  finish: (state, head) => {
    if (state.figure.try.parts.length === 0) throw fail(head, 0, state.m.noParts);
  },
  read: { route: readRoute },
  print: {
    // 部品の行は、試す図の部品の塊に原本の並びのまま書く
    part: (part) =>
      part.type === "route"
        ? `route ${part.id}: ${part.paths.map((path) => path.join(" - ")).join(", ")}${attrs([
            ["from", part.from],
            ["to", part.to],
          ])}`
        : "",
    // 関門の行は部品の塊の次の塊に、書いた順のまま書く。網のブロックはチップの塊を書く入力の帯のブロックより前に並ぶ (#3476)
    lead: (diagram) => {
      const checks = diagram.try?.checks ?? [];
      return checks.length === 0 ? [] : [checks.map(gateLine).join("\n")];
    },
  },
  messages: {
    ja: {
      routeShape: "route は route <名札>: <節> - <節>, <節> - <節> [from: <節>, to: <節>] の形で書く",
      notInRoute: (node, route) => `${node} は ${route} の網の節でない`,
      noPath: (from, to) => `${from} から ${to} へ網の道が無い`,
      tryPartInStep: (word) => `${word} の行は部品の宣言なので、最初の step より前に書く`,
      tryNoLine: (word) => `try (試す図) には ${word} の行を書けない。部品は route と queue と chain と ask と press の行で書く`,
      tryNoEdge: "try (試す図) には線の行を書けない。チップは line と ask と press の行で動かす",
      noParts: "route と queue と chain と ask と press の行で部品を 1 つ以上書く",
      needsAttr: (word, key) => `${word} の行には [${key}: <値>] を書く`,
      undeclaredPart: (id) => `${id} という部品は宣言していない`,
      wrongPart: (id, want) => `${id} は ${want.join(" か ")} の行で書いた部品でない`,
      gateShape: "試す図の check は最初の step より前に check <節>: <欄> <比べ方> <値> [no: <エラーの名前>, retry, into: <記録の列>] の形で書く。比べ方は >= か <= か > か < か == か != で、前後に空白を置く",
      gateInStep: "試す図の check は最初の step より前に書く網の節の関門。段の中の check は pipe (配管の図) でだけ書ける",
      gateNoVia: "check の関門は ask が送るチップの通る網の節に置く。ask の行に [via: <網>] を書く",
      gateOffPath: (node, route, path) => `${node} は ${route} の最短の道 (${path.join(" - ")}) の節でない。関門はその道の節に置く`,
      gateOrder: (value) => `${value} は数でないので、== か != で比べる`,
      gateLogAll: (log) => `${log} の記録の列は all を持つので、check の into に書けない。all を持たない log を書く`,
    },
    en: {
      routeShape: "Write a route as route <id>: <node> - <node>, <node> - <node> [from: <node>, to: <node>]",
      notInRoute: (node, route) => `${node} is not a node of the route ${route}`,
      noPath: (from, to) => `The route has no path from ${from} to ${to}`,
      tryPartInStep: (word) => `A ${word} line declares a part, so write it before the first step`,
      tryNoLine: (word) => `A try diagram takes no ${word} lines. Write its parts with route, queue, chain, ask and press lines`,
      tryNoEdge: "A try diagram takes no edge lines. Chips move with line, ask and press lines",
      noParts: "Write at least one part with a route, queue, chain, ask or press line",
      needsAttr: (word, key) => `A ${word} line needs [${key}: <value>]`,
      undeclaredPart: (id) => `No part named ${id} is declared`,
      wrongPart: (id, want) => `${id} is not a part written with a ${want.join(" or ")} line`,
      gateShape: "In a try diagram, write check before the first step as check <node>: <field> <op> <value> [no: <error>, retry, into: <log>]. The op is >=, <=, >, <, == or !=, with a space on each side",
      gateInStep: "In a try diagram, check is a gate written before the first step. A check inside a step can be written only in pipe diagrams",
      gateNoVia: "A check gate stands on a node of the route that ask sends chips through. Write [via: <route>] on the ask line",
      gateOffPath: (node, route, path) => `${node} is not on the shortest path of ${route} (${path.join(" - ")}). Put the gate on a node of that path`,
      gateOrder: (value) => `${value} is not a number, so compare it only with == or !=`,
      gateLogAll: (log) => `The log ${log} has all, so a check cannot write into it. Name a log without all`,
    },
  },
};
