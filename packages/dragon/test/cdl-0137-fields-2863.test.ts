import { describe, expect, it } from "vitest";

import {
  compileToCdl,
  diagramJsonSchema,
  棒を描く節か,
  意匠の棒の角,
  jsonToDiagram,
  parseTextDslV05,
  textDslToDiagram,
  validateDragonJson,
} from "../src";

const actors = ["A", "B"];
const flow = [{ from: "A", to: "B", label: "" }];

const yaml = (fields: string, type = "flow"): string => `title: 見本
type: ${type}
${fields}
actors:
  - A
  - B
flow:
  - A -> B
`;

describe("cdl 0.137.0 の edgeEndGap と mindSize.contentOffset (#2863)", () => {
  it("YAML / JSON の edgeEndGap を CDL の図全体へ渡す", () => {
    const fromYaml = textDslToDiagram(yaml("edgeEndGap: 2"));
    const fromJson = jsonToDiagram({ title: "見本", type: "flow", edgeEndGap: 2, actors, flow });
    expect(fromYaml.edgeEndGap).toBe(2);
    expect(fromJson.edgeEndGap).toBe(2);
  });

  it("YAML / JSON の contentOffset を放射の節へそのまま渡す", () => {
    const offset = { x: 20, y: -24 };
    const fromYaml = textDslToDiagram(yaml(`mindSize: ${JSON.stringify({ contentOffset: offset })}`, "mind"));
    const fromJson = jsonToDiagram({
      title: "見本",
      type: "mind",
      mindSize: { contentOffset: offset },
      actors,
      flow,
    });
    expect(fromYaml.nodes[0]?.mindSize?.contentOffset).toEqual(offset);
    expect(fromJson.nodes[0]?.mindSize?.contentOffset).toEqual(offset);
  });

  it.each(["-1", "not-a-number", "Infinity", ""])("YAML の edgeEndGap=%s を知らせる", (value) => {
    expect(parseTextDslV05(yaml(`edgeEndGap: ${value}`)).ok).toBe(false);
  });

  it("JSON の負・数でない値・無限を知らせる", () => {
    for (const value of [-1, "2", Number.POSITIVE_INFINITY]) {
      expect(validateDragonJson({ title: "誤り", type: "flow", edgeEndGap: value, actors, flow }).ok).toBe(false);
    }
  });

  it("contentOffset の数でない値・不足・知らない key を YAML / JSON で知らせる", () => {
    for (const contentOffset of [
      { x: "20", y: 24 },
      { x: 20 },
      { x: 20, y: 24, z: 1 },
    ]) {
      expect(parseTextDslV05(yaml(`mindSize: ${JSON.stringify({ contentOffset })}`, "mind")).ok).toBe(false);
      expect(validateDragonJson({
        title: "誤り",
        type: "mind",
        mindSize: { contentOffset },
        actors,
        flow,
      }).ok).toBe(false);
    }
  });

  it("JSON Schema も同じ境界と閉じた contentOffset を宣言する", () => {
    type Schema = {
      minimum?: number;
      additionalProperties?: boolean;
      required?: string[];
      properties?: Record<string, Schema>;
    };
    const root = diagramJsonSchema as unknown as Schema;
    const edge = root.properties?.edgeEndGap;
    const offset = root.properties?.mindSize?.properties?.contentOffset;
    expect(edge?.minimum).toBe(0);
    expect(offset).toMatchObject({ additionalProperties: false, required: ["x", "y"] });
    expect(Object.keys(offset?.properties ?? {}).sort()).toEqual(["x", "y"]);
  });
});

describe("意匠ごとの棒の角 (#2863)", () => {
  const corners = (a: number, b: number, c: number, d: number) => ({
    topLeft: a,
    topRight: b,
    bottomRight: c,
    bottomLeft: d,
  });
  const cases = [
    ["blueprint", corners(0, 0, 0, 0), corners(0, 0, 0, 0), corners(0, 0, 0, 0)],
    ["letterpress", corners(0, 0, 0, 0), corners(0, 0, 0, 0), corners(0, 0, 0, 0)],
    ["catalog", corners(4, 4, 0, 0), corners(4, 4, 0, 0), corners(4, 4, 0, 0)],
    ["terminal", corners(3, 3, 0, 0), corners(0, 3, 3, 0), corners(0, 3, 3, 0)],
    ["sketch", corners(12, 11, 9, 9), corners(12, 11, 9, 9), corners(12, 11, 9, 9)],
    ["neon", corners(10, 10, 3, 3), corners(3, 10, 10, 3), corners(12, 12, 12, 12)],
    ["relief", corners(12, 12, 5, 5), corners(5, 12, 12, 5), corners(10, 10, 10, 10)],
  ] as const;

  it.each(cases)("%s の縦棒・日程・横棒を返す", (theme, vertical, schedule, horizontal) => {
    expect(意匠の棒の角(theme, { kind: "chart-bar", funnelForm: undefined })).toEqual(vertical);
    expect(意匠の棒の角(theme, { kind: "gantt-timeline", funnelForm: undefined })).toEqual(schedule);
    expect(意匠の棒の角(theme, { kind: "funnel-stages", funnelForm: "proportional-bars" })).toEqual(horizontal);
    expect(意匠の棒の角(theme, { kind: "chart-stacked-bar", funnelForm: undefined })).toEqual(horizontal);
  });

  it("棒を描く節だけを判定し、既定の台形漏斗を外す", () => {
    expect(棒を描く節か({ kind: "chart-bar", funnelForm: undefined })).toBe(true);
    expect(棒を描く節か({ kind: "gantt-timeline", funnelForm: undefined })).toBe(true);
    expect(棒を描く節か({ kind: "chart-stacked-bar", funnelForm: undefined })).toBe(true);
    expect(棒を描く節か({ kind: "funnel-stages", funnelForm: "proportional-bars" })).toBe(true);
    expect(棒を描く節か({ kind: "funnel-stages", funnelForm: undefined })).toBe(false);
    expect(意匠の棒の角("neon", { kind: "funnel-stages", funnelForm: undefined })).toBeUndefined();
  });

  const diagram = (type: string, shape?: string, extra = "") => {
    const result = parseTextDslV05(`title: 見本
type: ${type}
${shape === undefined ? "" : `shape: ${shape}\n`}theme: neon
${extra}actors:
  - A: { value: "80", subtitle: "Q1" }
  - B: { value: "20", subtitle: "Q2" }
flow:
  - A -> B
`);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("記法が読めない");
    return compileToCdl(result.doc);
  };

  it("記法の意匠を縦棒・日程・比例棒の漏斗・内訳の帯へ当てる", () => {
    expect(diagram("chart", "bar").nodes[0]?.barCornerRadii).toEqual(corners(10, 10, 3, 3));
    expect(diagram("gantt").nodes[0]?.barCornerRadii).toEqual(corners(3, 10, 10, 3));
    expect(diagram("funnel", undefined, "funnelForm: proportional-bars\n").nodes[0]?.barCornerRadii)
      .toEqual(corners(12, 12, 12, 12));
    expect(diagram("chart", "stacked").nodes[0]?.barCornerRadii).toEqual(corners(12, 12, 12, 12));
  });

  it("棒を描かない漏斗と意匠を書かない棒には当てない", () => {
    expect(diagram("funnel").nodes[0]?.barCornerRadii).toBeUndefined();
    expect(textDslToDiagram(yaml("shape: bar", "chart")).nodes[0]?.barCornerRadii).toBeUndefined();
  });
});
