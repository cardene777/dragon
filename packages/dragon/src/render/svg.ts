/**
 * 原本の JSON から図を描く入口。置き場所と時刻の表を作り、部品を重なりの順に並べて SVG にする。
 *
 * 動きは全て SVG の中の CSS の keyframes が回す。1 周の長さは `--T`、止める時刻は `--at`、
 * 止めるか流すかは `--play` の変数で外から変えられる (頁に置く `player.ts` がこれを使う)。
 * 色と字は値の表から CSS の変数として 1 度だけ書き、部品はその変数だけを読む。
 */
import { layoutArchitecture } from "../layout/architecture";
import type { Layout, Rect } from "../layout/scene";
import { layoutSequence } from "../layout/sequence";
import { FONTS } from "../look/fonts";
import { type ColorKey, EASE, FONT_VARS, LOOK, MOTION, type Palette, paletteVars, resolvePalette, type TextStyle, type Theme, TYPE } from "../look/values";
import { readDiagram } from "../version";
import type { Diagram, ViewMode } from "../schema";
import { buildTimeline, type Span, type Timeline } from "../timeline";
import { action, badge, band, card, carrier, type Ctx, cs, edge, esc, type FieldChange, label, lifeline, strip, type SubChange } from "./parts";
import { Motion } from "./motion";

export interface RenderOptions {
  /** 色味の名前。書かないか知らない名前なら紙と墨 */
  palette?: string;
  theme?: Theme;
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
}

const font = (t: TextStyle): string => `font:${t.weight} ${t.size}px var(--${t.family})`;
const mix = (pct: number, base = "var(--surf)"): string => `color-mix(in srgb,var(--c) ${pct}%,${base})`;
const S = LOOK.stroke;
const X = LOOK.mix;

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
  ".dg-bd{cursor:pointer}",
  ".dg-bdf{fill:var(--c)}",
  `.dg-bdft{${font(TYPE.badge)};fill:var(--on-c)}`,
  `.dg-bdr{fill:none;stroke:var(--c);stroke-width:${S.badgeRing}}`,
  `.dg-bdp{fill:${mix(X.badgePast)};stroke:${mix(X.badgePastEdge, "transparent")};stroke-width:${S.hair}}`,
  `.dg-bdpt{${font(TYPE.badge)};fill:var(--ct)}`,
  `.dg-cap rect,.dg-act rect{fill:${mix(X.cap)};stroke:${mix(X.capEdge, "transparent")}}`,
  `.dg-cap text{${font(TYPE.label)};fill:var(--ct)}`,
  `.dg-capj text{${font(TYPE.labelJa)}}`,
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
  ".dg-tg rect{fill:var(--c)}",
  `.dg-tg text{${font(TYPE.tag)};fill:var(--on-c)}`,
  ".dg-vp-bg{fill:var(--bg)}",
  ".dg-vp-frame{fill:none;stroke:var(--hair)}",
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
    list.push({ at: time.at, color, ...(event.value !== undefined ? { value: event.value } : {}), ...(event.tag !== undefined ? { tag: event.tag } : {}) });
    out.set(event.field, list);
  }
  return out;
}

export interface FollowFrame {
  /** 枠の幅 (px)。寄って追う窓はこの幅で、字を原寸で見せる */
  width: number;
}

/** 図を描く。`follow` を渡すと、寄って追う窓と隅の全体図で描く。 */
export function drawSvg(diagram: Diagram, layout: Layout, timeline: Timeline, palette: Palette, theme: Theme, follow?: FollowFrame): string {
  const id = nameOf(`${JSON.stringify(diagram)}|${palette.id}|${theme}|${follow ? follow.width : ""}`);
  const m = new Motion(`dg${id}`, timeline.total, timeline.last);
  const ctx: Ctx = { m, t: timeline, sh: `filter="url(#dg-sh-${id})"`, end: (timeline.steps[timeline.steps.length - 1] as Span).end };
  const on = involved(diagram);
  const subs = subChanges(diagram, timeline, layout.kind === "architecture");

  const L = { band: [] as string[], base: [] as string[], lit: [] as string[], node: [] as string[], badge: [] as string[], top: [] as string[] };
  for (const region of layout.regions) L.band.push(band(region));
  if (layout.strip) L.band.push(strip(layout.strip, fieldChanges(diagram, timeline, layout), ctx));
  for (const line of layout.lifelines) L.base.push(lifeline(line.x, line.y1, line.y2));
  for (const e of layout.edges) {
    const time = timeline.edges.find((t) => t.step === e.step && t.event === e.event);
    if (!time) continue;
    const drawn = edge(e, time, ctx);
    L.base.push(drawn.base);
    L.lit.push(drawn.lit);
  }
  for (const box of layout.boxes) L.node.push(card(box, ctx, on.get(box.id) ?? [], subs.get(box.id) ?? []));
  for (const b of layout.badges) L.badge.push(badge(b, ctx));
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
  const view = follow ? followView(layout, timeline, diagram, m, id, content, follow.width) : { body: `<rect class="dg-bg" width="${layout.width}" height="${layout.height}" rx="${LOOK.region.radius}"/>${content}`, w: layout.width, h: layout.height };
  const css = `.dg-${id}{${FONT_VARS};--T:${timeline.total}s;${paletteVars(palette, theme)}}${PART_CSS}${m.frames.join("")}`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" class="dg dg-${id}" viewBox="0 0 ${Math.ceil(view.w)} ${Math.ceil(view.h)}" width="${Math.ceil(view.w)}" height="${Math.ceil(view.h)}" role="img" aria-label="${esc(diagram.title)}" data-dragon="figure" data-view="${follow ? "follow" : "fixed"}">` +
    `<style>${css}</style><defs>${shadow}</defs>${view.body}</svg>`
  );
}

