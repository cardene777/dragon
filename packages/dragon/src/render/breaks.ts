/**
 * 描いた図の崩れ (#3484)。描いた結果の座標から、段ごとの止め絵で見えている物どうしの崩れを数える。
 *
 * 字の重なり (`ink.ts`) が拾わない 7 種を拾う。
 * 番号の丸が自分の箱の見えている形から離れて浮く (`badge-off-shape`)、硬貨の枠が箱の形からはみ出す (`slot-outside-shape`)、
 * 箱の字が箱の形からはみ出す (`text-outside-shape`)、番号の丸どうしが近すぎる (`badges-close`)、並んだ 2 本の線が近すぎる (`lines-close`)、
 * 線が箱か囲みの枠に沿って近すぎる (`line-near-border`、#3526)、字が自分の箱か札の枠に接する (`text-touches-border`、#3526)。
 * 箱の形は足した箱のブロックの形 (アーチや六角形) で、形を持たない箱は四角なので、形の崩れは足した箱のブロックの箱だけで起きる。
 * 形を持たない四角の箱の字は、形の崩れの代わりに枠に接するかを見る。
 *
 * 重なって当然の組は数えない。線とその両端の箱、グループとその中の箱は、どの種類も比べない組なので数えない。
 * 箱の角に付いた番号の丸と、線の始まりの番号の丸とその線を出す箱の縁 (1px の間) は、丸が形に触れているので浮いた丸に数えない。
 * 同じ崩れが続く段にわたって見える時は、最初に見える段の 1 件にする。
 */
import type { Point, Rect, SceneBox, SceneEdge, SceneRegion, SceneSide } from "../layout/scene";
import { LOOK } from "../look/values";
import { type Ink, type Trace, visible } from "./ink";
import { signedDistance } from "./outline";

/** 崩れに関わる物。段の番号と線の段は 1 から数え、箱と線の端は箱の名前で呼ぶ */
export type LayoutPart =
  | { kind: "badge"; step: number }
  | { kind: "box"; name: string }
  | { kind: "group"; name: string }
  | { kind: "slot"; box: string }
  | { kind: "text"; text: string; box?: string }
  | { kind: "line"; from: string; to: string; step: number };

export type LayoutBreakKind = "badge-off-shape" | "slot-outside-shape" | "text-outside-shape" | "badges-close" | "lines-close" | "line-near-border" | "text-touches-border";

/** 崩れ 1 件。`step` は崩れが見え始める段 (1 から数える)、`width` は幅 390 で描いた時だけ出る崩れの描いた幅 */
export interface LayoutBreak {
  kind: LayoutBreakKind;
  step: number;
  width?: number;
  parts: [LayoutPart, LayoutPart];
}

/** 囲み (#3526)。線が枠に沿って近すぎるかを見る。`name` は知らせる文で呼ぶ囲みの名前 */
export interface BreakGroup extends Rect {
  name: string;
}

/** 崩れを数える材料。描く処理が描いた時に記録した字と線と、描いた箱と線と囲みと、足した箱のブロックの箱の形 */
export interface BreakInput {
  inks: Ink[];
  traces: Trace[];
  /** 段ごとの止め絵の時刻 */
  stills: number[];
  /** 箱の札を描いた箱 */
  boxes: SceneBox[];
  edges: SceneEdge[];
  /** 描いた囲み。囲みを持たない図の種類は空 */
  groups: BreakGroup[];
  /** 箱の名札ごとの見えている形の輪郭。形を持たない箱は持たない */
  outlines: ReadonlyMap<string, Point[][]>;
}

/**
 * 描く処理が描いた後に渡す材料。箱の形の輪郭と、囲みの名前は崩れを探す側が組む。
 * 描く処理は図の区画と状態遷移図の脇道の囲みをそのまま渡し、名前を組む処理を見本帳が最初に読む script に入れない (#3526)
 */
export type DrawnFigure = Omit<BreakInput, "outlines" | "groups"> & { regions: SceneRegion[]; side: SceneSide | undefined };

