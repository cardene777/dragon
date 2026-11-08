/**
 * 描いた図の崩れ (#3484)。描いた結果の座標から、段ごとの止め絵で見えている物どうしの崩れを数える。
 *
 * 字の重なり (`ink.ts`) が拾わない 7 種を拾う。
 * 番号の丸が自分の箱の見えている形から離れて浮く (`badge-off-shape`)、硬貨の枠が箱の形からはみ出す (`slot-outside-shape`)、
 * 箱の字が箱の形からはみ出す (`text-outside-shape`)、番号の丸どうしが近すぎる (`badges-close`)、並んだ 2 本の線が近すぎる (`lines-close`)。
 * 時間軸の図の針と目盛りの線と字が、時間軸の囲みの枠を越えるか枠に接する (`panel-edge`、#3527)。
 * 番号の丸が囲みと列と帯の枠線に乗る (`badge-on-frame`、#3525)。
 * 図の枠からはみ出す部品 (`part-outside-frame`、#3515) も拾う。字の重なりは同じ図の中の物どうしを比べるので、枠の外で切れた字を拾わないため。
 * 同じ2つの箱を逆向きに結ぶ2本の線が同じ道に重なって走るのも、並んだ線が近すぎる崩れに数える (#3521)。
 * 線の名前か配管の図の流れた量の札が、名指す線から離れているもの (`label-off-line`、#3528) も拾う。
 * 線が札を持たない字を横切る (`line-crosses-text`、#3524) も数える。書き出しが字の重なりとして知らせる組と同じで、記法を確かめる命令でも知らせるため。
 * 箱の形は足した箱のブロックの形 (アーチや六角形) で、形を持たない箱は四角なので、形の崩れは足した箱のブロックの箱だけで起きる。
 * 後の段の番号がぴったり同じ所で前の段の番号と入れ替わる時も、2 つは同時に見えないが前の番号を隠すので、番号が近すぎる崩れに数える (#3525)。
 * 同じ線を何度も通る段の番号と列の図の右上の番号は、入れ替えるのが作りどおりなので数えない。
 *
 * 重なって当然の組は数えない。線とその両端の箱、グループとその中の箱は、どの種類も比べない組なので数えない。
 * 箱の角に付いた番号の丸と、線の始まりの番号の丸とその線を出す箱の縁 (1px の間) は、丸が形に触れているので浮いた丸に数えない。
 * 同じ崩れが続く段にわたって見える時は、最初に見える段の 1 件にする。
 */
import { heldIn, type Seat } from "../blocks/carry/timing";
import type { PipeLayout } from "../kinds/pipe/layout";
import { crossesRect, type Layout, type Point, type Rect, type SceneBox, type SceneEdge } from "../layout/scene";
import { PIPE_LOOK } from "../look/pipe";
import { APART, LOOK } from "../look/values";
import type { DiagramModel } from "../schema";
import { type Framed, type Ink, type InkPart, type Shown, type Trace, visible } from "./ink";

/** 図の枠の 4 つの端 */
export type FrameSide = "left" | "right" | "top" | "bottom";

/**
 * 崩れに関わる物。段の番号と線の段は 1 から数え、箱と線の端は箱の名前で呼ぶ。
 * 書き手が書いていない図の部品 (箱の絵柄、運ぶ物の硬貨と封筒) は部品の種類で、図の枠は部品がはみ出す端で呼ぶ (#3515)。時間軸の囲みは`panel`で呼ぶ (#3527)
 */
export type LayoutPart =
  | { kind: "badge"; step: number }
  | { kind: "box"; name: string }
  | { kind: "slot"; box: string }
  | { kind: "text"; text: string; box?: string }
  | { kind: "line"; from: string; to: string; step: number }
  | InkPart
  | { kind: "frame"; side: FrameSide }
  | { kind: "needle" }
  | { kind: "ticks" }
  | { kind: "panel"; panel: "axis" }
  | { kind: "border"; name: string };

export type LayoutBreakKind =
  | "badge-off-shape"
  | "slot-outside-shape"
  | "text-outside-shape"
  | "badges-close"
  | "lines-close"
  | "part-outside-frame"
  | "panel-edge"
  | "label-off-line"
  | "line-crosses-text"
  | "badge-on-frame";

/** 枠線を描いた囲みと列と帯 (#3525)。`name` は囲みと列の名前か帯の題で、名前を持たない囲み (時間軸の図の時間軸) は空 */
export interface Border {
  name: string;
  rect: Rect;
}

