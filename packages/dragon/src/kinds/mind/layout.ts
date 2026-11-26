/**
 * 考えを広げる地図の置き場所 (#3619)。見た目の元は step 2 で本人が選んだ動く試作の案A (真ん中の題から枝を四方へ曲線で伸ばし、段ごとに枝と葉が濃くなる)。
 *
 * 真ん中の題を図の横の真ん中に置き、題の子の枝を左右の列に分ける。枝は書いた順に左上から右回りに置き、右の列に左の列と同じ数か 1 つ多く置く。
 * 枝が 4 つなら左上、右上、右下、左下の四方になる。枝の子の葉は枝より外の列に、枝の高さの真ん中を挟んで縦に並べる。
 * 枝の塊 (枝と、その葉と、枝の上の段の番号の丸) は列の中で上から重ねて並べ、列の真ん中を題の高さに揃える。
 * 題から枝へ、枝から葉へは、親の縁の高さの真ん中から親の色の短い幹を横へ出し、幹の先の 1 点から子の縁へ横向きに出て横向きに入る曲線で結ぶ (#3960)。
 * 幹は親と子を置いた側ごとに 1 本にし、子の縁までの `MIND_LOOK.fork` の割合の所で分ける。どの子への線も親の縁の同じ 1 点から出て、同じ 1 点で分かれる。
 * 色は、書いた色が無い題を `MIND_LOOK.centre`、書いた色が無い枝を書いた順に `MIND_LOOK.branches` のうちほかの枝が書いていない色にし、葉は書いた色が無ければ枝の色を継ぐ。
 * 段の番号は、その段で最初に書いた考えの枠の上に置き、考えを書かない段は前の段の番号と同じ所で入れ替える
 */
import { textWidth } from "../../layout/measure";
import { besideSameSpot, gapBetween, type Layout, type Point, type Rect, type SceneBadge } from "../../layout/scene";
import { MIND_LOOK, MIND_TYPE, type MindLevel } from "../../look/mind";
import { type ColorKey, LOOK } from "../../look/values";
import type { DiagramModel, MindIdea } from "../../schema";

/** 並べた考え。`side` は題から見た列 (左が -1、右が 1、題は 0)。`step` と `event` は考えを書いた段と出来事の番号 */
export interface MindPlaced extends Rect {
  id: string;
  name: string;
  cx: number;
  cy: number;
  level: MindLevel;
  parent?: string;
  color: ColorKey;
  side: -1 | 0 | 1;
  step: number;
  event: number;
}

/**
 * 親から子への曲線。`curve` は幹の先から子の縁までの曲線の始まり、2 つの制御点、終わりの 4 つの点。
 * `points` は親の縁から幹を通って子の縁までの道を区切った点で、崩れの確かめと段の番号の置き場所と窓の端の札に渡す
 */
export interface MindLink {
  from: string;
  to: string;
  level: 1 | 2;
  color: ColorKey;
  step: number;
  event: number;
  curve: [Point, Point, Point, Point];
  points: Point[];
}

/**
 * 親の縁から子の側へ横に出る幹 (#3960)。親と子を置いた側 (`side`) ごとに 1 本で、親の色で描く。
 * `start` は親の縁の高さの真ん中、`fork` は子への曲線が分かれる幹の先。`step` と `event` はその側で最初に書いた子の段と出来事の番号で、幹はその子と一緒に引く。
 * `level` は線の太さの段で、題からの幹が 1、枝からの幹が 2
 */
export interface MindTrunk {
  from: string;
  side: -1 | 1;
  level: 1 | 2;
  color: ColorKey;
  step: number;
  event: number;
  start: Point;
  fork: Point;
}

export interface MindLayout extends Layout {
  kind: "mind";
  ideas: MindPlaced[];
  links: MindLink[];
  trunks: MindTrunk[];
}

interface Written {
  idea: MindIdea;
  step: number;
  event: number;
}

const sizeOf = (level: MindLevel): { h: number; pad: number } =>
  level === 0 ? MIND_LOOK.node.centre : level === 1 ? MIND_LOOK.node.branch : MIND_LOOK.node.leaf;
