/**
 * 枝分かれの図 (#3164) を描く部品。見本帳の試作 `docs/design/base/scenes/git.js` の commit と札を写す。
 *
 * commit の丸と、commit どうしを結ぶ線 (親から子、枝を切る、取り込み、当て直し) は、commit と枝と merge commit と当て直しのブロックが描く (#3347)。
 * 線は並べ方が 1 つの並びに出すので、ここで並びを順に読み、線の種類ごとの描き方をブロックから引く。動きの名前は呼んだ順に番号が付くので、描く順は変えない。
 * 札は枝ごとと HEAD に 1 つずつ置き、出来事のたびに次の置き場へ走らせる。札を動かす線は、その段の間だけ引いて消す。
 * 札はその後も動くので、線を残すと札の去った所を指したまま残る。
 * 札の見た目は運ぶ物の札と同じで、どの札も主役ではないので、時刻の表の運ぶ物とは別に動かす。
 */
import { forkLine } from "../blocks/branch/draw";
import { carrier } from "../blocks/carry/draw";
import { cs } from "../blocks/color/draw";
import { commitDot, type LinkLine, parentLine } from "../blocks/commit/draw";
import { copyLine } from "../blocks/copy/draw";
import { mergeLine } from "../blocks/merge/draw";
import type { GitLayout, GitLink, GitMove, GitPlaced } from "../kinds/git/layout";
import type { DiagramModel } from "../schema";
import { hasWide, textWidth } from "../layout/measure";
import type { Point, Rect } from "../layout/scene";
import { EASE, LOOK, MOTION, TYPE } from "../look/values";
import type { EdgeTime, Span, Timeline } from "../timeline";
import type { Frame } from "./motion";
import { type Ctx, esc, pathOf } from "./parts";

const r1 = (v: number): number => Math.round(v * 100) / 100;
const center = (r: Rect): Point => [r.x + r.w / 2, r.y + r.h / 2];

/** 札の形。真ん中を (0, 0) に置き、動きで置き場へ運ぶ */
function tagShape(text: string, sh: string): string {
  const C = LOOK.carrier;
  const ja = hasWide(text);
  const w = textWidth(text, ja ? TYPE.carrierJa : TYPE.carrier) + C.tagPadX * 2;
  return `<rect class="dg-car" x="${r1(-w / 2)}" y="${-C.tagH / 2}" width="${r1(w)}" height="${C.tagH}" rx="${C.tagH / 2}" ${sh}/><text class="dg-car-t${ja ? " dg-car-tj" : ""}" y="${LOOK.baseline.carrier}" text-anchor="middle">${esc(text)}</text>`;
}

/** 線の種類ごとの描き方。親から子は commit、枝を切るのは枝、当て直しは当て直しのブロックが持つ */
const LINK_LINES: Readonly<Record<GitLink["kind"], LinkLine>> = { parent: parentLine, branch: forkLine, copy: copyLine };

/**
 * 線の描き方。親から子への線のうち、merge commit が取り込む枝の先端から引く線は merge commit のブロックが描く。
 * 並べ方は親を取り込む先の先端、取り込む枝の先端の順に並べるので、merge commit の親の並びの最後から引く線が取り込みの線
 */
function lineOf(l: GitLink, diagram: DiagramModel, commits: readonly GitPlaced[]): LinkLine {
  const e = diagram.steps[l.step]?.events[l.event];
  if (l.kind === "parent" && e?.type === "commit" && e.merge !== undefined && commits.find((c) => c.id === l.to)?.parents.at(-1) === l.from) return mergeLine;
  return LINK_LINES[l.kind];
}

