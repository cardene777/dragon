/**
 * 点で数える見た目 (`[shape: dots]`、#3635) を描く部品。量の図 (`render/chart.ts`) と集合の重なりの図 (`render/venn.ts`) が使う。
 *
 * 重なりの順は、全体の箱の枠、箱の空の点、字、点の順にし、点を箱の上に出す。置き場所は並べ方 (`layout/dots.ts`) が決めた。
 * 点は段ごとに寄り始めの順 (`waves`) だけずらした時刻から `DOTS_LOOK.motion.move` 秒で、前の段の置き場所から次の段の置き場所へ寄る。
 * 塗りは寄り始めと同時に次の段の塗りへ替わる。2 つ以上の集まりに入る点は、入る集まりの色で 1 点を扇形に等分に塗る。
 * 初めから箱に在る点は最初の段の前から見え、2 度目から増えた点は小さな所から一度大きくなって弾んで現れ、減った点はその場で薄くなって消える。
 * 字は描いた所と見えている間を字の記録 (`ink`) に残し、`dragon check --layout` と書き出しが字の重なりと枠からのはみ出しを数える。
 * 部品は検査と読み上げの道具が引けるよう `data-dot-*` を持つ。
 *
 * | 目印 | 部品 |
 * |---|---|
 * | `data-dot` | 1 つの点。置き場所は `transform` の `translate` |
 * | `data-dot-body` | 点の中で大きさを変える部品 |
 * | `data-dot-paint` | 点の塗り。値は群れの名札で、まだどこにも入らない塗りは空 |
 * | `data-dot-slice` | 扇形の 1 切れ。値は集まりの名札 |
 * | `data-dot-box` と `data-dot-hole` | 全体の箱の枠と空の点 |
 * | `data-dot-unit` と `data-dot-title` | 1 点の件数と全体の件数の字 |
 * | `data-dot-name` と `data-dot-count` と `data-dot-region` | 名前と件数と区画の件数の字。値は名札 |
 *
 * この file は後から読む量の図と集合の重なりの図の塊だけが読み、見本帳を開いた時に読む塊に入れない
 */
import { runSpan, textRuns } from "../blocks/chart-set/draw";
import { cs } from "../blocks/color/draw";
import type { DotGroup, DotPlan, DotText, PlacedDot } from "../layout/dots";
import { dotTextRect } from "../layout/dots";
import type { Point } from "../layout/scene";
import { DOTS_LOOK, DOTS_TYPE } from "../look/dots";
import { EASE, LOOK, MOTION } from "../look/values";
import type { Frame, Props } from "./motion";
import { type Ctx, cssFont as font, esc, r1 } from "./parts";

const M = DOTS_LOOK.motion;

/** 点で数える見た目の見た目の規則。箱の枠と空の点、点の塗り、扇形の切れの縁、字 */
export const DOTS_CSS = [
  `.dg-dt-box{fill:var(--surf);stroke:var(--line);stroke-width:${DOTS_LOOK.box.stroke}}`,
  `.dg-dt-hole{fill:none;stroke:var(--line);stroke-width:${DOTS_LOOK.box.hole}}`,
  ".dg-dt-e{fill:var(--line)}",
  ".dg-dt-p{fill:var(--c)}",
  ".dg-dt-s{fill:var(--c);stroke:var(--surf);stroke-width:.8}",
  ".dg-dt-b{transform-box:fill-box;transform-origin:50% 50%}",
  `.dg-dt-name{${font(DOTS_TYPE.name)};fill:var(--ct)}`,
  `.dg-dt-count{${font(DOTS_TYPE.count)};fill:var(--ink2)}`,
  `.dg-dt-region{${font(DOTS_TYPE.region)};fill:var(--ink2)}`,
  `.dg-dt-title{${font(DOTS_TYPE.title)};fill:var(--ink)}`,
  `.dg-dt-unit{${font(DOTS_TYPE.unit)};fill:var(--mute)}`,
  `.dg-dt-none{${font(DOTS_TYPE.none)};fill:var(--ct)}`,
].join("");

/** 字の役ごとの、検査と読み上げの道具が引く目印 */
const TEXT_ATTR: Record<DotText["role"], string> = { name: "name", count: "count", region: "region", title: "title", unit: "unit", none: "count" };

const r2 = (v: number): number => Math.round(v * 100) / 100;

