/**
 * 換算の描き方 (#3389、#3398)。
 *
 * `calc` を行う関係者が 2 つ以上の槽を持つ時、最初の 2 つの槽の間に変換器を置き、短い管で両方の槽と結ぶ。
 * 変換器は全ての段に置き、計算した段だけ値の色で光る。入る値と出る値と比率は、その段の吹き出しが大きく書く。
 * この file は配管の図を描く部品 (`render/pipe.ts`) だけが読み、見本帳を開いた時に読む塊に入れない
 */
import type { PipeConverter } from "../../kinds/pipe/layout";
import { PIPE_LOOK } from "../../look/pipe";
import { r1 } from "../../render/parts";
import { cs } from "../color/draw";

/** 変換器の印の大きさの元。印は半径がこの値の時の形で書き、半径に合わせて縮める */
const BASE = PIPE_LOOK.converter.r;

/** 変換器。`attrs` は部品の印 */
export function converter(c: PipeConverter, attrs: string): string {
  const k = c.r / BASE;
  const at = (x: number, y: number): string => `${r1(c.cx + x * k)} ${r1(c.cy + y * k)}`;
  const swirl = `M ${at(-13, -7)} A ${r1(14 * k)} ${r1(14 * k)} 0 0 1 ${at(11, -10)} M ${at(13, 7)} A ${r1(14 * k)} ${r1(14 * k)} 0 0 1 ${at(-11, 10)}`;
  const tips = `M ${at(11, -16)} L ${at(12, -9)} L ${at(5, -10)} Z M ${at(-11, 16)} L ${at(-12, 9)} L ${at(-5, 10)} Z`;
  return (
    `<g${attrs} class="dg-pp-conv${c.active ? " dg-pp-cur" : ""}" style="${cs(c.active ? "amber" : "slate")}">` +
    `<path class="dg-pp-cstub" d="M ${r1(c.left)} ${r1(c.cy)} H ${r1(c.cx - c.r)} M ${r1(c.cx + c.r)} ${r1(c.cy)} H ${r1(c.right)}"/>` +
    `<circle class="dg-pp-cface" cx="${r1(c.cx)}" cy="${r1(c.cy)}" r="${r1(c.r)}"/><path class="dg-pp-cswirl" d="${swirl}"/><path class="dg-pp-ctip" d="${tips}"/></g>`
  );
}
