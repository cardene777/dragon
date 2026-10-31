/**
 * 見せ方を字の大きさで選ぶ。
 *
 * 全体を枠の幅へ収めた時の箱の名前の字が 10.5px 以上なら、全体を止めて中だけ動かす (`fixed`)。
 * 下回るなら、動く所へ寄って追い、隅の全体図で今どこかを示す (`follow`)。
 * 枠の高さを渡すと、全体を枠の幅と高さの両方へ収めた時の字で選ぶ (#3047)。高さの決まった置き場で、縦に長い図を縮めすぎないため。
 * 書き手が原本の `view` で決めた時は、字の大きさに関わらずそれに従う。
 */
import { READABLE_PX, TYPE } from "./look/values";
import type { Rendered } from "./render/draw";
import type { ViewMode } from "./schema";

export function chooseView(rendered: Pick<Rendered, "layout" | "view">, frameWidth: number, frameHeight?: number): { mode: ViewMode; textPx: number } {
  const byWidth = Math.max(0, frameWidth) / rendered.layout.width;
  const scale = frameHeight === undefined ? byWidth : Math.min(byWidth, Math.max(0, frameHeight) / rendered.layout.height);
  const textPx = scale * TYPE.boxName.size;
  if (rendered.view) return { mode: rendered.view, textPx };
  return { mode: textPx >= READABLE_PX ? "fixed" : "follow", textPx };
}
