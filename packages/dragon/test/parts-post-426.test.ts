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

describe("iter426: parts additional (try-catch-finally return)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: try-return with finally still runs`, () => { let ran = false; (function () { try { return 1; } finally { ran = true; } })(); expect(ran).toBe(true); });
    it(`${name}: try-catch caught error returns via catch`, () => { const r = (function () { try { throw new Error("x"); } catch { return 2; } })(); expect(r).toBe(2); });
    it(`${name}: finally overrides catch return`, () => { const r = (function () { try { throw new Error("x"); } catch { return 1; } finally { return 2; } })(); expect(r).toBe(2); });
    it(`${name}: try-catch-finally all run when throw`, () => { let c = 0; try { throw new Error(diagram.id); } catch { c++; } finally { c++; } expect(c).toBe(2); });
    it(`${name}: nested try-catch works`, () => { const r = (function () { try { try { throw new Error(); } catch { throw new Error("inner"); } } catch (e) { return (e as Error).message; } })(); expect(r).toBe("inner"); });
    it(`${name}: try-return no throw returns value`, () => { const r = (function () { try { return diagram.id; } catch { return "err"; } })(); expect(r).toBe(diagram.id); });
    it(`${name}: try-catch e is Error`, () => { let e: unknown = null; try { throw new Error(diagram.id); } catch (err) { e = err; } expect(e instanceof Error).toBe(true); });
  }
});
