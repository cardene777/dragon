/**
 * 配管の図の崩れ (#3523)。描く処理が記録した配管の部品 (`PipePiece`) から、段ごとの止め絵で見えている物どうしの崩れを数える。
 *
 * 7 種を拾う。
 * 返した値の札が弁か計器か箱に重なる (`chip-over-part`)、呼び出しの管が箱の縁の角の丸みにかかるか箱の中を通る (`pipe-behind-box`)、
 * 2 本の呼び出しの管が重なって通る (`pipes-merged`)、弁の胴がほかの呼び出しの管の縁に近すぎる (`valve-near-pipe`)。
 * 箱と槽が重なる (`parts-overlap`)、値の管が字の上を通る (`line-over-text`)、横幅いっぱいに何も描かない帯が高さ 200px 以上空く (`empty-band`) (#3721)。
 * 箱の中の字は箱が後ろの管を隠すので、値の管が通っても数えない。
 * 同じ者から出て同じ線を同じ向きに通る管は、分かれる所まで 1 本の本管として描くので、重なりに数えない。
 * 札と部品と管は、どれも揃って見える最初の段か、管が呼び出しを運び始める段の遅い方で知らせる。
 */
import type { Point, Rect } from "../layout/scene";
import type { LayoutBreak, LayoutPart, PipePiece } from "./breaks";
import { type Ink, visible } from "./ink";

/** 縁が触れているだけの重なり (px) は数えない */
const DEPTH = 0.5;
/** 角の丸みの縁が管の太さの縁から引っ込んでよい長さ (px)。これより引っ込むと、管の端が箱の縁の後ろへ消えて見える */
const TOUCH = 2;
/** 弁の胴とほかの管の縁の間の下限。平行な管の縁どうしの間と同じ (`kinds/pipe/layout.ts` の `LINE_GAP`) */
const VALVE_GAP = 10;
/** 横幅いっぱいに何も描かない帯を崩れに数える高さの下限 (px、#3721) */
export const EMPTY_BAND = 200;

type Piece<K extends PipePiece["kind"]> = Extract<PipePiece, { kind: K }>;
type Segment = [Point, Point];

const segmentsOf = (points: Point[]): Segment[] => points.slice(1).map((p, k) => [points[k] as Point, p]);
const flat = ([u, v]: Segment): boolean => Math.abs(u[1] - v[1]) < DEPTH;
/** 2 つの四角が縁の触れ合いより深く重なるか */
const overlap = (a: Rect, b: Rect): boolean =>
  Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > DEPTH && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > DEPTH;
/** 2 つの四角の縁の間。重なる時は負 */
const gapOf = (a: Rect, b: Rect): number => Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w), b.y - (a.y + a.h), a.y - (b.y + b.h));

/** 四角 `a` が、角を `radius` で丸めた四角 `b` に縁の触れ合いより深く重なるか。丸の名札は角の丸みが高さの半分の四角 */
function overlapRounded(a: Rect, b: Rect, radius: number): boolean {
  const k = Math.min(radius, b.w / 2, b.h / 2);
  if (overlap(a, { x: b.x, y: b.y + k, w: b.w, h: b.h - 2 * k }) || overlap(a, { x: b.x + k, y: b.y, w: b.w - 2 * k, h: b.h })) return true;
  const centers: Point[] = [
    [b.x + k, b.y + k],
    [b.x + b.w - k, b.y + k],
    [b.x + k, b.y + b.h - k],
    [b.x + b.w - k, b.y + b.h - k],
  ];
  return centers.some(([cx, cy]) => Math.hypot(Math.max(a.x - cx, 0, cx - (a.x + a.w)), Math.max(a.y - cy, 0, cy - (a.y + a.h))) < k - DEPTH);
}

/** 管の線分の太さの四角。`ends` を立てると線分の両端の先にも太さの半分だけ広げる */
function caseOf([u, v]: Segment, half: number, ends: boolean): Rect {
  const along = ends ? half : 0;
  return flat([u, v])
    ? { x: Math.min(u[0], v[0]) - along, y: u[1] - half, w: Math.abs(v[0] - u[0]) + along * 2, h: half * 2 }
    : { x: u[0] - half, y: Math.min(u[1], v[1]) - along, w: half * 2, h: Math.abs(v[1] - u[1]) + along * 2 };
}

