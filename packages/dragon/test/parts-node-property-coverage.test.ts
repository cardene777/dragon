/**
 * parts node property coverage 網羅 (iter56、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter56。
 * 全 parts の node property 型と存在率を verify。
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

describe("iter56: 全 parts × node property coverage", () => {
  it(`parts 検出`, () => {
    expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60);
  });

  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: 全 node に id が存在`, () => {
      for (const n of diagram.nodes) {
        expect(typeof n.id).toBe("string");
        expect(n.id.length).toBeGreaterThan(0);
      }
    });

    it(`${name}: kind 属性値が非空 string (存在時)`, () => {
      for (const n of diagram.nodes) {
        const kind = (n as unknown as { kind?: unknown }).kind;
        if (kind !== undefined) {
          expect(typeof kind).toBe("string");
          expect((kind as string).length).toBeGreaterThan(0);
        }
      }
    });

    it(`${name}: node id が identifier form + kebab 系許容`, () => {
      // node id は英数字 + _ / - / . 許容
      for (const n of diagram.nodes) {
        expect(/^[a-zA-Z_][a-zA-Z0-9_\-.]*$/.test(n.id), `node id "${n.id}"`).toBe(true);
      }
    });
  }
});
