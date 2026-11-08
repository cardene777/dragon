/**
 * 足した箱のブロックの形を測る処理 (#3520)。
 *
 * 形の輪郭を折れ線の輪にし、箱の名前と下の字と絵柄の行 (絵柄と運ぶ物の置き場の枠) を形の内側に置ける箱の大きさと置き場所を求める。
 * 中身は行ごとの四角で測る。絵柄の行は細く、下の字の行は広いので、1 つの四角で測るよりひし形やアーチの細い所を使える。
 * 今の大きさの形に収まる箱は大きさを変えず、中身を真ん中から動かさずに収まれば中身も動かさない。
 * 収まらない箱は、幅と高さを広げた大きさのうち面積が最も小さい大きさにする。高さを先に広げないと、ひし形は横にだけ長くなるため。
 *
 * path の形は、形を囲む最も小さい四角を箱の枠いっぱいに伸ばす。100 四方の中の空きが箱の枠に残ると、
 * 線と段の番号が箱の枠の縁に付いて形から離れ、中身を置ける高さも空きの分だけ減るため (アーチの頂は 100 四方の上から 35 にある)。
 *
 * 定義を書いた図でしか要らないので最初に読む束に入れず、定義を読む処理 (`user-blocks-read.ts`) が後から読んで登録する。
 * 崩れの確かめ (`render/layout-check.ts`) も、ここで組む輪郭と描いた物を比べる。
 */
import { textWidth } from "../../layout/measure";
import { type BoxFit, type Point, type Rect, roomWidth, type SlotRoom } from "../../layout/scene";
import { LOOK, TYPE } from "../../look/values";
import { flattenPath } from "../../render/outline";
import { r1 } from "../../render/round";
import type { DiagramModel } from "../../schema";
import { type BoxShapes, type UserBlock, userBoxOf } from "../../user-blocks";
import { drawsIcon } from "../icon/draw";

/** 中身の行と形の縁の間に空ける最小の間 (px)。崩れの確かめが縁から 2px までの食い出しを許すので、その外に字が触れない間を取る */
const PAD = 4;
/** 箱を広げる上限の倍率。形が細すぎて収まらない箱は、この大きさまで広げても収まらなければ元の大きさのまま描く */
const GROW = 3;
/** 高さを広げる刻み (px) */
const STEP_H = 4;

/** 中身の 1 行。`top` と `bottom` は中身の真ん中からの上端と下端、`w` は行の幅で、行は中身の真ん中に横の真ん中を揃える */
interface Row {
  top: number;
  bottom: number;
  w: number;
}

/** 横の区間 */
type Span = [number, number];

/** path を折れ線にした輪。同じ path を何度も描くので覚えておく */
const flattened = new Map<string, Point[][]>();
function ringsOf(path: string): Point[][] {
  let rings = flattened.get(path);
  if (!rings) {
    rings = flattenPath(path);
    if (flattened.size > 200) flattened.clear();
    flattened.set(path, rings);
  }
  return rings;
}

/**
 * path の形を枠 `rect` に収める移す量と伸ばす割合。形を囲む最も小さい四角を枠いっぱいに伸ばす。
 * 幅か高さを持たない形は、その向きを今までどおり 100 四方から伸ばす
 */
function pathFit(path: string, { x, y, w, h }: Rect): { tx: number; ty: number; sx: number; sy: number } {
  const points = ringsOf(path).flat();
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const [x0, x1, y0, y1] = points.length > 0 ? [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)] : [0, 100, 0, 100];
  const [left, width] = x1 > x0 ? [x0, x1 - x0] : [0, 100];
  const [top, height] = y1 > y0 ? [y0, y1 - y0] : [0, 100];
  const sx = r1(w / width);
  const sy = r1(h / height);
  return { tx: r1(x - left * sx), ty: r1(y - top * sy), sx, sy };
}

/**
 * 使う人が足した箱のブロックの形 (#3399)。箱の枠 `rect` に収め、地と縁と光は今の箱と同じ class で描く。
 * path は形を囲む最も小さい四角を枠の大きさへ伸ばし (#3520)、縁の太さは伸ばさない。形を持たない定義は `undefined` で、呼ぶ側が今の箱の形で描く
 */
