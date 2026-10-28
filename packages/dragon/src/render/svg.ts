/**
 * 原本の JSON から図を描く入口。置き場所と時刻の表を作り、部品を重なりの順に並べて SVG にする。
 *
 * 動きは全て SVG の中の CSS の keyframes が回す。1 周の長さは `--T`、止める時刻は `--at`、
 * 止めるか流すかは `--play` の変数で外から変えられる (頁に置く `player.ts` がこれを使う)。
 * 色と字は値の表から CSS の変数として 1 度だけ書き、部品はその変数だけを読む。
 */
import { FIGURE_TEXT } from "../figure-text";
import { layoutArchitecture } from "../layout/architecture";
import { textWidth } from "../layout/measure";
import type { Layout, Rect } from "../layout/scene";
import { layoutSequence } from "../layout/sequence";
import { layoutState } from "../layout/state";
import { FONTS } from "../look/fonts";
import { type ColorKey, EASE, FONT_VARS, LOOK, MOTION, type Palette, paletteVars, resolvePalette, type TextStyle, type Theme, TYPE } from "../look/values";
import { readDiagram } from "../version";
import type { Diagram, ViewMode } from "../schema";
import { buildTimeline, type Span, type Timeline } from "../timeline";
import type { NotationLang } from "../words";
import {
  action,
  badge,
  band,
  card,
  carrier,
  type Ctx,
  cs,
  doneMark,
  edge,
  endMark,
  esc,
  type FieldChange,
  ghostCard,
  headCard,
  label,
  lifeline,
  path,
  side,
  strip,
  type SubChange,
} from "./parts";
import { findOverlaps, type Ink, type Overlap, type Trace } from "./ink";
import { Motion } from "./motion";

export interface RenderOptions {
  /** 色味の名前。書かないか知らない名前なら紙と墨 */
  palette?: string;
  theme?: Theme;
  /** 描く部品が出す字 (断りの文、全体図の札、読み上げの名前) の言葉。書かなければ日本語 (#3001) */
  lang?: NotationLang;
}

export interface Rendered {
  svg: string;
  palette: string;
  theme: Theme;
  /** 書き手が原本で決めた見せ方 */
  view?: ViewMode;
  fonts: { sans: string; mono: string };
  layout: Layout;
  timeline: Timeline;
  diagram: Diagram;
  /** 段ごとの止め絵で、同時に見えている字どうしの重なりと、線が札を持たない字を横切る所 (#3175)。重なりが無ければ空 */
  overlaps: Overlap[];
}

const font = (t: TextStyle): string => `font:${t.weight} ${t.size}px var(--${t.family})`;
const mix = (pct: number, base = "var(--surf)"): string => `color-mix(in srgb,var(--c) ${pct}%,${base})`;
const S = LOOK.stroke;
const X = LOOK.mix;
/** 状態遷移図で段が終わった線と番号の灰 (#3171) */
const PAST = `color-mix(in srgb,var(--mute) ${X.past}%,var(--bg))`;

