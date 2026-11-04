/**
 * 葉のブロック (#3233、#3348)。
 *
 * 木の図の部品 (`only: tree`)。段の中の `leaf <名札> [hash: <hash>]` の行で、その段に葉の箱を出す。
 * `hash` を書くと箱に値を出し、名札を葉の下の札に出す。葉は書いた順に左から並ぶ。
 * 木の図に葉が 1 つも無い誤りは、全ての行を読んだ後に parser が確かめ、その文をこのブロックが持つ。
 */
import { attrs } from "../../print-kit";
import { fail, HASH, ID, readAttrs, skipSpaces } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import type { Block, ParseState } from "../block";

/** 木の図の葉を出す出来事。書いた段で葉の箱が現れる。`hash` を書くと箱に値を出し、名札を葉の下の札に出す */
export interface TreeLeaf {
  type: "leaf";
  id: string;
  hash?: string;
}

/** 木の図の `leaf` の行の名札 */
const LEAF = /^leaf\s+([^\s[]+)/du;

export interface LeafMessages {
  /** 木の図だけの行 (`word`) を、別の種類の図に書いた */
  treeOnly: (word: string) => string;
  noLeaves: string;
  leafShape: string;
}

/** 葉と親の行の名札の後ろの `[hash: <hash>]`。`at` は `[` か行の終わりで、`keys` はその行に書ける属性の鍵 */
export function treeHash(source: SourceLine, at: number, keys: readonly string[], state: ParseState): string | undefined {
  if (at >= source.text.length) return undefined;
  const hash = readAttrs(source, at, keys, state.m).get("hash");
  if (hash && !HASH.test(hash.value)) throw fail(source, hash.at, state.m.badHash);
  return hash?.value;
}

/** 木の図の `leaf <名札> [hash: <hash>]` の行 */
function readLeaf(source: SourceLine, state: ParseState): TreeLeaf {
  const { m } = state;
  const text = source.text;
  const found = LEAF.exec(text);
  const id = found?.[1];
  if (!found || id === undefined) throw fail(source, 0, m.leafShape);
  const idAt = found.indices?.[1]?.[0] ?? 0;
  if (!ID.test(id)) throw fail(source, idAt, m.badId(id));
  state.declare(source, id, idAt);
  state.figure.tree.boxes.set(id, { source, at: idAt });
  const rest = skipSpaces(text, found[0].length);
  if (rest < text.length && text[rest] !== "[") throw fail(source, rest, m.leafShape);
  const hash = treeHash(source, rest, state.attrs.leaf ?? [], state);
  return { type: "leaf", id, ...(hash !== undefined ? { hash } : {}) };
}

export const block: Block<LeafMessages> = {
  name: "leaf",
  rank: 97,
  attach: { how: "place", only: "tree" },
  words: { heads: ["leaf"], attrs: { leaf: ["hash"] } },
  shape: {
    events: {
      leaf: {
        description: "葉を出す。木の図だけが書ける。書いた段で葉の箱が現れる。hash を書くと箱に値を出し、名札を葉の下の札に出す",
        type: "object",
        additionalProperties: false,
        required: ["type", "id"],
        properties: {
          type: { const: "leaf" },
          id: { $ref: "#/definitions/id" },
          hash: { $ref: "#/definitions/hash" },
        },
      },
    },
  },
  read: {
    leaf: (source, state) => {
      const step = state.inStep(source);
      step.events.push(readLeaf(source, state));
    },
  },
  print: {
    events: {
      leaf: (e) => `leaf ${e.id}${attrs([["hash", e.hash]])}`,
    },
  },
  messages: {
    ja: {
      treeOnly: (word) => `${word} の行は tree (木の図) でだけ書ける`,
      noLeaves: "leaf の行で葉を 1 つ以上書く",
      leafShape: "leaf は leaf <名札> [hash: <hash>] の形で書く",
    },
    en: {
      treeOnly: (word) => `${word} lines can be written only in tree diagrams`,
      noLeaves: "Write at least one leaf with a leaf line",
      leafShape: "Write a leaf as leaf <id> [hash: <hash>]",
    },
  },
};
