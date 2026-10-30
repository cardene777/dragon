/**
 * 木の図 (#3233) を描く部品。見た目の元は step 2 で本人が選んだ「根を上」の試作 (`.context/propose/merkle-look/`)。
 *
 * 木の箱は書いた段で、親から子への木の線を引き終えた時に弾んで出る。木の線は親を書いた段で引き、最後まで残す。
 * 値を持つ葉の下の名札の札は、葉より前の最初の段から出しておき、葉が出た時に葉と札を点線で結ぶ。
 * 木の線を走る運ぶ物は着いた所で消え、通った木の線を運ぶ物の色で最後まで残す (`data-tree-trail`)。
 * 木の線を運ぶ物が初めて通った段から後は、それまでに運ぶ物を送るか受けた木の箱だけを濃く出し、ほかの木の箱と札と木の線を薄く出す。
 * 線の両端になった木の箱は、その段の間だけ縁に色を付ける。
 * 木の箱が現れる時刻 (`appear`) を返し、木の線を走らない線の点線はその時刻から出す (#3240)。
 */
import type { TreeLayout } from "../layout/tree";
import { EASE, LOOK, MOTION, TYPE } from "../look/values";
import type { Diagram } from "../schema";
import type { EdgeTime, Timeline } from "../timeline";
import type { Frame } from "./motion";
import { ALWAYS } from "./ink";
import { activeKf, arrowHead, type Ctx, cs, esc, glyph, pathOf, write } from "./parts";

const r1 = (v: number): number => Math.round(v * 100) / 100;

