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
    // **`type: flow` の静止図は鎖状に組む** = 書いた矢印を使わない。 1 人しか居ない図では
    // 繋ぐ相手が無いので矢印が 1 本も出来ず、書いた端が使われないことを知らせる。
    //
    // #1462 で自分へ戻る矢印を落とさなくなったので、この行は「落ちた行」 ではなくなった
    expect(端の知らせ(yaml).length).toBe(1);
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

describe("名前が重なる登場人物 (#1271 r1-f1)", () => {
  // 名前が重なると組み立ての間だけ尾を付けて分ける (`disambiguateActorIds`)。
  // 知らせが分けた後の名前を指すと、本文にその名前が無いため直しようがない
  const 重なる = `title: "t"
type: flow

actors:
  - "A B": { kind: card }
  - "A-B": { kind: card }
  - C: { kind: card }

flow:
  - "A B" -> C: "x"
  - C -> "A-B": "y"
`;

  it("知らせが書いた名前を指す", () => {
    const n = 端の知らせ(重なる);
    expect(n.length, "知らせが 1 件も無い (検査が空振りしている)").toBe(2);
    // 尾 (16 進の並び) が混ざっていないこと
    for (const x of n) {
      expect(x.actor, `actor に尾が付いている: ${x.actor}`).not.toMatch(/ [0-9a-f]{6}$/);
      expect(x.message, `message に尾が付いている: ${x.message}`).not.toMatch(/[0-9a-f]{6}/);
    }
    expect(n[0]?.actor).toBe("A B");
    expect(n[0]?.message).toContain('"A B -> C"');
    expect(n[1]?.message).toContain('"C -> A-B"');
  });

  it("名前が重ならない形では戻す処理が何もしない", () => {
    // **空白を含む名前を使う**。 短い名前だと、名前を切り詰める実装でも結果が同じになり
    // 「何もしない」 ことを確かめられない (変異試験で実測)
    const n = 端の知らせ(`title: "t"
type: flow

actors:
  - "X Y": { kind: card }
  - B: { kind: card }
  - C: { kind: card }

flow:
  - "X Y" -> C: "x"
`);
    expect(n.length, "知らせが 1 件も無い (検査が空振りしている)").toBe(1);
    expect(n[0]?.actor).toBe("X Y");
    expect(n[0]?.message).toContain('"X Y -> C"');
  });
});