/** 部品の見た目。どの値も値の表から読む。 */
const PART_CSS = [
  ".dg{display:block;width:100%;height:auto;overflow:visible}",
  ".dg .dg-a{animation-duration:var(--T);animation-timing-function:linear;animation-iteration-count:infinite;animation-fill-mode:both;animation-delay:calc(var(--at,0) * -1s);animation-play-state:var(--play,running)}",
  ".dg .dg-popc{transform-box:fill-box;transform-origin:center}",
  ".dg-bg{fill:var(--bg)}",
  ".dg-band{fill:color-mix(in srgb,var(--c) var(--tint),var(--bg));stroke:color-mix(in srgb,var(--c) var(--edge),transparent)}",
  `.dg-bi{fill:${mix(X.regionIcon)};stroke:${mix(X.regionIconEdge, "transparent")}}`,
  `.dg-bz{${font(TYPE.regionName)};fill:var(--ct)}`,
  `.dg-bx{${font(TYPE.regionNote)};fill:var(--mute)}`,
  ".dg-st{fill:var(--surf);stroke:var(--hair)}",
  `.dg-halo{fill:none;stroke:var(--c);stroke-width:${S.halo};stroke-opacity:.16}`,
  `.dg-on{fill:none;stroke:var(--c);stroke-width:${S.on}}`,
  `.dg-ic{fill:${mix(X.icon)}}`,
  `.dg-gl{fill:none;stroke:var(--c);stroke-width:${S.glyph};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-sn{${font(TYPE.boxName)};fill:var(--ink)}`,
  `.dg-ss{${font(TYPE.boxSub)};fill:var(--mute)}`,
  `.dg-ss-ok{${font(TYPE.boxSubStrong)};fill:var(--ct)}`,
  `.dg-ss-act{${font(TYPE.boxSubStrong)};fill:var(--ink)}`,
  `.dg-ll{stroke:var(--line);stroke-width:${S.lifeline};stroke-dasharray:3 4}`,
  `.dg-e{fill:none;stroke:var(--line);stroke-width:${S.edge};stroke-linecap:round;stroke-dasharray:0 ${LOOK.edge.ghostDash}}`,
  `.dg-eh{fill:none;stroke:var(--line);stroke-width:${S.arrow};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-e-on{fill:none;stroke:var(--c);stroke-width:${S.edgeOn};stroke-linecap:round;stroke-dasharray:1 2}`,
  `.dg-eh-on{fill:none;stroke:var(--c);stroke-width:${S.edgeOn};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-flow{fill:none;stroke:var(--surf);stroke-width:${S.flow};stroke-linecap:round;stroke-dasharray:1.5 ${LOOK.edge.flowDash}}`,
  `.dg-e-past{fill:none;stroke:${PAST};stroke-width:${S.edge};stroke-linecap:round}`,
  `.dg-eh-past{fill:none;stroke:${PAST};stroke-width:${S.arrow};stroke-linecap:round;stroke-linejoin:round}`,
  ".dg-bd{cursor:pointer}",
  ".dg-bdf{fill:var(--c)}",
  `.dg-bdft{${font(TYPE.badge)};fill:var(--on-c)}`,
  `.dg-bdr{fill:none;stroke:var(--c);stroke-width:${S.badgeRing}}`,
  `.dg-bdp{fill:${mix(X.badgePast)};stroke:${mix(X.badgePastEdge, "transparent")};stroke-width:${S.hair}}`,
  `.dg-bdpt{${font(TYPE.badge)};fill:var(--ct)}`,
  `.dg-bdp-g{fill:var(--surf);stroke:${PAST};stroke-width:${S.hair}}`,
  `.dg-bdpt-g{${font(TYPE.badge)};fill:var(--mute)}`,
  `.dg-cap rect,.dg-act rect{fill:${mix(X.cap)};stroke:${mix(X.capEdge, "transparent")}}`,
  `.dg-cap text{${font(TYPE.label)};fill:var(--ct)}`,
  `.dg-capj text{${font(TYPE.labelJa)}}`,
  `.dg-cap-past text{${font(TYPE.label)};fill:var(--mute);fill-opacity:${LOOK.state.pastLabel}}`,
  `.dg-cap-pastj text{${font(TYPE.labelJa)}}`,
  `.dg-act text{${font(TYPE.action)};fill:var(--ct)}`,
  ".dg-car{fill:var(--carry,var(--ink))}",
  `.dg-car-t{${font(TYPE.carrier)};fill:var(--bg)}`,
  `.dg-car-tj{${font(TYPE.carrierJa)}}`,
  `.dg-env{fill:var(--carry,var(--ink));stroke:var(--surf);stroke-width:${S.envelope}}`,
  `.dg-env-in{fill:none;stroke:var(--surf);stroke-width:${S.flow};stroke-linejoin:round;stroke-linecap:round}`,
  ".dg-coin{fill:var(--coin);stroke:var(--surf);stroke-width:1.2}",
  ".dg-coin-in{fill:none;stroke:var(--coinin);stroke-width:1.1}",
  ".dg-strip{fill:var(--surf);stroke:var(--hair)}",
  `.dg-sep{stroke:var(--hair);stroke-width:${S.hair}}`,
  `.dg-sh{${font(TYPE.stripTitle)};fill:var(--ink)}`,
  `.dg-fl{${font(TYPE.fieldName)};fill:var(--mute)}`,
  `.dg-fv{${font(TYPE.fieldValue)};fill:var(--ink)}`,
  `.dg-fvj{${font(TYPE.fieldValueJa)};fill:var(--ink)}`,
  ".dg-fv-c{fill:var(--ct)}",
  ".dg-fl-now{fill:var(--c)}",
  `.dg-tr-ring{fill:none;stroke:var(--line);stroke-width:${S.trail}}`,
  ".dg-tr-fill{fill:var(--c)}",
  ".dg-tg rect{fill:var(--c)}",
  `.dg-tg text{${font(TYPE.tag)};fill:var(--on-c)}`,
  `.dg-side{fill:color-mix(in srgb,var(--c) ${X.side}%,var(--bg));stroke:${mix(X.sideEdge, "transparent")};stroke-dasharray:4 4}`,
  `.dg-side-t{${font(TYPE.regionName)};fill:var(--ct)}`,
  `.dg-side-n{${font(TYPE.regionNote)};fill:var(--mute)}`,
  `.dg-ghost{fill:var(--surf);stroke:${mix(X.ghostEdge, "transparent")};stroke-dasharray:4 3}`,
  `.dg-path{fill:none;stroke:${mix(X.path, "transparent")};stroke-width:${S.path};stroke-linecap:round;stroke-dasharray:0 ${LOOK.edge.ghostDash}}`,
  `.dg-path-h{fill:none;stroke:${mix(X.path, "transparent")};stroke-width:${S.arrow};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-path-t{${font(TYPE.label)};fill:var(--ct)}`,
  `.dg-path-tj{${font(TYPE.labelJa)}}`,
  ".dg-start{fill:var(--ink)}",
  `.dg-end{fill:var(--bg);stroke:var(--ink);stroke-width:${S.end}}`,
  ".dg-end-in{fill:var(--ink)}",
  `.dg-end-x{fill:var(--bg);stroke:${mix(X.path, "transparent")};stroke-width:${S.arrow};stroke-dasharray:2 2.5}`,
  `.dg-end-xi{fill:${mix(X.path, "transparent")}}`,
  `.dg-mark{${font(TYPE.regionNote)};fill:var(--mute)}`,
  `.dg-done{fill:var(--ink);stroke:var(--surf);stroke-width:${S.done}}`,
  `.dg-done-ck{fill:none;stroke:var(--surf);stroke-width:${S.glyph};stroke-linecap:round;stroke-linejoin:round}`,
  ".dg-vp-bg{fill:var(--bg)}",
  ".dg-vp-frame{fill:none;stroke:var(--hair)}",
  ".dg-hd-bg{fill:var(--bg)}",
  ".dg-mm-bg{fill:var(--surf);stroke:var(--hair)}",
  `.dg-mm-t{${font(TYPE.miniTitle)};fill:var(--mute)}`,
  ".dg-mm-world{fill:var(--sunk);stroke:var(--hair)}",
  `.dg-mm-band{fill:${mix(X.miniBand)};stroke:${mix(X.miniBandEdge, "transparent")};stroke-width:.6}`,
  `.dg-mm-card{fill:${mix(X.mini)}}`,
  `.dg-mm-vp{fill:color-mix(in srgb,var(--ink) ${X.view}%,transparent);stroke:var(--ink);stroke-width:${S.badgeRing};vector-effect:non-scaling-stroke}`,
].join("");