/**
 * 描いた図の崩れを返す関数 (#3494)。`renderDiagram` の `findBreaks` に渡すと、描いた後に呼ばれて結果が `breaks` になる。
 * 描く処理はこの file を型でしか読まず、崩れを探す処理は渡した側 (`layout-check.ts`) だけが読む。
 * 描くだけの頁 (見本帳) が崩れを探す処理を最初の script に持たないため
 */
export type BreakFinder = (drawn: DrawnFigure) => LayoutBreak[];

const R = LOOK.badge.r;
/** 触れているとみなす間 (px)。線の始まりの番号の丸は箱の縁から 1px 離して置く */
const TOUCH = 2;
/** 番号の丸どうしの間の下限。丸の半径より狭いと 2 つの番号が 1 つの塊に見える */
const BADGE_GAP = R;
/** 並んだ線の間の下限と、並んで走る長さの下限。番号の丸 1 つ分より狭い間で丸 2 つ分より長く並ぶ線は 1 本の太い線に見える */
const LINE_GAP = 2 * R;
const LINE_ALONG = 2 * R;
/**
 * 線と箱か囲みの枠の間の下限 (#3526)。図の外周の余白と同じ値で、構成図の線も箱の下と上を回る時にこれだけ空けて通る。
 * これより近く、丸 2 つ分より長く枠に沿って走る線は、枠の線と 1 本に見えるか、線に乗る番号の丸が枠に掛かる
 */
const BORDER_GAP = LOOK.margin;
/** 間を測る足し引きの丸めの誤差。余白ちょうどに描いた線を崩れに数えない */
const ROUNDING = 0.01;

/** 点から四角までの距離。四角の内の点は 0 */
function distanceToRect([px, py]: Point, r: Rect): number {
  const dx = Math.max(r.x - px, 0, px - (r.x + r.w));
  const dy = Math.max(r.y - py, 0, py - (r.y + r.h));
  return Math.hypot(dx, dy);
}

const centerOf = (r: Rect): Point => [r.x + r.w / 2, r.y + r.h / 2];

/** 崩れの中身を比べる鍵。同じ崩れを 1 件にまとめ、幅ごとの崩れを突き合わせる */
export const breakKey = (b: LayoutBreak): string => JSON.stringify([b.kind, b.step, b.parts]);

