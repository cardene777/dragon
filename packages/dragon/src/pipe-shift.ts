/**
 * 配管の図の札を置く隙間を作るために、図の座標をずらす道具 (#3751)。
 *
 * 描く処理は札の置き場が見つからない時、切れ目より先 (下か右) の物をずらして試し、試した後に元へ戻す。
 * ずらす相手は、図の中の数の 2 つ組 (道の点) と、座標と大きさの欄を持つ物 (箱、札、線の端)。
 * 札を置く間は図に物を足し引きせず数だけを書き換えるので、ずらす相手は変わらない。
 * 1 回目にずらす時に図の全てを辿って相手を軸ごとに並べ、2 回目からは並べた相手だけを見る。
 * 図の全てを辿ってずらす定義と同じ値へずらし、同じ値へ戻す (`test/pipe-shift.test.ts`)
 */

/** 切れ目。数か、物の縦の位置から切れ目を返す関数 (段の間の高さで折る切れ目) */
export type ShiftCut = number | ((y: number) => number);

type Axis = "x" | "y";
type Loose = Record<string | number, unknown>;

/** 軸ごとの、ずらす座標の欄と伸ばす大きさの欄 */
const POS: Readonly<Record<Axis, readonly string[]>> = { y: ["y", "y1", "y2", "cy", "base"], x: ["x", "x1", "x2", "cx"] };
const SIZE: Readonly<Record<Axis, "w" | "h">> = { y: "h", x: "w" };
/** 軸ごとに書き換えうる欄 (座標と大きさ) */
const KEYS: Readonly<Record<Axis, readonly string[]>> = { y: [...POS.y, SIZE.y], x: [...POS.x, SIZE.x] };

/** 物の縦の位置。関数の切れ目は、この高さで切れ目を選ぶ */
const yOf = (o: Loose): number =>
  typeof o.y === "number" ? o.y + (typeof o.h === "number" ? o.h / 2 : 0) : typeof o.y1 === "number" ? Math.min(o.y1, Number(o.y2)) : typeof o.cy === "number" ? o.cy : typeof o.base === "number" ? o.base : 0;

/** 1 つの軸でずらす相手。数の 2 つ組と、その軸の座標か大きさの欄を持つ物とその欄の名前 */
interface Slots {
  pairs: number[][];
  recs: { rec: Loose; keys: string[] }[];
}

/**
 * 物 `rec` の、軸 `axis` の座標の欄 `keys` を切れ目より先なら `d` だけずらし、切れ目をまたぐ物は大きさを `d` だけ伸ばす。
 * 切れ目は物の縦の位置で選び、またぐかはずらす前の座標と大きさで決める
 */
function moveRecord(rec: Loose, keys: readonly string[], axis: Axis, cutOf: (y: number) => number, d: number, put: (o: Loose, k: string | number, v: number) => void): void {
  const c0 = cutOf(yOf(rec));
  const size = SIZE[axis];
  const lead = rec[axis];
  const span = rec[size];
  const across = typeof lead === "number" && typeof span === "number" && lead < c0 && lead + span > c0;
  for (const k of keys) {
    const v = rec[k];
    if (typeof v !== "number") continue;
    if (k === size) {
      if (across) put(rec, k, v + d);
    } else if (v > c0) put(rec, k, v + d);
  }
}

/** 数の 2 つ組か。道の点はこの形で持つ */
const isPair = (o: unknown[]): boolean => o.length === 2 && typeof o[0] === "number" && typeof o[1] === "number";

export class Shifter {
  private index: { all: WeakSet<object>; x: Slots; y: Slots } | undefined;

  /** `root` は図の全体。頭の `width` と `height` は図の大きさで、ずらした分だけ伸ばす */
  constructor(private readonly root: Loose) {}

  /** 図の全てを 1 度だけ辿り、ずらす相手を軸ごとに並べる。図の頭の数と大きさの欄は辿らない */
  private slots(): { all: WeakSet<object>; x: Slots; y: Slots } {
    if (this.index) return this.index;
    const all = new WeakSet<object>();
    const pairs: number[][] = [];
    const recs: { rec: Loose; keys: string[] }[] = [];
    const visit = (o: unknown): void => {
      if (o === null || typeof o !== "object" || all.has(o)) return;
      all.add(o);
      if (Array.isArray(o)) {
        if (isPair(o)) pairs.push(o as number[]);
        else for (const v of o) visit(v);
        return;
      }
      const rec = o as Loose;
      const keys: string[] = [];
      for (const [k, v] of Object.entries(rec)) {
        if (typeof v === "number") keys.push(k);
        else visit(v);
      }
      if (keys.length > 0) recs.push({ rec, keys });
    };
    for (const [k, v] of Object.entries(this.root)) if (k !== "width" && k !== "height") visit(v);
    const pick = (axis: Axis): Slots => ({
      pairs,
      recs: recs.flatMap(({ rec, keys }) => {
        const own = keys.filter((k) => KEYS[axis].includes(k));
        return own.length > 0 ? [{ rec, keys: own }] : [];
      }),
    });
    this.index = { all, x: pick("x"), y: pick("y") };
    return this.index;
  }

  /**
   * 切れ目 `cut` より先の物を軸 `axis` の向きに `d` だけずらし、切れ目をまたぐ物は伸ばし、図の大きさも伸ばす。
   * `extra` は図の外の物 (先に置いた札の枠) で、図の中の物は 2 度ずらさない。元へ戻す関数を返す
   */
  shift(axis: Axis, cut: ShiftCut, d: number, extra: readonly object[]): () => void {
    const log: [Loose, string | number, unknown][] = [];
    const put = (o: Loose, k: string | number, v: number): void => {
      log.push([o, k, o[k]]);
      o[k] = v;
    };
    const cutOf = typeof cut === "function" ? cut : () => cut;
    const index = this.slots();
    const slots = index[axis];
    const at = axis === "y" ? 1 : 0;
    for (const o of slots.pairs) if ((o[at] as number) > cutOf(o[1] as number)) put(o as unknown as Loose, at, (o[at] as number) + d);
    for (const { rec, keys } of slots.recs) moveRecord(rec, keys, axis, cutOf, d, put);
    // 図の外の物は毎回辿る。図の中の物と、2 か所から指す同じ物は 1 度だけずらす
    const seen = new WeakSet<object>();
    const walk = (o: unknown): void => {
      if (o === null || typeof o !== "object" || index.all.has(o) || seen.has(o)) return;
      seen.add(o);
      if (Array.isArray(o)) {
        if (isPair(o)) {
          if ((o[at] as number) > cutOf(o[1] as number)) put(o as unknown as Loose, at, (o[at] as number) + d);
        } else for (const v of o) walk(v);
        return;
      }
      const rec = o as Loose;
      moveRecord(rec, Object.keys(rec).filter((k) => KEYS[axis].includes(k)), axis, cutOf, d, put);
      for (const v of Object.values(rec)) if (typeof v !== "number") walk(v);
    };
    for (const e of extra) walk(e);
    const side = axis === "y" ? "height" : "width";
    put(this.root, side, (this.root[side] as number) + d);
    return () => {
      for (let i = log.length - 1; i >= 0; i--) {
        const [o, k, v] = log[i] as [Loose, string | number, unknown];
        o[k] = v;
      }
    };
  }
}
