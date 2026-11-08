/**
 * 段の番号、状態遷移図の済んだ印と、線の道の形を SVG に描く部品。見本帳の `engine.js` の部品を写す。
 *
 * どの部品も、置き場所は場面 (`layout/scene.ts`) から、いつ見えるかは時刻の表 (`timeline.ts`) から読む。
 * 色は色の役の変数 (`--c` と `--ct`) だけを渡し、値は色味の表が持つ。
 * ブロックの置き場へ移した部品の描き方は `blocks/<名前>/draw.ts` が持ち、この file の下請け (`esc`、`cs`、`r1`、`write` など) を読む (#3345)。
 * 状態遷移図の始まりと終わりの印と、通らない道と脇道の囲みと薄い箱は、始まりと終わりのブロックと脇道のブロックが描く (#3347)。
 * 色の役の変数と箱と区画の絵柄は逆向きで、この file が色の役と絵のブロックの描き方 (`blocks/color/draw.ts`、`blocks/icon/draw.ts`) を読む。
 */
import type { BoxTextY } from "../blocks/box/draw";
import type { Seat } from "../blocks/carry/timing";
import { cs } from "../blocks/color/draw";
import { glyph } from "../blocks/icon/draw";
import { textBox } from "../layout/measure";
import { type Point, type SceneBadge, type SceneBox } from "../layout/scene";
import { type Corner, EASE, LOOK, MOTION, type TextStyle } from "../look/values";
import type { Span, Timeline } from "../timeline";
import { r1 } from "./round";
import { ALWAYS, type Ink, type Shown, type Trace } from "./ink";
import type { Frame, Motion } from "./motion";

export const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/** 座標を小数 2 桁に丸める。角の形 (`corner.ts`) も読むため、置き場は `round.ts` が持つ */
export { r1 };

/**
 * 点を辿る線。曲がる所は共通の値の表の半径 (`LOOK.edge.bend`) で丸め、直角の角を作らない (#3171)。
 * 角を落とす色味 (`corner` の `cut`) では、`LOOK.edge.square` 度以上曲がる折れ目を丸めずに直角で描く。
 * 点で区切って描いた曲線 (git の枝の線、同じ箱へ戻る輪) は 1 つの曲がりが緩いので、丸めのまま残る (#3358)
 */