/** 描いた結果の崩れを、見え始める段の順に並べる */
export function findBreaks(input: BreakInput): LayoutBreak[] {
  const { inks, traces, stills, boxes, edges, groups, outlines } = input;
  const names = new Map(boxes.map((b) => [b.id, b.name]));
  const nameOf = (id: string): string => names.get(id) ?? id;
  /** `items` が揃って見える最初の段 (1 から数える)。揃って見えなければ `undefined` */
  const firstSeen = (...items: { shown: Ink["shown"] }[]): number | undefined => {
    const at = stills.findIndex((t) => items.every((item) => visible(item, t)));
    return at < 0 ? undefined : at + 1;
  };
  const out: LayoutBreak[] = [];
  const add = (kind: LayoutBreakKind, step: number | undefined, parts: [LayoutPart, LayoutPart]): void => {
    if (step !== undefined) out.push({ kind, step, parts });
  };

  const badges = inks.filter((ink) => ink.badge === true);
  const shaped = boxes.filter((b) => outlines.has(b.id));
  for (const ink of badges) {
    const center = centerOf(ink.rect);
    const r = ink.rect.w / 2;
    for (const box of shaped) {
      // 箱の四角に触れている丸は、その箱に付けた丸。見えている形から丸の半径より離れていれば浮いて見える
      if (distanceToRect(center, box) - r > TOUCH) continue;
      if (signedDistance(outlines.get(box.id) as Point[][], center) - r <= R) continue;
      add("badge-off-shape", firstSeen(ink), [
        { kind: "badge", step: Number(ink.text) },
        { kind: "box", name: box.name },
      ]);
    }
  }
  badges.forEach((a, i) => {
    for (const b of badges.slice(i + 1)) {
      const [ax, ay] = centerOf(a.rect);
      const [bx, by] = centerOf(b.rect);
      if (Math.hypot(ax - bx, ay - by) - a.rect.w / 2 - b.rect.w / 2 >= BADGE_GAP) continue;
      const [first, second] = Number(a.text) <= Number(b.text) ? [a, b] : [b, a];
      add("badges-close", firstSeen(a, b), [
        { kind: "badge", step: Number(first.text) },
        { kind: "badge", step: Number(second.text) },
      ]);
    }
  });

  for (const box of shaped) {
    const outline = outlines.get(box.id) as Point[][];
    // 枠と字は縁から触れている間までの食い出しを許す。縁の線の太さと字の形の丸めで、形にぴったり収めた物も縁に乗るため
    const outside = (p: Point): boolean => signedDistance(outline, p) > TOUCH;
    const slot = box.slot;
    if (slot) {
      const corners: Point[] = [
        [slot.x, slot.y],
        [slot.x + slot.w, slot.y],
        [slot.x + slot.w, slot.y + slot.h],
        [slot.x, slot.y + slot.h],
      ];
      // 硬貨の枠は初めから最後まで見えている
      if (corners.some(outside))
        add("slot-outside-shape", stills.length > 0 ? 1 : undefined, [
          { kind: "slot", box: box.name },
          { kind: "box", name: box.name },
        ]);
    }
    // 箱の名前と下の字。字の高さの真ん中の線の両端と真ん中が形の内にあるかで見る。絵柄は字でないので見ない
    for (const ink of inks) {
      if (ink.box !== box.id || ink.badge === true || ink.part !== undefined) continue;
      const y = ink.rect.y + ink.rect.h / 2;
      const line: Point[] = [
        [ink.rect.x, y],
        [ink.rect.x + ink.rect.w / 2, y],
        [ink.rect.x + ink.rect.w, y],
      ];
      if (line.some(outside))
        add("text-outside-shape", firstSeen(ink), [
          { kind: "text", text: ink.text, box: box.name },
          { kind: "box", name: box.name },
        ]);
    }
  }

  // 線の段は、描いた線の点の並びを引いて、その線を描いた段から取る。段を持たない線 (状態遷移図の通らない道など) は見え始める段にする
  const edgeSteps = new Map(edges.map((e) => [e.points, e.step + 1]));
  traces.forEach((a, i) => {
    for (const b of traces.slice(i + 1)) {
      if (!runAlong(a.points, b.points)) continue;
      const seen = firstSeen(a, b);
      if (seen === undefined) continue;
      const stepA = edgeSteps.get(a.points) ?? seen;
      const stepB = edgeSteps.get(b.points) ?? seen;
      const [first, second] = stepA <= stepB ? [[a, stepA] as const, [b, stepB] as const] : [[b, stepB] as const, [a, stepA] as const];
      // 点線の道は初めから見えているので、2 本目の線を引く段で知らせる
      add("lines-close", Math.max(seen, stepA, stepB), [
        { kind: "line", from: nameOf(first[0].from), to: nameOf(first[0].to), step: first[1] },
        { kind: "line", from: nameOf(second[0].from), to: nameOf(second[0].to), step: second[1] },
      ]);
    }
  });

  // 字とその枠。札の字は描く処理が記録した札の枠、箱の字は形を持たない四角の箱の枠と比べる。形を持つ箱の字は形からのはみ出しで見る
  const byId = new Map(boxes.map((b) => [b.id, b]));
  for (const ink of inks) {
    if (ink.badge === true || ink.part !== undefined) continue;
    const owner = ink.box === undefined || outlines.has(ink.box) ? undefined : byId.get(ink.box);
    const frame = ink.frame ?? (owner ? { name: owner.name, rect: owner } : undefined);
    if (!frame) continue;
    const { rect: r } = ink;
    const f = frame.rect;
    if (Math.min(r.x - f.x, f.x + f.w - (r.x + r.w), r.y - f.y, f.y + f.h - (r.y + r.h)) >= TOUCH) continue;
    add("text-touches-border", firstSeen(ink), [
      { kind: "text", text: ink.text, box: frame.name },
      { kind: "box", name: frame.name },
    ]);
  }

  // 線と箱か囲みの枠。線の両端の箱は線が出入りする箱なので比べない。箱は名前の字が見えている段から比べる
  const boxInk = new Map<string, Ink>();
  for (const ink of inks) if (ink.box !== undefined && ink.part === undefined && ink.badge !== true && !boxInk.has(ink.box)) boxInk.set(ink.box, ink);
  for (const trace of traces) {
    const lineStep = edgeSteps.get(trace.points);
    const line = (seen: number): LayoutPart => ({ kind: "line", from: nameOf(trace.from), to: nameOf(trace.to), step: lineStep ?? seen });
    for (const box of boxes) {
      if (box.id === trace.from || box.id === trace.to || !runsNear(trace.points, box, false)) continue;
      const ink = boxInk.get(box.id);
      const seen = ink ? firstSeen(trace, ink) : firstSeen(trace);
      if (seen !== undefined) add("line-near-border", Math.max(seen, lineStep ?? seen), [line(seen), { kind: "box", name: box.name }]);
    }
    for (const group of groups) {
      if (!runsNear(trace.points, group, true)) continue;
      const seen = firstSeen(trace);
      if (seen !== undefined) add("line-near-border", Math.max(seen, lineStep ?? seen), [line(seen), { kind: "group", name: group.name }]);
    }
  }

  const seen = new Set<string>();
  return out
    .filter((b) => {
      const key = breakKey(b);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.step - b.step);
}

/**
 * 線のどこかで、縦か横の区間が四角の枠に沿って間 `BORDER_GAP` 未満で `LINE_ALONG` より長く走るか (#3526)。
 * `inside` が偽なら箱で、外から枠に沿う区間だけを見る (箱を横切る線は線と字の重なりが見る)。真なら囲みで、内と外の両方から枠に沿う区間を見る
 */
function runsNear(points: Point[], rect: Rect, inside: boolean): boolean {
  for (let k = 1; k < points.length; k++) {
    const [p, q] = [points[k - 1] as Point, points[k] as Point];
    for (const axis of [0, 1] as const) {
      // `axis` が 0 なら縦の区間 (x が同じ) を左右の枠と、1 なら横の区間 (y が同じ) を上下の枠と比べる
      if (p[axis] !== q[axis]) continue;
      const other = axis === 0 ? 1 : 0;
      const [lo, hi] = [Math.min(p[other], q[other]), Math.max(p[other], q[other])];
      const [start, end] = axis === 0 ? [rect.y, rect.y + rect.h] : [rect.x, rect.x + rect.w];
      if (Math.min(hi, end) - Math.max(lo, start) <= LINE_ALONG) continue;
      const at = p[axis];
      const [near, far] = axis === 0 ? [rect.x, rect.x + rect.w] : [rect.y, rect.y + rect.h];
      const gaps = inside ? [Math.abs(at - near), Math.abs(at - far)] : at < near ? [near - at] : at > far ? [at - far] : [];
      if (gaps.some((gap) => gap < BORDER_GAP - ROUNDING)) return true;
    }
  }
  return false;
}

/** 2 本の線のどこかで、縦か横の区間どうしが間 `LINE_GAP` 未満で `LINE_ALONG` より長く並んで走るか */
function runAlong(a: Point[], b: Point[]): boolean {
  const segments = (points: Point[]): [Point, Point][] => points.slice(1).map((p, k) => [points[k] as Point, p]);
  for (const [a0, a1] of segments(a))
    for (const [b0, b1] of segments(b)) {
      for (const axis of [0, 1] as const) {
        // `axis` が 0 なら縦の区間 (x が同じ)、1 なら横の区間 (y が同じ) どうしを比べる
        if (a0[axis] !== a1[axis] || b0[axis] !== b1[axis]) continue;
        const gap = Math.abs(a0[axis] - b0[axis]);
        const other = axis === 0 ? 1 : 0;
        const along =
          Math.min(Math.max(a0[other], a1[other]), Math.max(b0[other], b1[other])) - Math.max(Math.min(a0[other], a1[other]), Math.min(b0[other], b1[other]));
        if (gap > 0 && gap < LINE_GAP && along > LINE_ALONG) return true;
      }
    }
  return false;
}
