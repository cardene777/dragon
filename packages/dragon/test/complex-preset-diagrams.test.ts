import { describe, expect, it } from "vitest";
import {
  CLASS_RELATION_LOOK,
  flowchart,
  type CdlDiagram,
  type CdlEdge,
  type ClassRelationType,
  type FlowchartNodeShape,
} from "@cardenelabs/cdl";

// 複雑な版は見本の中のパターン「複雑」 として書く (#1960)
import {
  pattern__presetClassDiagram__複雑 as presetClassComplex,
  pattern__presetEr__複雑 as presetErComplex,
  pattern__presetFlowchart__複雑 as presetFlowchartComplex,
  pattern__presetInfrastructure__複雑 as presetInfraComplex,
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

/** 線を向きどおりに辿って、起点から届く箱を集める */
function 届く箱(diagram: CdlDiagram, 起点: string): Set<string> {
  const 届いた = new Set([起点]);
  const 待ち = [起点];
  while (待ち.length > 0) {
    const 今 = 待ち.pop()!;
    for (const edge of diagram.edges) {
      if (edge.from !== 今 || 届いた.has(edge.to)) continue;
      届いた.add(edge.to);
      待ち.push(edge.to);
    }
  }
  return 届いた;
}

describe("複雑なクラウド構成図 (#2139)", () => {
  it("12 箱と 12 本の線を持つ", () => {
    expect(presetInfraComplex.nodes.length).toBe(12);
    expect(presetInfraComplex.edges.length).toBe(12);
  });

  it("全ての箱がブラウザから線を辿って届く", () => {
    expect(presetInfraComplex.nodes.length, "辿る対象が 1 件も無い").toBeGreaterThan(0);
    const 届いた = 届く箱(presetInfraComplex, "user");
    const 届かない = presetInfraComplex.nodes.map((node) => node.id).filter((id) => !届いた.has(id));
    expect(届かない, "ブラウザから届かない箱").toEqual([]);
  });

  it("順路の線がブラウザから台帳まで途切れずに繋がる", () => {
    const 順路 = presetInfraComplex.edges.filter((edge) => edge.role === "main");
    expect(順路.map((edge) => `${edge.from}->${edge.to}`)).toEqual([
      "user->cdn",
      "cdn->alb",
      "alb->app",
      "app->db",
    ]);
  });

  it("段が 9 つある", () => {
    expect(presetInfraComplex.phases.length).toBe(9);
  });
});

/**
 * 流れ図の組み立て器が持つ形の一覧。 **型で閉じる** = 描画側に形が増えると、ここに足すまで型の検査が落ちる。
 * 形は箱の上の名前 (`eyebrow`) にしか残らないので、形ごとに 1 箱の図を組んで名前を導く。
 */
const 流れ図の形 = Object.keys({
  start: true,
  end: true,
  process: true,
  decision: true,
  loop: true,
} satisfies Record<FlowchartNodeShape, true>) as FlowchartNodeShape[];

const 形の名前 = new Map(
  流れ図の形.map((形) => {
    const 図 = flowchart({ id: "shape-probe", topic: "形", lanes: ["列"] })
      .node({ id: "n", title: "箱", shape: 形, lane: "列" })
      .build();
    return [形, 図.nodes[0]?.eyebrow ?? ""] as const;
  }),
);

describe("複雑な流れ図 (#2143)", () => {
  it("8 箱と 9 本の線を持つ", () => {
    expect(presetFlowchartComplex.nodes.length).toBe(8);
    expect(presetFlowchartComplex.edges.length).toBe(9);
  });

  it("組み立て器が持つ形を全て使う", () => {
    expect(new Set(形の名前.values()).size, "形ごとの名前を導けていない").toBe(流れ図の形.length);
    const 使った名前 = new Set(presetFlowchartComplex.nodes.map((node) => node.eyebrow));
    const 使っていない = 流れ図の形.filter((形) => !使った名前.has(形の名前.get(形)));
    expect(使っていない, "複雑な版で使っていない形").toEqual([]);
  });

  it("全ての箱が最初の申請から線を辿って届く", () => {
    expect(presetFlowchartComplex.nodes.length, "辿る対象が 1 件も無い").toBeGreaterThan(0);
    const 届いた = 届く箱(presetFlowchartComplex, "submit");
    const 届かない = presetFlowchartComplex.nodes.map((node) => node.id).filter((id) => !届いた.has(id));
    expect(届かない, "最初の申請から届かない箱").toEqual([]);
  });

  it("2 つの道が照合で合流し、差し戻しが最初の申請へ戻る", () => {
    const 照合へ = presetFlowchartComplex.edges.filter((edge) => edge.to === "lines").map((edge) => edge.from);
    expect(照合へ.sort(), "照合に入る線の出どころ").toEqual(["amount", "boss"]);
    const 戻る = presetFlowchartComplex.edges.filter((edge) => edge.to === "submit").map((edge) => edge.from);
    expect(戻る, "最初の申請へ戻る線の出どころ").toEqual(["fix"]);
  });

  it("終わり方が 2 つあり、どちらも出ていく線を持たない", () => {
    const 終わり = presetFlowchartComplex.nodes
      .filter((node) => node.eyebrow === 形の名前.get("end"))
      .map((node) => node.id);
    expect(終わり.sort()).toEqual(["pay", "reject"]);
    const 出ていく = presetFlowchartComplex.edges.filter((edge) => 終わり.includes(edge.from));
    expect(出ていく.map((edge) => edge.id), "終わりの箱から出ていく線").toEqual([]);
  });

  it("段が 8 つある", () => {
    expect(presetFlowchartComplex.phases.length).toBe(8);
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
