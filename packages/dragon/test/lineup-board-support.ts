/**
 * 列の図のボードと流れの線の検査 (#3624) が共に使う図と道具。
 *
 * かんばんの形の最小の図は、ボード (`lineup-board.test.ts`) と流れの線 (`lineup-stations.test.ts`) で同じ箱と札と段を描き比べる。
 * 作業中は 3 枚までで、段 4 で確認係が通知を作業中へ差し戻し、段 5 で急ぎの不具合 (色付き) を足し、段 6 で決済がどの帯からも外れる。
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect } from "vitest";
import { api, type Json } from "./diagram-support";
import type { Motion } from "./motion-support";
import { draw, type Rect, type Rendered } from "./render-support";

export const ROOT = process.cwd();
export const EXAMPLES = join(ROOT, "packages/dragon/examples");
export const LANGS = ["ja", "en"] as const;
export type Lang = (typeof LANGS)[number];

/** 仮名と漢字 */
export const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

export type Point = [number, number];
export type Writing = Rect & { text: string };

export interface Lane extends Rect {
  id: string;
  name: string;
  pool?: boolean;
  limit?: number;
  title: Writing;
  hint?: Writing;
  track: Rect;
  slots?: Rect[];
}

export interface Seat extends Rect {
  id: string;
  lane: string;
  index: number;
  step: number;
  event: number;
  from?: Point;
  number?: Writing;
  tag?: string;
  trace?: boolean;
  path?: Point[];
}

export interface BoardLayout {
  kind: string;
  shape?: string;
  arrangement?: string;
  width: number;
  height: number;
  lanes: Lane[];
  chips: Seat[];
  roles?: (Rect & { id: string })[];
  counts?: (Rect & { lane: string; step: number; text: Writing })[];
  ticks?: (Rect & { lane: string; index: number })[];
  values?: (Rect & { lane: string; step: number; changed: boolean; text: Writing })[];
  ghosts?: (Rect & { id: string; lane: string; step: number; kind: string })[];
  backs?: { id: string; from: string; to: string; step: number; event: number; points: Point[]; label: Rect & { text: Writing } }[];
  arrows?: { from: string; to: string; points: Point[] }[];
  legend?: { color?: string; swatch: Rect; text: Writing }[];
  remarks?: { step: number; lane: string; text: Writing }[];
  headlines?: { step: number; title: Writing; say?: Writing }[];
  stations?: { line: Rect; stops: { lane: string; cx: number; cy: number; r: number }[]; runs: { step: number; from: string; to: string; points: Point[] }[] };
}

export interface BoardRendered extends Omit<Rendered, "layout"> {
  layout: BoardLayout;
}

export interface Source {
  kind: string;
  title: string;
  lineup?: { shape?: string };
  blocks: { box?: { id: string; name: string; limit?: number; order?: string }[]; item?: { id: string }[] };
  steps: { title: string; events: { type: string; box?: string; items?: string[] }[] }[];
}

export const lineEvent = (box: string, items: string[]): Json => ({ type: "line", box, items });
export const noteEvent = (box: string, text: string): Json => ({ type: "swap", box, text });
export const roleEvent = (role: string): Json => ({ type: "role", role });

/** 帯の名札 */
export const TODO = "やること";
export const DOING = "作業中";
export const REVIEW = "確認待ち";
export const DONE = "済み";

