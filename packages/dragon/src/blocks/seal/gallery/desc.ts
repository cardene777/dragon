/** 見本帳の部品の頁の、封の説明 (#3239、#3348、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "列の図だけの部品。段の中に seal <列> と書くと、縞の封が列の左から伸びて中身を隠し、open <列> と書くと封が消えて中身が戻る。封をした列の並びは開けるまで書けない。",
  en: "Lineup diagrams only. Write seal <lane> in a step and a striped seal grows from the left of the lane and hides its contents. open <lane> removes the seal and brings the contents back. The order of a sealed lane cannot be written until it is opened.",
};
