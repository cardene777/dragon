/**
 * parts state override 検証 unit test (iter7、 2026-07-19)。
 *
 * user unified syntax で `{ kind: badge-count, cnt: 99 }` 形式の inline field は parts state
 * override として parts の state.initial を上書きする経路。 compile 側の stateOverride reflow を
 * verify する。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { partsBadgeCount, partsCountup } from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

describe("iter7: parts state override", () => {
  it("badge-count の cnt state を 99 で override", () => {
    const dsl = `title: "t"
type: sequence

actors:
  - A
  - test1: { kind: badge-count, cnt: 99 }

flow:
  - A -> A: "x"
`;
    const partsCatalog: Record<string, CdlDiagram> = { "parts-badge-count": partsBadgeCount };
    const compiled = textDslToDiagram(dsl, { partsCatalog });
    const cntState = compiled.states.find((s) => s.id === "test1__cnt");
    expect(cntState, "state test1__cnt が prefix 付きで存在").toBeDefined();
    expect(cntState!.initial, "cnt override で initial=99").toBe(99);
  });

  it("countup の n state を 500 で override (parts 側 state 名は `n`)", () => {
    const dsl = `title: "t"
type: sequence

actors:
  - A
  - c1: { kind: countup, n: 500 }

flow:
  - A -> A: "x"
`;
    const partsCatalog: Record<string, CdlDiagram> = { "parts-countup": partsCountup };
    const compiled = textDslToDiagram(dsl, { partsCatalog });
    const nState = compiled.states.find((s) => s.id === "c1__n");
    expect(nState, "state c1__n が prefix 付きで存在 (states=" + compiled.states.map(s => s.id).join(",") + ")").toBeDefined();
    expect(nState!.initial, "n override で initial=500").toBe(500);
  });

  it("override なし (kind only) では state.initial が parts default", () => {
    const dsl = `title: "t"
type: sequence

actors:
  - A
  - test1: { kind: badge-count }

flow:
  - A -> A: "x"
`;
    const partsCatalog: Record<string, CdlDiagram> = { "parts-badge-count": partsBadgeCount };
    const compiled = textDslToDiagram(dsl, { partsCatalog });
    const cntState = compiled.states.find((s) => s.id === "test1__cnt");
    expect(cntState!.initial, "override なし → parts default (0)").toBe(0);
  });
});
