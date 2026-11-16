/**
 * 運ぶ物が見えている時刻 (#3345)。時刻の表 (`timeline.ts`) が、線を引く時刻を決めた後に呼ぶ。
 *
 * 運ぶ物は主役 (封筒と札は 1 つ、硬貨は別の 1 つ) ごとに途切れず見え続ける。着いた後は
 * 次の同じ主役が出発するまで着いた先に留まり、次が無ければ終わりまで留まる。
 * 箱の置き場の枠は運ぶ物が座っている間だけ出すので、その間もここで出す (#3518)。
 * 枠の幅は、その間に座っている物の幅に沿わせる (#3723)。
 */
import { carrierHalf, type Rect, type SceneEdge } from "../../layout/scene";
import type { Span } from "../../timeline";

/** 運ぶ物が見えている間。`depart` に出発し `arrive` に着く。出発を待つ間と、着いた先で留まる間も含む。 */
export interface CarrierTime extends Span {
  step: number;
  event: number;
  who: "main" | "coin";
  depart: number;
  arrive: number;
}

/** 運ぶ物を載せた線の 1 本。`a` に引き始め `b` に引き終わる */
export interface Departure {
  step: number;
  event: number;
  who: "main" | "coin";
  a: number;
  b: number;
}

/** 線の順に並んだ出発から、運ぶ物が見えている間を出す。`first` は最初の段の始まり、`last` は繰り返す前に消えていく所の始まり */
export function carrierTimes(departures: Departure[], first: number, last: number): CarrierTime[] {
  const hasMain = departures.some((d) => d.who === "main");
  const carriers: CarrierTime[] = [];
  for (const who of ["main", "coin"] as const) {
    const list = departures.filter((d) => d.who === who);
    list.forEach((d, k) => {
      const next = list[k + 1];
      // 主役の最初の運ぶ物は、最初の段の始まりから出発点で待つ (何も見えない時間を作らないため)
      const waits = k === 0 && (who === "main" || !hasMain);
      carriers.push({
        step: d.step,
        event: d.event,
        who,
        depart: d.a,
        arrive: d.b,
        start: waits ? Math.min(first, d.a) : d.a,
        end: next ? Math.max(next.a, d.b) : last,
      });
    });
  }
  carriers.sort((x, y) => x.depart - y.depart);
  return carriers;
}

/** 運ぶ物が置き場に座っている所と間と、座る物の半分の幅。`[x, y, 座り始める時刻, 立つ時刻, 半分の幅]` (#3518、#3723) */
export type Seat = [number, number, number, number, number];

/**
 * 運ぶ物が置き場に座っている所と間。着いた物は着いた所 (`settle`) で `arrive` から `end` まで、
 * 走り出す前の物は待つ所 (`wait`) で `start` から `depart` まで座る。走っている途中は数えない
 */
export const seatsOf = (edges: readonly SceneEdge[], times: readonly CarrierTime[]): Seat[] =>
  times.flatMap((t) => {
    const e = edges.find((x) => x.step === t.step && x.event === t.event);
    if (!e) return [];
    const half = carrierHalf(e.carry)[0];
    const out: Seat[] = [];
    if (e.wait) out.push([...e.wait, t.start, t.depart, half]);
    if (e.settle) out.push([...e.settle, t.arrive, t.end, half]);
    return out;
  });

/** 置き場の枠に座る物に沿わせた枠の 1 つ (#3723)。`x` と `w` は枠の左端と幅、`shown` は枠を見せる間 */
export interface HeldFrame {
  x: number;
  w: number;
  shown: [number, number][];
}

/**
 * 置き場の枠 `r` に座る物に沿わせた枠と、それぞれを見せる間 (#3723)。
 * 座る物が替わる時刻で間を切り、間ごとに、その間に座る物を左右に `pad` 空けて囲む幅の枠にする。同じ枠の間は 1 つの枠にまとめる。
 * 枠を箱を通る物の一番広い幅で取ると、細い物しか持たない段でも広い枠が出るため。
 * 箱の幅と置き場の場所は一番広い物で決めたままにし、段で箱が跳ねないようにする
 */
export function heldFrames(r: Rect, seats: readonly Seat[], pad: number): HeldFrame[] {
  const inside = seats.filter(([x, y, a, b]) => b > a && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
  const times = [...new Set(inside.flatMap(([, , a, b]) => [a, b]))].sort((p, q) => p - q);
  const frames = new Map<string, HeldFrame>();
  for (let k = 1; k < times.length; k++) {
    const t0 = times[k - 1] as number;
    const t1 = times[k] as number;
    const held = inside.filter(([, , a, b]) => a < t1 && b > t0);
    if (held.length === 0) continue;
    const x = Math.min(...held.map(([cx, , , , h]) => cx - h)) - pad;
    const w = Math.max(...held.map(([cx, , , , h]) => cx + h)) + pad - x;
    const key = `${x.toFixed(2)} ${w.toFixed(2)}`;
    const frame = frames.get(key) ?? { x, w, shown: [] };
    const last = frame.shown[frame.shown.length - 1];
    if (last && t0 <= last[1]) last[1] = t1;
    else frame.shown.push([t0, t1]);
    frames.set(key, frame);
  }
  return [...frames.values()];
}

/**
 * 置き場の枠 `r` に運ぶ物が座っている間を、重なりをまとめて時刻の順に並べる。
 * 座る所で枠を選ぶのは、時間軸の図が同じ名札の箱を列ごとに持ち、名札では枠を選べないため
 */
export function heldIn(r: Rect, seats: readonly Seat[]): [number, number][] {
  const out: [number, number][] = [];
  for (const [x, y, a, b] of [...seats].sort((p, q) => p[2] - q[2]))
    if (b > a && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
      const last = out[out.length - 1];
      if (last && a <= last[1]) last[1] = Math.max(last[1], b);
      else out.push([a, b]);
    }
  return out;
}
