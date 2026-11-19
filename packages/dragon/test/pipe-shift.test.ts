/**
 * 配管の図の札を置く隙間を作るために、図の座標をずらす道具 (#3751)。
 *
 * 描く処理は札の置き場が見つからない時、切れ目より先 (下か右) の物をずらして試し、試した後に元へ戻す。
 * 前は試すたびに図の全てを辿ってずらす相手を探していた。道具はずらす相手を 1 回目に並べ、2 回目からは並べた相手だけを見るが、
 * ずらした値と戻した値は、図の全てを辿る定義と同じにする。同じ値なら札の場所も描いた SVG も変わらない。
 * ここでは種から作った図に、縦と横のずらしと戻しを続けて当て、道具の結果を定義の結果と比べる。
 */
import { describe, expect, it } from "vitest";

type Shift = typeof import("../src/render/pipe-shift");
type Cut = number | ((y: number) => number);

// 道具が無い時も件ごとに名前を挙げて落とすため、読めなかった時は空の物にする
const mod = (await import("../src/render/pipe-shift").catch(() => ({}))) as Partial<Shift>;

/** 座標をずらす道具。無い時は名前を挙げて落とす */
function tool(): Shift["Shifter"] {
  expect(mod.Shifter, "座標をずらす道具 (src/render/pipe-shift.ts) が Shifter を出していない").toBeTypeOf("function");
  return mod.Shifter as Shift["Shifter"];
}

/**
 * 定義。描く処理が前に持っていた形で、ずらすたびに図の全て (大きさの欄を除く) と `extra` を辿る。
 * 切れ目より先の座標を d だけずらし、切れ目をまたぐ物は大きさを d だけ伸ばし、図の大きさも伸ばす。元へ戻す関数を返す
 */
function defined(root: Record<string, unknown>, axis: "x" | "y", cut: Cut, d: number, extra: readonly object[]): () => void {
  const log: [Record<string | number, unknown>, string | number, unknown][] = [];
  const put = (o: Record<string | number, unknown>, k: string | number, v: unknown): void => {
    log.push([o, k, o[k]]);
    o[k] = v;
  };
  const seen = new WeakSet<object>();
  const POS = axis === "y" ? ["y", "y1", "y2", "cy", "base"] : ["x", "x1", "x2", "cx"];
  const SIZE = axis === "y" ? "h" : "w";
  const cutOf = typeof cut === "function" ? cut : () => cut;
  const yOf = (o: Record<string, unknown>): number => typeof o.y === "number" ? o.y + (typeof o.h === "number" ? o.h / 2 : 0) : typeof o.y1 === "number" ? Math.min(o.y1, Number(o.y2)) : typeof o.cy === "number" ? o.cy : typeof o.base === "number" ? o.base : 0;
  const walk = (o: unknown): void => {
    if (o === null || typeof o !== "object" || seen.has(o)) return;
    seen.add(o);
    if (Array.isArray(o)) {
      if (o.length === 2 && typeof o[0] === "number" && typeof o[1] === "number") {
        const i = axis === "y" ? 1 : 0;
        if (o[i] > cutOf(o[1])) put(o as unknown as Record<number, unknown>, i, o[i] + d);
        return;
      }
      for (const v of o) walk(v);
      return;
    }
    const rec = o as Record<string, unknown>;
    const c0 = cutOf(yOf(rec));
    const lead = rec[axis];
    const size = rec[SIZE];
    const across = typeof lead === "number" && typeof size === "number" && lead < c0 && lead + size > c0;
    for (const [k, v] of Object.entries(rec)) {
      if (typeof v === "number") {
        if (POS.includes(k) && v > c0) put(rec, k, v + d);
        else if (k === SIZE && across) put(rec, k, v + d);
      } else walk(v);
    }
  };
  for (const [k, v] of Object.entries(root)) if (k !== "width" && k !== "height") walk(v);
  for (const e of extra) walk(e);
  const side = axis === "y" ? "height" : "width";
  put(root, side, (root[side] as number) + d);
  return () => {
    for (let i = log.length - 1; i >= 0; i--) {
      const [o, k, v] = log[i] as [Record<string | number, unknown>, string | number, unknown];
      o[k] = v;
    }
  };
}

/** 決まった種から作る、くり返せる乱数 */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

interface Graph {
  root: Record<string, unknown>;
  extra: object[];
  /** 切れ目に選ぶ値。図の中に在る値をそのまま切れ目にして、ちょうど切れ目に在る物を作る */
  values: number[];
}

/**
 * 種から作る図。座標と大きさの欄、数でない欄、数の 2 つ組、3 つの数の並び、入れ子の物、
 * 2 か所から指す同じ物、図の頭に直に置いた数、外から渡す札の枠 (図の中の物も混ぜる) を持つ
 */
