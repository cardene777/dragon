/**
 * 線の曲がり角が、直線の進む向きを逆走していないか (`#1755`)。
 *
 * 角は「手前 14 world で直線を止め、弧で 14 world 先へ抜ける」 形で作る。
 * 通り過ぎると、止まった点から角へ向かう向きが直線の進む向きと逆になり、弧が戻る形の
 * 突起が見える。 描画エンジン側の原因と修正は `cardene777/cdl#801` / `#802` にある。
 *
 * ## 判定は内積の符号だけで行う
 *
 * 長さを見ない = 角の半径を変えても同じ検査が使える。
 * 半径を literal で持つと、engine が半径を変えた日にこの検査だけが独自の値を主張する。
 *
 * ## 母数を出す
 *
 * 「0 件」 は該当なしと測っていないの両方を意味しうるので、走査した図 / 辺 / 角の数を
 * 落ちた時の文面に載せる。 角が 1 個も無い状態で通らないよう、角の数に下限も課す。
 *
 * ## 測れない辺を 0 件側に混ぜない
 *
 * 辺の道筋には `C` (3 次曲線) と `A` (円弧) も現れる。 この 2 つは点の並びが
 * `M` / `L` / `Q` と違うため、同じ読み方をすると誤った点列になる。
 * 測れた本数と測れない本数を別に数え、合計が走査した辺の総数と一致することを確かめる。
 */
import { describe, it, expect } from "vitest";
import { layout } from "@cardenelabs/cdl";

import { 全図 } from "./support/responsive-accepted";

/** 角 1 つ分の行き過ぎ */
interface 行き過ぎ {
  /** 何番目の弧か (0 起点) */
  readonly 弧: number;
  /** 入る側か抜ける側か */
  readonly 側: "手前" | "先";
}

/** 道筋を読めたか */
type 読み取り =
  | { readonly 判定: "測った"; readonly 角: number; readonly 行き過ぎ: readonly 行き過ぎ[] }
  | { readonly 判定: "測れない"; readonly 理由: string };

/** `M` / `L` / `Q` だけで書かれた道筋か */
const 読める道筋か = (d: string): boolean => /^[MLQ\s\d.,-]*$/.test(d);

/** 道筋を点の並びに直す。 弧は制御点を飛ばして終点だけを点として拾う。 */
const 点列 = (d: string): { x: number; y: number }[] => {
  const 点: { x: number; y: number }[] = [];
  for (const m of d.matchAll(/([MLQ])([\s\d.,-]*)/g)) {
    const 数 = (m[2] ?? "")
      .trim()
      .split(/[\s,]+/)
      .map(Number)
      .filter((n) => Number.isFinite(n));
    if (m[1] === "Q") {
      if (数.length >= 4) 点.push({ x: 数[2]!, y: 数[3]! });
      continue;
    }
    for (let i = 0; i + 1 < 数.length; i += 2) 点.push({ x: 数[i]!, y: 数[i + 1]! });
  }
  return 点;
};

/**
 * 角の行き過ぎを数える。
 *
 * 弧の制御点が角の位置で、直線はその手前で止まる。 止まった点から角へ向かう向きが
 * 直線の進む向きと逆なら手前側で通り過ぎている。 抜けた先も同じで、角から抜けた点は
 * 次の直線と同じ向きに出る。
 */
const 角の行き過ぎ = (d: string): 読み取り => {
  if (!読める道筋か(d)) {
    const 使われた = [...new Set([...d.matchAll(/[A-Za-z]/g)].map((m) => m[0]))].sort().join("");
    return { 判定: "測れない", 理由: `M / L / Q 以外の指定を含む (${使われた})` };
  }
  const 点 = 点列(d);
  const 弧 = [
    ...d.matchAll(/Q\s*(-?[\d.]+)[\s,]+(-?[\d.]+)\s*,?\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/g),
  ].map((m) => ({
    cx: Number(m[1]),
    cy: Number(m[2]),
    ex: Number(m[3]),
    ey: Number(m[4]),
  }));
  const 出た: 行き過ぎ[] = [];
  弧.forEach((q, i) => {
    const 抜けた先 = 点.findIndex((p) => p.x === q.ex && p.y === q.ey);
    if (抜けた先 <= 0) return;
    const 入る = 点[抜けた先 - 1]!;
    const 手前の元 = 点[抜けた先 - 2];
    const 次 = 点[抜けた先 + 1];
    if (手前の元) {
      const u = { x: 入る.x - 手前の元.x, y: 入る.y - 手前の元.y };
      const v = { x: q.cx - 入る.x, y: q.cy - 入る.y };
      if (u.x * v.x + u.y * v.y < 0) 出た.push({ 弧: i, 側: "手前" });
    }
    if (次) {
      const w = { x: 次.x - q.ex, y: 次.y - q.ey };
      const z = { x: q.ex - q.cx, y: q.ey - q.cy };
      if (w.x * z.x + w.y * z.y < 0) 出た.push({ 弧: i, 側: "先" });
    }
  });
  return { 判定: "測った", 角: 弧.length, 行き過ぎ: 出た };
};

