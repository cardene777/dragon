/**
 * 図を描いて動かす部分の検査が共に使う道具 (#2985)。
 *
 * 入口は `@cardenelabs/dragon` (= `dist`) から引く。`diagram-support.ts` の `api()` と同じく、
 * 入口がまだ出ていない時は「出ていない」と判定に出してから止める。
 */
import * as dragon from "@cardenelabs/dragon";
import { expect } from "vitest";

export type Theme = "light" | "dark";
export type ViewMode = "fixed" | "follow";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LaidBox extends Rect {
  id: string;
}

/** 線の名前の札。`step` と `event` は原本の `steps[step].events[event]` を指す。 */
export interface LaidLabel extends Rect {
  step: number;
  event: number;
  text: string;
}

export interface LaidEdge {
  step: number;
  event: number;
  from: string;
  to: string;
  points: [number, number][];
}

/** 箱が自分で行う処理の札。`box` は処理する箱の id。 */
export interface LaidAction extends Rect {
  step: number;
  event: number;
  box: string;
}

/** 段の番号の丸の中心。 */
export interface LaidBadge {
  step: number;
  x: number;
  y: number;
}

/** 時系列図の生存線。`id` は箱の id。 */
export interface LaidLifeline {
  id: string;
  x: number;
}

export interface Layout {
  width: number;
  height: number;
  boxes: LaidBox[];
  labels: LaidLabel[];
  edges: LaidEdge[];
  actions: LaidAction[];
  badges: LaidBadge[];
  lifelines: LaidLifeline[];
}

/** 秒で表した、見えている間。`end` の時刻は含まない。 */
export interface Span {
  start: number;
  end: number;
}

export interface Timeline {
  total: number;
  steps: Span[];
  /** 線を引いている間。`step` と `event` は原本の `steps[step].events[event]` を指す。 */
  edges: (Span & { step: number; event: number })[];
  /** 運ぶ物が見えている間。出発を待つ間と、着いた先で留まる間も含む。 */
  carriers: (Span & { step: number; event: number })[];
  labels: (Span & { step: number; event: number })[];
  badges: { step: number; appears: number }[];
}

export interface Rendered {
  svg: string;
  palette: string;
  theme: Theme;
  view?: ViewMode;
  fonts: { sans: string; mono: string };
  layout: Layout;
  timeline: Timeline;
}

export interface Palette {
  id: string;
  name: string;
  light: Record<string, string>;
  dark: Record<string, string>;
}

export interface Player {
  step: number;
  playing: boolean;
  next(): void;
  prev(): void;
  destroy(): void;
}

/** 描く部品が出す字 (断りの文、全体図の札、読み上げの名前) の言葉 (#3001) */
export type Lang = "ja" | "en";

interface DrawApi {
  PALETTES: Record<string, Palette>;
  FONTS: { sans: string; mono: string };
  resolvePalette(id?: string): Palette;
  renderDiagram(diagram: unknown, options?: { palette?: string; theme?: Theme; lang?: Lang }): Rendered;
  chooseView(rendered: Rendered, frameWidth: number): { mode: ViewMode; textPx: number };
  mountDiagram(host: HTMLElement, diagram: unknown, options?: { palette?: string; theme?: Theme; lang?: Lang }): Player;
}

export function draw<K extends keyof DrawApi>(name: K): DrawApi[K] {
  const value = (dragon as unknown as Partial<DrawApi>)[name];
  expect(value, `${name} が @cardenelabs/dragon から出ていない`).toBeDefined();
  return value as DrawApi[K];
}

/** 2 つの四角の隙間。重なる時は負になる。縦か横のどちらかで離れていれば、その離れ方の大きい方。 */
export function gap(a: Rect, b: Rect): number {
  const dx = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w));
  const dy = Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h));
  return Math.max(dx, dy);
}

/** 最初の段の始まりから最後の段の終わりまでを、`every` 秒ごとに数えた時刻。見本帳の `probe.mjs` と同じ範囲。 */
export function sampleTimes(timeline: Timeline, every = 0.25): number[] {
  const first = timeline.steps[0]?.start ?? 0;
  const last = timeline.steps[timeline.steps.length - 1]?.end ?? first;
  const times: number[] = [];
  for (let t = first; t < last; t += every) times.push(t);
  return times;
}

export const covers = (span: Span, t: number): boolean => span.start <= t && t < span.end;

/** 折れ線のうち一番長い区間。向き (縦か横) と、その区間の座標を返す。 */
export function longestSegment(points: [number, number][]): { vertical: boolean; a: [number, number]; b: [number, number] } {
  const [start = [0, 0], next = start] = points;
  let best = { length: -1, a: start, b: next };
  points.forEach((b, i) => {
    const a = points[i - 1];
    if (!a) return;
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (length > best.length) best = { length, a, b };
  });
  return { vertical: Math.abs(best.b[0] - best.a[0]) < Math.abs(best.b[1] - best.a[1]), a: best.a, b: best.b };
}
