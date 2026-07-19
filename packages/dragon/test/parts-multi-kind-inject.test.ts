/**
 * parts 多 kind mixed inject (iter44、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter44。
 * 1 sample に複数種類の parts を同時 inject した場合の compile stability + node id isolation を verify。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import {
  partsBadgeCount,
  partsCountup,
  partsCounterActor,
} from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

const CATALOG: Record<string, CdlDiagram> = {
  "parts-badge-count": partsBadgeCount,
  "parts-countup": partsCountup,
  "parts-counter-actor": partsCounterActor,
};

describe("iter44: parts 多 kind mixed inject", () => {
  it("3 種 mixed inject で全 sub-node id unique", () => {
    const dsl = `title: "t"
type: sequence
actors:
  - A
  - x1: { kind: badge-count }
  - x2: { kind: countup }
  - x3: { kind: counter-actor }
flow:
  - A -> A: "x"
`;
    const compiled = textDslToDiagram(dsl, { partsCatalog: CATALOG });
    for (const alias of ["x1", "x2", "x3"]) {
      const subs = compiled.nodes.filter((n) => n.id.startsWith(`${alias}__`));
      expect(subs.length, `${alias} sub-nodes`).toBeGreaterThan(0);
    }
    const allIds = compiled.nodes.map((n) => n.id);
    expect(new Set(allIds).size, `全 id unique`).toBe(allIds.length);
  });

  it("同 kind 3 個 mixed inject → 3 個の namespace 独立", () => {
    const dsl = `title: "t"
type: sequence
actors:
  - A
  - a1: { kind: badge-count }
  - a2: { kind: badge-count }
  - a3: { kind: badge-count }
flow:
  - A -> A: "x"
`;
    const compiled = textDslToDiagram(dsl, { partsCatalog: CATALOG });
    for (const alias of ["a1", "a2", "a3"]) {
      const subs = compiled.nodes.filter((n) => n.id.startsWith(`${alias}__`));
      expect(subs.length).toBeGreaterThan(0);
    }
  });

  it("mixed 3 種 × 3 alias = 9 個 inject でも collision なし", () => {
    const dsl = `title: "t"
type: sequence
actors:
  - A
  - b1: { kind: badge-count }
  - b2: { kind: badge-count }
  - b3: { kind: badge-count }
  - c1: { kind: countup }
  - c2: { kind: countup }
  - c3: { kind: countup }
  - d1: { kind: counter-actor }
  - d2: { kind: counter-actor }
  - d3: { kind: counter-actor }
flow:
  - A -> A: "x"
`;
    const compiled = textDslToDiagram(dsl, { partsCatalog: CATALOG });
    for (const alias of ["b1", "b2", "b3", "c1", "c2", "c3", "d1", "d2", "d3"]) {
      const subs = compiled.nodes.filter((n) => n.id.startsWith(`${alias}__`));
      expect(subs.length, `${alias} sub`).toBeGreaterThan(0);
    }
    const allIds = compiled.nodes.map((n) => n.id);
    expect(new Set(allIds).size, `9 parts 全 id unique`).toBe(allIds.length);
  });

  it("state 独立 verify: 3 個の badge-count で 3 個の cnt state 独立 initial", () => {
    const dsl = `title: "t"
type: sequence
actors:
  - A
  - e1: { kind: badge-count, cnt: 111 }
  - e2: { kind: badge-count, cnt: 222 }
  - e3: { kind: badge-count, cnt: 333 }
flow:
  - A -> A: "x"
`;
    const compiled = textDslToDiagram(dsl, { partsCatalog: CATALOG });
    expect(compiled.states.find((s) => s.id === "e1__cnt")?.initial).toBe(111);
    expect(compiled.states.find((s) => s.id === "e2__cnt")?.initial).toBe(222);
    expect(compiled.states.find((s) => s.id === "e3__cnt")?.initial).toBe(333);
  });
});
