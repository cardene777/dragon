/**
 * 釦の描き方 (#3337、#3348)。
 *
 * 釦は図の上に描かず、再生の部品 (`try-player.ts`) が頁の釦として置く。置き場 (`at`) を書いた釦は、その部品の題の右に重ねて置く。
 * この file は釦を重ねる図の上の所を、並べた部品の題から求める。再生の部品だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import type { TryLayout } from "../../kinds/try/layout";
import { textWidth } from "../../layout/measure";
import { LOOK, TYPE } from "../../look/values";

/** 部品 `part` の題の右の、図の上の釦を置く所 (図の座標)。題を持たない部品は `undefined` */
export function pressSpot(layout: TryLayout, part: string): { x: number; y: number } | undefined {
  const title = [...layout.routes, ...layout.queues, ...layout.chains, ...(layout.logs ?? [])].find((p) => p.id === part)?.title;
  if (!title) return undefined;
  return {
    x: title.x + textWidth(title.text, TYPE.tryTitle),
    y: title.baseline - TYPE.tryTitle.size * LOOK.player.ask.mid,
  };
}
