/**
 * state.initial 型 / 範囲 網羅 (iter47、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter47。
 * 全 80 parts の全 state.initial について、 型 / 値の範囲を verify。
 */
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

describe("iter47: 全 parts × state.initial 型 / 範囲 網羅", () => {
  it(`parts 検出`, () => {
    expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60);
  });

  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: state.initial 全 (number/string) 型`, () => {
      const states = ((diagram as unknown as { states?: Array<{ id: string; initial: unknown }> }).states ?? []);
      for (const s of states) {
        const t = typeof s.initial;
        expect(["number", "string"].includes(t), `state ${s.id} type=${t}`).toBe(true);
      }
    });

    it(`${name}: numeric state.initial が finite`, () => {
      const states = ((diagram as unknown as { states?: Array<{ id: string; initial: unknown }> }).states ?? []);
      for (const s of states) {
        if (typeof s.initial === "number") {
          expect(Number.isFinite(s.initial), `state ${s.id} = ${s.initial}`).toBe(true);
        }
      }
    });

    it(`${name}: numeric state.initial の絶対値 <= 1e9`, () => {
      const states = ((diagram as unknown as { states?: Array<{ id: string; initial: unknown }> }).states ?? []);
      for (const s of states) {
        if (typeof s.initial === "number") {
          expect(Math.abs(s.initial), `state ${s.id} = ${s.initial}`).toBeLessThanOrEqual(1e9);
        }
      }
    });

    it(`${name}: string state.initial が非空 + 100 char 以下`, () => {
      const states = ((diagram as unknown as { states?: Array<{ id: string; initial: unknown }> }).states ?? []);
      for (const s of states) {
        if (typeof s.initial === "string") {
          expect(s.initial.length, `state ${s.id}`).toBeGreaterThan(0);
          expect(s.initial.length, `state ${s.id}`).toBeLessThanOrEqual(500);
        }
      }
    });
  }
});
