/** 見本帳の部品の頁の、始まりと終わりの説明 (#3347、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "状態遷移図だけの部品。線の送る側に start、受ける側に finish を書くと、始まりの印から出る線と、終わりの印へ入る線になる。",
  en: "State diagrams only. Write start as the sender of a line and finish as its receiver, and the line leaves the start mark or goes into the end mark.",
};
