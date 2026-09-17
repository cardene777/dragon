import { describe, expect, it } from "vitest";
import { layout, type CdlDiagram, type LaidDiagram } from "@cardenelabs/cdl";

import * as 部品 from "@/topics/catalog/parts.cdl";
import * as 見本 from "@/topics/catalog/parts-motion.cdl";

/**
 * 振り分け器と合流点の線が、段を作らずに箱へ入る (#2154)。
 *
 * 描画側は、同じ箱の同じ辺に入る線の終点を辺に沿って離す (`fanIncomingEndpoints`)。 合流点の出口を
 * 入口 A と同じ段に置くと、真横に入るはずの線の終点が中心から上へ動き、出口の手前に 28 の小さな段が
 * 残っていた (実測 = `M 210 218 L 250 218 L 250 190 L 438 190`)。
 *
 * 出口を 2 つの入口の真ん中の段に置き、2 本が上下対称に折れて入る形にした。 振り分け器も入口を
 * 2 つの出口の真ん中の段に置く = 合流点だけを変えると、繋いだ見本で振り分け器の出口 B と合流点の
 * 入口 B の高さがずれ、部品どうしの矢印が折れる。 同じ段は小さな網 (`parts-mini-network`) の終点にも
 * あった (実測 = `M 642 218 L 682 218 L 682 190 L 894 190`) ので、全部品の頁を見る。
 *
 * | 何を見るか | 落ちる形 |
 * |---|---|
 * | 全部品の頁の中の線に、長さ 40 未満の縦の区間が無い | 終点を離した分だけ残る小さな段 |
 * | 合流点の 2 本の終点が、出口の箱の中心から上下に同じ距離 | 片方だけが真横に入り、もう片方が遠くから折れて入る形 |
 * | 繋いだ見本で、部品どうしの 2 本の矢印に縦の区間が無い | 2 つの部品の段がずれて、矢印が折れる形 |
 */

/** 線の道筋から、線が通る点を順に取り出す。 丸めた角 (`Q`) は終わりの点だけを使う */
function 通る点(d: string): { x: number; y: number }[] {
  const 点: { x: number; y: number }[] = [];
  for (const m of d.matchAll(/([MLQ])([^MLQ]*)/g)) {
    const 数 = [...m[2]!.matchAll(/-?\d+(?:\.\d+)?/g)].map((n) => Number(n[0]));
    if (数.length < 2) continue;
    点.push({ x: 数[数.length - 2]!, y: 数[数.length - 1]! });
  }
  return 点;
}

/** 長さ 40 未満の縦の区間 (長さ 0 は除く) */
function 短い縦の区間(d: string): string[] {
  const 点 = 通る点(d);
  const 出力: string[] = [];
  for (let i = 1; i < 点.length; i++) {
    const a = 点[i - 1]!;
    const b = 点[i]!;
    const 縦の長さ = Math.abs(a.y - b.y);
    if (Math.abs(a.x - b.x) <= 1 && 縦の長さ > 1 && 縦の長さ < 40) 出力.push(`(${a.x},${a.y})→(${b.x},${b.y})`);
  }
  return 出力;
}

function 中の線の段(図: CdlDiagram, laid: LaidDiagram): string[] {
  expect(laid.edges.length, `${図.id} の線を配置できていない`).toBe(図.edges.length);
  return laid.edges.flatMap((e) => 短い縦の区間(e.d).map((s) => `${e.id}: ${s}`));
}

/** 部品の頁の図を全て集める。 手で並べると、部品を足した時に検査から漏れる */
const 部品の図 = Object.values(部品).filter(
  (v): v is CdlDiagram => typeof v === "object" && v !== null && Array.isArray(v.nodes),
);

describe("振り分け器と合流点の線が段を作らない (#2154)", () => {
  it("全部品の頁で、中の線が長さ 40 未満の縦の区間を持たない", () => {
    // 母数が 0 だと何も見ずに通るので、線を持つ部品が振り分け器と合流点を含めて在ることを先に見る
    const 線を持つ部品 = 部品の図.filter((図) => 図.edges.length > 0).map((図) => 図.id);
    expect(線を持つ部品).toEqual(expect.arrayContaining(["parts-split-router", "parts-merge-junction", "parts-mini-network"]));
    const 段 = 部品の図.flatMap((図) => 中の線の段(図, layout(図)).map((s) => `${図.id} ${s}`));
    expect(段).toEqual([]);
  });

  it("合流点の 2 本の線が、出口の箱の中心を挟んで上下対称に走る", () => {
    // 終点だけを見ると直す前も対称になる (描画側が終点を中心から ±28 に離すため、実測)。
    // 段が残るのは始点が片寄っているから = 始点 (入口の高さ) も中心から同じ距離にあるかを見る
    const laid = layout(部品.partsMergeJunction);
    const 出口 = laid.nodes.find((n) => n.id === "outP");
    if (!出口) throw new Error("合流点に出口 (outP) が無い");
    const 入る線 = laid.edges
      .filter((e) => e.to === "outP")
      .map((e) => {
        const 点 = 通る点(e.d);
        return { 始点: 点[0]!.y - 出口.cy, 終点: 点.at(-1)!.y - 出口.cy };
      })
      .sort((a, b) => a.終点 - b.終点);
    expect(入る線, "出口へ入る線が 2 本ではない").toHaveLength(2);
    const [上, 下] = 入る線 as [(typeof 入る線)[number], (typeof 入る線)[number]];
    expect(上.終点, "上の線が出口の中心より上に入っていない").toBeLessThan(0);
    expect(Math.abs(上.終点 + 下.終点), `終点が対称でない (${上.終点} / ${下.終点})`).toBeLessThanOrEqual(1);
    expect(Math.abs(上.始点 + 下.始点), `始点が対称でない (${上.始点} / ${下.始点})`).toBeLessThanOrEqual(1);
  });

  it("振り分けて合流させる見本で、部品どうしの 2 本の矢印が縦の区間を持たない", () => {
    const 図 = 見本.pattern__partsMotion__振り分けて合流させる;
    const laid = layout(図);
    const 部品どうし = laid.edges.filter((e) => e.from.startsWith("split__") && e.to.startsWith("merge__"));
    expect(部品どうし, "部品どうしを繋ぐ矢印が 2 本ではない").toHaveLength(2);
    const 折れ = 部品どうし.filter((e) => new Set(通る点(e.d).map((p) => Math.round(p.y))).size > 1);
    expect(折れ.map((e) => `${e.id}: ${e.d}`)).toEqual([]);
    // 部品の中の線も段を作らない
    expect(中の線の段(図, laid)).toEqual([]);
  });
});
