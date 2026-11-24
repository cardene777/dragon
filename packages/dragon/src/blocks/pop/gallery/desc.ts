/** 見本帳の部品の頁の、押すと出る札の説明 (#3877)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "図の1行目に[note: pop]を書くと、箱のnoteを名前の下に描かず、iの印の付いた箱を押すとすぐ下に出る札で見せる。exampleを書くと札の下に例の帯が出る。",
  en: "With [note: pop] on the first line, a box's note is not drawn under its name but shown on a card that opens just below the box when you click its i mark. example adds an example band at the bottom of the card.",
};
