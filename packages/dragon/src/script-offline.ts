/**
 * `dragon embed` が頁に埋める script の入口 (#3343)。build で依存ごと `dist/offline.global.js` の1 file に束ねる。
 *
 * 埋めた頁は外を読めないので、全ての図の種類の部品を持ち、字の CSS も読まない (図は端末の字で描く)。
 * 頁の記法の塊を図に置き換える処理は、script の1行の入口と同じ物を使う。
 */
import "./kinds/all";

import { drawPageBlocks } from "./page-blocks";

drawPageBlocks(document, () => Promise.resolve());
