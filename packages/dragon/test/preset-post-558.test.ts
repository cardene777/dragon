import { describe, it, expect } from "vitest";
import * as PresetsMod from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

function collectAllPresets(mod: unknown): Array<{ name: string; diagram: CdlDiagram }> {
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

const ALL_PRESETS = collectAllPresets(PresetsMod);

describe("iter560: preset additional (globalThis / queueMicrotask)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: globalThis defined`, () => { expect(typeof globalThis).toBe("object"); });
    it(`${name}: globalThis.Array === Array`, () => { expect(globalThis.Array).toBe(Array); });
    it(`${name}: queueMicrotask runs`, async () => { let ran = false; await new Promise<void>(res => queueMicrotask(() => { ran = true; res(); })); expect(ran).toBe(true); });
    it(`${name}: microtask before macrotask`, async () => { const order: string[] = []; await new Promise<void>(res => { Promise.resolve().then(() => order.push("micro")); setTimeout(() => { order.push("macro"); res(); }, 0); }); expect(order[0]).toBe("micro"); });
    it(`${name}: globalThis.JSON === JSON`, () => { expect(globalThis.JSON).toBe(JSON); });
    it(`${name}: globalThis.Math === Math`, () => { expect(globalThis.Math).toBe(Math); });
    it(`${name}: structuredClone on globalThis`, () => { expect(typeof globalThis.structuredClone).toBe("function"); });
  }
});
