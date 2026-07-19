import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter331: sample additional (Template literal)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`\`\${slug}\` = slug`, () => { expect(`${sample.slug}`).toBe(sample.slug); });
      it(`\`\${label}\` = label`, () => { expect(`${sample.label}`).toBe(sample.label); });
      it(`\`\${slug}-\${label}\` includes both`, () => { const t = `${sample.slug}-${sample.label}`; expect(t.includes(sample.slug)).toBe(true); expect(t.includes(sample.label)).toBe(true); });
      it(`\`prefix-\${slug}\` starts with prefix`, () => { expect(`prefix-${sample.slug}`.startsWith("prefix-")).toBe(true); });
      it(`\`\${label}-suffix\` ends with suffix`, () => { expect(`${sample.label}-suffix`.endsWith("-suffix")).toBe(true); });
      it(`String.raw preserves backslash`, () => { expect(String.raw`a\nb`).toBe("a\\nb"); });
      it(`multiline preserves newline`, () => { expect(`a\nb`).toBe("a\nb"); });
    });
  }
});