/** 同じ原本と同じ見た目からは同じ名前になるよう、中身から短い名前を作る (keyframes の名前が頁の中で混ざらないため)。 */
function nameOf(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/** 各箱が動く段。線の両端、処理、字の書き換えの箱。 */
function involved(diagram: Diagram): Map<string, number[]> {
  const on = new Map<string, Set<number>>();
  const add = (id: string, s: number): void => {
    on.set(id, (on.get(id) ?? new Set()).add(s));
  };
  diagram.steps.forEach((step, s) => {
    for (const event of step.events) {
      if (event.type === "edge") {
        add(event.from, s);
        add(event.to, s);
      } else if (event.type === "action" || event.type === "swap") add(event.box, s);
    }
  });
  return new Map([...on].map(([id, steps]) => [id, [...steps].sort((a, b) => a - b)]));
}

/** 箱の下の字の移り変わり。書き換えはそのまま残し、構成図の処理はその段の間だけ出して元へ戻す。 */
function subChanges(diagram: Diagram, timeline: Timeline, actionsInBox: boolean): Map<string, SubChange[]> {
  type Raw = { t: number; order: number; box: string; set?: string; act?: string | null };
  const raw: Raw[] = [];
  let order = 0;
  for (const time of timeline.events) {
    const event = diagram.steps[time.step]?.events[time.event];
    if (event?.type === "swap") raw.push({ t: time.at, order: order++, box: event.box, set: event.text });
    if (actionsInBox && event?.type === "action") {
      raw.push({ t: time.at, order: order++, box: event.box, act: event.label });
      raw.push({ t: (timeline.steps[time.step] as Span).end, order: order++, box: event.box, act: null });
    }
  }
  raw.sort((a, b) => a.t - b.t || a.order - b.order);
  const out = new Map<string, SubChange[]>();
  for (const box of diagram.boxes) {
    let base: [string, string] = [box.sub ?? "", "dg-ss"];
    let acting: string | undefined;
    let shown = base.join("|");
    const list: SubChange[] = [];
    for (const change of raw.filter((r) => r.box === box.id)) {
      // 書き換えは、出ている処理の字も置き換える
      if (change.set !== undefined) {
        base = [change.set, "dg-ss-ok"];
        acting = undefined;
      }
      if (change.act !== undefined) acting = change.act ?? undefined;
      const now: [string, string] = acting !== undefined ? [acting, "dg-ss-act"] : base;
      if (now.join("|") === shown) continue;
      shown = now.join("|");
      list.push([change.t, now[0], now[1]]);
    }
    // すぐ次の字に替わる字は読めないので出さない
    const kept = list.filter((change, k) => {
      const next = list[k + 1];
      return next === undefined || next[0] - change[0] >= MOTION.minShow;
    });
    out.set(box.id, kept);
  }
  return out;
}

function fieldChanges(diagram: Diagram, timeline: Timeline, layout: Layout): Map<string, FieldChange[]> {
  const out = new Map<string, FieldChange[]>();
  for (const time of timeline.events) {
    const event = diagram.steps[time.step]?.events[time.event];
    if (event?.type !== "strip") continue;
    const color: ColorKey = layout.badges[time.step]?.color ?? "slate";
    const list = out.get(event.field) ?? [];
    const until = (timeline.steps[time.step] as Span).end;
    list.push({ at: time.at, color, step: time.step, until, ...(event.value !== undefined ? { value: event.value } : {}), ...(event.tag !== undefined ? { tag: event.tag } : {}) });
    out.set(event.field, list);
  }
  return out;
}

export interface FollowFrame {
  /** 枠の幅 (px)。寄って追う窓はこの幅で、字を原寸で見せる */
  width: number;
  /** 枠の中で見える高さ (px)。渡すと、窓と全体図をこの高さに収め (#3047)、窓をこの高さまで伸ばす (#3053)。枠の高さが図で伸びる置き場では渡さない */
  height?: number;
  /** 隅の全体図の札の言葉。渡し忘れを型の検査で止めるため、省けない欄にする */
  lang: NotationLang;
}

/** 図を描く。`follow` を渡すと、寄って追う窓と隅の全体図で描く。`ink` を渡すと、描いた字の四角と見えている間をそこへ記録する (#3175)。 */
export function drawSvg(diagram: Diagram, layout: Layout, timeline: Timeline, palette: Palette, theme: Theme, follow?: FollowFrame, ink: Ink[] = [], traces: Trace[] = []): string {
  // 札の言葉で全体図の地の幅が変わりうるので、同じ頁に置いた別の言葉の図と名前を分ける
  const id = nameOf(`${JSON.stringify(diagram)}|${palette.id}|${theme}|${follow ? `${follow.width}|${follow.lang}` : ""}`);
  const m = new Motion(`dg${id}`, timeline.total, timeline.last);
  const ctx: Ctx = { m, t: timeline, sh: `filter="url(#dg-sh-${id})"`, end: (timeline.steps[timeline.steps.length - 1] as Span).end, ink, traces };
  const on = involved(diagram);
  // 時系列図の処理は生存線の上の札に出し、他の図の種類は箱の下の字に出す
  const subs = subChanges(diagram, timeline, layout.kind !== "sequence");

  const L = { band: [] as string[], base: [] as string[], lit: [] as string[], node: [] as string[], badge: [] as string[], top: [] as string[] };
  for (const region of layout.regions) L.band.push(band(region, ink));
  const ghostColor = layout.boxes.find((b) => b.ghost)?.color ?? "slate";
  if (layout.side) L.band.push(side(layout.side, ghostColor, ink));
  // 脇道へ入る道は脇道の状態の色、それ以外の道は送る側の色で描く
  const boxColor = (id: string, ghost?: boolean): ColorKey | undefined => layout.boxes.find((b) => b.id === id && (ghost === undefined || b.ghost === ghost))?.color;
  for (const p of layout.paths) L.base.push(path(p, boxColor(p.to, true) ?? boxColor(p.from) ?? ghostColor, ink, traces));
  for (const e of layout.ends) L.node.push(endMark(e, ghostColor, ink));
  // 状態遷移図は、段で変わった値を今の状態の色で描き、帯の通った状態の点を着いた時刻に塗る (#3171)
  const isState = layout.kind === "state";
  const arrivals = new Map((timeline.states ?? []).flatMap((s) => (s.lit[0] ? [[s.box, s.lit[0].start] as [string, number]] : [])));
  if (layout.strip) L.band.push(strip(layout.strip, fieldChanges(diagram, timeline, layout), ctx, isState, arrivals));
  for (const line of layout.lifelines) L.base.push(lifeline(line.x, line.y1, line.y2));
  for (const e of layout.edges) {
    const time = timeline.edges.find((t) => t.step === e.step && t.event === e.event);
    if (!time) continue;
    const drawn = edge(e, time, ctx, isState);
    L.base.push(drawn.base);
    L.lit.push(drawn.lit);
  }
  const states = new Map((timeline.states ?? []).map((s) => [s.box, s]));
  for (const box of layout.boxes) {
    if (box.ghost) {
      L.node.push(ghostCard(box, ink));
      continue;
    }
    const state = states.get(box.id);
    L.node.push(card(box, ctx, on.get(box.id) ?? [], subs.get(box.id) ?? [], isState ? (state?.lit ?? []) : undefined));
    if (state?.done !== undefined) L.node.push(doneMark(box, state.done, ctx));
  }
  for (const b of layout.badges) L.badge.push(badge(b, ctx, isState));
  for (const l of layout.labels) {
    const time = timeline.labels.find((t) => t.step === l.step && t.event === l.event);
    if (time) L.top.push(label(l, time, ctx));
  }
  for (const a of layout.actions) {
    const time = timeline.events.find((t) => t.step === a.step && t.event === a.event);
    if (time) L.top.push(action(a, time.at, (timeline.steps[a.step] as Span).end, ctx));
  }
  for (const time of timeline.carriers) {
    const e = layout.edges.find((x) => x.step === time.step && x.event === time.event);
    if (e) L.top.push(carrier(e, time, ctx));
  }
  const content = Object.values(L)
    .map((parts) => parts.join(""))
    .join("");

  const { near, far, nearY, farY } = LOOK.shadow;
  const shadow = `<filter id="dg-sh-${id}" x="-20%" y="-30%" width="140%" height="180%"><feDropShadow dx="0" dy="${nearY}" stdDeviation="${near}" style="flood-color:var(--sh);flood-opacity:var(--shA)"/><feDropShadow dx="0" dy="${farY}" stdDeviation="${far}" style="flood-color:var(--sh);flood-opacity:var(--shB)"/></filter>`;
  // 寄って追う時系列図は、頭の箱を窓の上端に貼る頭の列にも描く (#3118)。頭の列の箱はアイコンを外した 2 段 (#3120)。止めて見せる図では描かない
  const heads = follow && layout.kind === "sequence" ? layout.boxes.map((box) => headCard(box, ctx, on.get(box.id) ?? [], subs.get(box.id) ?? [])).join("") : "";
  const view = follow ? followView(layout, timeline, diagram, m, id, content, follow, heads) : { body: `<rect class="dg-bg" width="${layout.width}" height="${layout.height}" rx="${LOOK.region.radius}"/>${content}`, w: layout.width, h: layout.height };
  const css = `.dg-${id}{${FONT_VARS};--T:${timeline.total}s;${paletteVars(palette, theme)}}${PART_CSS}${m.frames.join("")}`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" class="dg dg-${id}" viewBox="0 0 ${Math.ceil(view.w)} ${Math.ceil(view.h)}" width="${Math.ceil(view.w)}" height="${Math.ceil(view.h)}" role="img" aria-label="${esc(diagram.title)}" data-dragon="figure" data-view="${follow ? "follow" : "fixed"}">` +
    `<style>${css}</style><defs>${shadow}</defs>${view.body}</svg>`
  );
}

