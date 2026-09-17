/**
 * 縦列が書かれていない本文に、光らせる対象を補って組み立てる経路の検証 (CAR-1659)。
 *
 * 見るのは 3 点。
 * - 全角の矢印 `→` を含む指定から、線を指す名前が解けること
 * - 同じ from / to の線が 2 本ある時、1 件の指定で 2 本とも光ること
 * - 光らせた対象の合計 (箱 + 線) が、指定した数と一致すること
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "@cardenelabs/dragon";
import { compile } from "@cardenelabs/cdl";

describe("縦列が無い本文に光らせる対象を補う (CAR-1659)", () => {
  describe("全角の矢印 `→` から線を解く", () => {
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

  describe("同じ from / to の線を全件光らせる", () => {
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

    it("mind SAMPLE の focus 5 件が 1 箱に集まる (#1177 で mind-map 種別に寄せた)", () => {
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
      // **図全体を 1 箱で描く種別になった** (#1177)。 焦点に 5 つ書いても指す先は同じ箱 1 つで、
      // `SINGLE_BOX_KINDS` の経路がそこへ寄せる。 以前は登場人物ごとに card があり 5 件だった
      expect(phase.activate.length).toBe(1);
      const 箱 = diagram.nodes.filter((n) => n.kind === "mind-map");
      expect(箱.length, "mind-map の箱が 1 つでない").toBe(1);
      expect(phase.activate[0], "焦点が mind-map の箱を指していない").toBe(箱[0]!.id);
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