function draw(added: UserBlock, cls: string, extra: string, rect: Rect): string | undefined {
  const { x, y, w, h } = rect;
  const attrs = ` class="${cls}"${extra}`;
  const points = (list: Point[]): string => `<polygon${attrs} points="${list.map(([px, py]) => `${r1(px)},${r1(py)}`).join(" ")}"/>`;
  if (added.path !== undefined) {
    const { tx, ty, sx, sy } = pathFit(added.path, rect);
    return `<path${attrs} d="${added.path}" transform="translate(${tx} ${ty}) scale(${sx} ${sy})" vector-effect="non-scaling-stroke"/>`;
  }
  switch (added.shape) {
    case "round":
      return `<rect${attrs} x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${r1(h / 2)}"/>`;
    case "circle":
      return `<ellipse${attrs} cx="${r1(x + w / 2)}" cy="${r1(y + h / 2)}" rx="${r1(w / 2)}" ry="${r1(h / 2)}"/>`;
    case "cylinder": {
      const ry = cylinderCap(h);
      return `<path${attrs} d="${cylinderBody(x, y, w, h)} M ${r1(x)} ${r1(y + ry)} A ${r1(w / 2)} ${r1(ry)} 0 0 0 ${r1(x + w)} ${r1(y + ry)}"/>`;
    }
    case "diamond":
      return points(diamondPoints(x, y, w, h));
    case "hexagon":
      return points(hexagonPoints(x, y, w, h));
    default:
      return undefined;
  }
}

/** 円柱の上と下の楕円の縦の半径 */
const cylinderCap = (h: number): number => Math.min(h / 6, 10);
/** 円柱の外形。上の楕円の上半分、右の縁、下の楕円の下半分、左の縁を回る。上の楕円の下半分は外形に入らない */
function cylinderBody(x: number, y: number, w: number, h: number): string {
  const ry = cylinderCap(h);
  const rx = w / 2;
  return `M ${r1(x)} ${r1(y + ry)} A ${r1(rx)} ${r1(ry)} 0 0 1 ${r1(x + w)} ${r1(y + ry)} V ${r1(y + h - ry)} A ${r1(rx)} ${r1(ry)} 0 0 1 ${r1(x)} ${r1(y + h - ry)} Z`;
}
const diamondPoints = (x: number, y: number, w: number, h: number): Point[] => [
  [x + w / 2, y],
  [x + w, y + h / 2],
  [x + w / 2, y + h],
  [x, y + h / 2],
];
function hexagonPoints(x: number, y: number, w: number, h: number): Point[] {
  const k = Math.min(h / 2, w / 4);
  return [
    [x + k, y],
    [x + w - k, y],
    [x + w, y + h / 2],
    [x + w - k, y + h],
    [x + k, y + h],
    [x, y + h / 2],
  ];
}

/** 枠 `rect` に描いた形の輪郭。描く形 (`draw`) と同じ寸法から作る。形を持たない定義は `undefined` */
function outline(added: UserBlock, rect: Rect): Point[][] | undefined {
  const { x, y, w, h } = rect;
  if (added.path !== undefined) {
    const { tx, ty, sx, sy } = pathFit(added.path, rect);
    return ringsOf(added.path).map((ring) => ring.map(([px, py]): Point => [tx + px * sx, ty + py * sy]));
  }
  switch (added.shape) {
    case "round": {
      // SVG の rect は縦の半径を書かないと横の半径と同じにし、横は幅の半分まで、縦は高さの半分までに詰める
      const rx = Math.min(h / 2, w / 2);
      const ry = h / 2;
      return flattenPath(
        `M ${x + rx} ${y} H ${x + w - rx} A ${rx} ${ry} 0 0 1 ${x + w} ${y + ry} V ${y + h - ry} A ${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h} H ${x + rx} A ${rx} ${ry} 0 0 1 ${x} ${y + h - ry} V ${y + ry} A ${rx} ${ry} 0 0 1 ${x + rx} ${y} Z`,
      );
    }
    case "circle":
      return flattenPath(`M ${x} ${y + h / 2} A ${w / 2} ${h / 2} 0 1 1 ${x + w} ${y + h / 2} A ${w / 2} ${h / 2} 0 1 1 ${x} ${y + h / 2} Z`);
    case "cylinder":
      return flattenPath(cylinderBody(x, y, w, h));
    case "diamond":
      return [diamondPoints(x, y, w, h)];
    case "hexagon":
      return [hexagonPoints(x, y, w, h)];
    default:
      return undefined;
  }
}

