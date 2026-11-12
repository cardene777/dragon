/** 見本帳の部品の頁の、量の帯の説明 (#3626)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "量の行き先の図だけの部品。box の行で宣言した出どころと行き先を、段の中の <出どころ> -> <行き先>: <量> の線で結ぶ。線の名前の初めの数を量として読み、量に比べた幅の帯がその段で出どころの棒から右の列の行き先の棒へ伸び、量の札が帯を渡る。前の列へ戻る線と、入る量より出る量の和が大きい箱は書けない。",
  en: "Sankey diagrams only. A <source> -> <target>: <amount> line in a step joins a source and a target declared with box lines. The number at the start of the label is the amount; a band as wide as the amount grows in that step from the source bar to the target bar in a column to the right, and an amount chip travels along it. A line back to an earlier column and a box sending out more than comes in are refused.",
};
