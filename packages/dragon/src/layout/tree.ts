/**
 * 木の図の置き場所 (#3233)。見た目の元は step 2 で本人が選んだ「根を上」の試作 (`.context/propose/merkle-look/`)。
 *
 * 葉 (`leaf`) と親 (`node`) の出来事を書いた順に辿り、親を持たない最後の箱を根にする。根を上に置き、根からの深さごとに段を下げて並べる。
 * 子を持たない箱 (葉) は書いた順に左から同じ間で並べ、親は最初の子と最後の子の真ん中の上に置く。
 * 子から親への木の線は、子の上端から縦に出て、子の段と親の段の間の高さで横に渡り、親の下端へ縦に入る。
 * 値を持つ葉は箱に値だけを出し、名札を葉の下の札に出す。値を持つ親は値を大きく、名札を小さく出す。値を持たない箱は名札だけを出す。
 * 根の箱は左に枝の絵柄を持ち、ほかの木の箱より大きい。
 *
 * 木でない箱 (`box`) は木の右に、根の上端の高さから縦に並べる。中身の帯は図の下に置く。
 * 親子の箱どうしの線は木の線の上を走り、ほかの線は箱の向き合う辺どうしを結ぶ。
 * 段の番号は、箱が現れる段では最初に現れた箱の左に、線を引く段では最初の線の上に置く。
 *
 * 原本の JSON が書く前の名札を子に持つ時や、もう親を持つ箱を子にする時は、その子を除いて描く。箱と同じ名札の木の箱は描かない。
 */
import { type ColorKey, LOOK, type TextStyle, TYPE } from "../look/values";
import type { Diagram } from "../schema";
import { textWidth } from "./measure";
import {
  along,
  badgeOnPath,
  badgeRect,
  boxColors,
  boxWidth,
  carrierHalf,
  edgeColor,
  edgesOf,
  gapBetween,
  labelStyle,
  type Layout,
  layoutStrip,
  loopUnder,
  pathLength,
  placeLabel,
  placeSlot,
  type Point,
  type Rect,
  replaceSameSpot,
  type SceneBadge,
  type SceneBox,
  type SceneEdge,
  type SceneLabel,
  seatCarriers,
  slotBoxWidth,
  slotRooms,
  stripNeed,
} from "./scene";

/** 木の箱。`lines` は箱の中の字を上から並べた行で、`baselines` と `styles` は行ごとの基準線の高さと字の形 */
export interface TreePlaced extends Rect {
  id: string;
  kind: "leaf" | "node";
  /** 根からの深さ。根が 0 */
  depth: number;
  parent?: string;
  children: string[];
  /** 箱を書いた段と、段の中の出来事の番号 */
  step: number;
  event: number;
  hash?: string;
  root: boolean;
  cx: number;
  cy: number;
  color: ColorKey;
  lines: string[];
  baselines: number[];
  styles: TextStyle[];
  /** 値を持つ葉の下に置く、名札の札 */
  card?: Rect & { text: string };
}

/** 子 (`from`) から親 (`to`) への木の線。親を書いた段と出来事で現れる */
export interface TreeLink {
  from: string;
  to: string;
  step: number;
  event: number;
  points: Point[];
}

/** 木の線の上を走る線。`link` は走る木の線の子の名札 */
export interface TreeRun {
  step: number;
  event: number;
  link: string;
}

export interface TreeLayout extends Layout {
  kind: "tree";
  nodes: TreePlaced[];
  links: TreeLink[];
  runs: TreeRun[];
}

export const isTreeLayout = (layout: Layout): layout is TreeLayout => layout.kind === "tree";

/** 書いた順の木の箱。子は書いた後の、まだ親を持たない木の箱だけを残す */
interface Grown {
  id: string;
  kind: "leaf" | "node";
  children: string[];
  step: number;
  event: number;
  hash?: string;
}

function grow(diagram: Diagram): { grown: Grown[]; parents: Map<string, string> } {
  const boxes = new Set(diagram.boxes.map((b) => b.id));
  const byId = new Set<string>();
  const parents = new Map<string, string>();
  const grown: Grown[] = [];
  diagram.steps.forEach((step, s) => {
    step.events.forEach((e, k) => {
      if ((e.type !== "leaf" && e.type !== "node") || byId.has(e.id) || boxes.has(e.id)) return;
      const children = e.type === "node" ? [...new Set(e.children)].filter((c) => byId.has(c) && !parents.has(c)) : [];
      for (const c of children) parents.set(c, e.id);
      grown.push({ id: e.id, kind: e.type, children, step: s, event: k, ...(e.hash !== undefined ? { hash: e.hash } : {}) });
      byId.add(e.id);
    });
  });
  return { grown, parents };
}

