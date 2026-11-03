/** 見本帳の一覧の、出典の名前と説明 (#3345) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: { name: "出典", desc: "段に書く出典。名前と URL の組を 1 つの段に何行でも書け、読み上げの段の一覧に名前の link で出る。図と見える語りには出さない。" },
  en: {
    name: "Source",
    desc: "A source for a step: a name and a URL, as many lines as the step needs. Sources appear as links in the step list that screen readers read, not in the diagram or the shown text.",
  },
};