/** 四角を全部囲む四角。 */
function union(rects: Rect[]): Rect {
  const x = Math.min(...rects.map((r) => r.x));
  const y = Math.min(...rects.map((r) => r.y));
  return { x, y, w: Math.max(...rects.map((r) => r.x + r.w)) - x, h: Math.max(...rects.map((r) => r.y + r.h)) - y };
}

/** 段で動く物が占める所。 */
function focusOf(layout: Layout, diagram: Diagram, step: number): Rect | undefined {
  const rects = focusParts(layout, diagram, step);
  return rects.length === 0 ? undefined : union(rects);
}

/**
 * 番号の丸が窓から外れる段で、窓に入れる所 (#3046)。
 * 丸とその周りを起点に、丸に近い動く物から順に、窓 (`vw` × `vh`) に収まる間だけ囲む。収まらない物は飛ばして次を見る
 */
function badgeFocus(badge: { x: number; y: number }, parts: Rect[], vw: number, vh: number): Rect {
  const room = LOOK.badge.r + LOOK.follow.badgeRoom;
  const { x: bx, y: by } = badge;
  const away = (p: Rect): number => Math.hypot(Math.max(0, p.x - bx, bx - p.x - p.w), Math.max(0, p.y - by, by - p.y - p.h));
  let held: Rect = { x: bx - room, y: by - room, w: room * 2, h: room * 2 };
  for (const p of [...parts].sort((a, b) => away(a) - away(b))) {
    const next = union([held, p]);
    if (next.w <= vw && next.h <= vh) held = next;
  }
  return held;
}

