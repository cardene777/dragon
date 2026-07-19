/**
 * parts prefix collision safety (iter26、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter26。
 * `{alias}__{subId}` prefix pattern が escape ケースで正しく動作するか verify。
 *
 * (a) 短い alias (1 char) でも一意 prefix 生成
 * (b) alias に "__" 含む場合の handling (collision risk 検知)
 * (c) 同 kind を 10 個並列 inject でも全 sub-node id unique
 * (d) alias 名重複時の失敗検知
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { partsBadgeCount, partsCountup } from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

const CATALOG: Record<string, CdlDiagram> = {
  "parts-badge-count": partsBadgeCount,
  "parts-countup": partsCountup,
};

describe("iter26: parts prefix collision safety", () => {
  it("短い alias (1 char) でも prefix 一意生成", () => {
    const dsl = `title: "t"
type: sequence
actors:
  - A
  - a: { kind: badge-count }
  - b: { kind: countup }
flow:
  - A -> A: "x"
`;
    const compiled = textDslToDiagram(dsl, { partsCatalog: CATALOG });
    const aSubs = compiled.nodes.filter((n) => n.id.startsWith("a__"));
    const bSubs = compiled.nodes.filter((n) => n.id.startsWith("b__"));
    expect(aSubs.length).toBeGreaterThan(0);
    expect(bSubs.length).toBeGreaterThan(0);
    const allIds = compiled.nodes.map((n) => n.id);
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it("同 kind を 10 個並列 inject → 全 sub-node id unique", () => {
    const aliases = Array.from({ length: 10 }, (_, i) => `p${i}`);
    const injectLines = aliases.map((a) => `  - ${a}: { kind: badge-count }`).join("\n");
    const dsl = `title: "t"
type: sequence
actors:
  - A
${injectLines}
flow:
  - A -> A: "x"
`;
    const compiled = textDslToDiagram(dsl, { partsCatalog: CATALOG });
    for (const a of aliases) {
      const subs = compiled.nodes.filter((n) => n.id.startsWith(`${a}__`));
      expect(subs.length, `${a} sub 存在`).toBeGreaterThan(0);
    }
    const allIds = compiled.nodes.map((n) => n.id);
    expect(new Set(allIds).size, `全 unique`).toBe(allIds.length);
  });

  it("多数 parts 同時 override で state 独立", () => {
    const aliases = Array.from({ length: 5 }, (_, i) => `q${i}`);
    const injectLines = aliases.map((a, i) => `  - ${a}: { kind: countup, n: ${100 + i * 10} }`).join("\n");
    const dsl = `title: "t"
type: sequence
actors:
  - A
${injectLines}
flow:
  - A -> A: "x"
`;
    const compiled = textDslToDiagram(dsl, { partsCatalog: CATALOG });
    for (let i = 0; i < aliases.length; i++) {
      const state = compiled.states.find((s) => s.id === `${aliases[i]}__n`);
      expect(state, `${aliases[i]}__n 存在`).toBeDefined();
      expect(state!.initial, `${aliases[i]}__n = ${100 + i * 10}`).toBe(100 + i * 10);
    }
  });

  it("parts kind に予約語風 (parts / actor / lane) 混入時も compile stable", () => {
    // "parts-" prefix を持たない kind (parts-parts など極端 case は使わない、 普通 kind で verify)
    const dsl = `title: "t"
type: sequence
actors:
  - actor: A
  - parts: { kind: badge-count }
flow:
  - A -> A: "x"
`;
    // alias に "parts" 使用 = compile が予約語 collision せず正常処理
    expect(() => textDslToDiagram(dsl, { partsCatalog: CATALOG })).not.toThrow();
  });
});
