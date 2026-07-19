import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter105: sample add invariants", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`nodes not null`, () => { const d = textDslToDiagram(sample.code); expect(d.nodes).not.toBeNull(); });
      it(`edges not null`, () => { const d = textDslToDiagram(sample.code); expect(d.edges).not.toBeNull(); });
      it(`states not null`, () => { const d = textDslToDiagram(sample.code); expect(d.states).not.toBeNull(); });
      it(`phases not null`, () => { const d = textDslToDiagram(sample.code); expect(d.phases).not.toBeNull(); });
      it(`diagram not null`, () => { const d = textDslToDiagram(sample.code); expect(d).not.toBeNull(); });
      it(`nodes not undefined`, () => { const d = textDslToDiagram(sample.code); expect(d.nodes).not.toBeUndefined(); });
      it(`edges not undefined`, () => { const d = textDslToDiagram(sample.code); expect(d.edges).not.toBeUndefined(); });
    });
  }
});
