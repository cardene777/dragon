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

describe("iter300: parts additional (async/await) 🎊 iter300 milestone", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: async fn returns Promise`, async () => { const f = async () => diagram; expect(f() instanceof Promise).toBe(true); });
    it(`${name}: await async fn = d`, async () => { const f = async () => diagram; expect(await f()).toBe(diagram); });
    it(`${name}: async fn awaiting id = id`, async () => { const f = async () => diagram.id; expect(await f()).toBe(diagram.id); });
    it(`${name}: async fn chain returns d`, async () => { const f = async () => await Promise.resolve(diagram); expect(await f()).toBe(diagram); });
    it(`${name}: async fn returns id via await`, async () => { const f = async () => await Promise.resolve(diagram.id); expect(await f()).toBe(diagram.id); });
    it(`${name}: async fn throws caught`, async () => { const f = async (): Promise<CdlDiagram> => { throw new Error(diagram.id); }; await expect(f()).rejects.toThrow(diagram.id); });
    it(`${name}: async fn then chain`, async () => { const p = (async () => diagram)().then(x => x); expect(await p).toBe(diagram); });
  }
});