/** 点の置き場所の `transform` */
const place = ([x, y]: Point): string => `translate(${r2(x)}px,${r2(y)}px)`;

/** 段 `s` で、寄り始めの順 `wave` の点が寄り始める時刻。同じ段で寄る群れが多い時は、ずれを全部で `M.spread` 秒に収める */
function movesAt(plan: DotPlan, ctx: Ctx, s: number, wave: number): number {
  const count = plan.waves[s] ?? 1;
  const gap = count > 1 ? Math.min(M.stagger, M.spread / (count - 1)) : 0;
  return (ctx.t.steps[s]?.start ?? 0) + MOTION.edgeAt + wave * gap;
}

/** 1 つの点の置き場所と濃さの keyframes の点。寄る段は前の段の置き場所から寄り、現れる段は濃くなり、消える段は薄くなる */
function dotFrames(dot: PlacedDot, plan: DotPlan, ctx: Ctx): Frame[] {
  const { m } = ctx;
  const start = dot.at[0] ?? [0, 0];
  const frames: Frame[] = [[0, { transform: place(start), opacity: 0 }]];
  if (dot.born === -1) frames.push([MOTION.fade, { opacity: 1 }]);
  let visible = dot.born === -1;
  dot.at.forEach((p, s) => {
    const a = movesAt(plan, ctx, s, dot.waves[s] ?? 0);
    const before = s === 0 ? start : (dot.at[s - 1] ?? start);
    if (visible && Math.hypot(p[0] - before[0], p[1] - before[1]) > 0.01) frames.push([a, { transform: place(before) }, EASE.out], [a + M.move, { transform: place(p) }]);
    if (dot.born === s) {
      frames.push([a, { opacity: 0, transform: place(p) }], [a + M.pop / 2, { opacity: 1 }]);
      visible = true;
    }
    if (dot.gone === s) {
      frames.push([a, { opacity: 1 }, EASE.inOut], [a + M.fade, { opacity: 0 }]);
      visible = false;
    }
  });
  const end = dot.at.at(-1) ?? start;
  frames.push([m.last, { opacity: visible ? 1 : 0, transform: place(end) }, EASE.inOut], [Math.min(m.last + MOTION.fade, m.total), { opacity: 0 }], [m.total, { opacity: 0, transform: place(start) }]);
  return frames;
}

/** 点が段 `s` に持つ塗りの、その段より前の塗り */
const paintBefore = (dot: PlacedDot, s: number): string => (s === 0 ? dot.first : (dot.paint[s - 1] ?? dot.first));

/** 塗りの名札 `key` の濃さの keyframes。塗りが替わる段では、寄り始めから `MOTION.fade` 秒で入れ替える */
function paintMotion(dot: PlacedDot, key: string, plan: DotPlan, ctx: Ctx): string {
  const on = (k: string): number => (k === key ? 1 : 0);
  const frames: Frame[] = [[0, { opacity: on(dot.first) }]];
  dot.paint.forEach((paint, s) => {
    const before = paintBefore(dot, s);
    if (paint === before) return;
    const a = movesAt(plan, ctx, s, dot.waves[s] ?? 0);
    frames.push([a, { opacity: on(before) }, EASE.inOut], [a + MOTION.fade, { opacity: on(paint) }]);
  });
  // 最後の段の塗りを点が消え終わるまで保ち、繰り返す前に最初の塗りへ戻す
  frames.push([Math.min(ctx.m.last + MOTION.fade, ctx.m.total), { opacity: on(dot.paint.at(-1) ?? dot.first) }], [ctx.m.total, { opacity: on(dot.first) }]);
  return ctx.m.kf(frames);
}

/** 1 つの塗り。どこにも入らない塗りは地の線の色、1 つの群れは群れの色、2 つ以上の集まりに入る群れは扇形に等分に塗る */
function paintOf(key: string, group: DotGroup | undefined, r: number, style: string): string {
  const attr = ` data-dot-paint="${esc(key)}"`;
  if (!group) return `<circle class="dg-dt-e dg-a" r="${r}"${attr} style="${style}"/>`;
  const [only] = group.colors;
  if (group.colors.length < 2 && only) return `<circle class="dg-dt-p dg-a" r="${r}"${attr} style="${cs(only)};${style}"/>`;
  const n = group.colors.length;
  const end = (a: number): string => `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`;
  const slices = group.colors.map((color, i) => {
    const a0 = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const a1 = a0 + (2 * Math.PI) / n;
    return `<path class="dg-dt-s" d="M0 0L${end(a0)}A${r} ${r} 0 0 1 ${end(a1)}Z" data-dot-slice="${esc(group.members[i] ?? "")}" style="${cs(color)}"/>`;
  });
  return `<g class="dg-a"${attr} style="${style}">${slices.join("")}</g>`;
}

