/**
 * 見せ方を字の大きさで選ぶ。
 *
 * 全体を枠の幅へ収めた時の箱の名前の字が 10.5px 以上なら、全体を止めて中だけ動かす (`fixed`)。
 * 下回るなら、動く所へ寄って追い、隅の全体図で今どこかを示す (`follow`)。
 * 書き手が原本の `view` で決めた時は、字の大きさに関わらずそれに従う。
 */
import { READABLE_PX, TYPE } from "./look/values";
import type { Rendered } from "./render/svg";
import type { ViewMode } from "./schema";

export function chooseView(rendered: Pick<Rendered, "layout" | "view">, frameWidth: number): { mode: ViewMode; textPx: number } {
  const textPx = (Math.max(0, frameWidth) / rendered.layout.width) * TYPE.boxName.size;
  if (rendered.view) return { mode: rendered.view, textPx };
  return { mode: textPx >= READABLE_PX ? "fixed" : "follow", textPx };
}
