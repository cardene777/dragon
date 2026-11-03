/**
 * 箱の描き方 (#3345)。
 *
 * 箱は地と縁の札に名前と下の小さな字を置き、絵柄を持つ箱は名前の上に絵柄を置く。
 * 動く段は縁に色を付け、外側に淡い光を足す。下の小さな字は起きたこと (`note` と `act`) に合わせて書き換わる。
 * 寄って追う時系列図では、窓の上端に名前と下の字の 2 段にした頭の箱を貼る (#3120)。
 */
import { textWidth } from "../../layout/measure";
import type { Rect, SceneBox } from "../../layout/scene";
import { LOOK, MOTION, TYPE } from "../../look/values";
import { ALWAYS, type Ink, type Shown } from "../../render/ink";
import type { Motion } from "../../render/motion";
import { activeKf, type Ctx, esc, r1, rangeKf, write } from "../../render/parts";
import type { Span } from "../../timeline";
import { cs } from "../color/draw";
import { drawsIcon, glyph } from "../icon/draw";

/** 箱の名前 (`name`) と下の字 (`sub`) の基準線の、箱の真ん中からの下がり */
export interface BoxTextY {
  name: number;
  sub: number;
}

/**
 * 図の箱の名前と下の字の基準線を、箱の真ん中からどれだけ下げるか (#3307)。
 * 名前の上の段 (アイコンか置き場の枠) を使う箱が 1 つでもある図は、その段の下に名前を置く高さで全ての箱の名前を揃える。
 * 1 つも無い図は名前を箱の真ん中に置く。置き場の枠はアイコンの無い箱にも同じ段に出るので、真ん中に寄せると名前が枠に重なる。
 * 下の字は名前から同じ間を空けて置き、名前を真ん中に上げた図で下の字だけが下の縁に残らないようにする (#3309)
 */
export const boxTextY = (boxes: readonly { icon?: string; slot?: Rect }[]): BoxTextY =>
  boxes.some((b) => drawsIcon(b.icon) || b.slot !== undefined) ? { name: LOOK.box.nameY, sub: LOOK.box.subY } : { name: LOOK.box.nameMid, sub: LOOK.box.subMid };

/** 箱の下の小さな字の移り変わり。`[時刻, 字, class]` の並びで、最初は元の字。 */
export type SubChange = [number, string, string];

/**
 * 箱の下の小さな字。基準線を `y` に置き、起きたことに合わせて書き換わる。
 * `right` を渡すと、箱の真ん中でなく字の右端を `right` に揃える (列の図の列の右上の字、#3239)
 */
export function subLines(box: SceneBox, m: Motion, changes: SubChange[], y: number, ink?: Ink[], right?: number): string {
  const seq: SubChange[] = [[0, box.sub ?? "", "dg-ss"], ...changes];
  return seq
    .map(([t, text, cls], k) => {
      const next = seq[k + 1]?.[0];
      const anim = k === 0 ? (next === undefined ? "" : m.until(next - MOTION.untilFade)) : next === undefined ? m.rise(t) : m.rise(t, next - MOTION.untilFade);
      if (text === "") return "";
      const shown: Shown[] = [[k === 0 ? 0 : t, next === undefined ? Number.POSITIVE_INFINITY : next - MOTION.untilFade]];
      const style = cls === "dg-ss" ? TYPE.boxSub : TYPE.boxSubStrong;
      const drawn = right === undefined ? write(ink, cls, box.cx, y, text, style, shown, "middle") : write(ink, cls, right - textWidth(text, style), y, text, style, shown);
      return `<g${anim ? ` class="dg-a" style="${anim}"` : ""}>${drawn}</g>`;
    })
    .join("");
}

/** 箱の地と縁。上端 `y` から高さ `h`。動く段 (`act` の間) は縁に色を付け、外側に淡い光を足す。 */
function cardFrame(box: SceneBox, ctx: Ctx, act: string | undefined, y: number, h: number): string {
  const rect = (cls: string, extra = ""): string => `<rect class="${cls}" x="${r1(box.x)}" y="${r1(y)}" width="${r1(box.w)}" height="${h}" rx="${LOOK.box.radius}"${extra}/>`;
  return `${act ? `<g class="dg-a" style="${act}">${rect("dg-halo")}</g>` : ""}${rect("dg-st", ` ${ctx.sh}`)}${act ? `<g class="dg-a" style="${act}">${rect("dg-on")}</g>` : ""}`;
}

/**
 * 箱。動く段は縁に色を付け、外側に淡い光を足す。下の小さな字は起きたことに合わせて書き換わる。
 * `lit` を渡すと、動く段ではなくその間だけ光らせる (状態遷移図の、運ぶ物が乗っている状態)。
 */
export function card(box: SceneBox, ctx: Ctx, on: number[], changes: SubChange[], lit?: Span[]): string {
  const { icon, iconRadius, iconScale, iconY } = LOOK.box;
  const subs = subLines(box, ctx.m, changes, box.cy + ctx.boxText.sub, ctx.ink);
  const act = lit ? (lit.length > 0 ? rangeKf(ctx.m, lit.map((s) => [s.start, s.end])) : undefined) : on.length > 0 ? activeKf(ctx, on) : undefined;
  // 置き場を持つ箱は絵柄を左へ寄せ、右に点線の枠を初めから見せる (#3176)
  const ix = box.iconX ?? box.cx;
  const slot = box.slot ? `<rect class="dg-slot" x="${r1(box.slot.x)}" y="${r1(box.slot.y)}" width="${r1(box.slot.w)}" height="${r1(box.slot.h)}" rx="${LOOK.slot.radius}"/>` : "";
  let mark = "";
  if (drawsIcon(box.icon)) {
    const rect = { x: ix - icon / 2, y: box.cy + iconY - icon / 2, w: icon, h: icon };
    ctx.ink.push({ text: `${box.name} の絵柄`, rect, shown: ALWAYS, boxed: true, part: { kind: "icon", box: box.name } });
    mark = `<rect class="dg-ic" x="${r1(rect.x)}" y="${r1(rect.y)}" width="${icon}" height="${icon}" rx="${iconRadius}"/>${glyph(box.icon, ix, box.cy + iconY, iconScale)}`;
  }
  return (
    `<g style="${cs(box.color)}">${cardFrame(box, ctx, act, box.y, box.h)}` +
    `${slot}${mark}${write(ctx.ink, "dg-sn", box.cx, box.cy + ctx.boxText.name, box.name, TYPE.boxName, ALWAYS, "middle")}${subs}</g>`
  );
}

/**
 * 寄って追う時系列図の窓の上端に貼る頭の箱 (#3120)。図の頭の箱と同じ横の位置と縁で、アイコンを外して名前と下の字の 2 段にする。
 * 携帯の幅では窓が低く、図の頭の箱のままでは窓の高さの 3 割を頭の列が取るため。
 */
export function headCard(box: SceneBox, ctx: Ctx, on: number[], changes: SubChange[]): string {
  const { pad, h, nameY, subY } = LOOK.follow.head;
  const subs = subLines(box, ctx.m, changes, pad + subY);
  const act = on.length > 0 ? activeKf(ctx, on) : undefined;
  return `<g style="${cs(box.color)}">${cardFrame(box, ctx, act, pad, h)}<text class="dg-sn" x="${r1(box.cx)}" y="${r1(pad + nameY)}" text-anchor="middle">${esc(box.name)}</text>${subs}</g>`;
}
