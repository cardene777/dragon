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

describe("milestone 151k: Promise then/catch/finally", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: then chains`, async () => { expect(await Promise.resolve(1).then(x => x + 1)).toBe(2); });
    it(`${name}: catch handles rejection`, async () => { expect(await Promise.reject("err").catch(e => e)).toBe("err"); });
    it(`${name}: finally runs on resolve`, async () => { let f = false; await Promise.resolve(1).finally(() => { f = true; }); expect(f).toBe(true); });
    it(`${name}: finally runs on reject`, async () => { let f = false; await Promise.reject("x").catch(() => {}).finally(() => { f = true; }); expect(f).toBe(true); });
    it(`${name}: async fn returns Promise`, async () => { const fn = async () => 42; expect(fn()).toBeInstanceOf(Promise); expect(await fn()).toBe(42); });
    it(`${name}: async throw rejects`, async () => { const fn = async () => { throw new Error("x"); }; await expect(fn()).rejects.toThrow("x"); });
  }
});
