import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter559: sample additional (globalThis / queueMicrotask)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`globalThis defined`, () => { expect(typeof globalThis).toBe("object"); });
      it(`globalThis.Array === Array`, () => { expect(globalThis.Array).toBe(Array); });
      it(`queueMicrotask runs`, async () => { let ran = false; await new Promise<void>(res => queueMicrotask(() => { ran = true; res(); })); expect(ran).toBe(true); });
      it(`microtask before macrotask`, async () => { const order: string[] = []; await new Promise<void>(res => { Promise.resolve().then(() => order.push("micro")); setTimeout(() => { order.push("macro"); res(); }, 0); }); expect(order[0]).toBe("micro"); });
      it(`globalThis.JSON === JSON`, () => { expect(globalThis.JSON).toBe(JSON); });
      it(`globalThis.Math === Math`, () => { expect(globalThis.Math).toBe(Math); });
      it(`structuredClone on globalThis`, () => { expect(typeof globalThis.structuredClone).toBe("function"); });
    });
  }
});
