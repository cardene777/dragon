import { describe, expect, it } from "vitest";

import { textDslToDiagram } from "../src/index";

type GenericKind = "flow" | "swimlane" | "er" | "state" | "topology";

function 記法(type: GenericKind, badge?: string): string {
  const animation =
    badge === undefined
      ? ""
      : `
animation:
  - step: "第一段" 1s
    badge: "${badge}"
    focus: [A]
`;
  return `title: "${type} の種類"
type: ${type}

actors:
  - A: { kind: actor }
  - B: { kind: actor }

flow:
  - A -> B: "進む"
${animation}`;
}

describe("generic 経路の図の種類", () => {
  it("泳線図は札の値や段の有無に依存しない", () => {
    const 実測 = [
      ["札 preset", textDslToDiagram(記法("swimlane", "preset")).type],
      ["札 第一段", textDslToDiagram(記法("swimlane", "第一段")).type],
      ["段なし", textDslToDiagram(記法("swimlane")).type],
    ];

    expect(実測, "泳線図の種類が札の値か段の有無で変わっている").toEqual([
      ["札 preset", "swimlane"],
      ["札 第一段", "swimlane"],
      ["段なし", "swimlane"],
    ]);
  });

  it.each(["er", "flow", "state", "topology"] as const)(
    "%s 図は利用者が書いた札を種類に使わない",
    (type) => {
      expect(textDslToDiagram(記法(type, "第一段")).type, `${type} 図の種類`).toBe(type);
    },
  );
});
