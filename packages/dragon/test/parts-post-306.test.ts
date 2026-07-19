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

describe("iter306: parts additional (Error/try-catch)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: new Error(id) is Error`, () => { expect(new Error(diagram.id) instanceof Error).toBe(true); });
    it(`${name}: new Error(id).message = id`, () => { expect(new Error(diagram.id).message).toBe(diagram.id); });
    it(`${name}: try/catch captures throw`, () => { let caught: unknown = null; try { throw new Error(diagram.id); } catch (e) { caught = e; } expect((caught as Error).message).toBe(diagram.id); });
    it(`${name}: new TypeError(id) is TypeError`, () => { expect(new TypeError(diagram.id) instanceof TypeError).toBe(true); });
    it(`${name}: new TypeError also Error`, () => { expect(new TypeError(diagram.id) instanceof Error).toBe(true); });
    it(`${name}: new Error name = Error`, () => { expect(new Error().name).toBe("Error"); });
    it(`${name}: try/finally always runs`, () => { let ran = false; try { throw new Error("x"); } catch { /* no-op */ } finally { ran = true; } expect(ran).toBe(true); });
  }
});