/**
 * 中身を置ける所の輪郭。円柱は上の楕円の手前の縁の線より下で、ほかの形は見えている形の輪郭と同じ。
 * 円柱の上の楕円の下半分は外形に入らないが縁の線を描くので、そこに掛かる絵柄と枠を線が横切るため
 */
function room(added: UserBlock, rect: Rect): Point[][] | undefined {
  if (added.shape !== "cylinder") return outline(added, rect);
  const { x, y, w, h } = rect;
  const ry = Math.min(h / 6, 10);
  return flattenPath(`M ${x} ${y + ry} A ${w / 2} ${ry} 0 0 0 ${x + w} ${y + ry} V ${y + h - ry} A ${w / 2} ${ry} 0 0 1 ${x} ${y + h - ry} Z`);
}

/** 枠 `rect` に描いた形の縁で、枠の左上の角に一番近い点 */
function corner(added: UserBlock, rect: Rect): Point | undefined {
  const rings = outline(added, rect);
  if (!rings) return undefined;
  const [px, py] = [rect.x, rect.y];
  let best: Point | undefined;
  let far = Number.POSITIVE_INFINITY;
  for (const ring of rings)
    ring.forEach((a, k) => {
      const b = ring[(k + 1) % ring.length] as Point;
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const len = dx * dx + dy * dy;
      const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / len));
      const at: Point = [a[0] + t * dx, a[1] + t * dy];
      const d = Math.hypot(at[0] - px, at[1] - py);
      if (d < far) {
        far = d;
        best = [r1(at[0]), r1(at[1])];
      }
    });
  return best;
}

/** 高さ `y` の横の線が形の内を通る区間。形の内外は SVG の塗りの既定 (nonzero) と同じ決まりで決める */
function spansAt(rings: Point[][], y: number): Span[] {
  const cuts: [number, number][] = [];
  for (const ring of rings)
    ring.forEach(([ax, ay], k) => {
      const [bx, by] = ring[(k + 1) % ring.length] as Point;
      if (ay <= y === by <= y) return;
      cuts.push([ax + ((y - ay) / (by - ay)) * (bx - ax), by > ay ? 1 : -1]);
    });
  cuts.sort((a, b) => a[0] - b[0]);
  const out: Span[] = [];
  let winding = 0;
  let start = 0;
  for (const [x, turn] of cuts) {
    const was = winding;
    winding += turn;
    if (was === 0 && winding !== 0) start = x;
    else if (was !== 0 && winding === 0) out.push([start, x]);
  }
  return out;
}

/** 2 つの区間の並びの重なり */
function overlap(a: Span[], b: Span[]): Span[] {
  const out: Span[] = [];
  for (const [a0, a1] of a)
    for (const [b0, b1] of b) {
      const l = Math.max(a0, b0);
      const r = Math.min(a1, b1);
      if (l <= r) out.push([l, r]);
    }
  return out;
}

/** 区間の並び `spans` から区間 `[a, b]` を除いた並び */
function cut(spans: Span[], [a, b]: Span): Span[] {
  return spans.flatMap(([l, r]): Span[] => [...(l < a ? [[l, Math.min(r, a)] as Span] : []), ...(r > b ? [[Math.max(l, b), r] as Span] : [])]);
}

/**
 * 幅 `w`、高さ `h` の形の内で、中身の行 `rows` を全て縁から `PAD` 離して置ける中身の真ん中。
 * 線の無い段の番号を付ける形の縁の点 (`corner`) の丸にも、行を掛けない。番号が名前や絵柄に重なるため。
 * 縦は `prefer` の高さに近い所から 1px ずつ探し、横は置ける範囲で `prefer` に一番近い所にする。置けなければ `undefined`
 */
