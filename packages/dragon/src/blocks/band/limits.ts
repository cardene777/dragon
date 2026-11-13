/**
 * 量の帯のブロックの数の決まり (#3626)。量の行き先の図の線の名前から量を読む。
 * 後から読む読み方 (`read.ts`) と並べ方 (`kinds/sankey/layout.ts`) だけが読み、定義 (`block.ts`) に置かない。
 * 定義に置くと、本体と後から読む塊の両方が定義の file を読み、1行の入口で定義が最初に読む別の file に分かれ、最初に読む量が増える (#3657)
 *
 * 線の名前の初めの数を量にする。桁の区切りの `,` は外し、数の後ろの単位と言葉 (`%`、`円`、`億トークン`) は読まない。
 * 数で始まらない名前 (`約40%`、`-5`) は量を持たない
 */
const LEAD = /^\d[\d,]*(?:\.\d+)?/u;

/** 量の行き先の図の見た目 (#3641)。`rows` は段ごとに図の幅いっぱいの帯を1行ずつ上から積む */
export const SANKEY_SHAPES = ["rows"] as const;

/** 線の名前 `label` の初めの数。数で始まらない名前と、名前の無い線は `undefined` */
export function amountOf(label: string | undefined): number | undefined {
  const found = label === undefined ? null : LEAD.exec(label);
  return found ? Number(found[0].replaceAll(",", "")) : undefined;
}
