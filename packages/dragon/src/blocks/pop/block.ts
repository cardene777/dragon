/**
 * 押すと出る札のブロック (#3877)。
 *
 * 図の1行目に `[note: pop]` を書くと、箱の行の `note` を名前の下の字でなく、押すと箱のすぐ下に出る札で見せる。
 * `note` を持つ箱は右上に丸い i の印を持ち、札は箱の名前と `note` の全文と、箱の行に `[example: <例>]` を書いた時だけ灰色の帯の例を持つ。
 * `[note: under]` は名前の下の字で見せ、書かない図も同じ。Markdown の頁は上の設定の行の `note: pop` で頁の全ての図の既定にできる。
 * 印は図の種類の行と箱の行の属性で行の頭の語を持たないので、図の種類の行は記法を読む処理が、箱の行は箱のブロックが読む。
 * 札で見せられるのは、箱の処理 (`act`) と同じく箱の札を描く図の種類で、箱の札を描かない列の図と配管の図と輪の図と流れの量の図を付け方の `except` に書く。
 * 時間軸の図は拡大の帯の列ごとに同じ箱を描くので、列ごとの箱に印を描く (`blocks/zoom/draw.ts`)。
 */
import type { Block } from "../block";

/** 図の1行目の `note` に書ける値。`pop` は札で見せ、`under` は名前の下の字で見せる */
export const NOTE_MODES = ["pop", "under"] as const;
export type NoteMode = (typeof NOTE_MODES)[number];

export const block: Block = {
  name: "pop",
  rank: 160,
  attach: { how: "attach-to-box", except: ["lineup", "pipe", "cycle", "sankey"] },
  words: { attrs: { diagram: ["note"], box: ["example"] } },
};