/** 崩れ 1 件。`step` は崩れが見え始める段 (1 から数える)、`width` は幅 390 で描いた時だけ出る崩れの描いた幅 */
export interface LayoutBreak {
  kind: LayoutBreakKind;
  step: number;
  width?: number;
  parts: [LayoutPart, LayoutPart];
}

/** 崩れを数える材料。描く処理が描いた時に記録した字と線と時間軸の囲みに収める部品と、描いた箱と線と、足した箱のブロックの箱の形と、図の枠の大きさ */
export interface BreakInput {
  inks: Ink[];
  traces: Trace[];
  framed: Framed[];
  /** 段ごとの止め絵の時刻 */
  stills: number[];
  /** 図の枠の幅と高さ。枠は左上を原点に置く (#3515) */
  frame: { w: number; h: number };
  /** 箱の札を描いた箱 */
  boxes: SceneBox[];
  edges: SceneEdge[];
  /**
   * 描いた図の置き場所。線の名前と配管の図の流れた量の札と、札が名指す線をここから引く (#3528)。
   * 描く処理は必ず渡す。描いた部品だけで崩れを組んで確かめる呼び出しは渡さず、その時は線から離れた札を数えない
   */
  layout?: Layout;
  /** 箱の名札ごとの見えている形の輪郭。形を持たない箱は持たない */
  outlines: ReadonlyMap<string, Point[][]>;
  /** 枠線を描いた囲みと列と帯 (#3525)。渡さない時は枠線に乗る番号を数えない */
  borders?: Border[];
}

/**
 * 描く処理が描いた後に渡す材料。箱の形の輪郭と、囲みと列と帯の枠線は崩れを探す側が組む。
 * 枠線は描いた置き場所 (`layout`) の囲みと列と帯から組み、囲みは原本 (`diagram`) の名前で呼ぶ (#3525)
 */
export type DrawnFigure = Omit<BreakInput, "outlines" | "borders"> & { diagram: DiagramModel };

/**
 * 描いた図の崩れを返す関数 (#3494)。`renderDiagram` の `findBreaks` に渡すと、描いた後に呼ばれて結果が `breaks` になる。
 * 描く処理はこの file を型でしか読まず、崩れを探す処理は渡した側 (`layout-check.ts`) だけが読む。
 * 描くだけの頁 (見本帳) が崩れを探す処理を最初の script に持たないため
 */
export type BreakFinder = (drawn: DrawnFigure) => LayoutBreak[];

const R = LOOK.badge.r;
/** 触れているとみなす間 (px)。線の始まりの番号の丸は箱の縁から 1px 離して置く */
const TOUCH = 2;
/**
 * 番号の丸どうしの間の下限と、並んだ線の間の下限。
 * 描く処理が番号の丸と行きと帰りの線を離す値と同じ所 (`APART`) から取り、描いた図と食い違わないようにする (#3521)
 */
const BADGE_GAP = APART.badge;
const LINE_GAP = APART.line;
/** 並んで走る長さの下限。番号の丸2つ分より長く狭い間で並ぶ線は1本の太い線に見える */
const LINE_ALONG = 2 * R;
/**
 * 線が字を横切ったとみなす食い込みの下限 (px)。字の重なり (`ink.ts` の `BITE`) と同じ値にし、書き出しが知らせる組と同じ組を数える。
 * `ink.ts` は頁が最初に読む塊に在り、値を書き出すだけで最初に読む量が増えるので、ここに同じ値を置く
 */
const BITE = 0.5;
/** 時間軸の囲みの枠の線の内側の縁から、部品までの間の下限 (px)。これより近い部品は枠に接して見える (#3527) */
const PANEL_GAP = 4;
/** 同じ所に置いたとみなす番号の丸の中心の間 (px)。描く処理が同じ所で数字を入れ替える番号と同じ値 */
const SAME = 0.5;
/** 囲みと列と帯の枠線の太さの半分 (px)。番号の丸が枠線に乗るのは、丸の中心から枠線までが丸の半径とこの値の和より近い時 */
const STROKE = 0.5;

/**
 * 点から囲みか帯の枠線までの距離 (内が負)。枠線は四角を 0.5px 内へ縮め、角を `LOOK.region.radius` で丸めて描く (`band` と `strip`)
 */
function borderDistance([px, py]: Point, r: Rect): number {
  const radius = LOOK.region.radius;
  const qx = Math.abs(px - (r.x + r.w / 2)) - ((r.w - 1) / 2 - radius);
  const qy = Math.abs(py - (r.y + r.h / 2)) - ((r.h - 1) / 2 - radius);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
}
/**
 * 線の名前の札を描く処理が最初に置く、札の四角から線までの間 (#3528)。線の上か下に置く札は線から札の真ん中まで `offset` 離すので、
 * そこから札の高さの半分を引いた間になり、線の脇に置く札は `side` の間になる。2 つのうち広い方を取る
 */
