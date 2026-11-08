/**
 * 描いた図の崩れ (#3484)。描いた結果の座標から、段ごとの止め絵で見えている物どうしの崩れを数える。
 *
 * 字の重なり (`ink.ts`) が拾わない 5 種を拾う。
 * 番号の丸が自分の箱の見えている形から離れて浮く (`badge-off-shape`)、硬貨の枠が箱の形からはみ出す (`slot-outside-shape`)、
 * 箱の字が箱の形からはみ出す (`text-outside-shape`)、番号の丸どうしが近すぎる (`badges-close`)、並んだ 2 本の線が近すぎる (`lines-close`)。
 * 箱の形は足した箱のブロックの形 (アーチや六角形) で、形を持たない箱は四角なので、形の崩れは足した箱のブロックの箱だけで起きる。
 *
 * 重なって当然の組は数えない。線とその両端の箱、グループとその中の箱は、どの種類も比べない組なので数えない。
 * 箱の角に付いた番号の丸と、線の始まりの番号の丸とその線を出す箱の縁 (1px の間) は、丸が形に触れているので浮いた丸に数えない。
 * 同じ崩れが続く段にわたって見える時は、最初に見える段の 1 件にする。
 */
import { heldIn, type Seat } from "../blocks/carry/timing";
import type { Point, Rect, SceneBox, SceneEdge } from "../layout/scene";
import { LOOK } from "../look/values";
import { type Ink, type Trace, visible } from "./ink";
import { signedDistance } from "./outline";

/** 崩れに関わる物。段の番号と線の段は 1 から数え、箱と線の端は箱の名前で呼ぶ */
export type LayoutPart =
  | { kind: "badge"; step: number }
  | { kind: "box"; name: string }
  | { kind: "slot"; box: string }
  | { kind: "text"; text: string; box?: string }
  | { kind: "line"; from: string; to: string; step: number };

export type LayoutBreakKind = "badge-off-shape" | "slot-outside-shape" | "text-outside-shape" | "badges-close" | "lines-close";

/** 崩れ 1 件。`step` は崩れが見え始める段 (1 から数える)、`width` は幅 390 で描いた時だけ出る崩れの描いた幅 */
export interface LayoutBreak {
  kind: LayoutBreakKind;
  step: number;
  width?: number;
  parts: [LayoutPart, LayoutPart];
}

/** 崩れを数える材料。描く処理が描いた時に記録した字と線と、描いた箱と線と、足した箱のブロックの箱の形 */
export interface BreakInput {
  inks: Ink[];
  traces: Trace[];
  /** 段ごとの止め絵の時刻 */
  stills: number[];
  /** 箱の札を描いた箱 */
  boxes: SceneBox[];
  edges: SceneEdge[];
  /** 箱の名札ごとの見えている形の輪郭。形を持たない箱は持たない */
  outlines: ReadonlyMap<string, Point[][]>;
}

/** 描く処理が描いた後に渡す材料。箱の形の輪郭は崩れを探す側が組む */
export type DrawnFigure = Omit<BreakInput, "outlines">;

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
  const { inks, traces, stills, boxes, edges, outlines } = input;
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
  // 運ぶ物が見えている所と間 (#3518)。運ぶ物は箱の名札と段の番号の印を持たない字として残り、置き場の枠の中に中心を持つ字は運ぶ物だけ
  const seats = inks.flatMap((ink) =>
    ink.box === undefined && ink.badge !== true ? ink.shown.map(([a, b]): Seat => [...centerOf(ink.rect), a, b]) : [],
  );
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
      // 置き場の枠は運ぶ物が座っている間だけ見えるので、座り始める段の 1 件にする。運ぶ物が座らない枠は見えないので数えない (#3518)
      if (corners.some(outside))
        add("slot-outside-shape", firstSeen({ shown: heldIn(slot, seats) }), [
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
