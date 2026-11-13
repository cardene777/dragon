/**
 * 手描きの線 (#3643) に描き替える処理を読み込みの時に置く。全部を持つ入口と、頁の再生の script と、書き出しが読む。
 * 軽い入口は読まず、`loadLine("pen")` を待った時に後から置く
 */
import { penSvg } from "./pen";
import { registerPen } from "./pen-store";

registerPen(penSvg);