const LABEL_GAP = Math.max(LOOK.label.offset - LOOK.label.h / 2, LOOK.label.side);
/** 配管の図の流れた量の札を描く処理が最初に置く、札の四角から管の真ん中までの間。管の太さの半分と、管から札までの離れを足す */
const CHIP_GAP = PIPE_LOOK.bus.case / 2 + PIPE_LOOK.chip.off;

/** 輪の辺を、閉じる辺も含めて 1 本ずつ */
function* edgesOf(rings: Point[][]): Generator<[Point, Point]> {
  for (const ring of rings)
    for (let k = 0; k < ring.length; k++) yield [ring[k] as Point, ring[(k + 1) % ring.length] as Point];
}

/** 点 `p` が形の内にあるか。SVG の塗りの既定 (nonzero) と同じく、輪が点を回る数で決める */
function insideRings(rings: Point[][], [px, py]: Point): boolean {
  let winding = 0;
  for (const [a, b] of edgesOf(rings)) {
    const cross = (b[0] - a[0]) * (py - a[1]) - (px - a[0]) * (b[1] - a[1]);
    if (a[1] <= py) {
      if (b[1] > py && cross > 0) winding++;
    } else if (b[1] <= py && cross < 0) winding--;
  }
  return winding !== 0;
}

/** 点 `p` から形の縁までの距離。形の内の点は負の値にする */
function signedDistance(rings: Point[][], p: Point): number {
  let best = Number.POSITIVE_INFINITY;
  for (const [a, b] of edgesOf(rings)) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = dx * dx + dy * dy;
    const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len));
    best = Math.min(best, Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy)));
  }
  return insideRings(rings, p) ? -best : best;
}

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

/**
 * 四角`rect`が、囲み`frame`の枠の線の内側の縁からどれだけ内に在るか (px)。縁を越えた分は負になる。
 * 囲みの枠は太さ1pxの線を囲みの四角の内側に引き、角を`LOOK.region.radius`で丸める (`blocks/group/draw.ts`の`band`)。
 * 丸めた四角は凸なので、四角の4つの角で測れば足りる
 */
function clearance(rect: Rect, frame: Rect): number {
  const r = LOOK.region.radius - 1;
  const cx = frame.x + frame.w / 2;
  const cy = frame.y + frame.h / 2;
  let least = Number.POSITIVE_INFINITY;
  for (const px of [rect.x, rect.x + rect.w])
    for (const py of [rect.y, rect.y + rect.h]) {
      const qx = Math.abs(px - cx) - (frame.w / 2 - 1 - r);
      const qy = Math.abs(py - cy) - (frame.h / 2 - 1 - r);
      least = Math.min(least, r - Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - Math.min(Math.max(qx, qy), 0));
    }
  return least;
}

/** 崩れの中身を比べる鍵。同じ崩れを 1 件にまとめ、幅ごとの崩れを突き合わせる */
export const breakKey = (b: LayoutBreak): string => JSON.stringify([b.kind, b.step, b.parts]);

