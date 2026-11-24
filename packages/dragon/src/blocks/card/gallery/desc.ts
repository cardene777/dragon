/** 見本帳の部品の頁の、持ち主ごとのカードの説明 (#3846)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "持ち主ごとのカードの図だけの部品。box の行で宣言した列に、item <名札> as <名前> in <列>, <列> の行でカードを載せ、in に書いた全ての列に写しが 1 枚ずつ載る。段の中の item はその段でできるカード、在るカードの item <名札> in <列> は動かす行、delete は消し線で残す行、refuse <カードか列>: <理由> は何も変えずに断られた札を出す行。列ごとの合計は消えていないカードの量を単位ごとに足し、段で変わった合計は前の量を添える。",
  en: "Owner card diagrams only. An item <id> as <name> in <column>, <column> line puts a card in columns declared with box lines, and every column in in gets its own copy. An item line in a step makes a card in that step, item <id> in <column> on an existing card moves it, delete strikes a card through and keeps it, and refuse <card or column>: <reason> shows a refused panel and changes nothing. Each column total adds the amounts of the cards not deleted, unit by unit, and a total that changed in a step keeps its old amount struck through.",
};
