/**
 * 量の図の項目の描き方と、量の図の部品の描き方が共に使う字の下請け (#3560)。
 *
 * 項目はドーナツなら凡例の行 (色の見本と名前)、横棒なら棒の左の名前で描く。名前は全ての段で同じ所に出したままにする。
 * 字は描いた所と見えている間を字の記録 (`ink`) に残し、`dragon check --layout` と書き出しが字の重なりと枠からのはみ出しを数える。
 * 検査と読み上げの道具が項目を名札で引けるよう、名前の字は `data-chart-name` に項目の名札を持つ。
 * この file は量の図を描く部品 (`render/chart.ts`) だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import type { ChartBarRow, ChartLegendRow, ChartRow } from "../../kinds/chart/layout";
import { textBox } from "../../layout/measure";
import { CHART_LOOK, CHART_TYPE } from "../../look/chart";
import type { TextStyle } from "../../look/values";
import { partRadius } from "../../render/corner";
import { ALWAYS, type Shown } from "../../render/ink";
import { type Ctx, esc, r1 } from "../../render/parts";
import { cs } from "../color/draw";

/**
 * 字を 1 つ描き、字の四角と見えている間を字の記録に残す。`attrs` は字に足す属性 (名札の `data-chart-*`)、
 * `motion` は見えている間の動きの style で、渡すと動く部品の印 (`dg-a`) を付ける
 */
export function chartText(ctx: Ctx, cls: string, x: number, y: number, text: string, style: TextStyle, attrs: string, shown: Shown[] = ALWAYS, anchor?: "start" | "middle", motion?: string): string {
  ctx.ink.push({ text, rect: textBox(text, x, y, style, anchor), shown });
  const anchored = anchor ? ` text-anchor="${anchor}"` : "";
  const moving = motion === undefined ? "" : ` style="${motion}"`;
  return `<text class="${cls}${motion === undefined ? "" : " dg-a"}" x="${r1(x)}" y="${r1(y)}"${anchored}${attrs}${moving}>${esc(text)}</text>`;
}

/** 項目の名札を持つ属性 */
export const itemAttr = (name: string, id: string): string => ` data-chart-${name}="${esc(id)}"`;

/** ドーナツの凡例の 1 行の、色の見本と名前 */
export function legendRow(row: ChartLegendRow, item: ChartRow, ctx: Ctx): string {
  const D = CHART_LOOK.donut;
  const s = row.swatch;
  return (
    `<rect class="dg-ch-sw" x="${r1(s.x)}" y="${r1(s.y)}" width="${r1(s.w)}" height="${r1(s.h)}" rx="${partRadius(ctx.corner, D.swatchRadius)}" style="${cs(item.color)}"/>` +
    chartText(ctx, "dg-ch-n", row.name.x, row.name.y, item.name, CHART_TYPE.name, itemAttr("name", item.id))
  );
}

/** 横棒の左の名前。字の四角の左端と基準線は並べ方が決めた */
export function barName(bar: ChartBarRow, item: ChartRow, ctx: Ctx): string {
  const baseline = bar.name.y + CHART_TYPE.name.size * 0.8;
  return chartText(ctx, "dg-ch-n", bar.name.x, baseline, item.name, CHART_TYPE.name, itemAttr("name", item.id));
}
