/** 見本帳の一覧の、通らない道の名前と説明 (#3347) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: { name: "通らない道", desc: "状態遷移図だけの部品。最初の step より前に書いた線は、移れるが今回は通らない道として点線で引く。どの段も辿り着かない状態は点線の箱にして、脇道の囲みに入れる。" },
  en: { name: "Path not taken", desc: "State diagrams only. A line written before the first step is a path the object could take but does not this time, drawn dotted. A state that no step reaches becomes a dotted box inside the side path area." },
};
