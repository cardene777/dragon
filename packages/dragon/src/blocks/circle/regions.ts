/**
 * 集合の重なりの図の区画と、それぞれだけの数の出し方 (#3620)。
 *
 * 区画は集まりの空でない組で、名札は宣言した順の名札を `&` で繋ぐ (`a`、`a&b`、`a&b&c`)。2 つの集まりは 3 つ、3 つの集まりは 7 つの区画を持つ。
 * 書いた数は区画の全体の数 (集まりなら円の中の全て、重なりならその重なりの中の全て) で、それぞれだけの数はその区画を含む組の数を足し引きして出す。
 * 書かない重なりは、図の終わりまで書かなければ 0 とし、後の段で書く重なりはその段まで決まらない数とする。
 * 記法を読む処理 (`read.ts`) が数の決まりを確かめる時と、並べ方 (`kinds/venn/layout.ts`) が区画の数を決める時が同じ関数で数える。
 * どちらも後から読む塊にあり、この file を見本帳を開いた時に読む塊に入れない。
 */

/** 区画の名札。`sets` を宣言した順 (`order`) に並べて `&` で繋ぐ */
export const regionKey = (order: readonly string[], sets: readonly string[]): string => order.filter((id) => sets.includes(id)).join("&");

/** 人に見せる区画の名前。名札を ` & ` で繋ぐ */
export const regionName = (key: string): string => key.split("&").join(" & ");

/** 全ての区画の集まりの組。宣言した順の、集まりの少ない組から */
export function regionsOf(order: readonly string[]): string[][] {
  const all: string[][] = [];
  for (let mask = 1; mask < 1 << order.length; mask++) all.push(order.filter((_, i) => (mask & (1 << i)) !== 0));
  return all.sort((a, b) => a.length - b.length);
}

/** 区画 `members` を含む組 (`members` 自身も含む)。宣言した順の、集まりの少ない組から */
const supersetsOf = (order: readonly string[], members: readonly string[]): string[][] => regionsOf(order).filter((t) => members.every((id) => t.includes(id)));

/**
 * 区画 `members` のそれぞれだけの数。`valueOf` は区画の名札の今の数 (まだ書いていなければ `undefined`)、`later` は図の終わりまでに書く区画か。
 * 区画の集まりの数が全て決まり、区画を含む重なりの数が決まるか図の終わりまで書かない時だけ数を返し、決まらない時は `undefined` を返す
 */
export function exclusiveOf(order: readonly string[], members: readonly string[], valueOf: (key: string) => number | undefined, later: (key: string) => boolean): number | undefined {
  if (members.some((id) => valueOf(id) === undefined)) return undefined;
  let sum = 0;
  for (const t of supersetsOf(order, members)) {
    const key = t.join("&");
    const value = valueOf(key);
    if (value === undefined) {
      if (later(key)) return undefined;
      continue;
    }
    sum += (t.length - members.length) % 2 === 0 ? value : -value;
  }
  return sum;
}

/**
 * 点で数える見た目 (#3635) の、区画ごとの今の段までに書いた数だけで出したそれぞれだけの数。後の段で書く重なりもまだ書かない間は 0 とし、
 * 0 より小さくなる区画は 0 にする。集まりの数をまだ書かない区画は持たない。点は段ごとにこの数で群れへ寄るので、後の段で書く重なりを待たない
 */
export function provisionalOf(order: readonly string[], valueOf: (key: string) => number | undefined): Map<string, number> {
  const out = new Map<string, number>();
  for (const members of regionsOf(order)) {
    const value = exclusiveOf(order, members, valueOf, () => false);
    if (value !== undefined) out.set(members.join("&"), Math.max(0, value));
  }
  return out;
}

/** 数の字。整数の部分を 3 桁ごとに `,` で区切り、小数の部分はそのまま書く */
export function vennNumber(value: number): string {
  const [whole = "", part] = String(value).split(".");
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/gu, ",")}${part === undefined ? "" : `.${part}`}`;
}
