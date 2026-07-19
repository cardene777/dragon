/**
 * parts sub-node isolation (multi-parts naming collision 防止) unit test (iter11、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter11。
 * 同一 DSL に複数 parts を追加した際、 `{alias}__{subId}` prefix pattern で naming
 * collision が構造的に防止されるか batch 検証。
 *
 * 検証観点。
 * (a) 同一 parts kind を異 alias で複数回 inject → 各 alias namespace が独立
 * (b) 異 parts kind を同 alias で inject 不可 (alias 一意性)
 * (c) state override が alias 別に独立適用 (a1 の state と a2 の state が干渉しない)
 * (d) 3-5 parts 同時 inject でも collision 発生しない
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { partsBadgeCount, partsCountup } from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

const PARTS_CATALOG: Record<string, CdlDiagram> = {
  "parts-badge-count": partsBadgeCount,
  "parts-countup": partsCountup,
};

describe("iter11: parts sub-node isolation (multi-parts naming collision 防止)", () => {
  it("同一 parts kind を異 alias 2 個で inject → 各 namespace 独立", () => {
    const dsl = `title: "t"
type: sequence

actors:
  - A
  - a1: { kind: badge-count }
  - a2: { kind: badge-count }

flow:
  - A -> A: "x"
`;
    const compiled = textDslToDiagram(dsl, { partsCatalog: PARTS_CATALOG });
    const a1Nodes = compiled.nodes.filter((n) => n.id.startsWith("a1__"));
    const a2Nodes = compiled.nodes.filter((n) => n.id.startsWith("a2__"));
    expect(a1Nodes.length, "a1 sub-node が prefix 付きで存在").toBeGreaterThan(0);
    expect(a2Nodes.length, "a2 sub-node が prefix 付きで存在").toBeGreaterThan(0);
    // collision check = 全 node id は unique
    const allIds = compiled.nodes.map((n) => n.id);
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size, `node id 全 unique (list=${allIds.join(",")})`).toBe(allIds.length);
  });

  it("異 parts kind を異 alias で inject → 各 namespace 独立", () => {
    const dsl = `title: "t"
type: sequence

actors:
  - A
  - a1: { kind: badge-count }
  - a2: { kind: countup }

flow:
  - A -> A: "x"
`;
    const compiled = textDslToDiagram(dsl, { partsCatalog: PARTS_CATALOG });
    const a1Nodes = compiled.nodes.filter((n) => n.id.startsWith("a1__"));
    const a2Nodes = compiled.nodes.filter((n) => n.id.startsWith("a2__"));
    expect(a1Nodes.length).toBeGreaterThan(0);
    expect(a2Nodes.length).toBeGreaterThan(0);
    const allIds = compiled.nodes.map((n) => n.id);
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it("state override が alias 別に独立適用 (a1=99 / a2=42 が干渉しない)", () => {
    const dsl = `title: "t"
type: sequence

actors:
  - A
  - a1: { kind: badge-count, cnt: 99 }
  - a2: { kind: badge-count, cnt: 42 }

flow:
  - A -> A: "x"
`;
    const compiled = textDslToDiagram(dsl, { partsCatalog: PARTS_CATALOG });
    const a1State = compiled.states.find((s) => s.id === "a1__cnt");
    const a2State = compiled.states.find((s) => s.id === "a2__cnt");
    expect(a1State, "a1__cnt state 存在").toBeDefined();
    expect(a2State, "a2__cnt state 存在").toBeDefined();
    expect(a1State!.initial, "a1 override 99").toBe(99);
    expect(a2State!.initial, "a2 override 42 (a1 と干渉しない)").toBe(42);
  });

  it("5 parts 同時 inject でも全 sub-node id が unique", () => {
    const dsl = `title: "t"
type: sequence

actors:
  - A
  - p1: { kind: badge-count }
  - p2: { kind: countup }
  - p3: { kind: badge-count }
  - p4: { kind: countup }
  - p5: { kind: badge-count }

flow:
  - A -> A: "x"
`;
    const compiled = textDslToDiagram(dsl, { partsCatalog: PARTS_CATALOG });
    for (const alias of ["p1", "p2", "p3", "p4", "p5"]) {
      const subs = compiled.nodes.filter((n) => n.id.startsWith(`${alias}__`));
      expect(subs.length, `${alias} sub-node 存在`).toBeGreaterThan(0);
    }
    const allIds = compiled.nodes.map((n) => n.id);
    expect(new Set(allIds).size, `全 node id unique (dup 検出: ${allIds.length - new Set(allIds).size} 個)`).toBe(allIds.length);
  });

  it("同一 kind 3 個の state が独立 (各 alias の state.initial が parts default に揃う)", () => {
    const dsl = `title: "t"
type: sequence

actors:
  - A
  - x1: { kind: countup }
  - x2: { kind: countup }
  - x3: { kind: countup }

flow:
  - A -> A: "x"
`;
    const compiled = textDslToDiagram(dsl, { partsCatalog: PARTS_CATALOG });
    for (const alias of ["x1", "x2", "x3"]) {
      const state = compiled.states.find((s) => s.id === `${alias}__n`);
      expect(state, `${alias}__n state 存在`).toBeDefined();
      expect(state!.initial, `${alias} 独立 state (parts default)`).toBe(0);
    }
    // 全 state id unique
    const allStateIds = compiled.states.map((s) => s.id);
    expect(new Set(allStateIds).size).toBe(allStateIds.length);
  });

  it("同一 kind 2 個で片方だけ override → 他方 default 継承", () => {
    const dsl = `title: "t"
type: sequence

actors:
  - A
  - k1: { kind: countup, n: 777 }
  - k2: { kind: countup }

flow:
  - A -> A: "x"
`;
    const compiled = textDslToDiagram(dsl, { partsCatalog: PARTS_CATALOG });
    const k1 = compiled.states.find((s) => s.id === "k1__n");
    const k2 = compiled.states.find((s) => s.id === "k2__n");
    expect(k1!.initial, "k1 override 777").toBe(777);
    expect(k2!.initial, "k2 override なしで parts default").toBe(0);
  });
});
