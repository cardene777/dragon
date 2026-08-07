/**
 * injectPhasesFallback assert test (CAR-1659、 codex-review fix 実効 lock)。
 *
 * codex adversarial review が指摘した MAJOR fix 3 件の実効を assert する。
 * 単に「fix 反映済」 で満足せず、 fix が意図通り動くことを test で lock する
 * (decision-log 2026-07-17-codex-fix-lock-with-assert-test)。
 *
 * cover 対象。
 * - MAJOR 1 = 全角矢印 `→` を含む focus で edge id が解決される
 * - MAJOR 2 = 同 from/to 複数 edge で全件 activate される (.find → filter loop)
 * - 「fix reflected + assert」 lock = highlight resolution の全体 count (node + edge) が期待通り
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "@cardenelabs/dragon";
import { compile } from "@cardenelabs/cdl";

describe("injectPhasesFallback (CAR-1659 codex fix lock)", () => {
  describe("MAJOR 1 = 全角矢印 `→` 解決", () => {
    it("class preset で focus に `A → B` (全角) を含めても edge が activate される", () => {
      const src = `title: "arrow-fullwidth-test"
type: class

actors:
  - Animal
  - Dog

flow:
  - Dog -> Animal: "extends"

animation:
  - step: "reveal" 1s
    focus: [Animal, Dog, "Dog → Animal"]
`;
      const diagram = textDslToDiagram(src);
      expect(diagram.phases.length).toBe(1);
      const phase = diagram.phases[0]!;
      // activate に node 2 (Animal + Dog) + edge 1 (Dog -> Animal) = 3 IDs
      expect(phase.activate.length).toBe(3);
      // edge id が resolveIds で解決されている確認 = edges 配列に対応 edge が存在 + phase.activate に含まれる
      const edgeIds = diagram.edges.map((e) => e.id);
      const activatedEdges = phase.activate.filter((id) => edgeIds.includes(id));
      expect(activatedEdges.length).toBe(1);
    });

    it("class preset で `->` (半角) と `→` (全角) が同 diagram 内で共存できる", () => {
      const src = `title: "arrow-mixed-test"
type: class

actors:
  - A
  - B
  - C

flow:
  - A -> B: "half"
  - B -> C: "half"

animation:
  - step: "reveal" 1s
    focus: [A, "A -> B", "B → C"]
`;
      const diagram = textDslToDiagram(src);
      expect(diagram.phases.length).toBe(1);
      const phase = diagram.phases[0]!;
      // A (node) + A->B (edge) + B->C (edge、 全角 arrow で解決) = 3 IDs
      expect(phase.activate.length).toBe(3);
      const edgeIds = diagram.edges.map((e) => e.id);
      const activatedEdges = phase.activate.filter((id) => edgeIds.includes(id));
      expect(activatedEdges.length).toBe(2);
    });
  });

  describe("MAJOR 2 = 同 from/to 複数 edge の全件 activate", () => {
    it("同 from/to で 2 本 edge がある場合、 focus 1 件で 2 edge 全件 activate", () => {
      const src = `title: "multi-edge-test"
type: class

actors:
  - A
  - B

flow:
  - A -> B: "first"
  - A -> B: "second"

animation:
  - step: "highlight-all-a-b" 1s
    focus: ["A -> B"]
`;
      const diagram = textDslToDiagram(src);
      expect(diagram.edges.length).toBe(2);
      // 同 from/to の edge は id が別 (`e-a-b` + `e-a-b-2` 等) で作られる想定、 それを両方 activate
      const phase = diagram.phases[0]!;
      const edgeIds = diagram.edges.map((e) => e.id);
      const activatedEdges = phase.activate.filter((id) => edgeIds.includes(id));
      expect(activatedEdges.length).toBe(2);
    });
  });

  describe("phase activation ID count assert (実 SAMPLES で lock)", () => {
    it("class SAMPLE の focus 5 件 (3 node + 2 edge) を正しく activate", () => {
      // 実 CdlEditor SAMPLES で使う class sample の focus 記述
      const src = `title: "動物クラス階層"
type: class

actors:
  - 動物: { kind: storage, rows: ["+name: string", "+age: int", "+speak(): void"] }
  - 犬: { kind: storage, rows: ["+breed: string", "+bark(): void"] }
  - 猫: { kind: storage, rows: ["+indoor: boolean", "+meow(): void"] }

flow:
  - 犬 -> 動物: "extends"
  - 猫 -> 動物: "extends"

animation:
  - step: "reveal" 2.0s
    focus: [動物, 犬, 猫, "犬 -> 動物", "猫 -> 動物"]
`;
      const diagram = textDslToDiagram(src);
      expect(diagram.phases.length).toBe(1);
      const phase = diagram.phases[0]!;
      // 3 node (動物 / 犬 / 猫) + 2 edge (犬->動物 / 猫->動物) = 5 IDs
      expect(phase.activate.length).toBe(5);
      // compile pass で validate error なし
      expect(() => compile(diagram)).not.toThrow();
    });

    it("mind SAMPLE の focus 5 件 (5 node、 edge なし) を正しく activate", () => {
      // 見本と同じ内容。 変更前は `- root: { title: "新プロジェクト" }` と書いていたが、
      // `title` は読める項目ではなく黙って捨てられていた (#1090)。 見本を名前で書く形に
      // 直したので、 こちらも揃える
      const src = `title: "プロジェクト構想"
type: mind

actors:
  - 新プロジェクト
  - 機能
  - デザイン
  - リリース
  - マーケット

animation:
  - step: "reveal" 2.0s
    focus: [新プロジェクト, 機能, デザイン, リリース, マーケット]
`;
      const diagram = textDslToDiagram(src);
      expect(diagram.phases.length).toBe(1);
      const phase = diagram.phases[0]!;
      // 5 node、 edge なし = 5 IDs
      expect(phase.activate.length).toBe(5);
      expect(() => compile(diagram)).not.toThrow();
    });

    it("gantt SAMPLE の 4 phase 全て 1 node activate", () => {
      const src = `title: "Q1-Q4ロードマップ"
type: gantt

actors:
  - 設計: { subtitle: "Q1" }
  - 実装: { subtitle: "Q2" }
  - テスト: { subtitle: "Q3" }
  - リリース: { subtitle: "Q4" }

animation:
  - step: "Q1" 1.0s
    focus: [設計]
  - step: "Q2" 1.0s
    focus: [実装]
  - step: "Q3" 1.0s
    focus: [テスト]
  - step: "Q4" 1.0s
    focus: [リリース]
`;
      const diagram = textDslToDiagram(src);
      expect(diagram.phases.length).toBe(4);
      for (const phase of diagram.phases) {
        // 各 phase は 1 node activate
        expect(phase.activate.length).toBe(1);
      }
      expect(() => compile(diagram)).not.toThrow();
    });

    it("c4 SAMPLE の 3 phase = 各 phase で 2 node + 1 edge activate", () => {
      const src = `title: "C4コンテキストモデル"
type: c4

actors:
  - ユーザー: { kind: person, subtitle: "L1" }
  - システム: { kind: service, subtitle: "L1: system" }
  - API: { kind: service, subtitle: "L2: container" }
  - データベース: { kind: database, subtitle: "L2: container" }

flow:
  - ユーザー -> システム: "利用"
  - システム -> API: "要求"
  - API -> データベース: "問い合わせ"

animation:
  - step: "use" 1.2s
    focus: [ユーザー, システム, "ユーザー -> システム"]
  - step: "request" 1.2s
    focus: [システム, API, "システム -> API"]
  - step: "query" 1.2s
    focus: [API, データベース, "API -> データベース"]
`;
      const diagram = textDslToDiagram(src);
      expect(diagram.phases.length).toBe(3);
      for (const phase of diagram.phases) {
        // 2 node + 1 edge = 3 IDs
        expect(phase.activate.length).toBe(3);
      }
      expect(() => compile(diagram)).not.toThrow();
    });
  });
});
