/**
 * 区画、箱、線、線の名前、運ぶ物、段の番号、中身の帯を SVG に描く部品。見本帳の `engine.js` の部品を写す。
 *
 * どの部品も、置き場所は場面 (`layout/scene.ts`) から、いつ見えるかは時刻の表 (`timeline.ts`) から読む。
 * 色は色の役の変数 (`--c` と `--ct`) だけを渡し、値は色味の表が持つ。
 */
import { hasWide, textBox, textWidth } from "../layout/measure";
import {
  along,
  carrierHalf,
  markText,
  type Point,
  pathLength,
  type SceneAction,
  type SceneBadge,
  type SceneBox,
  type SceneEdge,
  type SceneEnd,
  type SceneField,
  type SceneLabel,
  type ScenePath,
  type SceneRegion,
  type SceneSide,
  type SceneStrip,
} from "../layout/scene";
import { type ColorKey, EASE, LOOK, MOTION, type TextStyle, TYPE } from "../look/values";
import type { CarrierTime, EdgeTime, LabelTime, Span, Timeline } from "../timeline";
import { ICONS } from "./icons";
import { ALWAYS, type Ink, type Shown, type Trace } from "./ink";
import type { Frame, Motion } from "./motion";

export const esc = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/** 箱の飛び先 (#3199)。飛び先を持つ箱の札を、その飛び先への link で包む */
export const linkTo = (link: string | undefined, markup: string): string => (link === undefined ? markup : `<a href="${esc(link)}">${markup}</a>`);
const r1 =(v: number): number => Math.round(v * 100) / 100;

/** 色の役を部品へ渡す変数。 */
export const cs = (k: ColorKey): string => (k === "coin" ? "--c:var(--coin);--ct:var(--coint)" : `--c:var(--c-${k});--ct:var(--t-${k})`);

