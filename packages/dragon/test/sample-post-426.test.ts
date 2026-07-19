import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter427: sample additional (try-catch-finally return)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`try-return with finally still runs`, () => { let ran = false; (function () { try { return 1; } finally { ran = true; } })(); expect(ran).toBe(true); });
      it(`try-catch caught returns via catch`, () => { const r = (function () { try { throw new Error(sample.slug); } catch { return 2; } })(); expect(r).toBe(2); });
      it(`finally overrides catch return`, () => { const r = (function () { try { throw new Error(sample.slug); } catch { return 1; } finally { return 2; } })(); expect(r).toBe(2); });
      it(`try-catch-finally all run when throw`, () => { let c = 0; try { throw new Error(sample.slug); } catch { c++; } finally { c++; } expect(c).toBe(2); });
      it(`nested try-catch works`, () => { const r = (function () { try { try { throw new Error(); } catch { throw new Error("inner"); } } catch (e) { return (e as Error).message; } })(); expect(r).toBe("inner"); });
      it(`try-return no throw returns value`, () => { const r = (function () { try { return sample.slug; } catch { return "err"; } })(); expect(r).toBe(sample.slug); });
      it(`try-catch e is Error`, () => { let e: unknown = null; try { throw new Error(sample.label); } catch (err) { e = err; } expect(e instanceof Error).toBe(true); });
    });
  }
});
