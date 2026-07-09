/**
 * LLM 向け JSON DSL parser の behavior test。
 *
 * AC (Issue #208) 検証:
 * - jsonToDiagram({...}) が有効 CdlDiagram を返す
 * - validation error が具体的な path を返す
 * - YAML と JSON で同じ diagram が生成される
 * - diagramJsonSchema が exported されて内容妥当
 */
import { describe, it, expect } from "vitest";
import {
  jsonToDiagram,
  validateDragonJson,
  diagramJsonSchema,
  textDslToDiagram,
} from "../src/index";

describe("jsonToDiagram (LLM 向け JSON DSL)", () => {
  it("Issue #208 AC 1 = 最小 example が有効 CdlDiagram を返す", () => {
    const diagram = jsonToDiagram({
      title: "test",
      type: "sequence",
      actors: ["a", "b"],
      flow: [{ from: "a", to: "b", label: "x" }],
    });
    expect(diagram).toBeDefined();
    expect(diagram.id).toBeTruthy();
    expect(diagram.nodes.length).toBeGreaterThan(0);
    expect(diagram.edges.length).toBeGreaterThan(0);
    const edge = diagram.edges[0]!;
    expect(edge.label).toBe("x");
  });

  it("actor は文字列 or object の両方を受け入れる (name / subtitle 反映)", () => {
    const diagram = jsonToDiagram({
      title: "mixed",
      type: "sequence",
      actors: ["User", { name: "DB", subtitle: "Postgres" }],
      flow: [{ from: "User", to: "DB", label: "query" }],
    });
    const dbNode = diagram.nodes.find((n) => n.title === "DB");
    expect(dbNode).toBeDefined();
    // sequence preset は actor kind を固定 (card / spacer) するので、 kind の override は topology で確認。
    // 本 test は「object 形式の actor が name / subtitle を反映すること」 のみ検証。
    expect(dbNode?.subtitle).toBe("Postgres");
  });

  it("animation phase が cdl phases に変換される", () => {
    const diagram = jsonToDiagram({
      title: "animated",
      type: "sequence",
      actors: ["A", "B", "C"],
      flow: [
        { from: "A", to: "B", label: "1" },
        { from: "B", to: "C", label: "2" },
      ],
      animation: [
        { step: "call", duration: 1.4, focus: ["A", "B"] },
        { step: "query", duration: 1.4, focus: ["B", "C"] },
      ],
    });
    expect(diagram.phases.length).toBeGreaterThanOrEqual(2);
    const callPhase = diagram.phases.find((p) => p.title === "call");
    expect(callPhase).toBeDefined();
    expect(callPhase?.duration).toBe(1400);
  });

  it("tone / style option が step に反映される", () => {
    const diagram = jsonToDiagram({
      title: "toned",
      type: "sequence",
      actors: ["A", "B"],
      flow: [{ from: "A", to: "B", label: "ok", tone: "success", style: "dashed" }],
    });
    const edge = diagram.edges[0]!;
    expect(edge.tone).toBe("success");
    expect(edge.style).toBe("dashed");
  });

  it("YAML と JSON で同じ diagram が生成される (1:1 対応)", () => {
    const jsonDiagram = jsonToDiagram({
      title: "compare",
      type: "sequence",
      actors: ["User", "API"],
      flow: [{ from: "User", to: "API", label: "login" }],
    });
    const yamlDiagram = textDslToDiagram(`
title: "compare"
type: sequence
actors:
  - User
  - API
flow:
  - User -> API: "login"
animation:
  - step: "call" 1.4s
    focus: [User, API]
`);
    expect(jsonDiagram.id).toBeTruthy();
    expect(yamlDiagram.id).toBeTruthy();
    expect(jsonDiagram.nodes.length).toBe(yamlDiagram.nodes.length);
    expect(jsonDiagram.edges.length).toBe(yamlDiagram.edges.length);
    const jsonEdge = jsonDiagram.edges[0]!;
    const yamlEdge = yamlDiagram.edges[0]!;
    expect(jsonEdge.label).toBe(yamlEdge.label);
  });

  it("validation error が具体的な path を返す (root object 必須)", () => {
    expect(() => jsonToDiagram(null)).toThrow(/root must be a JSON object/);
    expect(() => jsonToDiagram([])).toThrow(/root must be a JSON object/);
    expect(() => jsonToDiagram("not an object")).toThrow(/root must be a JSON object/);
  });

  it("validation error = title 欠落を path で示す", () => {
    const result = validateDragonJson({
      type: "sequence",
      actors: ["a"],
      flow: [{ from: "a", to: "a", label: "x" }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const titleErr = result.errors.find((e) => e.path === "$.title");
      expect(titleErr).toBeDefined();
    }
  });

  it("validation error = type invalid を enum hint 付きで示す", () => {
    const result = validateDragonJson({
      title: "bad",
      type: "invalid-preset",
      actors: ["a"],
      flow: [{ from: "a", to: "a", label: "x" }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const typeErr = result.errors.find((e) => e.path === "$.type");
      expect(typeErr).toBeDefined();
      expect(typeErr?.message).toMatch(/type must be one of/);
    }
  });

  it("validation error = flow step 内の from 型不正を配列 index で示す", () => {
    const result = validateDragonJson({
      title: "bad step",
      type: "sequence",
      actors: ["a", "b"],
      flow: [
        { from: "a", to: "b", label: "ok" },
        { from: 123, to: "b", label: "bad" },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const err = result.errors.find((e) => e.path === "$.flow[1].from");
      expect(err).toBeDefined();
    }
  });

  it("multiple validation errors を全部返す (LLM 一括修正用)", () => {
    const result = validateDragonJson({
      title: "",
      type: "unknown",
      actors: [],
      flow: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("diagramJsonSchema (LLM tool schema)", () => {
  it("Issue #208 AC 2 = JSON Schema が export される", () => {
    expect(diagramJsonSchema).toBeDefined();
    expect(diagramJsonSchema.type).toBe("object");
    expect(diagramJsonSchema.required).toContain("title");
    expect(diagramJsonSchema.required).toContain("type");
    expect(diagramJsonSchema.required).toContain("actors");
    expect(diagramJsonSchema.required).toContain("flow");
  });

  it("schema の type field は 12 preset enum を持つ", () => {
    const typeSchema = (diagramJsonSchema.properties as Record<string, { enum?: string[] }>).type;
    expect(typeSchema?.enum).toContain("sequence");
    expect(typeSchema?.enum).toContain("flow");
    expect(typeSchema?.enum).toContain("solidity");
    expect(typeSchema?.enum?.length).toBeGreaterThanOrEqual(12);
  });

  it("schema は $schema field を持つ (Draft 7 declaration)", () => {
    expect(diagramJsonSchema.$schema).toMatch(/json-schema.org/);
  });
});
