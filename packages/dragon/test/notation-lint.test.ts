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
    const report = lintDiagram(diagram({ topic: "ログインの流れ preset (詳細)" }));
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
    const report = lintDiagram(diagram({ topic: "ログインの流れ preset (詳細)" }));
    expect(report.autoFixableCount).toBe(report.issues.filter((i) => i.autoFixable).length);
  });

  /**
   * 自動修正は語を落とすだけで、文を書かない (#2687)。
   *
   * 以前は先頭が型の名前なら図種の定義文 (「処理の順番を示すフロー」) に丸ごと書き換えていた。
   * cdl 0.96.0 で説明が図の題として画面に出るようになり、その定義文が見本帳の 8 枚に出た。
   * 道具は図の中身を知らないので、名前を作れない。
   */
  it("先頭の型の名前は落とすだけで、図種の定義文を書かない (#2687)", () => {
    expect(autoFix(diagram({ topic: "flow ログインの流れ" })).topic).toBe("ログインの流れ");
    expect(autoFix(diagram({ topic: "gantt 公開までの段取り" })).topic).toBe("公開までの段取り");
  });

  it("落とすと説明として成り立たない時は元の字を返す (#2687)", () => {
    // 仮の題 (かつての「図の説明」) を返すと、道具が書いた字が図の題として画面に出る
    const d = diagram({ topic: "flow preset (詳細)" });
    expect(autoFix(d).topic).toBe("flow preset (詳細)");
    const 指摘 = lintDiagram(d).issues.find((i) => i.rule === "topic-redundant-implementation-detail");
    expect(指摘?.autoFixable, "直せないのに直せると数えている").toBe(false);
  });

  it("自動修正できる指摘の修正案は、自動修正が書く値そのもの (#1940)", () => {
    // 括弧の中の実装の言葉の 3 通り。 型の名前だけの形は指摘が出ないので入れない (#2687)
    const 説明たち = [
      "ログインの流れ (SVG path で描く)",
      "ログイン (render 未実装)",
      "会員の登録 (polygon)",
    ];
    for (const topic of 説明たち) {
      const d = diagram({ topic });
      const 指摘 = lintDiagram(d).issues.filter((i) => i.rule === "topic-redundant-implementation-detail");
      expect(指摘.length, `${topic} を指摘していない (検査が空振りしている)`).toBeGreaterThan(0);
      for (const i of 指摘) {
        expect(i.autoFixable, topic).toBe(true);
        expect(i.suggestion, topic).toBe(autoFix(d).topic);
      }
      expect(lintDiagram(autoFix(d)).issues.some((i) => i.rule === "topic-redundant-implementation-detail"), topic).toBe(false);
    }
  });

  it("自動修正で消えない説明は、自動修正できると数えない (#1940)", () => {
    // 括弧の外の実装の言葉は自動修正が触らない。 直せると数えると、直したはずの指摘が次の検査でまた出る
    const d = diagram({ topic: "SVG polyline を使う" });
    expect(autoFix(d).topic, "自動修正が触らない前提が崩れた").toBe("SVG polyline を使う");
    const report = lintDiagram(d);
    const 指摘 = report.issues.find((i) => i.rule === "topic-redundant-implementation-detail");
    expect(指摘?.autoFixable).toBe(false);
    expect(report.autoFixableCount).toBe(0);
    // 直し方の例は見本帳の実物から採る (#2687)。 型の表から作ると図種の定義文になり、
    // 案内どおりに書いた説明がそのまま図の題として画面に出る
    expect(指摘?.suggestion).toBe("その図が何を示しているかを名前で書く (「経路別の流入」 のように)");
    expect(指摘?.suggestion).not.toContain("を示す");
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
  /**
   * 型の名前は落とすだけで、図種の定義文を書かない (#2687)。
   *
   * 元は「{示すもの}を示す{型の名前}」 に丸ごと書き換えており、`#1934` は名前が `図` で
   * 終わる型で `図` が重ならないことを見ていた。 cdl 0.96.0 で説明が図の題として画面に
   * 出るようになり、その定義文が見本帳の 8 枚に出た。 道具は図の中身を知らないので
   * 名前を作れない = 書く側を止め、残りの字をそのまま説明にする。
   */
  it("kind 名で始まる topic → 型の名前だけを落とす", () => {
    expect(autoFix(diagram({ topic: "flow ログインの流れ" })).topic).toBe("ログインの流れ");
  });

  it("sequence 始まり → 残りの字がそのまま説明になる", () => {
    expect(autoFix(diagram({ topic: "sequence 注文から出荷まで" })).topic).toBe("注文から出荷まで");
  });

  it("型の名前を落とした説明に図種の定義文が入らない (#2687)", () => {
    for (const topic of ["gantt 公開までの段取り", "stateMachine2 会員の状態の移り変わり"]) {
      expect(autoFix(diagram({ topic })).topic, topic).not.toContain("を示す");
    }
  });

  it("kind 名で始まらず括弧内実装詳細 → 除去", () => {
    expect(autoFix(diagram({ topic: "ログイン (render 未実装)" })).topic).toBe("ログイン");
  });

  /**
   * 落として説明が残らない時は元の字を返す (#2687)。
   *
   * 元は仮の題 (「図の説明」) を書いていた。 説明が図の題として画面に出るようになったので、
   * 道具が書いた仮の字がそのまま図に出る。 元の字を返せば呼出側が「直せない」 と数え、
   * 書き手に名前を求める。
   */
  it("落として説明が残らない → 元の字を返す", () => {
    expect(autoFix(diagram({ topic: "AB (polygon)" })).topic).toBe("AB (polygon)");
    // 括弧の中しか残らない形も同じ。 字数だけで見ると 4 字あるので通ってしまう
    expect(autoFix(diagram({ topic: "flow preset (詳細)" })).topic).toBe("flow preset (詳細)");
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
    const orig = diagram({ topic: "ログインの流れ preset (詳細)" });
    const fixed = autoFix(orig);
    const report = lintDiagram(fixed);
    expect(report.issues.some((i) => i.rule === "topic-redundant-implementation-detail")).toBe(false);
  });

  it("落として説明が残らない形は、autoFix 後も指摘が残る (#2687)", () => {
    // 消えない指摘を「直せる」 と数えると、直したはずの指摘が次の検査でまた出る (#1940)
    const fixed = autoFix(diagram({ topic: "flow preset (詳細)" }));
    expect(lintDiagram(fixed).issues.some((i) => i.rule === "topic-redundant-implementation-detail")).toBe(true);
    expect(lintDiagram(fixed).autoFixableCount).toBe(0);
  });
});