const typeOf = (level: MindLevel) => (level === 0 ? MIND_TYPE.centre : level === 1 ? MIND_TYPE.branch : MIND_TYPE.leaf);

/** 3 次の曲線の `t` の所 */
function bezier([a, b, c, d]: [Point, Point, Point, Point], t: number): Point {
  const u = 1 - t;
  const at = (k: 0 | 1): number => u * u * u * a[k] + 3 * u * u * t * b[k] + 3 * u * t * t * c[k] + t * t * t * d[k];
  return [at(0), at(1)];
}

/** `from` から `to` へ横向きに出て横向きに入る曲線 */
function curveOf(from: Point, to: Point): [Point, Point, Point, Point] {
  const mx = (from[0] + to[0]) / 2;
  return [from, [mx, from[1]], [mx, to[1]], to];
}

/** 曲線を崩れの確かめに渡す点に区切る */
const sampled = (curve: [Point, Point, Point, Point]): Point[] => Array.from({ length: MIND_LOOK.samples + 1 }, (_, k) => bezier(curve, k / MIND_LOOK.samples));

/** 親の縁の点 `start` から、子の縁の x (`edge`) までの `MIND_LOOK.fork` の割合の所にある幹の先 */
const forkOf = (start: Point, edge: number): Point => [start[0] + (edge - start[0]) * MIND_LOOK.fork, start[1]];

/** 親の縁から幹の先までの直線を区切った点。幹の先は子への曲線の始まりと同じ点なので入れない */
const stemOf = (start: Point, fork: Point): Point[] =>
  Array.from({ length: MIND_LOOK.stem }, (_, k) => [start[0] + ((fork[0] - start[0]) * k) / MIND_LOOK.stem, start[1]] as Point);

/** 段の番号の丸の真ん中 `p` の四角 */
const disc = ([x, y]: Point): Rect => ({ x: x - LOOK.badge.r, y: y - LOOK.badge.r, w: LOOK.badge.r * 2, h: LOOK.badge.r * 2 });

