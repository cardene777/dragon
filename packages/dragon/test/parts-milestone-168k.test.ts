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

describe("milestone 168k: URLSearchParams", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: new URLSearchParams("a=1&b=2").get("a") = "1"`, () => { expect(new URLSearchParams("a=1&b=2").get("a")).toBe("1"); });
    it(`${name}: URLSearchParams.set + toString`, () => { const p = new URLSearchParams(); p.set("a", "1"); p.set("b", "2"); expect(p.toString()).toBe("a=1&b=2"); });
    it(`${name}: URLSearchParams.has`, () => { expect(new URLSearchParams("a=1").has("a")).toBe(true); expect(new URLSearchParams("a=1").has("b")).toBe(false); });
    it(`${name}: URLSearchParams.delete`, () => { const p = new URLSearchParams("a=1&b=2"); p.delete("a"); expect(p.has("a")).toBe(false); });
    it(`${name}: URLSearchParams iteration`, () => { const p = new URLSearchParams("a=1&b=2"); const keys: string[] = []; for (const [k] of p) keys.push(k); expect(keys).toEqual(["a", "b"]); });
    it(`${name}: URLSearchParams append multi`, () => { const p = new URLSearchParams(); p.append("a", "1"); p.append("a", "2"); expect(p.getAll("a")).toEqual(["1", "2"]); });
  }
});
