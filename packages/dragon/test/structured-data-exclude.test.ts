/**
 * 構造化データの抽出対象外の宣言 (#970)。
 *
 * `structured-data-extraction` (軸 44) は「名前を持つ節が 3 つ以上あるか」 を見る。 2 要素の
 * 関係を 1 つだけ見せる最小例は、 3 つ目の節を足すと目的が崩れるため `structuredData: "exclude"`
 * で宣言して対象外にする。
 *
 * 宣言は「忘れると検知が緩む」 向きに倒れているので、 以下 2 点をここで固定する。
 *
 * 1. 宣言した図が、 外すと実際に発火する = 宣言が仕事をしている
 * 2. 宣言していない図が、 名前を 2 つに減らすと発火する = 検知力が残っている
 */
import { describe, it, expect } from "vitest";
import { visualValidate } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import * as interactive from "../../../apps/playground-spa/src/topics/catalog/interactive.cdl";

function isCdlDiagram(v: unknown): v is CdlDiagram {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o.id === "string" && Array.isArray(o.nodes) && Array.isArray(o.edges);
}

const ALL = Object.values(interactive).filter(isCdlDiagram);

/** 軸 44 の detail 一覧。 */
function axis44(d: CdlDiagram): string[] {
  return visualValidate(d)
    .violations.filter((v) => v.axis === "structured-data-extraction")
    .map((v) => v.detail);
}

/** 名前を持つ節の数。 */
function namedCount(d: CdlDiagram): number {
  return d.nodes.filter((n) => (n.title?.trim() ?? "").length > 0).length;
}

const EXCLUDED = ["interactive-slider-bar", "interactive-number-spark", "interactive-render-offset"];

describe("構造化データの抽出対象外の宣言", () => {
  it("宣言している図は、 interactive では 3 図だけ", () => {
    const declared = ALL.filter((d) => d.structuredData === "exclude").map((d) => d.id).sort();
    expect(declared).toEqual([...EXCLUDED].sort());
  });

  it("宣言した 3 図は、 名前を持つ節が 2 つしかない", () => {
    // 3 つ以上あるのに宣言していたら、 対象外にする理由が無い
    for (const id of EXCLUDED) {
      const d = ALL.find((x) => x.id === id)!;
      expect(namedCount(d), `${id} の名前を持つ節の数`).toBe(2);
    }
  });

  it("宣言があると軸 44 は発火しない", () => {
    for (const id of EXCLUDED) {
      expect(axis44(ALL.find((x) => x.id === id)!), id).toEqual([]);
    }
  });

  it("宣言を外すと軸 44 が発火する (宣言が仕事をしている)", () => {
    for (const id of EXCLUDED) {
      const d = ALL.find((x) => x.id === id)!;
      const withoutDeclaration = { ...d, structuredData: "extract" } as CdlDiagram;
      const got = axis44(withoutDeclaration);
      expect(got, `${id} は宣言を外しても発火しない`).toHaveLength(1);
      expect(got[0]).toContain("有名 node 数 2 < 3");
    }
  });

  it("宣言していない図は、 名前を 2 つに減らすと発火する (検知力が残っている)", () => {
    // 宣言が「全図を黙らせる」 形になっていないことを確かめる。
    const target = ALL.find((d) => d.structuredData !== "exclude" && namedCount(d) >= 3)!;
    expect(axis44(target), `${target.id} は変更前から発火している`).toEqual([]);

    let left = 2;
    const stripped = {
      ...target,
      nodes: target.nodes.map((n) => {
        if ((n.title?.trim() ?? "").length === 0) return n;
        if (left > 0) {
          left -= 1;
          return n;
        }
        return { ...n, title: "" };
      }),
    } as CdlDiagram;
    expect(namedCount(stripped)).toBe(2);
    expect(axis44(stripped), `${target.id} の名前を減らしても発火しない`).toHaveLength(1);
  });

  it("宣言は軸 44 だけに効く (他の軸を黙らせない)", () => {
    for (const id of EXCLUDED) {
      const d = ALL.find((x) => x.id === id)!;
      const withDecl = visualValidate(d).violations.filter((v) => v.axis !== "structured-data-extraction");
      const without = visualValidate({ ...d, structuredData: "extract" } as CdlDiagram)
        .violations.filter((v) => v.axis !== "structured-data-extraction");
      expect(withDecl.map((v) => `${v.axis}:${v.detail}`), id).toEqual(
        without.map((v) => `${v.axis}:${v.detail}`),
      );
    }
  });
});
