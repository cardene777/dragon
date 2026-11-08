/** 見本帳の部品の頁の、出典の説明 (#3345、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "段に書く出典。名前と URL の組を 1 つの段に何行でも書け、読み上げの段の一覧に名前の link で出る。図と見える語りには出さない。",
  en: "A source for a step: a name and a URL, as many lines as the step needs. Sources appear as links in the step list that screen readers read, not in the diagram or the shown text.",
};
