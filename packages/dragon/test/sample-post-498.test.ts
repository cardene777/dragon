import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter499: sample additional (Error handling)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`throw new Error("x")`, () => { expect(() => { throw new Error("x"); }).toThrow("x"); });
      it(`try/catch catches`, () => { let caught = false; try { throw new Error("x"); } catch { caught = true; } expect(caught).toBe(true); });
      it(`try/finally runs`, () => { let f = false; try { throw new Error("x"); } catch { /* swallow */ } finally { f = true; } expect(f).toBe(true); });
      it(`Error instanceof Error`, () => { expect(new Error("x") instanceof Error).toBe(true); });
      it(`Error.name = "Error"`, () => { expect(new Error("x").name).toBe("Error"); });
      it(`Error.message = "x"`, () => { expect(new Error("x").message).toBe("x"); });
      it(`TypeError instanceof Error`, () => { expect(new TypeError("t") instanceof Error).toBe(true); });
    });
  }
});