/** 箱の中の字の行と、行ごとの字の形。根は名札を上に値を下に、ほかの箱は値を上に名札を下に置く */
function linesOf(g: Grown, root: boolean): { text: string; style: TextStyle }[] {
  if (g.hash === undefined) return [{ text: g.id, style: TYPE.boxName }];
  if (root)
    return [
      { text: g.id, style: TYPE.rootName },
      { text: g.hash, style: TYPE.rootHash },
    ];
  if (g.kind === "leaf") return [{ text: g.hash, style: TYPE.treeHash }];
  return [
    { text: g.hash, style: TYPE.treeHash },
    { text: g.id, style: TYPE.treeName },
  ];
}

/** 箱どうしの線。縦の範囲が重なれば横に、横の範囲が重なれば縦に、どちらも重ならなければ送る側から縦に出て受ける側の高さで横に入る */
function route(a: Rect, b: Rect): Point[] {
  const i = LOOK.edge.inset;
  const top = Math.max(a.y, b.y);
  const bottom = Math.min(a.y + a.h, b.y + b.h);
  if (bottom > top) {
    const y = (top + bottom) / 2;
    return b.x >= a.x + a.w
      ? [
          [a.x + a.w + i, y],
          [b.x - i, y],
        ]
      : [
          [a.x - i, y],
          [b.x + b.w + i, y],
        ];
  }
  const left = Math.max(a.x, b.x);
  const right = Math.min(a.x + a.w, b.x + b.w);
  if (right > left) {
    const x = (left + right) / 2;
    return b.y >= a.y + a.h
      ? [
          [x, a.y + a.h + i],
          [x, b.y - i],
        ]
      : [
          [x, a.y - i],
          [x, b.y + b.h + i],
        ];
  }
  const ax = a.x + a.w / 2;
  const ty = b.y + b.h / 2;
  return [
    [ax, b.y > a.y ? a.y + a.h + i : a.y - i],
    [ax, ty],
    [b.x > ax ? b.x - i : b.x + b.w + i, ty],
  ];
}

