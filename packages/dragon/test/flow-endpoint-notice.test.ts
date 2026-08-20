/**
 * 静止した `type: flow` が書いた矢印の端を無視することを知らせる (#1269)。
 *
 * この図種は登場人物を書いた順に鎖状に繋ぎ、説明文は「その箱を to に持つ行」 から拾う。
 * 書いた側の端は使わないため `A -> C` と書いても出来るのは `A -> B` になる。
 *
 * 書いた形と違う図が出るのに知らせが 1 件も無い状態だった。
 */
import { describe, it, expect } from "vitest";
import { parseTextDslV05 } from "../src/v05";
import { compileToCdl, type CompileNotice } from "../src/compile";

const 知らせ = (yaml: string): CompileNotice[] => {
  const r = parseTextDslV05(yaml);
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  const 出: CompileNotice[] = [];
  compileToCdl(r.doc, { onNotice: (n) => 出.push(n) });
  return 出;
};

const 端の知らせ = (yaml: string): CompileNotice[] =>
  知らせ(yaml).filter((n) => n.kind === "flow-endpoint-not-honored");

const 本文 = (type: string, flow: string, 尾 = ""): string =>
  `title: "t"
type: ${type}

actors:
  - A: { kind: card }
  - B: { kind: card }
  - C: { kind: card }

flow:
${flow}${尾}`;

const 段 = `
animation:
  - step: "1" 0.9s
    focus: [A]
    body: "b"
`;

describe("書いた矢印の端が使われないことを知らせる (#1269)", () => {
  it("端が食い違う 2 行とも知らせに現れる", () => {
    const n = 端の知らせ(本文("flow", `  - A -> C: "x"\n  - C -> B: "y"\n`));
    expect(n.length).toBe(2);
    // 書いた行を指す。 行がずれると本文のどこを直せばよいか分からない
    expect(n.map((x) => x.line).sort((a, b) => a - b)).toEqual([10, 11]);
    expect(n[0]?.message).toContain("A -> C");
    expect(n[1]?.message).toContain("C -> B");
  });

  it("知らせに回避策が入っている", () => {
    const n = 端の知らせ(本文("flow", `  - A -> C: "x"\n`));
    expect(n.length, "知らせが 1 件も無い (検査が空振りしている)").toBeGreaterThan(0);
    expect(n[0]?.hint).toContain("lane:");
  });

  // 陰性。 書いた端がそのまま鎖になる形で知らせると、正しく書いた人にまで出る
  it("偶然一致する形では知らせない", () => {
    expect(端の知らせ(本文("flow", `  - A -> B: "x"\n  - B -> C: "y"\n`)).length).toBe(0);
  });

  it("段のある形では知らせない", () => {
    // generic 経路へ回るため書いた端がそのまま矢印になる
    expect(端の知らせ(本文("flow", `  - A -> C: "x"\n  - C -> B: "y"\n`, 段)).length).toBe(0);
  });

  it("縦列を書いた形では知らせない", () => {
    const yaml = `title: "t"
type: flow

lanes:
  L0: { width: 320 }
  L1: { width: 320 }
  L2: { width: 320 }

actors:
  - A: { kind: card, lane: L0 }
  - B: { kind: card, lane: L1 }
  - C: { kind: card, lane: L2 }

flow:
  - A -> C: "x"
  - C -> B: "y"
`;
    expect(端の知らせ(yaml).length).toBe(0);
  });

  it("flow 以外では知らせない", () => {
    for (const t of ["swimlane", "er", "state", "topology", "class"]) {
      expect(端の知らせ(本文(t, `  - A -> C: "x"\n  - C -> B: "y"\n`)).length, `${t} で知らせが出た`).toBe(0);
    }
  });

  it("矢印が 1 本も出来ない形でも落ちない", () => {
    const yaml = `title: "t"
type: flow

actors:
  - A: { kind: card }

flow:
  - A -> A: "x"
`;
    // 自分へ戻る矢印は組み立てから外れる (#1232)。 その行は別の知らせが担うので
    // ここでは出さない
    expect(端の知らせ(yaml).length).toBe(0);
    expect(知らせ(yaml).some((n) => n.kind === "flow-self-loop")).toBe(true);
  });

  it("居ない名前を指す行は別の知らせが担う", () => {
    const yaml = `title: "t"
type: flow

actors:
  - A: { kind: card }
  - B: { kind: card }

flow:
  - A -> Z: "x"
`;
    // 同じ 1 行に知らせが 2 件並ばないこと
    expect(端の知らせ(yaml).length).toBe(0);
    expect(知らせ(yaml).some((n) => n.kind === "flow-actor-missing")).toBe(true);
  });
});