/** 段で動く物を 1 つずつ。 */
function focusParts(layout: Layout, diagram: Diagram, step: number): Rect[] {
  const rects: Rect[] = [];
  for (const e of layout.edges.filter((x) => x.step === step)) {
    const xs = e.points.map((p) => p[0]);
    const ys = e.points.map((p) => p[1]);
    rects.push({ x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) });
  }
  rects.push(...layout.labels.filter((l) => l.step === step), ...layout.actions.filter((a) => a.step === step));
  for (const event of diagram.steps[step]?.events ?? []) {
    const ids = event.type === "edge" ? [event.from, event.to] : event.type === "action" || event.type === "swap" ? [event.box] : [];
    for (const id of ids) {
      const box = layout.boxes.find((b) => b.id === id);
      // 時系列図の頭の箱は遠いので、線の行だけを見る
      if (box && (layout.kind === "architecture" || event.type === "swap")) rects.push(box);
    }
  }
  return rects;
}

/**
 * 寄って追う窓。段ごとに動く所へ寄り、窓の外の全体図に今見ている所の枠を同じ動きで出す。
 * 全体図は窓に重ねると今動く線や箱を覆うので、窓の外に置く (#3042)。
 * 縦長の全体図は窓の右に列を取り、横長の全体図は窓の下に置く。失う窓の幅か図の高さの小さい側を選ぶ。
 * 枠の中で見える高さを渡された時は、窓と全体図がその高さに入るまで窓を低くする (#3047)。
 * 枠が余る時は窓を広げ、図の原寸の幅と、見える高さか図の高さまで使う。全体図は今の大きさのまま置く (#3053)。
 * 枠の幅が `LOOK.follow.narrow` より狭い時は、縦長の全体図を出さずに窓へ枠の幅の全部を渡す (#3055)。
 * 段で動く物を全部囲んだ所の真ん中に寄せると今の段の番号の丸が窓から外れる段では、丸に近い動く物から窓に収まるだけ囲んだ所へ寄せる (#3046)。
 * 時系列図は頭の箱 `heads` を窓の上端の頭の列に貼り、窓が横に動く時だけ一緒に動かす。頭の箱は図の上端に在り、線を追う窓からは外れるため。
 * 窓は頭の列の下の残りの高さで動く物を真ん中に見せる (#3118)。
 * 頭の列の箱はアイコンを外した 2 段にして低く貼り、線は図の頭の箱の下から見せ始める (#3120)。
 */
