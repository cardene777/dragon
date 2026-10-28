/**
 * 状態遷移図の置き場所 (#3163)。
 *
 * 状態は段で初めて辿り着く順に `LOOK.state.columns` つずつ並べ、段ごとに読む向きを替えて折り返す (#3171)。
 * 1 段目は左から右へ、2 段目は右から左へ、3 段目は再び左から右へ読み、どの段の状態も 1 段目の同じ列に揃える。
 * 段の最後の状態の真下に次の段の最初の状態が来るので、段をまたぐ線は真下への 1 本になる。
 * 始まりの印は最初の状態の上に、終わりの印は終わりへ移る状態の下に置く。
 *
 * どの段も辿り着かない状態は点線の札にして、1 段目の上の脇道の囲みへ寄せる。札は絵柄を左に、名前を右に並べる (#3171)。
 * 囲みは脇道へ入る状態のうち最も左の状態の列から図の右端までを占め、始まりの印が囲みの左に収まる時は、
 * 始まりの印を囲みと同じ高さに置く。最初の段より前に書いた線のうち、どの段にも出ない線は通らない道として点線で引き、
 * 脇道の状態から出る線と終わりの印も囲みの中に置く。脇道へ入る線は、1 段目の上端と囲みの間を横に通り、点線の札の下端へ並べて入る。
 */
import { FIGURE_TEXT } from "../figure-text";
import { LOOK, TYPE } from "../look/values";
import type { Carry, Diagram, StatePath } from "../schema";
import { type NotationLang, STATE_ENDS } from "../words";
import { hasWide, textWidth } from "./measure";
import {
  badgeOnPath,
  boxColors,
  boxWidth,
  cornerBadge,
  edgeColor,
  edgesOf,
  type EdgeEvent,
  labelStyle,
  type Layout,
  layoutStrip,
  type Point,
  placeLabel,
  type Rect,
  type SceneBox,
  type SceneEdge,
  type SceneEnd,
  type SceneLabel,
  type ScenePath,
  type SceneSide,
  shiftContent,
  stripNeed,
} from "./scene";

const isEnd = (id: string): boolean => (STATE_ENDS as readonly string[]).includes(id);

/** 段で初めて辿り着く状態の順。線の送る側と受ける側を、段の順に見て初めて出た順に並べる */
export function visitOrder(diagram: Diagram): string[] {
  const order: string[] = [];
  const add = (id: string): void => {
    if (!isEnd(id) && !order.includes(id)) order.push(id);
  };
  for (const { edge } of edgesOf(diagram)) {
    add(edge.from);
    add(edge.to);
  }
  return order;
}

/** 運ぶ物の幅の半分 */
function carrierHalf(carry: Carry): number {
  const C = LOOK.carrier;
  if (carry.kind === "tag") return (textWidth(carry.text, hasWide(carry.text) ? TYPE.carrierJa : TYPE.carrier) + C.tagPadX * 2) / 2;
  if (carry.kind === "coin") return C.coinR;
  return C.envW / 2;
}

/** 線の両端が同じ 2 つの線か */
const same = (a: { from: string; to: string }, b: { from: string; to: string }): boolean => a.from === b.from && a.to === b.to;

