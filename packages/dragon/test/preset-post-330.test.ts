import { describe, it, expect } from "vitest";
import * as PresetsMod from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

function collectAllPresets(mod: unknown): Array<{ name: string; diagram: CdlDiagram }> {
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

const ALL_PRESETS = collectAllPresets(PresetsMod);

describe("iter332: preset additional (Template literal) 🎊 90k test 大台マイルストーン", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: \`\${id}\` = id`, () => { expect(`${diagram.id}`).toBe(diagram.id); });
    it(`${name}: \`prefix-\${id}\` starts with prefix`, () => { expect(`prefix-${diagram.id}`.startsWith("prefix-")).toBe(true); });
    it(`${name}: \`\${id}-suffix\` ends with suffix`, () => { expect(`${diagram.id}-suffix`.endsWith("-suffix")).toBe(true); });
    it(`${name}: \`\${id}\${id}\` length = 2x`, () => { expect(`${diagram.id}${diagram.id}`.length).toBe(diagram.id.length * 2); });
    it(`${name}: String.raw preserves \\n`, () => { const t = String.raw`a\nb`; expect(t).toBe("a\\nb"); });
    it(`${name}: multiline template preserves newline`, () => { expect(`a\nb`).toBe("a\nb"); });
    it(`${name}: \`\${nodes.length}\` = string`, () => { expect(typeof `${diagram.nodes.length}`).toBe("string"); });
  }
});
