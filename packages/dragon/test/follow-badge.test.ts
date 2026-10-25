// @vitest-environment jsdom
/**
 * 寄って追う図で、今の段の番号の丸を窓に入れる (#3046)。
 *
 * 窓は、その段で動く物を全部囲んだ範囲の真ん中へ寄る。範囲が窓より大きい段では、範囲の端に在る番号の丸が窓から外れていた。
 * 丸が外れる段だけ、丸を起点に、丸に近い動く物から順に窓に収まる間だけ囲み、その真ん中へ寄せる。
 * jsdom は配置を測れず CSS の動きも進めないので、窓の大きさは窓を切り抜く四角から、窓の位置は中身を動かす keyframes から読む。
 */
import { afterEach, describe, expect, it } from "vitest";
import { exampleJson, type Json } from "./diagram-support";
import { sampler } from "./motion-support";
import { draw, type Layout, type Player, type Rect } from "./render-support";

type Diagramish = { [key: string]: Json };

/** 時系列図と構成図の見本 */
const SAMPLES = [
  ["oauth", "oauth.json"],
  ["ccip", "ccip.json"],
] as const;
/** 編集画面の幅 390px (携帯) と 860px (記法と並べた時) の、図の枠の幅 */
const WIDTHS = [390, 560] as const;
/**
 * 寄り方を変える前 (`ba9784a2`) に丸が窓に全部見えていた段と、その時の窓の左上 (図の上の位置)。
 * 丸が外れない段は寄り方を変えないので、この位置のまま残る。`見本/枠の幅` ごとに `[段, x, y]` を並べる
 */
const KEPT: Record<string, [number, number, number][]> = {
  "oauth/390": [
    [1, 0, 0],
    [2, 99.5, 28],
    [3, 35, 105],
    [4, 36.5, 225],
    [5, 36.5, 345],
    [6, 103.55, 437],
    [7, 115, 486],
    [8, 252, 550],
    [10, 185.75, 663],
  ],
  "oauth/560": [
    [1, 0, 0],
    [2, 82.89, 0],
    [3, 18.39, 55],
    [4, 19.89, 175],
    [5, 19.89, 295],
    [6, 86.95, 387],
    [7, 98.39, 436],
    [8, 235.39, 500],
    [10, 169.14, 613],
  ],
  "ccip/390": [
    [1, 119.79, 0],
    [2, 392.58, 0],
    [3, 525.57, 0],
    [4, 648.06, 0],
    [5, 493.57, 0],
    [6, 525.57, 24],
    [7, 525.57, 83],
    [8, 403.45, 142],
    [9, 123.17, 142],
    [10, 9.7, 201.5],
    [11, 0, 251],
  ],
  "ccip/560": [
    [1, 34.79, 0],
    [2, 307.58, 0],
    [3, 440.57, 0],
    [4, 496.28, 0],
    [5, 408.57, 0],
    [6, 440.57, 0],
    [7, 440.57, 33],
    [8, 318.45, 92],
    [9, 38.17, 92],
    [10, 0, 151],
    [11, 0, 151],
    [12, 181.04, 151],
  ],
};

const players: Player[] = [];
afterEach(() => {
  for (const player of players.splice(0)) player.destroy();
  document.body.innerHTML = "";
});

interface Placed {
  name: string;
  width: number;
  layout: Layout;
  steps: number;
  /** 段 `step` で窓が止まっている時の、図の上での窓の四角 */
  windowAt(step: number): Rect;
  /** 段 `step` の番号の丸の塗りの中心と半径 */
  badgeAt(step: number): { x: number; y: number; r: number };
}

