/**
 * 呼び出しの管の描き方 (#3389、#3398)。
 *
 * 呼んだ者ごとに 1 本の本管を引き、呼ぶ相手ごとに枝を分ける。管は太い外の管で描き、枝の根元に弁を置く。
 * 開いている呼び出しは、呼んだ者を出た所から呼ばれた者の名札まで呼び出しの色 (青) で光り、開いた時刻に弁の取っ手が倒れる。
 * 戻ると光が消えて取っ手が立つ。一番外の呼び出しが戻って全てが確定した段は、送り手から出る管を確定の色 (緑) で光らせる。
 * 開いている管と流れた値の管は、淡く太い帯の中を長さの違う 2 本の筋が流れる川の形で描く (Tracelyth #168)。
 * 呼び出しの種類の見た目 (処理を借りる管の 2 本線、書き込めない管の細さ) は呼び出しの種類のブロックの描き方 (`call/draw.ts`) が持つ。
 * この file は配管の図を描く部品 (`render/pipe.ts`) だけが読み、見本帳を開いた時に読む塊に入れない
 */
import type { PipeMain } from "../../kinds/pipe/layout";
import type { Point } from "../../layout/scene";
import { PIPE_LOOK, PIPE_PAINT, PIPE_TYPE } from "../../look/pipe";
import type { Motion } from "../../render/motion";
import { cssFont, r1 } from "../../render/parts";
import { kindCore } from "../call/draw";
import { cs } from "../color/draw";

/**
 * 管の線。値の管も呼び出しの管も、折れ線の角を半径 `PIPE_LOOK.bend` の弧で曲げる (#3783)。隣の辺が短い角は、その辺の半分を半径にする。
 * 並びの点は変えず、描く線だけを丸めるので、管を避ける確かめは今の折れ線のまま働く
 */
