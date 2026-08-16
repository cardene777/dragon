import { describe, it, expect } from "vitest";
import { lintDiagram, autoFix } from "../src/notation-lint";
import type { CdlDiagram, CdlNode } from "@cardenelabs/cdl";

/**
 * notation-lint (author 向け記法 lint) は test 0 件だった。
 * lintDiagram の全 8 rule と autoFix の topic 変換を、 各 rule が読む最小 field だけの
 * fixture で execute する。 lintDiagram は d.id / d.topic / d.nodes しか読まない純粋関数なので、
 * 最小 shape を cast して rule logic を直接検証する (positive: 検出発火 / negative: clean で無発火)。
 */

function diagram(over: Partial<CdlDiagram>): CdlDiagram {
  return { id: "d1", topic: "図の説明", nodes: [], edges: [], ...over } as unknown as CdlDiagram;
}

function node(over: Record<string, unknown>): CdlNode {
  return { id: "n1", kind: "box", ...over } as unknown as CdlNode;
}

describe("lintDiagram — topic 冗長 (実装詳細) rule", () => {
  it("topic に preset( が含まれる → warn + autoFixable", () => {
    const report = lintDiagram(diagram({ topic: "flow preset (詳細)" }));
    const issue = report.issues.find((i) => i.rule === "topic-redundant-implementation-detail");
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe("warn");
    expect(issue?.autoFixable).toBe(true);
  });

  it("topic に polygon が含まれる → 検出", () => {
    const report = lintDiagram(diagram({ topic: "polygon で描く図" }));
    expect(report.issues.some((i) => i.rule === "topic-redundant-implementation-detail")).toBe(true);
  });

  it("topic に SVG polyline が含まれる → 検出", () => {
    const report = lintDiagram(diagram({ topic: "SVG polyline を使う" }));
    expect(report.issues.some((i) => i.rule === "topic-redundant-implementation-detail")).toBe(true);
  });

  it("clean な topic → 無発火", () => {
    const report = lintDiagram(diagram({ topic: "ログインの流れを示す図" }));
    expect(report.issues.some((i) => i.rule === "topic-redundant-implementation-detail")).toBe(false);
  });

  it("autoFixableCount が autoFixable issue 数と一致", () => {
    const report = lintDiagram(diagram({ topic: "flow preset (詳細)" }));
    expect(report.autoFixableCount).toBe(report.issues.filter((i) => i.autoFixable).length);
  });
});

describe("lintDiagram — chart 空データ rule", () => {
  it("chart-line で datum 0 件 → chart-empty-datum warn", () => {
    const report = lintDiagram(diagram({ nodes: [node({ kind: "chart-line", chartData: [] })] }));
    const issue = report.issues.find((i) => i.rule === "chart-empty-datum");
    expect(issue).toBeDefined();
    expect(issue?.autoFixable).toBe(false);
  });

  it("chart-pie で datum 1 件 → chart-single-datum info", () => {
    const report = lintDiagram(diagram({ nodes: [node({ kind: "chart-pie", chartData: [{ id: "a", label: "A", value: 1 }] })] }));
    const issue = report.issues.find((i) => i.rule === "chart-single-datum");
    expect(issue?.severity).toBe("info");
  });

  it("chart-bar で datum 2 件 → 無発火", () => {
    const report = lintDiagram(diagram({ nodes: [node({ kind: "chart-bar", chartData: [{ id: "a", label: "A", value: 1 }, { id: "b", label: "B", value: 2 }] })] }));
    expect(report.issues.some((i) => i.rule.startsWith("chart-"))).toBe(false);
  });
});

describe("lintDiagram — gantt 未定義 dependsOn rule", () => {
  it("存在しない task に dependsOn → 検出", () => {
    const report = lintDiagram(diagram({ nodes: [node({ kind: "gantt-timeline", ganttData: [{ id: "t1", dependsOn: "missing" }] })] }));
    const issue = report.issues.find((i) => i.rule === "gantt-unknown-depends-on");
    expect(issue?.target).toBe("t1");
  });

  it("正しい dependsOn → 無発火", () => {
    const report = lintDiagram(diagram({ nodes: [node({ kind: "gantt-timeline", ganttData: [{ id: "t1" }, { id: "t2", dependsOn: "t1" }] })] }));
    expect(report.issues.some((i) => i.rule === "gantt-unknown-depends-on")).toBe(false);
  });
});

