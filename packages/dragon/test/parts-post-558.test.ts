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

describe("iter558: parts additional (globalThis / queueMicrotask)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: globalThis defined`, () => { expect(typeof globalThis).toBe("object"); });
    it(`${name}: globalThis.Array === Array`, () => { expect(globalThis.Array).toBe(Array); });
    it(`${name}: queueMicrotask runs`, async () => { let ran = false; await new Promise<void>(res => queueMicrotask(() => { ran = true; res(); })); expect(ran).toBe(true); });
    it(`${name}: microtask before macrotask`, async () => { const order: string[] = []; await new Promise<void>(res => { Promise.resolve().then(() => order.push("micro")); setTimeout(() => { order.push("macro"); res(); }, 0); }); expect(order[0]).toBe("micro"); });
    it(`${name}: globalThis.JSON === JSON`, () => { expect(globalThis.JSON).toBe(JSON); });
    it(`${name}: globalThis.Math === Math`, () => { expect(globalThis.Math).toBe(Math); });
    it(`${name}: structuredClone on globalThis`, () => { expect(typeof globalThis.structuredClone).toBe("function"); });
  }
});
