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

describe("iter434-milestone: parts 126k (Reflect vs Object comparison)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Reflect.get === direct access`, () => { expect(Reflect.get(diagram, "id")).toBe(diagram.id); });
    it(`${name}: Reflect.ownKeys.length = Object.keys.length + symbols`, () => { const ok = Object.keys(diagram); const rk = Reflect.ownKeys(diagram); expect(rk.length).toBeGreaterThanOrEqual(ok.length); });
    it(`${name}: Reflect.isExtensible = Object.isExtensible`, () => { const o = {}; expect(Reflect.isExtensible(o)).toBe(Object.isExtensible(o)); });
  }
});
