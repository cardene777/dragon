/** 見本帳の部品の頁の、通らない道の説明 (#3347、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "状態遷移図だけの部品。最初の step より前に書いた線は、移れるが今回は通らない道として点線で引く。どの段も辿り着かない状態は点線の箱にして、脇道の囲みに入れる。",
  en: "State diagrams only. A line written before the first step is a path the object could take but does not this time, drawn dotted. A state that no step reaches becomes a dotted box inside the side path area.",
};
