/**
 * 区画、箱、線、線の名前、運ぶ物、段の番号、中身の帯を SVG に描く部品。見本帳の `engine.js` の部品を写す。
 *
 * どの部品も、置き場所は場面 (`layout/scene.ts`) から、いつ見えるかは時刻の表 (`timeline.ts`) から読む。
 * 色は色の役の変数 (`--c` と `--ct`) だけを渡し、値は色味の表が持つ。
 */
import { hasWide, textWidth } from "../layout/measure";
import {
  along,
  type Point,
  pathLength,
  type SceneAction,
  type SceneBadge,
  type SceneBox,
  type SceneEdge,
  type SceneEnd,
  type SceneLabel,
  type ScenePath,
  type SceneRegion,
  type SceneSide,
  type SceneStrip,
} from "../layout/scene";
import { type ColorKey, EASE, LOOK, MOTION, TYPE } from "../look/values";
import type { CarrierTime, EdgeTime, LabelTime, Span, Timeline } from "../timeline";
import { ICONS } from "./icons";
import type { Frame, Motion } from "./motion";

export const esc = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const r1 = (v: number): number => Math.round(v * 100) / 100;

/** 色の役を部品へ渡す変数。 */
export const cs = (k: ColorKey): string => (k === "coin" ? "--c:var(--coin);--ct:var(--coint)" : `--c:var(--c-${k});--ct:var(--t-${k})`);

export function glyph(name: string | undefined, x: number, y: number, scale: number, cls = "dg-gl"): string {
  const d = name === undefined ? undefined : ICONS[name];
  return d ? `<path class="${cls}" transform="translate(${r1(x)} ${r1(y)}) scale(${scale})" d="${d}"/>` : "";
}