/**
 * 管の端が箱の縁に在る時、管の太さの縁の所で角の丸みの縁が引っ込む長さ。端が縁に無い時は 0。
 * 管の太さの縁が角の丸みにかかると、管の端の片側が箱の縁の後ろへ消えて見える
 */
function cornerInset(end: Point, box: Piece<"box">, half: number): number {
  const { x, y, w, h } = box.rect;
  const k = Math.min(box.corner, w / 2, h / 2);
  const onSide = (Math.abs(end[0] - x) < DEPTH || Math.abs(end[0] - (x + w)) < DEPTH) && end[1] > y - DEPTH && end[1] < y + h + DEPTH;
  const onTop = (Math.abs(end[1] - y) < DEPTH || Math.abs(end[1] - (y + h)) < DEPTH) && end[0] > x - DEPTH && end[0] < x + w + DEPTH;
  if (!onSide && !onTop) return 0;
  // 管の太さの縁から、縁の近い方の端までの長さ
  const room = (onSide ? Math.min(end[1] - y, y + h - end[1]) : Math.min(end[0] - x, x + w - end[0])) - half;
  if (room >= k) return 0;
  if (room <= 0) return k;
  return k - Math.sqrt(k * k - (k - room) * (k - room));
}

/** 部品を崩れの知らせで呼ぶ形にする */
function partOf(piece: PipePiece): LayoutPart {
  switch (piece.kind) {
    case "box":
      return { kind: "box", name: piece.name };
    case "tank":
      return { kind: "tank", name: piece.name };
    case "line":
      return { kind: "flow", name: piece.name };
    case "chip":
    case "card":
      return { kind: "text", text: piece.text };
    case "pipe":
      return { kind: "pipe", from: piece.from, to: piece.to, step: piece.step };
    case "valve":
      return piece.to === undefined ? { kind: "valve", from: piece.from } : { kind: "valve", from: piece.from, to: piece.to };
    case "gauge":
      return { kind: "gauge", box: piece.box };
  }
}

/** 部品が描く所の上下の端。管は点の並びに太さの半分を足す */
function spanOf(piece: PipePiece): [number, number][] {
  switch (piece.kind) {
    case "box":
    case "tank":
    case "chip":
    case "card":
      return [[piece.rect.y, piece.rect.y + piece.rect.h]];
    case "pipe":
    case "line": {
      const ys = piece.points.map((p) => p[1]);
      return ys.length > 0 ? [[Math.min(...ys) - piece.half, Math.max(...ys) + piece.half]] : [];
    }
    case "valve":
      return [piece.body, ...piece.lever].map((r): [number, number] => [r.y, r.y + r.h]);
    case "gauge":
      return piece.rects.map((r): [number, number] => [r.y, r.y + r.h]);
  }
}

/**
 * 配管の図の部品 `pieces` の崩れ。`stills` は段ごとの止め絵の時刻。
 * `inks` (描いた字) と `frame` (図の枠) を渡した時だけ、字の上を通る値の管と空き帯を数える。
 * `areas` は部品に記録しない描いた物 (囲いの枠や札) の四角で、空き帯を数える時だけ重ねる
 */
