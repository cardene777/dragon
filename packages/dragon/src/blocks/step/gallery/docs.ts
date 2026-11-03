/** 使い方の頁の「段」の節の、段の区切りと本文と命令と見せ方の段落 (#3345) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "steps",
  ja: [
    "段は `step <見出し>` の行で区切り、図はこの単位で 1 段ずつ進む。段の中の行は字下げして書き、その段で起きることを語る `say` の行を必ず書く。本文を 2 行以上に分ける時は、`say` だけの行の下に、さらに深く字下げして続ける。",
    "例の `code pay(1200)` の行のように、`code` の行はその段で打つ命令になる。1 つの段に 1 行まで書ける。",
    "見せ方は最初の行の終わりに `[view: fixed]` か `[view: follow]` を足して選ぶ。`fixed` は全体を止めて中だけを動かし、`follow` は今動いている所へ寄って動かす。書かなければ、全体を枠に収めた時の字の大きさで決まる。",
  ],
  en: [
    "Steps are separated by `step <heading>` lines, and the diagram moves on one step at a time. Indent the lines inside a step, and every step needs a `say` line that tells what happens in it. To split the body over two or more lines, write `say` alone and continue on lines indented further below it.",
    "A `code` line, like the `code pay(1200)` line in the example, is the command for that step. A step can have at most one.",
    "Choose the view by adding `[view: fixed]` or `[view: follow]` at the end of the first line. `fixed` keeps the whole diagram still and moves only what is inside, and `follow` moves to where things are happening. Without it, the view is chosen by the text size when the whole diagram fits the frame.",
  ],
};
