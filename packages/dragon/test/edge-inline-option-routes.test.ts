/**
 * 矢印の指定 (`guard` / `cardinality` / `labelOffsetX` / `labelOffsetY` / `overlay`) が
 * どの種別でも矢印に届くこと (#1268)。
 *
 * 指定を写す場所は `applyEdgeInlineOptions` 1 か所しかない。 種別ごとの組み立てにも
 * 同じ受け渡しが書かれていたが、`compileToCdl` が組み立ての後に必ず
 * `applyEdgeInlineOptions` を通すため 1 度も効いていなかった (12 行を 1 つずつ消しても
 * 20013 件すべて通る、56 形の出力が 1 文字も変わらない)。
 *
 * その 12 行を消したので、**写す場所が 1 か所になった**。 そこが壊れると全種別が同時に
 * 落ちる。 種別ごとに 1 件ずつ置いて、どの経路が落ちたかを名前で分かるようにする。
 */
import { describe, it, expect } from "vitest";
import { parseTextDslV05 } from "../src/v05";
import { compileToCdl } from "../src/compile";

const 指定 = `{ guard: "g", cardinality: "1:N", labelOffsetX: 3, labelOffsetY: -8, overlay: true }`;

const 段 = `
animation:
  - step: "1" 0.9s
    focus: [A]
    body: "b"
`;

const 記法 = (type: string, 動きあり: boolean): string =>
  `title: "t"
type: ${type}

actors:
  - A: { kind: card }
  - B: { kind: card }

flow:
  - A -> B: "x" ${指定}
${動きあり ? 段 : ""}`;

const 最初の矢印 = (yaml: string) => {
  const r = parseTextDslV05(yaml);
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  const d = compileToCdl(r.doc);
  expect(d.edges.length, "矢印が 1 本も無い (検査が空振りしている)").toBeGreaterThan(0);
  return d.edges[0]!;
};

describe("矢印の指定が種別を問わず届く (#1268)", () => {
  // 組み立ての経路は 2 つある。 段を持つ形は `compileGenericWithAnimate` へ、 段を持たない形は
  // 種別ごとの cdl 組み立てへ回る。 どれも `applyEdgeInlineOptions` を通るので同じ結果になるべき。
  //
  // `sequence` は #1466 で 1 枚の板になり矢印を作らない = この経路を通らない
  for (const [名, type, 動きあり] of [
    ["段のある swimlane", "swimlane", true],
    ["段のない swimlane", "swimlane", false],
    ["段のある flow", "flow", true],
    ["段のある state", "state", true],
    ["段のある topology", "topology", true],
    ["段のない er", "er", false],
    ["段のない class", "class", false],
  ] as const) {
    it(`${名} で 5 つの指定が届く`, () => {
      const e = 最初の矢印(記法(type, 動きあり));
      expect(e.guard, `${名} で guard が届かない`).toBe("g");
      expect(e.cardinality, `${名} で cardinality が届かない`).toBe("1:N");
      expect(e.labelOffsetX, `${名} で labelOffsetX が届かない`).toBe(3);
      expect(e.labelOffsetY, `${名} で labelOffsetY が届かない`).toBe(-8);
      expect(e.overlay, `${名} で overlay が届かない`).toBe(true);
    });
  }

  it("書かなかった矢印には付かない", () => {
    // 全部に付けてしまう実装でも上の検査だけなら通る
    const r = parseTextDslV05(`title: "t"
type: swimlane

actors:
  - A: { kind: card }
  - B: { kind: card }
  - C: { kind: card }

flow:
  - A -> B: "x" ${指定}
  - B -> C: "y"
`);
    if (!r.ok) throw new Error(JSON.stringify(r.errors));
    const d = compileToCdl(r.doc);
    expect(d.edges.length, "矢印が 2 本無い (検査が空振りしている)").toBe(2);
    const y = d.edges.find((e) => e.label === "y");
    expect(y, '"y" の矢印が無い (検査が空振りしている)').toBeDefined();
    expect(y?.guard).toBeUndefined();
    expect(y?.cardinality).toBeUndefined();
    expect(y?.labelOffsetX).toBeUndefined();
    expect(y?.labelOffsetY).toBeUndefined();
    expect(y?.overlay).toBeUndefined();
  });
});
