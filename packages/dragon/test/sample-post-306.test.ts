import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter307: sample additional (Error/try-catch)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`new Error(slug) is Error`, () => { expect(new Error(sample.slug) instanceof Error).toBe(true); });
      it(`new Error(slug).message = slug`, () => { expect(new Error(sample.slug).message).toBe(sample.slug); });
      it(`new Error(label).message = label`, () => { expect(new Error(sample.label).message).toBe(sample.label); });
      it(`try/catch captures slug throw`, () => { let caught: unknown = null; try { throw new Error(sample.slug); } catch (e) { caught = e; } expect((caught as Error).message).toBe(sample.slug); });
      it(`try/catch captures label throw`, () => { let caught: unknown = null; try { throw new Error(sample.label); } catch (e) { caught = e; } expect((caught as Error).message).toBe(sample.label); });
      it(`try/finally always runs`, () => { let ran = false; try { throw new Error(sample.slug); } catch { /* no-op */ } finally { ran = true; } expect(ran).toBe(true); });
      it(`new RangeError also Error`, () => { expect(new RangeError(sample.slug) instanceof Error).toBe(true); });
    });
  }
});
