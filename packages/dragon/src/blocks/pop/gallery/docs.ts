/** 使い方の頁の「箱」の節の、押すと出る札の段落 (#3877) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "boxes",
  ja: [
    "時系列図、構成図、状態遷移図、枝分かれの図、時間軸の図、木の図、手順の図は、1行目に`[note: pop]`を書くと、箱の`note`を名前の下に描かず、押すと箱のすぐ下に出る札で見せる。`note`を持つ箱だけが右上に丸いiの印を持ち、長い説明を書いても箱は広がらない。札は箱の名前と`note`の全文を持ち、札の外か閉じるのアイコンを押すか、段を送ると閉じる。",
    "札で見せる図の箱には`example: <例>`も書け、札の下に灰色の帯で例が出る。`[note: under]`は名前の下の字で見せ、書かない図と同じになる。札で見せない図の箱に`example`を書くと、その行を名指して断る。印刷すると全ての札が開き、図に重ならずに図の下に箱の名前と並ぶ。",
  ],
  en: [
    "In sequence, architecture, state, git, time, tree and flow diagrams, `[note: pop]` on the first line stops drawing a box's `note` under its name and shows it on a card that opens just below the box when you click it. Only a box with `note` gets a round i mark at its top right, and a long note no longer widens the box. The card holds the box name and the whole `note`, and closes when you click outside it or its close icon, or move to another step.",
    "A box in such a diagram also takes `example: <example>`, shown as a gray band at the bottom of the card. `[note: under]` draws the note under the name, the same as writing nothing. `example` on a box of a diagram that does not use cards is refused with the line named. When printed, every card is drawn open and listed below the diagram with its box name, not over the diagram.",
  ],
};
