/** 見本帳の一覧の、封の名前と説明 (#3239、#3348) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: {
    name: "封",
    desc: "列の図だけの部品。段の中に seal <列> と書くと、縞の封が列の左から伸びて中身を隠し、open <列> と書くと封が消えて中身が戻る。封をした列の並びは開けるまで書けない。",
  },
  en: {
    name: "Seal",
    desc: "Lineup diagrams only. Write seal <lane> in a step and a striped seal grows from the left of the lane and hides its contents. open <lane> removes the seal and brings the contents back. The order of a sealed lane cannot be written until it is opened.",
  },
};