export function pipeBreaks(
  pieces: PipePiece[],
  stills: number[],
  inks: Ink[] = [],
  frame?: { w: number; h: number },
  areas: readonly { rect: Rect; part: LayoutPart }[] = [],
): LayoutBreak[] {
  const of = <K extends PipePiece["kind"]>(kind: K): Piece<K>[] => pieces.filter((p): p is Piece<K> => p.kind === kind);
  const boxes = of("box");
  const pipes = of("pipe");
  const valves = of("valve");
  const gauges = of("gauge");
  const chips = of("chip");
  const cards = of("card");
  const tanks = of("tank");
  const lines = of("line");
  /** `items` が揃って見える最初の段 (1 から数える)。揃って見えなければ `undefined` */
  const firstSeen = (...items: PipePiece[]): number | undefined => {
    const at = stills.findIndex((t) => items.every((item) => visible(item, t)));
    return at < 0 ? undefined : at + 1;
  };
  /** 揃って見える最初の段と、管と弁が呼び出しを運び始める段の遅い方 */
  const stepOf = (...items: PipePiece[]): number | undefined => {
    const seen = firstSeen(...items);
    return seen === undefined ? undefined : Math.max(seen, ...items.map((item) => (item.kind === "pipe" || item.kind === "valve" ? (item.step ?? 1) : 1)));
  };
  const out: LayoutBreak[] = [];
  const add = (kind: LayoutBreak["kind"], step: number | undefined, parts: [LayoutPart, LayoutPart]): void => {
    if (step !== undefined) out.push({ kind, step, parts });
  };

  // 返した値の札が、弁の胴か取っ手、計器、箱に重なる
  for (const chip of chips)
    for (const part of [...valves, ...gauges, ...boxes]) {
      const hit =
        part.kind === "box"
          ? overlapRounded(chip.rect, part.rect, part.corner)
          : (part.kind === "valve" ? [part.body, ...part.lever] : part.rects).some((r) => overlap(chip.rect, r));
      if (hit) add("chip-over-part", stepOf(chip, part), [{ kind: "text", text: chip.text }, partOf(part)]);
    }

  // 字を記録しない札 (線の札、ログの札、呼び出しの札) が、箱か槽か計器かトークンの箱の弁か返した値の札か、ほかの札に重なる (#3854)。
  // 呼び出しの管の弁は描かないので比べない
  cards.forEach((card, i) => {
    const others: PipePiece[] = [...boxes, ...tanks, ...gauges, ...valves.filter((v) => v.to === undefined), ...chips, ...cards.slice(i + 1)];
    for (const part of others) {
      const hit =
        part.kind === "box"
          ? overlapRounded(card.rect, part.rect, part.corner)
          : part.kind === "valve"
            ? [part.body, ...part.lever].some((r) => overlap(card.rect, r))
            : part.kind === "gauge"
              ? part.rects.some((r) => overlap(card.rect, r))
              : part.kind === "tank" || part.kind === "chip" || part.kind === "card"
                ? overlap(card.rect, part.rect)
                : false;
      if (hit) add("chip-over-part", stepOf(card, part), [partOf(card), partOf(part)]);
    }
  });

  // 管の端が箱の縁の角の丸みにかかるか、管の太さが箱の中を通る。丸の名札は角の丸みが高さの半分なので、真ん中から出入りする管だけが収まる
  for (const pipe of pipes)
    for (const box of boxes) {
      const ends = [pipe.points[0], pipe.points[pipe.points.length - 1]].filter((p): p is Point => p !== undefined);
      const behind =
        ends.some((end) => cornerInset(end, box, pipe.half) > TOUCH) ||
        segmentsOf(pipe.points).some((s) => overlapRounded(caseOf(s, pipe.half, false), box.rect, box.corner));
      if (behind) add("pipe-behind-box", stepOf(pipe, box), [partOf(pipe), partOf(box)]);
    }

  // 2 本の管が、平行に走る所で太さを重ねる。同じ者から同じ線を同じ向きに通る本管は数えない
  pipes.forEach((a, i) => {
    for (const b of pipes.slice(i + 1)) {
      const merged = segmentsOf(a.points).some((sa) =>
        segmentsOf(b.points).some((sb) => {
          if (flat(sa) !== flat(sb)) return false;
          // 横の線分は高さ (k = 1) で並びを比べ、横の位置 (o = 0) で共に走る長さを測る。縦の線分は逆
          const [k, o]: [0 | 1, 0 | 1] = flat(sa) ? [1, 0] : [0, 1];
          const offset = Math.abs(sa[0][k] - sb[0][k]);
          const along = Math.min(Math.max(sa[0][o], sa[1][o]), Math.max(sb[0][o], sb[1][o])) - Math.max(Math.min(sa[0][o], sa[1][o]), Math.min(sb[0][o], sb[1][o]));
          if (offset >= a.half + b.half - DEPTH || along <= DEPTH) return false;
          const same = Math.sign(sa[1][o] - sa[0][o]) === Math.sign(sb[1][o] - sb[0][o]);
          return !(a.from === b.from && same && offset < DEPTH);
        }),
      );
      if (!merged) continue;
      const [first, second] = a.step <= b.step ? [a, b] : [b, a];
      add("pipes-merged", stepOf(a, b), [partOf(first), partOf(second)]);
    }
  });

  // 箱と槽が、縁の触れ合いより深く重なる
  const solids = [...boxes, ...tanks];
  solids.forEach((a, i) => {
    for (const b of solids.slice(i + 1)) {
      const hit = a.kind === "box" ? overlapRounded(b.rect, a.rect, a.corner) : b.kind === "box" ? overlapRounded(a.rect, b.rect, b.corner) : overlap(a.rect, b.rect);
      if (hit) add("parts-overlap", stepOf(a, b), [partOf(a), partOf(b)]);
    }
  });

  // 値の管の太さが、同じ止め絵に見えている字に重なる。箱の中の字は箱が管を隠すので数えない
  const inside = (r: Rect, o: Rect): boolean => r.x >= o.x - DEPTH && r.y >= o.y - DEPTH && r.x + r.w <= o.x + o.w + DEPTH && r.y + r.h <= o.y + o.h + DEPTH;
  for (const line of lines)
    for (const ink of inks) {
      if (ink.text.trim() === "" || boxes.some((b) => inside(ink.rect, b.rect))) continue;
      if (!segmentsOf(line.points).some((s) => overlap(caseOf(s, line.half, false), ink.rect))) continue;
      const at = stills.findIndex((t) => visible(line, t) && visible(ink, t));
      if (at >= 0) add("line-over-text", at + 1, [partOf(line), { kind: "text", text: ink.text }]);
    }

  // 横幅いっぱいに何も描かない帯。描く部品と字の上下の端を重ね、図の上端から下端まで `EMPTY_BAND` 以上空いた所を探す
  if (frame) {
    const spans: { lo: number; hi: number; part: LayoutPart }[] = [
      ...pieces.flatMap((p) => spanOf(p).map(([lo, hi]) => ({ lo, hi, part: partOf(p) }))),
      ...inks.filter((ink) => ink.text.trim() !== "").map((ink) => ({ lo: ink.rect.y, hi: ink.rect.y + ink.rect.h, part: { kind: "text" as const, text: ink.text } })),
      ...areas.map((a) => ({ lo: a.rect.y, hi: a.rect.y + a.rect.h, part: a.part })),
    ].sort((a, b) => a.lo - b.lo);
    let reach = 0;
    let above: LayoutPart = { kind: "frame", side: "top" };
    for (const s of spans) {
      if (s.lo - reach >= EMPTY_BAND) add("empty-band", 1, [above, s.part]);
      if (s.hi > reach) {
        reach = s.hi;
        above = s.part;
      }
    }
    if (spans.length > 0 && frame.h - reach >= EMPTY_BAND) add("empty-band", 1, [above, { kind: "frame", side: "bottom" }]);
  }

  // 呼び出しの管の弁の胴が、ほかの呼び出しの管の縁から `VALVE_GAP` 離れない。
  // 同じ者の管が弁の所で弁の管と同じ線を通る所 (本管) は、弁が載る管と同じ線なので測らない
  for (const valve of valves) {
    if (valve.to === undefined) continue;
    const { body } = valve;
    const cx = body.x + body.w / 2;
    const cy = body.y + body.h / 2;
    const upright = body.h > body.w;
    const onValve = (s: Segment): boolean =>
      upright
        ? !flat(s) && Math.abs(s[0][0] - cx) < DEPTH && Math.min(s[0][1], s[1][1]) <= cy && cy <= Math.max(s[0][1], s[1][1])
        : flat(s) && Math.abs(s[0][1] - cy) < DEPTH && Math.min(s[0][0], s[1][0]) <= cx && cx <= Math.max(s[0][0], s[1][0]);
    for (const pipe of pipes) {
      if (pipe.from === valve.from && pipe.to === valve.to) continue;
      const near = segmentsOf(pipe.points).some((s) => !(pipe.from === valve.from && onValve(s)) && gapOf(body, caseOf(s, pipe.half, true)) < VALVE_GAP - 0.01);
      if (near) add("valve-near-pipe", stepOf(valve, pipe), [partOf(valve), partOf(pipe)]);
    }
  }
  return out;
}
