import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter514: sample additional (Destructuring)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`array destructure`, () => { const [a, b] = [1, 2]; expect(a).toBe(1); expect(b).toBe(2); });
      it(`array skip`, () => { const [, , c] = [1, 2, 3]; expect(c).toBe(3); });
      it(`array rest`, () => { const [head, ...rest] = [1, 2, 3]; expect(head).toBe(1); expect(rest).toEqual([2, 3]); });
      it(`array default`, () => { const [x = 10] = []; expect(x).toBe(10); });
      it(`object destructure`, () => { const { a, b } = { a: 1, b: 2 }; expect(a).toBe(1); expect(b).toBe(2); });
      it(`object rename`, () => { const { a: x } = { a: 5 }; expect(x).toBe(5); });
      it(`sample destructure`, () => { const { label, slug } = sample; expect(label).toBe(sample.label); expect(slug).toBe(sample.slug); });
    });
  }
});