function place(added: UserBlock, rows: Row[], w: number, h: number, prefer: Point): Point | undefined {
  const rings = room(added, { x: 0, y: 0, w, h });
  const badge = corner(added, { x: 0, y: 0, w, h });
  if (!rings || !badge) return undefined;
  const r = LOOK.badge.r;
  const spans: Span[][] = [];
  for (let y = 0; y <= Math.ceil(h); y++) spans.push(spansAt(rings, y));
  const top = Math.min(...rows.map((r) => r.top)) - PAD;
  const bottom = Math.max(...rows.map((r) => r.bottom)) + PAD;
  const tries: number[] = [];
  for (let k = 0; prefer[1] - k + top >= 0 || prefer[1] + k + bottom <= h; k++) {
    for (const y of k === 0 ? [prefer[1]] : [prefer[1] - k, prefer[1] + k]) if (y + top >= 0 && y + bottom <= h) tries.push(y);
  }
  for (const y of tries) {
    let free: Span[] = [[Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY]];
    for (const row of rows) {
      let inside: Span[] = [[Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY]];
      for (let k = Math.floor(y + row.top - PAD); k <= Math.ceil(y + row.bottom + PAD) && inside.length > 0; k++) inside = overlap(inside, spans[k] ?? []);
      const half = row.w / 2 + PAD;
      free = overlap(
        free,
        inside.flatMap(([l, right]): Span[] => (l + half <= right - half ? [[l + half, right - half]] : [])),
      );
      // 番号の丸の四角と縦に重なる行は、丸の四角と横にも重なる真ん中を除く
      if (y + row.bottom + PAD > badge[1] - r && y + row.top - PAD < badge[1] + r) free = cut(free, [badge[0] - r - half, badge[0] + r + half]);
      if (free.length === 0) break;
    }
    if (free.length === 0) continue;
    const x = free.map(([l, r]) => Math.max(l, Math.min(r, prefer[0]))).reduce((a, b) => (Math.abs(a - prefer[0]) <= Math.abs(b - prefer[0]) ? a : b));
    return [x, y];
  }
  return undefined;
}

/**
 * 名札 `id` の箱の中身の行。絵柄の行 (絵柄と置き場の枠)、名前、下の字の順で、縦の位置は描く処理と同じ値で測る。
 * 名前と下の字の高さは、絵柄の行を持つ箱が図に 1 つでも在るかで決まる (`boxTextY`)
 */
function rowsOf(diagram: DiagramModel, id: string, withActions: boolean, rooms?: Map<string, SlotRoom>): Row[] {
  const B = LOOK.box;
  const S = LOOK.slot;
  const box = diagram.boxes.find((b) => b.id === id);
  if (!box) return [];
  // 下の字の行の幅は、下の小さな字と書き換わる字と中で出す処理のうち最も広い字の幅 (`boxWidth` と同じ字を測る)
  const subs = [textWidth(box.sub ?? "", TYPE.boxSub)];
  for (const step of diagram.steps)
    for (const event of step.events) {
      if (event.type === "swap" && event.box === id) subs.push(textWidth(event.text, TYPE.boxSubStrong));
      if (withActions && event.type === "action" && event.box === id) subs.push(textWidth(event.label, TYPE.boxSubStrong));
    }
  const sub = Math.max(...subs);
  const iconRow = diagram.boxes.some((b) => drawsIcon(b.icon) || rooms?.has(b.id) === true);
  const room = rooms?.get(id);
  const rows: Row[] = [];
  // 置き場の枠を持つ箱は、絵柄が描けない名前でも絵柄の幅を空けて枠を並べる (`placeSlot`)
  if (room) rows.push({ top: B.iconY - S.h / 2, bottom: B.iconY + S.h / 2, w: (box.icon ? B.icon + S.gap : 0) + roomWidth(room) + S.pad * 2 });
  else if (drawsIcon(box.icon)) rows.push({ top: B.iconY - B.icon / 2, bottom: B.iconY + B.icon / 2, w: B.icon });
  // 字の四角は基準線から上に字の大きさの 8 割、下に 2 割 (`textBox`)
  const text = (base: number, size: number, w: number): Row => ({ top: base - size * 0.8, bottom: base + size * 0.2, w });
  rows.push(text(iconRow ? B.nameY : B.nameMid, TYPE.boxName.size, textWidth(box.name, TYPE.boxName)));
  if (sub > 0) rows.push(text(iconRow ? B.subY : B.subMid, TYPE.boxSub.size, sub));
  return rows;
}

