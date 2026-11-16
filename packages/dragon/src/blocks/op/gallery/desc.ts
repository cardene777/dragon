/** 見本帳の部品の頁の、線を起こした操作の番号の説明 (#3720)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "時系列図だけの部品。線の行に [op: <番号>] を付けると、線を起こした操作の番号を線に持たせる。描いた線は data-op でその番号を持ち、図の見た目は変わらない。",
  en: "Sequence diagrams only. Add [op: <number>] to a line to give it the number of the operation that raised it. The drawn line carries the number as data-op, and the look of the diagram does not change.",
};
