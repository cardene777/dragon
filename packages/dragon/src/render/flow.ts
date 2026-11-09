/**
 * 手順の図 (#3561) の線と段の印と箱の字を描く部品。見た目の元は step 2 で本人が選んだ動く試作の「上から下へ」。
 *
 * 段で動く線は青で引き、線の上を段の印の点が走って、着くと消える。段が終わった線は濃い墨の色で残す。
 * 運ぶ物を書かない線に点を走らせ、書いた運ぶ物 (`carry: coin` と `tag`) は運ぶ物のブロックが走らせる。`carry: none` の線は何も走らせない。
 * 点が着いた判断は琥珀の薄い色で塗り、本筋に無い箱は名前を薄い色で書き、問いを折った判断は行ごとに書く。
 * この file は手順の図の描く部品 (`kinds/flow.ts`) が出し、見本帳を開いた時に読む塊に入れない。
 * 見た目の規則は手順の図の SVG にだけ書く。どの規則も手順の図だけが使う class に付け、同じ頁に置いたほかの図の部品に掛けない
 */
import { carrierTimes, type Departure } from "../blocks/carry/timing";
import { flowFrame } from "../blocks/choice/draw";
import { cs } from "../blocks/color/draw";
import { textBox } from "../layout/measure";
import { along, type Layout, pathLength, type SceneBox } from "../layout/scene";
import { LOOK, MOTION, TYPE } from "../look/values";
import type { DiagramModel } from "../schema";
import type { EdgeTime, MarkTime, Timeline } from "../timeline";
import { ALWAYS, type Ink } from "./ink";
import type { Motion } from "./motion";
import { type Ctx, esc, r1, write } from "./parts";

const { mark } = LOOK.flow;

/**
 * 手順の図の見た目の規則。段の印の点、着いた判断の薄い色の地、本筋に無い箱の名前を足す。
 * 線はほかの図と同じ部品 (`blocks/edge/draw.ts`) で描き、この図の中でだけ、段が終わった線を濃い墨の色にして白い点を流さない。向きは段の印の点が見せる。
 * 線の部品は見本帳を開いた時に読む塊に在るので、手順の図のために部品を広げない。規則は図の名前 (`dg-<id>`) で囲み、同じ頁に置いたほかの図の線に掛けない
 */
export const flowCss = (id: string): string =>
  [
    `.dg-${id} .dg-e-past,.dg-${id} .dg-eh-past{stroke:var(--ink2)}`,
    `.dg-${id} .dg-flow{display:none}`,
    `.dg-fl-mark{fill:var(--c);stroke:var(--surf);stroke-width:${mark.ring}}`,
    ".dg-fl-reach{fill:color-mix(in srgb,var(--c) var(--tint),var(--surf));stroke:none}",
    ".dg-sn.dg-sn-off{fill:var(--mute)}",
  ].join("");

/**
 * 段の印の点が走る間。運ぶ物を書かない線ごとに、線を引く間に点が走る。
 * 同じ段で、前の線が着いた箱から続けて出る線は、線を少しずらして引き始めても、点は前の線の点が着いてから走り出す。
 * 点は着いた箱を通って次の線へ進むように見え、着く時刻は線を引き終える時刻のままにする
 */
function markTimes(diagram: DiagramModel, edges: readonly EdgeTime[]): MarkTime[] {
  const marks: MarkTime[] = [];
  let before: { mark: MarkTime; to: string } | undefined;
  for (const edge of edges) {
    const event = diagram.steps[edge.step]?.events[edge.event];
    if (event?.type !== "edge" || event.carry.kind !== "envelope") {
      before = undefined;
      continue;
    }
    const follows = before !== undefined && before.mark.step === edge.step && before.to === event.from;
    const depart = follows && before ? Math.max(edge.start, before.mark.arrive) : edge.start;
    const mark = { step: edge.step, event: edge.event, depart, arrive: Math.max(edge.drawn, depart) };
    marks.push(mark);
    before = { mark, to: event.to };
  }
  return marks;
}

/**
 * 手順の図の時刻の表。図の種類を問わず組んだ表 (`buildTimeline`) を受け取り、手順の図の分を直す。
 * 運ぶ物を書かない線は封筒の代わりに段の印の点が走るので、運ぶ物の表から外して段の印の表 (`marks`) に載せる。
 * 書いた運ぶ物 (`carry: coin` と `tag`) は、走り出す前に箱の下の端で待たず、線を引き始める時に出る。待つと箱の名前と段の番号を隠すため。始まりの印から出る物だけは印の左で待つ。
 * 着く前に同じ段で次の線を引き始める箱 (同じ段で続けて辿る箱) は、着いてから段の終わりまで光らせる。
 * 線は段の中で少しずつずらして引くので、次の線を引き始める時刻で消すと、光る間の終わりが始まりより前になるため
 */
