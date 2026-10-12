import { describe, expect, it } from "vitest";

import { jsonToDiagram, textDslToDiagram, validateDragonJson } from "../src";

describe("箱の足の左欄を空ける (#2836)", () => {
  it("YAML / JSON の空の label を CDL の figureCard へ渡す", () => {
    const expected = { label: "", note: "記録 3" } as const;
    const yaml = textDslToDiagram(`title: 左欄を空けた足
type: record
actors:
  - 荷物: { kind: storage, figureCard: {"label":"","note":"記録 3"} }
`).nodes[0];
    const input = {
      title: "左欄を空けた足",
      type: "record",
      actors: [{ name: "荷物", kind: "storage", figureCard: expected }],
      flow: [],
    } as const;

    expect(yaml?.figureCard).toEqual(expected);
    expect(validateDragonJson(input).ok).toBe(true);
    expect(jsonToDiagram(input).nodes[0]?.figureCard).toEqual(expected);
  });
});
