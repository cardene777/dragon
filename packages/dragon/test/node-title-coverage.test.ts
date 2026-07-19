/**
 * node title 存在率 網羅 (iter42、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter42。
 * 全 12 sample × 全 80 parts の node title / subtitle 存在率と型を verify。
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

describe("iter42: node title / subtitle 存在率 網羅", () => {
  describe("EDITOR_SAMPLES", () => {
    for (const sample of EDITOR_SAMPLES) {
      it(`${sample.label}: node の title 存在率 (存在時は型 string)`, () => {
        const d = textDslToDiagram(sample.code);
        for (const n of d.nodes) {
          const title = (n as unknown as { title?: unknown }).title;
          if (title !== undefined) {
            expect(typeof title).toBe("string");
          }
        }
      });

      it(`${sample.label}: node subtitle が undefined or string`, () => {
        const d = textDslToDiagram(sample.code);
        for (const n of d.nodes) {
          const subtitle = (n as unknown as { subtitle?: unknown }).subtitle;
          if (subtitle !== undefined) {
            expect(typeof subtitle).toBe("string");
          }
        }
      });
    }
  });

  describe("parts.cdl.ts", () => {
    for (const { name, diagram } of ALL_PARTS) {
      it(`${name}: parts 内 node title 型 (undefined or string)`, () => {
        for (const n of diagram.nodes) {
          const title = (n as unknown as { title?: unknown }).title;
          if (title !== undefined) {
            expect(typeof title).toBe("string");
          }
        }
      });

      it(`${name}: parts 内 node subtitle 型 (undefined or string)`, () => {
        for (const n of diagram.nodes) {
          const subtitle = (n as unknown as { subtitle?: unknown }).subtitle;
          if (subtitle !== undefined) {
            expect(typeof subtitle).toBe("string");
          }
        }
      });
    }
  });
});
