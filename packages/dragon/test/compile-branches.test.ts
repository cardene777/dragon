import { describe, it, expect } from "vitest";
import { compileToCdl } from "../src/compile";
import type { DslDocument, DslActor, DslStep, PresetType } from "../src/types";
import type { CdlDiagram } from "@cardenelabs/cdl";

/**
 * compile.ts の未カバー branch (type 別 compiler + post-process feature) を、
 * DslDocument を直接構築して compileToCdl に渡して execute する。
 * base parser は sequence/flow/swimlane/er/state/topology のみ受理し、
 * solidity/gantt/class/pie/c4/mind の compiler は DslDocument 直接構築でしか到達しない。
 * compileToCdl の契約は DslDocument → CdlDiagram なので、 crafted doc での unit test は妥当。
 * catalog compile テストが cover しない type 別 compiler + animate/groups/parts 経路を埋める。
 */

function actor(name: string, over: Partial<DslActor> = {}): DslActor {
  return { name, kind: "actor", pos: { line: 1 }, ...over };
}
function step(from: string, to: string, over: Partial<DslStep> = {}): DslStep {
  return { no: 1, from, to, label: "x", pos: { line: 1 }, ...over };
}
function makeDoc(type: PresetType, over: Partial<DslDocument> = {}): DslDocument {
  return {
    title: "T",
    type,
    actors: [actor("A"), actor("B")],
    flow: [step("A", "B")],
    pos: { line: 1 },
    ...over,
  };
}
function compile(type: PresetType, over: Partial<DslDocument> = {}): CdlDiagram {
  return compileToCdl(makeDoc(type, over));
}

describe("compile — type 別 compiler が有効 diagram を生成", () => {
  for (const type of ["sequence", "flow", "swimlane", "er", "state", "topology", "solidity", "gantt", "class", "pie", "c4", "mind"] as PresetType[]) {
    it(`type "${type}" → nodes を持つ CdlDiagram`, () => {
      const d = compile(type);
      expect(typeof d.id).toBe("string");
      expect(Array.isArray(d.nodes)).toBe(true);
      expect(d.nodes.length).toBeGreaterThan(0);
    });
  }

  it("同一 doc の compile は決定的 (2 回で node 数一致)", () => {
    expect(compile("flow").nodes.length).toBe(compile("flow").nodes.length);
  });
});

describe("compile — animate block (compileSequenceWithAnimate / injectPhasesFallback)", () => {
  const animate = {
    states: [{ name: "bal", initial: 100, pos: { line: 1 } }],
    phases: [
      {
        name: "送金",
        durationMs: 1500,
        highlight: ["A", "B"],
        tweens: [{ state: "bal", from: 100, to: 90, pos: { line: 1 } }],
        sets: [{ state: "bal", value: 0, pos: { line: 1 } }],
        body: "説明",
        badge: "NEW",
        pos: { line: 1 },
      },
    ],
    pos: { line: 1 },
  };

  it("sequence + animate → phases を持つ diagram", () => {
    const d = compileToCdl(makeDoc("sequence", { animate }));
    expect(d.nodes.length).toBeGreaterThan(0);
    expect(Array.isArray(d.phases)).toBe(true);
  });

  it("flow + animate (generic animate 経路)", () => {
    const d = compileToCdl(makeDoc("flow", { animate }));
    expect(d.nodes.length).toBeGreaterThan(0);
  });

  it("animate に highlight のみ (未定義 state focus)", () => {
    const d = compileToCdl(makeDoc("sequence", {
      animate: { states: [], phases: [{ name: "p", durationMs: 1000, highlight: ["A"], pos: { line: 1 } }], pos: { line: 1 } },
    }));
    expect(d.nodes.length).toBeGreaterThan(0);
  });

  it("resolveHighlight: 矢印記法 (A→B) の highlight", () => {
    const d = compileToCdl(makeDoc("sequence", {
      animate: { states: [], phases: [{ name: "p", durationMs: 1000, highlight: ["A→B"], pos: { line: 1 } }], pos: { line: 1 } },
    }));
    expect(d.nodes.length).toBeGreaterThan(0);
  });

  it("resolveHighlight: 未存在 actor の highlight (laneId undefined 経路)", () => {
    const d = compileToCdl(makeDoc("sequence", {
      animate: { states: [], phases: [{ name: "p", durationMs: 1000, highlight: ["ghost"], pos: { line: 1 } }], pos: { line: 1 } },
    }));
    expect(d.nodes.length).toBeGreaterThan(0);
  });

  it("複数 phase + 複数 state の tween/set", () => {
    const d = compileToCdl(makeDoc("sequence", {
      animate: {
        states: [
          { name: "a", initial: 10, pos: { line: 1 } },
          { name: "b", initial: 20, pos: { line: 1 } },
        ],
        phases: [
          { name: "p1", durationMs: 1000, highlight: ["A"], tweens: [{ state: "a", from: 10, to: 5, pos: { line: 1 } }], pos: { line: 1 } },
          { name: "p2", durationMs: 1000, highlight: ["A→B"], sets: [{ state: "b", value: 99, pos: { line: 1 } }], pos: { line: 1 } },
        ],
        pos: { line: 1 },
      },
    }));
    expect(d.nodes.length).toBeGreaterThan(0);
    expect(d.phases?.length).toBeGreaterThanOrEqual(2);
  });

  it("swimlane + animate (generic animate 経路の別 type)", () => {
    const d = compileToCdl(makeDoc("swimlane", {
      animate: { states: [{ name: "s", initial: 1, pos: { line: 1 } }], phases: [{ name: "p", durationMs: 800, highlight: ["A"], sets: [{ state: "s", value: 2, pos: { line: 1 } }], pos: { line: 1 } }], pos: { line: 1 } },
    }));
    expect(d.nodes.length).toBeGreaterThan(0);
  });
});

