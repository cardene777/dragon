/**
 * 区画、箱、段の番号と、線の道の形を SVG に描く部品。見本帳の `engine.js` の部品を写す。
 *
 * どの部品も、置き場所は場面 (`layout/scene.ts`) から、いつ見えるかは時刻の表 (`timeline.ts`) から読む。
 * 色は色の役の変数 (`--c` と `--ct`) だけを渡し、値は色味の表が持つ。
 * ブロックの置き場へ移した部品の描き方は `blocks/<名前>/draw.ts` が持ち、この file の下請け (`esc`、`cs`、`r1`、`write` など) を読む (#3345)。
 */
import { textBox, textWidth } from "../layout/measure";
import {
  markText,
  type Point,
  type Rect,
  type SceneBadge,
  type SceneBox,
  type SceneEnd,
  type ScenePath,
  type SceneRegion,
  type SceneSide,
} from "../layout/scene";
import { type ColorKey, EASE, LOOK, MOTION, type TextStyle, TYPE } from "../look/values";
import type { Span, Timeline } from "../timeline";
import { ICONS } from "./icons";
import { ALWAYS, type Ink, type Shown, type Trace } from "./ink";
import type { Frame, Motion } from "./motion";

export const esc = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/** 箱の飛び先 (#3199)。飛び先を持つ箱の札を、その飛び先への link で包む */
export const linkTo = (link: string | undefined, markup: string): string => (link === undefined ? markup : `<a href="${esc(link)}">${markup}</a>`);
/** 座標を小数 2 桁に丸める。ブロックの描き方 (`blocks/<名前>/draw.ts`) も同じ丸めで書く */
export const r1 = (v: number): number => Math.round(v * 100) / 100;

/** 色の役を部品へ渡す変数。 */
export const cs = (k: ColorKey): string => (k === "coin" ? "--c:var(--coin);--ct:var(--coint)" : `--c:var(--c-${k});--ct:var(--t-${k})`);

export function glyph(name: string | undefined, x: number, y: number, scale: number, cls = "dg-gl"): string {
  const d = name !== undefined && drawsIcon(name) ? ICONS[name] : undefined;
  return d ? `<path class="${cls}" transform="translate(${r1(x)} ${r1(y)}) scale(${scale})" d="${d}"/>` : "";
}

/**
 * 絵柄を 1 つだけ描いた SVG (#3172)。見本帳の部品「絵」の頁が、使える絵柄を並べる時に使う。
 * 線の太さは箱の印と同じ割合 (印の線の太さ × 印の縮み) で、色は置いた所の字の色 (`currentColor`) を使う。知らない名前は `undefined`
 */
export function iconSvg(name: string): string | undefined {
  if (!Object.hasOwn(ICONS, name)) return undefined;
  const width = LOOK.stroke.glyph * LOOK.box.iconScale;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -12 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[name]}"/></svg>`;
}

