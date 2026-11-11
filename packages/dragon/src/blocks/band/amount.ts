/**
 * 量の行き先の図 (#3626) の線の名前から量を読む。読み方 (`read.ts`) と並べ方 (`kinds/sankey/layout.ts`) が同じ読み方を使う。
 *
 * 線の名前の初めの数を量にする。桁の区切りの `,` は外し、数の後ろの単位と言葉 (`%`、`円`、`億トークン`) は読まない。
 * 数で始まらない名前 (`約40%`、`-5`) は量を持たない
 */
const LEAD = /^\d[\d,]*(?:\.\d+)?/u;

/** 線の名前 `label` の初めの数。数で始まらない名前と、名前の無い線は `undefined` */
export function amountOf(label: string | undefined): number | undefined {
  const found = label === undefined ? null : LEAD.exec(label);
  return found ? Number(found[0].replaceAll(",", "")) : undefined;
}