/** かんばんの形の最小の図。`shape` を渡すとその見た目で描く */
export function boardLineup(shape?: string): Json {
  return {
    version: 2,
    kind: "lineup",
    title: "作業中を3件に絞る",
    ...(shape === undefined ? {} : { lineup: { shape } }),
    blocks: {
      box: [
        { id: TODO, name: TODO },
        { id: DOING, name: DOING, color: "violet", limit: 3 },
        { id: REVIEW, name: REVIEW, color: "amber", sub: "1日" },
        { id: DONE, name: DONE, color: "green", order: "none" },
      ],
      item: [{ id: "検索" }, { id: "通知" }, { id: "決済" }, { id: "文言" }, { id: "画像" }, { id: "不具合", color: "rose", note: "急ぎの不具合" }],
      role: [
        { id: "開発者", note: "作業中を上から進める" },
        { id: "確認係", note: "仕上がりを確かめる" },
      ],
    },
    steps: [
      { title: "並べる", body: "やることに並べる。", events: [lineEvent(TODO, ["検索", "通知", "決済", "文言", "画像"])] },
      { title: "3件を取る", body: "上から3件を取る。", events: [roleEvent("開発者"), lineEvent(DOING, ["検索", "通知", "決済"]), lineEvent(TODO, ["文言", "画像"])] },
      { title: "確認へ回す", body: "2件を確認へ回す。", events: [roleEvent("開発者"), lineEvent(REVIEW, ["検索", "通知"]), lineEvent(DOING, ["決済"]), noteEvent(REVIEW, "2日")] },
      { title: "差し戻す", body: "通知を作業中へ差し戻す。", events: [roleEvent("確認係"), lineEvent(DONE, ["検索"]), lineEvent(DOING, ["通知", "決済"]), lineEvent(REVIEW, [])] },
      { title: "次を取る", body: "空いた枠に文言を取る。", events: [roleEvent("開発者"), lineEvent(DOING, ["通知", "決済", "文言"]), lineEvent(TODO, ["画像", "不具合"])] },
      { title: "取りやめる", body: "決済を取りやめる。", events: [lineEvent(DOING, ["通知", "文言"])] },
    ],
  };
}

/** 段ごとの帯の札 (最後に書いた line)。段 4 の確認待ちは空 */
export const BOARD_CARDS: Record<string, string[]>[] = [
  { [TODO]: ["検索", "通知", "決済", "文言", "画像"], [DOING]: [], [REVIEW]: [], [DONE]: [] },
  { [TODO]: ["文言", "画像"], [DOING]: ["検索", "通知", "決済"], [REVIEW]: [], [DONE]: [] },
  { [TODO]: ["文言", "画像"], [DOING]: ["決済"], [REVIEW]: ["検索", "通知"], [DONE]: [] },
  { [TODO]: ["文言", "画像"], [DOING]: ["通知", "決済"], [REVIEW]: [], [DONE]: ["検索"] },
  { [TODO]: ["画像", "不具合"], [DOING]: ["通知", "決済", "文言"], [REVIEW]: [], [DONE]: ["検索"] },
  { [TODO]: ["画像", "不具合"], [DOING]: ["通知", "文言"], [REVIEW]: [], [DONE]: ["検索"] },
];

/** 見本の file の中身。無ければ `undefined` */
export const fileText = (name: string): string | undefined => {
  const path = join(EXAMPLES, name);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

/** repo の file の中身。無ければ空 */
export const repoText = (path: string): string => (existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), "utf8") : "");

/** 描いた図。描けなければ断りの文を名指して落とす */
export function render(diagram: Json, lang: Lang = "ja", width?: number): BoardRendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, { lang, ...(width === undefined ? {} : { width }) });
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "列の図を描けない").toBe("");
  return rendered as unknown as BoardRendered;
}

/** 見た目 `shape` の置き場所。その見た目で並べていなければ落とす */
export function shapeOf(rendered: BoardRendered, shape: string, where: string): BoardLayout {
  expect(rendered.layout.shape, `${where} を ${shape} で並べていない (layout.shape)`).toBe(shape);
  return rendered.layout;
}

