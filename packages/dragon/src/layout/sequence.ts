/**
 * 時系列図の置き場所。
 *
 * 生存線の頭の箱を上に横 1 列に並べ、段で起きる線と処理を起きる順に 1 行ずつ下へ積む。
 * 生存線の間は、箱の幅と、その間を走る線の名前が収まる幅を取る。中身の帯は一番下に置く。
 */
import { LOOK, TYPE } from "../look/values";
import type { Diagram } from "../schema";
import { textWidth } from "./measure";
import {
  badgeOnPath,
  boxColors,
  cornerBadge,
  boxWidth,
  edgeColor,
  labelStyle,
  type Layout,
  layoutStrip,
  type Point,
  placeLabel,
  type SceneAction,
  type SceneBadge,
  type SceneBox,
  type SceneEdge,
  type SceneLabel,
  shiftContent,
  stripNeed,
} from "./scene";

export function layoutSequence(diagram: Diagram): Layout {
  const { box: B, sequence: Q, label: L, margin, gap } = LOOK;
  const colors = boxColors(diagram);
  const listed = diagram.sequence?.lifelines ?? [];
  const order = [...listed, ...diagram.boxes.map((b) => b.id).filter((id) => !listed.includes(id))];
  const column = new Map(order.map((id, i) => [id, i]));
  const widths = order.map((id) => boxWidth(diagram, id, false));

  // 生存線の間。隣の箱どうしの隙間を取り、名前のある線が走る間は名前が収まるまで広げる
  const spacing = widths.slice(1).map((w, i) => (widths[i] as number) / 2 + w / 2 + Q.columnGap);
  const needs: { from: number; to: number; need: number }[] = [];
  for (const step of diagram.steps) {
    for (const event of step.events) {
      if (event.type !== "edge" || event.label === undefined) continue;
      const a = column.get(event.from) ?? 0;
      const b = column.get(event.to) ?? 0;
      const w = textWidth(event.label, labelStyle(event.label)) + L.padX * 2;
      if (a === b) {
        // 自分へ戻る線は名前を右に置くので、右の生存線までに輪と名前が収まる幅を取る
        if (a < spacing.length) needs.push({ from: a, to: a + 1, need: Q.selfW + L.side + w + Q.labelRoom });
      } else {
        needs.push({ from: Math.min(a, b), to: Math.max(a, b), need: w + Q.labelRoom * 2 });
      }
    }
  }
  needs.sort((x, y) => x.to - x.from - (y.to - y.from));
  for (const { from, to, need } of needs) {
    let have = 0;
    for (let i = from; i < to; i++) have += spacing[i] ?? 0;
    if (have >= need) continue;
    const add = (need - have) / (to - from);
    for (let i = from; i < to; i++) spacing[i] = (spacing[i] ?? 0) + add;
  }
  const xs: number[] = [];
  order.forEach((_, i) => xs.push(i === 0 ? margin + (widths[0] as number) / 2 : (xs[i - 1] as number) + (spacing[i - 1] as number)));

  const boxes: SceneBox[] = order.map((id, i) => {
    const source = diagram.boxes.find((b) => b.id === id);
    const w = widths[i] as number;
    const cx = xs[i] as number;
    return {
      id,
      name: source?.name ?? id,
      ...(source?.sub !== undefined ? { sub: source.sub } : {}),
      ...(source?.icon !== undefined ? { icon: source.icon } : {}),
      color: colors.get(id) ?? "slate",
      x: cx - w / 2,
      y: margin,
      w,
      h: B.h,
      cx,
      cy: margin + B.h / 2,
    };
  });
  const headBottom = margin + B.h;

  // 行を積む。線は上か下に名前を、処理は札を持つので、行ごとに上下に要る高さが違う
  const edges: SceneEdge[] = [];
  const actions: SceneAction[] = [];
  const requests: Parameters<typeof placeLabel>[0][] = [];
  let y = headBottom + Q.firstRow;
  let below = 0;
  let first = true;
  diagram.steps.forEach((step, s) => {
    step.events.forEach((event, e) => {
      if (event.type !== "edge" && event.type !== "action") return;
      let above: number;
      let under: number;
      if (event.type === "edge") {
        const side = event.labelSide ?? "above";
        const self = event.from === event.to;
        const named = event.label !== undefined;
        above = named && side === "above" ? L.offset + L.h / 2 : gap;
        under = self ? Q.selfH + gap : named && side === "below" ? L.offset + L.h / 2 : gap;
      } else {
        above = LOOK.action.h / 2;
        under = LOOK.action.h / 2;
      }
      y = first ? y + above : y + Math.max(Q.minPitch, below + Q.rowGap + above) + (e === 0 && s > 0 ? Q.stepGap : 0);
      first = false;
      below = under;

      if (event.type === "edge") {
        const xf = xs[column.get(event.from) ?? 0] as number;
        const xt = xs[column.get(event.to) ?? 0] as number;
        const dir = Math.sign(xt - xf) || 1;
        const points: Point[] =
          xf === xt
            ? [
                [xf, y],
                [xf + Q.selfW, y],
                [xf + Q.selfW, y + Q.selfH],
                [xf + LOOK.edge.inset, y + Q.selfH],
              ]
            : [
                [xf, y],
                [xt - dir * LOOK.edge.inset, y],
              ];
        const color = edgeColor(event, colors);
        edges.push({ step: s, event: e, from: event.from, to: event.to, points, color, carry: event.carry });
        if (event.label !== undefined) {
          requests.push({
            step: s,
            event: e,
            text: event.label,
            points,
            color,
            ...(event.labelSide ? { side: event.labelSide } : xf === xt ? { side: "right" as const } : {}),
          });
        }
      } else {
        // 札は生存線の上の番号の丸を隠さないよう、丸の右に出す (#3017)
        const x = xs[column.get(event.box) ?? 0] as number;
        const w = textWidth(event.label, TYPE.action) + LOOK.action.padX * 2;
        actions.push({ step: s, event: e, box: event.box, text: event.label, color: colors.get(event.box) ?? "slate", x: x + LOOK.badge.r + 4, y: y - LOOK.action.h / 2, w, h: LOOK.action.h });
      }
    });
  });
  const bottom = (first ? headBottom : y + below) + Q.tail;
  const lifelines = order.map((id, i) => ({ id, x: xs[i] as number, y1: headBottom, y2: bottom }));

  const labels: SceneLabel[] = [];
  for (const request of requests) {
    const soft = [...labels.filter((l) => l.step === request.step), ...actions];
    labels.push(placeLabel(request, { hard: boxes, soft }));
  }

  const layout: Layout = { kind: "sequence", width: 0, height: 0, regions: [], boxes, lifelines, edges, labels, actions, badges: [], paths: [], ends: [] };

  // 図の幅。名前が左に出たら全体を右へ寄せ、右端は一番右の物に余白を足した所
  const lefts = [...boxes.map((b) => b.x), ...labels.map((l) => l.x), ...actions.map((a) => a.x)];
  const shift = Math.max(0, margin - Math.min(...lefts));
  if (shift > 0) shiftContent(layout, shift, 0);
  const rights = [...boxes.map((b) => b.x + b.w), ...labels.map((l) => l.x + l.w), ...actions.map((a) => a.x + a.w), ...edges.flatMap((edge) => edge.points.map((p) => p[0]))];
  const width = Math.max(Math.max(...rights) + margin, stripNeed(diagram) + margin * 2);
  const strip = layoutStrip(diagram, margin, bottom + gap, width - margin * 2);
  layout.width = width;
  layout.height = (strip ? strip.y + strip.h : bottom) + margin;
  if (strip) layout.strip = strip;
  layout.badges = badges(diagram, layout);
  return layout;
}

/**
 * 段の番号。その段の最初の線の始まりに置き、線が無ければ処理する箱の生存線の上、無ければ書き換わる箱の角。
 * 処理の札はその段の終わりに消えるので、札に付けると止め絵で丸だけが浮く (#3017)。
 */
function badges(diagram: Diagram, layout: Layout): SceneBadge[] {
  return diagram.steps.map((step, s) => {
    const edge = layout.edges.find((e) => e.step === s);
    if (edge) {
      const [x, y] = badgeOnPath(edge.points);
      return { step: s, x, y, color: edge.color };
    }
    const action = layout.actions.find((a) => a.step === s);
    const lifeline = action && layout.lifelines.find((l) => l.id === action.box);
    if (action && lifeline) return { step: s, x: lifeline.x, y: action.y + action.h / 2, color: action.color };
    return cornerBadge(step.events, s, layout);
  });
}
