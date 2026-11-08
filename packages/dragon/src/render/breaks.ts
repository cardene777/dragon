/**
 * 描いた図の崩れ (#3484)。描いた結果の座標から、段ごとの止め絵で見えている物どうしの崩れを数える。
 *
 * 字の重なり (`ink.ts`) が拾わない 6 種を拾う。
 * 番号の丸が自分の箱の見えている形から離れて浮く (`badge-off-shape`)、硬貨の枠が箱の形からはみ出す (`slot-outside-shape`)、
 * 箱の字が箱の形からはみ出す (`text-outside-shape`)、番号の丸どうしが近すぎる (`badges-close`)、並んだ 2 本の線が近すぎる (`lines-close`)、
 * 線の名前か配管の図の流れた量の札が、名指す線から離れている (`label-off-line`、#3528)。
 * 箱の形は足した箱のブロックの形 (アーチや六角形) で、形を持たない箱は四角なので、形の崩れは足した箱のブロックの箱だけで起きる。
 *
 * 重なって当然の組は数えない。線とその両端の箱、グループとその中の箱は、どの種類も比べない組なので数えない。
 * 箱の角に付いた番号の丸と、線の始まりの番号の丸とその線を出す箱の縁 (1px の間) は、丸が形に触れているので浮いた丸に数えない。
 * 同じ崩れが続く段にわたって見える時は、最初に見える段の 1 件にする。
 */
import type { PipeLayout } from "../kinds/pipe/layout";
import { crossesRect, type Layout, type Point, type Rect, type SceneBox, type SceneEdge } from "../layout/scene";
import { PIPE_LOOK } from "../look/pipe";
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

export type LayoutBreakKind = "badge-off-shape" | "slot-outside-shape" | "text-outside-shape" | "badges-close" | "lines-close" | "label-off-line";

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
  /** 描いた図の置き場所。線の名前と配管の図の流れた量の札と、札が名指す線をここから引く (#3528) */
  layout: Layout;
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
/**
 * 線の名前の札を描く処理が最初に置く、札の四角から線までの間 (#3528)。線の上か下に置く札は線から札の真ん中まで `offset` 離すので、
 * そこから札の高さの半分を引いた間になり、線の脇に置く札は `side` の間になる。2 つのうち広い方を取る
 */
const LABEL_GAP = Math.max(LOOK.label.offset - LOOK.label.h / 2, LOOK.label.side);
/** 配管の図の流れた量の札を描く処理が最初に置く、札の四角から管の真ん中までの間。管の太さの半分と、管から札までの離れを足す */
const CHIP_GAP = PIPE_LOOK.bus.case / 2 + PIPE_LOOK.chip.off;

/** 点から四角までの距離。四角の内の点は 0 */
function distanceToRect([px, py]: Point, r: Rect): number {
  const dx = Math.max(r.x - px, 0, px - (r.x + r.w));
  const dy = Math.max(r.y - py, 0, py - (r.y + r.h));
  return Math.hypot(dx, dy);
}

/** 点から線分 a-b までの距離 */
function distanceToSegment([px, py]: Point, [ax, ay]: Point, [bx, by]: Point): number {
  const dx = bx - ax;
  const dy = by - ay;
  const length = dx * dx + dy * dy;
  const t = length === 0 ? 0 : Math.min(1, Math.max(0, ((px - ax) * dx + (py - ay) * dy) / length));
  return Math.hypot(ax + t * dx - px, ay + t * dy - py);
}

/** 札の四角から折れ線までの距離。線が四角を通れば 0、通らなければ線の点から四角までと、四角の角から線の区間までの最小 */
function lineGap(points: Point[], r: Rect): number {
  if (crossesRect(points, r)) return 0;
  const corners: Point[] = [
    [r.x, r.y],
    [r.x + r.w, r.y],
    [r.x, r.y + r.h],
    [r.x + r.w, r.y + r.h],
  ];
  return Math.min(
    ...points.map((p) => distanceToRect(p, r)),
    ...points.slice(1).flatMap((b, k) => corners.map((c) => distanceToSegment(c, points[k] as Point, b))),
  );
}

/**
 * 線の名前と流れた量の札と、札が名指す線 (#3528)。`step` は札が出る段 (0 から数える)、`points` は札が名指す線の点の並び、
 * `near` は札の四角から線までの離れの上限。上限は描く処理が最初に置く間に札の高さを足した長さで、
 * それより離れると札と線の間にもう 1 つ札が入り、間の札か別の線の名前に見える
 */
interface Tag {
  text: string;
  rect: Rect;
  step: number;
  points: Point[];
  line: Extract<LayoutPart, { kind: "line" }>;
  near: number;
}

/**
 * 置き場所 `layout` の線の名前と流れた量の札。線の名前はその線の両端の箱の名前で、流れた量の札は流れの両端の関係者の名前で線を呼ぶ。
 * 流れた量の札の線の段は、その流れが流れた段にする。流れを名指さない札 (狭い枠の図の下の帯の札) は、管から離して置くと決めた札なので数えない
 */
function tagsOf(layout: Layout): Tag[] {
  if (layout.kind === "pipe") {
    const pipe = layout as PipeLayout;
    const names = new Map(pipe.parties.map((p) => [p.id, p.name]));
    return pipe.chips.flatMap((chip): Tag[] => {
      const flow = pipe.flows.find((f) => f.id === chip.flow && f.step === chip.step);
      if (!flow) return [];
      const flowed = pipe.flows.find((f) => f.id === flow.id && f.fresh)?.step ?? chip.step;
      const line = { kind: "line" as const, from: names.get(flow.from) ?? flow.from, to: names.get(flow.to) ?? flow.to, step: flowed + 1 };
      return [{ text: chip.text, rect: chip, step: chip.step, points: flow.points, line, near: CHIP_GAP + chip.h }];
    });
  }
  const names = new Map(layout.boxes.map((b) => [b.id, b.name]));
  return layout.labels.flatMap((label): Tag[] => {
    const edge = layout.edges.find((e) => e.step === label.step && e.event === label.event);
    if (!edge) return [];
    const line = { kind: "line" as const, from: names.get(edge.from) ?? edge.from, to: names.get(edge.to) ?? edge.to, step: edge.step + 1 };
    return [{ text: label.text, rect: label, step: label.step, points: edge.points, line, near: LABEL_GAP + label.h }];
  });
}

const centerOf = (r: Rect): Point => [r.x + r.w / 2, r.y + r.h / 2];

/** 崩れの中身を比べる鍵。同じ崩れを 1 件にまとめ、幅ごとの崩れを突き合わせる */
export const breakKey = (b: LayoutBreak): string => JSON.stringify([b.kind, b.step, b.parts]);

/** 描いた結果の崩れを、見え始める段の順に並べる */
export function findBreaks(input: BreakInput): LayoutBreak[] {
  const { inks, traces, stills, boxes, edges, layout, outlines } = input;
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

  // 線の名前と流れた量の札。配管の図の札は段ごとに置き直すので、同じ札と線の組が続く段で離れている時は最初の段の 1 件にする
  const offLine = new Set<string>();
  for (const tag of tagsOf(layout).sort((a, b) => a.step - b.step)) {
    if (lineGap(tag.points, tag.rect) <= tag.near) continue;
    const key = JSON.stringify([tag.text, tag.line]);
    if (offLine.has(key)) continue;
    offLine.add(key);
    add("label-off-line", tag.step + 1, [{ kind: "text", text: tag.text }, tag.line]);
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
