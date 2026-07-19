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

describe("iter330: parts additional (Template literal)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: \`\${id}\` = id`, () => { expect(`${diagram.id}`).toBe(diagram.id); });
    it(`${name}: \`prefix-\${id}\` starts with prefix`, () => { expect(`prefix-${diagram.id}`.startsWith("prefix-")).toBe(true); });
    it(`${name}: \`\${id}-suffix\` ends with suffix`, () => { expect(`${diagram.id}-suffix`.endsWith("-suffix")).toBe(true); });
    it(`${name}: \`\${id}\${id}\` length = 2x`, () => { expect(`${diagram.id}${diagram.id}`.length).toBe(diagram.id.length * 2); });
    it(`${name}: tagged: raw preserves \\n`, () => { const t = String.raw`a\nb`; expect(t).toBe("a\\nb"); });
    it(`${name}: multiline template preserves newline`, () => { expect(`a\nb`).toBe("a\nb"); });
    it(`${name}: \`\${nodes.length}\` = string`, () => { expect(typeof `${diagram.nodes.length}`).toBe("string"); });
  }
});
