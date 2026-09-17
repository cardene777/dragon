/**
 * 図の中に描かれる部品を持つかの判定 (`partDrawsInDiagram`) を、実 catalog で固定する (#1017)。
 *
 * 見本の中には実体が操作パネルの部品 (`readouts`) だけのものがある。 配置計算も描画も
 * `readouts` を図の中では扱わないため、重ねても図には出ない。 画面で `getBBox()` を測ると
 * 描画範囲が 0x0 で、実体は図の外に 14x14 px の部品として描かれていた。
 *
 * 合成した見本ではなく **実 catalog 80 件** で見る。 判定の根拠が実データの分布なので、
 * catalog の作りが変わった時に気付けるようにする。
 */
import { describe, it, expect } from "vitest";
import { layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { partDrawsInDiagram } from "@cardenelabs/dragon";
import * as PartsMod from "@/topics/catalog/parts.cdl";

/** catalog の見本を全件取り出す。 */
const PARTS: Array<[string, CdlDiagram]> = Object.entries(
  PartsMod as Record<string, unknown>,
).filter(([, v]) => v !== null && typeof v === "object" && "nodes" in v) as Array<
  [string, CdlDiagram]
>;

/** 箱の外接矩形が図枠に対してどれだけの面積を占めるか。 */
function boxRatio(part: CdlDiagram): number {
  const own = layout(part);
  if (own.nodes.length === 0) return 0;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const n of own.nodes) {
    x0 = Math.min(x0, n.cx - n.w / 2);
    x1 = Math.max(x1, n.cx + n.w / 2);
    y0 = Math.min(y0, n.cy - n.h / 2);
    y1 = Math.max(y1, n.cy + n.h / 2);
  }
  return ((x1 - x0) * (y1 - y0)) / (own.viewBox.w * own.viewBox.h);
}

