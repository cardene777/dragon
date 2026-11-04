/**
 * 印の列の描き方 (#3165、#3348)。
 *
 * 印は枠を初めから見せ、針が目盛りを過ぎた時に塗る。拡大した目盛りの印は、その列で印の列と同じ名札の箱へ線が届いた時に塗る。
 * 印の色を変える出来事は、その時刻に色を重ねる。空きの印は、針が過ぎた時に小さな点を出す。列の名前は左に書く。
 * この file は時間軸の図を描く部品 (`render/time.ts`) だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import { LOOK, TYPE } from "../../look/values";
import { partRadius } from "../../render/corner";
import { esc, r1, write } from "../../render/parts";
import { cs } from "../color/draw";
import type { TimeKit } from "../scale/draw";

/** 印の列ごとの印と、列の名前 */
export function markRows(k: TimeKit): void {
  const T = LOOK.time;
  const { layout, ctx } = k;
  const { m, ink } = ctx;
  for (const row of layout.rows) {
    const parts: string[] = [];
    for (const mark of layout.marks.filter((x) => x.row === row.id)) {
      const rect = (cls: string, extra = ""): string =>
        `<rect class="${cls}" x="${r1(mark.x)}" y="${r1(mark.y)}" width="${r1(mark.w)}" height="${r1(mark.h)}" rx="${partRadius(ctx.corner, T.markRadius)}"${extra}/>`;
      parts.push(rect("dg-tm-slot"));
      if (mark.empty) {
        const shown = k.passed.get(mark.unit);
        if (shown !== undefined) parts.push(`<circle class="dg-tm-x dg-a" cx="${r1(mark.x + mark.w / 2)}" cy="${r1(mark.y + mark.h / 2)}" r="${T.emptyR}" style="${m.vis(shown, m.last, { f: 0.2 })}"/>`);
        continue;
      }
      const shown = k.filled(row.id, mark.unit);
      if (shown !== undefined) parts.push(rect("dg-tm-m dg-a", ` style="${m.vis(shown, m.last, { f: 0.2 })}"`));
      mark.colors.forEach((c, n) => {
        const t = k.at(c.step, c.event);
        if (t === undefined) return;
        const next = mark.colors[n + 1];
        const until = next ? k.at(next.step, next.event) : undefined;
        parts.push(`<g style="${cs(c.color)}">${rect("dg-tm-m dg-a", ` style="${m.vis(t, until ?? m.last, { f: 0.35 })}"`)}</g>`);
      });
    }
    k.base.push(`<g data-row="${esc(row.id)}" style="${cs(row.color)}">${parts.join("")}</g>`);
    k.base.push(write(ink, "dg-tm-rn", LOOK.margin + LOOK.region.inset, row.y + row.h / 2 + LOOK.baseline.mark, row.name, TYPE.timeRow));
  }
}
