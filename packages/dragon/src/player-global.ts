/**
 * HTML に書き出した頁へ埋める script の入口。1 file に束ね、`DragonPlayer.mountDiagram` として出す。
 * 書き出した頁は外を読めないので、全ての図の種類の部品を持つ (#3248)。
 */
import "./kinds/all";

export { mountDiagram } from "./player";