export function layoutTree(diagram: Diagram): TreeLayout {
  const { margin, gap, box: B, tree: T, badge: BD } = LOOK;
  const { grown, parents } = grow(diagram);
  const tops = grown.filter((g) => !parents.has(g.id));
  const rootId = tops[tops.length - 1]?.id;
  const byId = new Map(grown.map((g) => [g.id, g]));

  // 根からの深さ。親を持たない箱から子へ辿る
  const depth = new Map<string, number>();
  const walk = (id: string, d: number): void => {
    depth.set(id, d);
    for (const c of byId.get(id)?.children ?? []) walk(c, d + 1);
  };
  for (const t of tops) walk(t.id, 0);

  const texts = new Map(grown.map((g) => [g.id, linesOf(g, g.id === rootId)]));
  const widest = (id: string): number => Math.max(0, ...(texts.get(id) ?? []).map((line) => textWidth(line.text, line.style)));
  const widthOf = (g: Grown): number =>
    g.id === rootId ? Math.max(T.root.w, T.root.textX + widest(g.id) + T.root.padR) : Math.max(T.w, widest(g.id) + T.padX * 2);
  const cardW = (g: Grown): number => Math.max(T.card.minW, T.card.padX * 2 + T.card.icon + T.card.gap + textWidth(g.id, TYPE.treeCard));
  const hasCard = (g: Grown): boolean => g.kind === "leaf" && g.hash !== undefined;

  // 子を持たない箱を書いた順に左から並べる。間は一番広い箱か札の幅に、隣の箱との間を足した長さ
  const slots = grown.filter((g) => g.children.length === 0);
  const pitch = Math.max(...grown.filter((g) => g.id !== rootId || g.children.length === 0).map((g) => Math.max(widthOf(g), hasCard(g) ? cardW(g) : 0)), T.w) + T.slotGap;
  const x0 = margin + BD.r * 2 + BD.inset;
  const xs = new Map<string, number>();
  slots.forEach((g, i) => xs.set(g.id, x0 + pitch * (i + 0.5)));
  const xOf = (id: string): number => {
    const known = xs.get(id);
    if (known !== undefined) return known;
    const kids = byId.get(id)?.children ?? [];
    const x = (xOf(kids[0] as string) + xOf(kids[kids.length - 1] as string)) / 2;
    xs.set(id, x);
    return x;
  };
  const top0 = margin + T.top;
  const yOf = (d: number): number => top0 + T.root.h / 2 + d * T.row;

  const colors = boxColors(diagram);
  const nodes: TreePlaced[] = grown.map((g) => {
    const root = g.id === rootId;
    const d = depth.get(g.id) ?? 0;
    const cx = xOf(g.id);
    const cy = yOf(d);
    const w = widthOf(g);
    const h = root ? T.root.h : T.h;
    const lines = texts.get(g.id) ?? [];
    const baselines =
      lines.length === 1 ? [cy + T.oneY] : root ? [cy + T.root.nameY, cy + T.root.hashY] : [cy + T.hashY, cy + T.nameY];
    const parent = parents.get(g.id);
    const color: ColorKey = root ? T.rootColor : T.color;
    colors.set(g.id, color);
    const cw = cardW(g);
    return {
      id: g.id,
      kind: g.kind,
      depth: d,
      ...(parent !== undefined ? { parent } : {}),
      children: g.children,
      step: g.step,
      event: g.event,
      ...(g.hash !== undefined ? { hash: g.hash } : {}),
      root,
      x: cx - w / 2,
      y: cy - h / 2,
      w,
      h,
      cx,
      cy,
      color,
      lines: lines.map((line) => line.text),
      baselines,
      styles: lines.map((line) => line.style),
      ...(hasCard(g) ? { card: { x: cx - cw / 2, y: cy + T.card.drop - T.card.h / 2, w: cw, h: T.card.h, text: g.id } } : {}),
    };
  });
  const placed = new Map(nodes.map((n) => [n.id, n]));

  // 子から親への木の線。子の段と親の段の間の高さで横に渡る
  const links: TreeLink[] = nodes.flatMap((p) =>
    p.children.flatMap((id): TreeLink[] => {
      const c = placed.get(id);
      if (!c) return [];
      const mid = (c.y + p.y + p.h) / 2;
      const points: Point[] = [
        [c.cx, c.y - LOOK.edge.inset],
        [c.cx, mid],
        [p.cx, mid],
        [p.cx, p.y + p.h + LOOK.edge.inset],
      ];
      return [{ from: c.id, to: p.id, step: p.step, event: p.event, points }];
    }),
  );

  // 木でない箱は、木の右に根の上端の高さから縦に並べる。根と箱の間の線に名前を書く時は、名前の分だけ根から離す
  const rooms = slotRooms(diagram);
  const treeRight = Math.max(x0, ...nodes.flatMap((n) => [n.x + n.w, ...(n.card ? [n.card.x + n.card.w] : [])]));
  const rootBox = nodes.find((n) => n.root);
  const ids = new Set(diagram.boxes.map((b) => b.id));
  const named = edgesOf(diagram).flatMap(({ edge }) => (edge.label !== undefined && (ids.has(edge.from) || ids.has(edge.to)) ? [textWidth(edge.label, labelStyle(edge.label)) + LOOK.label.padX * 2] : []));
  const boxX = Math.max(treeRight + T.boxGap, (rootBox ? rootBox.x + rootBox.w : x0) + Math.max(0, ...named) + gap * 2);
  let by = rootBox?.y ?? top0;
  const boxes: SceneBox[] = diagram.boxes.map((b) => {
    const w = Math.max(boxWidth(diagram, b.id, true), slotBoxWidth(rooms.get(b.id), b.icon !== undefined, B.padX));
    const y = by;
    by += B.h + gap;
    const box: SceneBox = {
      id: b.id,
      name: b.name,
      ...(b.sub !== undefined ? { sub: b.sub } : {}),
      ...(b.icon !== undefined ? { icon: b.icon } : {}),
      color: colors.get(b.id) ?? "slate",
      x: boxX,
      y,
      w,
      h: B.h,
      cx: boxX + w / 2,
      cy: y + B.h / 2,
    };
    placeSlot(box, rooms.get(b.id));
    return box;
  });
  const boxById = new Map(boxes.map((b) => [b.id, b]));

  // 線。親子の箱どうしの線は木の線の上を、向きに合わせて走る
  const runs: TreeRun[] = [];
  const edges: SceneEdge[] = diagram.steps.flatMap((step, s) =>
    step.events.flatMap((e, k): SceneEdge[] => {
      if (e.type !== "edge") return [];
      const a: Rect | undefined = placed.get(e.from) ?? boxById.get(e.from);
      const b: Rect | undefined = placed.get(e.to) ?? boxById.get(e.to);
      if (!a || !b) return [];
      const up = links.find((l) => l.from === e.from && l.to === e.to);
      const down = links.find((l) => l.from === e.to && l.to === e.from);
      const link = up ?? down;
      if (link) runs.push({ step: s, event: k, link: link.from });
      const points = up ? up.points : down ? [...down.points].reverse() : e.from === e.to ? loopUnder({ cx: a.x + a.w / 2, y: a.y, h: a.h }) : route(a, b);
      return [{ step: s, event: k, from: e.from, to: e.to, points, color: edgeColor(e, colors), carry: e.carry }];
    }),
  );
  seatCarriers(edges, boxById, rooms);

  const layout: TreeLayout = {
    kind: "tree",
    width: 0,
    height: 0,
    regions: [],
    boxes,
    lifelines: [],
    edges,
    labels: [],
    actions: [],
    badges: [],
    paths: [],
    ends: [],
    nodes,
    links,
    runs,
  };
  layout.badges = badgesOf(diagram, layout);
  layout.labels = labelsOf(diagram, layout);

  const cards = nodes.flatMap((n) => (n.card ? [n.card] : []));
  const solids: Rect[] = [...nodes, ...cards, ...boxes, ...layout.labels];
  const points = edges.flatMap((e) => e.points);
  const right = Math.max(...solids.map((r) => r.x + r.w), ...points.map(([x]) => x), x0);
  const bottom = Math.max(...solids.map((r) => r.y + r.h), ...points.map(([, y]) => y), top0);
  const width = Math.max(right + margin, stripNeed(diagram) + margin * 2);
  const strip = layoutStrip(diagram, margin, bottom + gap, width - margin * 2);
  layout.width = width;
  layout.height = (strip ? strip.y + strip.h : bottom) + margin;
  if (strip) layout.strip = strip;
  // 中身の帯だけを書き換える段の番号は帯の左上に置くので、帯を置いた後に決め直す
  layout.badges = badgesOf(diagram, layout);
  return layout;
}

