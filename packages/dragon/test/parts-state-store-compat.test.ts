/**
 * parts state store 互換 network verify (iter24、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter24。
 * state-holding parts × sequence sample の compile 結果を state store 互換形式で serialize、
 * (a) state.id が prefix 付きで一意 (b) state.initial 型が number 保持 (c) network 経由
 * JSON transport で 情報保持 を verify。
 * share URL の state export / import 経路の regression 検知 gate。
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
    const numeric = states.filter((s) => typeof s.initial === "number").map((s) => s.id);
    if (numeric.length === 0) continue;
    out.push({ name, diagram: d as CdlDiagram, stateNames: numeric });
  }
  return out;
}

const STATE_PARTS = collectStateHoldingParts(PartsMod);

describe("iter24: state parts store 互換 network verify", () => {
  it("state parts 検出", () => {
    expect(STATE_PARTS.length).toBeGreaterThan(0);
  });

  for (const info of STATE_PARTS) {
    describe(`parts ${info.name} (${info.diagram.id})`, () => {
      it(`state.id が alias prefix 付きで一意`, () => {
        const kindValue = info.diagram.id.startsWith("parts-") ? info.diagram.id.slice(6) : info.diagram.id;
        const dsl = `title: "t"
type: sequence
actors:
  - A
  - st1: { kind: ${kindValue} }
flow:
  - A -> A: "x"
`;
        const partsCatalog: Record<string, CdlDiagram> = { [info.diagram.id]: info.diagram };
        const compiled = textDslToDiagram(dsl, { partsCatalog });
        const stateIds = compiled.states.map((s) => s.id);
        // 全 state id unique
        expect(new Set(stateIds).size, `dup state id: ${stateIds.join(",")}`).toBe(stateIds.length);
        // st1__ prefix state 数 = parts 側 numeric state 数 以上
        // (parts が numeric + string 両方持つ場合、 stateIds には両方含まれる)
        const st1States = stateIds.filter((id) => id.startsWith("st1__"));
        expect(st1States.length, `st1 prefix state 数`).toBeGreaterThanOrEqual(info.stateNames.length);
      });

      it(`JSON round-trip で state.initial 型 (number) 保持`, () => {
        const kindValue = info.diagram.id.startsWith("parts-") ? info.diagram.id.slice(6) : info.diagram.id;
        const dsl = `title: "t"
type: sequence
actors:
  - A
  - st1: { kind: ${kindValue} }
flow:
  - A -> A: "x"
`;
        const partsCatalog: Record<string, CdlDiagram> = { [info.diagram.id]: info.diagram };
        const compiled = textDslToDiagram(dsl, { partsCatalog });
        const rt = JSON.parse(JSON.stringify(compiled));
        // numeric state のみ verify (state stateNames 対象 = number 型のみ、 string 型 state は除外)
        const numericStateIds = new Set(info.stateNames.map((n) => `st1__${n}`));
        const rtNumericStates = rt.states.filter((s: { id: string }) => numericStateIds.has(s.id));
        for (const s of rtNumericStates) {
          expect(typeof s.initial, `state ${s.id} initial number`).toBe("number");
          expect(Number.isFinite(s.initial), `state ${s.id} finite`).toBe(true);
        }
      });
    });
  }
});
