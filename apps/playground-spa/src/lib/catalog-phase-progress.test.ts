/**
 * 表示部品を持たない図に、段の進行があることの検証 (#1034)。
 *
 * これらは入力欄 / 図形 / 配置そのものを見せる素材で、表示部品を持たない。 段が 1 つしか
 * ないと開いても静止画と変わらず、何が起きるのかが伝わらない。
 *
 * **状態は動かさない**。 入力欄の値は段の値を上書きするため (実測 = `render.tsx` が
 * `stateOverrides` を `computeStateValues` の結果に重ねる)、段で状態を動かしても効かない。
 * 代わりに「どの箱に注目するか」 を段で進める。
 */
import { describe, it, expect } from "vitest";
import * as Interactive from "@/topics/catalog/interactive.cdl";
import { 表示部品を持たない見本 } from "./catalog-interactive-groups";

/** 表示部品を持たない図 (#1034 の対象)。 */
const TARGETS = [
  "inputSliderBar", "formulaTextBind", "scrollNarrative", "clickToggle",
  "shapeRectFill", "shapeChainFill", "shapeCirclePulse", "shapeArcSweep",
  "shapeWaveTank", "shapePolyRotate", "repeatDeriveChain", "edgeFlowBind",
  "inputVariety", "eventVariety", "radialHubAndSpoke", "renderOffsetDrift",
  "decisionTree",
  // ここから下は #2318 で足した 4 件。 表示部品を持たないのに宣言に無く、
  // この describe の検査に 1 度も当たっていなかった
  "eventTargets",
  "pattern__clickToggle__値のまま描く",
  "pattern__formulaTextBind__名前のまま描く",
  "pattern__inputVariety__日時の入力",
] as const;

type Diagram = {
  readouts?: unknown[];
  inputs?: Array<{ id?: string }>;
  nodes?: Array<{ id?: string }>;
  phases?: Array<{
    activate?: string[];
    tweens?: unknown[];
    sets?: unknown[];
    title?: string;
    body?: string;
  }>;
};

const mod = Interactive as unknown as Record<string, Diagram>;

