/** 見本帳の部品の頁の、量の図の項目の説明 (#3560)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "量の図だけの部品。最初の step より前に item <名札> as <名前> [color: <色>] と書くと、比べる項目を宣言する。ドーナツは凡例に、横棒は棒の左に名前が出る。項目は 8 個まで書ける。",
  en: "Charts only. Write item <id> as <name> [color: <color>] before the first step to declare an item to compare. A donut shows the name in its legend, and a bar chart shows it left of the bar. A chart takes up to 8 items.",
};
