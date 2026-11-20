/**
 * `dragon embed` が頁に埋める script の入口 (#3343)。build で依存ごと `dist/offline.global.js` の1 file に束ねる。
 *
 * 埋めた頁は外を読めないので、全ての図の種類の部品を持ち、字の CSS も読まない (図は端末の字で描く)。
 * 頁の記法の塊を図に置き換える処理は、script の1行の入口と同じ物を使う。
 * 絵柄集の表は持たず、`dragon embed` が頁に収めた、頁の図が使う絵柄だけを登録してから描く (#3493)。
 *
 * 属性 `data-header` を持つ塊には、script の1行の入口と同じ帯を付ける (#3786)。帯の塊は後から読まずに束ねる。
 * 書き出す部品 (`capture.js`) を読む処理は帯へ渡さないので、帯のエクスポートは外を読まずに作れるPNGとSVGとdragon記法とJSONだけを出す。
 */
import "./kinds/all";

import { registerPageIcons } from "./blocks/icon/page-icons";
import { frameDrawn } from "./frame/framed";
import { drawPageBlocks } from "./page-blocks";
import { mountDiagram } from "./player";
import { NOTATION_WORDS } from "./words";

registerPageIcons(document);
drawPageBlocks(
  document,
  () => Promise.resolve(),
  (host, drawn, source, diagram, options) => frameDrawn(host, drawn, source, diagram, options, mountDiagram, NOTATION_WORDS),
);
