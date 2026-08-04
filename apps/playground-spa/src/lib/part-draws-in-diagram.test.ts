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
).filter(([, v]) => v !== null && typeof v === "object" && "nodes" in (v as object)) as Array<
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
  it("catalog が 80 件ある", () => {
    // 判定の根拠が実データの分布なので、件数が変わったら見直す
    expect(PARTS.length).toBe(80);
  });

  it("2 群は操作パネルの部品の有無で完全に分かれる", () => {
    const withReadouts = PARTS.filter(
      ([, d]) => ((d as { readouts?: unknown[] }).readouts ?? []).length > 0,
    );
    const withoutReadouts = PARTS.filter(
      ([, d]) => ((d as { readouts?: unknown[] }).readouts ?? []).length === 0,
    );
    expect(withReadouts.length, "パネル部品を持つ見本の数が変わった").toBe(17);
    expect(withoutReadouts.length, "図として描く見本の数が変わった").toBe(63);

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
});