export function bentLine(points: readonly Point[]): string {
  const at = (p: Point): string => `${r1(p[0])} ${r1(p[1])}`;
  const first = points[0];
  if (first === undefined) return "";
  let d = `M ${at(first)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [a, b, c] = [points[i - 1], points[i], points[i + 1]] as [Point, Point, Point];
    const ab = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const bc = Math.hypot(c[0] - b[0], c[1] - b[1]);
    const r = Math.min(PIPE_LOOK.bend, ab / 2, bc / 2);
    // 真っすぐ続く点と重なった点は曲げずに通る
    const straight = Math.abs((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])) < 1e-6;
    if (r <= 0 || straight) {
      d += ` L ${at(b)}`;
      continue;
    }
    d += ` L ${at([b[0] + ((a[0] - b[0]) * r) / ab, b[1] + ((a[1] - b[1]) * r) / ab])} Q ${at(b)} ${at([b[0] + ((c[0] - b[0]) * r) / bc, b[1] + ((c[1] - b[1]) * r) / bc])}`;
  }
  const last = points[points.length - 1];
  return points.length > 1 && last !== undefined ? `${d} L ${at(last)}` : d;
}

/** 流れを見せる切り抜きの番号と、番号を数えている図の名前 */
export const STREAM = { n: 0, of: "" };
/**
 * 次の流れる帯の mask の名札。配管の図を描く部品 (`render/pipe.ts`) が図ごとに数えを 0 へ戻し、図の名前 (`of`) を渡す (#3720)。
 * 同じ図はいつ何度描いても同じ名札になり、同じ頁に置いた別の図の名札とぶつからない
 */
export const streamId = (): string => `dg-stream${++STREAM.n}-${STREAM.of}`;
/** 道を `style` の動きで頭から見せていく切り抜き (Tracelyth #168) */
export const maskOf = (id: string, d: string, style: string): string =>
  `<mask id="${id}" maskUnits="userSpaceOnUse" x="-9999" y="-9999" width="29999" height="29999"><path class="dg-pp-reveal dg-a" pathLength="1" style="${style}" d="${d}"/></mask>`;
/** 筋が流れる速さ。`speed` は長い筋、`slow` は短い筋 (図の座標 / 秒) */
const RIVER = { speed: 80, slow: 54 };
/** 破線のずれを、時刻 `t0` に `o0` を通る速さ `speed` で動かす動き */
const slide = (m: Motion, t0: number, speed: number, o0: number): string =>
  m.kf([
    [0, { "stroke-dashoffset": r1(o0 + speed * t0) }],
    [m.total, { "stroke-dashoffset": r1(o0 - speed * (m.total - t0)) }],
  ]);
/** 流れの筋の動き。`t0` は流れ始める時刻、`tEnd` は流れ終える時刻、`w` は筋の速さの倍率、`pre` は流れる前から筋を見せるか */
export interface StreamRun {
  m: Motion;
  t0: number;
  tEnd: number;
  w: number;
  pre?: boolean;
}
/** 淡く太い帯の中を、長さの違う 2 本の筋が違う速さで流れる (川の流れ、Tracelyth #168) */
export function dashMovers(d: string, g: StreamRun): string {
  const run = (o0: number, speed: number): string => slide(g.m, g.t0, speed * g.w, o0);
  return `<path class="mv-s1 dg-a" style="${run(0, RIVER.speed)}" d="${d}"/><path class="mv-s2 dg-a" style="${run(40, RIVER.slow)}" d="${d}"/>`;
}
/**
 * 流れる管と、札入れと記録の札と、吸い込む印の見た目 (Tracelyth #168、#107)。配管の図を描く部品 (`render/pipe.ts`) が図の見た目の後に置き、
 * 管の太さと丸の色を上書きする
 */
export const FLOW_CSS = [
  ".dg-pp-ccase{fill:none;stroke:var(--line);stroke-width:8;stroke-linejoin:round;stroke-linecap:butt}",
  ".dg-pp-pcase{fill:none;stroke:var(--ink);stroke-width:14;stroke-linejoin:round;stroke-linecap:butt}",
  ".dg-pp-ctrack{fill:none;stroke:color-mix(in srgb,var(--c) 34%,var(--surf));stroke-width:8;stroke-linejoin:round}",
  ".dg-pp-mtrack{fill:none;stroke:color-mix(in srgb,var(--pp-t) 40%,var(--surf));stroke-width:11;stroke-linejoin:round}",
  ".dg-pp-cdone{fill:none;stroke:color-mix(in srgb,var(--c) 34%,var(--surf));stroke-width:8;stroke-linejoin:round}",
  ".dg-pp-tpast{fill:none;stroke:color-mix(in srgb,var(--pp-t) 40%,var(--surf));stroke-width:11;stroke-linejoin:round}",
  ".mv-s1{fill:none;stroke:var(--k);stroke-width:4.5;stroke-linecap:round;stroke-dasharray:34 96;stroke-linejoin:round}",
  ".mv-s2{fill:none;stroke:var(--k);stroke-width:3.5;stroke-linecap:round;stroke-dasharray:16 64;opacity:.6;stroke-linejoin:round}",
  ".dg-pp-lcard{fill:var(--surf);stroke:var(--hair);stroke-width:1.5}",
  ".dg-pp-fn rect{fill:var(--surf);stroke:var(--c-blue);stroke-width:2}",
  ".dg-pp-fn .hr{fill:none;stroke:var(--hair);stroke-width:1.5}",
  `.dg-pp-fn .k{${cssFont({ ...PIPE_TYPE.chip, size: 13, weight: 600 })};fill:var(--mute)}`,
  `.dg-pp-fn .f{${cssFont({ ...PIPE_TYPE.chip, size: 14, weight: 700 })};fill:var(--c-blue)}`,
  `.dg-pp-fn .p{${cssFont({ ...PIPE_TYPE.chip, size: 13, weight: 500 })};fill:var(--ink2)}`,
  `.dg-pp-fn .n{${cssFont({ ...PIPE_TYPE.chip, size: 13, weight: 500 })};fill:var(--mute)}`,
  `.dg-pp-fn .v{${cssFont({ ...PIPE_TYPE.chip, size: 13, weight: 700 })};fill:var(--ink)}`,
  ".dg-pp-log .box{fill:var(--surf);stroke:var(--c);stroke-width:2}",
  ".dg-pp-log-provisional .box{stroke-dasharray:6 4}",
  ".dg-pp-log .tag{fill:var(--c)}",
  `.dg-pp-log .tagt{${cssFont({ ...PIPE_TYPE.chip, size: 11, weight: 700 })};fill:var(--on-c)}`,
  `.dg-pp-log .st{${cssFont({ ...PIPE_TYPE.chip, size: 11, weight: 700 })};fill:var(--ct)}`,
  `.dg-pp-log .k{${cssFont({ ...PIPE_TYPE.chip, size: 12, weight: 600 })};fill:var(--mute)}`,
  `.dg-pp-log .f{${cssFont({ ...PIPE_TYPE.chip, size: 13, weight: 700 })};fill:var(--ct)}`,
  `.dg-pp-log .n{${cssFont({ ...PIPE_TYPE.chip, size: 12, weight: 500 })};fill:var(--mute)}`,
  `.dg-pp-log .v{${cssFont({ ...PIPE_TYPE.chip, size: 12, weight: 700 })};fill:var(--ink)}`,
  ".dg-pp-log .hr{fill:none;stroke:var(--hair);stroke-width:1.5}",
  ".dg-pp-gulp{fill:none;stroke:var(--t-amber);stroke-width:4}",
  `.dg-pp-fn text{${cssFont({ ...PIPE_TYPE.chip, size: 13, weight: 700 })};fill:var(--c-blue)}`,
  `.dg-pp-avu{fill:color-mix(in srgb,var(--c-blue) 13%,${PIPE_PAINT.badge})}`,
  ".dg-pp-glyph{fill:var(--c-blue)}",
  ".dg-pp-deep{display:none}",
  ".dg-pp-shine{fill:color-mix(in srgb,var(--ink) 4%,transparent)}",
  ".dg-pp-ctrack{stroke:color-mix(in srgb,var(--c) 22%,var(--surf));stroke-width:16}",
  ".dg-pp-mtrack{stroke:color-mix(in srgb,var(--pp-t) 62%,var(--surf));stroke-width:11}",
];

/** 本管と枝の外の管 */
export function callCase(main: PipeMain): string {
  const d = [main.points, ...main.branches.map((b) => b.points)]
    .filter((p) => p.length > 1)
    .map(bentLine)
    .join(" ");
  return `<path class="dg-pp-ccase" d="${d}"/>`;
}

/**
 * 光る管。`attrs` は部品の印 (`data-pipe-branch`、`data-pipe-call`、`data-pipe-pipe`)、`shown` は見える間の style。
 * 確定した段の管 (`good`) と、流れの動き (`run`) を渡さない管は、流れ終えた跡 (`dg-pp-cdone`) で描く。
 * `run` を渡すと、帯の中を 2 本の筋が流れる (Tracelyth #168)。`draw` を渡すと、帯がその style の動きで呼んだ者の側から見えていく
 */
export function litPipe(lane: { kind: string; width: number; points: Point[] }, attrs: string, shown: string, good = false, draw = "", run?: Omit<StreamRun, "w">): string {
  const d = bentLine(lane.points);
  const tone = cs(good ? "green" : "blue");
  if (good || !run) return `<g class="dg-a" style="${shown}"><path${attrs} class="dg-pp-cdone" style="${tone}" d="${d}"/></g>`;
  const id = streamId();
  const mask = draw ? maskOf(id, d, draw) : "";
  const g: StreamRun = { m: run.m, t0: run.t0, tEnd: run.tEnd, w: 1, ...(run.pre !== undefined ? { pre: run.pre } : {}) };
  const look = `${tone};--k:var(--c);--w:1`;
  return (
    `<g class="dg-a" style="${shown}">${mask}<g${attrs} class="dg-pp-cstream" style="${look}"${draw ? ` mask="url(#${id})"` : ""}>` +
    `<path class="dg-pp-ctrack" d="${d}"/>${dashMovers(d, g)}</g>${kindCore(lane, d)}</g>`
  );
}