function followView(layout: Layout, timeline: Timeline, diagram: Diagram, m: Motion, id: string, content: string, follow: FollowFrame, heads: string): { body: string; w: number; h: number } {
  const F = LOOK.follow;
  const M = LOOK.mini;
  const frameWidth = Math.max(1, follow.width);
  const full = Math.min(layout.width, frameWidth);
  const title = FIGURE_TEXT[follow.lang].overview;
  /** 窓の高さ `vh` の時の全体図の寸法。全体図は窓の高さで縮むので、窓を低くしたら測り直す */
  const sized = (vh: number) => {
    // 全体図の寸法は枠の幅と窓の高さで決め、置き場所に依らない
    const mw = Math.min(M.w, full * 0.4, ((vh * 0.4) / layout.height) * layout.width);
    const k = mw / layout.width;
    const mh = layout.height * k;
    // 地の幅は図の縦横の比で決まるので、縦に長い図では札より狭くなる。その時は地を札の幅まで広げ、図は広げた地の真ん中に置く
    const bw = Math.max(mw, Math.ceil(textWidth(title, TYPE.miniTitle)));
    // 縦横の比は窓の高さに依らないので、低くしても全体図の置き場所は変わらない
    return { vh, mw, k, mh, bw, bgW: bw + M.pad * 2, bgH: mh + M.pad * 2 + M.title, beside: mh > mw };
  };
  const natural = sized(Math.min(layout.height, Math.max(F.minH, full * F.aspect)));
  // 携帯の幅では縦長の全体図の列が枠の幅の 3 割を取り、窓が図の横の 3 割ほどしか見せない。その時は全体図を出さない。
  // 横長の全体図は窓の下に出して幅を取らないので、狭い枠でも出す
  const bare = natural.beside && frameWidth < F.narrow;
  // 窓の右の全体図は窓の高さの中に収まり、窓の下の全体図は窓の高さに足される
  const room = follow.height === undefined ? Number.POSITIVE_INFINITY : natural.beside ? follow.height : follow.height - natural.bgH - M.inset;
  // 見える高さが窓より低ければ窓と全体図を縮め、高ければ全体図はそのままに窓を図の高さまで伸ばす。
  // 全体図も伸ばすと、狭い枠では右の全体図の列が太って窓が狭くなる
  const { vh, mw, k, mh, bw, bgW, bgH, beside } =
    room < natural.vh ? sized(Math.max(F.fitMinH, room)) : { ...natural, vh: Number.isFinite(room) ? Math.min(layout.height, room) : natural.vh };
  // 右の全体図の列は枠の余りに置き、窓は図の原寸の幅まで広げる。枠が図より狭い時は今までどおり枠の幅から列を引く
  const vw = beside && !bare ? Math.min(layout.width, frameWidth - bgW - M.inset) : full;
  const clampX = (x: number): number => Math.min(layout.width - vw / 2, Math.max(vw / 2, x));
  // 時系列図は窓の上端に頭の列を貼るので、動く物は頭の列の下の残りの高さ `below` に見せる (#3118)。
  // 線は図の頭の箱の下 `top` から見せ始め、図の頭の箱は頭の列の下か窓の上に隠す (#3120)
  const top = heads === "" ? 0 : Math.max(...layout.boxes.map((b) => b.y + b.h)) + F.headRoom;
  const strip = heads === "" ? 0 : F.head.pad * 2 + F.head.h;
  const below = vh - strip;
  /** 頭の列の下の残りの窓の真ん中の高さを、図の頭の箱の下と図の下端で止める */
  const clampY = (y: number): number => Math.min(layout.height - below / 2, Math.max(top + below / 2, y));
  const r = LOOK.badge.r;
  let prev: [number, number] = [layout.width / 2, layout.height / 2];
  // 頭の列の下の残りの窓の真ん中。窓の真ん中は、これより頭の列の高さの半分だけ上に在る
  const middles = timeline.steps.map((_, s) => {
    const f = focusOf(layout, diagram, s);
    prev = f ? [f.x + f.w / 2, f.y + f.h / 2] : prev;
    const at: [number, number] = [clampX(prev[0]), clampY(prev[1])];
    // 動く物を全部囲んだ所が窓より大きいと、その端に在る番号の丸が窓から外れる。その段だけ丸の近くへ寄せ直す (#3046)
    const b = layout.badges.find((x) => x.step === s);
    if (!b || (Math.abs(b.x - at[0]) <= vw / 2 - r && Math.abs(b.y - at[1]) <= below / 2 - r)) return at;
    const near = badgeFocus(b, focusParts(layout, diagram, s), vw, below);
    // 動く物の無い次の段は、寄せ直した窓のまま止める
    prev = [near.x + near.w / 2, near.y + near.h / 2];
    return [clampX(prev[0]), clampY(prev[1])] as [number, number];
  });
  const centers = middles.map(([x, y]): [number, number] => [x, y - strip / 2]);
  const c0 = centers[0] as [number, number];
  const cam: [number, number, number, number?, string?][] = [
    [0, c0[0], c0[1]],
    [(timeline.steps[0] as Span).start, c0[0], c0[1]],
  ];
  centers.forEach((c, s) => {
    if (s === 0) return;
    const before = centers[s - 1] as [number, number];
    const start = (timeline.steps[s] as Span).start;
    cam.push([start, before[0], before[1], 1, EASE.inOut], [start + F.ease, c[0], c[1]]);
  });
  const cl = centers[centers.length - 1] as [number, number];
  cam.push([timeline.last, cl[0], cl[1], 1, EASE.inOut], [timeline.total, c0[0], c0[1]]);
  const camKf = m.move(cam.map(([t, cx, cy, s, e]) => [t, vw / 2 - cx, vh / 2 - cy, s, e]));

  // 右に出す時は窓の上端に揃え、下に出す時は窓の右端から内へ寄せる
  const bgX = beside ? vw + M.inset : vw - bgW - M.inset;
  const bgY = beside ? 0 : vh + M.inset;
  const bx = bgX + M.pad;
  const mx = bx + (bw - mw) / 2;
  const my = bgY + M.pad + M.title;
  /**
   * 全体図の地と札と、今見ている所の枠。窓と同じ動きで枠を動かす。
   * 時系列図の枠は頭の列の下の線を見せる所だけを囲む。頭の箱は頭の列に常に出ているため (#3122)
   */
  const overview = (): { clip: string; body: string } => {
    const shapes = [
      ...layout.regions.map((r) => `<rect class="dg-mm-band" style="${cs(r.color)}" x="${mx + r.x * k}" y="${my + r.y * k}" width="${r.w * k}" height="${r.h * k}" rx="3"/>`),
      ...layout.boxes.map((b) => `<rect class="dg-mm-card" style="${cs(b.color)}" x="${mx + b.x * k}" y="${my + b.y * k}" width="${b.w * k}" height="${b.h * k}" rx="1.5"/>`),
    ].join("");
    const vp = m.move(cam.map(([t, cx, cy, , e]) => [t, mx + (cx - vw / 2) * k, my + (cy - vh / 2) * k, 1, e]));
    return {
      clip: `<clipPath id="dg-mm-${id}"><rect x="${mx}" y="${my}" width="${mw}" height="${mh}" rx="4"/></clipPath>`,
      body:
        `<rect class="dg-mm-bg" x="${bgX}" y="${bgY}" width="${bgW}" height="${bgH}" rx="${M.radius}"/>` +
        `<text class="dg-mm-t" x="${bx}" y="${my - M.pad + 2}">${title}</text>` +
        `<g clip-path="url(#dg-mm-${id})"><rect class="dg-mm-world" x="${mx}" y="${my}" width="${mw}" height="${mh}"/>${shapes}<rect class="dg-mm-vp dg-a"${strip === 0 ? "" : ` y="${strip * k}"`} width="${vw * k}" height="${(vh - strip) * k}" rx="2" style="${vp}"/></g>`,
    };
  };
  const mini = bare ? { clip: "", body: "" } : overview();
  // 頭の列は窓の中身の上に重ね、窓と同じ時刻と緩急で横にだけ動かす (#3118)
  const head =
    strip === 0
      ? ""
      : `<g class="dg-hd"><rect class="dg-hd-bg" width="${vw}" height="${strip}"/><line class="dg-sep" x1="0" y1="${strip}" x2="${vw}" y2="${strip}"/>` +
        `<g class="dg-a" style="${m.move(cam.map(([t, cx, , s, e]) => [t, vw / 2 - cx, 0, s, e]))}">${heads}</g></g>`;
  const body =
    `<defs><clipPath id="dg-vp-${id}"><rect width="${vw}" height="${vh}" rx="${LOOK.region.radius}"/></clipPath>${mini.clip}</defs>` +
    `<g clip-path="url(#dg-vp-${id})"><rect class="dg-vp-bg" width="${vw}" height="${vh}"/><g class="dg-a" style="${camKf}">${content}</g>${head}</g>` +
    `<rect class="dg-vp-frame" x="0.5" y="0.5" width="${vw - 1}" height="${vh - 1}" rx="${LOOK.region.radius}"/>${mini.body}`;
  return { body, w: beside && !bare ? vw + M.inset + bgW : full, h: beside ? vh : bgY + bgH };
}

