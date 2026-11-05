/** 見本帳の一覧の、確認の名前と説明 (#3389) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: {
    name: "確認",
    desc: "配管の図だけの部品。段の中の check <者>: <左> <比べ方> <右> で、行う者の下に計器が出る。両側が数なら dragon が比べ、数でない確認は [fail] を書いた時だけ落ちる。",
  },
  en: {
    name: "Check",
    desc: "Pipe diagrams only. check <who>: <left> <op> <right> in a step shows a gauge under the checker. dragon compares numbers itself, and a check of anything else fails only with [fail].",
  },
};