describe("図の中に描かれるかの判定 (#1017)", () => {
  it("catalog が 94 件ある", () => {
    // 判定の根拠が実データの分布なので、件数が変わったら見直す
    expect(PARTS.length).toBe(94);
  });

  it("2 群は操作パネルの部品の有無で完全に分かれる", () => {
    const withReadouts = PARTS.filter(
      ([, d]) => ((d as { readouts?: unknown[] }).readouts ?? []).length > 0,
    );
    const withoutReadouts = PARTS.filter(
      ([, d]) => ((d as { readouts?: unknown[] }).readouts ?? []).length === 0,
    );
    expect(withReadouts.length, "パネル部品を持つ見本の数が変わった").toBe(17);
    expect(withoutReadouts.length, "図として描く見本の数が変わった").toBe(77);

    // 境目に入る件が無いことが、閾値ではなく構造で分けられる根拠
    const maxWith = Math.max(...withReadouts.map(([, d]) => boxRatio(d)));
    const minWithout = Math.min(...withoutReadouts.map(([, d]) => boxRatio(d)));
    expect(maxWith, "パネル部品側に実体を持つ箱がある").toBeLessThan(0.01);
    expect(minWithout, "図として描く側に極小の箱がある").toBeGreaterThan(0.1);
  });

  it("パネル部品だけの見本を「描かない」 と判定する", () => {
    const boxless = PARTS.filter(([, d]) => !partDrawsInDiagram(d));
    expect(boxless.length, "判定される件数が実データと合わない").toBe(17);
    for (const [id, d] of boxless) {
      expect(
        ((d as { readouts?: unknown[] }).readouts ?? []).length,
        `${id} はパネル部品を持たないのに弾かれている`,
      ).toBeGreaterThan(0);
    }
  });

  it("図として描く見本は全件通す", () => {
    for (const [id, d] of PARTS) {
      const hasReadouts = ((d as { readouts?: unknown[] }).readouts ?? []).length > 0;
      if (hasReadouts) continue;
      expect(partDrawsInDiagram(d), `${id} が誤って弾かれている`).toBe(true);
    }
  });

  it("パネル部品と箱を両方持つ見本は通す", () => {
    // 現状 catalog に無いが作れる形。 `readouts` の有無だけで弾くと、この形が巻き込まれる
    const both = PARTS.find(([, d]) => partDrawsInDiagram(d))![1];
    const mixed = {
      ...both,
      readouts: [{ id: "r", kind: "gauge", source: "{v}", nodeId: both.nodes[0]?.id ?? "n" }],
    } as unknown as CdlDiagram;
    expect(partDrawsInDiagram(mixed), "箱を持つのに弾かれている").toBe(true);
  });

  it("測れない図は通す", () => {
    // 弾く側に倒すと、測れないだけの見本が使えなくなる
    expect(partDrawsInDiagram({} as CdlDiagram)).toBe(true);
  });

  it("組み立てられない図もパネル部品を持てば通す", () => {
    // `readouts` を持つだけでは弾かない。 測れなかった時は「持っている」 側に倒す
    const broken = {
      readouts: [{ id: "r", kind: "gauge", source: "{v}" }],
    } as unknown as CdlDiagram;
    expect(partDrawsInDiagram(broken)).toBe(true);
  });

  it("パネル部品の持ち方が変でも落ちない", () => {
    // catalog は呼出側が渡すので、配列でない値が来ることがある
    for (const readouts of [null, undefined, 0, "x", {}]) {
      const d = { ...PARTS[0]![1], readouts } as unknown as CdlDiagram;
      expect(partDrawsInDiagram(d), `readouts=${JSON.stringify(readouts)} で落ちた`).toBe(true);
    }
  });

  it("境目の値で判定が切り替わる", () => {
    // 1% という値そのものを固定する。 実測した面積比は 10 四方 = 0.00123、
    // 100 四方 = 0.06784。 閾値を動かすとどちらかの期待が変わる
    const withSide = (side: number): CdlDiagram =>
      ({
        readouts: [{ id: "r", kind: "gauge", source: "{v}" }],
        lanes: [{ id: "l", x: 0, width: 1000 }],
        nodes: [{ id: "n", lane: "l", stack: 0, kind: "card", title: "n", w: side, h: side }],
        edges: [],
        states: [],
        phases: [],
      }) as unknown as CdlDiagram;

    expect(partDrawsInDiagram(withSide(10)), "極小の箱を通している (比 0.00123)").toBe(false);
    expect(partDrawsInDiagram(withSide(100)), "実体のある箱を弾いている (比 0.06784)").toBe(true);
  });

  it("桁の大きい図でも面積比が壊れない", () => {
    // 面積を先に出すと Infinity / Infinity = NaN になり「描かない」 側に倒れる
    const huge = {
      readouts: [{ id: "r", kind: "gauge", source: "{v}" }],
      lanes: [{ id: "l", x: 0, width: 1e200 }],
      nodes: [{ id: "n", lane: "l", stack: 0, kind: "card", title: "n", w: 1e200, h: 1e200 }],
      edges: [],
      states: [],
      phases: [],
    } as unknown as CdlDiagram;
    expect(partDrawsInDiagram(huge), "桁の大きい図で誤判定している").toBe(true);
  });

  it("桁が溢れる形でも判定が反転しない", () => {
    // 面積を先に出すと、比 0.001 (「描かない」 が正しい) が Infinity / Infinity = NaN に
    // なって「描く」 に倒れる。 辺ごとに割る形でしか正しく出ない
    const overflow = {
      readouts: [{ id: "r", kind: "gauge", source: "{v}" }],
      lanes: [{ id: "l", x: 0, width: 1.7e308 }],
      nodes: [{ id: "n", lane: "l", stack: 0, kind: "card", title: "n", w: 1.7e305, h: 1e4 }],
      edges: [],
      states: [],
      phases: [],
    } as unknown as CdlDiagram;
    expect(partDrawsInDiagram(overflow), "桁が溢れて判定が反転している").toBe(false);
  });

  it("閾値は 1%", () => {
    // 境目を挟む 2 点で 1% そのものを固定する。 実測した面積比は
    // 箱の幅 50 で 0.00960、55 で 0.01056。 閾値を動かすとどちらかの期待が外れる
    const withWidth = (w: number): CdlDiagram =>
      ({
        readouts: [{ id: "r", kind: "gauge", source: "{v}" }],
        lanes: [{ id: "l", x: 0, width: 10000 }],
        nodes: [{ id: "n", lane: "l", stack: 0, kind: "card", title: "n", w, h: 10000 }],
        edges: [],
        states: [],
        phases: [],
      }) as unknown as CdlDiagram;

    expect(partDrawsInDiagram(withWidth(50)), "1% 未満 (0.00960) を通している").toBe(false);
    expect(partDrawsInDiagram(withWidth(55)), "1% 超 (0.01056) を弾いている").toBe(true);
  });
});
