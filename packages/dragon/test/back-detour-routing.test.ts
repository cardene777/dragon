import { describe, it, expect } from "vitest";
import { parseTextDslV05 } from "../src/v05";
import { compileToCdl } from "../src/compile";

/**
 * 後ろへ戻る矢印の回し方の検証 (#1260)。
 *
 * 状態の図は、後ろの状態へ戻る矢印を **箱の上を回して** 描く (`routing: "back-detour"`)。
 * 組立て API 側がそうしており、記法側で付けないと **描いた図の高さが変わる**
 * (実測 = viewBox が 404 対 486 で、戻る矢印が箱の右横を回っていた)。
 *
 * 他の図種の組立て API は付けない (実測 = `er()` は付けなかった)。 揃えないと、
 * 同じ本文で図種を変えただけで矢印の回り方が変わる。
 */

const 記法 = (type: string) =>
  `title: "T"\ntype: ${type}\n\nactors:\n  - A\n  - B\n  - C\nflow:\n` +
  `  - A -> B: "1"\n  - B -> C: "2"\n  - C -> A: "3"\n  - C -> B: "4"\n\n` +
  `animation:\n  - step: "s1" 1s\n    focus: [A]\n    body: "b"\n`;

function 回し方(type: string): (string | undefined)[] {
  const r = parseTextDslV05(記法(type));
  if (!r.ok) throw new Error(r.errors.map((e) => e.message).join(" / "));
  const d = compileToCdl(r.doc);
  return d.edges.map((e) => (e as { routing?: string }).routing);
}

describe("状態の図は後ろへ戻る矢印を上に回す (#1260)", () => {
  it("戻る矢印にだけ付く", () => {
    // A -> B と B -> C は前へ進む。 C -> A と C -> B は後ろへ戻る
    expect(回し方("state")).toEqual([undefined, undefined, "back-detour", "back-detour"]);
  });

  it("戻る矢印が 1 本も無ければ 1 つも付かない (陰性対照)", () => {
    const src = `title: "T"\ntype: state\n\nactors:\n  - A\n  - B\nflow:\n  - A -> B: "1"\n\n` +
      `animation:\n  - step: "s1" 1s\n    focus: [A]\n    body: "b"\n`;
    const r = parseTextDslV05(src);
    const d = r.ok ? compileToCdl(r.doc) : undefined;
    expect(d?.edges.map((e) => (e as { routing?: string }).routing)).toEqual([undefined]);
  });
});

describe("他の図種には付けない (陰性対照)", () => {
  // 組立て API 側が付けないため。 揃えないと同じ本文で図種を変えただけで矢印の回り方が変わる
  for (const type of ["flow", "swimlane", "er", "topology"]) {
    it(`${type} では 1 本も付かない`, () => {
      expect(回し方(type).filter((r) => r !== undefined), `${type} に付いている`).toEqual([]);
    });
  }

  it("状態の図では付く (上の検査が恒真でないこと)", () => {
    // 「どの図種でも付かない」 実装と区別できない状態にしない
    expect(回し方("state").filter((r) => r === "back-detour")).toHaveLength(2);
  });
});
