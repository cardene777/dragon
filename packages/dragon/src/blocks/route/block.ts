/**
 * 網のブロック (#3337、#3348)。
 *
 * 試す図の部品 (`only: try`)。最初の `step` より前の `route <名札>: <節> - <節>, <節> - <節> [from: <節>, to: <節>]` の行で、節と線の網を宣言する。
 * 入力の帯の `via` にこの網を書くと、送ったチップが `from` から `to` まで節の数が最も少ない道を辿る。`from` から `to` へ道が要る。
 * 試す図だけの行の頭の語の誤りと、試す図に書けない行の誤りと、部品の行が 1 つも無い誤りの文もこのブロックが持つ。
 * 試す図の部品は 5 つの部品の枝を原本の 1 つの欄 (`blocks.part`) の判別で持つので、部品の形は骨組みが持つ。
 */
import { attrs } from "../../print-kit";
import { fail, ID, readAttrs, skipSpaces } from "../../read-kit";
import type { TryPart } from "../../schema";
import type { SourceLine } from "../../tokenize";
import { needed, valueAt } from "../../try-read";
import { shortestPath } from "../../try-state";
import type { Block, ParseState } from "../block";

/** 試す図の `route <名札>:` の行 */
const ROUTE = /^route\s+([^\s:[]+)\s*:/du;

export interface RouteMessages {
  routeShape: string;
  /** 網の `from` か `to` が網の節に無い */
  notInRoute: (node: string, route: string) => string;
  /** 網の `from` から `to` へ道が無い */
  noPath: (from: string, to: string) => string;
  /** 試す図だけの部品の行 (`route`、`queue`、`chain`、`ask`、`press`) を、別の種類の図に書いた (#3337) */
  tryOnly: (word: string) => string;
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

export const block: Block<RouteMessages> = {
  name: "route",
  rank: 107,
  attach: { how: "place", only: "try" },
  words: { heads: ["route"], attrs: { route: ["from", "to"] } },
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
  },
  messages: {
    ja: {
      routeShape: "route は route <名札>: <節> - <節>, <節> - <節> [from: <節>, to: <節>] の形で書く",
      notInRoute: (node, route) => `${node} は ${route} の網の節でない`,
      noPath: (from, to) => `${from} から ${to} へ網の道が無い`,
      tryOnly: (word) => `${word} の行は try (試す図) でだけ書ける`,
      tryPartInStep: (word) => `${word} の行は部品の宣言なので、最初の step より前に書く`,
      tryNoLine: (word) => `try (試す図) には ${word} の行を書けない。部品は route と queue と chain と ask と press の行で書く`,
      tryNoEdge: "try (試す図) には線の行を書けない。チップは line と ask と press の行で動かす",
      noParts: "route と queue と chain と ask と press の行で部品を 1 つ以上書く",
      needsAttr: (word, key) => `${word} の行には [${key}: <値>] を書く`,
      undeclaredPart: (id) => `${id} という部品は宣言していない`,
      wrongPart: (id, want) => `${id} は ${want.join(" か ")} の行で書いた部品でない`,
    },
    en: {
      routeShape: "Write a route as route <id>: <node> - <node>, <node> - <node> [from: <node>, to: <node>]",
      notInRoute: (node, route) => `${node} is not a node of the route ${route}`,
      noPath: (from, to) => `The route has no path from ${from} to ${to}`,
      tryOnly: (word) => `${word} lines can be written only in try diagrams`,
      tryPartInStep: (word) => `A ${word} line declares a part, so write it before the first step`,
      tryNoLine: (word) => `A try diagram takes no ${word} lines. Write its parts with route, queue, chain, ask and press lines`,
      tryNoEdge: "A try diagram takes no edge lines. Chips move with line, ask and press lines",
      noParts: "Write at least one part with a route, queue, chain, ask or press line",
      needsAttr: (word, key) => `A ${word} line needs [${key}: <value>]`,
      undeclaredPart: (id) => `No part named ${id} is declared`,
      wrongPart: (id, want) => `${id} is not a part written with a ${want.join(" or ")} line`,
    },
  },
};
