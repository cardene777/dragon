/** 使い方の頁の「持ち主ごとのカードの図」の節の、列とカードと段の中の行の段落 (#3846) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "cards",
  ja: [
    "誰がどのカードを持つかを段ごとに見せる時は、最初の行を `cards <題>` にする。持ち主の列は `box <名札> as <名前>` の行で宣言し、書いた順に左から並ぶ。列の `[mark: <印の語>]` は、その列で出す印の語になる。",
    "カードは `item <名札> as <名前> in <列>, <列> [amount: <量>]` の行で載せる。`in` に書いた全ての列に写しが 1 枚ずつ載り、列の中は作った順に上から積む。量は `1000 USDC` のように数と単位で書く。`[total: none]` のカードは量をカードに出すが列の合計に足さず、`[mark: <列>]` は印を出す列を選び、繰り返して書ける。",
    "最初の `step` より前のカードは初めから在る。段の中の `item` はその段でできるカードで、在るカードの `item <名札> in <列>` はカードをその列へ動かす。`delete <カード>` はカードを消し線で残し、`refuse <カードか列>: <理由>` は何も変えずに断られた札と理由を出す。`<列> -> <カード>: <名前>` の線は列の見出しからカードへの呼び出しになる。",
    "列の下の帯に、列ごとの合計が単位ごとに出る。消したカードと `[total: none]` のカードは足さず、段で変わった合計は前の量を消し線で添える。合計に足すカードが無い図は帯を描かない。",
  ],
  en: [
    "To show who holds which card, step by step, start the first line with `cards <title>`. Declare the owner columns with `box <id> as <name>` lines. They sit from left to right in the order written. A column's `[mark: <word>]` is the mark word shown in that column.",
    "Put a card down with `item <id> as <name> in <column>, <column> [amount: <amount>]`. Every column in `in` gets its own copy, and each column stacks its cards from the top in the order made. Write an amount as a number and a unit, like `1000 USDC`. A `[total: none]` card shows its amount but stays out of the column total. `[mark: <column>]` picks a column to show the mark in, and can be repeated.",
    "Cards written before the first `step` are there from the start. An `item` line in a step makes a card in that step, and `item <id> in <column>` on an existing card moves it to that column. `delete <card>` strikes the card through and keeps it. `refuse <card or column>: <reason>` shows a refused panel with the reason and changes nothing. A `<column> -> <card>: <name>` line is a call from the column head to the card.",
    "The band under the columns shows each column's total, unit by unit. Deleted cards and `[total: none]` cards are not added, and a total that changed in a step keeps its old amount struck through. A diagram with no card that adds to a total draws no band.",
  ],
};
