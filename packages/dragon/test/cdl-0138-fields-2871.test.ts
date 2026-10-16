import { CdlDiagramView } from "@cardenelabs/cdl";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  compileToCdl,
  diagramJsonSchema,
  意匠の円の区画の間,
  jsonToDiagram,
  parseTextDslV05,
  textDslToDiagram,
  validateDragonJson,
} from "../src";

const actors = ["A", "B"];
const flow = [{ from: "A", to: "B", label: "" }];

const yaml = (stageLayout: string): string => `title: 見本
type: swimlane
shape: stages
stageLayout: ${stageLayout}
actors:
  - A: { stage: 受付 }
  - B: { stage: 配送 }
flow:
  - A -> B
`;

describe("cdl 0.138.0 の公開欄 (#2871)", () => {
  it("電飾の chart-pie だけ円の区画の間 3 を返す", () => {
    expect(意匠の円の区画の間("neon", { kind: "chart-pie" })).toBe(3);
    expect(意匠の円の区画の間("neon", { kind: "chart-bar" })).toBeUndefined();
    for (const theme of ["kinari", "celadon", "blueprint", "letterpress", "catalog", "terminal", "sketch", "relief"] as const) {
      expect(意匠の円の区画の間(theme, { kind: "chart-pie" })).toBeUndefined();
    }
  });

  it("組み立ては電飾の円だけへ chartPieSliceGap 3 を当てる", () => {
    const pie = (theme?: string) => textDslToDiagram(`title: 見本
type: chart
shape: pie
${theme === undefined ? "" : `theme: ${theme}\n`}actors:
  - A: "80"
  - B: "20"
flow:
  - A -> B
`).nodes[0];

    expect(pie("neon")?.chartPieSliceGap).toBe(3);
    expect(Object.hasOwn(pie("relief") ?? {}, "chartPieSliceGap")).toBe(false);
    expect(Object.hasOwn(pie() ?? {}, "chartPieSliceGap")).toBe(false);
  });

  it("電飾の円は CSS の上書きなしでも各区画へ stroke 属性を出さない", () => {
    const diagram = textDslToDiagram(`title: 見本
type: chart
shape: pie
theme: neon
actors:
  - A: "80"
  - B: "20"
flow:
  - A -> B
`);
    const markup = renderToStaticMarkup(createElement(CdlDiagramView, { diagram }));
    const slices = [...markup.matchAll(/<path(?=[^>]*data-cdl-role="chart-pie-slice")[^>]*>/gu)].map((match) => match[0]);
    expect(slices).toHaveLength(2);
    expect(slices.every((slice) => !/\sstroke=/u.test(slice))).toBe(true);
  });

  it("text 記法と JSON の backDetourTargetInset を CDL へそのまま渡す", () => {
    const text = parseTextDslV05(yaml('{"backDetourTargetInset":60}'));
    expect(text.ok).toBe(true);
    if (!text.ok) throw new Error("text 記法を読めない");
    expect(compileToCdl(text.doc).stageLayout?.backDetourTargetInset).toBe(60);

    const json = { title: "見本", type: "swimlane", shape: "stages", stageLayout: { backDetourTargetInset: 60 }, actors, flow };
    expect(validateDragonJson(json).ok).toBe(true);
    expect(jsonToDiagram(json).stageLayout?.backDetourTargetInset).toBe(60);
  });

  it.each(["-1", '"60"', "Infinity"])("text 記法の backDetourTargetInset=%s を拒む", (value) => {
    expect(parseTextDslV05(yaml(`{"backDetourTargetInset":${value}}`)).ok).toBe(false);
  });

  it("JSON の負・数でない値・無限を拒む", () => {
    for (const value of [-1, "60", Number.POSITIVE_INFINITY]) {
      expect(validateDragonJson({
        title: "誤り",
        type: "swimlane",
        shape: "stages",
        stageLayout: { backDetourTargetInset: value },
        actors,
        flow,
      }).ok).toBe(false);
    }
  });

  it("JSON Schema は backDetourTargetInset を 0 以上の数として閉じた欄に含める", () => {
    type Schema = {
      type?: string;
      minimum?: number;
      additionalProperties?: boolean;
      properties?: Record<string, Schema>;
    };
    const root = diagramJsonSchema as unknown as Schema;
    const stageLayout = root.properties?.stageLayout;
    expect(stageLayout?.additionalProperties).toBe(false);
    expect(stageLayout?.properties?.backDetourTargetInset).toEqual({ type: "number", minimum: 0 });
  });
});