describe("lintDiagram — mindMap/tree 未定義 parent rule", () => {
  it("mindMap branch が未定義 parent 参照 → 検出", () => {
    const report = lintDiagram(diagram({ nodes: [node({ kind: "mind-map", mindData: { rootId: "root", branches: [{ id: "b1", parent: "ghost" }] } })] }));
    expect(report.issues.some((i) => i.rule === "mindmap-unknown-parent")).toBe(true);
  });

  it("mindMap branch が rootId 参照 → 無発火", () => {
    const report = lintDiagram(diagram({ nodes: [node({ kind: "mind-map", mindData: { rootId: "root", branches: [{ id: "b1", parent: "root" }] } })] }));
    expect(report.issues.some((i) => i.rule === "mindmap-unknown-parent")).toBe(false);
  });

  it("tree node が未定義 parent 参照 → 検出", () => {
    const report = lintDiagram(diagram({ nodes: [node({ kind: "tree-hierarchy", treeData: [{ id: "c1", parent: "ghost" }] })] }));
    expect(report.issues.some((i) => i.rule === "tree-unknown-parent")).toBe(true);
  });

  it("tree node が既存 parent 参照 → 無発火", () => {
    const report = lintDiagram(diagram({ nodes: [node({ kind: "tree-hierarchy", treeData: [{ id: "root" }, { id: "c1", parent: "root" }] })] }));
    expect(report.issues.some((i) => i.rule === "tree-unknown-parent")).toBe(false);
  });
});

describe("lintDiagram — quadrant / funnel rule", () => {
  it("quadrant item 0 件 → quadrant-empty warn", () => {
    const report = lintDiagram(diagram({ nodes: [node({ kind: "quadrant-matrix", quadrantData: { items: [] } })] }));
    expect(report.issues.some((i) => i.rule === "quadrant-empty")).toBe(true);
  });

  it("quadrant item が 1 象限集中 (4件) → quadrant-single-quadrant info", () => {
    const items = [0, 1, 2, 3].map((i) => ({ id: `i${i}`, title: `T${i}`, quadrant: "topLeft" }));
    const report = lintDiagram(diagram({ nodes: [node({ kind: "quadrant-matrix", quadrantData: { items } })] }));
    expect(report.issues.some((i) => i.rule === "quadrant-single-quadrant")).toBe(true);
  });

  it("funnel が増加 (非単調減少) → funnel-increasing-count warn", () => {
    const report = lintDiagram(diagram({ nodes: [node({ kind: "funnel-stages", funnelData: [{ id: "s1", count: 100 }, { id: "s2", count: 200 }] })] }));
    const issue = report.issues.find((i) => i.rule === "funnel-increasing-count");
    expect(issue?.target).toBe("s2");
  });

  it("funnel が単調減少 → 無発火", () => {
    const report = lintDiagram(diagram({ nodes: [node({ kind: "funnel-stages", funnelData: [{ id: "s1", count: 200 }, { id: "s2", count: 100 }] })] }));
    expect(report.issues.some((i) => i.rule === "funnel-increasing-count")).toBe(false);
  });

  it("人数を状態から取る形 → 無発火 (静的には値が決まらない)", () => {
    // 素通しで比べると文字列の大小比較になり、`{trial}` > `{signup}` で偽発火する (#1194)
    const report = lintDiagram(diagram({ nodes: [node({ kind: "funnel-stages", funnelData: [{ id: "signup", count: "{signup}" }, { id: "trial", count: "{trial}" }] })] }));
    expect(report.issues.some((i) => i.rule === "funnel-increasing-count")).toBe(false);
  });

  it("片方だけ状態から取る形 → 無発火", () => {
    // 数と `{名前}` の組も比べられない。 数側だけを見て発火させると根拠が無い
    const report = lintDiagram(diagram({ nodes: [node({ kind: "funnel-stages", funnelData: [{ id: "s1", count: 100 }, { id: "s2", count: "{s2}" }] })] }));
    expect(report.issues.some((i) => i.rule === "funnel-increasing-count")).toBe(false);
  });
});

describe("autoFix — topic 変換", () => {
  it("kind 名で始まる topic → 「{JA} を示す図」 に置換", () => {
    expect(autoFix(diagram({ topic: "flow preset (詳細)" })).topic).toBe("処理の流れ を示す図");
  });

  it("sequence 始まり → 時系列のやり取り", () => {
    expect(autoFix(diagram({ topic: "sequence の例" })).topic).toBe("時系列のやり取り を示す図");
  });

  it("kind 名で始まらず括弧内実装詳細 → 除去", () => {
    expect(autoFix(diagram({ topic: "ログイン (render 未実装)" })).topic).toBe("ログイン");
  });

  it("除去後 3 文字未満 → 「図の説明」 fallback", () => {
    expect(autoFix(diagram({ topic: "AB (polygon)" })).topic).toBe("図の説明");
  });

  it("clean な topic → 変更なし", () => {
    expect(autoFix(diagram({ topic: "ログインの流れを示す図" })).topic).toBe("ログインの流れを示す図");
  });

  it("autoFix は元 diagram を破壊しない (新 object を返す)", () => {
    const orig = diagram({ topic: "flow preset (詳細)" });
    const fixed = autoFix(orig);
    expect(orig.topic).toBe("flow preset (詳細)");
    expect(fixed).not.toBe(orig);
  });

  it("autoFix 後は topic-redundant issue が解消される", () => {
    const orig = diagram({ topic: "flow preset (詳細)" });
    const fixed = autoFix(orig);
    const report = lintDiagram(fixed);
    expect(report.issues.some((i) => i.rule === "topic-redundant-implementation-detail")).toBe(false);
  });
});
