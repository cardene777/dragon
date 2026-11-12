/**
 * 札の描き方と、列の図の部品の描き方が共に使う下請け (#3239、#3351、#3348、#3624)。
 *
 * 札は席に居る間ごとに 1 つの部品で、ボードは左の色の棒と番号と名前を持つ角の丸い札、流れの線は角の丸い長円の札で描く。
 * 色付きの札は自分の色で塗って光らせ、色の無い札は居る帯の色の縁で描き、順番のある帯の色の無い札は縁を薄くする。
 * 帯を移った段だけ太い縁を、現れた段だけ「足した」の札か戻る印の丸を見せる。
 * 控えは印と名前だけの軽い行で、跡は点線の札に名前を薄く書き、外れた札の跡は「外れた」の札を持つ。
 * 席へ滑るか弾んで現れる動きと、席を離れる動きは、列の図を描く部品 (`render/lineup.ts`) が席の時刻から組んで渡す。
 * 列の図のブロック (列の並び、封、選ぶ、札、置き場、役、凡例、上限) の描き方は、ここの矩形と折った字と矢印の下請けを使う。
 * この file は列の図を描く部品だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import type { LineupGhost, LineupSeat, LineupText } from "../../kinds/lineup/layout";
import { hasWide } from "../../layout/measure";
import type { Point } from "../../layout/scene";
import type { ColorKey, Corner, TextStyle } from "../../look/values";
import { LINEUP_LOOK } from "../../look/lineup";
import { frameShape, partRadius } from "../../render/corner";
import { ALWAYS, type Shown } from "../../render/ink";
import { type Ctx, esc, r1, write } from "../../render/parts";
import { cs } from "../color/draw";

/** 角の丸い矩形。`extra` は class の後ろに足す属性 */
export const rect = (cls: string, r: { x: number; y: number; w: number; h: number }, rx: number, extra = ""): string =>
  `<rect class="${cls}" x="${r1(r.x)}" y="${r1(r.y)}" width="${r1(r.w)}" height="${r1(r.h)}" rx="${rx}"${extra}/>`;

/** 卓の札と置き場と役の箱とその光。角を落とす色味では右上と左下を落とす (#3344) */
export const lineupFrame = (corner: Corner, cls: string, r: { x: number; y: number; w: number; h: number }, rx: number, extra = ""): string =>
  frameShape(corner, ` class="${cls}"${extra}`, r, rect(cls, r, rx, extra));

/** 点を直線で結ぶ線 */
const pathOf = (points: Point[]): string => points.map(([x, y], k) => `${k === 0 ? "M" : "L"}${r1(x)} ${r1(y)}`).join("");

/** 矢じりの付いた線。終わりの点で、線の向きに `head` の長さの矢じりを付ける */
export function arrowPath(points: Point[], head: number): string {
  const end = points.at(-1) as Point;
  const before = points.at(-2) as Point;
  const len = Math.hypot(end[0] - before[0], end[1] - before[1]) || 1;
  const ux = (end[0] - before[0]) / len;
  const uy = (end[1] - before[1]) / len;
  const wing = (side: number): Point => [end[0] - ux * head - uy * head * side, end[1] - uy * head + ux * head * side];
  return `${pathOf(points)}${pathOf([wing(1), end, wing(-1)])}`;
}

/** 開いた V の矢じり。`p` から `q` への向きに、長さ `len` と開き `half` で `q` に置く */
export function headPath(p: Point, q: Point, len: number, half: number): string {
  const l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
  const dx = (q[0] - p[0]) / l;
  const dy = (q[1] - p[1]) / l;
  return pathOf([
    [q[0] - dx * len - dy * half, q[1] - dy * len + dx * half],
    q,
    [q[0] - dx * len + dy * half, q[1] - dy * len - dx * half],
  ]);
}

