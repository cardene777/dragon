import { describe, expect, it } from "vitest";

import { jsonToDiagram, parseTextDslV05, textDslToDiagram, validateDragonJson } from "../src";

const nodeCases = [
  ["terminalDecoration", { windowControls: true, cursor: true }, "mind", undefined],
  ["cornerForm", "theme-variants", "tree", undefined],
  ["figureKindLabel", { text: "tree · 階層図" }, "tree", undefined],
  ["figureInset", {}, "chart", "bar"],
  ["chartBarSize", { tickFontSize: 19, barWidth: 82.944 }, "chart", "bar"],
  ["chartLineSize", { pointRadius: 7.5, plotPadding: { top: 106.891, bottom: 82 } }, "chart", "line"],
  ["chartPieSize", { tableWidth: 310, outerRadius: 171.055 }, "chart", "pie"],
  ["chartSlopeLabelTemplate", { left: "{name} {value}{unit}", right: "{value}{unit} {name}" }, "chart", "slope"],
  ["chartSlopeSize", { pointRadius: 7, axisGap: 250 }, "chart", "slope"],
  ["chartStackedLayout", { legendColumns: 3, segmentGap: 3 }, "chart", "stacked"],
  ["chartGaugeSize", { arcThickness: 34, outerRadius: 222 }, "chart", "gauge"],
  ["ganttSize", { tickCount: 6, barThickness: 30 }, "gantt", undefined],
  ["quadrantLabelPosition", "outside-corners", "quadrant", undefined],
  ["quadrantSize", { plotSize: 325.109, pointRadius: 11 }, "quadrant", undefined],
] as const;

const yamlValue = (value: unknown): string =>
  typeof value === "string" ? value : JSON.stringify(value);

const invalidNodeValues: Record<(typeof nodeCases)[number][0], unknown> = {
  terminalDecoration: { windowControls: "yes" },
  cornerForm: "outside",
  figureKindLabel: { text: 1 },
  figureInset: { top: -1 },
  chartBarSize: { barWidth: 0 },
  chartLineSize: { pointRadius: 0 },
  chartPieSize: { tableWidth: 0 },
  chartSlopeLabelTemplate: { left: 1 },
  chartSlopeSize: { pointRadius: 0 },
  chartStackedLayout: { legendColumns: 0 },
  chartGaugeSize: { arcThickness: 0 },
  ganttSize: { tickCount: 1 },
  quadrantLabelPosition: "outside",
  quadrantSize: { plotSize: 0 },
};

