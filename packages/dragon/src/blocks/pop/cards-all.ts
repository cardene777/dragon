/**
 * 押すと出る札の層 (#3877) を作る処理を読み込みの時に置く。全部を持つ入口と、頁の再生の script が読む。
 * 軽い入口は読まず、札で見せる図を置いた時に後から読む (`cards-store.ts`)
 */
import { mountNoteCards } from "./cards";
import { registerNoteCards } from "./cards-store";

registerNoteCards(mountNoteCards);
