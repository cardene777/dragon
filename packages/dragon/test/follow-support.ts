/**
 * 寄って追う図を枠に置き、段ごとに窓が止まった所を読む道具 (#3046、#3118)。
 *
 * jsdom は配置を測れず CSS の動きも進めないので、窓の大きさは窓を切り抜く四角から、窓の位置は中身を動かす keyframes から読む。
 * 置いた図は `releasePlaced` で片付ける。検査の file の `afterEach` に渡す。
 */
import { expect } from "vitest";
import { exampleJson, type Json } from "./diagram-support";
import { sampler } from "./motion-support";
import { draw, type Layout, type Player, type Rect } from "./render-support";

export type Diagramish = { [key: string]: Json };

export interface Placed {
  name: string;
  width: number;
  layout: Layout;
  steps: number;
  figure: SVGSVGElement;
  /** 段 `step` で窓が止まっている時刻 (秒)。次の段の始まりの直前で、最後の段は 1 周の終わりの直前 */
  stillAt(step: number): number;
  /** 部品の性質 `prop` の、時刻 `t` 秒の値 (数の並び)。動かない性質は `undefined` */
  value(el: Element, prop: string, t: number): number[] | undefined;
  /** 部品と、図の中でそれを包む部品の濃さを掛けた、時刻 `t` 秒の見える濃さ (0 から 1) */
  opacity(el: Element, t: number): number;
  /** 段 `step` で窓が止まっている時の、図の上での窓の四角 */
  windowAt(step: number): Rect;
  /** 段 `step` の番号の丸の塗りの中心と半径 */
  badgeAt(step: number): { x: number; y: number; r: number };
}

const players: Player[] = [];

/** 置いた図を片付ける */
export function releasePlaced(): void {
  for (const player of players.splice(0)) player.destroy();
  document.body.innerHTML = "";
}

/** 枠の幅 `width` に寄って追う図を置く。`source` は見本の file の名前か、原本の JSON */
export function place(name: string, source: string | Diagramish, width: number): Placed {
  const host = document.createElement("div");
  Object.defineProperty(host, "clientWidth", { value: width });
  document.body.appendChild(host);
  const diagram = { ...(structuredClone(typeof source === "string" ? exampleJson(source) : source) as Diagramish), view: "follow" };
  players.push(draw("mountDiagram")(host, diagram));
  const svg = host.querySelector<SVGSVGElement>('svg[data-dragon="figure"]');
  expect(svg?.getAttribute("data-view"), `${name} / 枠の幅 ${width}px が寄って追う図にならない`).toBe("follow");
  const figure = svg as SVGSVGElement;
  const { layout, timeline } = draw("renderDiagram")(diagram);
  const value = sampler(figure.outerHTML, timeline.total);
  const clip = figure.querySelector('clipPath[id^="dg-vp-"] rect');
  const camera = figure.querySelector('g[clip-path^="url(#dg-vp-"] > g.dg-a');
  expect(clip, `${name} / 枠の幅 ${width}px に窓を切り抜く四角が無い`).not.toBeNull();
  expect(camera, `${name} / 枠の幅 ${width}px に窓の中身を動かす部品が無い`).not.toBeNull();
  const w = Number(clip?.getAttribute("width"));
  const h = Number(clip?.getAttribute("height"));
  const stillAt = (step: number): number => {
    // 窓は段の始まりから寄り、次の段の始まりまで止まる。最後の段は 1 周の終わりに最初の段へ戻る前まで止まる
    const next = timeline.steps[step + 1];
    return (next ? next.start : timeline.last) - 0.05;
  };
  return {
    name,
    width,
    layout,
    steps: timeline.steps.length,
    figure,
    stillAt,
    value,
    opacity(el, t) {
      let o = 1;
      for (let e: Element | null = el; e && e !== figure; e = e.parentElement) o *= Math.min(1, Math.max(0, value(e, "opacity", t)?.[0] ?? 1));
      return o;
    },
    windowAt(step) {
      const [tx = 0, ty = 0] = value(camera as Element, "transform", stillAt(step)) ?? [];
      return { x: -tx, y: -ty, w, h };
    },
    badgeAt(step) {
      const dot = figure.querySelector(`g.dg-bd[data-step="${step}"] .dg-bdf`);
      expect(dot, `${name} / 枠の幅 ${width}px の段 ${step + 1} に番号の丸が無い`).not.toBeNull();
      const n = (attr: string): number => Number(dot?.getAttribute(attr));
      return { x: n("cx"), y: n("cy"), r: n("r") };
    },
  };
}

/** 四角 `inner` が窓 `win` からはみ出す長さ。全部入る時は 0 */
export function overflow(inner: Rect, win: Rect): number {
  return Math.max(0, win.x - inner.x, inner.x + inner.w - (win.x + win.w), win.y - inner.y, inner.y + inner.h - (win.y + win.h));
}

export const round = (v: number): number => Math.round(v * 100) / 100;
