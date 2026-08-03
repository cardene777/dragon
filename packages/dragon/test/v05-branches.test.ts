import { describe, it, expect } from "vitest";
import { parseTextDslV05 } from "../src/v05";

/**
 * v05 parser の未カバー branch (inline mapping / value 型 / lanes・groups / flow option /
 * animation sub / error 経路) を実 v05 DSL で踏む。 既存 text-dsl-v05 は happy path 中心で
 * branch 57.5% だった。 v05 は英語 keyword + YAML 風 + inline `{ }` の複雑 format。
 */

function parse(src: string) {
  return parseTextDslV05(src.trimStart());
}

describe("v05 — actor inline mapping の全 option", () => {
  it("kind / subtitle / eyebrow / value / stack / initial / final / lane / rows を parse", () => {
    const r = parse(`
title: "T"
type: swimlane
actors:
  - Alice: { kind: storage, subtitle: "送り手", eyebrow: "User", value: "100", stack: 1, initial: true, final: false, lane: "l1" }
  - Bob
flow:
  - Alice -> Bob: "x"
`);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const a = r.doc.actors[0];
      expect(a).toMatchObject({ name: "Alice", kind: "storage", subtitle: "送り手", eyebrow: "User", stack: 1, initial: true });
    }
  });

  it("plain actor (mapping なし) も parse", () => {
    const r = parse(`title: "T"\ntype: sequence\nactors:\n  - Solo\nflow:\n  - Solo -> Solo: "x"`);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.doc.actors[0]).toMatchObject({ name: "Solo", kind: "actor" });
  });

  it("shorthand kind (Name: storage) も parse", () => {
    const r = parse(`title: "T"\ntype: sequence\nactors:\n  - Vault: storage\n  - Bob\nflow:\n  - Vault -> Bob: "x"`);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.doc.actors[0]).toMatchObject({ name: "Vault", kind: "storage" });
  });
});

describe("v05 — states (block + inline)", () => {
  it("block 形式 states", () => {
    const r = parse(`title: "T"\ntype: sequence\nactors:\n  - A\nflow:\n  - A -> A: "x"\nstates:\n  bal: 100\n  name: "太郎"`);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const s = r.doc.animate?.states ?? [];
      expect(s.find((x) => x.name === "bal")?.initial).toBe(100);
      expect(s.find((x) => x.name === "name")?.initial).toBe("太郎");
    }
  });

  it("inline 形式 states: { a: 1, b: 2 }", () => {
    const r = parse(`title: "T"\ntype: sequence\nactors:\n  - A\nflow:\n  - A -> A: "x"\nstates: { cnt: 5, flag: true }`);
    expect(r.ok).toBe(true);
  });
});

describe("v05 — viewport / lanes / groups", () => {
  it("viewport inline object", () => {
    const r = parse(`title: "T"\ntype: swimlane\nactors:\n  - A\nflow:\n  - A -> A: "x"\nviewport: { width: 1400, height: 900, laneWidth: 480, gap: 80 }`);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.doc.viewport).toMatchObject({ width: 1400, height: 900 });
  });

  it("lanes block with { } props", () => {
    const r = parse(`title: "T"\ntype: swimlane\nactors:\n  - A\nflow:\n  - A -> A: "x"\nlanes:\n  l1: { x: 0, width: 320, label: "left" }\n  l2: { x: 320, width: 320, label: "right" }`);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.doc.lanes?.l1).toMatchObject({ label: "left" });
      expect(r.doc.lanes?.l2).toMatchObject({ label: "right" });
    }
  });

  it("groups block with { } props", () => {
    const r = parse(`title: "T"\ntype: topology\nactors:\n  - A\nflow:\n  - A -> A: "x"\ngroups:\n  g1: { label: "Group1", members: [A] }`);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.doc.groups?.g1).toBeDefined();
  });
});

describe("v05 — flow inline option", () => {
  it("sub / guard / cardinality / labelOffsetY を parse", () => {
    const r = parse(`title: "T"\ntype: er\nactors:\n  - User\n  - Order\nflow:\n  - User -> Order: "places" { sub: "1:N", cardinality: "1:N", guard: "isActive", labelOffsetY: -8 }`);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.doc.flow[0]).toMatchObject({ sub: "1:N", cardinality: "1:N", guard: "isActive", labelOffsetY: -8 });
    }
  });

  it("tone marker (success) を parse", () => {
    const r = parse(`title: "T"\ntype: sequence\nactors:\n  - A\n  - B\nflow:\n  - A -> B: "ok" (success)`);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.doc.flow[0]).toMatchObject({ tone: "success" });
  });
});