/**
 * 段の番号。箱が現れる段は最初に現れた木の箱の左に置き、左が埋まっていれば左上の角、右、右上の角の順に空きを探す。
 * 線を引く段は最初の線の上に置く。木の線を走る線は、子の側の曲がり角から横の線に沿って `LOOK.tree.badgeAlong` 進めた所に、ほかの線は真ん中に置き、
 * 運ぶ物が出発を待つ所と着いた所を空ける。同じ 2 つの箱を結ぶ線を前の段が通っていれば、前の段の番号と同じ所に置く (#3184)。
 * どちらも無い段は、書き換える箱か帯の左上の角に置き、それも無ければ前の段の番号と入れ替える
 */
function badgesOf(diagram: Diagram, layout: TreeLayout): SceneBadge[] {
  const { r, inset } = LOOK.badge;
  const apart = r * 2 + inset;
  const taken: Point[] = [];
  const out: SceneBadge[] = [];
  const solids: Rect[] = [...layout.nodes, ...layout.nodes.flatMap((n) => (n.card ? [n.card] : [])), ...layout.boxes];
  const free = (p: Point): boolean =>
    taken.every(([x, y]) => Math.hypot(p[0] - x, p[1] - y) >= apart) && solids.every((s) => gapBetween(badgeRect(p), s) >= LOOK.label.touch);
  const put = (s: number, p: Point, color: ColorKey): void => {
    taken.push(p);
    out.push({ step: s, x: p[0], y: p[1], color });
  };
  const passed = new Map<string, Point>();
  diagram.steps.forEach((step, s) => {
    const k = step.events.findIndex((e) => e.type === "leaf" || e.type === "node" || e.type === "edge");
    const first = step.events[k];
    const n = layout.nodes.find((x) => x.step === s && x.event === k);
    if (first && first.type !== "edge" && n) {
      const spots: Point[] = [
        [n.x - inset - r, n.cy],
        [n.x, n.y],
        [n.x + n.w + inset + r, n.cy],
        [n.x + n.w, n.y],
      ];
      put(s, spots.find(free) ?? (spots[0] as Point), n.color);
      return;
    }
    const e = layout.edges.find((x) => x.step === s && x.event === k);
    if (first?.type === "edge" && e) {
      const key = [e.from, e.to].sort().join("\n");
      const run = layout.runs.some((x) => x.step === s && x.event === k);
      const lines = layout.edges.filter((x) => x !== e).map((x) => x.points);
      const point = passed.get(key) ?? (run ? onLink(e.points, free) : midway(e, free)) ?? badgeOnPath(e.points, taken, lines);
      passed.set(key, point);
      put(s, point, e.color);
      return;
    }
    const box = step.events.flatMap((ev) => (ev.type === "swap" || ev.type === "action" ? [ev.box] : [])).flatMap((id) => layout.boxes.filter((b) => b.id === id))[0];
    if (box) {
      out.push({ step: s, x: box.x, y: box.y, color: box.color });
      return;
    }
    if (layout.strip && step.events.some((ev) => ev.type === "strip")) {
      out.push({ step: s, x: layout.strip.x + inset, y: layout.strip.y + inset, color: "slate" });
      return;
    }
    const before = out[out.length - 1];
    const root = layout.nodes.find((x) => x.root);
    out.push(before ? { ...before, step: s } : { step: s, x: root?.x ?? LOOK.margin, y: root?.y ?? LOOK.margin, color: root?.color ?? "slate" });
  });
  return replaceSameSpot(out);
}

