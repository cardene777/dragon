/**
 * 全 parts × 5 sample types cross matrix (iter8、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter8。
 * parts unified syntax (`actors: - alias: {kind: parts-id}`) の cross-syntax portability を
 * 5 sample types (flow / mind / c4 / state / swimlane) で verify、 各 sample type において
 * parts が正しく merge されて compile throw なしになることを assert する。
 *
 * 5 sample types × 全 parts の組み合わせで「parts が任意 diagram type に inject 可能」 の invariant を保証。
 * iter7 (sequence 単独) の cross-syntax portability への拡張。
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

const SAMPLE_TEMPLATES: Array<{ typeName: string; buildDsl: (kindValue: string) => string }> = [
  {
    typeName: "flow",
    buildDsl: (kind) => `title: "test-flow"
type: flow

actors:
  - Start
  - Process
  - End
  - test1: { kind: ${kind} }

flow:
  - Start -> Process: "step1"
  - Process -> End: "step2"
`,
  },
  {
    typeName: "mind",
    buildDsl: (kind) => `title: "test-mind"
type: mind

actors:
  - Root
  - Child1
  - Child2
  - test1: { kind: ${kind} }

flow:
  - Root -> Child1: "a"
  - Root -> Child2: "b"
`,
  },
  {
    typeName: "c4",
    buildDsl: (kind) => `title: "test-c4"
type: c4

actors:
  - User
  - System
  - Database
  - test1: { kind: ${kind} }

flow:
  - User -> System: "request"
  - System -> Database: "query"
`,
  },
  {
    typeName: "state",
    buildDsl: (kind) => `title: "test-state"
type: state

actors:
  - Idle
  - Running
  - Done
  - test1: { kind: ${kind} }

flow:
  - Idle -> Running: "start"
  - Running -> Done: "finish"
`,
  },
  {
    typeName: "swimlane",
    buildDsl: (kind) => `title: "test-swimlane"
type: swimlane

actors:
  - User
  - System
  - Backend
  - test1: { kind: ${kind} }

flow:
  - User -> System: "action"
  - System -> Backend: "process"
`,
  },
];

describe("iter8: 全 parts × 5 sample types cross matrix (cross-syntax portability)", () => {
  it(`parts を 60 個以上 export している`, () => {
    expect(ALL_PARTS.length, `parts.cdl.ts で少なくとも 60 個以上の parts export (現状: ${ALL_PARTS.length})`).toBeGreaterThanOrEqual(60);
  });

  it(`sample template 5 種類 定義`, () => {
    expect(SAMPLE_TEMPLATES.length).toBe(5);
  });

  for (const template of SAMPLE_TEMPLATES) {
    describe(`sample type = ${template.typeName}`, () => {
      for (const { name, diagram } of ALL_PARTS) {
        it(`parts ${name} (${diagram.id}) を ${template.typeName} に inject → compile throw なし`, () => {
          const kindValue = diagram.id.startsWith("parts-") ? diagram.id.slice(6) : diagram.id;
          const dsl = template.buildDsl(kindValue);
          const partsCatalog: Record<string, CdlDiagram> = { [diagram.id]: diagram };
          const compiled = textDslToDiagram(dsl, { partsCatalog });
          expect(compiled.nodes.length, `${name} × ${template.typeName}: compile 結果 nodes > 0`).toBeGreaterThan(0);
          const partsSubNodes = compiled.nodes.filter((n) => n.id.startsWith("test1__"));
          expect(partsSubNodes.length, `${name} × ${template.typeName}: parts sub-node が prefix 付きで少なくとも 1 個`).toBeGreaterThan(0);
        });
      }
    });
  }
});