export function flowTimes(diagram: DiagramModel, t: Timeline): Timeline {
  const departures: Departure[] = t.edges.flatMap(({ step, event, start, drawn }) => {
    const e = diagram.steps[step]?.events[event];
    if (e?.type !== "edge" || e.carry.kind === "envelope" || e.carry.kind === "none") return [];
    return [{ step, event, who: e.carry.kind === "coin" ? "coin" : "main", a: start, b: drawn }];
  });
  const fromStart = (c: { step: number; event: number }): boolean => {
    const e = diagram.steps[c.step]?.events[c.event];
    return e?.type === "edge" && e.from === "start";
  };
  return {
    ...t,
    carriers: carrierTimes(departures, t.steps[0]?.start ?? 0, t.last).map((c) => (fromStart(c) ? c : { ...c, start: c.depart })),
    marks: markTimes(diagram, t.edges),
  };
}

const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * 段の印の点。点が走り出す時に線の始まりに出て線の上を走り、着いた時に消える (`Timeline.marks`)。
 * 点が着いた時に、着いた箱と判断が光る
 */
export function stepMarks(layout: Layout, ctx: Ctx): string {
  const { m } = ctx;
  const n = LOOK.carrier.samples;
  return (ctx.t.marks ?? [])
    .flatMap(({ step, event, depart: a, arrive: b }) => {
      const e = layout.edges.find((x) => x.step === step && x.event === event);
      if (!e || e.points.length < 2) return [];
      const length = pathLength(e.points);
      const pts: [number, number, number][] = [];
      for (let k = 0; k <= n; k++) {
        const [x, y] = along(e.points, easeInOut(k / n) * length);
        pts.push([a + ((b - a) * k) / n, x, y]);
      }
      const first = pts[0] as [number, number, number];
      const last = pts[pts.length - 1] as [number, number, number];
      const path: [number, number, number][] = [[0, first[1], first[2]], ...pts, [m.total, last[1], last[2]]];
      return [`<g class="dg-a" style="${m.move(path, m.blink(a, b, MOTION.untilFade))}"><circle class="dg-fl-mark" r="${mark.r}" style="${cs(LOOK.flow.on)}"/></g>`];
    })
    .join("");
}

/**
 * 箱の名前の字。本筋に無い箱は薄い色で書き、問いを折った判断は行ごとに置く。基準線を `y` に置く。
 * 折った問いも 1 つの字の部品にして行を `tspan` で置く。頁と読み上げが字の部品を 1 つの名前として読むため。
 * 欧文の行の間の空白は字の部品の中身には残し、大きさを 0 にして行の幅に数えない
 */
function flowName(box: SceneBox, ink: Ink[], x: number, y: number): string {
  const cls = box.off ? "dg-sn dg-sn-off" : "dg-sn";
  const { lines } = box;
  if (!lines) return write(ink, cls, x, y, box.name, TYPE.boxName, ALWAYS, "middle");
  for (const l of lines) ink.push({ text: l.text, rect: textBox(l.text, x, y + l.dy, TYPE.boxName, "middle"), shown: ALWAYS });
  const space = lines.map((l) => l.text).join(" ") === box.name ? '<tspan font-size="0"> </tspan>' : "";
  const rows = lines.map((l) => `<tspan x="${r1(x)}" y="${r1(y + l.dy)}">${esc(l.text)}</tspan>`).join(space);
  return `<text class="${cls}" x="${r1(x)}" y="${r1(y + (lines[0]?.dy ?? 0))}" text-anchor="middle">${rows}</text>`;
}

/**
 * 描く所へ渡す、手順の図の箱の縁と名前の描き方 (`Ctx` の `frame` と `boxName`)。
 * 縁は判断のひし形と本筋に無い箱の点線の縁を描き、点が初めて着いた判断は、その時から地の上を判断の色 (琥珀) の薄い色で塗る
 */
export function flowHooks(m: Motion, t: Timeline): Pick<Ctx, "frame" | "boxName"> {
  const reached = new Map((t.states ?? []).flatMap((s): [string, number][] => (s.lit[0] ? [[s.box, s.lit[0].start]] : [])));
  return {
    frame: (box, cls, extra, rect, corner) => {
      const shape = flowFrame(box, cls, extra, rect, corner);
      const at = cls === "dg-st" && box.shape === "diamond" ? reached.get(box.id) : undefined;
      return at === undefined ? shape : `${shape ?? ""}<g class="dg-a" style="${m.vis(at)}">${flowFrame(box, "dg-fl-reach", "", rect, corner) ?? ""}</g>`;
    },
    boxName: flowName,
  };
}