export function layoutMind(diagram: DiagramModel): MindLayout {
  const written: Written[] = diagram.steps.flatMap((step, s) => step.events.flatMap((e, i) => (e.type === "idea" ? [{ idea: e, step: s, event: i }] : [])));
  const byId = new Map(written.map((w) => [w.idea.id, w]));
  const kids = new Map<string, string[]>();
  for (const w of written) if (w.idea.parent !== undefined) kids.set(w.idea.parent, [...(kids.get(w.idea.parent) ?? []), w.idea.id]);
  const centre = written.find((w) => w.idea.parent === undefined);
  const branches = centre ? (kids.get(centre.idea.id) ?? []) : [];

  // 色。色を書かない枝には、ほかの枝が書いていない色を書いた順に配る
  const colors = new Map<string, ColorKey>();
  if (centre) colors.set(centre.idea.id, centre.idea.color ?? MIND_LOOK.centre);
  const taken = new Set(branches.flatMap((id) => (byId.get(id)?.idea.color === undefined ? [] : [byId.get(id)?.idea.color as ColorKey])));
  const free = MIND_LOOK.branches.filter((c) => !taken.has(c));
  const pool: readonly ColorKey[] = free.length > 0 ? free : MIND_LOOK.branches;
  let plain = 0;
  for (const id of branches) colors.set(id, byId.get(id)?.idea.color ?? (pool[plain++ % pool.length] as ColorKey));
  for (const w of written) if (!colors.has(w.idea.id)) colors.set(w.idea.id, w.idea.color ?? colors.get(w.idea.parent ?? "") ?? MIND_LOOK.centre);

  const placed = new Map<string, MindPlaced>();
  const widthOf = (id: string, level: MindLevel): number => textWidth(byId.get(id)?.idea.name ?? id, typeOf(level)) + sizeOf(level).pad;
  const place = (id: string, level: MindLevel, side: -1 | 0 | 1, cx: number, cy: number): MindPlaced => {
    const w = byId.get(id) as Written;
    const size = sizeOf(level);
    const width = widthOf(id, level);
    const p: MindPlaced = {
      id,
      name: w.idea.name,
      x: cx - width / 2,
      y: cy - size.h / 2,
      w: width,
      h: size.h,
      cx,
      cy,
      level,
      ...(w.idea.parent !== undefined ? { parent: w.idea.parent } : {}),
      color: colors.get(id) ?? MIND_LOOK.centre,
      side,
      step: w.step,
      event: w.event,
    };
    placed.set(id, p);
    return p;
  };

  const G = MIND_LOOK.gap;
  const links: MindLink[] = [];
  const trunks: MindTrunk[] = [];
  /** 親 `from` の `side` の側に、子 `kids` の中で最初に書いた子と一緒に引く幹を置き、幹の先を返す */
  const trunk = (from: MindPlaced, side: -1 | 1, level: 1 | 2, edge: number, kids: MindPlaced[]): { fork: Point; stem: Point[] } => {
    const start: Point = [side > 0 ? from.x + from.w : from.x, from.cy];
    const fork = forkOf(start, edge);
    const first = kids.reduce((a, b) => (b.step < a.step || (b.step === a.step && b.event < a.event) ? b : a));
    trunks.push({ from: from.id, side, level, color: from.color, step: first.step, event: first.event, start, fork });
    return { fork, stem: stemOf(start, fork) };
  };
  if (centre) {
    const c = place(centre.idea.id, 0, 0, 0, 0);
    // 左の列に書いた順の最初の枝と、右の列に置いた残りを右回りに続けた枝を置く
    const left = Math.floor(branches.length / 2);
    const right = branches.length - left;
    const columns: [-1 | 1, string[]][] = [
      [-1, left > 0 ? [branches[0] as string, ...branches.slice(right + 1).reverse()] : []],
      [1, left > 0 ? branches.slice(1, right + 1) : branches],
    ];
    const room = LOOK.badge.r * 2 + MIND_LOOK.badge.above;
    for (const [side, column] of columns) {
      if (column.length === 0) continue;
      const leafH = MIND_LOOK.node.leaf.h;
      // 枝の塊ごとの、枝の真ん中から上と下への広がり。上は葉の並びか、枝と段の番号の丸の高い方
      const blocks = column.map((id) => {
        const n = (kids.get(id) ?? []).length;
        const stack = n === 0 ? 0 : n * leafH + (n - 1) * G.leaf;
        const half = MIND_LOOK.node.branch.h / 2;
        return { id, stack, up: Math.max(stack / 2, half + room), down: Math.max(stack / 2, half) };
      });
      const total = blocks.reduce((sum, b) => sum + b.up + b.down, 0) + G.branch * (blocks.length - 1);
      const inner = c.w / 2 + G.trunk;
      let top = -total / 2;
      const placedBranches = blocks.map((b) => {
        const w = widthOf(b.id, 1);
        const p = place(b.id, 1, side, side * (inner + w / 2), top + b.up);
        top += b.up + b.down + G.branch;
        return { p, stack: b.stack };
      });
      const outer = Math.max(...placedBranches.map(({ p }) => inner + p.w)) + G.twig;
      // 題の縁から枝の内の縁への線。題の幹の先から枝ごとの曲線に分かれる
      const centreStem = trunk(c, side, 1, side * inner, placedBranches.map(({ p }) => p));
      placedBranches.forEach(({ p, stack }) => {
        const to: Point = [side > 0 ? p.x : p.x + p.w, p.cy];
        const curve = curveOf(centreStem.fork, to);
        links.push({ from: c.id, to: p.id, level: 1, color: p.color, step: p.step, event: p.event, curve, points: [...centreStem.stem, ...sampled(curve)] });
        const leaves = kids.get(p.id) ?? [];
        let y = p.cy - stack / 2;
        const placedLeaves = leaves.map((id) => {
          const w = widthOf(id, 2);
          const leaf = place(id, 2, side, side * (outer + w / 2), y + leafH / 2);
          y += leafH + G.leaf;
          return leaf;
        });
        if (placedLeaves.length === 0) return;
        // 枝の外の縁から葉の内の縁への線。枝の幹の先から葉ごとの曲線に分かれる
        const branchStem = trunk(p, side, 2, side * outer, placedLeaves);
        for (const leaf of placedLeaves) {
          const into: Point = [side > 0 ? leaf.x : leaf.x + leaf.w, leaf.cy];
          const curve = curveOf(branchStem.fork, into);
          links.push({ from: p.id, to: leaf.id, level: 2, color: leaf.color, step: leaf.step, event: leaf.event, curve, points: [...branchStem.stem, ...sampled(curve)] });
        }
      });
    }
  }

  // 段の番号。その段で最初に書いた考えの枠の上、外の横、下の順に、ほかの考えと線と丸に掛からない所へ置く
  const ideas = written.flatMap((w) => {
    const p = placed.get(w.idea.id);
    return p ? [p] : [];
  });
  const spots: Point[] = [];
  const blocked = (spot: Point, own: MindPlaced): boolean => {
    const rect = disc(spot);
    return (
      ideas.some((p) => gapBetween(rect, p) < (p === own ? MIND_LOOK.badge.above - 0.5 : LOOK.label.touch)) ||
      links.some((l) => l.points.some(([x, y]) => Math.hypot(x - spot[0], y - spot[1]) < LOOK.badge.r + MIND_LOOK.badge.above)) ||
      spots.some((q) => Math.hypot(q[0] - spot[0], q[1] - spot[1]) < LOOK.badge.r * 4)
    );
  };
  const spotOf = (p: MindPlaced): Point => {
    const gap = MIND_LOOK.badge.above + LOOK.badge.r;
    const out = p.side < 0 ? -1 : 1;
    const tries: Point[] = [
      [p.cx, p.y - gap],
      [out > 0 ? p.x + p.w + gap : p.x - gap, p.cy],
      [p.cx, p.y + p.h + gap],
    ];
    return tries.find((t) => !blocked(t, p)) ?? (tries[0] as Point);
  };
  const raw: SceneBadge[] = [];
  let last: { at: Point; color: ColorKey } | undefined;
  const first = ideas[0];
  diagram.steps.forEach((_, s) => {
    const own = ideas.find((p) => p.step === s);
    if (own) {
      const at = spotOf(own);
      spots.push(at);
      last = { at, color: own.color };
    } else if (!last && first) {
      const at = spotOf(first);
      spots.push(at);
      last = { at, color: first.color };
    }
    if (last) raw.push({ step: s, x: last.at[0], y: last.at[1], color: last.color });
  });
  const badges = besideSameSpot(raw, () => false, () => true);

  // 図の枠。題を図の横の真ん中に置くので、左右は遠い側の幅に揃える
  const parts: Rect[] = [...ideas, ...badges.map((b) => disc([b.x, b.y])), ...links.flatMap((l) => l.points.map(([x, y]) => ({ x, y, w: 0, h: 0 })))];
  const minY = Math.min(0, ...parts.map((r) => r.y));
  const maxY = Math.max(0, ...parts.map((r) => r.y + r.h));
  const half = Math.max(0, ...parts.map((r) => Math.max(-r.x, r.x + r.w)));
  const dx = half + MIND_LOOK.pad;
  const dy = MIND_LOOK.pad - minY;
  const shift = ([x, y]: Point): Point => [x + dx, y + dy];
  return {
    kind: "mind",
    width: Math.ceil(dx * 2),
    height: Math.ceil(maxY - minY + MIND_LOOK.pad * 2),
    regions: [],
    boxes: [],
    lifelines: [],
    edges: [],
    labels: [],
    actions: [],
    badges: badges.map((b) => ({ ...b, x: b.x + dx, y: b.y + dy })),
    paths: [],
    ends: [],
    ideas: ideas.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy, cx: p.cx + dx, cy: p.cy + dy })),
    links: links.map((l) => ({ ...l, curve: l.curve.map(shift) as [Point, Point, Point, Point], points: l.points.map(shift) })),
    trunks: trunks.map((t) => ({ ...t, start: shift(t.start), fork: shift(t.fork) })),
  };
}
