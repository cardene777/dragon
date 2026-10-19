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
  it("公開済みの円の区画の間は、どの意匠と節でも値を返さない", () => {
    for (const theme of ["blueprint", "letterpress", "catalog", "terminal", "sketch", "neon", "relief"] as const) {
      expect(意匠の円の区画の間(theme, { kind: "chart-pie" })).toBeUndefined();
      expect(意匠の円の区画の間(theme, { kind: "chart-bar" })).toBeUndefined();
    }
  });

  it("組み立ては色味から chartPieSliceGap を足さない", () => {
    const pie = (theme?: string) => textDslToDiagram(`title: 見本
type: chart
shape: pie
${theme === undefined ? "" : `theme: ${theme}\n`}actors:
  - A: "80"
  - B: "20"
flow:
  - A -> B
`).nodes[0];

    for (const theme of ["neon", "relief", undefined]) {
      expect(Object.hasOwn(pie(theme) ?? {}, "chartPieSliceGap"), String(theme)).toBe(false);
    }
  });

  it("電飾の円は扇を削らず、描画側の区切り線を保つ", () => {
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
    expect(slices.every((slice) => /\sstroke="var\(--cdl-node-fill, #ffffff\)"/u.test(slice))).toBe(true);
    expect(slices.every((slice) => /\sstroke-width="3"/u.test(slice))).toBe(true);
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
