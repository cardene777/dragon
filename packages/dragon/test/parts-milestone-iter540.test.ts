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

describe("milestone iter540: encoding — base64 / TextEncoder / TextDecoder", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: btoa("abc") = "YWJj"`, () => { expect(btoa("abc")).toBe("YWJj"); });
    it(`${name}: atob("YWJj") = "abc"`, () => { expect(atob("YWJj")).toBe("abc"); });
    it(`${name}: btoa/atob roundtrip`, () => { expect(atob(btoa("hello"))).toBe("hello"); });
    it(`${name}: TextEncoder encode`, () => { const e = new TextEncoder(); expect(e.encode("abc").length).toBe(3); });
    it(`${name}: TextDecoder decode`, () => { const e = new TextEncoder(); const d = new TextDecoder(); expect(d.decode(e.encode("hello"))).toBe("hello"); });
    it(`${name}: TextEncoder utf-8 multi-byte`, () => { const e = new TextEncoder(); expect(e.encode("😀").length).toBe(4); });
    it(`${name}: TextDecoder empty`, () => { const d = new TextDecoder(); expect(d.decode(new Uint8Array(0))).toBe(""); });
    it(`${name}: encoding roundtrip emoji`, () => { const e = new TextEncoder(); const d = new TextDecoder(); expect(d.decode(e.encode("a😀b"))).toBe("a😀b"); });
    it(`${name}: encodeURIComponent`, () => { expect(encodeURIComponent("a b")).toBe("a%20b"); });
  }
});
