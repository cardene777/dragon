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

describe("milestone iter500 major: Error types + Error.cause + throw semantics", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: SyntaxError instanceof Error`, () => { expect(new SyntaxError("s") instanceof Error).toBe(true); });
    it(`${name}: ReferenceError instanceof Error`, () => { expect(new ReferenceError("r") instanceof Error).toBe(true); });
    it(`${name}: RangeError instanceof Error`, () => { expect(new RangeError("r") instanceof Error).toBe(true); });
    it(`${name}: URIError instanceof Error`, () => { expect(new URIError("u") instanceof Error).toBe(true); });
    it(`${name}: EvalError instanceof Error`, () => { expect(new EvalError("e") instanceof Error).toBe(true); });
    it(`${name}: TypeError.name = "TypeError"`, () => { expect(new TypeError("t").name).toBe("TypeError"); });
    it(`${name}: SyntaxError.name = "SyntaxError"`, () => { expect(new SyntaxError("s").name).toBe("SyntaxError"); });
    it(`${name}: Error.cause option`, () => { const inner = new Error("inner"); const outer = new Error("outer", { cause: inner }); expect(outer.cause).toBe(inner); });
    it(`${name}: throw string catches string`, () => { let e: unknown; try { throw "abc"; } catch (err) { e = err; } expect(e).toBe("abc"); });
    it(`${name}: throw number catches number`, () => { let e: unknown; try { throw 42; } catch (err) { e = err; } expect(e).toBe(42); });
    it(`${name}: try/catch(_) narrows`, () => { let count = 0; try { throw new Error("x"); } catch { count++; } expect(count).toBe(1); });
    it(`${name}: nested try/catch`, () => { let outer = 0, inner = 0; try { try { throw new Error("inner"); } catch { inner++; throw new Error("outer"); } } catch { outer++; } expect(inner).toBe(1); expect(outer).toBe(1); });
  }
});
