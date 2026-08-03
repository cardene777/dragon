/**
 * 要素の位置を測る時に配置を計算し直さない (#1006)。
 *
 * `measureActorBoxes` は中で `layout` を呼んでいた。 呼出側が既に組み立てている場合、
 * 同じ図の配置を 2 度計算することになる (辺 500 本で約 300ms、 実測)。
 *
 * パーツを含む本文では置き場所を測るためにこの関数を通るため、 削減の効果がここで戻っていた。
 */
import { describe, it, expect } from "vitest";
import { layout } from "@cardenelabs/cdl";
import { measureActorBoxes, textDslToDiagram } from "../src/index";

/** 並べる順を変えると配置が変わる。 同じ名前の要素が別の場所に来る */
function build(order: string[]) {
  const actors = order.map((a) => `  - ${a}`).join("\n");
  const flow = order.slice(0, -1).map((a, i) => `  - ${a} -> ${order[i + 1]}: "go"`).join("\n");
  return textDslToDiagram(`title: "measure"\ntype: flow\n\nactors:\n${actors}\n\nflow:\n${flow}\n`);
}

describe("配置を渡すと測り直さない (#1006)", () => {
  it("渡した配置に従って測る", () => {
    // 別の並びで組み立てた配置を渡す。 測った位置がその配置に従えば、 渡した方を使っている
    const shown = build(["A", "B", "C"]);
    const other = build(["C", "B", "A"]);
    const otherLaid = layout(other);

    const own = measureActorBoxes(shown);
    const passed = measureActorBoxes(shown, otherLaid);
    const asOther = measureActorBoxes(other);

    expect(passed.get("A"), "渡した配置が使われていない").not.toEqual(own.get("A"));
    expect(passed.get("A")).toEqual(asOther.get("A"));
  });

  it("渡さなければ従来どおり自分で測る", () => {
    const d = build(["A", "B", "C"]);
    const boxes = measureActorBoxes(d);
    expect(boxes.size).toBeGreaterThan(0);
    expect(boxes.get("A")).toBeDefined();
  });

  it("同じ図の配置を渡した時、 渡さない時と同じ結果になる", () => {
    // 呼出側が組み立ての結果をそのまま渡す通常の使い方。 測る値が変わってはいけない
    const d = build(["A", "B", "C"]);
    const own = measureActorBoxes(d);
    const passed = measureActorBoxes(d, layout(d));

    expect([...passed.keys()].sort()).toEqual([...own.keys()].sort());
    for (const [name, box] of own) {
      expect(passed.get(name), name).toEqual(box);
    }
  });
});