/** 角を半径 `r` で丸めた折れ線。曲がり目の前後の区間の半分より大きくは丸めない */
export function bendPath(points: Point[], r: number): string {
  const [first] = points;
  if (!first) return "";
  let d = `M${r1(first[0])} ${r1(first[1])}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [ax, ay] = points[i - 1] as Point;
    const [bx, by] = points[i] as Point;
    const [cx, cy] = points[i + 1] as Point;
    const l1 = Math.hypot(bx - ax, by - ay);
    const l2 = Math.hypot(cx - bx, cy - by);
    const rr = Math.min(r, l1 / 2, l2 / 2);
    if (rr < 0.5) {
      d += `L${r1(bx)} ${r1(by)}`;
      continue;
    }
    d += `L${r1(bx - ((bx - ax) / l1) * rr)} ${r1(by - ((by - ay) / l1) * rr)}Q${r1(bx)} ${r1(by)} ${r1(bx + ((cx - bx) / l2) * rr)} ${r1(by + ((cy - by) / l2) * rr)}`;
  }
  const last = points.at(-1) as Point;
  return `${d}L${r1(last[0])} ${r1(last[1])}`;
}

/** 戻る向きの印 (上へ伸びて左へ折れる矢印)。`(cx, cy)` を真ん中に、幅 `size` に収める */
export function backGlyph(cx: number, cy: number, size: number): string {
  const k = size / LINEUP_LOOK.board.label.glyph;
  const p = (dx: number, dy: number): string => `${r1(cx + dx * k)} ${r1(cy + dy * k)}`;
  return `<path class="dg-lb-glyph" d="M${p(4, 6)}L${p(4, 0.5)}Q${p(4, -3)} ${p(0.5, -3)}L${p(-4.5, -3)}M${p(-1.4, -6)}L${p(-4.5, -3)}L${p(-1.4, 0)}"/>`;
}

/** 折った字を 1 行ずつ描く。等幅の字で和文を含む行は、和文の字の class `wide` を足す */
export function lines(ctx: Ctx, cls: string, t: LineupText, style: TextStyle, shown: Shown[] = ALWAYS, wide = ""): string {
  return t.lines.map((l) => write(ctx.ink, wide !== "" && style.family === "mono" && hasWide(l.text) ? `${cls} ${wide}` : cls, l.x, l.baseline, l.text, style, shown)).join("");
}

/** 札と控えと跡の字の形。ボードと流れの線の、広い枠と狭い枠で違う */
export interface CardType {
  card: TextStyle;
  number: TextStyle;
  tag: TextStyle;
  trace: TextStyle;
}

/** 札 1 枚の描き方の材料。`step` は札が現れた段の間で、太い縁と印をその間だけ見せる。`kf` は席へ現れて離れる動き */
export interface CardParts {
  /** 札の色 (色の無い札は `undefined`) と、居る帯の色 */
  color: ColorKey | undefined;
  laneColor: ColorKey;
  /** 順番のある帯の札か。色の無い札は縁を薄くする */
  ordered: boolean;
  /** 流れの線の長円の札か */
  stations: boolean;
  /** 番号の丸の真ん中と半径、左の色の棒 (札の左と上からの位置と幅、流れの線は持たない) */
  numX: number;
  numR: number;
  bar?: { x: number; y: number; w: number };
  /** 字を見せる間 (封が隠す間を除く) */
  shown: Shown[];
  step: Shown;
  /** その間だけ見える動き */
  during: (ranges: Shown[]) => string;
  kf: string;
  type: CardType;
}

/** 札 `c` 1 枚。字は名前、番号、印の順に書き、札の中の最初の字を名前にする。`data-lineup-step` は札が席に着いた段 */
export function boardCard(c: LineupSeat, o: CardParts, ctx: Ctx): string {
  const B = LINEUP_LOOK.board;
  const color = o.color ?? o.laneColor;
  const strong = o.color !== undefined;
  const faint = !strong && o.ordered;
  const radius = o.stations ? c.h / 2 : partRadius(ctx.corner, B.card.radius);
  const cls = `${o.stations ? "dg-ls-card" : "dg-lb-card"}${strong ? " dg-lb-strong" : faint ? " dg-lb-faint" : ""}`;
  const frame = rect(cls, c, radius, ` data-lineup-chip-frame="" ${ctx.sh}`);
  const fill = strong || o.stations ? rect(o.stations ? (strong ? "dg-ls-fills" : "dg-ls-fill") : "dg-lb-fill", c, radius) : "";
  const bar = o.bar ? rect("dg-lb-bar", { x: c.x + o.bar.x, y: c.y + o.bar.y, w: o.bar.w, h: c.h - o.bar.y * 2 }, partRadius(ctx.corner, o.bar.w / 2)) : "";
  const label = lines(ctx, "dg-lb-t", c.label, o.type.card, o.shown);
  let number = "";
  if (c.number) {
    const filled = strong || o.stations;
    const circle = filled ? `<circle class="dg-lb-numbg" cx="${r1(c.x + o.numX)}" cy="${r1(c.y + c.h / 2)}" r="${o.numR}"/>` : "";
    const line = c.number.lines[0];
    number = `${circle}${line ? `<g data-lineup-number="">${write(ctx.ink, filled ? "dg-lb-num dg-lb-numon" : "dg-lb-num", line.x, line.baseline, line.text, o.type.number, o.shown)}</g>` : ""}`;
  }
  const step = o.during([o.step]);
  const moved = c.moved ? rect("dg-a dg-lb-moved", c, radius, ` data-lineup-moved="" style="${step}"`) : "";
  let tag = "";
  if (c.tag === "added" && c.tagBox && c.tagText) {
    tag = `<g class="dg-a" data-lineup-tag="added" style="${step}">${rect("dg-lb-tag", c.tagBox, partRadius(ctx.corner, c.tagBox.h / 2))}${lines(ctx, "dg-lb-tagt", c.tagText, o.type.tag, [o.step])}</g>`;
  } else if (c.tag === "back" && c.tagBox) {
    const r = c.tagBox.w / 2;
    const cx = c.tagBox.x + r;
    const cy = c.tagBox.y + r;
    tag = `<g class="dg-a" data-lineup-tag="back" style="${cs(B.return.color)};${step}"><circle class="dg-lb-tag" cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r)}"/>${backGlyph(cx, cy, B.label.glyph * (r / B.back.r))}</g>`;
  }
  const flags = `${strong ? ' data-lineup-glow=""' : ""}${faint ? ' data-lineup-faint=""' : ""}`;
  return `<g class="dg-popc dg-a" data-lineup-chip="${esc(c.id)}" data-lineup-on="${esc(c.lane)}" data-lineup-seat="${c.index}" data-lineup-step="${c.step}"${flags} style="${cs(color)};${o.kf}">${frame}${fill}${bar}${moved}${label}${number}${tag}</g>`;
}

