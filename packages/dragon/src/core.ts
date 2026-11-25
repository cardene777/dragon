/**
 * 種類を登録しない入口 (#3763)。既定の入口 (`index.ts`) と同じ関数を出すが、図の種類を1つも登録しない。
 * package の `exports` に載せず、検査が種類の登録の file (`kind-use/<種類>.ts`) と一緒に読み、使う種類だけを登録する。
 * 既定の入口はこの file を読み、全ての種類と手描きの線と見た目と絵柄集を登録する。
 * 配管の図の決まりの表 (`pipe-rules.ts`) は配管の図の部品を読むので、ここで出すと全ての検査が配管の図の部品へたどり着く。既定の入口だけが出す
 */
import "./kinds/basics";
// 押すと出る札の層を作る処理 (#3877)。全部を持つ入口と、この入口を読む検査は待たずに札を開けるよう、読み込みの時に置く
import "./blocks/pop/cards-all";

export * from "./api";
// 足すブロックの定義を読む関数は全部を持つ入口だけが出す。軽い入口は定義の行を持つ図を読む前に `loadFor` が後から読む (#3399)
export { readBlocks } from "./user-blocks-read";
// 止め絵から流し直す時刻の決まり (Tracelyth #99)。置いた側が自分の再生の釦から流し直す時に、再生の部品と同じ時刻を使う
export { resumeFrom } from "./player";
// 寄って追う形の SVG を画面を開かずに描く (Tracelyth #91)。置いた側が狭い枠の図の全体図の小窓と列の頭の留め方を確かめる
export { type FollowFrame, followSvg } from "./render/draw";
// dragonの記法とHTMLの形、Markdownの頁とHTMLの頁を相互に変換する (#3908)。名前の表と変換の処理は軽い入口と見本帳の最初の画面に入れないため、全部を持つ入口だけが出す
export { type ConvertOptions, diagramToHtml, type FormError, htmlToDiagram, htmlToNotation, notationToHtml } from "./html-form/convert";
export { htmlToMarkdown, markdownToHtml } from "./html-form/page";