/** 点を辿る線。曲がる所は共通の値の表の半径 (`LOOK.edge.bend`) で丸め、直角の角を作らない (#3171)。 */
export function pathOf(points: Point[]): string {
  const pts = points.filter((p, i) => i === 0 || p[0] !== (points[i - 1] as Point)[0] || p[1] !== (points[i - 1] as Point)[1]);
  const [x0, y0] = pts[0] as Point;
  let d = `M ${r1(x0)} ${r1(y0)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i - 1] as Point;
    const [bx, by] = pts[i] as Point;
    const [cx, cy] = pts[i + 1] as Point;
    const l1 = Math.hypot(bx - ax, by - ay);
    const l2 = Math.hypot(cx - bx, cy - by);
    const a = Math.min(LOOK.edge.bend, l1 / 2, l2 / 2);
    d += ` L ${r1(bx - ((bx - ax) / l1) * a)} ${r1(by - ((by - ay) / l1) * a)} Q ${r1(bx)} ${r1(by)} ${r1(bx + ((cx - bx) / l2) * a)} ${r1(by + ((cy - by) / l2) * a)}`;
  }
  if (pts.length > 1) {
    const [lx, ly] = pts[pts.length - 1] as Point;
    d += ` L ${r1(lx)} ${r1(ly)}`;
  }
  return d;
}

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
  /** 図の名前。図の中の定義 (影の filter、封の縞) の名札に使う */
  id: string;
  /** 影の filter を付ける属性 */
  sh: string;
  /** 最後の段の終わり */
  end: number;
  /** 描いた字の記録 (#3175) */
  ink: Ink[];
  /** 描いた線の記録 (#3175)。札を持たない字を横切る線を数える */
  traces: Trace[];
  /** 箱の名前と下の字の基準線を、箱の真ん中からどれだけ下げるか (`boxTextY`) */
  boxText: BoxTextY;
}

/** 箱の名前 (`name`) と下の字 (`sub`) の基準線の、箱の真ん中からの下がり */
export interface BoxTextY {
  name: number;
  sub: number;
}

/** 絵柄を描ける名前か。`ICONS` の継いだ鍵 (`constructor` など) は描けない名前に数える */
export const drawsIcon = (name: string | undefined): boolean => name !== undefined && Object.hasOwn(ICONS, name);

/**
 * 図の箱の名前と下の字の基準線を、箱の真ん中からどれだけ下げるか (#3307)。
 * 名前の上の段 (アイコンか置き場の枠) を使う箱が 1 つでもある図は、その段の下に名前を置く高さで全ての箱の名前を揃える。
 * 1 つも無い図は名前を箱の真ん中に置く。置き場の枠はアイコンの無い箱にも同じ段に出るので、真ん中に寄せると名前が枠に重なる。
 * 下の字は名前から同じ間を空けて置き、名前を真ん中に上げた図で下の字だけが下の縁に残らないようにする (#3309)
 */
export const boxTextY = (boxes: readonly { icon?: string; slot?: Rect }[]): BoxTextY =>
  boxes.some((b) => drawsIcon(b.icon) || b.slot !== undefined) ? { name: LOOK.box.nameY, sub: LOOK.box.subY } : { name: LOOK.box.nameMid, sub: LOOK.box.subMid };

/** 和文を含む字の、和文の字で描く時の字の形 */
export const sansOf = (t: TextStyle): TextStyle => ({ ...t, family: "sans" });

/**
 * 字を 1 つ描き、字の四角と見えている間を `ink` に記録する (#3175)。`ink` を渡さない字 (寄って追う窓の頭の列) は記録しない。
 * `anchor` を渡さない字は左端を `x` に置き、`text-anchor` を書かない
 */
export function write(ink: Ink[] | undefined, cls: string, x: number, y: number, text: string, style: TextStyle, shown: Shown[] = ALWAYS, anchor?: "start" | "middle"): string {
  ink?.push({ text, rect: textBox(text, x, y, style, anchor), shown });
  return `<text class="${cls}" x="${r1(x)}" y="${r1(y)}"${anchor ? ` text-anchor="${anchor}"` : ""}>${esc(text)}</text>`;
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

export function band(region: SceneRegion, ink: Ink[]): string {
  const { radius, icon, iconRadius, iconScale, nameY, line } = LOOK.region;
  const { x, y } = region.header;
  const lines = region.lines.map((t, k) => write(ink, "dg-bz", x, region.y + nameY + k * line, t, TYPE.regionName)).join("");
  const note = region.note ? write(ink, "dg-bx", x, region.y + nameY + region.lines.length * line + 1, region.note, TYPE.regionNote) : "";
  const mark = drawsIcon(region.icon) ? `<rect class="dg-bi" x="${r1(x)}" y="${r1(y)}" width="${icon}" height="${icon}" rx="${iconRadius}"/>${glyph(region.icon, x + icon / 2, y + icon / 2, iconScale)}` : "";
  return `<g style="${cs(region.color)}"><rect class="dg-band" x="${r1(region.x + 0.5)}" y="${r1(region.y + 0.5)}" width="${r1(region.w - 1)}" height="${r1(region.h - 1)}" rx="${radius}"/>${mark}${lines}${note}</g>`;
}

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

/** 状態遷移図の、どの段も辿り着かない状態。点線の縁の札で、絵柄を左に、名前と下の字を右に並べる (#3171)。光らず、字も書き換わらない */
export function ghostCard(box: SceneBox, ink: Ink[]): string {
  const { icon, iconRadius, iconScale, radius } = LOOK.box;
  const G = LOOK.state.ghost;
  const ix = box.x + G.pad + icon / 2;
  const tx = box.x + G.pad + icon + G.gap;
  const mark = drawsIcon(box.icon) ? `<rect class="dg-ic" x="${r1(ix - icon / 2)}" y="${r1(box.cy - icon / 2)}" width="${icon}" height="${icon}" rx="${iconRadius}"/>${glyph(box.icon, ix, box.cy, iconScale)}` : "";
  const nameY = box.sub ? G.nameY : LOOK.baseline.mark;
  const sub = box.sub ? write(ink, "dg-ss", tx, box.cy + G.subY, box.sub, TYPE.boxSub, ALWAYS, "start") : "";
  return (
    `<g data-ghost="${esc(box.id)}" style="${cs(box.color)}"><rect class="dg-ghost" x="${r1(box.x)}" y="${r1(box.y)}" width="${r1(box.w)}" height="${box.h}" rx="${radius}"/>` +
    `${mark}${write(ink, "dg-sn", tx, box.cy + nameY, box.name, TYPE.boxName, ALWAYS, "start")}${sub}</g>`
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
export function path(p: ScenePath, color: ColorKey, ink: Ink[], traces: Trace[]): string {
  traces.push({ from: p.from, to: p.to, points: p.points, shown: ALWAYS });
  const sans = p.label?.family === "sans";
  const label = p.label
    ? write(ink, `dg-path-t${sans ? " dg-path-tj" : ""}`, p.label.x + LOOK.label.padX, p.label.y + p.label.h / 2 + LOOK.baseline.label, p.label.text, sans ? TYPE.labelJa : TYPE.label)
    : "";
  return `<g data-path="${esc(`${p.from}->${p.to}`)}" style="${cs(color)}"><path class="dg-path" d="${pathOf(p.points)}"/><path class="dg-path-h" d="${arrowHead(p.points)}"/>${label}</g>`;
}

/** 状態遷移図の脇道の囲み。左上に囲みの名前を、その下に添え書きを 1 行ずつ置く */
export function side(s: SceneSide, color: ColorKey, ink: Ink[]): string {
  const { pad } = LOOK.state.side;
  const title = s.y + pad + TYPE.regionName.size;
  const notes = s.notes.map((note, k) => write(ink, "dg-side-n", s.x + pad, title + LOOK.region.line * (k + 1), note, TYPE.regionNote)).join("");
  return (
    `<g style="${cs(color)}"><rect class="dg-side" x="${r1(s.x + 0.5)}" y="${r1(s.y + 0.5)}" width="${r1(s.w - 1)}" height="${r1(s.h - 1)}" rx="${LOOK.region.radius}"/>` +
    `${write(ink, "dg-side-t", s.x + pad, title, s.title, TYPE.regionName)}${notes}</g>`
  );
}

/** 状態遷移図の始まりと終わりの印。始まりは塗った丸、終わりは輪の中の丸で、脇道の中の終わりは点線の輪 */
export function endMark(e: SceneEnd, color: ColorKey, ink: Ink[]): string {
  const { end } = LOOK.state;
  const at = markText(e);
  const text = e.text === "" ? "" : write(ink, "dg-mark", at[0], at[1], e.text, TYPE.regionNote);
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
 * 段の番号。まだ来ていない段は出さず、今の段は塗り、済んだ段は縁取りに変えて番号を読めるまま残す。
 * `grey` を立てると (状態遷移図、#3171)、済んだ段の縁取りを線と同じ灰にする。
 * 同じ所に後の段の番号が来る時 (`until`) は、その段が始まる時に素早く消して数字を入れ替える (#3184)。
 * 見えていない間は `visibility` も隠し、同じ所に重ねたまだ来ていない段の番号が、押した時に前の段の番号を遮らないようにする。
 */
export function badge(b: SceneBadge, ctx: Ctx, grey = false): string {
  const { m } = ctx;
  const span = ctx.t.steps[b.step] as Span;
  const a = span.start;
  const e = span.end;
  const { r, ring: rr } = LOOK.badge;
  const shown = { visibility: "visible" };
  const hidden = { visibility: "hidden" };
  const swap = b.until === undefined ? undefined : (ctx.t.steps[b.until] as Span).start;
  // 次の段がすぐ入れ替える時は、塗った番号のまま素早く消し、縁取りを出さない
  const next = swap !== undefined && swap <= e + 1e-6;
  const fill = m.kf([
    [0, { opacity: 0, transform: "scale(.5)", ...hidden }],
    [a, { opacity: 0, transform: "scale(.5)", ...hidden }, EASE.pop],
    [a + 0.35, { opacity: 1, transform: "scale(1)", ...shown }],
    [e, { opacity: 1, transform: "scale(1)", ...shown }, EASE.inOut],
    [e + (next ? MOTION.untilFade : 0.4), { opacity: 0, transform: "scale(1)", ...hidden }],
    [m.total, { opacity: 0, transform: "scale(.5)", ...hidden }],
  ]);
  const pastEnd = swap ?? m.last;
  const past = next
    ? m.kf([
        [0, { opacity: 0, ...hidden }],
        [m.total, { opacity: 0, ...hidden }],
      ])
    : m.kf([
        [0, { opacity: 0, ...hidden }],
        [e, { opacity: 0, ...hidden }, EASE.inOut],
        [e + 0.4, { opacity: 1, ...shown }],
        [pastEnd, { opacity: 1, ...shown }, EASE.inOut],
        ...(swap === undefined ? [] : [[swap + MOTION.untilFade, { opacity: 0, ...hidden }] as Frame]),
        [m.total, { opacity: 0, ...hidden }],
      ]);
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
  ctx.ink.push({ text: String(no), rect: { x: b.x - r, y: b.y - r, w: r * 2, h: r * 2 }, shown: [[a, pastEnd]], boxed: true, badge: true });
  return (
    `<g class="dg-bd" data-step="${b.step}" style="${cs(b.color)}"><circle class="dg-bdr dg-popc dg-a" cx="${x}" cy="${y}" r="${rr}" style="${ring}"/>` +
    `<g class="dg-a" style="${past}"><circle class="${grey ? "dg-bdp-g" : "dg-bdp"}" cx="${x}" cy="${y}" r="${rr}"/><text class="${grey ? "dg-bdpt-g" : "dg-bdpt"}" x="${x}" y="${ty}" text-anchor="middle">${no}</text></g>` +
    `<g class="dg-popc dg-a" style="${fill}"><circle class="dg-bdf" cx="${x}" cy="${y}" r="${r}"/><text class="dg-bdft" x="${x}" y="${ty}" text-anchor="middle">${no}</text></g></g>`
  );
}
