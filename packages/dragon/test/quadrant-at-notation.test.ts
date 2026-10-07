import { describe, expect, it } from "vitest";
import { jsonToDiagram, textDslToDiagram, type CompileNotice } from "../src";

const build = (actor: string, tail = "") => {
  const notices: CompileNotice[] = [];
  const diagram = textDslToDiagram(
    `title: 四象限\ntype: quadrant\nactors:\n  ${actor}\n${tail}`,
    { onNotice: (notice) => notices.push(notice) },
  );
  return { item: diagram.nodes[0]?.quadrantData?.items[0], notices };
};

describe("四象限の座標 at (#2837)", () => {
  it("[x, y] と状態参照を at へ渡す", () => {
    expect(build('- A: { value: "右上", at: [0.2, 0.8] }').item).toMatchObject({
      at: { x: 0.2, y: 0.8 },
    });
    expect(
      build(
        '- A: { 点の位置: ["{x}", "{y}"] }',
        "states:\n  x: 0.2\n  y: 0.8\n",
      ).item?.at,
    ).toEqual({ x: "{x}", y: "{y}" });
    expect(
      jsonToDiagram({
        title: "四象限",
        type: "quadrant",
        actors: [{ name: "A", 点の位置: [0.2, 0.8] }],
        flow: [],
      }).nodes[0]?.quadrantData?.items[0]?.at,
    ).toEqual({ x: 0.2, y: 0.8 });
  });

  it("範囲外は知らせて描画側へ渡し、読めない形は載せない", () => {
    const outside = build("- A: { at: [-0.2, 1.4] }");
    expect(outside.item?.at).toEqual({ x: -0.2, y: 1.4 });
    expect(outside.notices.some((n) => n.message.includes("最寄りの端") && n.line === 4)).toBe(true);

    const invalid = build("- A: { at: [abc, 0.8] }");
    expect(invalid.item).toBeUndefined();
    expect(invalid.notices.some((n) => n.kind === "chart-value-unreadable" && n.line === 4)).toBe(true);

    const stateOutside = build(
      '- A: { at: ["{x}", "{y}"] }',
      'states:\n  x: 0.2\n  y: 0.8\nanimation:\n  - step: "移す" 1s\n    set:\n      x: 1.2\n',
    );
    expect(stateOutside.item?.at).toEqual({ x: "{x}", y: "{y}" });
    expect(stateOutside.notices.some((n) => n.message.includes("0..1") && n.line === 4)).toBe(true);
  });

  it("座標を区画より優先し、食い違いを知らせる", () => {
    const result = build('- A: { value: "右上", at: [0.2, 0.2] }');
    expect(result.item).toMatchObject({ at: { x: 0.2, y: 0.2 } });
    expect(result.item).not.toHaveProperty("quadrant");
    expect(result.notices.some((n) => n.message.includes("食い違") && n.line === 4)).toBe(true);
  });

  it("欄を書かなければ従来どおり区画だけを出す", () => {
    expect(build('- A: "左上"').item).toEqual({ id: "a", title: "A", quadrant: "topLeft" });
  });
});