export function layoutState(diagram: Diagram, lang: NotationLang): Layout {
  const { box: B, state: T, margin, gap } = LOOK;
  const inset = LOOK.edge.inset;
  const words = FIGURE_TEXT[lang];
  const colors = boxColors(diagram);
  const steps = edgesOf(diagram);
  const walked = visitOrder(diagram);
  const ghosts = diagram.boxes.map((b) => b.id).filter((id) => !walked.includes(id));
  const notTaken: StatePath[] = (diagram.state?.paths ?? []).filter((p) => !steps.some(({ edge }) => same(edge, p)));
  const lines: { from: string; to: string; label?: string }[] = [...steps.map(({ edge }) => edge), ...notTaken];
  const G = T.ghost;
  // 点線の札は絵柄の右に名前と下の字を並べるので、その幅を測る
  const ghostWidth = (id: string): number => {
    const source = diagram.boxes.find((b) => b.id === id);
    return G.pad * 2 + B.icon + G.gap + Math.max(textWidth(source?.name ?? id, TYPE.boxName), textWidth(source?.sub ?? "", TYPE.boxSub));
  };
  const widths = new Map(diagram.boxes.map((b) => [b.id, ghosts.includes(b.id) ? ghostWidth(b.id) : boxWidth(diagram, b.id, true)]));
  const columnCount = Math.max(1, Math.min(T.columns, walked.length));
  const rowCount = Math.max(1, Math.ceil(walked.length / T.columns));
  // 奇数番目の段は右から左へ並べ、段の最後の状態の真下から次の段を始める
  const slot = new Map(
    walked.map((id, k) => {
      const row = Math.floor(k / T.columns);
      const at = k % T.columns;
      return [id, { row, col: row % 2 === 0 ? at : columnCount - 1 - at }];
    }),
  );

  // 列の幅と列の間。隣の列を横に結ぶ名前のある線は、名前が収まるまで間を広げる
  const colW = Array.from({ length: columnCount }, (_, c) => Math.max(B.minW, ...walked.filter((id) => slot.get(id)?.col === c).map((id) => widths.get(id) ?? B.minW)));
  const between = Array.from({ length: Math.max(0, columnCount - 1) }, () => T.columnGap as number);
  for (const line of lines) {
    const a = slot.get(line.from);
    const b = slot.get(line.to);
    if (!a || !b || line.label === undefined || a.row !== b.row || Math.abs(a.col - b.col) !== 1) continue;
    const i = Math.min(a.col, b.col);
    between[i] = Math.max(between[i] ?? 0, textWidth(line.label, labelStyle(line.label)) + LOOK.label.padX * 2 + T.labelRoom * 2);
  }
  const colLeft: number[] = [];
  for (let c = 0; c < columnCount; c++) colLeft.push(c === 0 ? margin : (colLeft[c - 1] as number) + (colW[c - 1] as number) + (between[c - 1] as number));
  const center = (c: number): number => (colLeft[c] as number) + (colW[c] as number) / 2;

  // 脇道の囲みの高さ。囲みの名前と 2 行の添え書きと、点線の札が並ぶ
  const isGhost = (id: string): boolean => ghosts.includes(id);
  const enteringFrom = new Set(notTaken.filter((p) => isGhost(p.to) && !isGhost(p.from) && !isEnd(p.from)).map((p) => p.from));
  const notes = [words.sideNote, ...(enteringFrom.size > 0 ? [words.sideFrom(enteringFrom.size)] : [])];
  const titleW = Math.max(textWidth(words.side, TYPE.regionName), ...notes.map((note) => textWidth(note, TYPE.regionNote)));
  const sideH = T.side.pad * 2 + Math.max(G.h, TYPE.regionName.size + LOOK.region.line * notes.length + T.side.pad / 4);
  // 1 段目の上には、脇道の囲みか、始まりの印から最初の状態へ下りる間を空ける。どちらも無ければ空けない
  const starts = lines.some((line) => line.from === "start");
  const top0 = margin + (ghosts.length > 0 ? sideH + T.side.gap : starts ? T.start + T.drop : 0);
  const rowY = (row: number): number => top0 + row * (B.h + T.rowGap);

  const boxOf = (id: string, cx: number, y: number, ghost: boolean): SceneBox => {
    const source = diagram.boxes.find((b) => b.id === id);
    const w = widths.get(id) ?? B.minW;
    const h = ghost ? G.h : B.h;
    return {
      id,
      name: source?.name ?? id,
      ...(source?.sub !== undefined ? { sub: source.sub } : {}),
      ...(source?.icon !== undefined ? { icon: source.icon } : {}),
      color: colors.get(id) ?? "slate",
      x: cx - w / 2,
      y,
      w,
      h,
      cx,
      cy: y + h / 2,
      ...(ghost ? { ghost: true } : {}),
    };
  };
  const boxes: SceneBox[] = walked.map((id) => {
    const s = slot.get(id) as { row: number; col: number };
    return boxOf(id, center(s.col), rowY(s.row), false);
  });
  const byId = new Map(boxes.map((b) => [b.id, b]));
  const below = (box: SceneBox): boolean => boxes.some((other) => other !== box && Math.abs(other.cx - box.cx) < 0.5 && other.y > box.y);

  const ends: SceneEnd[] = [];
  const first = boxes[0];
  const contentRight = Math.max(...boxes.map((b) => b.x + b.w));

  // 脇道の囲み。囲みの左端は脇道へ入る状態のうち最も左の箱に揃え、右端は図の右端まで伸ばす。点線の札は入ってくる状態の真ん中に置く
  let side: SceneSide | undefined;
  const lane = margin + sideH + T.side.lane;
  if (ghosts.length > 0) {
    const sourcesOf = (id: string): SceneBox[] => notTaken.filter((p) => p.to === id).flatMap((p) => byId.get(p.from) ?? []);
    const all = ghosts.flatMap(sourcesOf);
    const x = Math.max(margin, Math.min(...(all.length > 0 ? all.map((b) => b.x) : [margin + T.side.pad])) - T.side.pad);
    let cursor = x + T.side.pad + titleW + gap * 2;
    const wanted = ghosts.map((id) => {
      const from = sourcesOf(id);
      return { id, cx: from.length > 0 ? from.reduce((sum, b) => sum + b.cx, 0) / from.length : cursor };
    });
    wanted.sort((a, b) => a.cx - b.cx);
    let right = x;
    for (const { id, cx } of wanted) {
      const w = widths.get(id) ?? B.minW;
      const left = Math.max(cx - w / 2, cursor);
      const ghost = boxOf(id, left + w / 2, margin + (sideH - G.h) / 2, true);
      boxes.push(ghost);
      byId.set(id, ghost);
      const finishes = notTaken.some((p) => p.from === id && p.to === "finish");
      if (finishes) ends.push({ kind: "finish", x: ghost.x + ghost.w + T.beside, y: ghost.cy, r: T.end.r, ghost: true, text: "", box: id });
      right = finishes ? ghost.x + ghost.w + T.beside + T.end.r : ghost.x + ghost.w;
      cursor = right + gap * 2;
    }
    const rightmost = Math.max(right + T.side.pad, contentRight);
    side = { x, y: margin, w: rightmost - x, h: sideH, title: words.side, notes };
  }

  // 始まりの印は最初の状態の上。脇道の囲みの左に字まで収まる時は、囲みと同じ高さに置く
  if (first && starts) {
    const reach = first.cx + T.start + T.text + textWidth(words.start, TYPE.regionNote) + gap;
    const y = side && reach < side.x ? side.y + T.side.pad + T.start : first.y - T.drop;
    ends.unshift({ kind: "start", x: first.cx, y, r: T.start, ghost: false, text: words.start });
  }

  // 終わりの印は終わりへ移る状態の下。下に状態がある時は右に置く
  for (const box of boxes.filter((b) => !b.ghost && lines.some((line) => line.from === b.id && line.to === "finish"))) {
    ends.push(
      below(box)
        ? { kind: "finish", x: box.x + box.w + T.beside, y: box.cy, r: T.end.r, ghost: false, text: words.end, box: box.id }
        : { kind: "finish", x: box.cx, y: box.y + box.h + T.below, r: T.end.r, ghost: false, text: words.end, box: box.id },
    );
  }

  /** 状態どうしを結ぶ線。同じ段の隣は横にまっすぐ、段をまたぐ線は段の間の真ん中を通る */
  const between2 = (a: SceneBox, b: SceneBox): Point[] => {
    const sa = slot.get(a.id);
    const sb = slot.get(b.id);
    if (!sa || !sb) return [[a.cx, a.y + a.h], [b.cx, b.y - inset]];
    if (sa.row === sb.row && Math.abs(sa.col - sb.col) === 1) {
      return b.cx > a.cx
        ? [[a.x + a.w, a.cy], [b.x - inset, b.cy]]
        : [[a.x, a.cy], [b.x + b.w + inset, b.cy]];
    }
    if (sa.row === sb.row) {
      const y = a.y + a.h + T.rowGap / 4;
      return [[a.cx, a.y + a.h], [a.cx, y], [b.cx, y], [b.cx, b.y + b.h + inset]];
    }
    if (sb.row > sa.row) {
      if (Math.abs(a.cx - b.cx) < 0.5) return [[a.cx, a.y + a.h], [b.cx, b.y - inset]];
      const y = a.y + a.h + T.rowGap / 2;
      return [[a.cx, a.y + a.h], [a.cx, y], [b.cx, y], [b.cx, b.y - inset]];
    }
    if (Math.abs(a.cx - b.cx) < 0.5) return [[a.cx, a.y], [b.cx, b.y + b.h + inset]];
    const y = b.y + b.h + T.rowGap / 2;
    return [[a.cx, a.y], [a.cx, y], [b.cx, y], [b.cx, b.y + b.h + inset]];
  };

  /** 点線の箱へ入る所。同じ箱へ入る線を、入ってくる状態の左から順に箱の下端へ並べる */
  const entryOf = (from: string, to: SceneBox): number => {
    const sources = notTaken.filter((p) => p.to === to.id).flatMap((p) => byId.get(p.from) ?? []).sort((a, b) => a.cx - b.cx);
    const k = sources.findIndex((b) => b.id === from);
    if (sources.length <= 1) return Math.min(Math.max(sources[0]?.cx ?? to.cx, to.x + T.side.entry), to.x + to.w - T.side.entry);
    return to.x + T.side.entry + ((to.w - T.side.entry * 2) * Math.max(0, k)) / (sources.length - 1);
  };
  /** 状態が線を出す所の横の位置。最初の状態は上端の真ん中に始まりからの線が入るので、脇道へは少し右から出る */
  const exitX = (box: SceneBox): number => (starts && box === first ? box.cx + T.side.entry : box.cx);

  const finishOf = (id: string): SceneEnd | undefined => ends.find((e) => e.kind === "finish" && e.box === id);
  /** 同じ状態へ戻る線。箱の下端の右から出て、下へ膨らむ弧を描いて左から箱へ戻る。運ぶ物が弧の上を走れるよう、点で区切る */
  const loopOf = (box: SceneBox): Point[] => {
    const { w, h, samples } = T.loop;
    const bottom = box.y + box.h;
    const p0: Point = [box.cx + w / 2, bottom];
    const c1: Point = [box.cx + (w * 3) / 4, bottom + (h * 4) / 3];
    const c2: Point = [box.cx - (w * 3) / 4, bottom + (h * 4) / 3];
    const p3: Point = [box.cx - w / 2, bottom + inset];
    return Array.from({ length: samples + 1 }, (_, k): Point => {
      const t = k / samples;
      const u = 1 - t;
      const at = (i: 0 | 1): number => u * u * u * p0[i] + 3 * u * u * t * c1[i] + 3 * u * t * t * c2[i] + t * t * t * p3[i];
      return [at(0), at(1)];
    });
  };
  const route = (from: string, to: string): Point[] => {
    if (from === "start") {
      const start = ends.find((e) => e.kind === "start");
      const target = byId.get(to);
      if (!start || !target) return [];
      return [[start.x, start.y + start.r], [target.cx, target.y - inset]];
    }
    const a = byId.get(from);
    if (!a) return [];
    if (to === "finish") {
      const end = finishOf(from);
      if (!end) return [];
      return Math.abs(end.x - a.cx) < 0.5 ? [[a.cx, a.y + a.h], [a.cx, end.y - end.r - inset]] : [[a.x + a.w, a.cy], [end.x - end.r - inset, a.cy]];
    }
    const b = byId.get(to);
    if (!b) return [];
    if (from === to) return loopOf(a);
    if (b.ghost && !a.ghost) {
      const sx = exitX(a);
      const ex = entryOf(from, b);
      return Math.abs(sx - ex) < 0.5 ? [[sx, a.y], [ex, b.y + b.h + inset]] : [[sx, a.y], [sx, lane], [ex, lane], [ex, b.y + b.h + inset]];
    }
    if (a.ghost && b.ghost) return [[a.x + a.w, a.cy], [b.x - inset, b.cy]];
    if (a.ghost) return [[a.cx, a.y + a.h], [a.cx, lane], [b.cx, lane], [b.cx, b.y - inset]];
    return between2(a, b);
  };

  /**
   * 運ぶ物が着いた後に留まる所。状態へ着いた札はその状態の印に乗り (同じ状態へ戻る輪も、回った後に印へ戻る)、
   * 終わりへ着いた札は終わりの印と字に掛からないよう、下に置いた印なら左、右に置いた印なら下に留まる
   */
  const settleOf = (edge: EdgeEvent): Point | undefined => {
    const target = byId.get(edge.to);
    if (target) return [target.cx, target.cy + B.iconY];
    const end = edge.to === "finish" ? finishOf(edge.from) : undefined;
    if (!end) return undefined;
    const from = byId.get(edge.from);
    return from && Math.abs(end.x - from.cx) < 0.5 ? [end.x - end.r - gap - carrierHalf(edge.carry), end.y] : [end.x, end.y + end.r + gap + LOOK.carrier.tagH / 2];
  };

  const sceneEdges: SceneEdge[] = steps.map(({ step, event, edge }) => {
    const settle = settleOf(edge);
    return {
      step,
      event,
      from: edge.from,
      to: edge.to,
      points: route(edge.from, edge.to),
      color: colorOf(edge, colors),
      carry: edge.carry,
      ...(settle ? { settle } : {}),
    };
  });
  // 同じ 2 つの状態を行きと帰りで結ぶまっすぐな線は、少しずらして重ならないようにする
  for (const e of sceneEdges) {
    if (e.points.length !== 2 || !sceneEdges.some((o) => o.from === e.to && o.to === e.from && o.points.length === 2)) continue;
    const [p, q] = e.points as [Point, Point];
    const flat = Math.abs(q[1] - p[1]) < Math.abs(q[0] - p[0]);
    const d = (e.from < e.to ? 1 : -1) * LOOK.edge.parallel;
    e.points = e.points.map(([x, y]) => (flat ? [x, y + d] : [x + d, y]));
  }

  const paths: ScenePath[] = notTaken.map((p) => ({ from: p.from, to: p.to, points: route(p.from, p.to) }));

  // 線の名前。同じ状態へ戻る輪は輪の下に置き、終わりへ移る線は印の字と反対の左に置く
  const labels: SceneLabel[] = [];
  const soft: Rect[] = side ? [{ x: side.x, y: side.y, w: T.side.pad + titleW, h: side.h }] : [];
  for (const e of sceneEdges) {
    const source = diagram.steps[e.step]?.events[e.event];
    if (source?.type !== "edge" || source.label === undefined) continue;
    const style = labelStyle(source.label);
    if (e.from === e.to) {
      const w = textWidth(source.label, style) + LOOK.label.padX * 2;
      const bottom = Math.max(...e.points.map(([, y]) => y));
      labels.push({ step: e.step, event: e.event, text: source.label, family: style.family, color: e.color, x: (e.points[0]?.[0] ?? 0) - T.loop.w / 2 - w / 2, y: bottom + LOOK.label.soft, w, h: LOOK.label.h });
      continue;
    }
    const side2 = source.labelSide ?? (e.to === "finish" ? "left" : undefined);
    labels.push(
      placeLabel(
        { step: e.step, event: e.event, text: source.label, points: e.points, color: e.color, ...(side2 ? { side: side2 } : {}) },
        { hard: boxes, soft: [...soft, ...labels.filter((l) => l.step === e.step)] },
      ),
    );
  }
  // 脇道へ入る線の名前は、横に通る所の下の、状態から上へ出る所の右に置く
  notTaken.forEach((p, i) => {
    const path = paths[i] as ScenePath;
    if (p.label === undefined || path.points.length === 0) return;
    const style = labelStyle(p.label);
    const into = byId.get(p.to)?.ghost === true && byId.get(p.from)?.ghost !== true;
    const rect: Rect = into
      ? { x: (path.points[0] as Point)[0] + LOOK.label.soft, y: lane + LOOK.label.soft, w: textWidth(p.label, style) + LOOK.label.padX * 2, h: LOOK.label.h }
      : placeLabel({ step: -1, event: i, text: p.label, points: path.points, color: "slate" }, { hard: boxes, soft });
    path.label = { x: rect.x, y: rect.y, w: rect.w, h: rect.h, text: p.label, family: style.family };
  });

  const layout: Layout = { kind: "state", width: 0, height: 0, regions: [], boxes, lifelines: [], edges: sceneEdges, labels, actions: [], badges: [], paths, ends, ...(side ? { side } : {}) };
  // 名前が左へ出たら、全体を右へ寄せる
  const lefts = [...boxes.map((b) => b.x), ...labels.map((l) => l.x), ...paths.flatMap((p) => (p.label ? [p.label.x] : []))];
  const shift = Math.max(0, margin - Math.min(...lefts));
  if (shift > 0) shiftContent(layout, shift, 0);
  const endRight = (e: SceneEnd): number => e.x + (e.text === "" ? e.r : T.text + textWidth(e.text, TYPE.regionNote));
  const rights = [
    ...boxes.map((b) => b.x + b.w),
    ...labels.map((l) => l.x + l.w),
    ...ends.map(endRight),
    ...sceneEdges.flatMap((e) => e.points.map((p) => p[0])),
    ...paths.flatMap((p) => [...p.points.map((q) => q[0]), ...(p.label ? [p.label.x + p.label.w] : [])]),
    ...(side ? [side.x + side.w] : []),
  ];
  const bottoms = [...boxes.map((b) => b.y + b.h), ...labels.map((l) => l.y + l.h), ...ends.map((e) => e.y + e.r), ...sceneEdges.flatMap((e) => e.points.map((p) => p[1]))];
  // 帯の最後に、段が辿り着く順に状態を点で並べる
  const trail = { title: words.trail, states: walked.map((id) => ({ box: id, color: colors.get(id) ?? "slate" })) };
  const width = Math.max(Math.max(...rights) + margin, stripNeed(diagram, trail) + margin * 2);
  const bottom = Math.max(...bottoms, rowY(rowCount - 1) + B.h);
  const strip = layoutStrip(diagram, margin, bottom + gap, width - margin * 2, trail);
  layout.width = width;
  layout.height = (strip ? strip.y + strip.h : bottom) + margin;
  if (strip) layout.strip = strip;
  layout.badges = diagram.steps.map((step, s) => {
    const edge = sceneEdges.find((e) => e.step === s && e.points.length > 0);
    if (!edge) return cornerBadge(step.events, s, layout);
    // 同じ状態へ戻る弧の番号は、弧に重ねず弧の右に置く
    if (edge.from === edge.to) {
      const right = Math.max(...edge.points.map(([px]) => px));
      const top = (edge.points[0] as Point)[1];
      const deep = Math.max(...edge.points.map(([, py]) => py));
      return { step: s, x: right + LOOK.badge.r + LOOK.badge.inset, y: top + (deep - top) * T.loop.badgeAt, color: edge.color };
    }
    const [x, y] = badgeOnPath(edge.points);
    return { step: s, x, y, color: edge.color };
  });
  return layout;
}

/** 線の色。移った先の状態の色で、終わりへ移る線は終わる状態の色。硬貨を運ぶ線は構成図と同じく硬貨の色 (#3171) */
function colorOf(edge: EdgeEvent, colors: Map<string, ReturnType<typeof edgeColor>>): ReturnType<typeof edgeColor> {
  if (edge.carry.kind === "coin") return edgeColor(edge, colors);
  return colors.get(edge.to === "finish" ? edge.from : edge.to) ?? "slate";
}