describe("cdl 0.132.0 の公開欄 (#2854)", () => {
  it.each(nodeCases)("%s を YAML / JSON から CDL の節へそのまま渡す", (field, value, type, shape) => {
    const shapeLine = shape === undefined ? "" : `shape: ${shape}\n`;
    const yaml = textDslToDiagram(`title: 見本
type: ${type}
${shapeLine}${field}: ${yamlValue(value)}
actors:
  - A: { value: "80", previous: "70" }
  - B: { value: "20", previous: "30" }
flow:
  - A -> B
`);
    const jsonInput = {
      title: "見本",
      type,
      ...(shape === undefined ? {} : { shape }),
      [field]: value,
      actors: [
        { name: "A", value: "80", previous: "70" },
        { name: "B", value: "20", previous: "30" },
      ],
      flow: [{ from: "A", to: "B", label: "" }],
    } as Parameters<typeof jsonToDiagram>[0];
    const json = jsonToDiagram(jsonInput);

    for (const diagram of [yaml, json]) {
      expect(diagram.nodes[0]?.[field]).toEqual(value);
    }
  });

  it("labelCollision / labelSize を YAML / JSON から CDL の線へそのまま渡す", () => {
    const expected = { labelCollision: "author", labelSize: { width: 96, height: 40, fontSize: 21 } } as const;
    const yaml = textDslToDiagram(`title: 線
type: flow
actors:
  - A
  - B
flow:
  - A -> B: "いいえ" { labelCollision: author, labelSize: {"width":96,"height":40,"fontSize":21} }
`);
    const json = jsonToDiagram({
      title: "線",
      type: "flow",
      actors: ["A", "B"],
      flow: [{ from: "A", to: "B", label: "いいえ", ...expected }],
    });
    for (const diagram of [yaml, json]) expect(diagram.edges[0]).toMatchObject(expected);
  });

  it("stageLayout を YAML / JSON から CDL の図全体へそのまま渡す", () => {
    const expected = { columnWidths: { 受付: 360 }, columnGap: 64, backDetourTopGap: 34, backDetourSideGap: 58 };
    const yaml = textDslToDiagram(`title: 段
type: swimlane
shape: stages
stageLayout: {"columnWidths":{"受付":360},"columnGap":64,"backDetourTopGap":34,"backDetourSideGap":58}
actors:
  - A: { stage: 受付 }
flow: []
`);
    const json = jsonToDiagram({ title: "段", type: "swimlane", shape: "stages", stageLayout: expected, actors: [{ name: "A", stage: "受付" }], flow: [] });
    for (const diagram of [yaml, json]) expect(diagram.stageLayout).toEqual(expected);
  });

  it.each(nodeCases)("%s の型の外の値を YAML / JSON で拒む", (field, _value, type, shape) => {
    const invalid = invalidNodeValues[field];
    const shapeLine = shape === undefined ? "" : `shape: ${shape}\n`;
    const yaml = parseTextDslV05(`title: 誤り
type: ${type}
${shapeLine}${field}: ${yamlValue(invalid)}
actors:
  - A
flow: []
`);
    expect(yaml.ok).toBe(false);

    const json = validateDragonJson({ title: "誤り", type, ...(shape === undefined ? {} : { shape }), [field]: invalid, actors: ["A"], flow: [] });
    expect(json.ok).toBe(false);
  });

  it.each(nodeCases.filter((entry) => typeof entry[1] !== "string"))(
    "%s の未知の子欄を YAML / JSON で拒む",
    (field, value, type, shape) => {
      const invalid = { ...(value as Record<string, unknown>), unknown2854: true };
      const shapeLine = shape === undefined ? "" : `shape: ${shape}\n`;
      const yaml = parseTextDslV05(`title: 誤り
type: ${type}
${shapeLine}${field}: ${yamlValue(invalid)}
actors:
  - A
flow: []
`);
      expect(yaml.ok).toBe(false);

      const json = validateDragonJson({
        title: "誤り",
        type,
        ...(shape === undefined ? {} : { shape }),
        [field]: invalid,
        actors: ["A"],
        flow: [],
      });
      expect(json.ok).toBe(false);
    },
  );

  it.each([
    ["labelCollision", "labelCollision: outside", { labelCollision: "outside" }],
    ["labelSize の型", 'labelSize: {"width":0}', { labelSize: { width: 0 } }],
    ["labelSize の未知の子欄", 'labelSize: {"width":96,"unknown2854":1}', { labelSize: { width: 96, unknown2854: 1 } }],
  ])("%s を YAML / JSON の線で拒む", (_name, yamlOption, jsonOption) => {
    const yaml = parseTextDslV05(`title: 誤り
type: flow
actors:
  - A
  - B
flow:
  - A -> B: "x" { ${yamlOption} }
`);
    expect(yaml.ok).toBe(false);
    const json = validateDragonJson({
      title: "誤り",
      type: "flow",
      actors: ["A", "B"],
      flow: [{ from: "A", to: "B", label: "x", ...jsonOption }],
    });
    expect(json.ok).toBe(false);
  });

  it.each([
    ["型の外の値", { columnGap: -1 }],
    ["未知の子欄", { columnGap: 64, unknown2854: 1 }],
  ])("stageLayout の%sを YAML / JSON で拒む", (_name, invalid) => {
    const yaml = parseTextDslV05(`title: 誤り
type: swimlane
stageLayout: ${JSON.stringify(invalid)}
actors:
  - A
flow: []
`);
    expect(yaml.ok).toBe(false);
    const json = validateDragonJson({ title: "誤り", type: "swimlane", stageLayout: invalid, actors: ["A"], flow: [] });
    expect(json.ok).toBe(false);
  });
});