/** 原本の JSON から図を描く。原本が形に合わない時は、誤りの場所を添えて断る。 */
export function renderDiagram(input: unknown, options: RenderOptions = {}): Rendered {
  const lang = options.lang ?? "ja";
  const read = readDiagram(input, { lang });
  if (!read.ok) throw new Error(FIGURE_TEXT[lang].cannotDraw(read.errors.map((e) => `${e.pointer} ${e.message}`).join(" / ")));
  const diagram = read.diagram;
  const layout = diagram.kind === "sequence" ? layoutSequence(diagram) : diagram.kind === "state" ? layoutState(diagram, lang) : layoutArchitecture(diagram);
  return renderLayout(diagram, layout, buildTimeline(diagram), options);
}

/**
 * 置き場所を決めた図を描き、描いた字の重なりを数える (#3175)。`renderDiagram` が原本を読んで置き場所を決めた後に呼ぶ。
 * 重なりは、字を描く部品が記録した字だけから数えるので、描く所が位置を決める字 (箱の名前) も対象に入る
 */
export function renderLayout(diagram: Diagram, layout: Layout, timeline: Timeline, options: RenderOptions = {}): Rendered {
  const palette = resolvePalette(options.palette);
  const theme: Theme = options.theme === "dark" ? "dark" : "light";
  const ink: Ink[] = [];
  const traces: Trace[] = [];
  const svg = drawSvg(diagram, layout, timeline, palette, theme, undefined, ink, traces);
  return {
    svg,
    palette: palette.id,
    theme,
    ...(diagram.view ? { view: diagram.view } : {}),
    fonts: { ...FONTS },
    layout,
    timeline,
    diagram,
    overlaps: findOverlaps(ink, timeline.stills, traces),
  };
}