/** 記法を読んだ原本。読めなければ誤りを名指して落とす */
export function parsed(text: string, lang: Lang, where: string): Json {
  const read = api("parseNotation")(text, { lang });
  expect(read.ok, `${where} が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  return read.ok ? read.diagram : {};
}

export const laneOf = (layout: BoardLayout, id: string): Lane => {
  const lane = layout.lanes.find((l) => l.id === id);
  expect(lane, `帯 ${id} が並べた図に無い`).toBeDefined();
  return lane as Lane;
};

/** 部品の見える濃さ。動きの濃さに、部品と包む部品の `opacity` の属性も掛ける */
export function seenOf(motion: Motion, el: Element, t: number): number {
  let o = motion.opacity(el, t);
  for (let e: Element | null = el; e; e = e.parentElement) {
    const attr = e.getAttribute("opacity");
    if (attr !== null) o *= Number(attr);
  }
  return o;
}

export const partsOf = (motion: Motion, selector: string): Element[] => [...motion.doc.querySelectorAll(selector)];
export const shownAt = (motion: Motion, selector: string, t: number, low = 0.9): Element[] => partsOf(motion, selector).filter((el) => seenOf(motion, el, t) > low);

/** 段 `step` の止め絵の時刻 */
export const stillOf = (rendered: BoardRendered, step: number): number => rendered.timeline.stills[step] ?? 0;

/** 段 `step` の `event` 番目の出来事の時刻。無ければ落とす */
export function timeOf(rendered: BoardRendered, step: number, event: number): { start: number; drawn: number } {
  const time = rendered.timeline.edges.find((e) => e.step === step && e.event === event);
  expect(time, `段 ${step + 1} の ${event + 1} 番目の出来事の時刻が表に無い`).toBeDefined();
  return time as { start: number; drawn: number };
}

/** 札 `id` が段 `step` から帯 `lane` に居る部品の、時刻 `t` の真ん中。部品の四角に動きのずれを足す。札は席に居る間ごとに 1 つの部品なので、段で選ぶ */
export function centerAt(motion: Motion, id: string, lane: string, step: number, t: number): Point {
  const el = motion.doc.querySelector(`[data-lineup-chip="${id}"][data-lineup-on="${lane}"][data-lineup-step="${step}"]`);
  expect(el, `段 ${step + 1} から ${lane} に居る札 ${id} の部品が無い`).not.toBeNull();
  const rect = el?.querySelector("rect");
  const [dx = 0, dy = 0] = (el ? motion.value(el, "transform", t) : undefined) ?? [];
  return [Number(rect?.getAttribute("x")) + Number(rect?.getAttribute("width")) / 2 + dx, Number(rect?.getAttribute("y")) + Number(rect?.getAttribute("height")) / 2 + dy];
}

/** 札 `id` が帯 `lane` へ移る出来事の間の、札の真ん中の動き。21 の時刻で読む */
export function centersDuring(rendered: BoardRendered, motion: Motion, id: string, lane: string, step: number): Point[] {
  const seat = rendered.layout.chips.find((c) => c.id === id && c.lane === lane && c.step === step);
  expect(seat, `段 ${step + 1} の ${lane} の ${id} の席`).toBeDefined();
  const { start, drawn } = timeOf(rendered, step, seat?.event ?? -1);
  return Array.from({ length: 21 }, (_, k) => centerAt(motion, id, lane, step, start + ((drawn - start) * k) / 20));
}

/** 四角どうしが重なるか */
export const overlaps = (a: Rect, b: Rect): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** 四角 `inner` が四角 `outer` の中に在るか */
export const inside = (inner: Rect, outer: Rect): boolean =>
  inner.x >= outer.x - 0.5 && inner.y >= outer.y - 0.5 && inner.x + inner.w <= outer.x + outer.w + 0.5 && inner.y + inner.h <= outer.y + outer.h + 0.5;

/** 段 `step` に帯 `lane` に居る札の席。席の番号の順 */
export function seatsAt(layout: BoardLayout, lane: string, step: number): Seat[] {
  const live = new Map<string, Seat>();
  for (const seat of layout.chips.filter((c) => c.lane === lane && !c.trace && c.step <= step).sort((a, b) => a.step - b.step || a.event - b.event)) live.set(seat.id, seat);
  const want = BOARD_CARDS[step]?.[lane];
  return [...live.values()].filter((s) => (want ? want.includes(s.id) : true)).sort((a, b) => a.index - b.index);
}

/** 記法の行の、注釈と空の行を除いた並び */
export const codeLines = (text: string): string[] =>
  text
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line !== "" && !line.trimStart().startsWith("//"));
