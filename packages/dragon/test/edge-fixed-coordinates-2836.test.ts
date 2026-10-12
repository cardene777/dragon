import { describe, expect, it } from "vitest";

import { jsonToDiagram, textDslToDiagram } from "../src";

describe("線の固定座標を記法から渡す (#2836)", () => {
  it("YAML / JSON の posX1 / posY1 / posX2 / posY2 を CDL の線へ渡す", () => {
    const expected = { posX1: 1452, posY1: 124.945, posX2: 1366, posY2: 312.5 } as const;
    const yaml = textDslToDiagram(`title: 固定した線
type: record
actors:
  - A
  - B
flow:
  - A -> B: "使う" { posX1: 1452, posY1: 124.945, posX2: 1366, posY2: 312.5 }
`);
    const json = jsonToDiagram({
      title: "固定した線",
      type: "record",
      actors: ["A", "B"],
      flow: [{ from: "A", to: "B", label: "使う", ...expected }],
    });

    for (const diagram of [yaml, json]) expect(diagram.edges[0]).toMatchObject(expected);
  });
});
