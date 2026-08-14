/**
 * state-holding parts × 全 15 sample × state override 網羅 (iter21、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter21。
 * state を持つ 57 parts × 15 sample = 684 test で「state override が実 sample 環境で有効」
 * を verify。 sample の flow / animation 定義と共存しても state.initial が override 値を
 * 反映することを batch check。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";
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

function injectPartsIntoSampleDsl(sampleDsl: string, alias: string, kind: string, overrides: string): string {
  const lines = sampleDsl.split("\n");
  const actorsIdx = lines.findIndex((l) => l.trim().startsWith("actors:"));
  if (actorsIdx === -1) return `${sampleDsl}\nactors:\n  - ${alias}: { kind: ${kind}${overrides ? `, ${overrides}` : ""} }\n`;
  let insertIdx = actorsIdx + 1;
  while (insertIdx < lines.length) {
    const line = lines[insertIdx];
    if (line.match(/^[a-zA-Z]/) || line.trim() === "") break;
    insertIdx++;
  }
  const before = lines.slice(0, insertIdx);
  const after = lines.slice(insertIdx);
  return [...before, `  - ${alias}: { kind: ${kind}${overrides ? `, ${overrides}` : ""} }`, ...after].join("\n");
}

describe("iter21: 全 state-holding parts × 全 15 sample × state override 網羅", () => {
  it(`state parts 数 + samples 数 sanity`, () => {
    expect(STATE_PARTS.length).toBeGreaterThan(0);
    expect(EDITOR_SAMPLES.length).toBe(15);
  });

  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.slug} (${sample.label})`, () => {
      for (const info of STATE_PARTS) {
        it(`parts ${info.name}: 全 state override が sample 環境で反映`, () => {
          const kindValue = info.diagram.id.startsWith("parts-") ? info.diagram.id.slice(6) : info.diagram.id;
          const alias = "sOv1";
          const overrides = info.stateNames.map((n, i) => `${n}: ${88 + i}`).join(", ");
          const injectedDsl = injectPartsIntoSampleDsl(sample.code, alias, kindValue, overrides);
          const partsCatalog: Record<string, CdlDiagram> = { [info.diagram.id]: info.diagram };
          const compiled = textDslToDiagram(injectedDsl, { partsCatalog });
          for (let i = 0; i < info.stateNames.length; i++) {
            const stateName = info.stateNames[i];
            const expected = 88 + i;
            const prefixedId = `${alias}__${stateName}`;
            const state = compiled.states.find((s) => s.id === prefixedId);
            expect(state, `${info.name} × ${sample.slug}: state ${prefixedId} 存在`).toBeDefined();
            expect(state!.initial, `${info.name} × ${sample.slug}: ${stateName} override=${expected}`).toBe(expected);
          }
        });
      }
    });
  }
});
