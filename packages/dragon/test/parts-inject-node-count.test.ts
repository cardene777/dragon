/**
 * parts inject 後の node count 網羅 (iter40、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter40。
 * 全 parts を sequence sample に inject した後の合成 diagram で node count が
 * (base actor 数) + (parts 内部 node 数) 相当の範囲内であることを verify。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
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

describe("iter40: 全 parts × inject 後 node count 網羅", () => {
  it(`parts 検出`, () => {
    expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60);
  });

  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: inject 後 alias__ prefix の node count が parts node count と一致`, () => {
      const kindValue = diagram.id.startsWith("parts-") ? diagram.id.slice(6) : diagram.id;
      const dsl = `title: "t"
type: sequence
actors:
  - A
  - injA: { kind: ${kindValue} }
flow:
  - A -> A: "x"
`;
      const partsCatalog: Record<string, CdlDiagram> = { [diagram.id]: diagram };
      const compiled = textDslToDiagram(dsl, { partsCatalog });
      const prefixedNodes = compiled.nodes.filter((n) => n.id.startsWith("injA__"));
      // parts の node count と 1:1 相当 (compile 側の inject rule)
      expect(prefixedNodes.length, `injA__ prefix nodes ${prefixedNodes.length} vs parts ${diagram.nodes.length}`).toBe(diagram.nodes.length);
    });

    it(`${name}: inject 後 alias__ prefix の各 node id が parts 内 id と対応`, () => {
      const kindValue = diagram.id.startsWith("parts-") ? diagram.id.slice(6) : diagram.id;
      const dsl = `title: "t"
type: sequence
actors:
  - A
  - injB: { kind: ${kindValue} }
flow:
  - A -> A: "x"
`;
      const partsCatalog: Record<string, CdlDiagram> = { [diagram.id]: diagram };
      const compiled = textDslToDiagram(dsl, { partsCatalog });
      const injectedIds = compiled.nodes
        .filter((n) => n.id.startsWith("injB__"))
        .map((n) => n.id.slice("injB__".length));
      const partsIds = diagram.nodes.map((n) => n.id);
      // 差し込んだ箱が 0 個だと、下の繰り返しが 1 度も回らずに通る
      expect(injectedIds.length, `${name} で箱が 1 つも差し込まれていない`).toBeGreaterThan(0);
      // 各 injected sub-node は parts.nodes.id に含まれる
      for (const id of injectedIds) {
        expect(partsIds.includes(id), `${id} in parts nodes ${partsIds.join(",")}`).toBe(true);
      }
    });
  }
});
