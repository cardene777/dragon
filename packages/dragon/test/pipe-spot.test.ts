/**
 * 配管の図の呼び出しの札の置き場所を探す道具 (#3737)。
 *
 * 札の候補は格子に並べ、候補ごとに障りの物と重なるか、重なる面積の和、道の点までの一番近い隔たりを測る。
 * 道具は前もって候補の列ごとに相手を絞って速く答えるが、答えは全部の物と全部の点を順に見る定義と同じ値にする。
 * 同じ値なら札の場所は変わらない。ここでは種から作った場面の全ての候補で、道具の答えを定義の答えと比べる。
 */
import type { Point, Rect } from "../src/layout/scene";
import { describe, expect, it, vi } from "vitest";
import { exampleJson } from "./diagram-data";

type Spot = typeof import("../src/render/pipe-spot");

// 道具が無い時も件ごとに名前を挙げて落とすため、読めなかった時は空の物にする
const spot = (await import("../src/render/pipe-spot").catch(() => ({}))) as Partial<Spot>;

/** 札と物の間に空ける隙間 (描く処理と同じ 8px) */
const GAP = 8;
/** 札を道の傍とみなす隔たり (描く処理と同じ 56px) */
const NEAR = 56;

/** 決まった種から作る、くり返せる乱数 */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/** 置き場所を探す道具の部品。無い時は名前を挙げて落とす */
function tools(): Spot {
  for (const name of ["SpotGrid", "PathPoints", "meets", "overlapOf", "far", "gridOf"] as const)
    expect(spot[name], `置き場所を探す道具 (src/render/pipe-spot.ts) が ${name} を出していない`).toBeTypeOf("function");
  return spot as Spot;
}

/** 種から作る障りの物。小数の寸法、大きさ 0、格子の 64 升を超える大きな物、数でない寸法の物を混ぜる */
function wallsOf(rand: () => number): Rect[] {
  const walls: Rect[] = [];
  for (let k = 0; k < 40; k++) walls.push({ x: -50 + rand() * 700, y: -50 + rand() * 500, w: rand() < 0.1 ? 0 : rand() * 180, h: rand() < 0.1 ? 0 : rand() * 120 });
  // 線を包む細長い物
  for (let k = 0; k < 10; k++) walls.push(rand() < 0.5 ? { x: rand() * 600, y: -10 + rand() * 20, w: 26, h: 300 + rand() * 200 } : { x: -10 + rand() * 20, y: rand() * 400, w: 400 + rand() * 300, h: 26 });
  walls.push({ x: -2000, y: 150 + rand() * 50, w: 5000, h: 10 }, { x: 200 + rand() * 50, y: -3000, w: 12, h: 6000 });
  walls.push({ x: Number.NaN, y: 0, w: 1000, h: 1000 }, { x: Number.NEGATIVE_INFINITY, y: 100, w: Number.POSITIVE_INFINITY, h: 50 }, { x: 100, y: Number.POSITIVE_INFINITY, w: 50, h: 50 });
  return walls;
}

describe("札の候補の格子", () => {
  it("pipe-spot-grid-matches-definition", () => {
    const { SpotGrid, meets, overlapOf, gridOf } = tools();
    const wrong: string[] = [];
    for (let seed = 1; seed <= 8; seed++) {
      const rand = seeded(seed);
      const w = 80 + rand() * 140;
      const h = 36 + rand() * 80;
      const xs = gridOf(-20.3 + rand() * 10, 560 + rand() * 10, 6);
      const ys = gridOf(-15.7 + rand() * 10, 380 + rand() * 10, 6);
      // 置いた札は障りの物の後ろに並べる
      const more: Rect[] = Array.from({ length: 3 }, () => ({ x: rand() * 500, y: rand() * 350, w: 120, h: 60 }));
      const lists = [wallsOf(rand), more];
      const grid = new SpotGrid(xs, ys, w, h, lists, GAP);
      xs.forEach((x, i) =>
        ys.forEach((y, j) => {
          const r = { x, y, w, h };
          const blocked = lists.some((list) => list.some((o) => meets(r, o, GAP)));
          const area = overlapOf(r, lists, GAP);
          if (grid.blocked(i, j) !== blocked) wrong.push(`種 ${seed} の (${x}, ${y}) の重なり ${grid.blocked(i, j)} が定義 ${blocked} と違う`);
          if (!Object.is(grid.overlap(i, j), area)) wrong.push(`種 ${seed} の (${x}, ${y}) の面積の和 ${grid.overlap(i, j)} が定義 ${area} と違う`);
        }),
      );
    }
    expect(wrong.slice(0, 10), "格子の候補の答えが、全部の物を見る定義と違う").toEqual([]);
  });

  it("pipe-spot-refuses-spots-within-gap", () => {
    const { SpotGrid } = tools();
    // 物は x と y が 100 から 140。隙間 8px を足すと 92 から 148 をふさぐ。札は 20px 四方
    const wall = { x: 100, y: 100, w: 40, h: 40 };
    const placed = { x: 300, y: 112, w: 10, h: 10 };
    const xs = [72, 72.5, 110, 147.5, 148, 295];
    const ys = [120];
    const grid = new SpotGrid(xs, ys, 20, 20, [[wall, { x: Number.NaN, y: 0, w: 1000, h: 1000 }], [placed]], GAP);
    const got = xs.map((x, i) => ({ x, blocked: grid.blocked(i, 0), overlap: grid.overlap(i, 0) > 0 }));
    expect(got, "隙間 8px の内に入る候補を空いた候補として返した、または隙間がちょうど 8px の候補をふさいだ").toEqual([
      // 札の右端が 92 でちょうど 8px 空く
      { x: 72, blocked: false, overlap: false },
      { x: 72.5, blocked: true, overlap: true },
      { x: 110, blocked: true, overlap: true },
      { x: 147.5, blocked: true, overlap: true },
      // 札の左端が 148 でちょうど 8px 空く
      { x: 148, blocked: false, overlap: false },
      // 置いた札もふさぐ。寸法が数でない物はどこもふさがない
      { x: 295, blocked: true, overlap: true },
    ]);
  });
});