/** 枠の幅 `width` に寄って追う図を置く */
function place(name: string, file: string, width: number): Placed {
  const host = document.createElement("div");
  Object.defineProperty(host, "clientWidth", { value: width });
  document.body.appendChild(host);
  const diagram = { ...(structuredClone(exampleJson(file)) as Diagramish), view: "follow" };
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
  return {
    name,
    width,
    layout,
    steps: timeline.steps.length,
    windowAt(step) {
      // 窓は段の始まりから寄り、次の段の始まりまで止まる。最後の段は 1 周の終わりに最初の段へ戻る前まで止まる
      const next = timeline.steps[step + 1];
      const t = (next ? next.start : timeline.last) - 0.05;
      const [tx = 0, ty = 0] = value(camera as Element, "transform", t) ?? [];
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
function overflow(inner: Rect, win: Rect): number {
  return Math.max(0, win.x - inner.x, inner.x + inner.w - (win.x + win.w), win.y - inner.y, inner.y + inner.h - (win.y + win.h));
}

const round = (v: number): number => Math.round(v * 100) / 100;

describe("寄って追う図で今の段の番号の丸を窓に入れる (#3046)", () => {
  it("follow-window-shows-step-badge", () => {
    const out: string[] = [];
    for (const [name, file] of SAMPLES) {
      for (const width of WIDTHS) {
        const placed = place(name, file, width);
        for (let s = 0; s < placed.steps; s++) {
          const b = placed.badgeAt(s);
          const over = overflow({ x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 }, placed.windowAt(s));
          if (over > 0.01) out.push(`${name} / 枠の幅 ${width}px / 段 ${s + 1} の丸が窓から ${round(over)}px 外れる`);
        }
      }
    }
    expect(out, "番号の丸が窓から外れる段").toEqual([]);
  });

  it("follow-window-keeps-fitting-steps", () => {
    const moved: string[] = [];
    for (const [name, file] of SAMPLES) {
      for (const width of WIDTHS) {
        const placed = place(name, file, width);
        const kept = KEPT[`${name}/${width}`] ?? [];
        expect(kept.length, `${name} / 枠の幅 ${width}px の丸が見えていた段が無い`).toBeGreaterThan(0);
        for (const [step, x, y] of kept) {
          const win = placed.windowAt(step - 1);
          if (Math.abs(win.x - x) > 0.01 || Math.abs(win.y - y) > 0.01) moved.push(`${name} / 枠の幅 ${width}px / 段 ${step} の窓が (${x}, ${y}) から (${round(win.x)}, ${round(win.y)}) へ動いた`);
        }
      }
    }
    expect(moved, "丸が見えていた段で窓が動いた").toEqual([]);
  });

  it("follow-window-holds-badge-neighbors", () => {
    const out: string[] = [];
    for (const width of WIDTHS) {
      // ccip の段 13 の最初の線は OffRamp から出る。丸はその始まりに在り、OffRamp の箱が丸の隣になる
      const ccip = place("ccip", "ccip.json", width);
      const offRamp = ccip.layout.boxes.find((b) => b.id === "OffRamp");
      expect(offRamp, "ccip に OffRamp の箱が無い").toBeDefined();
      const over = overflow(offRamp as Rect, ccip.windowAt(12));
      if (over > 0.01) out.push(`ccip / 枠の幅 ${width}px / 段 13 の OffRamp の箱が窓から ${round(over)}px 外れる`);
      // oauth の段 9、11、12 は、書き換わる頭の箱が図の上端に、線が図の下の方に在り、両方は窓に入らない。丸の側の線を入れる
      const oauth = place("oauth", "oauth.json", width);
      for (const s of [8, 10, 11]) {
        const win = oauth.windowAt(s);
        const edges = oauth.layout.edges.filter((e) => e.step === s);
        expect(edges.length, `oauth の段 ${s + 1} に線が無い`).toBeGreaterThan(0);
        for (const e of edges) {
          for (const [x, y] of [e.points[0], e.points[e.points.length - 1]] as [number, number][]) {
            const o = overflow({ x, y, w: 0, h: 0 }, win);
            if (o > 0.01) out.push(`oauth / 枠の幅 ${width}px / 段 ${s + 1} の線の端 (${x}, ${y}) が窓から ${round(o)}px 外れる`);
          }
        }
      }
    }
    expect(out, "丸の近くの物が窓から外れる").toEqual([]);
  });
});
