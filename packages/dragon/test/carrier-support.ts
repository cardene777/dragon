/**
 * 描いた図の運ぶ物と箱の部品を、SVG と動きから読む道具 (#3176)。
 *
 * 運ぶ物の位置は、keyframes を時刻を指して読む (`motionOf`)。置き場所の計算ではなく、画面に見える位置で確かめるため。
 * 箱の絵柄と置き場の枠は、箱の名前の字を持つ部品の中の四角 (`dg-ic` と `dg-slot`) から読む。
 */
import { LOOK } from "../src/look/values";
import type { Motion } from "./motion-support";
import type { LaidEdge, Rect } from "./render-support";

/** 描いた運ぶ物と、それが走る線と、見えている間 */
export interface Carried {
  g: Element;
  /** 運ぶ物の半分の幅と高さ */
  half: [number, number];
  edge: LaidEdge;
  step: number;
  start: number;
  depart: number;
  arrive: number;
  end: number;
}

/** 箱の部品。`slot` は置き場の枠、`nameTop` は名前の字の上端 */
export interface Card {
  id: string;
  name: string;
  cx: number;
  icon?: Rect;
  slot?: Rect;
  nameTop: number;
}

const num = (el: Element, attr: string): number => Number(el.getAttribute(attr));
const rectOf = (el: Element | null): Rect | undefined => (el ? { x: num(el, "x"), y: num(el, "y"), w: num(el, "width"), h: num(el, "height") } : undefined);

/** 2 つの四角が `pad` より近いか重なる */
export const overlap = (a: Rect, b: Rect, pad = 0): boolean => a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;

/** 段の番号の丸を囲む四角 */
export const badgeRect = (b: { x: number; y: number }): Rect => ({ x: b.x - LOOK.badge.r, y: b.y - LOOK.badge.r, w: LOOK.badge.r * 2, h: LOOK.badge.r * 2 });

/** 描いた運ぶ物を、線の順に、走る線と見えている間と組にする */
export function carried(m: Motion): Carried[] {
  const { layout, timeline } = m.rendered;
  const shapes = [...new Set([...m.doc.querySelectorAll(".dg-coin, .dg-car, .dg-env")].map((el) => el.parentElement as Element))];
  const spans = timeline.carriers.filter((c) => layout.edges.some((e) => e.step === c.step && e.event === c.event));
  if (shapes.length !== spans.length) throw new Error(`運ぶ物の部品 ${shapes.length} 個と時刻 ${spans.length} 件が合わない`);
  return spans.map((c, i) => {
    const g = shapes[i] as Element;
    const coin = g.querySelector(".dg-coin");
    const body = g.querySelector(".dg-car, .dg-env");
    const half: [number, number] = coin ? [num(coin, "r"), num(coin, "r")] : [num(body as Element, "width") / 2, num(body as Element, "height") / 2];
    const edge = layout.edges.find((e) => e.step === c.step && e.event === c.event) as LaidEdge;
    return { g, half, edge, step: c.step, start: c.start, depart: c.depart, arrive: c.arrive, end: c.end };
  });
}

/** 時刻 `t` 秒の運ぶ物の四角 */
export function carrierRect(m: Motion, c: Carried, t: number): Rect {
  const [x = Number.NaN, y = Number.NaN] = m.value(c.g, "transform", t) ?? [];
  return { x: x - c.half[0], y: y - c.half[1], w: c.half[0] * 2, h: c.half[1] * 2 };
}

/** 箱 `id` の部品。箱の名前の字を持つ部品の中から絵柄と置き場の枠を読む */
export function cardOf(m: Motion, id: string): Card | undefined {
  const box = m.rendered.layout.boxes.find((b) => b.id === id);
  if (!box) return undefined;
  const text = [...m.doc.querySelectorAll("text.dg-sn")].find((t) => t.textContent === box.name);
  const g = text?.parentElement;
  if (!text || !g) return undefined;
  const icon = rectOf(g.querySelector("rect.dg-ic"));
  const slot = rectOf(g.querySelector("rect.dg-slot"));
  return { id, name: box.name, cx: box.x + box.w / 2, ...(icon ? { icon } : {}), ...(slot ? { slot } : {}), nameTop: num(text, "y") - 13 * 0.8 };
}

/** 状態 `id` の右上の済んだ印を囲む四角 */
export function doneRect(m: Motion, id: string): Rect | undefined {
  const circle = m.doc.querySelector(`g[data-done="${id}"] circle.dg-done`);
  if (!circle) return undefined;
  const r = num(circle, "r");
  return { x: num(circle, "cx") - r, y: num(circle, "cy") - r, w: r * 2, h: r * 2 };
}

/** 運ぶ物が出発を待つ時刻。待つ間が無ければ `undefined` */
export const waiting = (c: Carried): number | undefined => (c.depart - c.start > 0.05 ? (c.start + c.depart) / 2 : undefined);