describe("段の進行 (#1034)", () => {
  it("対象が全件 実在する", () => {
    // 名前を打ち間違えると以下の検証が素通りする
    const missing = TARGETS.filter((k) => mod[k] === undefined);
    expect(missing, `図が無い: ${missing.join(", ")}`).toHaveLength(0);
  });

  it("対象が、表示部品を持たない図と 1 件も違わない (#2318)", () => {
    /*
     * 以前は「宣言に在る名前が実在する」 だけを見ており、**実在するのに宣言に無い** 図が
     * 4 件あった。 その 4 件はこの describe の検査に 1 度も当たっていなかった。
     *
     * 図から導いた一覧と両方向で突き合わせる。 見本を足すと、宣言に足すまで落ちる。
     */
    const 導いた = 表示部品を持たない見本(mod);
    expect(導いた.length, "表示部品を持たない図を 1 件も導けていない (検査が空振りしている)").toBeGreaterThan(
      0,
    );
    expect([...TARGETS].sort(), `図から導いた ${導いた.length} 件と突き合わせた`).toEqual(導いた);
  });

  it("対象は表示部品を持たない (分類の前提)", () => {
    // 表示部品を持つ図は別の基準 (段ごとに表示が変化する) で見る
    const withRo = TARGETS.filter((k) => (mod[k]?.readouts ?? []).length > 0);
    expect(withRo, `表示部品を持つ図が混ざっている: ${withRo.join(", ")}`).toHaveLength(0);
  });

  it("段が 3 つ以上ある", () => {
    const few = TARGETS.filter((k) => (mod[k]?.phases ?? []).length < 3)
      .map((k) => `${k}: ${(mod[k]?.phases ?? []).length}`);
    expect(few, `段が足りない: ${few.join(", ")}`).toHaveLength(0);
  });

  it("段ごとに注目する箱の組合せが変わる", () => {
    // 同じ組合せの段が並ぶと、進めても見た目が変わらない。
    // 並び順で比べると、同じ集合を並べ替えただけの段を見逃す
    const key = (a: string[] = []) => [...new Set(a)].sort().join(",");
    const dup = TARGETS.filter((k) => {
      const sets = (mod[k]?.phases ?? []).map((p) => key(p.activate));
      return new Set(sets).size < sets.length;
    });
    expect(dup, `同じ組合せの段がある: ${dup.join(", ")}`).toHaveLength(0);
  });

  it("段は状態を一切動かさない", () => {
    // これらの図の状態は入力欄が握っており、段で動かしても上書きされる。
    // 書いてあると「動くはず」 と誤読されるため、1 つも無いことを固定する
    const bad: string[] = [];
    for (const k of TARGETS) {
      for (const [i, p] of (mod[k]?.phases ?? []).entries()) {
        if ((p.tweens ?? []).length > 0) bad.push(`${k}[${i}]: tween`);
        if ((p.sets ?? []).length > 0) bad.push(`${k}[${i}]: set`);
      }
    }
    expect(bad, `段が状態を動かしている: ${bad.join(", ")}`).toHaveLength(0);
  });

  it("注目する箱が段を追うごとに増える (最終段の絞り込みは除く)", () => {
    // 「異なる」 だけでは、順序を入れ替える変異や無関係な箱への差し替えを検出できない。
    // 進行は積み上げが基本で、箱が 2 個しかない図だけ最終段で絞る
    const NARROW = new Set(["inputSliderBar", "renderOffsetDrift"]);
    // 例外の前提 = 箱が 2 個しかないため、積み上げでは 3 段目を作れない
    for (const k of NARROW) {
      expect((mod[k]?.nodes ?? []).length, `${k} は箱 2 個の前提が崩れている`).toBe(2);
    }
    /*
     * 段が **操作の種類** を見せる図 (#2318)。 積み上げでは書けない。
     *
     * `eventTargets` は「箱を動かす・落とす」「矢印と縦列を押す」「図に出入りする」 の
     * 3 種類を 1 段ずつ見せる。 どの箱が関わるかは種類ごとに違い、段 1 では段 0 の
     * `落とす先` が外れて `窓口` が入る。 積み上げにすると「この種類では関わらない箱」 が
     * 光ったままになり、種類の区別が消える。
     *
     * 代わりに **段ごとに組合せが変わり、空にならず、箱が実在する** ことを見る
     * (組合せが変わることは上の検査が全対象に課している)。
     */
    const 種類ごと = new Set(["eventTargets"]);
    for (const k of 種類ごと) {
      const ph = mod[k]?.phases ?? [];
      const 題 = ph.map((p) => p.title ?? "");
      expect(new Set(題).size, `${k} は段ごとに違う種類を見せる前提が崩れている`).toBe(ph.length);
      for (let i = 0; i < ph.length; i += 1) {
        expect((ph[i]!.activate ?? []).length, `${k}[${i}] が空`).toBeGreaterThan(0);
      }
    }
    const bad: string[] = [];
    for (const k of TARGETS) {
      if (種類ごと.has(k)) continue;
      const ph = mod[k]?.phases ?? [];
      for (let i = 1; i < ph.length; i += 1) {
        const prev = new Set(ph[i - 1]!.activate ?? []);
        const cur = new Set(ph[i]!.activate ?? []);
        const isLast = i === ph.length - 1;
        if (NARROW.has(k) && isLast) {
          // 絞る段は、直前の集合の一部だけを指す (空にはしない)
          const outside = [...cur].filter((a) => !prev.has(a));
          if (outside.length > 0) bad.push(`${k}[${i}]: 絞る段が新しい箱を出した (${outside.join(",")})`);
          if (cur.size === 0) bad.push(`${k}[${i}]: 絞る段が空`);
          if (cur.size >= prev.size) bad.push(`${k}[${i}]: 絞れていない`);
          continue;
        }
        const dropped = [...prev].filter((a) => !cur.has(a));
        if (dropped.length > 0) bad.push(`${k}[${i}]: 前段の箱が消えた (${dropped.join(",")})`);
        // 増えないと進行として見えない
        if (cur.size <= prev.size) bad.push(`${k}[${i}]: 箱が増えていない`);
      }
    }
    expect(bad, `段の進行が積み上がっていない: ${bad.join(", ")}`).toHaveLength(0);
  });

  it("光らせる箱が実在する", () => {
    // 綴りを誤ると光らないだけで、何も知らせない
    const bad: string[] = [];
    for (const k of TARGETS) {
      const ids = new Set((mod[k]?.nodes ?? []).map((n) => n.id));
      for (const p of mod[k]?.phases ?? []) {
        for (const a of p.activate ?? []) if (!ids.has(a)) bad.push(`${k}: ${a}`);
      }
    }
    expect(bad, `存在しない箱を指している: ${bad.join(", ")}`).toHaveLength(0);
  });

  it("段に題と説明がある", () => {
    // 段を進めた時に何が起きたかを読む手がかりになる
    const bad: string[] = [];
    for (const k of TARGETS) {
      for (const [i, p] of (mod[k]?.phases ?? []).entries()) {
        if (!p.title || p.title.length < 3) bad.push(`${k}[${i}]: 題が無い`);
        if (!p.body || p.body.length < 20) bad.push(`${k}[${i}]: 説明が短い`);
      }
    }
    expect(bad, `段の説明が足りない: ${bad.join(", ")}`).toHaveLength(0);
  });
});