describe("道の点", () => {
  /** 定義。全部の点を順に見て、一番近い最初の点を返す */
  const definition = (along: readonly Point[], r: Rect, far: (r: Rect, p: Point) => number): { k: number; d: number } => {
    let k = 0;
    let d = far(r, along[0] as Point);
    along.forEach((p, i) => {
      const e = far(r, p);
      if (e < d) {
        d = e;
        k = i;
      }
    });
    return { k, d };
  };

  /** 種から作る道。直角に曲がる道を主にし、斜めの区間と長さ 0 の区間を混ぜる */
  const laneOf = (rand: () => number): Point[] => {
    const pts: Point[] = [[rand() * 500, rand() * 300]];
    const n = 2 + Math.floor(rand() * 5);
    for (let k = 1; k < n; k++) {
      const [x, y] = pts[k - 1] as Point;
      const t = rand();
      pts.push(t < 0.4 ? [x + (rand() - 0.5) * 600, y] : t < 0.8 ? [x, y + (rand() - 0.5) * 400] : t < 0.9 ? [x + (rand() - 0.5) * 200, y + (rand() - 0.5) * 200] : [x, y]);
    }
    return pts;
  };

  it("pipe-spot-nearest-matches-definition", () => {
    const { PathPoints, far } = tools();
    const wrong: string[] = [];
    for (let seed = 1; seed <= 12; seed++) {
      const rand = seeded(seed);
      const path = new PathPoints(laneOf(rand));
      for (let q = 0; q < 400; q++) {
        const r = { x: -200 + rand() * 900, y: -200 + rand() * 700, w: 60 + rand() * 160, h: 36 + rand() * 60 };
        const want = definition(path.along, r, far);
        const got = path.nearest(r);
        if (got.point !== path.along[want.k] || !Object.is(got.d, want.d)) wrong.push(`種 ${seed} の札 (${r.x}, ${r.y}) の一番近い点が定義と違う`);
        const within = path.nearestWithin(r, NEAR + 1);
        if (want.d <= NEAR ? !Object.is(within, want.d) : !(within > NEAR)) wrong.push(`種 ${seed} の札 (${r.x}, ${r.y}) の ${NEAR}px 以内の隔たり ${within} が定義 ${want.d} と違う`);
      }
    }
    expect(wrong.slice(0, 10), "道の点の一番近い点と隔たりが、全部の点を見る定義と違う").toEqual([]);
    // 同じ隔たりの点が 2 つ在る時は先の点を返す。札は (12, 0) と (36, 0) から同じだけ離れる
    const twin = new PathPoints([
      [12, 0],
      [12, 40],
      [36, 40],
      [36, 0],
    ]);
    expect(twin.nearest({ x: 23, y: -30, w: 2, h: 10 }).point, "同じ隔たりの点のうち、後の点を返した").toBe(twin.along[0]);
  });
});

/*
 * 箱 2 を開いた aggregator を描く時に、札の候補から道までの隔たりを測る回数 (#3737、#3751)。
 * 1 つ目の札探し (`nearestWithin`) は、直す前は重なりを見る前に 37 万回測った。
 * 置き場の決まらなかった札を探し直す 2 つ目の札探し (`nearest`) は、直す前は格子の全ての点で 3 万 414 回測った。
 * 描く仕事は重いので、件の中でなく file を読み込む段で 1 回だけ描いて両方を数える
 */
const measured = await (async (): Promise<{ within: number; nearest: number } | undefined> => {
  if (typeof spot.PathPoints !== "function") return undefined;
  const { renderDiagram } = await import("../src/index");
  const within = vi.spyOn(spot.PathPoints.prototype, "nearestWithin");
  const nearest = vi.spyOn(spot.PathPoints.prototype, "nearest");
  try {
    renderDiagram(exampleJson("aggregator.json"), { open: [2] });
    return { within: within.mock.calls.length, nearest: nearest.mock.calls.length };
  } finally {
    within.mockRestore();
    nearest.mockRestore();
  }
})();

describe("描く仕事", () => {
  it("pipe-open-aggregator-measures-fewer-spots", () => {
    tools();
    expect(measured?.within, "箱 2 を開いた aggregator.json の札の候補から道までの隔たりを 1 度も測っていない").toBeGreaterThan(0);
    expect(measured?.within, "箱 2 を開いた aggregator.json の札の候補から道までの隔たりを測る回数").toBeLessThan(37_000);
  });

  // 2 つ目の札探しは、点数の下限 (重なりの分と入口までの隔たりの 4 分の 1) だけで今の一番に届かない候補の道を測らない (#3751)
  it("pipe-open-aggregator-skips-far-spots", () => {
    tools();
    expect(measured?.nearest, "箱 2 を開いた aggregator.json の 2 つ目の札探しで道までの隔たりを 1 度も測っていない").toBeGreaterThan(0);
    expect(measured?.nearest, "箱 2 を開いた aggregator.json の 2 つ目の札探しで道までの隔たりを測る回数").toBeLessThan(3_000);
  });
});