export function glyph(name: string | undefined, x: number, y: number, scale: number, cls = "dg-gl"): string {
  const d = name === undefined ? undefined : ICONS[name];
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
}

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
  const mark = region.icon && ICONS[region.icon] ? `<rect class="dg-bi" x="${r1(x)}" y="${r1(y)}" width="${icon}" height="${icon}" rx="${iconRadius}"/>${glyph(region.icon, x + icon / 2, y + icon / 2, iconScale)}` : "";
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
  const { icon, iconRadius, iconScale, iconY, nameY, subY } = LOOK.box;
  const subs = subLines(box, ctx.m, changes, box.cy + subY, ctx.ink);
  const act = lit ? (lit.length > 0 ? rangeKf(ctx.m, lit.map((s) => [s.start, s.end])) : undefined) : on.length > 0 ? activeKf(ctx, on) : undefined;
  // 置き場を持つ箱は絵柄を左へ寄せ、右に点線の枠を初めから見せる (#3176)
  const ix = box.iconX ?? box.cx;
  const slot = box.slot ? `<rect class="dg-slot" x="${r1(box.slot.x)}" y="${r1(box.slot.y)}" width="${r1(box.slot.w)}" height="${r1(box.slot.h)}" rx="${LOOK.slot.radius}"/>` : "";
  let mark = "";
  if (box.icon && ICONS[box.icon]) {
    const rect = { x: ix - icon / 2, y: box.cy + iconY - icon / 2, w: icon, h: icon };
    ctx.ink.push({ text: `${box.name} の絵柄`, rect, shown: ALWAYS, boxed: true, part: { kind: "icon", box: box.name } });
    mark = `<rect class="dg-ic" x="${r1(rect.x)}" y="${r1(rect.y)}" width="${icon}" height="${icon}" rx="${iconRadius}"/>${glyph(box.icon, ix, box.cy + iconY, iconScale)}`;
  }
  return (
    `<g style="${cs(box.color)}">${cardFrame(box, ctx, act, box.y, box.h)}` +
    `${slot}${mark}${write(ctx.ink, "dg-sn", box.cx, box.cy + nameY, box.name, TYPE.boxName, ALWAYS, "middle")}${subs}</g>`
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
  const mark = box.icon && ICONS[box.icon] ? `<rect class="dg-ic" x="${r1(ix - icon / 2)}" y="${r1(box.cy - icon / 2)}" width="${icon}" height="${icon}" rx="${iconRadius}"/>${glyph(box.icon, ix, box.cy, iconScale)}` : "";
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
 * 線。点線で道を見せておき、その段で色の線を引いて、段の終わりまで流れる点で向きを見せる。
 * 済んだ段は薄く残し、最後の段の後に通った道を全て濃くし直す。
 * `past` を立てると (状態遷移図、#3171)、段が終わった後は色の線を消して灰の実線に替え、最後の段まで残す。
 * `since` を渡すと (木の図の後から現れる箱へ向かう線、#3240)、点線の道をその時刻から出す。
 */
export function edge(e: SceneEdge, time: EdgeTime, ctx: Ctx, past = false, since = 0): { base: string; lit: string } {
  const { m } = ctx;
  // 点線の道は `since` から最後まで見えている。`since` が 0 なら初めから見えている
  ctx.traces.push({ from: e.from, to: e.to, points: e.points, shown: since > 0 ? [[since, Number.POSITIVE_INFINITY]] : ALWAYS });
  const d = pathOf(e.points);
  const head = arrowHead(e.points);
  const { start: a, drawn: b, end } = time;
  const tail: Frame[] = past
    ? [
        [end, { opacity: 1 }, EASE.inOut],
        [end + 0.4, { opacity: 0 }],
        [m.total, { opacity: 0 }],
      ]
    : [
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
  const grey = past ? m.kf([[0, { opacity: 0 }], [end, { opacity: 0 }, EASE.inOut], [end + 0.4, { opacity: 1 }], [m.last, { opacity: 1 }, EASE.inOut], [m.total, { opacity: 0 }]]) : "";
  const path = `<path class="dg-e" d="${d}"/><path class="dg-eh" d="${head}"/>`;
  return {
    base: `${since > 0 ? `<g class="dg-a" style="${m.vis(since)}">${path}</g>` : path}${past ? `<path class="dg-e-past dg-a" d="${d}" style="${grey}"/><path class="dg-eh-past dg-a" d="${head}" style="${grey}"/>` : ""}`,
    lit: `<g style="${cs(e.color)}"><path class="dg-e-on dg-a" pathLength="1" d="${d}" style="${line}"/><path class="dg-eh-on dg-a" d="${head}" style="${hk}"/><path class="dg-flow dg-a" d="${d}" style="${flow}"/></g>`,
  };
}

/**
 * 線の名前の札。その段の間だけ出し、段の終わりまでに消え終わる。時刻の表が `after` を持つ時は、その間だけ札を外した灰の字で薄く残す (#3171)。
 * `again` を持つ時は (止め絵を選んだ図、#3200)、その間に同じ札をもう 1 つ出す。
 */
export function label(l: SceneLabel, time: LabelTime, ctx: Ctx): string {
  const ja = l.family === "sans" ? " dg-capj" : "";
  const { radius } = LOOK.label;
  const shown: Shown[] = time.again ? [[time.start, time.end], [time.again.start, time.again.end]] : [[time.start, time.end]];
  // 札の間は札の四角を、薄く残す間は札を外した字の四角を記録する
  ctx.ink.push({ text: l.text, rect: l, shown, boxed: true });
  if (time.after) ctx.ink.push({ text: l.text, rect: textBox(l.text, l.x + l.w / 2, l.y + l.h / 2 + LOOK.baseline.label, l.family === "sans" ? TYPE.labelJa : TYPE.label, "middle"), shown: [[time.after.start, time.after.end]] });
  const x = r1(l.x + l.w / 2);
  const y = r1(l.y + l.h / 2 + LOOK.baseline.label);
  const past = time.after ? `<g class="dg-cap-past${l.family === "sans" ? " dg-cap-pastj" : ""} dg-a" style="${ctx.m.vis(time.after.start, time.after.end)}"><text x="${x}" y="${y}" text-anchor="middle">${esc(l.text)}</text></g>` : "";
  const caps = shown.map(([a, b]) => `<g class="dg-cap${ja} dg-a" style="${cs(l.color)};${ctx.m.rise(a, b, true)}"><rect x="${r1(l.x)}" y="${r1(l.y)}" width="${r1(l.w)}" height="${l.h}" rx="${radius}"/><text x="${x}" y="${y}" text-anchor="middle">${esc(l.text)}</text></g>`);
  return `${past}${caps.join("")}`;
}

/** 時系列図の箱の中の処理の札。その段の間だけ生存線の上に出す。`again` を渡すと (止め絵を選んだ図、#3200)、その間に同じ札をもう 1 つ出す。 */
export function action(a: SceneAction, at: number, until: number, ctx: Ctx, again?: Span): string {
  const shown: Shown[] = again ? [[at, until], [again.start, again.end]] : [[at, until]];
  ctx.ink.push({ text: a.text, rect: a, shown, boxed: true });
  return shown
    .map(
      ([from, to]) =>
        `<g class="dg-act dg-a" style="${cs(a.color)};${ctx.m.rise(from, to, true)}"><rect x="${r1(a.x)}" y="${r1(a.y)}" width="${r1(a.w)}" height="${a.h}" rx="${LOOK.action.radius}"/><text x="${r1(a.x + a.w / 2)}" y="${r1(a.y + a.h / 2 + LOOK.baseline.action)}" text-anchor="middle">${esc(a.text)}</text></g>`,
    )
    .join("");
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
  const part: Pick<Ink, "part"> = e.carry.kind === "tag" ? {} : { part: { kind: e.carry.kind === "coin" ? "coin" : "envelope" } };
  const box = (p: Point) => ({ x: p[0] - hx, y: p[1] - hy, w: hx * 2, h: hy * 2 });
  if (a > from) ctx.ink.push({ text: name, rect: box([first[1], first[2]]), shown: [[from, a]], boxed: true, ...part });
  ctx.ink.push({ text: name, rect: box(rest), shown: [[b, gone]], boxed: true, ...part });
  // 次の運ぶ物と入れ替わる時は、重なって 2 つに見えないよう素早く消す
  const fade = gone < m.last ? 0.05 : 0.18;
  return `<g class="dg-a" style="${m.move(pts, m.blink(from + 0.02, gone, fade))}">${carrierShape(e, ctx.sh)}</g>`;
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

/** 中身の帯の 1 欄の移り変わり。値と札は、次の値か札が来るまで出る。 */
export interface FieldChange {
  at: number;
  value?: string;
  tag?: string;
  color: ColorKey;
  /** 変わった段と、その段の終わり */
  step: number;
  until: number;
}

/**
 * 中身の帯。`now` を立てると (状態遷移図、#3171)、段の中で変わった値をその段の終わりまで線の色 (今の状態の色) で描き、
 * 欄の名前の横に同じ色の点を置く。帯の通った状態の欄は、`arrivals` が持つ着いた時刻に点を塗る。
 * `meter` を渡すと (時間軸の図、#3165)、物差しの欄は値の字の代わりに `meter` が描く物差しを置く
 */
export function strip(s: SceneStrip, changes: Map<string, FieldChange[]>, ctx: Ctx, now = false, arrivals = new Map<string, number>(), meter?: (field: SceneField) => string | undefined): string {
  const { m, sh } = ctx;
  const S = LOOK.strip;
  const my = s.y + S.h / 2;
  const parts = [
    `<rect class="dg-strip" x="${r1(s.x + 0.5)}" y="${r1(s.y + 0.5)}" width="${r1(s.w - 1)}" height="${r1(s.h - 1)}" rx="${LOOK.region.radius}" ${sh}/>`,
    `<g style="${cs("slate")}"><rect class="dg-bi" x="${r1(s.x + S.pad)}" y="${r1(my - S.icon / 2)}" width="${S.icon}" height="${S.icon}" rx="${LOOK.box.iconRadius}"/>${glyph("env", s.x + S.pad + S.icon / 2, my, 0.78)}</g>`,
    write(ctx.ink, "dg-sh", s.x + S.titleX, my + LOOK.baseline.stripTitle, s.title, TYPE.stripTitle),
  ];
  s.fields.forEach((field, i) => {
    const prev = s.fields[i - 1];
    if (prev && prev.y === field.y) {
      const sx = field.x - S.fieldGap / 2;
      parts.push(`<line class="dg-sep" x1="${r1(sx)}" y1="${r1(field.y + S.sepInset)}" x2="${r1(sx)}" y2="${r1(field.y + S.h - S.sepInset)}"/>`);
    }
    parts.push(write(ctx.ink, "dg-fl", field.x, field.y + S.nameY, field.name, TYPE.fieldName));
    const gauge = meter?.(field);
    if (gauge !== undefined) {
      parts.push(gauge);
      return;
    }
    const list = changes.get(field.name) ?? [];
    const values = list.filter((c) => c.value !== undefined);
    const tags = list.filter((c) => c.tag !== undefined);
    values.forEach((c, k) => {
      const next = values[k + 1]?.at;
      const value = c.value as string;
      const cls = hasWide(value) ? "dg-fvj" : "dg-fv";
      // 値は、次の値が来るまで (色を付けた間と墨に戻した間を合わせて) 1 件で記録する
      ctx.ink.push({ text: value, rect: textBox(value, field.x, field.y + S.valueY, hasWide(value) ? TYPE.fieldValueJa : TYPE.fieldValue), shown: [[c.at, next === undefined ? Number.POSITIVE_INFINITY : next - MOTION.untilFade]] });
      const textOf = (c: string): string => `<text class="${c}" x="${r1(field.x)}" y="${r1(field.y + S.valueY)}">${esc(value)}</text>`;
      const text = textOf(cls);
      if (!now) {
        const anim = next === undefined ? m.rise(c.at) : m.rise(c.at, next - MOTION.untilFade);
        parts.push(`<g class="dg-a" style="${anim}">${text}</g>`);
        return;
      }
      // 変わった段の間は今の状態の色で、段が終わると墨に戻す
      const until = Math.min(c.until, next ?? c.until);
      const dot = `<circle class="dg-fl-now" cx="${r1(field.x + textWidth(field.name, TYPE.fieldName) + S.now.gap)}" cy="${r1(field.y + S.nameY - TYPE.fieldName.size / 3)}" r="${S.now.r}"/>`;
      parts.push(`<g class="dg-fv-now dg-a" data-step="${c.step}" style="${cs(c.color)};${m.rise(c.at, until - MOTION.untilFade)}">${textOf(`${cls} dg-fv-c`)}${dot}</g>`);
      if (next === undefined || next > until) parts.push(`<g class="dg-a" style="${m.vis(until - MOTION.untilFade, next === undefined ? m.last : next - MOTION.untilFade)}">${text}</g>`);
    });
    tags.forEach((c, k) => {
      const next = tags[k + 1]?.at;
      const tag = c.tag as string;
      // 札は、その時に出ている値の右に置く
      const shown = [...values].reverse().find((v) => v.at <= c.at + 1e-9)?.value;
      const x = field.x + (shown ? textWidth(shown, hasWide(shown) ? TYPE.fieldValueJa : TYPE.fieldValue) + S.tagGap : 0);
      const w = textWidth(tag, TYPE.tag) + S.tagPadX * 2;
      const y = field.y + S.valueY - S.tagH / 2 - LOOK.baseline.tag;
      ctx.ink.push({ text: tag, rect: { x, y, w, h: S.tagH }, shown: [[c.at, next === undefined ? Number.POSITIVE_INFINITY : next - MOTION.untilFade]], boxed: true });
      parts.push(
        `<g class="dg-tg dg-popc dg-a" style="${cs(c.color)};${next === undefined ? m.pop(c.at) : m.pop(c.at, next - MOTION.untilFade)}"><rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${S.tagH}" rx="${S.tagH / 2}"/><text x="${r1(x + w / 2)}" y="${r1(y + S.tagH / 2 + LOOK.baseline.tag)}" text-anchor="middle">${esc(tag)}</text></g>`,
      );
    });
  });
  if (s.trail) {
    const t = s.trail;
    const last = s.fields[s.fields.length - 1];
    if (last && last.y === t.y) {
      const sx = t.x - S.fieldGap / 2;
      parts.push(`<line class="dg-sep" x1="${r1(sx)}" y1="${r1(t.y + S.sepInset)}" x2="${r1(sx)}" y2="${r1(t.y + S.h - S.sepInset)}"/>`);
    }
    parts.push(write(ctx.ink, "dg-fl", t.x, t.y + S.nameY, t.title, TYPE.fieldName));
    const dy = t.y + S.valueY - TYPE.fieldValue.size / 3;
    t.states.forEach((state, k) => {
      const cx = r1(t.x + S.trail.r + k * S.trail.step);
      const at = arrivals.get(state.box);
      const fill = at === undefined ? "" : `<circle class="dg-tr-fill dg-a" cx="${cx}" cy="${r1(dy)}" r="${S.trail.r}" style="${m.pop(at)}"/>`;
      parts.push(`<g data-trail="${esc(state.box)}" style="${cs(state.color)}"><circle class="dg-tr-ring" cx="${cx}" cy="${r1(dy)}" r="${S.trail.r}"/>${fill}</g>`);
    });
  }
  return parts.join("");
}