function graphOf(rand: () => number): Graph {
  const values: number[] = [];
  const num = (): number => {
    const r = rand();
    if (r < 0.02) return Number.NaN;
    if (r < 0.04) return Number.POSITIVE_INFINITY;
    const v = Math.round(rand() * 800) / (rand() < 0.5 ? 1 : 4);
    values.push(v);
    return v;
  };
  const rec = (depth: number): Record<string, unknown> => {
    const o: Record<string, unknown> = { name: "n" };
    for (const k of ["x", "y", "w", "h", "x1", "x2", "y1", "y2", "cx", "cy", "base", "r"]) if (rand() < 0.45) o[k] = num();
    if (rand() < 0.15) o.y = "12";
    if (rand() < 0.1) o.w = undefined;
    if (rand() < 0.25) o.label = { x: num(), y: num(), w: num(), h: num() };
    if (rand() < 0.35) o.points = Array.from({ length: 1 + Math.floor(rand() * 4) }, () => [num(), num()]);
    if (rand() < 0.1) o.triple = [num(), num(), num()];
    if (rand() < 0.1) o.flag = true;
    if (depth > 0 && rand() < 0.3) o.kids = Array.from({ length: 1 + Math.floor(rand() * 3) }, () => rec(depth - 1));
    return o;
  };
  const shared = rec(1);
  const pair = [num(), num()];
  const parties = Array.from({ length: 10 }, () => rec(2));
  const root: Record<string, unknown> = {
    width: 900,
    height: 700,
    y: 5,
    count: 3,
    kind: "pipe",
    parties,
    chips: [shared, rec(1), rec(0)],
    events: [shared, { at: shared, path: [pair, [num(), num()]] }],
    lanes: [{ points: [pair, [num(), num()], [num(), num()]] }],
    misc: { inner: shared, nothing: null, list: [1, 2, 3] },
  };
  const extra: object[] = [{ x: num(), y: num(), w: num(), h: num() }, { x: num(), y: num(), w: 10, h: 10 }, shared, parties[0] as object];
  return { root, extra, values };
}

/** 図の写しを 2 つ作る。同じ物を 2 か所から指す形は写しの中でも保つ */
const twins = (g: Graph): [Graph, Graph] => [structuredClone(g), structuredClone(g)];

describe("図の座標をずらす道具 (#3751)", () => {
  it("pipe-shift-matches-definition", () => {
    const Shifter = tool();
    for (let seed = 1; seed <= 25; seed++) {
      const rand = seeded(seed);
      const [want, got] = twins(graphOf(rand));
      const shifter = new Shifter(got.root);
      const values = want.values.filter((v) => Number.isFinite(v));
      for (let step = 0; step < 10; step++) {
        const axis = rand() < 0.5 ? "y" : "x";
        const at = values.length > 0 && rand() < 0.6 ? (values[Math.floor(rand() * values.length)] as number) : Math.round(rand() * 800);
        const other = Math.round(rand() * 800);
        const jog = Math.round(rand() * 800);
        const fn = rand() < 0.3;
        const cutWant: Cut = fn ? (y: number) => (y < jog ? at : other) : at;
        const cutGot: Cut = fn ? (y: number) => (y < jog ? at : other) : at;
        const d = rand() < 0.2 ? 16 : Math.round(rand() * 120) / 2;
        const pick = (g: Graph): object[] => g.extra.filter((_, k) => (seed + step + k) % 2 === 0);
        const undoWant = defined(want.root, axis, cutWant, d, pick(want));
        const undoGot = shifter.shift(axis, cutGot, d, pick(got));
        expect(got, `種 ${seed} の ${step + 1} 回目に ${axis} で ${fn ? "関数の" : ""}切れ目 ${at} から ${d} ずらした図`).toEqual(want);
        if (rand() < 0.5) {
          undoWant();
          undoGot();
          expect(got, `種 ${seed} の ${step + 1} 回目のずらしを戻した図`).toEqual(want);
        }
      }
    }
  });

  it("pipe-shift-keeps-what-it-must-not-move", () => {
    const Shifter = tool();
    const make = () => {
      const shared = { x: 10, y: 100, w: 20, h: 20 };
      const root: Record<string, unknown> = {
        width: 300,
        height: 400,
        y: 999,
        items: [
          { x: 5, y: 10, w: 30, h: 30, name: "上の箱" },
          { x: 5, y: 40, w: 30, h: 40 },
          { x: 5, y: "70", h: 10, label: "数でない座標" },
          shared,
          { ref: shared },
          [shared],
        ],
        pts: [
          [1, 49],
          [2, 50],
          [3, 51],
        ],
      };
      return { root, shared };
    };
    const { root, shared } = make();
    const before = structuredClone(root);
    const shifter = new Shifter(root);
    const undo = shifter.shift("y", 50, 10, [shared]);
    expect(root, "縦に切れ目 50 から 10 ずらした図").toEqual({
      width: 300,
      height: 410,
      y: 999,
      items: [
        { x: 5, y: 10, w: 30, h: 30, name: "上の箱" },
        { x: 5, y: 40, w: 30, h: 50 },
        { x: 5, y: "70", h: 10, label: "数でない座標" },
        { x: 10, y: 110, w: 20, h: 20 },
        { ref: { x: 10, y: 110, w: 20, h: 20 } },
        [{ x: 10, y: 110, w: 20, h: 20 }],
      ],
      pts: [
        [1, 49],
        [2, 50],
        [3, 61],
      ],
    });
    undo();
    expect(root, "縦のずらしを戻した図").toEqual(before);
    const undoX = shifter.shift("x", 15, 5, []);
    expect((root.items as Record<string, unknown>[])[0], "横に切れ目 15 から 5 ずらした時の、切れ目をまたぐ箱").toEqual({ x: 5, y: 10, w: 35, h: 30, name: "上の箱" });
    expect(shared, "横にずらした時の、切れ目をまたぐ 2 か所から指す箱 (1 度だけ伸ばす)").toEqual({ x: 10, y: 100, w: 25, h: 20 });
    expect(root.pts, "横にずらした時の数の 2 つ組").toEqual([
      [1, 49],
      [2, 50],
      [3, 51],
    ]);
    expect([root.width, root.height, root.y], "横にずらした時の図の大きさと図の頭の数").toEqual([305, 400, 999]);
    undoX();
    expect(root, "横のずらしを戻した図").toEqual(before);
  });
});
