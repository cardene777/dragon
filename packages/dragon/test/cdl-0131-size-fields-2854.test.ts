import { describe, expect, it } from "vitest";

import { jsonToDiagram, parseTextDslV05, textDslToDiagram, validateDragonJson } from "../src";

const treeSize = {
  nodeWidths: [260, 240, 220],
  nodeHeight: 91.891,
  titleFontSize: 29,
  subtitleFontSize: 19,
  siblingGap: 180,
  levelGap: 58.109,
} as const;

const mindSize = {
  root: { width: 330, height: 61.891, fontSize: 29 },
  branch: { width: 220, height: 62.891, fontSize: 29 },
  leaf: { fontSize: 23 },
  rootBranchGap: 155,
  branchLeafGap: 70,
  branchRowGap: 290,
  branchRowOffset: 10,
  leafRowGap: 92,
  leafRowOffset: 6,
} as const;

describe("cdl 0.131.0 の木と放射の寸法 (#2854)", () => {
  it("treeSize を YAML / JSON から木の札へ渡す", () => {
    const yaml = textDslToDiagram(`title: 木
type: tree
treeSize: {"nodeWidths":[260,240,220],"nodeHeight":91.891,"titleFontSize":29,"subtitleFontSize":19,"siblingGap":180,"levelGap":58.109}
actors:
  - 親
  - 子
flow:
  - 親 -> 子
`);
    const json = jsonToDiagram({
      title: "木",
      type: "tree",
      treeSize,
      actors: ["親", "子"],
      flow: [{ from: "親", to: "子", label: "" }],
    });

    for (const diagram of [yaml, json]) expect(diagram.nodes[0]?.treeSize).toEqual(treeSize);
  });

  it("mindSize を YAML / JSON から放射の札へ渡す", () => {
    const yaml = textDslToDiagram(`title: 放射
type: mind
mindSize: {"root":{"width":330,"height":61.891,"fontSize":29},"branch":{"width":220,"height":62.891,"fontSize":29},"leaf":{"fontSize":23},"rootBranchGap":155,"branchLeafGap":70,"branchRowGap":290,"branchRowOffset":10,"leafRowGap":92,"leafRowOffset":6}
actors:
  - 中心
  - 枝
flow:
  - 中心 -> 枝
`);
    const json = jsonToDiagram({
      title: "放射",
      type: "mind",
      mindSize,
      actors: ["中心", "枝"],
      flow: [{ from: "中心", to: "枝", label: "" }],
    });

    for (const diagram of [yaml, json]) expect(diagram.nodes[0]?.mindSize).toEqual(mindSize);
  });

  it("空の object と部分指定を受け、書かなかった寸法を足さない", () => {
    const tree = textDslToDiagram(`title: 木
type: tree
treeSize: {}
actors:
  - 親
flow: []
`).nodes[0];
    const mind = textDslToDiagram(`title: 放射
type: mind
mindSize: {"leaf":{"fontSize":23},"branchRowOffset":-4}
actors:
  - 中心
flow: []
`).nodes[0];

    expect(tree?.treeSize).toEqual({});
    expect(mind?.mindSize).toEqual({ leaf: { fontSize: 23 }, branchRowOffset: -4 });
  });

  it("対象外の図では既存の treeNodeForm / mindForm と同じく CDL の節へ渡さない", () => {
    const mind = textDslToDiagram(`title: 放射
type: mind
treeNodeForm: frame
treeSize: {"nodeHeight":89.891}
actors:
  - 中心
flow: []
`).nodes[0];
    const tree = jsonToDiagram({
      title: "木",
      type: "tree",
      mindForm: "outline",
      mindSize: { branch: { height: 60.891 } },
      actors: ["親"],
      flow: [],
    }).nodes[0];

    expect(mind?.treeNodeForm).toBeUndefined();
    expect(mind?.treeSize).toBeUndefined();
    expect(tree?.mindForm).toBeUndefined();
    expect(tree?.mindSize).toBeUndefined();
  });

  it("0 以下の正寸法、負の間隔、空の幅、知らない欄を YAML / JSON で知らせる", () => {
    const yaml = parseTextDslV05(`title: 誤り
type: tree
treeSize: {"nodeWidths":[],"nodeHeight":0,"siblingGap":-1,"extra":2}
mindSize: {"root":{"width":0,"extra":2},"branchRowGap":-1,"leafRowOffset":-4}
actors:
  - A
flow: []
`);
    expect(yaml.ok).toBe(false);
    if (yaml.ok) return;
    expect(yaml.errors.map((error) => error.message).join(" / ")).toContain("treeSize");
    expect(yaml.errors.map((error) => error.message).join(" / ")).toContain("mindSize");

    const json = validateDragonJson({
      title: "誤り",
      type: "mind",
      treeSize: { nodeWidths: [], nodeHeight: 0, siblingGap: -1, extra: 2 },
      mindSize: { root: { width: 0, extra: 2 }, branchRowGap: -1, leafRowOffset: -4 },
      actors: ["A"],
      flow: [],
    });
    expect(json.ok).toBe(false);
    if (json.ok) return;
    expect(json.errors.map((error) => error.path)).toEqual(
      expect.arrayContaining([
        "$.treeSize.nodeWidths",
        "$.treeSize.nodeHeight",
        "$.treeSize.siblingGap",
        "$.treeSize.extra",
        "$.mindSize.root.width",
        "$.mindSize.root.extra",
        "$.mindSize.branchRowGap",
      ]),
    );
    expect(json.errors.map((error) => error.path)).not.toContain("$.mindSize.leafRowOffset");
  });
});
