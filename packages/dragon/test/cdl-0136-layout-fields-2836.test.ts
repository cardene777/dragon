import type { CdlDiagram } from "@cardenelabs/cdl";
import { describe, expect, it } from "vitest";

import { jsonToDiagram, textDslToDiagram, validateDragonJson } from "../src";

const sequenceBoard = (diagram: CdlDiagram) =>
  diagram.nodes.find((node) => node.kind === "sequence-board");

describe("cdl 0.136.0 の見本合わせの欄を記法から描画へ渡す (#2836)", () => {
  it("YAML / JSON の順序図で左の列幅と帯幅を渡す", () => {
    const yaml = textDslToDiagram(`title: 順序
type: sequence
sequenceGutter: 610
sequenceBandWidth: 30
actors:
  - A
  - B
flow:
  - A -> B: 呼ぶ
`);
    const json = jsonToDiagram({
      title: "順序",
      type: "sequence",
      sequenceGutter: 610,
      sequenceBandWidth: 30,
      actors: ["A", "B"],
      flow: [{ from: "A", to: "B", label: "呼ぶ" }],
    });

    for (const diagram of [yaml, json]) {
      expect(sequenceBoard(diagram)?.sequenceData).toMatchObject({
        sequenceGutter: 610,
        sequenceBandWidth: 30,
      });
    }
  });

  it("YAML / JSON の表の箱で行配置と縞の有無を渡す", () => {
    const yaml = textDslToDiagram(`title: 型
type: record
actors:
  - 荷物: { kind: storage, rowStripe: false, rowLayout: {"titleBaseline":43,"rowTop":91,"rowPitch":46.5}, rows: [番号] }
flow: []
`);
    const json = jsonToDiagram({
      title: "型",
      type: "record",
      actors: [{
        name: "荷物",
        kind: "storage",
        rowStripe: false,
        rowLayout: { titleBaseline: 43, rowTop: 91, rowPitch: 46.5 },
        rows: ["番号"],
      }],
      flow: [],
    });

    for (const diagram of [yaml, json]) {
      expect(diagram.nodes.find((node) => node.id === "荷物")).toMatchObject({
        rowStripe: false,
        rowLayout: { titleBaseline: 43, rowTop: 91, rowPitch: 46.5 },
      });
    }
  });

  it("YAML / JSON の固定線で途中の点を渡す", () => {
    const expected = {
      posX1: 232,
      posY1: 346,
      posX2: 360,
      posY2: 261.89,
      waypoints: [{ x: 232, y: 293.45 }, { x: 360, y: 293.45 }],
    };
    const yaml = textDslToDiagram(`title: 関係
type: record
actors:
  - A
  - B
flow:
  - A -> B: である { posX1: 232, posY1: 346, posX2: 360, posY2: 261.89, waypoints: [{"x":232,"y":293.45},{"x":360,"y":293.45}] }
`);
    const json = jsonToDiagram({
      title: "関係",
      type: "record",
      actors: ["A", "B"],
      flow: [{ from: "A", to: "B", label: "である", ...expected }],
    });

    for (const diagram of [yaml, json]) expect(diagram.edges[0]).toMatchObject(expected);
  });

  it("正でない順序図の寸法・行送りと直角でない途中の点を拒む", () => {
    const common = { title: "誤り", actors: ["A", "B"], flow: [] };
    for (const [value, path] of [
      [{ ...common, type: "sequence", sequenceGutter: 0 }, "$.sequenceGutter"],
      [{ ...common, type: "sequence", sequenceBandWidth: 0 }, "$.sequenceBandWidth"],
      [{ ...common, type: "record", actors: [{ name: "A", kind: "storage", rowLayout: { rowPitch: 0 } }] }, "$.actors[0].rowLayout.rowPitch"],
      [{ ...common, type: "record", flow: [{ from: "A", to: "B", posX1: 0, posY1: 0, posX2: 20, posY2: 20, waypoints: [{ x: 10, y: 5 }] }] }, "$.flow[0].waypoints[0]"],
    ] as const) {
      const result = validateDragonJson(value);
      expect(result.ok, path).toBe(false);
      if (!result.ok) expect(result.errors.map((error) => error.path), path).toContain(path);
    }
  });
});