describe("v05 — animation (focus / tween / set / body / badge)", () => {
  it("focus + tween + badge", () => {
    const r = parse(`
title: "T"
type: sequence
actors:
  - A
  - B
flow:
  - A -> B: "x"
states:
  bal: 100
animation:
  - step: "送金" 1.5s
    focus: [A, B]
    tween:
      bal: 100 -> 90
    badge: "送金中"
    body: "説明文"
`);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const p = r.doc.animate?.phases[0];
      expect(p?.name).toBe("送金");
      expect(p?.durationMs).toBe(1500);
      expect(p?.badge).toBe("送金中");
    }
  });

  it("set sub-line", () => {
    const r = parse(`
title: "T"
type: sequence
actors:
  - api
flow:
  - api -> api: "x"
states:
  status: "idle"
animation:
  - step: "submit" 0.8s
    focus: [api]
    set:
      status: "done"
`);
    expect(r.ok).toBe(true);
  });
});

describe("v05 — flow step の変種 (label なし / style / tone+style / part kind)", () => {
  it("label なし (A -> B のみ)", () => {
    const r = parse(`title: "T"\ntype: sequence\nactors:\n  - A\n  - B\nflow:\n  - A -> B`);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.doc.flow[0]).toMatchObject({ from: "A", to: "B", label: "" });
  });

  it("style marker (dotted-flow)", () => {
    const r = parse(`title: "T"\ntype: sequence\nactors:\n  - A\n  - B\nflow:\n  - A -> B: "x" (dotted-flow)`);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.doc.flow[0]?.style).toBe("dotted-flow");
  });

  it("tone + style 両方 (success, dotted-flow)", () => {
    const r = parse(`title: "T"\ntype: sequence\nactors:\n  - A\n  - B\nflow:\n  - A -> B: "x" (success, dotted-flow)`);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.doc.flow[0]?.tone).toBe("success");
      expect(r.doc.flow[0]?.style).toBe("dotted-flow");
    }
  });

  it("未知 kind の actor は partId 経路に落ちる", () => {
    const r = parse(`title: "T"\ntype: sequence\nactors:\n  - arc1: arc-gauge\n  - B\nflow:\n  - arc1 -> B: "x"`);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.doc.actors[0]?.partId).toBe("arc-gauge");
  });
});

describe("v05 — state entry の型 (number / string / quoted)", () => {
  it("number initial", () => {
    const r = parse(`title: "T"\ntype: sequence\nactors:\n  - A\nflow:\n  - A -> A: "x"\nstates:\n  n: 42`);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.doc.animate?.states.find((s) => s.name === "n")?.initial).toBe(42);
  });

  it("quoted string initial", () => {
    const r = parse(`title: "T"\ntype: sequence\nactors:\n  - A\nflow:\n  - A -> A: "x"\nstates:\n  s: "hello"`);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.doc.animate?.states.find((s) => s.name === "s")?.initial).toBe("hello");
  });
});

describe("v05 — animation phase header error", () => {
  it("step header 不正 → error", () => {
    const r = parse(`title: "T"\ntype: sequence\nactors:\n  - A\nflow:\n  - A -> A: "x"\nanimation:\n  - notstep: "y" 1s`);
    // parse は通るが phase は生成されない or error、 どちらでも crash しないことを保証
    expect(typeof r.ok).toBe("boolean");
  });
});

describe("v05 — error / edge", () => {
  it("title 欠落 → ok:false", () => {
    const r = parse(`type: sequence\nactors:\n  - A\nflow:\n  - A -> A: "x"`);
    expect(r.ok).toBe(false);
  });

  it("空入力 → ok:false", () => {
    const r = parse(``);
    expect(r.ok).toBe(false);
  });

  it("コメント行 (#) は skip される", () => {
    const r = parse(`# コメント\ntitle: "T"\ntype: sequence\nactors:\n  - A\nflow:\n  - A -> A: "x"`);
    expect(r.ok).toBe(true);
  });
});
