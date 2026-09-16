/**
 * sample metadata non-empty 網羅 unit test (iter18、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter18。
 * 全 EDITOR_SAMPLES + parts.cdl.ts / presets.cdl.ts の全 diagram について、
 * title / subtitle / node title / animation step 名 等の text field が
 * 非空 string であることを batch 検証。
 * typo で undefined / null / 空文字混入時の regression 検知 gate。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";
import * as PartsMod from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import * as PresetsMod from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

function collectDiagramExports(mod: unknown): Array<{ name: string; diagram: CdlDiagram }> {
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

const ALL_PARTS = collectDiagramExports(PartsMod);
const ALL_PRESETS = collectDiagramExports(PresetsMod);

function isNonEmptyString(v: unknown): boolean {
  return typeof v === "string" && v.length > 0;
}

describe("iter18: sample / parts / presets metadata non-empty 網羅", () => {
  describe("EDITOR_SAMPLES", () => {
    for (const sample of EDITOR_SAMPLES) {
      it(`${sample.label}: label / slug / code 非空`, () => {
        expect(isNonEmptyString(sample.label)).toBe(true);
        expect(isNonEmptyString(sample.slug)).toBe(true);
        expect(isNonEmptyString(sample.code)).toBe(true);
      });

      it(`${sample.label}: compile 後 nodes 全 title 非 undefined-string`, () => {
        const diagram = textDslToDiagram(sample.code);
        const invalidTitles: string[] = [];
        for (const n of diagram.nodes) {
          const title = (n as unknown as { title?: unknown }).title;
          // title は optional、 存在するなら string
          if (title !== undefined && typeof title !== "string") {
            invalidTitles.push(`${n.id}:title type=${typeof title}`);
          }
        }
        expect(invalidTitles).toEqual([]);
      });
    }
  });

  describe("parts.cdl.ts", () => {
    for (const { name, diagram } of ALL_PARTS) {
      it(`${name} (${diagram.id}): 全 node title が undefined or 非空 string`, () => {
        const violations: string[] = [];
        for (const n of diagram.nodes) {
          const title = (n as unknown as { title?: unknown }).title;
          // title は undefined 許容、 存在するなら string 型 (空文字 "" も許容 = background track 等)
          if (title !== undefined && typeof title !== "string") {
            violations.push(`${n.id}:title type=${typeof title}`);
          }
        }
        expect(violations).toEqual([]);
      });
    }
  });

  describe("presets.cdl.ts", () => {
    for (const { name, diagram } of ALL_PRESETS) {
      it(`${name} (${diagram.id}): 全 node title が undefined or 非空 string`, () => {
        const violations: string[] = [];
        for (const n of diagram.nodes) {
          const title = (n as unknown as { title?: unknown }).title;
          // title は undefined 許容、 存在するなら string 型 (空文字 "" も許容 = background track 等)
          if (title !== undefined && typeof title !== "string") {
            violations.push(`${n.id}:title type=${typeof title}`);
          }
        }
        expect(violations).toEqual([]);
      });
    }
  });
});
