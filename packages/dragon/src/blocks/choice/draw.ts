/**
 * 判断の描き方 (#3561)。
 *
 * 判断は箱の四角の 4 つの辺の真ん中を頂点にしたひし形で描き、問いをひし形の真ん中に置く。
 * 段で通る本筋に無い箱 (今回は通らない道の先) は、縁を点線にした箱で描く。
 * 箱の光り方は箱の描き方 (`box/draw.ts` の `card`) のままで、縁の形だけをここが描く。点が着いた判断の地の塗り (`dg-fl-reach`) も同じひし形で描く。
 * この file は手順の図の描く部品 (`kinds/flow.ts`) が出し、描く所は手順の図の部品を読んだ時だけ箱の縁の描き方として渡す。見本帳を開いた時に読む塊に入れない
 */
import { diamondPoints, type Rect, type SceneBox } from "../../layout/scene";
import { type Corner, LOOK } from "../../look/values";
import { frameShape } from "../../render/corner";
import { r1 } from "../../render/parts";

/**
 * 手順の図の箱の縁。判断はひし形、本筋に無い箱は縁を点線にした箱で描き、ほかの箱は `undefined` を返して今の箱の形に任せる。
 * `cls` は縁の部品の class (地と縁、光、動く段の縁、着いた判断の地の塗り)、`extra` は後ろに足す属性 (影の filter)
 */
export function flowFrame(box: SceneBox, cls: string, extra: string, rect: Rect, corner: Corner): string | undefined {
  if (box.shape === "diamond") {
    const points = diamondPoints(rect)
      .map(([px, py]) => `${r1(px)},${r1(py)}`)
      .join(" ");
    const dash = box.off && cls === "dg-st" ? ` stroke-dasharray="${LOOK.flow.dash}"` : "";
    return `<polygon class="${cls}" data-shape="diamond" points="${points}"${dash}${extra}/>`;
  }
  if (!box.off || cls !== "dg-st") return undefined;
  const dash = ` stroke-dasharray="${LOOK.flow.dash}"`;
  return frameShape(
    corner,
    ` class="${cls}"${dash}${extra}`,
    rect,
    `<rect class="${cls}" x="${r1(rect.x)}" y="${r1(rect.y)}" width="${r1(rect.w)}" height="${r1(rect.h)}" rx="${LOOK.box.radius}"${dash}${extra}/>`,
  );
}