/** 控えの行 `c`。札は次の帯へ移ったが、元の帯に記録として残る。印の丸と名前だけを描き、札の枠を持たない */
export function traceRow(c: LineupSeat, shown: Shown[], kf: string, type: CardType, ctx: Ctx): string {
  const T = LINEUP_LOOK.board.trace;
  const cx = c.x + T.x + T.r;
  const cy = c.y + c.h / 2;
  const mark = `<g data-lineup-trace-mark=""><circle class="dg-lb-trace" cx="${r1(cx)}" cy="${r1(cy)}" r="${T.r}"/><path class="dg-lb-trace" d="${pathOf([
    [cx - T.r * 0.45, cy],
    [cx - T.r * 0.13, cy + T.r * 0.32],
    [cx + T.r * 0.45, cy - T.r * 0.29],
  ])}"/></g>`;
  return `<g class="dg-a" data-lineup-chip="${esc(c.id)}" data-lineup-on="${esc(c.lane)}" data-lineup-seat="${c.index}" data-lineup-step="${c.step}" data-lineup-trace="" style="${kf}">${rect("dg-lb-hit", c, 0)}${mark}${lines(ctx, "dg-lb-tracet", c.label, type.trace, shown)}</g>`;
}

/** 跡 `g`。点線の札に名前を薄く書き、外れた札の跡は「外れた」の札を持つ。`vis` は跡を見せる動き */
export function ghostCard(g: LineupGhost, color: ColorKey, stations: boolean, shown: Shown[], vis: string, type: CardType, ctx: Ctx): string {
  const B = LINEUP_LOOK.board;
  const radius = stations ? g.h / 2 : partRadius(ctx.corner, B.card.radius);
  const tag = g.tagBox && g.tagText ? `${rect("dg-lb-tag", g.tagBox, partRadius(ctx.corner, g.tagBox.h / 2))}${lines(ctx, "dg-lb-tagt", g.tagText, type.tag, shown)}` : "";
  return `<g class="dg-a" data-lineup-ghost="${esc(g.id)}" data-lineup-ghost-on="${esc(g.lane)}" data-lineup-ghost-kind="${g.kind}" style="${cs(color)};${vis}">${rect("dg-lb-ghost", g, radius, ` stroke-dasharray="${B.ghostDash.join(" ")}"`)}${lines(ctx, "dg-lb-gt", g.label, type.card, shown)}${tag}</g>`;
}
