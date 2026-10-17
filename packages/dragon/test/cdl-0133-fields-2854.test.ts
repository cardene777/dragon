import { describe, expect, it } from "vitest";

import { jsonToDiagram, parseTextDslV05, textDslToDiagram, validateDragonJson } from "../src";

const actors = [{ name: "A", value: "80", previous: "70" }, { name: "B", value: "20", previous: "30" }];
const flow = [{ from: "A", to: "B", label: "" }];

const objectCases = [
  ["journeySize", { plotPadding: { left: 120, right: 44 }, pointPadding: { left: 100, right: 70 } }, "journey", undefined],
  ["chartBarSize", { cornerRadius: 4 }, "chart", "bar"],
  ["chartLineSize", { plotPadding: { left: 92, right: 60 }, tickGap: 12, pointPadding: { left: 46, right: 0 }, periodY: 355.988 }, "chart", "line"],
  ["chartPieSize", { centerX: 227 }, "chart", "pie"],
  ["chartWaffleSize", { gridLeft: 42.5, cellPitch: 30 }, "chart", "waffle"],
  ["chartSlopeSize", { plotPadding: { top: 54.036, bottom: 12.552 }, pointPadding: { top: 46.707, bottom: 42.862 } }, "chart", "slope"],
  ["chartStackedLayout", { legendOffsetY: -20.609375 }, "chart", "stacked"],
  ["ganttSize", { taskColumnWidth: 330, timelinePaddingRight: 64 }, "gantt", undefined],
] as const;

const yamlDiagram = (field: string, value: unknown, type: string, shape?: string): string => `title: 見本
type: ${type}
${shape === undefined ? "" : `shape: ${shape}\n`}${field}: ${JSON.stringify(value)}
actors:
  - A: { value: "80", previous: "70" }
  - B: { value: "20", previous: "30" }
flow:
  - A -> B
`;