/** 段で動く物が占める所。 */
function focusOf(layout: Layout, diagram: Diagram, step: number): Rect | undefined {
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
  if (rects.length === 0) return undefined;
  const x = Math.min(...rects.map((r) => r.x));
  const y = Math.min(...rects.map((r) => r.y));
  return { x, y, w: Math.max(...rects.map((r) => r.x + r.w)) - x, h: Math.max(...rects.map((r) => r.y + r.h)) - y };
}

/** 寄って追う窓。段ごとに動く所へ寄り、隅の全体図に今見ている所の枠を同じ動きで出す。 */
function followView(layout: Layout, timeline: Timeline, diagram: Diagram, m: Motion, id: string, content: string, frame: number): { body: string; w: number; h: number } {
  const F = LOOK.follow;
  const M = LOOK.mini;
  const vw = Math.min(layout.width, Math.max(1, frame));
  const vh = Math.min(layout.height, Math.max(F.minH, vw * F.aspect));
  const clampX = (x: number): number => Math.min(layout.width - vw / 2, Math.max(vw / 2, x));
  const clampY = (y: number): number => Math.min(layout.height - vh / 2, Math.max(vh / 2, y));
  let prev: [number, number] = [layout.width / 2, layout.height / 2];
  const centers = timeline.steps.map((_, s) => {
    const f = focusOf(layout, diagram, s);
    prev = f ? [f.x + f.w / 2, f.y + f.h / 2] : prev;
    return [clampX(prev[0]), clampY(prev[1])] as [number, number];
  });
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

  const mw = Math.min(M.w, vw * 0.4, ((vh * 0.4) / layout.height) * layout.width);
  const k = mw / layout.width;
  const mh = layout.height * k;
  const mx = vw - mw - M.inset - M.pad;
  const my = M.inset + M.pad + M.title;
  const shapes = [
    ...layout.regions.map((r) => `<rect class="dg-mm-band" style="${cs(r.color)}" x="${mx + r.x * k}" y="${my + r.y * k}" width="${r.w * k}" height="${r.h * k}" rx="3"/>`),
    ...layout.boxes.map((b) => `<rect class="dg-mm-card" style="${cs(b.color)}" x="${mx + b.x * k}" y="${my + b.y * k}" width="${b.w * k}" height="${b.h * k}" rx="1.5"/>`),
  ].join("");
  const vp = m.move(cam.map(([t, cx, cy, , e]) => [t, mx + (cx - vw / 2) * k, my + (cy - vh / 2) * k, 1, e]));
  const mini =
    `<rect class="dg-mm-bg" x="${mx - M.pad}" y="${my - M.pad - M.title}" width="${mw + M.pad * 2}" height="${mh + M.pad * 2 + M.title}" rx="${M.radius}"/>` +
    `<text class="dg-mm-t" x="${mx}" y="${my - M.pad + 2}">全体図</text>` +
    `<g clip-path="url(#dg-mm-${id})"><rect class="dg-mm-world" x="${mx}" y="${my}" width="${mw}" height="${mh}"/>${shapes}<rect class="dg-mm-vp dg-a" width="${vw * k}" height="${vh * k}" rx="2" style="${vp}"/></g>`;
  const body =
    `<defs><clipPath id="dg-vp-${id}"><rect width="${vw}" height="${vh}" rx="${LOOK.region.radius}"/></clipPath><clipPath id="dg-mm-${id}"><rect x="${mx}" y="${my}" width="${mw}" height="${mh}" rx="4"/></clipPath></defs>` +
    `<g clip-path="url(#dg-vp-${id})"><rect class="dg-vp-bg" width="${vw}" height="${vh}"/><g class="dg-a" style="${camKf}">${content}</g></g>` +
    `<rect class="dg-vp-frame" x="0.5" y="0.5" width="${vw - 1}" height="${vh - 1}" rx="${LOOK.region.radius}"/>${mini}`;
  return { body, w: vw, h: vh };
}

/** 原本の JSON から図を描く。原本が形に合わない時は、誤りの場所を添えて断る。 */
export function renderDiagram(input: unknown, options: RenderOptions = {}): Rendered {
  const read = readDiagram(input);
  if (!read.ok) throw new Error(`図を描けない: ${read.errors.map((e) => `${e.pointer} ${e.message}`).join(" / ")}`);
  const diagram = read.diagram;
  const palette = resolvePalette(options.palette);
  const theme: Theme = options.theme === "dark" ? "dark" : "light";
  const layout = diagram.kind === "sequence" ? layoutSequence(diagram) : layoutArchitecture(diagram);
  const timeline = buildTimeline(diagram);
  return {
    svg: drawSvg(diagram, layout, timeline, palette, theme),
    palette: palette.id,
    theme,
    ...(diagram.view ? { view: diagram.view } : {}),
    fonts: { ...FONTS },
    layout,
    timeline,
    diagram,
  };
}
