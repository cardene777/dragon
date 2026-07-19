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

class Animal {
  constructor(public name: string) { /* noop */ }
  speak() { return `${this.name} speaks`; }
  static create(name: string) { return new Animal(name); }
}

class Dog extends Animal {
  constructor(name: string, public breed: string) { super(name); }
  bark() { return `${this.name} barks`; }
  speak() { return `${super.speak()} (bark)`; }
}

describe("milestone 161k: Class inheritance / static / super", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: extends works`, () => { const d = new Dog("Rex", "lab"); expect(d.name).toBe("Rex"); expect(d.breed).toBe("lab"); });
    it(`${name}: instanceof child + parent`, () => { const d = new Dog("Rex", "lab"); expect(d instanceof Dog).toBe(true); expect(d instanceof Animal).toBe(true); });
    it(`${name}: super call works`, () => { expect(new Dog("Rex", "lab").speak()).toBe("Rex speaks (bark)"); });
    it(`${name}: child method`, () => { expect(new Dog("Rex", "lab").bark()).toBe("Rex barks"); });
    it(`${name}: static method`, () => { expect(Animal.create("Cat").name).toBe("Cat"); });
    it(`${name}: static inherited`, () => { expect((Dog as unknown as { create: typeof Animal.create }).create("Cat") instanceof Animal).toBe(true); });
    it(`${name}: Object.getPrototypeOf(child) = parent`, () => { expect(Object.getPrototypeOf(Dog)).toBe(Animal); });
  }
});
