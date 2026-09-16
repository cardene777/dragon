/**
 * 全 parts × sequence sample の compile 網羅 unit test (iter7、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応。
 * parts.cdl.ts の全 export (80 件) を sequence DSL に 「actor unified syntax」 で追加し、
 * textDslToDiagram + compile で throw なし + 有意 node 出力を assert する batch 検証。
 * e2e で 1 個ずつ click するのは時間コスト高、 unit で全網羅する経路。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import * as PartsMod from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

// parts.cdl.ts の 全 export を収集 (typeof export === CdlDiagram = 各 parts)
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

describe("iter7: 全 parts × sequence sample の compile 網羅 (throw なし + 有意 node 出力)", () => {
  it(`parts 80 個 export 検出`, () => {
    expect(ALL_PARTS.length, `parts.cdl.ts で少なくとも 60 個以上の parts export (現状: ${ALL_PARTS.length})`).toBeGreaterThanOrEqual(60);
  });

  for (const { name, diagram } of ALL_PARTS) {
    it(`parts ${name} (${diagram.id}) を sequence sample に追加 → compile throw なし`, () => {
      const kindValue = diagram.id.startsWith("parts-") ? diagram.id.slice(6) : diagram.id;
      // sequence DSL に parts unified syntax で追加
      const dsl = `title: "test"
type: sequence

actors:
  - Client
  - API
  - DB
  - test1: { kind: ${kindValue} }

flow:
  - Client -> API: "call"
  - API -> DB: "query"
`;
      // partsCatalog に 該当 parts を map で渡す (compile が partId lookup する)
      const partsCatalog: Record<string, CdlDiagram> = { [diagram.id]: diagram };
      const compiled = textDslToDiagram(dsl, { partsCatalog });
      expect(compiled.nodes.length, `${name}: compile 結果 nodes > 0`).toBeGreaterThan(0);
      // parts の sub-node が prefix 付きで存在 (test1__xxx)
      const partsSubNodes = compiled.nodes.filter((n) => n.id.startsWith("test1__"));
      expect(partsSubNodes.length, `${name}: parts sub-node が prefix 付きで少なくとも 1 個 (subs=${compiled.nodes.map((n) => n.id).join(",")})`).toBeGreaterThan(0);
    });
  }
});