export function pathOf(points: Point[], corner: Corner): string {
  const pts = points.filter(
    (p, i) =>
      i === 0 || p[0] !== (points[i - 1] as Point)[0] || p[1] !== (points[i - 1] as Point)[1],
  );
  const [x0, y0] = pts[0] as Point;
  let d = `M ${r1(x0)} ${r1(y0)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i - 1] as Point;
    const [bx, by] = pts[i] as Point;
    const [cx, cy] = pts[i + 1] as Point;
    const l1 = Math.hypot(bx - ax, by - ay);
    const l2 = Math.hypot(cx - bx, cy - by);
    const cos = ((bx - ax) * (cx - bx) + (by - ay) * (cy - by)) / (l1 * l2);
    if (corner === "cut" && (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI >= LOOK.edge.square) {
      d += ` L ${r1(bx)} ${r1(by)}`;
      continue;
    }
    const a = Math.min(LOOK.edge.bend, l1 / 2, l2 / 2);
    d += ` L ${r1(bx - ((bx - ax) / l1) * a)} ${r1(by - ((by - ay) / l1) * a)} Q ${r1(bx)} ${r1(by)} ${r1(bx + ((cx - bx) / l2) * a)} ${r1(by + ((cy - by) / l2) * a)}`;
  }
  if (pts.length > 1) {
    const [lx, ly] = pts[pts.length - 1] as Point;
    d += ` L ${r1(lx)} ${r1(ly)}`;
  }
  return d;
}

/** 矢じり。線の最後の 2 点の向きに開く。 */
export function arrowHead(points: Point[]): string {
  const [ex, ey] = points[points.length - 1] as Point;
  const [px, py] = points[points.length - 2] as Point;
  const len = Math.hypot(ex - px, ey - py) || 1;
  const dx = (ex - px) / len;
  const dy = (ey - py) / len;
  const { arrow: a, arrowHalf: h } = LOOK.edge;
  return `M ${r1(ex - dx * a - dy * h)} ${r1(ey - dy * a + dx * h)} L ${r1(ex)} ${r1(ey)} L ${r1(ex - dx * a + dy * h)} ${r1(ey - dy * a - dx * h)}`;
}

export interface Ctx {
  m: Motion;
  t: Timeline;
  /** 図の名前。図の中の定義 (影の filter、封の縞) の名札に使う */
  id: string;
  /** 影の filter を付ける属性 */
  sh: string;
  /** 最後の段の終わり */
  end: number;
  /** 描いた字の記録 (#3175) */
  ink: Ink[];
  /** 描いた線の記録 (#3175)。札を持たない字を横切る線を数える */
  traces: Trace[];
  /** 箱の名前と下の字の基準線を、箱の真ん中からどれだけ下げるか (`boxTextY`) */
  boxText: BoxTextY;
  /** 色味の角の形。角を落とす色味は図の箱と囲みと図の枠の右上と左下を落とし、小さな部品の角を丸めない (#3344) */
  corner: Corner;
  /** 運ぶ物が置き場に座っている所と間 (#3518)。箱の置き場の枠は、運ぶ物が座っている間だけ見せる */
  seats: Seat[];
}

/** 和文を含む字の、和文の字で描く時の字の形 */
export const sansOf = (t: TextStyle): TextStyle => ({ ...t, family: "sans" });

/** 字の形を CSS の `font` の値にする。字の族は CSS の変数で引く */
export const cssFont = (t: TextStyle): string => `font:${t.weight} ${t.size}px var(--${t.family})`;
/** 色の役の色 (`--c`) を `pct` の割合で `base` に混ぜた CSS の色 */
export const cssMix = (pct: number, base = "var(--surf)"): string =>
  `color-mix(in srgb,var(--c) ${pct}%,${base})`;

/**
 * 字を 1 つ描き、字の四角と見えている間を `ink` に記録する (#3175)。`ink` を渡さない字 (寄って追う窓の頭の列) は記録しない。
 * `anchor` を渡さない字は左端を `x` に置き、`text-anchor` を書かない
 */
export function write(
  ink: Ink[] | undefined,
  cls: string,
  x: number,
  y: number,
  text: string,
  style: TextStyle,
  shown: Shown[] = ALWAYS,
  anchor?: "start" | "middle",
): string {
  ink?.push({ text, rect: textBox(text, x, y, style, anchor), shown });
  return `<text class="${cls}" x="${r1(x)}" y="${r1(y)}"${anchor ? ` text-anchor="${anchor}"` : ""}>${esc(text)}</text>`;
}

/** 時刻の範囲 `[[a, b], ...]` の間だけ出る。 */
export function rangeKf(m: Motion, ranges: [number, number][]): string {
  const pts: Frame[] = [[0, { opacity: 0 }]];
  for (const [a, b] of ranges)
    pts.push(
      [a, { opacity: 0 }, EASE.out],
      [a + MOTION.fade, { opacity: 1 }],
      [b - 0.1, { opacity: 1 }, EASE.inOut],
      [b + 0.25, { opacity: 0 }],
    );
  pts.push([m.total, { opacity: 0 }]);
  return m.kf(pts);
}

/** 箱が動く段の並びを、続いた段は 1 つの範囲にまとめて出す。 */
export function activeKf(ctx: Ctx, on: number[]): string {
  const ranges: [number, number][] = [];
  for (let k = 0; k < on.length;) {
    let e = k;
    while (e + 1 < on.length && on[e + 1] === (on[e] as number) + 1) e++;
    ranges.push([
      (ctx.t.steps[on[k] as number] as Span).start,
      (ctx.t.steps[on[e] as number] as Span).end,
    ]);
    k = e + 1;
  }
  return rangeKf(ctx.m, ranges);
}

/** 状態遷移図の、出た状態の右上の済んだ印。`at` に弾んで出て、繰り返す前に消える */
export function doneMark(box: SceneBox, at: number, ctx: Ctx): string {
  const { r, inset } = LOOK.state.done;
  const x = box.x + box.w - inset;
  const y = box.y + inset;
  return `<g class="dg-popc dg-a" data-done="${esc(box.id)}" style="${cs(box.color)};${ctx.m.pop(at)}"><circle class="dg-done" cx="${r1(x)}" cy="${r1(y)}" r="${r}"/>${glyph("check", x, y, 0.5, "dg-done-ck")}</g>`;
}

/**
 * 段の番号。まだ来ていない段は出さず、今の段は塗り、済んだ段は縁取りに変えて番号を読めるまま残す。
 * `grey` を立てると (状態遷移図、#3171)、済んだ段の縁取りを線と同じ灰にする。
 * 同じ所に後の段の番号が来る時 (`until`) は、その段が始まる時に素早く消して数字を入れ替える (#3184)。
 * 見えていない間は `visibility` も隠し、同じ所に重ねたまだ来ていない段の番号が、押した時に前の段の番号を遮らないようにする。
 */
export function badge(b: SceneBadge, ctx: Ctx, grey = false): string {
  const { m } = ctx;
  const span = ctx.t.steps[b.step] as Span;
  const a = span.start;
  const e = span.end;
  const { r, ring: rr } = LOOK.badge;
  const shown = { visibility: "visible" };
  const hidden = { visibility: "hidden" };
  const swap = b.until === undefined ? undefined : (ctx.t.steps[b.until] as Span).start;
  // 次の段がすぐ入れ替える時は、塗った番号のまま素早く消し、縁取りを出さない
  const next = swap !== undefined && swap <= e + 1e-6;
  const fill = m.kf([
    [0, { opacity: 0, transform: "scale(.5)", ...hidden }],
    [a, { opacity: 0, transform: "scale(.5)", ...hidden }, EASE.pop],
    [a + 0.35, { opacity: 1, transform: "scale(1)", ...shown }],
    [e, { opacity: 1, transform: "scale(1)", ...shown }, EASE.inOut],
    [e + (next ? MOTION.untilFade : 0.4), { opacity: 0, transform: "scale(1)", ...hidden }],
    [m.total, { opacity: 0, transform: "scale(.5)", ...hidden }],
  ]);
  const pastEnd = swap ?? m.last;
  const past = next
    ? m.kf([
        [0, { opacity: 0, ...hidden }],
        [m.total, { opacity: 0, ...hidden }],
      ])
    : m.kf([
        [0, { opacity: 0, ...hidden }],
        [e, { opacity: 0, ...hidden }, EASE.inOut],
        [e + 0.4, { opacity: 1, ...shown }],
        [pastEnd, { opacity: 1, ...shown }, EASE.inOut],
        ...(swap === undefined
          ? []
          : [[swap + MOTION.untilFade, { opacity: 0, ...hidden }] as Frame]),
        [m.total, { opacity: 0, ...hidden }],
      ]);
  const ring = m.kf([
    [0, { opacity: 0, transform: "scale(1)" }],
    [a + 0.05, { opacity: 0, transform: "scale(1)" }],
    [a + 0.1, { opacity: 0.7, transform: "scale(1)" }, EASE.out],
    [a + 0.9, { opacity: 0, transform: "scale(2.3)" }],
    [m.total, { opacity: 0, transform: "scale(1)" }],
  ]);
  const x = r1(b.x);
  const y = r1(b.y);
  const ty = r1(b.y + LOOK.baseline.badge);
  const no = b.step + 1;
  ctx.ink.push({
    text: String(no),
    rect: { x: b.x - r, y: b.y - r, w: r * 2, h: r * 2 },
    shown: [[a, pastEnd]],
    boxed: true,
    badge: true,
  });
  return (
    `<g class="dg-bd" data-step="${b.step}" style="${cs(b.color)}"><circle class="dg-bdr dg-popc dg-a" cx="${x}" cy="${y}" r="${rr}" style="${ring}"/>` +
    `<g class="dg-a" style="${past}"><circle class="${grey ? "dg-bdp-g" : "dg-bdp"}" cx="${x}" cy="${y}" r="${rr}"/><text class="${grey ? "dg-bdpt-g" : "dg-bdpt"}" x="${x}" y="${ty}" text-anchor="middle">${no}</text></g>` +
    `<g class="dg-popc dg-a" style="${fill}"><circle class="dg-bdf" cx="${x}" cy="${y}" r="${r}"/><text class="dg-bdft" x="${x}" y="${ty}" text-anchor="middle">${no}</text></g></g>`
  );
}
