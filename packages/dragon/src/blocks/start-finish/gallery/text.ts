/** 見本帳の一覧の、始まりと終わりの名前と説明 (#3347) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: { name: "始まりと終わり", desc: "状態遷移図だけの部品。線の送る側に start、受ける側に finish を書くと、始まりの印から出る線と、終わりの印へ入る線になる。" },
  en: { name: "Start and end", desc: "State diagrams only. Write start as the sender of a line and finish as its receiver, and the line leaves the start mark or goes into the end mark." },
};
