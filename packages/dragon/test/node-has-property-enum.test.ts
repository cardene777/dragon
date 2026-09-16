/**
 * node has-property enum coverage (iter72、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter72。
 * 全 sample × 全 parts の node で property 存在率を verify (has-property enum coverage)。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";
import * as PartsMod from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

function collectAllParts(mod: unknown): Array<{ name: string; diagram: CdlDiagram }> {
  const out: Array<{ name: string; diagram: CdlDiagram }> = [];
  for (const [name, val] of Object.entries(mod as Record<string, unknown>)) {
    if (!val || typeof val !== "object") continue;
    const d = val as Partial<CdlDiagram>;
    if (typeof d.id === "string" && Array.isArray(d.nodes)) {
      out.push({ name, diagram: d as CdlDiagram });
    }
  }
  return out;
}

const ALL_PARTS = collectAllParts(PartsMod);

describe("iter72: node has-property enum coverage", () => {
  describe("EDITOR_SAMPLES", () => {
    for (const sample of EDITOR_SAMPLES) {
      it(`${sample.label}: node は少なくとも id property を持つ`, () => {
        const d = textDslToDiagram(sample.code);
        for (const n of d.nodes) {
          expect("id" in n).toBe(true);
        }
      });

      it(`${sample.label}: node property key の総数が 200 以下 (property 爆発検知)`, () => {
        const d = textDslToDiagram(sample.code);
        for (const n of d.nodes) {
          expect(Object.keys(n).length).toBeLessThanOrEqual(200);
        }
      });
    }
  });

  describe("parts.cdl.ts", () => {
    for (const { name, diagram } of ALL_PARTS) {
      it(`${name}: 全 node が id property を持つ`, () => {
        for (const n of diagram.nodes) {
          expect("id" in n).toBe(true);
        }
      });

      it(`${name}: property key 数 <= 100`, () => {
        for (const n of diagram.nodes) {
          expect(Object.keys(n).length).toBeLessThanOrEqual(100);
        }
      });
    }
  });
});