export const pathOf = (points: Point[]): string => points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${r1(x)} ${r1(y)}`).join(" ");

/** 矢じり。線の最後の 2 点の向きに開く。 */
export function arrowHead(points: Point[]): string {
  const [ex, ey] = points[points.length - 1] as Point;
  const [px, py] = points[points.length - 2] as Point;
  const len = Math.hypot(ex - px, ey - py) || 1;
  const dx = (ex - px) / len;
  const dy = (ey - py) / len;
  const { arrow: a, arrowHalf: h } = LOOK.edge;
  return `M ${r1(ex - dx * a - dy * h)} ${r1(ey - dy * a + dx * h)} L ${r1(ex)} ${r1(ey)} L ${r1(ex - dx * a + dy * h)} ${r1(ey - dy * a - dx * h)}`;
}

export interface Ctx {
  m: Motion;
  t: Timeline;
  /** 影の filter を付ける属性 */
  sh: string;
  /** 最後の段の終わり */
  end: number;
}

/** 時刻の範囲 `[[a, b], ...]` の間だけ出る。 */
function rangeKf(m: Motion, ranges: [number, number][]): string {
  const pts: Frame[] = [[0, { opacity: 0 }]];
  for (const [a, b] of ranges) pts.push([a, { opacity: 0 }, EASE.out], [a + MOTION.fade, { opacity: 1 }], [b - 0.1, { opacity: 1 }, EASE.inOut], [b + 0.25, { opacity: 0 }]);
  pts.push([m.total, { opacity: 0 }]);
  return m.kf(pts);
}

/** 箱が動く段の並びを、続いた段は 1 つの範囲にまとめて出す。 */
export function activeKf(ctx: Ctx, on: number[]): string {
  const ranges: [number, number][] = [];
  for (let k = 0; k < on.length; ) {
    let e = k;
    while (e + 1 < on.length && on[e + 1] === (on[e] as number) + 1) e++;
    ranges.push([(ctx.t.steps[on[k] as number] as Span).start, (ctx.t.steps[on[e] as number] as Span).end]);
    k = e + 1;
  }
  return rangeKf(ctx.m, ranges);
}

export function band(region: SceneRegion): string {
  const { radius, icon, iconRadius, iconScale, nameY, line } = LOOK.region;
  const { x, y } = region.header;
  const lines = region.lines.map((t, k) => `<text class="dg-bz" x="${r1(x)}" y="${r1(region.y + nameY + k * line)}">${esc(t)}</text>`).join("");
  const note = region.note ? `<text class="dg-bx" x="${r1(x)}" y="${r1(region.y + nameY + region.lines.length * line + 1)}">${esc(region.note)}</text>` : "";
  const mark = region.icon && ICONS[region.icon] ? `<rect class="dg-bi" x="${r1(x)}" y="${r1(y)}" width="${icon}" height="${icon}" rx="${iconRadius}"/>${glyph(region.icon, x + icon / 2, y + icon / 2, iconScale)}` : "";
  return `<g style="${cs(region.color)}"><rect class="dg-band" x="${r1(region.x + 0.5)}" y="${r1(region.y + 0.5)}" width="${r1(region.w - 1)}" height="${r1(region.h - 1)}" rx="${radius}"/>${mark}${lines}${note}</g>`;
}

/** 箱の下の小さな字の移り変わり。`[時刻, 字, class]` の並びで、最初は元の字。 */
export type SubChange = [number, string, string];

/** 箱の下の小さな字。基準線を `y` に置き、起きたことに合わせて書き換わる。 */
function subLines(box: SceneBox, m: Motion, changes: SubChange[], y: number): string {
  const seq: SubChange[] = [[0, box.sub ?? "", "dg-ss"], ...changes];
  return seq
    .map(([t, text, cls], k) => {
      const next = seq[k + 1]?.[0];
      const anim = k === 0 ? (next === undefined ? "" : m.until(next - MOTION.untilFade)) : next === undefined ? m.rise(t) : m.rise(t, next - MOTION.untilFade);
      if (text === "") return "";
      return `<g${anim ? ` class="dg-a" style="${anim}"` : ""}><text class="${cls}" x="${r1(box.cx)}" y="${r1(y)}" text-anchor="middle">${esc(text)}</text></g>`;
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
  const { icon, iconRadius, iconScale, iconY, nameY, subY } = LOOK.box;
  const subs = subLines(box, ctx.m, changes, box.cy + subY);
  const act = lit ? (lit.length > 0 ? rangeKf(ctx.m, lit.map((s) => [s.start, s.end])) : undefined) : on.length > 0 ? activeKf(ctx, on) : undefined;
  const mark =
    box.icon && ICONS[box.icon]
      ? `<rect class="dg-ic" x="${r1(box.cx - icon / 2)}" y="${r1(box.cy + iconY - icon / 2)}" width="${icon}" height="${icon}" rx="${iconRadius}"/>${glyph(box.icon, box.cx, box.cy + iconY, iconScale)}`
      : "";
  return (
    `<g style="${cs(box.color)}">${cardFrame(box, ctx, act, box.y, box.h)}` +
    `${mark}<text class="dg-sn" x="${r1(box.cx)}" y="${r1(box.cy + nameY)}" text-anchor="middle">${esc(box.name)}</text>${subs}</g>`
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

/** 状態遷移図の、どの段も辿り着かない状態。点線の縁で、光らず、字も書き換わらない */
export function ghostCard(box: SceneBox): string {
  const { icon, iconRadius, iconScale, iconY, nameY, subY, radius } = LOOK.box;
  const mark =
    box.icon && ICONS[box.icon]
      ? `<rect class="dg-ic" x="${r1(box.cx - icon / 2)}" y="${r1(box.cy + iconY - icon / 2)}" width="${icon}" height="${icon}" rx="${iconRadius}"/>${glyph(box.icon, box.cx, box.cy + iconY, iconScale)}`
      : "";
  const sub = box.sub ? `<text class="dg-ss" x="${r1(box.cx)}" y="${r1(box.cy + subY)}" text-anchor="middle">${esc(box.sub)}</text>` : "";
  return (
    `<g data-ghost="${esc(box.id)}" style="${cs(box.color)}"><rect class="dg-ghost" x="${r1(box.x)}" y="${r1(box.y)}" width="${r1(box.w)}" height="${box.h}" rx="${radius}"/>` +
    `${mark}<text class="dg-sn" x="${r1(box.cx)}" y="${r1(box.cy + nameY)}" text-anchor="middle">${esc(box.name)}</text>${sub}</g>`
  );
}

/** 状態遷移図の、出た状態の右上の済んだ印。`at` に弾んで出て、繰り返す前に消える */
export function doneMark(box: SceneBox, at: number, ctx: Ctx): string {
  const { r, inset } = LOOK.state.done;
  const x = box.x + box.w - inset;
  const y = box.y + inset;
  return `<g class="dg-popc dg-a" data-done="${esc(box.id)}" style="${cs(box.color)};${ctx.m.pop(at)}"><circle class="dg-done" cx="${r1(x)}" cy="${r1(y)}" r="${r}"/>${glyph("check", x, y, 0.5, "dg-done-ck")}</g>`;
}

/** 状態遷移図の通らない道。点線で道と向きだけを見せ、運ぶ物を走らせない */
export function path(p: ScenePath, color: ColorKey): string {
  const label = p.label
    ? `<text class="dg-path-t${p.label.family === "sans" ? " dg-path-tj" : ""}" x="${r1(p.label.x + LOOK.label.padX)}" y="${r1(p.label.y + p.label.h / 2 + LOOK.baseline.label)}">${esc(p.label.text)}</text>`
    : "";
  return `<g data-path="${esc(`${p.from}->${p.to}`)}" style="${cs(color)}"><path class="dg-path" d="${pathOf(p.points)}"/><path class="dg-path-h" d="${arrowHead(p.points)}"/>${label}</g>`;
}

/** 状態遷移図の脇道の囲み。左上に囲みの名前と添え書きを置く */
export function side(s: SceneSide, color: ColorKey): string {
  const { pad } = LOOK.state.side;
  const title = s.y + pad + TYPE.regionName.size;
  return (
    `<g style="${cs(color)}"><rect class="dg-side" x="${r1(s.x + 0.5)}" y="${r1(s.y + 0.5)}" width="${r1(s.w - 1)}" height="${r1(s.h - 1)}" rx="${LOOK.region.radius}"/>` +
    `<text class="dg-side-t" x="${r1(s.x + pad)}" y="${r1(title)}">${esc(s.title)}</text><text class="dg-side-n" x="${r1(s.x + pad)}" y="${r1(title + LOOK.region.line)}">${esc(s.note)}</text></g>`
  );
}

/** 状態遷移図の始まりと終わりの印。始まりは塗った丸、終わりは輪の中の丸で、脇道の中の終わりは点線の輪 */
export function endMark(e: SceneEnd, color: ColorKey): string {
  const { end } = LOOK.state;
  const text = e.text === "" ? "" : `<text class="dg-mark" x="${r1(e.x + LOOK.state.text)}" y="${r1(e.y + LOOK.baseline.mark)}">${esc(e.text)}</text>`;
  const x = r1(e.x);
  const y = r1(e.y);
  if (e.kind === "start") return `<g data-end="start"><circle class="dg-start" cx="${x}" cy="${y}" r="${e.r}"/>${text}</g>`;
  if (e.ghost) return `<g data-end="finish" style="${cs(color)}"><circle class="dg-end-x" cx="${x}" cy="${y}" r="${e.r}"/><circle class="dg-end-xi" cx="${x}" cy="${y}" r="${end.inner}"/>${text}</g>`;
  return `<g data-end="finish"><circle class="dg-end" cx="${x}" cy="${y}" r="${e.r}"/><circle class="dg-end-in" cx="${x}" cy="${y}" r="${end.inner}"/>${text}</g>`;
}

export function lifeline(x: number, y1: number, y2: number): string {
  return `<line class="dg-ll" x1="${r1(x)}" y1="${r1(y1)}" x2="${r1(x)}" y2="${r1(y2)}"/>`;
}

/**
 * 線。点線で道を見せておき、その段で色の線を引いて、段の終わりまで流れる点で向きを見せる。
 * 済んだ段は薄く残し、最後の段の後に通った道を全て濃くし直す。
 */
export function edge(e: SceneEdge, time: EdgeTime, ctx: Ctx): { base: string; lit: string } {
  const { m } = ctx;
  const d = pathOf(e.points);
  const head = arrowHead(e.points);
  const { start: a, drawn: b, end } = time;
  const tail: Frame[] = [
    [end, { opacity: 1 }, EASE.inOut],
    [end + 0.4, { opacity: 0.45 }],
    [ctx.end + 0.3, { opacity: 0.45 }, EASE.inOut],
    [ctx.end + 1, { opacity: 0.95 }],
    [m.last, { opacity: 0.95 }, EASE.inOut],
    [m.total, { opacity: 0 }],
  ];
  const line = m.kf([
    [0, { opacity: 0, "stroke-dashoffset": 1 }],
    [a, { opacity: 0, "stroke-dashoffset": 1 }, EASE.inOut],
    [a + 0.05, { opacity: 1 }],
    [b, { "stroke-dashoffset": 0 }],
    [m.last, { "stroke-dashoffset": 0 }],
    [m.total, { "stroke-dashoffset": 1 }],
    ...tail,
  ]);
  const hk = m.kf([[0, { opacity: 0 }], [b - 0.05, { opacity: 0 }], [b, { opacity: 1 }], ...tail]);
  const run = -(end - b) * 26;
  const flow = m.kf([
    [0, { opacity: 0, "stroke-dashoffset": 0 }],
    [b, { opacity: 0, "stroke-dashoffset": 0 }],
    [b + 0.25, { opacity: 0.9 }],
    [end - 0.1, { opacity: 0.9 }, EASE.inOut],
    [end + 0.2, { opacity: 0, "stroke-dashoffset": run }],
    [m.total, { opacity: 0, "stroke-dashoffset": run }],
  ]);
  return {
    base: `<path class="dg-e" d="${d}"/><path class="dg-eh" d="${head}"/>`,
    lit: `<g style="${cs(e.color)}"><path class="dg-e-on dg-a" pathLength="1" d="${d}" style="${line}"/><path class="dg-eh-on dg-a" d="${head}" style="${hk}"/><path class="dg-flow dg-a" d="${d}" style="${flow}"/></g>`,
  };
}

/** 線の名前の札。その段の間だけ出し、段の終わりまでに消え終わる。 */
export function label(l: SceneLabel, time: LabelTime, ctx: Ctx): string {
  const ja = l.family === "sans" ? " dg-capj" : "";
  const { radius } = LOOK.label;
  return `<g class="dg-cap${ja} dg-a" style="${cs(l.color)};${ctx.m.rise(time.start, time.end, true)}"><rect x="${r1(l.x)}" y="${r1(l.y)}" width="${r1(l.w)}" height="${l.h}" rx="${radius}"/><text x="${r1(l.x + l.w / 2)}" y="${r1(l.y + l.h / 2 + LOOK.baseline.label)}" text-anchor="middle">${esc(l.text)}</text></g>`;
}

/** 時系列図の箱の中の処理の札。その段の間だけ生存線の上に出す。 */
export function action(a: SceneAction, at: number, until: number, ctx: Ctx): string {
  return `<g class="dg-act dg-a" style="${cs(a.color)};${ctx.m.rise(at, until, true)}"><rect x="${r1(a.x)}" y="${r1(a.y)}" width="${r1(a.w)}" height="${a.h}" rx="${LOOK.action.radius}"/><text x="${r1(a.x + a.w / 2)}" y="${r1(a.y + a.h / 2 + LOOK.baseline.action)}" text-anchor="middle">${esc(a.text)}</text></g>`;
}

function carrierShape(e: SceneEdge, sh: string): string {
  const C = LOOK.carrier;
  if (e.carry.kind === "coin") return `<circle class="dg-coin" r="${C.coinR}"/><circle class="dg-coin-in" r="${C.coinIn}"/>`;
  if (e.carry.kind === "tag") {
    const text = e.carry.text;
    const ja = hasWide(text);
    const w = textWidth(text, ja ? TYPE.carrierJa : TYPE.carrier) + C.tagPadX * 2;
    return `<rect class="dg-car" x="${r1(-w / 2)}" y="${-C.tagH / 2}" width="${r1(w)}" height="${C.tagH}" rx="${C.tagH / 2}" ${sh}/><text class="dg-car-t${ja ? " dg-car-tj" : ""}" y="${LOOK.baseline.carrier}" text-anchor="middle">${esc(text)}</text>`;
  }
  return `<rect class="dg-env" x="${-C.envW / 2}" y="${-C.envH / 2}" width="${C.envW}" height="${C.envH}" rx="3" ${sh}/><path class="dg-env-in" d="M -8 -4.5 L 0 1.5 L 8 -4.5"/>`;
}

const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** 運ぶ物。線の上を走り、着いた先 (`settle`) へ寄って、次の同じ主役が出発するまで留まる。 */
export function carrier(e: SceneEdge, time: CarrierTime, ctx: Ctx): string {
  const { m } = ctx;
  const n = LOOK.carrier.samples;
  const length = pathLength(e.points);
  const { depart: a, arrive: b, start: from, end: gone } = time;
  const path: [number, number, number][] = [];
  for (let k = 0; k <= n; k++) {
    const [x, y] = along(e.points, easeInOut(k / n) * length);
    path.push([a + ((b - a) * k) / n, x, y]);
  }
  const first = path[0] as [number, number, number];
  const lastPoint = path[path.length - 1] as [number, number, number];
  const rest: Point = e.settle ?? [lastPoint[1], lastPoint[2]];
  const pts: [number, number, number][] = [[0, first[1], first[2]], ...path];
  if (e.settle) pts.push([Math.min(b + 0.3, Math.max(gone, b + 0.01)), rest[0], rest[1]]);
  pts.push([gone, rest[0], rest[1]], [m.total, rest[0], rest[1]]);
  // 次の運ぶ物と入れ替わる時は、重なって 2 つに見えないよう素早く消す
  const fade = gone < m.last ? 0.05 : 0.18;
  return `<g class="dg-a" style="${m.move(pts, m.blink(from + 0.02, gone, fade))}">${carrierShape(e, ctx.sh)}</g>`;
}

/** 段の番号。まだ来ていない段は出さず、今の段は塗り、済んだ段は縁取りに変えて番号を読めるまま残す。 */
export function badge(b: SceneBadge, ctx: Ctx): string {
  const { m } = ctx;
  const span = ctx.t.steps[b.step] as Span;
  const a = span.start;
  const e = span.end;
  const { r, ring: rr } = LOOK.badge;
  const fill = m.kf([
    [0, { opacity: 0, transform: "scale(.5)" }],
    [a, { opacity: 0, transform: "scale(.5)" }, EASE.pop],
    [a + 0.35, { opacity: 1, transform: "scale(1)" }],
    [e, { opacity: 1, transform: "scale(1)" }, EASE.inOut],
    [e + 0.4, { opacity: 0, transform: "scale(1)" }],
    [m.total, { opacity: 0, transform: "scale(.5)" }],
  ]);
  const past = m.kf([[0, { opacity: 0 }], [e, { opacity: 0 }, EASE.inOut], [e + 0.4, { opacity: 1 }], [m.last, { opacity: 1 }, EASE.inOut], [m.total, { opacity: 0 }]]);
  const ring = m.kf([
    [0, { opacity: 0, transform: "scale(1)" }],
    [a + 0.05, { opacity: 0, transform: "scale(1)" }],
    [a + 0.1, { opacity: 0.7, transform: "scale(1)" }, EASE.out],
    [a + 0.9, { opacity: 0, transform: "scale(2.3)" }],
    [m.total, { opacity: 0, transform: "scale(1)" }],
  ]);
  const x = r1(b.x);
  const y = r1(b.y);
  const ty = r1(b.y + LOOK.baseline.badge);
  const no = b.step + 1;
  return (
    `<g class="dg-bd" data-step="${b.step}" style="${cs(b.color)}"><circle class="dg-bdr dg-popc dg-a" cx="${x}" cy="${y}" r="${rr}" style="${ring}"/>` +
    `<g class="dg-a" style="${past}"><circle class="dg-bdp" cx="${x}" cy="${y}" r="${rr}"/><text class="dg-bdpt" x="${x}" y="${ty}" text-anchor="middle">${no}</text></g>` +
    `<g class="dg-popc dg-a" style="${fill}"><circle class="dg-bdf" cx="${x}" cy="${y}" r="${r}"/><text class="dg-bdft" x="${x}" y="${ty}" text-anchor="middle">${no}</text></g></g>`
  );
}

/** 中身の帯の 1 欄の移り変わり。値と札は、次の値か札が来るまで出る。 */
export interface FieldChange {
  at: number;
  value?: string;
  tag?: string;
  color: ColorKey;
}

export function strip(s: SceneStrip, changes: Map<string, FieldChange[]>, ctx: Ctx): string {
  const { m, sh } = ctx;
  const S = LOOK.strip;
  const my = s.y + S.h / 2;
  const parts = [
    `<rect class="dg-strip" x="${r1(s.x + 0.5)}" y="${r1(s.y + 0.5)}" width="${r1(s.w - 1)}" height="${r1(s.h - 1)}" rx="${LOOK.region.radius}" ${sh}/>`,
    `<g style="${cs("slate")}"><rect class="dg-bi" x="${r1(s.x + S.pad)}" y="${r1(my - S.icon / 2)}" width="${S.icon}" height="${S.icon}" rx="${LOOK.box.iconRadius}"/>${glyph("env", s.x + S.pad + S.icon / 2, my, 0.78)}</g>`,
    `<text class="dg-sh" x="${r1(s.x + S.titleX)}" y="${r1(my + LOOK.baseline.stripTitle)}">${esc(s.title)}</text>`,
  ];
  s.fields.forEach((field, i) => {
    const prev = s.fields[i - 1];
    if (prev && prev.y === field.y) {
      const sx = field.x - S.fieldGap / 2;
      parts.push(`<line class="dg-sep" x1="${r1(sx)}" y1="${r1(field.y + S.sepInset)}" x2="${r1(sx)}" y2="${r1(field.y + S.h - S.sepInset)}"/>`);
    }
    parts.push(`<text class="dg-fl" x="${r1(field.x)}" y="${r1(field.y + S.nameY)}">${esc(field.name)}</text>`);
    const list = changes.get(field.name) ?? [];
    const values = list.filter((c) => c.value !== undefined);
    const tags = list.filter((c) => c.tag !== undefined);
    values.forEach((c, k) => {
      const next = values[k + 1]?.at;
      const value = c.value as string;
      const anim = next === undefined ? m.rise(c.at) : m.rise(c.at, next - MOTION.untilFade);
      parts.push(`<g class="dg-a" style="${anim}"><text class="${hasWide(value) ? "dg-fvj" : "dg-fv"}" x="${r1(field.x)}" y="${r1(field.y + S.valueY)}">${esc(value)}</text></g>`);
    });
    tags.forEach((c, k) => {
      const next = tags[k + 1]?.at;
      const tag = c.tag as string;
      // 札は、その時に出ている値の右に置く
      const shown = [...values].reverse().find((v) => v.at <= c.at + 1e-9)?.value;
      const x = field.x + (shown ? textWidth(shown, hasWide(shown) ? TYPE.fieldValueJa : TYPE.fieldValue) + S.tagGap : 0);
      const w = textWidth(tag, TYPE.tag) + S.tagPadX * 2;
      const y = field.y + S.valueY - S.tagH / 2 - LOOK.baseline.tag;
      parts.push(
        `<g class="dg-tg dg-popc dg-a" style="${cs(c.color)};${next === undefined ? m.pop(c.at) : m.pop(c.at, next - MOTION.untilFade)}"><rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${S.tagH}" rx="${S.tagH / 2}"/><text x="${r1(x + w / 2)}" y="${r1(y + S.tagH / 2 + LOOK.baseline.tag)}" text-anchor="middle">${esc(tag)}</text></g>`,
      );
    });
  });
  return parts.join("");
}
