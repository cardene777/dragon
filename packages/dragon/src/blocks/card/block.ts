/**
 * 持ち主ごとのカードのブロック (#3846)。
 *
 * 持ち主ごとのカードの図の部品 (`only: cards`)。`box` の行で宣言した列に、`item <名札> as <名前> in <列>, <列> [<属性>]` の行でカードを載せる。
 * カードは `in` に書いた全ての列に 1 枚ずつ写しが載る。最初の `step` より前に書いたカードは初めから在り、段の中に書いたカードはその段でできる。
 * 段の中で在るカードの `item <名札> in <列>` を書き直すと、カードがその列へ動く。段の中の `delete <カード>` はカードを消し線で残し、
 * `refuse <カードか列>: <理由>` はカードを変えずに断られた札と理由の札を出す。`<列> -> <カード>: <名前>` の線は列の見出しからカードへの呼び出しになる。
 * `item` は列の図と試す図と量の図と集合の重なりの図の語、`delete` は枝分かれの図の語なので、行の形 (`lines`) で先に読む。新しく足す語は `refuse` だけ。
 * 列の `[mark: <印の語>]` は列で出す印の語を決め、カードの `[mark: <列>]` で印を出す列を選ぶ。`mark` はカードの行でだけ繰り返せる
 */
import type { Block } from "../block";

/**
 * カード。`in` は写しが載る列で、書いた順。`amount` は数と単位の量 (`1000 USDC`)、`total: none` は量をカードに出すが列の合計に足さない印、
 * `mark` は印を出す列で、その列の `mark` の語の札をその列に載る写しにだけ出す
 */
export interface CardItem {
  id: string;
  name: string;
  in: string[];
  amount?: string;
  total?: "none";
  mark?: string[];
}

/** 段の中でカードを作る出来事。欄はカードと同じ */
export interface CardMake extends CardItem {
  type: "card";
}

/** 在るカードを列 `in` へ動かす出来事。前の列の写しは消え、`in` の列に写しが載る */
export interface CardMove {
  type: "card-move";
  card: string;
  in: string[];
}

/** カードを消す出来事。消したカードは消し線で残り、列の合計から外れる */
export interface CardDelete {
  type: "card-delete";
  card: string;
}

/** カードか列 `target` が断られる出来事。カードは変わらず、断られた札と理由 `reason` の札を出す */
export interface CardRefuse {
  type: "refuse";
  target: string;
  reason: string;
}

export const block: Block = {
  name: "card",
  rank: 152,
  attach: { how: "place", only: "cards" },
  words: { heads: ["refuse"], attrs: { box: ["mark"] } },
  // カードの行は列の図のチップと同じ語、消す行は枝分かれの図と同じ語なので、行の頭の語より先に行の形で読む
  lines: [{ heads: ["item"] }, { heads: ["delete"] }],
  // 線の受ける側のカードと、書ける行の頭の語の決まりを持つ
  always: true,
};
