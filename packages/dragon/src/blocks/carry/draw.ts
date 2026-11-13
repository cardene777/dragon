/**
 * 運ぶ物の描き方 (#3345)。
 *
 * 運ぶ物は封筒、値を書いた札、硬貨のどれかの形で線の上を走る。走り出す前は待つ点に居て、
 * 着いた先へ寄って次の同じ主役が出発するまで留まる。いつ見えるかは `timing.ts` が出した間を読む。
 */
import { hasWide, textWidth } from "../../layout/measure";
import { along, carrierHalf, type Point, pathLength, type SceneEdge } from "../../layout/scene";
import { type Corner, LOOK, TYPE } from "../../look/values";
import { partRadius } from "../../render/corner";
import type { Ink } from "../../render/ink";
import { type Ctx, easeInOut, esc, r1 } from "../../render/parts";
import type { CarrierTime } from "./timing";

function carrierShape(e: SceneEdge, sh: string, corner: Corner): string {
  const C = LOOK.carrier;
  if (e.carry.kind === "coin")
    return `<circle class="dg-coin" r="${C.coinR}"/><circle class="dg-coin-in" r="${C.coinIn}"/>`;
  if (e.carry.kind === "tag") {
    const text = e.carry.text;
    const ja = hasWide(text);
    const w = textWidth(text, ja ? TYPE.carrierJa : TYPE.carrier) + C.tagPadX * 2;
    return `<rect class="dg-car" x="${r1(-w / 2)}" y="${-C.tagH / 2}" width="${r1(w)}" height="${C.tagH}" rx="${partRadius(corner, C.tagH / 2)}" ${sh}/><text class="dg-car-t${ja ? " dg-car-tj" : ""}" y="${LOOK.baseline.carrier}" text-anchor="middle">${esc(text)}</text>`;
  }
  return `<rect class="dg-env" x="${-C.envW / 2}" y="${-C.envH / 2}" width="${C.envW}" height="${C.envH}" rx="${partRadius(corner, 3)}" ${sh}/><path class="dg-env-in" d="M -8 -4.5 L 0 1.5 L 8 -4.5"/>`;
}

/**
 * 運ぶ物。走り出す前は待つ点 (`wait`) に居て、そこから線の始まりへ出て線の上を走り、
 * 着いた先 (`settle`) へ寄って、次の同じ主役が出発するまで留まる。
 */
export function carrier(e: SceneEdge, time: CarrierTime, ctx: Ctx): string {
  const { m } = ctx;
  const n = LOOK.carrier.samples;
  const route = e.wait ? [e.wait, ...e.points] : e.points;
  const length = pathLength(route);
  const { depart: a, arrive: b, start: from, end: gone } = time;
  const path: [number, number, number][] = [];
  for (let k = 0; k <= n; k++) {
    const [x, y] = along(route, easeInOut(k / n) * length);
    path.push([a + ((b - a) * k) / n, x, y]);
  }
  const first = path[0] as [number, number, number];
  const lastPoint = path[path.length - 1] as [number, number, number];
  const rest: Point = e.settle ?? [lastPoint[1], lastPoint[2]];
  const pts: [number, number, number][] = [[0, first[1], first[2]], ...path];
  if (e.settle) pts.push([Math.min(b + 0.3, Math.max(gone, b + 0.01)), rest[0], rest[1]]);
  pts.push([gone, rest[0], rest[1]], [m.total, rest[0], rest[1]]);
  // 運ぶ物は、走り出しを待つ間と着いて留まる間を記録する。走っている途中は数えない (#3175, #3176)
  const [hx, hy] = carrierHalf(e.carry);
  const name = e.carry.kind === "tag" ? e.carry.text : e.carry.kind === "coin" ? "硬貨" : "封筒";
  // 札は書き手の字なので部品の種類を持たず、硬貨と封筒は知らせる文の言葉で呼ぶ (#3184)
  const part: Pick<Ink, "part"> =
    e.carry.kind === "tag" ? {} : { part: { kind: e.carry.kind === "coin" ? "coin" : "envelope" } };
  const box = (p: Point) => ({ x: p[0] - hx, y: p[1] - hy, w: hx * 2, h: hy * 2 });
  if (a > from)
    ctx.ink.push({
      text: name,
      rect: box([first[1], first[2]]),
      shown: [[from, a]],
      boxed: true,
      ...part,
    });
  ctx.ink.push({ text: name, rect: box(rest), shown: [[b, gone]], boxed: true, ...part });
  // 次の運ぶ物と入れ替わる時は、重なって 2 つに見えないよう素早く消す
  const fade = gone < m.last ? 0.05 : 0.18;
  return `<g class="dg-a" style="${m.move(pts, m.blink(from + 0.02, gone, fade))}">${carrierShape(e, ctx.sh, ctx.corner)}</g>`;
}
