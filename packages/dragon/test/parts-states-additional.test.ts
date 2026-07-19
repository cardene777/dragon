/**
 * parts states additional property (iter78、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter78。
 * 全 80 parts の state additional property verify。
 */
import { describe, it, expect } from "vitest";
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

describe("iter78: 全 parts × state additional property verify", () => {
  it(`parts 検出`, () => {
    expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60);
  });

  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: states 配列型 (存在時)`, () => {
      const states = (diagram as unknown as { states?: unknown }).states;
      if (states !== undefined) {
        expect(Array.isArray(states)).toBe(true);
      }
    });

    it(`${name}: 全 state が object`, () => {
      const states = (diagram as unknown as { states?: unknown[] }).states ?? [];
      for (const s of states) {
        expect(typeof s).toBe("object");
        expect(s).not.toBeNull();
      }
    });

    it(`${name}: 全 state に id field 存在 + string`, () => {
      const states = (diagram as unknown as { states?: Array<{ id?: unknown }> }).states ?? [];
      for (const s of states) {
        expect(typeof s.id).toBe("string");
      }
    });

    it(`${name}: 全 state に initial field 存在`, () => {
      const states = (diagram as unknown as { states?: Array<{ initial?: unknown }> }).states ?? [];
      for (const s of states) {
        expect("initial" in s).toBe(true);
      }
    });
  }
});
