/**
 * 図の字の並び (#3847)。決める段で本人が選んだ並びで、同梱した字、代わりの字、総称の字の順に並ぶ。
 * 欧文の `Arial` を日本語のゴシックより先に置き、同梱した字の幅で見積もった札から欧文がはみ出しにくくする。
 * 等幅は Chromium が読まない `ui-monospace` を使わず、字の幅が同梱した字に近い等幅の字を並べる
 */
export const SANS_STACK =
  '"Noto Sans JP Variable","Noto Sans JP","Noto Sans CJK JP",Arial,"Hiragino Kaku Gothic ProN","Hiragino Sans","Yu Gothic",Meiryo,sans-serif';
export const MONO_STACK = '"JetBrains Mono Variable","JetBrains Mono",Menlo,Consolas,"Liberation Mono","Courier New",monospace';
