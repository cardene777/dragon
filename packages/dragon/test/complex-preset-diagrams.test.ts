import { describe, expect, it } from "vitest";
import {
  CLASS_RELATION_LOOK,
  type CdlDiagram,
  type CdlEdge,
  type ClassRelationType,
} from "@cardenelabs/cdl";

// 複雑な版はクラス図と ER 図の中のパターン「複雑」 として書く (#1960)
import {
  pattern__presetClassDiagram__複雑 as presetClassComplex,
  pattern__presetEr__複雑 as presetErComplex,
} from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";

const 関係の種類 = Object.keys(CLASS_RELATION_LOOK) as ClassRelationType[];

/** 組み立て後に残る線と印を、描画実装が持つ関係定義へ照合する。 */
function クラス関係の種類(edge: CdlEdge): ClassRelationType | undefined {
  return 関係の種類.find((種類) => {
    const 見た目 = CLASS_RELATION_LOOK[種類];
    return (
      edge.style === 見た目.style &&
      edge.head === 見た目.head &&
      edge.headFill === 見た目.fill &&
      edge.tailHead === 見た目.tailHead &&
      edge.tailHeadFill === 見た目.tailFill
    );
  });
}

/** 主キーかつ外部キーの列だけを持ち、異なる 2 表から線を受ける表を中継表と数える。 */
function 中継表(diagram: CdlDiagram): string[] {
  return diagram.nodes
    .filter((node) => {
      const marks = node.rowMarks ?? [];
      if (marks.length === 0) return false;
      const 鍵だけ = marks.every((mark) => mark?.shape === "chevron" && mark.underline === true);
      const 両端 = new Set(
        diagram.edges.filter((edge) => edge.to === node.id).map((edge) => edge.from),
      );
      return 鍵だけ && 両端.size === 2;
    })
    .map((node) => node.id);
}

describe("複雑な ER 図", () => {
  it("12 表と 14 関係を持つ", () => {
    expect(presetErComplex.nodes.length, "表が 1 件も無い").toBeGreaterThan(0);
    expect(presetErComplex.edges.length, "関係が 1 件も無い").toBeGreaterThan(0);
    expect(presetErComplex.nodes.length).toBe(12);
    expect(presetErComplex.edges.length).toBe(14);
  });

  it("両端から線を受ける中継表が 2 つある", () => {
    expect(presetErComplex.nodes.length, "中継表を探す対象が 1 件も無い").toBeGreaterThan(0);
    const tables = 中継表(presetErComplex);
    expect(tables.length, `中継表: ${tables.join(", ") || "無し"}`).toBe(2);
  });

  it("自己参照が 1 本ある", () => {
    expect(presetErComplex.edges.length, "自己参照を探す対象が 1 件も無い").toBeGreaterThan(0);
    const loops = presetErComplex.edges.filter((edge) => edge.from === edge.to);
    expect(loops.length, `自己参照: ${loops.map((edge) => edge.id).join(", ") || "無し"}`).toBe(1);
  });
});

describe("複雑なクラス図", () => {
  it("12 クラスと 14 関係を持つ", () => {
    expect(presetClassComplex.nodes.length, "クラスが 1 件も無い").toBeGreaterThan(0);
    expect(presetClassComplex.edges.length, "関係が 1 件も無い").toBeGreaterThan(0);
    expect(presetClassComplex.nodes.length).toBe(12);
    expect(presetClassComplex.edges.length).toBe(14);
  });

  it("描画実装が持つ 6 種の関係を全て含む", () => {
    expect(関係の種類.length, "描画実装から関係の種類を 1 件も導けない").toBeGreaterThan(0);
    expect(presetClassComplex.edges.length, "関係を調べる対象が 1 件も無い").toBeGreaterThan(0);

    const 読めない = presetClassComplex.edges.filter(
      (edge) => クラス関係の種類(edge) === undefined,
    );
    expect(
      読めない.map((edge) => edge.id),
      "描画実装の関係定義へ照合できない線がある",
    ).toEqual([]);

    const counts = new Map(関係の種類.map((種類) => [種類, 0]));
    for (const edge of presetClassComplex.edges) {
      const 種類 = クラス関係の種類(edge)!;
      counts.set(種類, (counts.get(種類) ?? 0) + 1);
    }
    const 足りない = 関係の種類.filter((種類) => (counts.get(種類) ?? 0) === 0);
    expect(足りない, `足りない関係の種類: ${足りない.join(", ") || "無し"}`).toEqual([]);
  });
});