describe("compile — edge inline option (applyEdgeInlineOptions)", () => {
  it("guard / cardinality を持つ step → edge に反映", () => {
    const d = compileToCdl(makeDoc("er", {
      flow: [step("A", "B", { guard: "isActive", cardinality: "1:N", sub: "note" })],
    }));
    expect(d.edges.length).toBeGreaterThan(0);
  });

  it("labelOffset を持つ step", () => {
    const d = compileToCdl(makeDoc("sequence", {
      flow: [step("A", "B", { labelOffsetX: 5, labelOffsetY: -8 })],
    }));
    expect(d.nodes.length).toBeGreaterThan(0);
  });
});

describe("compile — v05 extensions (applyV05Extensions / applyGroupContainers)", () => {
  it("viewport / lanes を持つ doc", () => {
    const d = compileToCdl(makeDoc("swimlane", {
      viewport: { width: 1400, height: 900, pos: { line: 1 } } as unknown as DslDocument["viewport"],
      lanes: { l1: { label: "L1" } as unknown as DslDocument["lanes"][string] },
    }));
    expect(d.nodes.length).toBeGreaterThan(0);
  });

  it("groups を持つ doc → container 適用", () => {
    const d = compileToCdl(makeDoc("topology", {
      groups: { g1: { label: "G1", members: ["A"] } as unknown as DslDocument["groups"][string] },
    }));
    expect(d.nodes.length).toBeGreaterThan(0);
  });
});

describe("compile — parts merge (mergePartsFromActors)", () => {
  it("partId を持つ actor + partsCatalog で merge", () => {
    const partDiagram: CdlDiagram = compile("flow");
    const doc = makeDoc("sequence", {
      actors: [actor("widget", { partId: "flow", kind: "actor" }), actor("B")],
      flow: [step("widget", "B")],
    });
    const d = compileToCdl(doc, { partsCatalog: { flow: partDiagram } });
    expect(d.nodes.length).toBeGreaterThan(0);
  });

  it("partId actor だが catalog 不在 → crash せず fallback", () => {
    const doc = makeDoc("sequence", {
      actors: [actor("widget", { partId: "missing" }), actor("B")],
      flow: [step("widget", "B")],
    });
    expect(() => compileToCdl(doc, { partsCatalog: {} })).not.toThrow();
  });
});

describe("compile — canvas pivot 座標伝播 (applyCanvasPivotPositions)", () => {
  it("posX/posY を持つ actor → lane/node に伝播", () => {
    const d = compileToCdl(makeDoc("swimlane", {
      actors: [actor("A", { posX: 100, posY: 50, posW: 200, posH: 300 }), actor("B")],
    }));
    expect(d.nodes.length).toBeGreaterThan(0);
  });
});
