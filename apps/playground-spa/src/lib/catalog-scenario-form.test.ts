/**
 * 表示部品を 2 個以上持つ図が、手本の形になっていることの検証 (#1033)。
 *
 * 手本 (`exemplarPaymentFlow` 等) は「段を進めると状態が動き、表示部品がそれを見て変化する」。
 * 直す前は 25 件すべてが段 1 つで、表示部品は初期値を出したまま動かなかった。
 *
 * **25 件のうち 14 件は構造的に届かない**。 表示部品が見ている状態を入力欄が握っており、
 * 入力欄の値は段の値を上書きするため (`packages/cdl` の `render.tsx` で実測)、段で動かしても効かない。
 * これらは #1034 と同じ「段ごとに注目する箱が変わる」 を基準にする。
 */
import { describe, it, expect } from "vitest";
import * as Interactive from "@/topics/catalog/interactive.cdl";

/**
 * 段で表示部品を動かせる 11 件。
 *
 * 表示部品が見る状態を入力欄が持っていないため、段の `tween` / `set` がそのまま表示に届く。
 */
const DRIVEN = [
  "timelineDrive", "arraySignalHistogram", "arrayLineChart", "arrayStackedBar",
  "arrayWaterfall", "eip1559GasFlow", "interactiveOauthFlow", "portfolioDonut",
  "kpiDashboard", "abTestResult", "canvasMiniMap",
] as const;

/**
 * 表示部品が見る状態を入力欄が握っている 14 件。
 *
 * 入力欄の値は段の値を上書きするため (`packages/cdl` の `render.tsx` で実測)、
 * 段で動かしても効かない。 これらは #1034 と同じ基準 (段ごとに注目する箱が変わる) を使う。
 */
const INPUT_DRIVEN = [
  "visualBindBar", "visualBindOpacity", "xypadNavigate", "stepperControl",
  "numberSparkline", "radioSelect", "colorPickerTheme", "dynamicReadouts",
  "readoutVariety", "gridLayoutMatrix", "pathProgressDemo", "revenueKpiCard",
  "kpiBullet", "buildStatusTrafficLight",
] as const;

type Diagram = {
  inputs?: Array<{ id?: string }>;
  readouts?: Array<{ source?: string; sourceA?: string; sourceB?: string }>;
  nodes?: Array<{ id?: string }>;
  phases?: Array<{
    tweens?: Array<{ stateId?: string }>;
    sets?: Array<{ stateId?: string }>;
    activate?: string[];
    title?: string;
    body?: string;
  }>;
};

const mod = Interactive as unknown as Record<string, Diagram>;
const ALL = [...DRIVEN, ...INPUT_DRIVEN];

/** 段が動かす状態の集合。 */
function drivenStates(d: Diagram): Set<string> {
  const out = new Set<string>();
  for (const p of d.phases ?? []) {
    for (const t of p.tweens ?? []) if (t.stateId) out.add(t.stateId);
    for (const s of p.sets ?? []) if (s.stateId) out.add(s.stateId);
  }
  return out;
}

/** 表示部品が見る状態。 積み上げ棒は `sourceA` / `sourceB` で 2 つ見る。 */
function readoutSources(d: Diagram): string[] {
  return (d.readouts ?? []).flatMap((r) => [r.source, r.sourceA, r.sourceB]).filter(Boolean) as string[];
}