export function drawTree(layout: TreeLayout, diagram: Diagram, timeline: Timeline, ctx: Ctx): { links: string; trails: string; nodes: string; appear: Map<string, number> } {
  const { m } = ctx;
  const T = LOOK.tree;
  const B = LOOK.box;
  const timeOf = (step: number, event: number): EdgeTime | undefined => timeline.edges.find((t) => t.step === step && t.event === event);

  // 木の箱ごとの、線の両端になる段と、運ぶ物を初めて送るか受けた段
  const active = new Map<string, Set<number>>();
  const touched = new Map<string, number>();
  diagram.steps.forEach((step, s) => {
    for (const e of step.events) {
      if (e.type !== "edge") continue;
      for (const id of [e.from, e.to]) {
        active.set(id, (active.get(id) ?? new Set()).add(s));
        if (e.carry.kind !== "none" && !touched.has(id)) touched.set(id, s);
      }
    }
  });
  const carries = (step: number, event: number): boolean => {
    const e = diagram.steps[step]?.events[event];
    return e?.type === "edge" && e.carry.kind !== "none";
  };
  const fadeStep = layout.runs.filter((run) => carries(run.step, run.event)).reduce<number | undefined>((s, run) => (s === undefined ? run.step : Math.min(s, run.step)), undefined);
  const fadeAt = fadeStep === undefined ? undefined : timeline.steps[fadeStep]?.start;

  /** 木の箱 `id` の薄くなる動き。薄くしない箱は `undefined` */
  const fadeOf = (id: string): string | undefined => {
    if (fadeStep === undefined || fadeAt === undefined) return undefined;
    const t = touched.get(id);
    if (t !== undefined && t <= fadeStep) return undefined;
    const back = t === undefined ? undefined : timeline.steps[t]?.start;
    const frames: Frame[] = [
      [0, { opacity: 1 }],
      [fadeAt, { opacity: 1 }, EASE.inOut],
      [fadeAt + MOTION.fade, { opacity: T.faint }],
    ];
    if (back !== undefined) frames.push([back, { opacity: T.faint }, EASE.inOut], [back + MOTION.fade, { opacity: 1 }]);
    frames.push([m.last, { opacity: back === undefined ? T.faint : 1 }, EASE.inOut], [m.total, { opacity: 1 }]);
    return m.kf(frames);
  };
  const faded = (id: string, markup: string, attrs = ""): string => {
    const fade = fadeOf(id);
    return fade ? `<g class="dg-a"${attrs} style="${fade}">${markup}</g>` : attrs === "" ? markup : `<g${attrs}>${markup}</g>`;
  };

  const drawnAt = new Map(layout.nodes.map((n) => [n.id, timeOf(n.step, n.event)?.drawn ?? 0]));

  // 木の線と、葉と札を結ぶ点線。木の線は親を書いた段で引き始め、引き終えた後も残す
  const links = layout.links
    .map((l) => {
      const time = timeOf(l.step, l.event);
      if (!time) return "";
      ctx.traces.push({ from: l.from, to: l.to, points: l.points, shown: [[time.start, Number.POSITIVE_INFINITY]] });
      const kf = m.kf([
        [0, { opacity: 0, "stroke-dashoffset": 1 }],
        [time.start, { opacity: 0, "stroke-dashoffset": 1 }, EASE.inOut],
        [time.start + 0.05, { opacity: 1 }],
        [time.drawn, { "stroke-dashoffset": 0 }],
        [m.last, { opacity: 1, "stroke-dashoffset": 0 }, EASE.inOut],
        [m.total, { opacity: 0, "stroke-dashoffset": 0 }],
      ]);
      return faded(l.from, `<path class="dg-tree-l dg-a" data-tree-link="${esc(l.from)}" pathLength="1" d="${pathOf(l.points)}" style="${kf}"/>`);
    })
    .join("");
  const ties = layout.nodes
    .flatMap((n) => {
      if (!n.card) return [];
      const at = drawnAt.get(n.id) ?? 0;
      const d = `M ${r1(n.cx)} ${r1(n.y + n.h + LOOK.edge.inset)} V ${r1(n.card.y - LOOK.edge.inset)}`;
      return [faded(n.id, `<path class="dg-tree-con dg-a" d="${d}" style="${m.vis(at)}"/>`)];
    })
    .join("");

  // 木の線を運ぶ物が通った跡。運ぶ物が走るのに合わせて引き、最後まで残す。同じ木の線は最初に通った段の跡だけを描く
  const traced = new Set<string>();
  const trails = layout.runs
    .flatMap((run) => {
      const e = layout.edges.find((x) => x.step === run.step && x.event === run.event);
      if (!e || traced.has(run.link)) return [];
      const carried = timeline.carriers.find((c) => c.step === run.step && c.event === run.event);
      const time = timeOf(run.step, run.event);
      const a = carried?.depart ?? time?.start;
      const b = carried?.arrive ?? time?.drawn;
      if (a === undefined || b === undefined) return [];
      traced.add(run.link);
      const kf = m.kf([
        [0, { opacity: 0, "stroke-dashoffset": 1 }],
        [a, { opacity: 0, "stroke-dashoffset": 1 }, EASE.inOut],
        [a + 0.05, { opacity: 1 }],
        [b, { "stroke-dashoffset": 0 }],
        [m.last, { opacity: 1, "stroke-dashoffset": 0 }, EASE.inOut],
        [m.total, { opacity: 0, "stroke-dashoffset": 0 }],
      ]);
      const d = pathOf(e.points);
      return [
        `<g style="${cs(e.color)}"><path class="dg-tree-tr dg-a" data-tree-trail="${esc(run.link)}" pathLength="1" d="${d}" style="${kf}"/><path class="dg-tree-h dg-a" d="${arrowHead(e.points)}" style="${m.vis(b)}"/></g>`,
      ];
    })
    .join("");

  // 葉の下の名札の札。最初の段から出しておく
  const cards = layout.nodes
    .flatMap((n) => {
      const c = n.card;
      if (!c) return [];
      const gx = c.x + T.card.padX + T.card.icon / 2;
      const cy = c.y + c.h / 2;
      const text = write(ctx.ink, "dg-tree-ct", c.x + T.card.padX + T.card.icon + T.card.gap, cy + LOOK.baseline.label, c.text, TYPE.treeCard, ALWAYS);
      return [
        faded(
          n.id,
          `<rect class="dg-tree-card" x="${r1(c.x)}" y="${r1(c.y)}" width="${r1(c.w)}" height="${c.h}" rx="${T.card.radius}"/>${glyph("doc", gx, cy, T.card.glyph, "dg-tree-cg")}${text}`,
          ` data-tree-card="${esc(n.id)}"`,
        ),
      ];
    })
    .join("");

  // 木の箱。親から子への線を引き終えた時に弾んで出る。根は左に枝の絵柄を持ち、字を絵柄の右に左揃えで並べる
  const nodes = layout.nodes
    .map((n) => {
      const at = drawnAt.get(n.id) ?? 0;
      const on = [...(active.get(n.id) ?? [])].sort((x, y) => x - y);
      const act = on.length > 0 ? activeKf(ctx, on) : undefined;
      const radius = n.root ? T.root.radius : T.radius;
      const rect = (cls: string, extra = ""): string => `<rect class="${cls}" x="${r1(n.x)}" y="${r1(n.y)}" width="${r1(n.w)}" height="${n.h}" rx="${radius}"${extra}/>`;
      const frame = `${act ? `<g class="dg-a" style="${act}">${rect("dg-halo")}</g>` : ""}${rect("dg-st", ` ${ctx.sh}`)}${act ? `<g class="dg-a" style="${act}">${rect("dg-on")}</g>` : ""}`;
      const ix = n.x + T.root.iconX + B.icon / 2;
      const mark = n.root ? `<rect class="dg-ic" x="${r1(ix - B.icon / 2)}" y="${r1(n.cy - B.icon / 2)}" width="${B.icon}" height="${B.icon}" rx="${B.iconRadius}"/>${glyph("tree", ix, n.cy, B.iconScale)}` : "";
      const shown: [number, number][] = [[at, Number.POSITIVE_INFINITY]];
      const texts = n.lines
        .map((line, k) => {
          const style = n.styles[k] ?? TYPE.boxName;
          const cls = style === TYPE.treeHash ? "dg-tree-hash" : style === TYPE.treeName ? "dg-tree-name" : style === TYPE.rootHash ? "dg-tree-rh" : style === TYPE.rootName ? "dg-tree-rn" : "dg-tree-one";
          const baseline = n.baselines[k] ?? n.cy;
          return n.root ? write(ctx.ink, cls, n.x + T.root.textX, baseline, line, style, shown) : write(ctx.ink, cls, n.cx, baseline, line, style, shown, "middle");
        })
        .join("");
      const inner = faded(n.id, `${frame}${mark}${texts}`, ` data-tree-node="${esc(n.id)}"${n.root ? ` data-tree-root="${esc(n.id)}"` : ""}`);
      return `<g class="dg-popc dg-a" style="${cs(n.color)};${m.pop(at)}">${inner}</g>`;
    })
    .join("");

  return { links: links + ties, trails, nodes: cards + nodes, appear: drawnAt };
}
