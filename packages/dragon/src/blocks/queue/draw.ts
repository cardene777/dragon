/**
 * 待ち行列の描き方 (#3337、#3348)。
 *
 * 待ち行列の題と枠と、釦が上から何件を取り出すかの字を、動かさずに描く。中で待つチップは入力の帯のブロックの描き方が描く。
 * この file は試す図を描く部品 (`render/try.ts`) だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import { TRY_LOOK } from "../../look/try";
import { TYPE } from "../../look/values";
import { frameShape } from "../../render/corner";
import { esc, r1, write } from "../../render/parts";
import type { TryKit } from "../../render/try";
import { cs } from "../color/draw";

const T = TRY_LOOK;
const B = T.block;

/** 待ち行列ごとの題と枠と、釦が上から何件を取り出すかの字 */
export function queueFrames(k: TryKit): void {
  const { layout, ctx, title, base } = k;
  for (const queue of layout.queues) {
    const placed = layout.parts.find((p) => p.id === queue.id);
    const box = frameShape(
      ctx.corner,
      ` class="dg-try-q"`,
      queue.box,
      `<rect class="dg-try-q" x="${r1(queue.box.x)}" y="${r1(queue.box.y)}" width="${r1(queue.box.w)}" height="${r1(queue.box.h)}" rx="${B.radius}"/>`,
    );
    const hint = queue.hint
      ? write(
          ctx.ink,
          "dg-try-hint",
          queue.hint.x,
          queue.hint.baseline,
          queue.hint.text,
          TYPE.tryHint,
        )
      : "";
    base.push(
      `<g data-part="${esc(queue.id)}" data-most="${placed?.most ?? queue.slots.length}" style="${cs(T.color.part)}">${title(queue.title)}${box}${hint}</g>`,
    );
  }
}