/** 木の線の上の段の番号の点。最初の曲がり角から横の線に沿って進め、横の線が短い時は縦の線の真ん中の脇に置く */
function onLink(points: Point[], free: (p: Point) => boolean): Point | undefined {
  const [p0, p1, p2] = points as [Point, Point, Point];
  const flat = Math.abs(p2[0] - p1[0]);
  const { r, inset } = LOOK.badge;
  if (flat >= LOOK.tree.badgeAlong + r) {
    const p = along(points, pathLength([p0, p1]) + LOOK.tree.badgeAlong);
    if (free(p)) return p;
  }
  const side: Point = [p1[0] + r + inset, p1[1]];
  return free(side) ? side : undefined;
}

/** 木の線でない線の段の番号の点。運ぶ物が待つ線の両端を空け、真ん中から外へ空きを探す。線が短くて空かない時は返さない */
function midway(e: SceneEdge, free: (p: Point) => boolean): Point | undefined {
  const length = pathLength(e.points);
  const room = carrierHalf(e.carry)[0] + LOOK.badge.r + LOOK.badge.inset;
  for (let d = 0; d <= length / 2 - room; d += 1) {
    for (const at of [length / 2 - d, length / 2 + d]) {
      const p = along(e.points, at);
      if (free(p)) return p;
    }
  }
  return undefined;
}

/** 線の名前。箱と木の箱から離し、葉の下の札と同じ段の名前に重ねず、同じ時刻に見える段の番号に食い込ませない */
function labelsOf(diagram: Diagram, layout: TreeLayout): SceneLabel[] {
  const labels: SceneLabel[] = [];
  const cards = layout.nodes.flatMap((n) => (n.card ? [n.card] : []));
  for (const e of layout.edges) {
    const source = diagram.steps[e.step]?.events[e.event];
    if (source?.type !== "edge" || source.label === undefined) continue;
    const seen = layout.badges.filter((b) => b.step <= e.step).map((b) => badgeRect([b.x, b.y]));
    labels.push(
      placeLabel(
        { step: e.step, event: e.event, text: source.label, points: e.points, color: e.color, ...(source.labelSide ? { side: source.labelSide } : {}), flip: true },
        { hard: [...layout.nodes, ...layout.boxes], soft: [...cards, ...labels.filter((l) => l.step === e.step)], touch: seen },
      ),
    );
  }
  return labels;
}
