/**
 * 凡例の描き方 (#3351、#3348)。
 *
 * 図の下に説明ごとに 1 行を置き、行の左に色の枠の見本を置く。説明を持つチップが無い図には描かない。
 * この file は列の図を描く部品 (`render/lineup.ts`) だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import type { LineupLegendRow } from "../../kinds/lineup/layout";
import { TYPE } from "../../look/values";
import { LINEUP_LOOK } from "../../look/lineup";
import { partRadius } from "../../render/corner";
import type { Ctx } from "../../render/parts";
import { cs } from "../color/draw";
import { lines, rect } from "../item/draw";

/** 凡例の行 `rows` の全て。行が無ければ何も描かない */
export function legend(rows: readonly LineupLegendRow[], ctx: Ctx): string {
  if (rows.length === 0) return "";
  const radius = partRadius(ctx.corner, LINEUP_LOOK.chip.radius) / 2;
  return `<g data-lineup-legend="">${rows
    .map(
      (row) =>
        `<g data-lineup-legend-row=""${row.color ? ` style="${cs(row.color)}"` : ""}>${rect(row.color ? "dg-ln-sw" : "dg-ln-sw0", row.swatch, radius)}${lines(ctx, "dg-ln-lg", row.text, TYPE.legend)}</g>`,
    )
    .join("")}</g>`;
}
