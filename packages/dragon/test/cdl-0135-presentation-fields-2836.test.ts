import { describe, expect, it } from "vitest";
import type { CdlDiagram } from "@cardenelabs/cdl";

import { compileToCdl } from "../src/compile";
import { jsonToDiagram, validateDragonJson } from "../src/json-parser";
import { parseTextDslV05 } from "../src/v05/parser";

const sequenceNode = (diagram: CdlDiagram) =>
  diagram.nodes.find((node) => node.kind === "sequence-board");

const storageNode = (diagram: CdlDiagram, id: string) =>
  diagram.nodes.find((node) => node.id === id && node.kind === "storage");

describe("cdl 0.135.0 の見本合わせの欄を記法から描画へ渡す (#2836)", () => {
  it("YAML の順序図で段間と角形の自己ループを渡す", () => {
    const parsed = parseTextDslV05(`title: "順序"
type: sequence
sequenceRowGap: 100
sequenceSelfLoop: {"form":"orthogonal","width":127,"drop":46}

actors:
  - 荷主
  - 受付

flow:
  - 荷主 -> 受付: "頼む"
  - 受付 -> 受付: "控える"
`);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const node = sequenceNode(compileToCdl(parsed.doc));
    expect(node?.sequenceData?.sequenceRowGap).toBe(100);
    expect(node?.sequenceData?.sequenceSelfLoop).toEqual({
      form: "orthogonal",
      width: 127,
      drop: 46,
    });
  });

  it("YAML の表の箱で全幅の見出し線と空 object の行の受け皿を渡す", () => {
    const parsed = parseTextDslV05(`title: "関係"
type: record

actors:
  - 荷物: { kind: storage, rowDividerForm: full, rowWell: {}, rows: ["番号: 数"] }

flow: []
`);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const node = storageNode(compileToCdl(parsed.doc), "荷物");
    expect(node?.rowDividerForm).toBe("full");
    expect(node?.rowWell).toEqual({});
  });

  it("JSON でも 4 欄を受け、部分指定した受け皿をそのまま渡す", () => {
    const sequence = jsonToDiagram({
      title: "順序",
      type: "sequence",
      sequenceRowGap: 100,
      sequenceSelfLoop: { form: "orthogonal", width: 127, drop: 46 },
      actors: ["荷主", "受付"],
      flow: [{ from: "荷主", to: "受付", label: "頼む" }],
    });
    expect(sequenceNode(sequence)?.sequenceData).toMatchObject({
      sequenceRowGap: 100,
      sequenceSelfLoop: { form: "orthogonal", width: 127, drop: 46 },
    });

    const record = jsonToDiagram({
      title: "型",
      type: "record",
      actors: [
        {
          name: "荷物",
          kind: "storage",
          rowDividerForm: "full",
          rowWell: { top: 2, right: 16, bottom: 4, left: 16, radius: 15 },
          rows: ["番号: 数"],
        },
      ],
      flow: [],
    });
    expect(storageNode(record, "荷物")).toMatchObject({
      rowDividerForm: "full",
      rowWell: { top: 2, right: 16, bottom: 4, left: 16, radius: 15 },
    });
  });

  it("正でない段間と、受け皿の負の寸法を拒む", () => {
    const badGap = validateDragonJson({
      title: "順序",
      type: "sequence",
      sequenceRowGap: 0,
      actors: ["A"],
      flow: [],
    });
    expect(badGap.ok).toBe(false);
    if (!badGap.ok) expect(badGap.errors.map((error) => error.path)).toContain("$.sequenceRowGap");

    const badWell = validateDragonJson({
      title: "型",
      type: "record",
      actors: [{ name: "A", kind: "storage", rowWell: { left: -1 } }],
      flow: [],
    });
    expect(badWell.ok).toBe(false);
    if (!badWell.ok) expect(badWell.errors.map((error) => error.path)).toContain("$.actors[0].rowWell.left");
  });
});
