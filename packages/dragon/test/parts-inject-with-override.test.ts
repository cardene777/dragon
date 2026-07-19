/**
 * parts inject with override 複合 (iter59、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter59。
 * parts inject + override + posX 混在時の compile stability を verify。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import {
  partsBadgeCount,
  partsCountup,
} from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

const CATALOG: Record<string, CdlDiagram> = {
  "parts-badge-count": partsBadgeCount,
  "parts-countup": partsCountup,
};

describe("iter59: parts inject with override + posX 複合", () => {
  it("state override + posX 混在", () => {
    const dsl = `title: "t"
type: sequence
actors:
  - A
  - b: { kind: badge-count, cnt: 42, posX: 200, posY: 300 }
flow:
  - A -> A: "x"
`;
    const compiled = textDslToDiagram(dsl, { partsCatalog: CATALOG });
    expect(compiled.states.find((s) => s.id === "b__cnt")?.initial).toBe(42);
    expect(compiled.nodes.some((n) => n.id.startsWith("b__"))).toBe(true);
  });

  it("state override + posX + posW + posH 全 field 混在", () => {
    const dsl = `title: "t"
type: sequence
actors:
  - A
  - c: { kind: countup, n: 500, posX: 100, posY: 200, posW: 300, posH: 400 }
flow:
  - A -> A: "x"
`;
    const compiled = textDslToDiagram(dsl, { partsCatalog: CATALOG });
    expect(compiled.states.find((s) => s.id === "c__n")?.initial).toBe(500);
    expect(compiled.nodes.some((n) => n.id.startsWith("c__"))).toBe(true);
  });

  it("multi parts × multi override + multi posX", () => {
    const dsl = `title: "t"
type: sequence
actors:
  - A
  - p1: { kind: badge-count, cnt: 10, posX: 100, posY: 100 }
  - p2: { kind: badge-count, cnt: 20, posX: 200, posY: 200 }
  - p3: { kind: countup, n: 300, posX: 300, posY: 300 }
flow:
  - A -> A: "x"
`;
    const compiled = textDslToDiagram(dsl, { partsCatalog: CATALOG });
    expect(compiled.states.find((s) => s.id === "p1__cnt")?.initial).toBe(10);
    expect(compiled.states.find((s) => s.id === "p2__cnt")?.initial).toBe(20);
    expect(compiled.states.find((s) => s.id === "p3__n")?.initial).toBe(300);
  });

  it("posX 大値 (99999) と state override 混在で compile", () => {
    const dsl = `title: "t"
type: sequence
actors:
  - A
  - big: { kind: badge-count, cnt: 99, posX: 99999, posY: 99999 }
flow:
  - A -> A: "x"
`;
    const compiled = textDslToDiagram(dsl, { partsCatalog: CATALOG });
    expect(compiled.states.find((s) => s.id === "big__cnt")?.initial).toBe(99);
  });

  it("posX 負値 (-500) と state override 混在", () => {
    const dsl = `title: "t"
type: sequence
actors:
  - A
  - neg: { kind: countup, n: 77, posX: -500, posY: -200 }
flow:
  - A -> A: "x"
`;
    const compiled = textDslToDiagram(dsl, { partsCatalog: CATALOG });
    expect(compiled.states.find((s) => s.id === "neg__n")?.initial).toBe(77);
  });
});
