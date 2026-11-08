/**
 * 運ぶ物が見えている時刻 (#3345)。時刻の表 (`timeline.ts`) が、線を引く時刻を決めた後に呼ぶ。
 *
 * 運ぶ物は主役 (封筒と札は 1 つ、硬貨は別の 1 つ) ごとに途切れず見え続ける。着いた後は
 * 次の同じ主役が出発するまで着いた先に留まり、次が無ければ終わりまで留まる。
 * 箱の置き場の枠は運ぶ物が座っている間だけ出すので、その間もここで出す (#3518)。
 */
import type { Rect, SceneEdge } from "../../layout/scene";
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

/** 運ぶ物が置き場に座っている所と間。`[x, y, 座り始める時刻, 立つ時刻]` (#3518) */
export type Seat = [number, number, number, number];

/**
 * 運ぶ物が置き場に座っている所と間。着いた物は着いた所 (`settle`) で `arrive` から `end` まで、
 * 走り出す前の物は待つ所 (`wait`) で `start` から `depart` まで座る。走っている途中は数えない
 */
export const seatsOf = (edges: readonly SceneEdge[], times: readonly CarrierTime[]): Seat[] =>
  times.flatMap((t) => {
    const e = edges.find((x) => x.step === t.step && x.event === t.event);
    const out: Seat[] = [];
    if (e?.wait) out.push([...e.wait, t.start, t.depart]);
    if (e?.settle) out.push([...e.settle, t.arrive, t.end]);
    return out;
  });

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