/** 増えた点が弾む、点の中の大きさの keyframes。ほかの点は大きさを変えない */
function popMotion(dot: PlacedDot, plan: DotPlan, ctx: Ctx): string {
  if (dot.born < 0) return "";
  const a = movesAt(plan, ctx, dot.born, dot.waves[dot.born] ?? 0);
  const scale = (s: number): Props => ({ transform: `scale(${s})` });
  return ` style="${ctx.m.kf([
    [0, scale(1)],
    [a, scale(LOOK.popFrom), EASE.out],
    [a + M.pop * 0.6, scale(M.popOver), EASE.inOut],
    [a + M.pop, scale(1)],
  ])}"`;
}

/** 1 つの点。置き場所と濃さを動かす部品の中に、大きさを変える部品と、持つ塗りごとの部品を重ねる */
function drawDot(dot: PlacedDot, plan: DotPlan, ctx: Ctx): string {
  const keys = [...new Set([dot.first, ...dot.paint])];
  const r = plan.size.r;
  const paints = keys.map((key) =>
    paintOf(
      key,
      plan.groups.find((g) => g.key === key && key !== ""),
      r,
      paintMotion(dot, key, plan, ctx),
    ),
  );
  const body = `<g class="dg-dt-b dg-a" data-dot-body=""${popMotion(dot, plan, ctx)}>${paints.join("")}</g>`;
  return `<g class="dg-a" data-dot="" style="${ctx.m.kf(dotFrames(dot, plan, ctx))}">${body}</g>`;
}

/** 字。段ごとの字を同じ字が続く段ごとに 1 つの字にし、点が寄り始めてから出す。`always` の字は初めから最後まで出す */
function drawText(t: DotText, ctx: Ctx): string {
  const attr = ` data-dot-${TEXT_ATTR[t.role]}="${esc(t.key)}"`;
  const anchor = t.anchor === "middle" ? ' text-anchor="middle"' : "";
  const color = t.color ? `${cs(t.color)};` : "";
  const cls = `dg-dt-${t.role}`;
  const at = `x="${r1(t.x)}" y="${r1(t.y)}"`;
  if (t.always) {
    const text = t.texts[0] ?? "";
    ctx.ink.push({ text, rect: dotTextRect(t, text), shown: [[0, Number.POSITIVE_INFINITY]] });
    return `<text class="${cls}" ${at}${anchor}${attr}${color ? ` style="${color}"` : ""}>${esc(text)}</text>`;
  }
  return textRuns(t.texts)
    .map((run) => {
      const [a, b] = runSpan(run, MOTION.edgeAt, ctx);
      const y = t.ys?.[run.from] ?? t.y;
      ctx.ink.push({ text: run.text, rect: dotTextRect({ ...t, y }, run.text), shown: [[a, b + MOTION.fade]] });
      return `<text class="${cls} dg-a" x="${r1(t.x)}" y="${r1(y)}"${anchor}${attr} style="${color}${ctx.m.vis(a, b)}">${esc(run.text)}</text>`;
    })
    .join("");
}

/** 点で数える見た目を描く。全体の箱と空の点、字、点の順に重ねる */
export function drawDots(plan: DotPlan, ctx: Ctx): string {
  const { rect } = plan.box;
  const box = `<rect class="dg-dt-box" x="${r1(rect.x)}" y="${r1(rect.y)}" width="${r1(rect.w)}" height="${r1(rect.h)}" rx="${DOTS_LOOK.box.radius}" data-dot-box=""/>`;
  const holes = plan.box.holes.map(([x, y]) => `<circle class="dg-dt-hole" cx="${r1(x)}" cy="${r1(y)}" r="${plan.size.r}" data-dot-hole=""/>`).join("");
  const texts = plan.texts.map((t) => drawText(t, ctx)).join("");
  const dots = plan.dots.map((dot) => drawDot(dot, plan, ctx)).join("");
  return `<g class="dg-dt">${box}${holes}${texts}${dots}</g>`;
}
