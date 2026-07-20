import { describe, it, expect } from "vitest";
import { validateDragonJson, jsonToDiagram } from "../src/json-parser";
import type { CdlDiagram } from "@cardenelabs/cdl";

/**
 * json-parser の validation 異常系カバレッジ拡充。
 * 既存 json-parser.test.ts は root/title/type/flow.from/multiple を検証済だが、
 * actors / actor.state / flow.to,label / animation の error path が未カバーだった。
 * LLM structured output の retry loop は error path を prompt に注入するため、
 * 「不正入力を正確な path で reject する」 挙動が実害に直結する。
 */

/** 検証を通す最小の有効 JSON。 各 test で 1 field だけ壊して error path を確認する。 */
function validBase(): Record<string, unknown> {
  return {
    title: "テスト図",
    type: "sequence",
    actors: ["ユーザー", "API"],
    flow: [{ from: "ユーザー", to: "API", label: "呼ぶ" }],
  };
}

function errorPaths(json: unknown): string[] {
  const r = validateDragonJson(json);
  return r.ok ? [] : r.errors.map((e) => e.path);
}

describe("validateDragonJson — 有効入力", () => {
  it("最小有効 JSON は ok:true", () => {
    const r = validateDragonJson(validBase());
    expect(r.ok).toBe(true);
  });

  it("ok:true の data は jsonToDiagram で compile でき node を持つ", () => {
    const diag: CdlDiagram = jsonToDiagram(validBase());
    expect(Array.isArray(diag.nodes)).toBe(true);
    expect(diag.nodes.length).toBeGreaterThan(0);
  });
});

describe("validateDragonJson — actors 異常系", () => {
  it("actors 空配列 → $.actors", () => {
    expect(errorPaths({ ...validBase(), actors: [] })).toContain("$.actors");
  });

  it("actors 非配列 → $.actors", () => {
    expect(errorPaths({ ...validBase(), actors: "ユーザー" })).toContain("$.actors");
  });

  it("actor が number (string/object でない) → $.actors[0]", () => {
    expect(errorPaths({ ...validBase(), actors: [42] })).toContain("$.actors[0]");
  });

  it("object actor で name 欠落 → $.actors[0].name", () => {
    expect(errorPaths({ ...validBase(), actors: [{ kind: "function" }] })).toContain("$.actors[0].name");
  });

  it("actor.kind が空文字 → $.actors[0].kind", () => {
    expect(errorPaths({ ...validBase(), actors: [{ name: "API", kind: "" }] })).toContain("$.actors[0].kind");
  });

  it("actor.state が配列 (plain object でない) → $.actors[0].state", () => {
    expect(errorPaths({ ...validBase(), actors: [{ name: "API", state: [1, 2] }] })).toContain("$.actors[0].state");
  });

  it("actor.state.X が null → $.actors[0].state.X (message に null 明記)", () => {
    const r = validateDragonJson({ ...validBase(), actors: [{ name: "API", state: { v: null } }] });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      const e = r.errors.find((x) => x.path === "$.actors[0].state.v");
      expect(e).toBeDefined();
      expect(e?.message).toContain("null");
    }
  });

  it("actor.state.X が nested object → reject", () => {
    expect(errorPaths({ ...validBase(), actors: [{ name: "API", state: { v: {} } }] })).toContain("$.actors[0].state.v");
  });

  it("actor.state.X が primitive (number/string/boolean) → 通過", () => {
    const r = validateDragonJson({ ...validBase(), actors: [{ name: "API", state: { n: 1, s: "x", b: true } }] });
    expect(r.ok).toBe(true);
  });

  it("string actor は素通り (name 検証対象外)", () => {
    const r = validateDragonJson({ ...validBase(), actors: ["ユーザー", "API"] });
    expect(r.ok).toBe(true);
  });
});

describe("validateDragonJson — flow 異常系", () => {
  it("flow 非配列 → $.flow", () => {
    expect(errorPaths({ ...validBase(), flow: {} })).toContain("$.flow");
  });

  it("flow step が非 object → $.flow[0]", () => {
    expect(errorPaths({ ...validBase(), flow: ["not-object"] })).toContain("$.flow[0]");
  });

  it("step.to が非 string → $.flow[0].to", () => {
    expect(errorPaths({ ...validBase(), flow: [{ from: "A", to: 3, label: "x" }] })).toContain("$.flow[0].to");
  });

  it("step.label が非 string → $.flow[0].label", () => {
    expect(errorPaths({ ...validBase(), flow: [{ from: "A", to: "B" }] })).toContain("$.flow[0].label");
  });

  it("2 番目の step の error は index 1 で示す", () => {
    const paths = errorPaths({ ...validBase(), flow: [{ from: "A", to: "B", label: "ok" }, { from: "A", to: 9, label: "x" }] });
    expect(paths).toContain("$.flow[1].to");
    expect(paths).not.toContain("$.flow[0].to");
  });
});

describe("validateDragonJson — animation 異常系 (optional field)", () => {
  it("animation 未指定 → 通過 (optional)", () => {
    const r = validateDragonJson(validBase());
    expect(r.ok).toBe(true);
  });

  it("animation が非配列 → $.animation", () => {
    expect(errorPaths({ ...validBase(), animation: "call" })).toContain("$.animation");
  });

  it("phase が非 object → $.animation[0]", () => {
    expect(errorPaths({ ...validBase(), animation: [42] })).toContain("$.animation[0]");
  });

  it("phase.step が空文字 → $.animation[0].step", () => {
    expect(errorPaths({ ...validBase(), animation: [{ step: "" }] })).toContain("$.animation[0].step");
  });

  it("有効 animation phase → 通過", () => {
    const r = validateDragonJson({ ...validBase(), animation: [{ step: "呼ぶ", focus: ["ユーザー"] }] });
    expect(r.ok).toBe(true);
  });
});

describe("jsonToDiagram — throw 挙動", () => {
  it("root が非 object → throw", () => {
    expect(() => jsonToDiagram(null)).toThrow();
    expect(() => jsonToDiagram([])).toThrow();
    expect(() => jsonToDiagram("string")).toThrow();
  });

  it("validation error 時の throw message に error path が含まれる", () => {
    expect(() => jsonToDiagram({ ...validBase(), title: "" })).toThrow(/\$\.title/);
  });

  it("複数 error は throw message に全て含まれる", () => {
    let msg = "";
    try {
      jsonToDiagram({ type: "bogus", actors: [], flow: {} });
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg).toContain("$.title");
    expect(msg).toContain("$.type");
    expect(msg).toContain("$.actors");
    expect(msg).toContain("$.flow");
  });

  it("有効 JSON → throw せず CdlDiagram を返す", () => {
    expect(() => jsonToDiagram(validBase())).not.toThrow();
  });
});
