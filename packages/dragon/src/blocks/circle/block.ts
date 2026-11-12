/**
 * 集まりの円のブロック (#3620)。
 *
 * 集合の重なりの図の部品 (`only: venn`)。最初の `step` より前の `item <名札> as <名前> [color: <色>]` の行で集まりを宣言し、
 * 段の中の `set <名札>: <数>` で集まりの数を、`set <名札> & <名札>: <数>` で重なりの数を、`set none: <数>` でどれにも入らない数を書く。
 * 集まりは 2 つか 3 つ書け、`color` を書かない集まりには宣言した順に色の役を配る。`none` はどれにも入らない数の語なので、集合の重なりの図では名札に使えない。
 * 行の頭の語 `item` は列の図のチップのブロックが、`set` は中身の帯のブロックが持つ語なので、集合の重なりの図の 2 つの行はこのブロックが行の形 (`lines`) で読み、
 * ほかの種類の図の行の読み方を変えない。集合の重なりの図の決まり (書けない行と線を断る、集まりの数、重なりの数が集まりの数を超えない) もこのブロックの読み方が持つ。
 * 原本の JSON では `blocks.circle` に宣言した順に集まりを持ち、段の中の数は数の出来事 (`count`) と、どれにも入らない数の出来事 (`none`) で持つ。
 */
import type { Block } from "../block";
import type { Color } from "../color/block";

/** 集合の重なりの図の集まり。`name` は円の外に出す名前で、`color` を書かない集まりは宣言した順に色の役を配る */
export interface VennSet {
  id: string;
  name: string;
  color?: Color;
}

/** 集合の重なりの図の、集まりか重なりの数を `value` にする出来事。`sets` は 1 つなら集まりの数、2 つ以上なら重なりの数 */
export interface VennCount {
  type: "count";
  sets: string[];
  value: number;
}

/** 集合の重なりの図の、どれにも入らない数を `value` にする出来事 */
export interface VennNone {
  type: "none";
  value: number;
}

export const block: Block = {
  name: "circle",
  rank: 147,
  attach: { how: "place", only: "venn" },
  words: {},
  // 集合の重なりの図の決まり (書けない行と線を断る、集まりの数、重なりの数) を持つ
  always: true,
  // 集合の重なりの図の `item` と `set` の行は集まりと数として読み、線の行は断る
  lines: [{ heads: ["item"] }, { heads: ["set"] }, { edges: "any" }],
};
