/**
 * `leaf` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import { attrs } from "../../print-kit";
import { fail, HASH, ID, readAttrs, skipSpaces } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import type { BlockReading, ParseState } from "../block";
import type { TreeLeaf } from "./block";

/** 木の図の `leaf` の行の名札 */
const LEAF = /^leaf\s+([^\s[]+)/du;

export interface LeafMessages {
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

export const reading: BlockReading<LeafMessages> = {
  // 線の端には木の箱も `box` の箱も書ける
  endAt: (_source, id, _at, _side, state) => (state.figure.tree.boxes.has(id) ? id : undefined),
  finish: (state, head) => {
    if (state.figure.tree.boxes.size === 0) throw fail(head, 0, state.m.noLeaves);
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
      noLeaves: "leaf の行で葉を 1 つ以上書く",
      leafShape: "leaf は leaf <名札> [hash: <hash>] の形で書く",
    },
    en: {
      noLeaves: "Write at least one leaf with a leaf line",
      leafShape: "Write a leaf as leaf <id> [hash: <hash>]",
    },
  },
};
