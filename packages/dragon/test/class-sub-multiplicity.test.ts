/**
 * クラス図の `sub` は多重度として engine に渡し、札の下の行へは写さない (#1769)。
 *
 * クラス図の組み立てが `sub` を `cardinality` に移し、engine (cdl#821) がそれを行き先の端の字
 * (`headLabel`) に置く。 変換の最後に書いた補足を矢印へ写す処理が、クラス図でも `sub` を札の
 * 下の行へ写していたため、`1..*` が札と端の 2 か所に出ていた。
 *
 * 母集団は自分で組む文書だけ (外から増減しない)。
 */
import { describe, expect, it } from "vitest";
import { compileToCdl } from "../src/compile";
import { jsonToDiagram } from "../src/json-parser";
import type { DslActor, DslDocument, DslStep, PresetType } from "../src/types";

const actor = (name: string): DslActor => ({ name, kind: "actor", pos: { line: 1 } });
const step = (from: string, to: string, over: Partial<DslStep> = {}): DslStep => ({
  no: 1,
  from,
  to,
  label: "持つ",
  pos: { line: 1 },
  ...over,
});
const 文書 = (type: PresetType, flow: DslStep[]): DslDocument => ({
  title: "T",
  type,
  actors: [actor("Admin"), actor("Order")],
  flow,
  pos: { line: 1 },
});

describe("クラス図の `sub` (#1769)", () => {
  it("多重度は行き先の端の字に入り、札の下の行には入らない", () => {
    const d = compileToCdl(文書("class", [step("Admin", "Order", { relation: "aggregates", sub: "1..*" })]));
    expect(d.edges, "矢印が 1 本も無い (検査が空振りしている)").toHaveLength(1);
    expect(d.edges[0]!.headLabel).toBe("1..*");
    expect(d.edges[0]!.sub).toBeUndefined();
  });

  it("陰性対照: `sub` を書かないクラス図の矢印は、端の字も札の下の行も持たない", () => {
    const d = compileToCdl(文書("class", [step("Admin", "Order", { relation: "aggregates" })]));
    expect(d.edges).toHaveLength(1);
    expect(d.edges[0]!.headLabel).toBeUndefined();
    expect(d.edges[0]!.sub).toBeUndefined();
  });

  it("クラス図でない図は、これまでどおり `sub` を札の下の行へ写す", () => {
    const d = compileToCdl(文書("flow", [step("Admin", "Order", { sub: "/validate" })]));
    expect(d.edges.length, "矢印が 1 本も無い (検査が空振りしている)").toBeGreaterThan(0);
    expect(d.edges.map((e) => e.sub)).toContain("/validate");
    expect(d.edges.every((e) => e.headLabel === undefined)).toBe(true);
  });
});

describe("クラス図の `tailSub` (#1771)", () => {
  it("出どころ側の多重度は、出どころの端の字に入る", () => {
    const d = compileToCdl(
      文書("class", [step("Admin", "Order", { relation: "aggregates", sub: "1..*", tailSub: "1" })]),
    );
    expect(d.edges, "矢印が 1 本も無い (検査が空振りしている)").toHaveLength(1);
    expect(d.edges[0]!.tailLabel).toBe("1");
    expect(d.edges[0]!.headLabel).toBe("1..*");
    expect(d.edges[0]!.sub).toBeUndefined();
  });

  it("JSON の `tailSub` も記法と同じ矢印になる", () => {
    const d = jsonToDiagram({
      title: "T",
      type: "class",
      actors: [{ name: "Admin" }, { name: "Order" }],
      flow: [{ from: "Admin", to: "Order", label: "持つ", relation: "aggregates", sub: "1..*", tailSub: "1" }],
    } as never);
    expect(d.edges, "矢印が 1 本も無い (検査が空振りしている)").toHaveLength(1);
    expect(d.edges[0]!.tailLabel).toBe("1");
    expect(d.edges[0]!.headLabel).toBe("1..*");
  });

  it("陰性対照: クラス図でない図は `tailSub` を読まない (関係の語と同じ)", () => {
    const d = compileToCdl(文書("flow", [step("Admin", "Order", { tailSub: "1" })]));
    expect(d.edges.length, "矢印が 1 本も無い (検査が空振りしている)").toBeGreaterThan(0);
    expect(d.edges.every((e) => e.tailLabel === undefined)).toBe(true);
  });
});
