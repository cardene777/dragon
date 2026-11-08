/** 見本帳の部品の頁の、部品を横に並べる行の説明 (#3429、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "試す図だけの部品。最初の step より前に side <部品>, <部品> と書くと、網と待ち行列と機械の列と記録の列のうち書いた部品を、枠が広い時に書いた順に左から並べる。待ち行列はチップが入る幅だけを取り、残りの幅を網と機械の列と記録の列に渡す。枠の幅が足りず字が小さくなる時は、今どおり上から積む。",
  en: "Try diagrams only. Write side <part>, <part> before the first step and the named route, queue, chain, and log parts sit left to right in the written order when the frame is wide. A queue takes only the width its chips need and leaves the rest to the route, chain, and log. When the frame is too narrow for readable text, they stack from the top as before.",
};