/**
 * 植え込み対照に使う実物。 `cardene777/cdl#801` で `class-complex-demo` から取り出した
 * `Transaction` → `CardPayment` の道筋で、上へ出る側の角を 14 通り過ぎている。
 */
const 通り過ぎた実物 =
  "M 1613 1544 L 1613 1244 Q 1613 1258, 1627 1258 L 2277 1258 Q 2291 1258, 2291 1272 L 2291 972";

/** 同じ図の、下へ出る側の道筋。 こちらは通り過ぎていない。 */
const 正しい実物 =
  "M 903 972 L 903 1244 Q 903 1258, 917 1258 L 1567 1258 Q 1581 1258, 1581 1272 L 1581 1544";

describe("判定そのものを確かめる (#1755)", () => {
  it("通り過ぎた実物を見つける", () => {
    const r = 角の行き過ぎ(通り過ぎた実物);
    expect(r.判定).toBe("測った");
    if (r.判定 !== "測った") return;
    expect(r.角).toBe(2);
    expect(r.行き過ぎ).toEqual([
      { 弧: 0, 側: "手前" },
      { 弧: 1, 側: "先" },
    ]);
  });

  it("正しい実物は見つけない", () => {
    const r = 角の行き過ぎ(正しい実物);
    expect(r.判定).toBe("測った");
    if (r.判定 !== "測った") return;
    expect(r.角).toBe(2);
    expect(r.行き過ぎ).toEqual([]);
  });

  it("角を持たない道筋は 0 件になる", () => {
    const r = 角の行き過ぎ("M 10 10 L 10 200");
    expect(r.判定).toBe("測った");
    if (r.判定 !== "測った") return;
    expect(r.角).toBe(0);
    expect(r.行き過ぎ).toEqual([]);
  });

  it("M / L / Q 以外を含む道筋は測れないと答える (0 件に潰さない)", () => {
    const r = 角の行き過ぎ("M 10 10 C 20 20 30 30 40 40");
    expect(r.判定).toBe("測れない");
    if (r.判定 !== "測れない") return;
    expect(r.理由).toContain("C");
  });
});

/** カタログの全図を 1 度だけ走査して、辺ごとの読み取りを集める。 */
const 走査 = (() => {
  const 測った: { 図: number; 辺: string; 角: number; 行き過ぎ: readonly 行き過ぎ[]; d: string }[] = [];
  const 測れない: { 図: number; 辺: string; 理由: string }[] = [];
  const 組めない: number[] = [];
  let 辺 = 0;
  全図.forEach((g, i) => {
    let laid: ReturnType<typeof layout>;
    try {
      laid = layout(g);
    } catch {
      組めない.push(i);
      return;
    }
    for (const e of laid.edges) {
      辺 += 1;
      const r = 角の行き過ぎ(e.d);
      if (r.判定 === "測れない") {
        測れない.push({ 図: i, 辺: e.id ?? "(id なし)", 理由: r.理由 });
      } else {
        測った.push({ 図: i, 辺: e.id ?? "(id なし)", 角: r.角, 行き過ぎ: r.行き過ぎ, d: e.d });
      }
    }
  });
  const 角 = 測った.reduce((a, b) => a + b.角, 0);
  return { 図: 全図.length, 辺, 測った, 測れない, 組めない, 角 };
})();

const 母数の文 =
  `図 ${走査.図} 枚 / 辺 ${走査.辺} 本 ` +
  `(測った ${走査.測った.length} / 測れない ${走査.測れない.length}) / 角 ${走査.角} 個`;

describe("カタログの全図に角の行き過ぎが無い (#1755)", () => {
  it("角の行き過ぎが 0 件", () => {
    const 出た = 走査.測った
      .filter((e) => e.行き過ぎ.length > 0)
      .map((e) => `図 ${e.図} の ${e.辺}: ${e.行き過ぎ.map((o) => `弧 ${o.弧} の ${o.側}`).join(" / ")}\n  ${e.d}`);
    expect(出た, `${母数の文}\n${出た.join("\n")}`).toEqual([]);
  });

  it("走査した角が 1 個以上ある (検査が空振りしていない)", () => {
    expect(走査.角, `角を 1 つも走査していない (${母数の文})`).toBeGreaterThan(0);
  });

  it("走査した辺が 1 本以上ある (検査が空振りしていない)", () => {
    expect(走査.辺, `辺を 1 本も走査していない (${母数の文})`).toBeGreaterThan(0);
  });

  it("母数の内訳が走査した辺の総数と一致する", () => {
    expect(走査.測った.length + 走査.測れない.length, 母数の文).toBe(走査.辺);
  });

  it("図を 1 枚も取りこぼしていない", () => {
    expect(走査.組めない, `組めなかった図がある (${母数の文})`).toEqual([]);
  });

  it("測れない辺は M / L / Q 以外を含むものに限る", () => {
    const 理由 = [...new Set(走査.測れない.map((e) => e.理由))].sort();
    for (const r of 理由) expect(r).toContain("M / L / Q 以外の指定を含む");
  });
});
