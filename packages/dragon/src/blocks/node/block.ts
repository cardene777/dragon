/**
 * 組んだ親のブロック (#3233、#3348)。
 *
 * 木の図の部品 (`only: tree`)。段の中の `node <名札> of <子>, <子> [hash: <hash>]` の行で、前に書いた葉か親を子にして親の箱を出し、
 * 子と親を木の線で結ぶ。2 つの木の箱を結ぶので、付け方はつなぐ (接続ブロック)。
 * 木の箱の親は 1 つだけで、最後の段を終えた時に親を持たない木の箱は根の 1 つだけ。根が 2 つ以上残る誤りは、
 * 全ての行を読んだ後に parser が確かめ、その文をこのブロックが持つ。
 */
import { attrs } from "../../print-kit";
import { fail, ID, skipSpaces } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import type { Block, ParseState } from "../block";
import { treeHash } from "../leaf/block";

/** 木の図の `node` の行で、親の名札の後ろに子を続ける語 (`node <名札> of <子>, <子>`)。必ず書くので部品の語に数えない */
export const OF = "of";

/** 木の図の、1 つ以上の子から親を組む出来事。書いた段で親の箱と、子から親への木の線が現れる */
export interface TreeNode {
  type: "node";
  id: string;
  children: string[];
  hash?: string;
}

/** 木の図の `node` の行の名札と `of` */
const NODE = new RegExp(`^node\\s+([^\\s[]+)\\s+${OF}\\s+`, "du");

export interface NodeMessages {
  nodeShape: string;
  /** 子に書いた名札 (`id`) を、まだ葉か親で書いていない */
  noTreeChild: (id: string) => string;
  /** 子に書いた名札 (`id`) が、`box` の行で置いた箱 */
  notTreeBox: (id: string) => string;
  /** 子に書いた名札 (`id`) が、もう別の親の子 */
  twoParents: (id: string) => string;
  /** 親を持たない木の箱 (`id`) が、根 (`root`) のほかに残る */
  manyRoots: (id: string, root: string) => string;
}

/**
 * 木の図の `node <名札> of <子>, <子> [hash: <hash>]` の行。子は前に書いた葉か親で、まだ親を持たない箱に限る。
 * 子は `,` で区切り、`[` か行の終わりで終わる
 */
function readNode(source: SourceLine, state: ParseState): TreeNode {
  const { m } = state;
  const { boxes: trees, parents } = state.figure.tree;
  const text = source.text;
  const found = NODE.exec(text);
  const id = found?.[1];
  if (!found || id === undefined) throw fail(source, 0, m.nodeShape);
  const idAt = found.indices?.[1]?.[0] ?? 0;
  if (!ID.test(id)) throw fail(source, idAt, m.badId(id));
  state.declare(source, id, idAt);
  const children: string[] = [];
  let end = found[0].length;
  for (;;) {
    const start = skipSpaces(text, end);
    end = start;
    while (end < text.length && text[end] !== "," && text[end] !== "[") end++;
    const child = text.slice(start, end).trim();
    if (child === "" || !ID.test(child)) throw fail(source, start, m.nodeShape);
    if (!trees.has(child)) throw fail(source, start, state.declared(child) && child !== id ? m.notTreeBox(child) : m.noTreeChild(child));
    if (parents.has(child)) throw fail(source, start, m.twoParents(child));
    parents.set(child, id);
    children.push(child);
    if (text[end] !== ",") break;
    end++;
  }
  const hash = treeHash(source, end, state.attrs.node ?? [], state);
  trees.set(id, { source, at: idAt });
  return { type: "node", id, children, ...(hash !== undefined ? { hash } : {}) };
}

export const block: Block<NodeMessages> = {
  name: "node",
  rank: 98,
  attach: { how: "connect", only: "tree" },
  words: { heads: ["node"], attrs: { node: ["hash"] } },
  shape: {
    events: {
      node: {
        description: "1 つ以上の子から親を組む。木の図だけが書ける。書いた段で親の箱と、子から親への木の線が現れる",
        type: "object",
        additionalProperties: false,
        required: ["type", "id", "children"],
        properties: {
          type: { const: "node" },
          id: { $ref: "#/definitions/id" },
          children: { type: "array", minItems: 1, items: { $ref: "#/definitions/id" } },
          hash: { $ref: "#/definitions/hash" },
        },
      },
    },
  },
  read: {
    node: (source, state) => {
      const step = state.inStep(source);
      step.events.push(readNode(source, state));
    },
  },
  print: {
    events: {
      node: (e) => `node ${e.id} ${OF} ${e.children.join(", ")}${attrs([["hash", e.hash]])}`,
    },
  },
  messages: {
    ja: {
      nodeShape: "node は node <名札> of <子>, <子> [hash: <hash>] の形で書く",
      noTreeChild: (id) => `${id} という葉か親はまだ書いていない。子は前に leaf か node で書いた名札にする`,
      notTreeBox: (id) => `${id} は box の行で置いた箱で、木の箱でない。子は leaf か node で書いた名札にする`,
      twoParents: (id) => `${id} はもう別の親の子になっている。木の箱の親は 1 つだけ`,
      manyRoots: (id, root) => `${id} が親を持たないまま残る。木の根は 1 つだけで、${id} も ${root} も最後に 1 つの根へ組む`,
    },
    en: {
      nodeShape: "Write a node as node <id> of <child>, <child> [hash: <hash>]",
      noTreeChild: (id) => `No leaf or node named ${id} has been written yet. A child must be an id written earlier with leaf or node`,
      notTreeBox: (id) => `${id} is a box from a box line, not a tree box. A child must be an id written with leaf or node`,
      twoParents: (id) => `${id} is already a child of another node. A tree box has only one parent`,
      manyRoots: (id, root) => `${id} is left without a parent. A tree has one root, so join ${id} and ${root} under one root by the end`,
    },
  },
};