export function drawGit(layout: GitLayout, diagram: DiagramModel, timeline: Timeline, ctx: Ctx): { links: string; lines: string; commits: string; tags: string } {
  const { m } = ctx;
  const timeOf = (step: number, event: number): EdgeTime | undefined => timeline.edges.find((t) => t.step === step && t.event === event);

  const links = layout.links
    .map((l) => {
      const time = timeOf(l.step, l.event);
      if (!time) return "";
      ctx.traces.push({ from: l.from, to: l.to, points: l.points, shown: [[time.start, Number.POSITIVE_INFINITY]] });
      return lineOf(l, diagram, layout.commits)(l, time, ctx);
    })
    .join("");

  const commits = layout.commits.map((c) => commitDot(c, timeOf, ctx)).join("");

  const lines = layout.moves
    .flatMap((mv) => {
      const time = timeOf(mv.step, mv.event);
      if (!mv.line || !time) return [];
      const end = (timeline.steps[mv.step] as Span).end;
      ctx.traces.push({ from: mv.ref, to: mv.target ?? mv.ref, points: mv.line, shown: [[time.start, end + 0.4]] });
      const kf = m.kf([
        [0, { opacity: 0, "stroke-dashoffset": 1 }],
        [time.start, { opacity: 0, "stroke-dashoffset": 1 }, EASE.inOut],
        [time.start + 0.05, { opacity: 1 }],
        [time.drawn, { "stroke-dashoffset": 0 }],
        [end, { opacity: 1 }, EASE.inOut],
        [end + 0.4, { opacity: 0 }],
        [m.total, { opacity: 0, "stroke-dashoffset": 0 }],
      ]);
      return [`<g style="${cs(mv.color)}"><path class="dg-e-on dg-a" pathLength="1" d="${pathOf(mv.line)}" style="${kf}"/></g>`];
    })
    .join("");

  // 線に書いた運ぶ物は、線を走って着いた所で消える。着いた所には枝の札が留まるので、運ぶ物は留めない
  const carried = timeline.carriers
    .flatMap((t) => {
      const mv = layout.moves.find((x) => x.step === t.step && x.event === t.event && x.line);
      const source = diagram.steps[t.step]?.events[t.event];
      if (!mv?.line || source?.type !== "edge") return [];
      const edge = { step: t.step, event: t.event, from: mv.ref, to: mv.target ?? mv.ref, points: mv.line, color: mv.color, carry: source.carry };
      return [carrier(edge, { ...t, start: t.depart, end: t.arrive + MOTION.fade }, ctx)];
    })
    .join("");
  const refs = [...new Set(layout.moves.map((mv) => mv.ref))];
  const tags = refs.map((ref) => tagMotion(ref, layout.moves.filter((mv) => mv.ref === ref), timeOf, ctx)).join("") + carried;
  return { links, lines, commits, tags };
}

/**
 * 1 つの札の動き。現れる出来事では着いた時に出し、動く出来事では前の置き場から次の置き場へ走らせ、消える出来事では着いた時に消す。
 * 留まっている間の四角を、字の重なりを数える記録に残す
 */
function tagMotion(ref: string, list: GitMove[], timeOf: (step: number, event: number) => EdgeTime | undefined, ctx: Ctx): string {
  const { m } = ctx;
  const points: [number, number, number][] = [];
  const fades: Frame[] = [[0, { opacity: 0 }]];
  let on = false;
  let rest: { rect: Rect; since: number } | undefined;
  const leave = (t: number): void => {
    if (rest) ctx.ink.push({ text: ref, rect: rest.rect, shown: [[rest.since, t]], boxed: true });
    rest = undefined;
  };
  for (const mv of list) {
    const time = timeOf(mv.step, mv.event);
    if (!time) continue;
    const { start: a, drawn: b } = time;
    const from = mv.from ? center(mv.from) : undefined;
    const to = mv.to ? center(mv.to) : undefined;
    leave(a);
    // 線に運ぶ物を書いた時は、枝の札は走らずに消え、運ぶ物が着いた時に着いた所へ出る
    if (mv.carried && from && to && on) {
      points.push([a + MOTION.fade, from[0], from[1]], [b - MOTION.fade, to[0], to[1]]);
      fades.push([a, { opacity: 1 }, EASE.inOut], [a + MOTION.fade, { opacity: 0 }], [b - MOTION.fade, { opacity: 0 }, EASE.out], [b, { opacity: 1 }]);
      rest = { rect: mv.to as Rect, since: b };
      continue;
    }
    if (from) points.push([a, from[0], from[1]]);
    if (to) points.push([b, to[0], to[1]]);
    if (to && !on) {
      // 前の置き場から走る札は走り出す時に、何も無い所に現れる札は着いた時に出す
      const show = from ? a : b - MOTION.fade;
      fades.push([show, { opacity: 0 }, EASE.out], [show + MOTION.fade, { opacity: 1 }]);
      on = true;
    } else if (!to && on) {
      fades.push([b, { opacity: 1 }, EASE.inOut], [b + MOTION.untilFade, { opacity: 0 }]);
      on = false;
    }
    if (mv.to) rest = { rect: mv.to, since: b };
  }
  leave(Number.POSITIVE_INFINITY);
  if (points.length === 0) return "";
  const first = points[0] as [number, number, number];
  const last = points[points.length - 1] as [number, number, number];
  if (on) fades.push([m.last, { opacity: 1 }, EASE.inOut], [m.total, { opacity: 0 }]);
  else fades.push([m.total, { opacity: 0 }]);
  const style = m.move([[0, first[1], first[2]], ...points, [m.total, last[1], last[2]]], fades);
  return `<g class="dg-a" data-ref="${esc(ref)}" style="${style}">${tagShape(ref, ctx.sh)}</g>`;
}
