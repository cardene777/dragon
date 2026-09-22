/**
 * 全 state-holding parts × 状態変数 override 網羅 unit test (iter9、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter9。
 * parts.cdl.ts の全 parts のうち state を持つ全 parts について、 unified syntax の inline field
 * override が全 state を正しく上書きすることを batch 検証する。
 *
 * 検証内容 = 各 parts の全 state を「distinctive 番号 (77 開始 + index)」 で override、
 * compile 後の states[].initial が override 値を反映するか + prefix (alias__stateName) が
 * 正しく付くかを assert。
 *
 * iter7 の 2 parts (badge-count / countup) 単発検証を state-holding parts 全件に拡張、
 * state reflow 経路の網羅性を保証。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import * as PartsMod from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

interface PartsInfo {
  name: string;
  diagram: CdlDiagram;
  stateNames: string[];
}

function collectStateHoldingParts(mod: unknown): PartsInfo[] {
  const out: PartsInfo[] = [];
  for (const [name, val] of Object.entries(mod as Record<string, unknown>)) {
    if (!val || typeof val !== "object") continue;
    const d = val as Partial<CdlDiagram>;
    if (typeof d.id !== "string" || !Array.isArray(d.nodes)) continue;
    const states = (d as { states?: Array<{ id: string; initial: unknown }> }).states;
    if (!Array.isArray(states) || states.length === 0) continue;
    const numericStates = states.filter((s) => typeof s.initial === "number").map((s) => s.id);
    if (numericStates.length === 0) continue;
    out.push({ name, diagram: d as CdlDiagram, stateNames: numericStates });
  }
  return out;
}

const STATE_PARTS = collectStateHoldingParts(PartsMod);

describe("iter9: 全 state-holding parts × 状態変数 override 網羅", () => {
  it(`state-holding parts 検出`, () => {
    expect(STATE_PARTS.length, `state を持つ parts 数 (現状: ${STATE_PARTS.length})`).toBeGreaterThan(0);
  });

  for (const info of STATE_PARTS) {
    describe(`parts ${info.name} (${info.diagram.id}, state 数=${info.stateNames.length})`, () => {
      const kindValue = info.diagram.id.startsWith("parts-") ? info.diagram.id.slice(6) : info.diagram.id;
      const alias = "st1";

      it(`全 ${info.stateNames.length} state を override → 各 initial が override 値を反映`, () => {
        // 全 state を 77 + index で override
        const overrides = info.stateNames.map((n, i) => `${n}: ${77 + i}`).join(", ");
        const dsl = `title: "t"
type: sequence

actors:
  - A
  - ${alias}: { kind: ${kindValue}, ${overrides} }

flow:
  - A -> A: "x"
`;
        const partsCatalog: Record<string, CdlDiagram> = { [info.diagram.id]: info.diagram };
        const compiled = textDslToDiagram(dsl, { partsCatalog });
        for (let i = 0; i < info.stateNames.length; i++) {
          const stateName = info.stateNames[i];
          const expected = 77 + i;
          const prefixedId = `${alias}__${stateName}`;
          const state = compiled.states.find((s) => s.id === prefixedId);
          expect(state, `${info.name}: state ${prefixedId} が prefix 付きで存在 (states=${compiled.states.map((s) => s.id).join(",")})`).toBeDefined();
          expect(state!.initial, `${info.name}: ${stateName} override で initial=${expected}`).toBe(expected);
        }
      });

      it(`override なし (kind only) → 各 state.initial が parts 側 default 継承`, () => {
        const dsl = `title: "t"
type: sequence

actors:
  - A
  - ${alias}: { kind: ${kindValue} }

flow:
  - A -> A: "x"
`;
        const partsCatalog: Record<string, CdlDiagram> = { [info.diagram.id]: info.diagram };
        const compiled = textDslToDiagram(dsl, { partsCatalog });
        // 状態の名前が 0 件だと、下の繰り返しが 1 度も回らずに通る
        expect(info.stateNames.length, `${info.name} の状態の名前が 0 件`).toBeGreaterThan(0);
        for (const stateName of info.stateNames) {
          const prefixedId = `${alias}__${stateName}`;
          const state = compiled.states.find((s) => s.id === prefixedId);
          expect(state, `${info.name}: state ${prefixedId} 存在`).toBeDefined();
          // parts 側 default と一致 (parts.cdl 定義の初期値)
          const partsSource = (info.diagram as { states: Array<{ id: string; initial: number }> }).states.find((s) => s.id === stateName);
          expect(state!.initial, `${info.name}: ${stateName} default 継承`).toBe(partsSource!.initial);
        }
      });
    });
  }
});