/** 測った大きさ。同じ形と同じ中身の箱は、並べ直すたびに同じ大きさになるので覚えておく */
const measured = new Map<string, BoxFit>();

/**
 * 名札 `id` の箱の中身が形の内に収まる箱の大きさ。幅 `w`、高さ `h` の形に収まれば大きさを変えず、
 * 中身を箱の真ん中から動かして収まる時だけ `at` を持つ。広げても収まらない形は `w` と `h` のまま返す
 */
function fit(added: UserBlock, diagram: DiagramModel, id: string, w: number, h: number, withActions: boolean, rooms?: Map<string, SlotRoom>): BoxFit | undefined {
  if (added.path === undefined && added.shape === undefined) return undefined;
  const rows = rowsOf(diagram, id, withActions, rooms);
  if (rows.length === 0) return { w, h };
  const key = JSON.stringify([added.path ?? added.shape, rows, w, h]);
  const known = measured.get(key);
  if (known) return known;
  const found = search(added, rows, w, h);
  if (measured.size > 500) measured.clear();
  measured.set(key, found);
  return found;
}

/** 中身の行 `rows` が収まる、幅 `w0` と高さ `h0` 以上で面積の最も小さい大きさと、中身の真ん中 */
function search(added: UserBlock, rows: Row[], w0: number, h0: number): BoxFit {
  const centered = (w: number, h: number): Point => [w / 2, h / 2];
  const result = (w: number, h: number, at: Point): BoxFit => {
    const [cx, cy] = centered(w, h);
    return Math.abs(at[0] - cx) < 0.01 && Math.abs(at[1] - cy) < 0.01 ? { w, h } : { w, h, at: [r1(at[0]), r1(at[1])] };
  };
  const here = place(added, rows, w0, h0, centered(w0, h0));
  if (here) return result(w0, h0, here);
  const wMax = w0 * GROW;
  let best: { w: number; h: number } | undefined;
  for (let h = h0; h <= h0 * GROW; h += STEP_H) {
    // 高さを広げるほど面積の下限 (幅 w0 の時) が増える。今の最も小さい面積を超えたら、それより高い大きさは要らない
    if (best && h * w0 >= best.w * best.h) break;
    if (!place(added, rows, wMax, h, centered(wMax, h))) continue;
    let lo = w0;
    let hi = wMax;
    while (hi - lo > 1) {
      const mid = (lo + hi) / 2;
      if (place(added, rows, mid, h, centered(mid, h))) hi = mid;
      else lo = mid;
    }
    const w = Math.ceil(hi);
    if (!best || w * h < best.w * best.h) best = { w, h };
  }
  if (!best) return { w: w0, h: h0 };
  const at = place(added, rows, best.w, best.h, centered(best.w, best.h));
  return at ? result(best.w, best.h, at) : { w: w0, h: h0 };
}

/** 名札 `id` の箱が足した箱の時だけ、その定義で `run` を呼ぶ */
const on = <R>(id: string, run: (added: UserBlock) => R | undefined): R | undefined => {
  const added = userBoxOf(id);
  return added ? run(added) : undefined;
};

/** 定義を読む処理と一緒に登録する、形を測る処理 */
export const BOX_SHAPES: BoxShapes = {
  draw: (id, cls, extra, rect) => on(id, (added) => draw(added, cls, extra, rect)),
  outline: (id, rect) => on(id, (added) => outline(added, rect)),
  fit: (diagram, id, w, withActions, rooms) => on(id, (added) => fit(added, diagram, id, w, LOOK.box.h, withActions, rooms)),
  corner: (id, rect) => on(id, (added) => corner(added, rect)),
};
