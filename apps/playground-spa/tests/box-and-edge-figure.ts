/**
 * エディタで **箱と矢印が在る図** を開く共通部 (#1477)。
 *
 * ## なぜ既定の見本に依らないか
 *
 * エディタの既定の見本は順序図で、[#1466](https://github.com/cardene777/dragon/issues/1466) から
 * **1 枚の板** として描かれる。 板は名前と呼び名だけを持つので、箱 (`node-body`) も
 * 名札 (`node-label`) も矢印 (`data-cdl-edge`) も 1 つも出ない。
 *
 * その結果、エディタを開いて箱や線を測る検査が 11 file で「1 つも測れていない」 と落ちていた。
 * 板は記法が意図して選んだ形なので、検査の都合で既定の見本を差し替えることはしない。
 * 代わりに **測りたいものが在る図を名指しする**。
 *
 * ## 記法の作り
 *
 * 3 つを固定している。
 *
 * | 書いたこと | 何のためか |
 * |---|---|
 * | `reveal: all` | 矢印を最初から全部出す。 既定 (`phase`) だと出る本数が観測の瞬間で変わる |
 * | `animation` を 2 段 | 光る箱と光らない箱を両方作る。 光り方で色を変える図では、光っていない側が既定の色 |
 * | 矢印に説明文 | 矢印の座布団 (`edge-label-bg`) を出す。 これも色を測る対象 |
 *
 * 実測で 4 秒のあいだ、光っていない箱 2 / 名札 4 / 線 3 / 光っていない矢印 3 / 座布団 3 が
 * 一定だった。 段が進んでも数が動かないので、観測の瞬間に依らない。
 */
import type { Page } from "@playwright/test";

/** 箱と矢印が在る図の記法。 */
export const 箱と矢印の記法 = `title: "箱と矢印の見本"
type: flow
reveal: all

actors:
  - A
  - B
  - C
  - D

flow:
  - A -> B: "呼ぶ"
  - B -> C: "書く"
  - C -> D: "返す"

animation:
  - step: "1 呼ぶ" 1.2s
    focus: [A, B]
  - step: "2 書く" 1.2s
    focus: [B, C]
`;

/** 記法を URL に載せてエディタへ渡す (`CdlEditor.tsx` の `#s=<base64>`)。 */
export const 記法をURLに載せる = (src: string): string => Buffer.from(src, "utf8").toString("base64");

/**
 * エディタで箱と矢印が在る図を開く。
 *
 * 待ち時間を引数で受けるのは、呼び出し側が測るものによって落ち着くまでの長さが違うため
 * (色を測る側は文字の読込を待つ必要がある)。
 */
export async function 箱と矢印を開く(page: Page, 待ちms = 1500): Promise<void> {
  await page.goto(`editor#s=${記法をURLに載せる(箱と矢印の記法)}`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(待ちms);
}
