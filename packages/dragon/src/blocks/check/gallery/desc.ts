/** 見本帳の部品の頁の、確認の説明 (#3389、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "配管の図だけの部品。段の中の check <者>: <左> <比べ方> <右> で、行う者の下に計器が出る。両側が数なら dragon が比べ、数でない確認は [fail] を書いた時だけ落ちる。",
  en: "Pipe diagrams only. check <who>: <left> <op> <right> in a step shows a gauge under the checker. dragon compares numbers itself, and a check of anything else fails only with [fail].",
};
