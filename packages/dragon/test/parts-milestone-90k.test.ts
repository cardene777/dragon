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

function tag(strings: TemplateStringsArray, ...values: unknown[]) {
  return strings.raw.length + values.length;
}

describe("🎊🎊 90k test milestone: parts (tagged template)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: tag\`\${id}\` = 2`, () => { expect(tag`${diagram.id}`).toBe(3); });
    it(`${name}: tag\`no-interp\` = 1`, () => { expect(tag`no-interp`).toBe(1); });
    it(`${name}: tag\`\${a}\${b}\` = 5`, () => { expect(tag`${diagram.id}${diagram.id}`).toBe(5); });
  }
});
