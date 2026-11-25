/**
 * 見せ方を字の大きさで選ぶ。
 *
 * 全体を枠の幅へ収めた時の箱の名前の字が 10.5px 以上なら、全体を止めて中だけ動かす (`fixed`)。
 * 下回るなら、動く所へ寄って追い、隅の全体図で今どこかを示す (`follow`)。
 * 枠の高さを渡すと、全体を枠の幅と高さの両方へ収めた時の字で選ぶ (#3047)。高さの決まった置き場で、縦に長い図を縮めすぎないため。
 * 書き手が原本の `view` で決めた時は、字の大きさに関わらずそれに従う。
 * 寄って追う形にしない種類 (`FIXED_KINDS`) の図は、書き手が寄ると決めても止める (#3852)。
 * 再生の部品と書き出しと全体図の検査は、どれもこの決まりを読む。
 */
import { READABLE_PX, TYPE } from "./look/values";
import type { Rendered } from "./render/draw";
import type { ViewMode } from "./schema";

/**
 * 寄って追う形にしない図の種類。配管の図は図を縮めずに置き、枠より広い時は枠の中を横に送る (#3398)。
 * 寄って追うと窓の端で箱の名前と残高が切れ、全体図に描く部品も持たないので、書き出しも止めた形で書く (#3852)。
 * 判定の表 (#3879) は HTML の表を縮めずに置き、枠より広い時は表の枠の中を横に送るので、寄って追う窓を持たない
 */
const FIXED_KINDS: readonly string[] = ["pipe", "judge"];

/** 枠の幅に依らず全体を止めて見せる図か。書き手が原本で止めると決めた図と、寄って追う形にしない種類の図 */
export function staysFixed(rendered: Pick<Rendered, "layout" | "view">): boolean {
  return rendered.view === "fixed" || FIXED_KINDS.includes(rendered.layout.kind);
}

export function chooseView(rendered: Pick<Rendered, "layout" | "view">, frameWidth: number, frameHeight?: number): { mode: ViewMode; textPx: number } {
  const byWidth = Math.max(0, frameWidth) / rendered.layout.width;
  const scale = frameHeight === undefined ? byWidth : Math.min(byWidth, Math.max(0, frameHeight) / rendered.layout.height);
  const textPx = scale * TYPE.boxName.size;
  if (staysFixed(rendered)) return { mode: "fixed", textPx };
  if (rendered.view) return { mode: rendered.view, textPx };
  return { mode: textPx >= READABLE_PX ? "fixed" : "follow", textPx };
}