describe("手本の形 (#1033)", () => {
  it("対象が全件 実在する", () => {
    const missing = ALL.filter((k) => mod[k] === undefined);
    expect(missing, `図が無い: ${missing.join(", ")}`).toHaveLength(0);
  });

  it("対象は表示部品を 2 個以上持つ、または種別が他と重なる", () => {
    // 表示部品 1 個 + 種別が唯一の図は「部品の見本」 で、別の基準で見る (#1032)
    const none = ALL.filter((k) => (mod[k]?.readouts ?? []).length === 0);
    expect(none, `表示部品を持たない図が混ざっている: ${none.join(", ")}`).toHaveLength(0);
  });

  it("段が 3 つ以上ある", () => {
    const few = ALL.filter((k) => (mod[k]?.phases ?? []).length < 3)
      .map((k) => `${k}: ${(mod[k]?.phases ?? []).length}`);
    expect(few, `段が足りない: ${few.join(", ")}`).toHaveLength(0);
  });

  it("表示部品が段で動く状態を見ている", () => {
    // 手本の核心。 段が動かす状態を表示部品が見ていないと、進めても表示が変わらない
    const unlinked = DRIVEN.filter((k) => {
      const d = mod[k]!;
      const driven = drivenStates(d);
      return !readoutSources(d).some((s) => driven.has(s));
    });
    expect(unlinked, `表示部品が動く状態を見ていない: ${unlinked.join(", ")}`).toHaveLength(0);
  });

  it("段を通して表示部品の値が実際に変わる", () => {
    // 連動があるだけでは足りない。 `tween(x, 50, 50)` のように動かない指定でも
    // 「見ている」 は成立してしまう。 段を通した値の並びに 2 種類以上あることを見る
    const still = DRIVEN.filter((k) => {
      const d = mod[k]!;
      const srcs = new Set(readoutSources(d));
      for (const src of srcs) {
        const seq: string[] = [];
        for (const p of d.phases ?? []) {
          for (const t of p.tweens ?? []) if (t.stateId === src) seq.push(`${(t as { from?: unknown }).from}->${(t as { to?: unknown }).to}`);
          for (const st of p.sets ?? []) if (st.stateId === src) seq.push(String((st as { value?: unknown }).value));
        }
        // 1 つの状態でも値が 2 種類以上あれば、その表示部品は段で動く
        if (new Set(seq).size >= 2) return false;
      }
      return true;
    });
    expect(still, `段を通して値が変わらない: ${still.join(", ")}`).toHaveLength(0);
  });

  it("段は入力欄が握る状態を触らない", () => {
    // 触ると実行時に入力欄の値で上書きされる。 書いてあると「動くはず」 と誤読される
    const bad: string[] = [];
    for (const k of ALL) {
      const d = mod[k]!;
      const inputIds = new Set((d.inputs ?? []).map((i) => i.id));
      for (const st of drivenStates(d)) if (inputIds.has(st)) bad.push(`${k}: ${st}`);
    }
    expect(bad, `入力欄の状態を段が触っている: ${bad.join(", ")}`).toHaveLength(0);
  });

  it("段ごとに注目する箱の組合せが変わる", () => {
    const dup = ALL.filter((k) => {
      const sets = (mod[k]?.phases ?? []).map((p) => (p.activate ?? []).join(","));
      return new Set(sets).size < sets.length;
    });
    expect(dup, `同じ組合せの段がある: ${dup.join(", ")}`).toHaveLength(0);
  });

  it("光らせる箱が実在する", () => {
    const bad: string[] = [];
    for (const k of ALL) {
      const ids = new Set((mod[k]?.nodes ?? []).map((n) => n.id));
      for (const p of mod[k]?.phases ?? []) {
        for (const a of p.activate ?? []) if (!ids.has(a)) bad.push(`${k}: ${a}`);
      }
    }
    expect(bad, `存在しない箱を指している: ${bad.join(", ")}`).toHaveLength(0);
  });

  it("段に題と説明がある", () => {
    const bad: string[] = [];
    for (const k of ALL) {
      for (const [i, p] of (mod[k]?.phases ?? []).entries()) {
        if (!p.title || p.title.length < 3) bad.push(`${k}[${i}]: 題が無い`);
        if (!p.body || p.body.length < 20) bad.push(`${k}[${i}]: 説明が短い`);
      }
    }
    expect(bad, `段の説明が足りない: ${bad.join(", ")}`).toHaveLength(0);
  });
});
