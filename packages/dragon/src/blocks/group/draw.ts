/**
 * 区画の描き方 (#3345)。
 *
 * 区画は場所か系統を表す横の帯で、名前を左上に絵柄と 2 行まで置き、その下に添え書きを置く。
 */
import type { SceneRegion } from "../../layout/scene";
import { type Corner, LOOK, TYPE } from "../../look/values";
import { frameShape, partRadius } from "../../render/corner";
import type { Ink } from "../../render/ink";
import { r1, write } from "../../render/parts";
import { cs } from "../color/draw";
import { drawsIcon, glyph } from "../icon/draw";

/** 区画を描く。`corner` は色味の角の形で、角を落とす色味では帯の右上と左下を落とし、絵柄の枠を丸めない (#3344) */
export function band(region: SceneRegion, ink: Ink[], corner: Corner): string {
  const { radius, icon, iconRadius, iconScale, nameY, line } = LOOK.region;
  const { x, y } = region.header;
  const lines = region.lines
    .map((t, k) => write(ink, "dg-bz", x, region.y + nameY + k * line, t, TYPE.regionName))
    .join("");
  const note = region.note
    ? write(
        ink,
        "dg-bx",
        x,
        region.y + nameY + region.lines.length * line + 1,
        region.note,
        TYPE.regionNote,
      )
    : "";
  const mark = drawsIcon(region.icon)
    ? `<rect class="dg-bi" x="${r1(x)}" y="${r1(y)}" width="${icon}" height="${icon}" rx="${partRadius(corner, iconRadius)}"/>${glyph(region.icon, x + icon / 2, y + icon / 2, iconScale)}`
    : "";
  const frame = frameShape(
    corner,
    ' class="dg-band"',
    { x: region.x + 0.5, y: region.y + 0.5, w: region.w - 1, h: region.h - 1 },
    `<rect class="dg-band" x="${r1(region.x + 0.5)}" y="${r1(region.y + 0.5)}" width="${r1(region.w - 1)}" height="${r1(region.h - 1)}" rx="${radius}"/>`,
  );
  return `<g style="${cs(region.color)}">${frame}${mark}${lines}${note}</g>`;
}
