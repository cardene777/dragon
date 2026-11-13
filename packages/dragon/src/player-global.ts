/**
 * HTML に書き出した頁へ埋める script の入口。1 file に束ね、`DragonPlayer.mountDiagram` として出す。
 * 書き出した頁は外を読めないので、全ての図の種類の部品と、手描きの線 (#3643) に描き替える処理を持つ (#3248)。
 * 絵柄集の表は持たず、頁に収めた、図が使った絵柄だけを読み込みの時に登録する (#3493)。
 */
import "./kinds/all";
import "./render/pen-all";

import { registerPageIcons } from "./blocks/icon/page-icons";

registerPageIcons(document);

export { mountDiagram } from "./player";
