/**
 * `dragon embed` が頁に埋める script の入口 (#3343)。build で依存ごと `dist/offline.global.js` の1 file に束ねる。
 *
 * 埋めた頁は外を読めないので、全ての図の種類の部品を持ち、字の CSS も読まない (図は端末の字で描く)。
 * 頁の記法の塊を図に置き換える処理は、script の1行の入口と同じ物を使う。
 * 絵柄集の表は持たず、`dragon embed` が頁に収めた、頁の図が使う絵柄だけを登録してから描く (#3493)。
 *
 * 属性 `data-header` を持つ塊には、script の1行の入口と同じ帯を付け、帯の内側に図を 1 度だけ描く (#3786、#3789)。帯の塊は後から読まずに束ねる。
 * 帯のエクスポートは script の1行の入口と同じ7つの形式を、外を読まずに書き出す (#3792)。
 * GIF と MP4 を詰める処理を束ね、HTML には頁に埋めたこの script を再生の script として埋める (`capture/offline.ts`)。
 * 判定の表は書き出す絵の形 (例を帯に置いた SVG、#3945) を束ねた描く処理で描き、束ねた書き出す部品で撮る。
 * 書き出した HTML の頁はこの script の `DragonPlayer.mountDiagram` で図を置くので、build は `DragonPlayer` の名前で出す。
 */
import "./kinds/all";
// 押すと出る札の層を作る処理 (#3877)。外を読めない頁で開くので、読み込みの時に置く
import "./blocks/pop/cards-all";

import { registerPageIcons } from "./blocks/icon/page-icons";
import { offlineCapture } from "./capture/offline";
import { mountInFrame } from "./frame/framed";
import { drawPageBlocks, type FramedBlock } from "./page-blocks";
import { mountDiagram } from "./player";
import { renderDiagram } from "./render/draw";
import { NOTATION_WORDS } from "./words";

/** 頁に埋めたこの script の中身。`currentScript` は script を読み込んでいる間だけ指すので、読み込みの時に読む */
const capture = offlineCapture(document.currentScript?.textContent ?? "");

/** 帯の内側に図を描く処理。束ねてあるので、待たずに渡す */
const framed: FramedBlock = (host, source, diagram, options) => {
  mountInFrame(host, source, diagram, options, mountDiagram, NOTATION_WORDS, capture, (shown, opts) => renderDiagram(shown, { ...opts, picture: true }));
};

registerPageIcons(document);
drawPageBlocks(
  document,
  () => Promise.resolve(),
  () => Promise.resolve(framed),
);

export { mountDiagram };
