/**
 * 区画の描き方 (#3345)。
 *
 * 区画は場所か系統を表す横の帯で、名前を左上に絵柄と 2 行まで置き、その下に添え書きを置く。
 */
import type { SceneRegion } from "../../layout/scene";
import { LOOK, TYPE } from "../../look/values";
import type { Ink } from "../../render/ink";
import { r1, write } from "../../render/parts";
import { cs } from "../color/draw";
import { drawsIcon, glyph } from "../icon/draw";

export function band(region: SceneRegion, ink: Ink[]): string {
  const { radius, icon, iconRadius, iconScale, nameY, line } = LOOK.region;
  const { x, y } = region.header;
  const lines = region.lines.map((t, k) => write(ink, "dg-bz", x, region.y + nameY + k * line, t, TYPE.regionName)).join("");
  const note = region.note ? write(ink, "dg-bx", x, region.y + nameY + region.lines.length * line + 1, region.note, TYPE.regionNote) : "";
  const mark = drawsIcon(region.icon) ? `<rect class="dg-bi" x="${r1(x)}" y="${r1(y)}" width="${icon}" height="${icon}" rx="${iconRadius}"/>${glyph(region.icon, x + icon / 2, y + icon / 2, iconScale)}` : "";
  return `<g style="${cs(region.color)}"><rect class="dg-band" x="${r1(region.x + 0.5)}" y="${r1(region.y + 0.5)}" width="${r1(region.w - 1)}" height="${r1(region.h - 1)}" rx="${radius}"/>${mark}${lines}${note}</g>`;
}
