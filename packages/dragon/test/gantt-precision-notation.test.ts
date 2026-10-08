import { describe, expect, it } from "vitest";
import { jsonToDiagram, textDslToDiagram, type CompileNotice } from "../src";

const build = (extra: string, actor: string, tail = "") => {
  const notices: CompileNotice[] = [];
  const diagram = textDslToDiagram(
    `title: 工程\ntype: gantt\n${extra}\nactors:\n  ${actor}\n${tail}`,
    { onNotice: (notice) => notices.push(notice) },
  );
  return { node: diagram.nodes[0]!, notices };
};

describe("ガントの ticks と月内位置 (#2837)", () => {
  it("端数の位置、尺、四捨五入した目盛り名を渡す", () => {
    const result = build("ticks: [6月, 7月, 8月, 9月, 10月]", '- 設計: { value: "6月+0.55", end: "7月+0.80" }');
    expect(result.node.ganttAxisMax).toBe(5);
    expect(result.node.ganttData?.[0]).toMatchObject({
      startIdx: 0.55,
      endIdx: 0.8,
      startLabel: "7月",
      endLabel: "7月",
    });
  });

  it("和名の目盛りを JSON でも受ける", () => {
    const node = jsonToDiagram({
      title: "工程",
      type: "gantt",
      目盛り: ["6月", "7月", "8月"],
      actors: [{ name: "設計", value: "6月+0.55", end: "7月+0.80" }],
      flow: [],
    }).nodes[0]!;
    expect(node.ganttAxisMax).toBe(3);
    expect(node.ganttData?.[0]).toMatchObject({ startIdx: 0.55, endIdx: 0.8 });
  });

  it("目盛りに無い月と範囲外の割合を知らせて帯に載せない", () => {
    const missing = build("ticks: [6月, 7月]", '- A: "8月"');
    expect(missing.node.ganttData).toEqual([]);
    expect(missing.notices.some((n) => n.kind === "chart-value-unreadable" && n.line === 5)).toBe(true);

    const unreadable = build("ticks: [6月, 7月]", '- A: "6月+1.20"');
    expect(unreadable.node.ganttData).toEqual([]);
    expect(unreadable.notices.some((n) => n.message.includes("0..1") && n.line === 5)).toBe(true);
  });

  it("1 目盛りより短い帯を知らせて始まりへ倒す", () => {
    const result = build("ticks: [6月, 7月]", '- A: { value: "6月", end: "6月+0.75" }');
    expect(result.node.ganttData?.[0]).toMatchObject({ startIdx: 0, endIdx: 0 });
    expect(result.notices.some((n) => n.kind === "gantt-end-before-start" && n.line === 5)).toBe(true);
  });

  it("欄を書かない月だけの記法は従来の出力を保つ", () => {
    const result = build("", '- A: { value: "6月", end: "7月" }\n  - B: "7月"');
    expect(Object.hasOwn(result.node, "ganttAxisMax")).toBe(false);
    expect(result.node.ganttData).toEqual([
      { id: "a", title: "A", startIdx: 0, endIdx: 1, startLabel: "6月", endLabel: "7月" },
      { id: "b", title: "B", startIdx: 1, endIdx: 1, startLabel: "7月", endLabel: "7月" },
    ]);
  });
});
