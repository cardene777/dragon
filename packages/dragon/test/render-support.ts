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
  /** 箱の名前。時系列図では頭の箱に出る */
  name: string;
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
  /** 運ぶ物が着いた後に寄って留まる所。構成図の線だけが持つ */
  settle?: [number, number];
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

/** 時系列図の生存線。`id` は箱の id。`y1` と `y2` は線の上端と下端。 */
export interface LaidLifeline {
  id: string;
  x: number;
  y1: number;
  y2: number;
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
  /** 最後の段の後に全体を見せ終え、繰り返す前に消え始める時刻 */
  last: number;
  steps: Span[];
  /** 線を引いている間。`step` と `event` は原本の `steps[step].events[event]` を指す。`drawn` で引き終わる */
  edges: (Span & { step: number; event: number; drawn: number })[];
  /** 運ぶ物が見えている間。出発を待つ間と、着いた先で留まる間も含む。`depart` で出発し、`arrive` で線の終わりに着く */
  carriers: (Span & { step: number; event: number; depart: number; arrive: number })[];
  labels: (Span & { step: number; event: number })[];
  badges: { step: number; appears: number }[];
  /** 処理、箱の字の書き換え、中身の帯の値が起きる時刻 */
  events: { step: number; event: number; at: number }[];
  /** 段ごとの止め絵の時刻 */
  stills: number[];
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
  /** 段 `step` (0 から) へ移って止める (#3178) */
  goTo(step: number): void;
  destroy(): void;
}

/** 描く部品が出す字 (断りの文、全体図の札、読み上げの名前) の言葉 (#3001) */
export type Lang = "ja" | "en";

/** 色味に重ねる色の値。鍵は色の変数の名前 (`bg`、`ink`、`c-green` など) (#3198) */
export type Colors = Record<string, string>;

export interface RenderOptions {
  palette?: string;
  colors?: Colors;
  theme?: Theme;
  lang?: Lang;
  /** 最後の段の止め絵に、全ての段の線の名前と箱の中の処理を出す (#3200) */
  still?: boolean;
}

export interface PlayerOptions extends RenderOptions {
  onStep?: (step: number) => void;
  fitHeight?: boolean;
  /** 置いた時に流さず、この段 (0 から) の止め絵で止めて置く (#3200) */
  pausedAt?: number;
  /** 流した時に最後の段の止め絵で止め、繰り返さない (#3200) */
  playOnce?: boolean;
}

interface DrawApi {
  PALETTES: Record<string, Palette>;
  FONTS: { sans: string; mono: string };
  resolvePalette(id?: string): Palette;
  renderDiagram(diagram: unknown, options?: RenderOptions): Rendered;
  chooseView(rendered: Rendered, frameWidth: number): { mode: ViewMode; textPx: number };
  mountDiagram(host: HTMLElement, diagram: unknown, options?: PlayerOptions): Player;
}

export function draw<K extends keyof DrawApi>(name: K): DrawApi[K] {
  const value = (dragon as unknown as Partial<DrawApi>)[name];
  expect(value, `${name} が @cardenelabs/dragon から出ていない`).toBeDefined();
  return value as DrawApi[K];
}

/**
 * bitsumi が CSS で上書きしている 22 色を模した、緑と黒の色の値の組 (#3198)。
 * 地と面と字と線と、6 色の役の線の色と字の色を持ち、影と硬貨と混ぜる割合は持たない。16 進の値に、色の関数で書いた値も混ぜる
 */
export const ARCADE_COLORS: Colors = {
  page: "#050805",
  bg: "#0a0f0a",
  surf: "#101810",
  sunk: "#0c130c",
  ink: "#39ff14",
  ink2: "#2bd40f",
  mute: "#1f9a0b",
  hair: "rgb(57 255 20 / 12%)",
  line: "color-mix(in srgb,#39ff14 40%,transparent)",
  "on-c": "#050805",
  "c-blue": "#22d3ee",
  "t-blue": "#67e8f9",
  "c-amber": "#facc15",
  "t-amber": "#fde047",
  "c-green": "#39ff14",
  "t-green": "#86ff6b",
  "c-violet": "#c084fc",
  "t-violet": "#d8b4fe",
  "c-rose": "#fb7185",
  "t-rose": "#fda4af",
  "c-slate": "#4ade80",
  "t-slate": "#86efac",
};

/** CSS の宣言の並び (`--bg:#fff;--ink:#000`) が書く変数の、名前 (`--` を除く) と値 */
export function cssVars(declarations: string): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const part of declarations.split(";")) {
    const m = /^\s*--([\w-]+)\s*:(.*)$/su.exec(part);
    if (m?.[1] !== undefined && m[2] !== undefined) vars[m[1]] = m[2].trim();
  }
  return vars;
}

/** 描いた SVG が図の名前の class に書く変数 (色と字と 1 周の長さ)。`<style>` の最初の規則から読む */
export function figureVars(svg: string): Record<string, string> {
  const block = /<style>\.dg-[0-9a-z]+\{([^}]*)\}/u.exec(svg)?.[1];
  expect(block, "描いた SVG の style に変数を書く規則が無い").toBeDefined();
  return cssVars(block ?? "");
}

/** 描いた SVG の図の名前の class。同じ頁に置いた図どうしは、この名前で変数と動きを分ける */
export const figureClass = (svg: string): string | undefined => /class="dg (dg-[0-9a-z]+)"/u.exec(svg)?.[1];

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