describe("cdl 0.133.0 の公開欄 (#2854)", () => {
  it.each(objectCases)("%s を YAML / JSON から CDL の節へそのまま渡す", (field, value, type, shape) => {
    const yaml = textDslToDiagram(yamlDiagram(field, value, type, shape));
    const json = jsonToDiagram({ title: "見本", type, ...(shape === undefined ? {} : { shape }), [field]: value, actors, flow });
    for (const diagram of [yaml, json]) expect(diagram.nodes[0]?.[field]).toEqual(value);
  });

  it("chartBarShape を YAML / JSON から CDL の節へそのまま渡す", () => {
    const yaml = textDslToDiagram(yamlDiagram("chartBarShape", "top-rounded", "chart", "bar"));
    const json = jsonToDiagram({ title: "見本", type: "chart", shape: "bar", chartBarShape: "top-rounded", actors, flow });
    for (const diagram of [yaml, json]) expect(diagram.nodes[0]?.chartBarShape).toBe("top-rounded");
  });

  it("legendOffset を YAML / JSON から CDL の図全体へそのまま渡す", () => {
    const value = { x: -200, y: -40 };
    const yaml = textDslToDiagram(yamlDiagram("legendOffset", value, "flow"));
    const json = jsonToDiagram({ title: "見本", type: "flow", legendOffset: value, actors, flow });
    for (const diagram of [yaml, json]) expect(diagram.legendOffset).toEqual(value);
  });

  it("viewport.contentOffsetX を YAML / JSON から CDL の viewport へそのまま渡す", () => {
    const yaml = textDslToDiagram(`title: 見本\ntype: flow\nviewport: { width: 1800, contentOffsetX: 250 }\nactors:\n  - A\nflow: []\n`);
    const json = jsonToDiagram({ title: "見本", type: "flow", viewport: { width: 1800, contentOffsetX: 250 }, actors: ["A"], flow: [] });
    for (const diagram of [yaml, json]) expect(diagram.viewport?.contentOffsetX).toBe(250);
  });

  it("外した figureInset.holdsContent を YAML / JSON で未知の欄として拒む", () => {
    expect(parseTextDslV05(yamlDiagram("figureInset", { holdsContent: true }, "chart", "line")).ok).toBe(false);
    expect(validateDragonJson({ title: "誤り", type: "chart", shape: "line", figureInset: { holdsContent: true }, actors, flow }).ok).toBe(false);
  });

  it.each([
    ["layoutByTheme", { relief: { actors: {} } }],
    ["stageHeaders", { relief: { topPad: 20 } }],
    ["figureInsetByTheme", { relief: { top: 18 } }],
  ] as const)("外した %s を YAML / JSON で未知の欄として拒む", (field, value) => {
    expect(parseTextDslV05(yamlDiagram(field, value, "flow")).ok).toBe(false);
    expect(validateDragonJson({ title: "誤り", type: "flow", [field]: value, actors, flow }).ok).toBe(false);
  });

  it.each([
    ["journeySize.plotPadding.left", "journeySize", { plotPadding: { left: -1 } }, "journey", undefined],
    ["journeySize.pointPadding.right", "journeySize", { pointPadding: { right: -1 } }, "journey", undefined],
    ["chartBarSize.cornerRadius", "chartBarSize", { cornerRadius: -1 }, "chart", "bar"],
    ["chartLineSize.plotPadding.left", "chartLineSize", { plotPadding: { left: -1 } }, "chart", "line"],
    ["chartLineSize.plotPadding.right", "chartLineSize", { plotPadding: { right: -1 } }, "chart", "line"],
    ["chartLineSize.tickGap", "chartLineSize", { tickGap: -1 }, "chart", "line"],
    ["chartLineSize.pointPadding.left", "chartLineSize", { pointPadding: { left: -1 } }, "chart", "line"],
    ["chartLineSize.pointPadding.right", "chartLineSize", { pointPadding: { right: -1 } }, "chart", "line"],
    ["chartLineSize.periodY", "chartLineSize", { periodY: -1 }, "chart", "line"],
    ["chartPieSize.centerX", "chartPieSize", { centerX: -1 }, "chart", "pie"],
    ["chartWaffleSize.gridLeft", "chartWaffleSize", { gridLeft: -1 }, "chart", "waffle"],
    ["chartWaffleSize.cellPitch", "chartWaffleSize", { cellPitch: 0 }, "chart", "waffle"],
    ["chartSlopeSize.plotPadding.top", "chartSlopeSize", { plotPadding: { top: -1 } }, "chart", "slope"],
    ["chartSlopeSize.plotPadding.bottom", "chartSlopeSize", { plotPadding: { bottom: -1 } }, "chart", "slope"],
    ["chartSlopeSize.pointPadding.top", "chartSlopeSize", { pointPadding: { top: -1 } }, "chart", "slope"],
    ["chartSlopeSize.pointPadding.bottom", "chartSlopeSize", { pointPadding: { bottom: -1 } }, "chart", "slope"],
    ["chartStackedLayout.legendOffsetY", "chartStackedLayout", { legendOffsetY: "下" }, "chart", "stacked"],
    ["ganttSize.taskColumnWidth", "ganttSize", { taskColumnWidth: -1 }, "gantt", undefined],
    ["ganttSize.timelinePaddingRight", "ganttSize", { timelinePaddingRight: -1 }, "gantt", undefined],
  ] as const)("%s の型の外の値を YAML / JSON で拒む", (_name, field, value, type, shape) => {
    expect(parseTextDslV05(yamlDiagram(field, value, type, shape)).ok).toBe(false);
    expect(validateDragonJson({ title: "誤り", type, ...(shape === undefined ? {} : { shape }), [field]: value, actors, flow }).ok).toBe(false);
  });

  it.each([
    ["legendOffset.x", "legendOffset", { x: "左" }],
    ["legendOffset.y", "legendOffset", { y: "上" }],
  ] as const)("%s の型の外の値を YAML / JSON で拒む", (_name, field, value) => {
    expect(parseTextDslV05(yamlDiagram(field, value, "flow")).ok).toBe(false);
    expect(validateDragonJson({ title: "誤り", type: "flow", [field]: value, actors, flow }).ok).toBe(false);
  });

  it("chartBarShape と viewport.contentOffsetX の型の外の値を YAML / JSON で拒む", () => {
    expect(parseTextDslV05(yamlDiagram("chartBarShape", "round", "chart", "bar")).ok).toBe(false);
    expect(validateDragonJson({ title: "誤り", type: "chart", shape: "bar", chartBarShape: "round", actors, flow }).ok).toBe(false);
    expect(parseTextDslV05(`title: 誤り\ntype: flow\nviewport: { contentOffsetX: 左 }\nactors:\n  - A\nflow: []\n`).ok).toBe(false);
    expect(validateDragonJson({ title: "誤り", type: "flow", viewport: { contentOffsetX: "左" }, actors: ["A"], flow: [] }).ok).toBe(false);
  });

  it.each([...objectCases, ["legendOffset", { x: -200, y: -40 }, "flow", undefined] as const])(
    "%s の未知の子欄を YAML / JSON で拒む",
    (field, value, type, shape) => {
      const invalid = { ...value, unknown2854: true };
      expect(parseTextDslV05(yamlDiagram(field, invalid, type, shape)).ok).toBe(false);
      expect(validateDragonJson({ title: "誤り", type, ...(shape === undefined ? {} : { shape }), [field]: invalid, actors, flow }).ok).toBe(false);
    },
  );

  it.each([
    ["chartLineSize.plotPadding", "chartLineSize", { plotPadding: { left: 92, unknown2854: 1 } }, "line"],
    ["chartLineSize.pointPadding", "chartLineSize", { pointPadding: { left: 46, unknown2854: 1 } }, "line"],
    ["chartSlopeSize.plotPadding", "chartSlopeSize", { plotPadding: { top: 109, unknown2854: 1 } }, "slope"],
    ["chartSlopeSize.pointPadding", "chartSlopeSize", { pointPadding: { top: 44, unknown2854: 1 } }, "slope"],
    ["journeySize.plotPadding", "journeySize", { plotPadding: { left: 120, unknown2854: 1 } }, undefined],
    ["journeySize.pointPadding", "journeySize", { pointPadding: { left: 100, unknown2854: 1 } }, undefined],
  ] as const)("%s の未知の子欄を YAML / JSON で拒む", (_name, field, value, shape) => {
    const type = shape === undefined ? "journey" : "chart";
    expect(parseTextDslV05(yamlDiagram(field, value, type, shape)).ok).toBe(false);
    expect(validateDragonJson({ title: "誤り", type, ...(shape === undefined ? {} : { shape }), [field]: value, actors, flow }).ok).toBe(false);
  });
});