/** 描いた結果の崩れを、見え始める段の順に並べる */
export function findBreaks(input: BreakInput): LayoutBreak[] {
  const { inks, traces, framed, stills, boxes, edges, layout, outlines, frame, borders = [] } = input;
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
      const apart = Math.hypot(ax - bx, ay - by);
      if (apart - a.rect.w / 2 - b.rect.w / 2 >= BADGE_GAP) continue;
      const [first, second] = Number(a.text) <= Number(b.text) ? [a, b] : [b, a];
      // 同じ所の後の番号は、前の番号と入れ替わって同時に見えなくても、前の番号を隠す。後の番号が見え始める段で数える
      const hidden = apart <= SAME && first.shared !== true ? firstSeen(second) : undefined;
      add("badges-close", firstSeen(a, b) ?? hidden, [
        { kind: "badge", step: Number(first.text) },
        { kind: "badge", step: Number(second.text) },
      ]);
    }
  });
  // 囲みと列と帯は初めから最後まで見えているので、番号の丸が見え始める段で数える
  for (const ink of badges) {
    const center = centerOf(ink.rect);
    for (const border of borders) {
      if (Math.abs(borderDistance(center, border.rect)) >= ink.rect.w / 2 + STROKE) continue;
      add("badge-on-frame", firstSeen(ink), [
        { kind: "badge", step: Number(ink.text) },
        { kind: "border", name: border.name },
      ]);
    }
  }

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
      // 同じ2つの箱を逆向きに結ぶ線は、重なって走る (間が0の) 時も数える。頼みと答えの線が同じ道に重なると、互いの番号の丸が相手の矢じりを隠す (#3521)
      const back = a.from !== a.to && a.from === b.to && a.to === b.from;
      if (!runAlong(a.points, b.points, back)) continue;
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

  // 札を持たない字を横切る線。札の地は下の線を隠すので数えず、段の番号と図の部品は書き手が書いた字でないので数えない
  for (const ink of inks) {
    if (ink.boxed === true || ink.badge === true || ink.part !== undefined) continue;
    for (const trace of traces) {
      if (!crossesRect(trace.points, ink.rect, BITE)) continue;
      const seen = firstSeen(ink, trace);
      if (seen === undefined) continue;
      add("line-crosses-text", seen, [
        { kind: "line", from: nameOf(trace.from), to: nameOf(trace.to), step: edgeSteps.get(trace.points) ?? seen },
        { kind: "text", text: ink.text, ...(ink.box === undefined ? {} : { box: nameOf(ink.box) }) },
      ]);
    }
  }

  // 時間軸の部品は、囲みの枠を越えるか、枠の線の内側の縁から`PANEL_GAP`より近ければ崩れにする (#3527)
  for (const item of framed)
    if (clearance(item.rect, item.frame) < PANEL_GAP) add("panel-edge", firstSeen(item), [item.part, { kind: "panel", panel: "axis" }]);

  // 図の枠からはみ出す部品 (#3515)。枠の外へ触れている間より多く出た字と札と丸と絵柄と運ぶ物と線を、出た量の最も多い端で知らせる。
  // 走り出しを待つ運ぶ物は止め絵に映らず動きの途中だけ留まるので、止め絵に映らない部品は、出た後の最初の止め絵の段で知らせる
  const sideOut = (x0: number, y0: number, x1: number, y1: number): FrameSide | undefined => {
    const over: [FrameSide, number][] = [
      ["left", -x0],
      ["right", x1 - frame.w],
      ["top", -y0],
      ["bottom", y1 - frame.h],
    ];
    const [side, by] = over.reduce((a, b) => (b[1] > a[1] ? b : a));
    return by > TOUCH ? side : undefined;
  };
  const shownStep = (item: { shown: Shown[] }): number | undefined => {
    const seenAt = firstSeen(item);
    if (seenAt !== undefined) return seenAt;
    const starts = item.shown.filter(([a, b]) => b > a).map(([a]) => a);
    if (starts.length === 0 || stills.length === 0) return undefined;
    const at = stills.findIndex((t) => t >= Math.min(...starts));
    return at < 0 ? stills.length : at + 1;
  };
  for (const ink of inks) {
    const side = sideOut(ink.rect.x, ink.rect.y, ink.rect.x + ink.rect.w, ink.rect.y + ink.rect.h);
    if (side === undefined) continue;
    const part: LayoutPart =
      ink.badge === true ? { kind: "badge", step: Number(ink.text) } : (ink.part ?? { kind: "text", text: ink.text, ...(ink.box !== undefined ? { box: nameOf(ink.box) } : {}) });
    add("part-outside-frame", shownStep(ink), [part, { kind: "frame", side }]);
  }
  for (const trace of traces) {
    const xs = trace.points.map((p) => p[0]);
    const ys = trace.points.map((p) => p[1]);
    const side = sideOut(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys));
    const step = shownStep(trace);
    if (side === undefined || step === undefined) continue;
    add("part-outside-frame", step, [
      { kind: "line", from: nameOf(trace.from), to: nameOf(trace.to), step: edgeSteps.get(trace.points) ?? step },
      { kind: "frame", side },
    ]);
  }

  // 線の名前と流れた量の札。配管の図の札は段ごとに置き直すので、同じ札と線の組が続く段で離れている時は最初の段の 1 件にする
  const offLine = new Set<string>();
  for (const tag of (layout === undefined ? [] : tagsOf(layout)).sort((a, b) => a.step - b.step)) {
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

/**
 * 2本の線のどこかで、縦か横の区間どうしが間 `LINE_GAP` 未満で `LINE_ALONG` より長く並んで走るか。
 * 重なって走る (間が0の) 区間は `overlap` の時だけ数える。
 * 同じ線を別の段でもう一度引くと同じ道に重なるので、それは数えない
 */
function runAlong(a: Point[], b: Point[], overlap: boolean): boolean {
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
        if ((gap > 0 || overlap) && gap < LINE_GAP && along > LINE_ALONG) return true;
      }
    }
  return false;
}
