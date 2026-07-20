import { describe, it, expect } from "vitest";
import { compileToCdl } from "../src/compile";
import type { DslDocument, DslActor, DslStep, PresetType } from "../src/types";
import type { CdlDiagram } from "@cardenelabs/cdl";

/**
 * compile.ts mutation-kill test。
 * 既存 compile-branches.test.ts は各 compiler を nodes.length > 0 の weak assertion でしか
 * 検証しておらず mutation score が 27.49% と低かった。 ここでは型別 compiler / post-process の
 * 出力値 (node kind / title / w / h / lane / stack / eyebrow, edge label / tone / sub / style,
 * lane x / width / contain, sort 順序, 座標計算, cardinality) を精密 assert して mutant を kill する。
 *
 * この test 追加で compile.ts の mutation score は 27.49% → 43.60% に上昇した (第1弾)。
 * compile.ts は 1546 mutant で parser.ts (475) の約 3.3 倍規模、 残存 872 の大半は
 * mergePartIntoDiagram の drag&drop 座標/scale 経路 (233)、 animate 系 (resolveHighlight /
 * injectPhasesFallback / compileSequenceWithAnimate の細部、 291)、 各関数の網羅性不足。
 * 85% までの段階拡大は follow-up Issue で継続する (per-file 段階拡大の第1弾)。
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
function node(d: CdlDiagram, id: string) {
  const n = d.nodes.find((x) => x.id === id);
  if (!n) throw new Error(`node ${id} not found: ${d.nodes.map((x) => x.id).join(",")}`);
  return n;
}
function lane(d: CdlDiagram, id: string) {
  const l = d.lanes.find((x) => x.id === id);
  if (!l) throw new Error(`lane ${id} not found: ${d.lanes.map((x) => x.id).join(",")}`);
  return l;
}

// ── compileGantt: 寸法と QUARTER_CX 座標 ──
describe("compileGantt", () => {
  it("task node は kind card / w 280 / h 64", () => {
    const d = compile("gantt", { actors: [actor("A", { subtitle: "Q1" }), actor("B", { subtitle: "Q2" })] });
    const n = node(d, "a");
    expect(n.kind).toBe("card");
    expect(n.w).toBe(280);
    expect(n.h).toBe(64);
  });
  it("QUARTER_CX で lane.x が決まる (Q1→60, Q2→460, Q3→760, Q4→1060 = cx - 140)", () => {
    const d = compile("gantt", { actors: [actor("A", { subtitle: "Q1" }), actor("B", { subtitle: "Q2" }), actor("C", { subtitle: "Q3" }), actor("D", { subtitle: "Q4" })] });
    expect(lane(d, "gantt-a").x).toBe(60);
    expect(lane(d, "gantt-b").x).toBe(460);
    expect(lane(d, "gantt-c").x).toBe(760);
    expect(lane(d, "gantt-d").x).toBe(1060);
  });
  it("timeline 背景 lane は width 1400", () => {
    expect(lane(compile("gantt"), "gantt-timeline").width).toBe(1400);
  });
  it("未知 subtitle は Q1 (cx 200 → x 60) fallback", () => {
    const d = compile("gantt", { actors: [actor("A", { subtitle: "ZZ" }), actor("B")] });
    expect(lane(d, "gantt-a").x).toBe(60);
  });
});

// ── compileC4: 3 lane 座標 + subtitle 別配置 ──
describe("compileC4", () => {
  it("3 lane の x は 0 / 480 / 960 (LANE_W 400 + gap 80)", () => {
    const d = compile("c4");
    expect(lane(d, "c4-l1").x).toBe(0);
    expect(lane(d, "c4-l2").x).toBe(480);
    expect(lane(d, "c4-l3").x).toBe(960);
    expect(lane(d, "c4-l1").width).toBe(400);
    expect(lane(d, "c4-l1").contain).toBe(true);
  });
  it("subtitle L2 / L3 で lane 振り分け、 それ以外は l1", () => {
    const d = compile("c4", { actors: [actor("A", { subtitle: "L2" }), actor("B", { subtitle: "L3" }), actor("C", { subtitle: "other" })] });
    expect(node(d, "a").lane).toBe("c4-l2");
    expect(node(d, "b").lane).toBe("c4-l3");
    expect(node(d, "c").lane).toBe("c4-l1");
  });
  it("node kind は actor.kind をそのまま使う", () => {
    const d = compile("c4", { actors: [actor("A", { kind: "service" }), actor("B")] });
    expect(node(d, "a").kind).toBe("service");
  });
});

// ── compileEr: entity + cardinality (parseCardinality / stripCardinality) ──
describe("compileEr", () => {
  it("entity node は kind storage + eyebrow エンティティ", () => {
    const d = compile("er");
    expect(node(d, "a").kind).toBe("storage");
    expect(node(d, "a").eyebrow).toBe("エンティティ");
  });
  it("label 内 cardinality を抽出し edge.sub に、 label からは除去", () => {
    const d = compile("er", { flow: [step("A", "B", { label: "所有 1:N" })] });
    const e = d.edges[0]!;
    expect(e.sub).toBe("1:N");
    expect(e.label).toBe("所有");
  });
  it("cardinality 表記なし label は default 1:N", () => {
    const d = compile("er", { flow: [step("A", "B", { label: "関連" })] });
    expect(d.edges[0]!.sub).toBe("1:N");
    expect(d.edges[0]!.label).toBe("関連");
  });
  it("N:M cardinality も認識", () => {
    const d = compile("er", { flow: [step("A", "B", { label: "多対多 N:M" })] });
    expect(d.edges[0]!.sub).toBe("N:M");
  });
});

// ── compileState: initial / final フラグ + transition trigger ──
describe("compileState", () => {
  it("最初の state は eyebrow 初期、 最後は 最終", () => {
    const d = compile("state", { actors: [actor("A"), actor("B"), actor("C")] });
    expect(node(d, "a").eyebrow).toBe("初期");
    expect(node(d, "c").eyebrow).toBe("最終");
  });
  it("中間 state は default eyebrow 状態 (initial / final でない)", () => {
    const d = compile("state", { actors: [actor("A"), actor("B"), actor("C")] });
    expect(node(d, "b").eyebrow).toBe("状態");
  });
  it("actor 1 個なら final は付かない (length > 1 条件)", () => {
    const d = compile("state", { actors: [actor("A")], flow: [step("A", "A")] });
    expect(node(d, "a").eyebrow).toBe("初期");
  });
});

// ── compileMind: 3 lane + root 中央配置 + leaf 左右分配 + 暗黙 edge ──
describe("compileMind", () => {
  it("root は mind-center / w 320、 leaf は左右 / w 280", () => {
    const d = compile("mind", { actors: [actor("Root"), actor("L1"), actor("L2")], flow: [] });
    expect(node(d, "root").lane).toBe("mind-center");
    expect(node(d, "root").w).toBe(320);
    expect(node(d, "l1").lane).toBe("mind-left");
    expect(node(d, "l1").w).toBe(280);
    expect(node(d, "l2").lane).toBe("mind-right");
  });
  it("flow 未宣言なら root → 各 leaf の暗黙 edge を生成 ({from,to} 完全一致)", () => {
    const d = compile("mind", { actors: [actor("Root"), actor("L1"), actor("L2")], flow: [] });
    expect(d.edges.map((e) => ({ from: e.from, to: e.to }))).toEqual([
      { from: "root", to: "l1" },
      { from: "root", to: "l2" },
    ]);
  });
});

// ── compilePie / compileClass: kind と寸法 ──
describe("compilePie / compileClass", () => {
  it("pie slice は kind card / w 480 / h 120", () => {
    const n = node(compile("pie"), "a");
    expect(n.kind).toBe("card");
    expect(n.w).toBe(480);
    expect(n.h).toBe(120);
  });
  it("class node は kind storage / w 400", () => {
    const n = node(compile("class"), "a");
    expect(n.kind).toBe("storage");
    expect(n.w).toBe(400);
  });
});

// ── compileSolidity: kind 優先順 sort ──
describe("compileSolidity", () => {
  it("actor を kind 優先順 (eoa/contract/storage/event) に並べ替える", () => {
    // 入力順 event → contract → eoa、 sort 後は eoa(0) → contract(1) → event(3)
    const d = compile("solidity", {
      actors: [actor("Evt", { kind: "event" }), actor("Ctr", { kind: "contract" }), actor("Usr", { kind: "actor" })],
      flow: [step("Usr", "Ctr")],
    });
    // sequence preset の lane は sorted actor 順 (eoa/actor=0 → contract=1 → event=3)、 完全一致で検証
    const laneIds = d.lanes.map((l) => l.id).filter((id) => ["usr", "ctr", "evt"].includes(id));
    expect(laneIds).toEqual(["usr", "ctr", "evt"]);
  });
});

// ── compileFlow / compileSwimlane / compileTopology: kind と edge style ──
describe("compileFlow / compileSwimlane / compileTopology", () => {
  it("flow の edge は style dotted-flow", () => {
    expect(compile("flow").edges[0]!.style).toBe("dotted-flow");
  });
  it("flow node は actor.kind を保持", () => {
    const d = compile("flow", { actors: [actor("A", { kind: "database" }), actor("B")] });
    expect(node(d, "a").kind).toBe("database");
  });
  it("swimlane は actor ごとに lane を作る", () => {
    const d = compile("swimlane", { actors: [actor("A"), actor("B"), actor("C")], flow: [step("A", "B"), step("B", "C")] });
    expect(lane(d, "a").label).toBe("A");
    expect(lane(d, "b").label).toBe("B");
    expect(lane(d, "c").label).toBe("C");
  });
  it("topology は main group lane (contain true / width 460)", () => {
    const d = compile("topology");
    expect(lane(d, "main").contain).toBe(true);
    expect(lane(d, "main").width).toBe(460);
    expect(node(d, "a").lane).toBe("main");
  });
});

// ── compileSequenceWithAnimate: header 寸法 actorW = max(140, len*22+52)、 animate 経路で検証 ──
describe("compileSequenceWithAnimate header 寸法", () => {
  const SEQ_ANIM = { states: [], phases: [{ name: "p", durationMs: 1000, highlight: [], pos: { line: 1 } }], pos: { line: 1 } } as unknown as DslDocument["animate"];
  it("短い actor 名は最小幅 140 / h 72 (animate 経路)", () => {
    const d = compileToCdl(makeDoc("sequence", { animate: SEQ_ANIM, actors: [actor("A"), actor("B")], flow: [step("A", "B")] }));
    expect(node(d, "a-header").w).toBe(140);
    expect(node(d, "a-header").h).toBe(72);
  });
  it("長い actor 名は len*22+52 で auto-size (13 文字 → 338)", () => {
    const d = compileToCdl(makeDoc("sequence", { animate: SEQ_ANIM, actors: [actor("LongActorName"), actor("B")], flow: [step("LongActorName", "B")] }));
    expect(node(d, "longactorname-header").w).toBe(338);
  });
});

// ── slugify: node id 生成 (小文字化 + 非英数を - に) ──
describe("slugify 経由 node id", () => {
  it("英字は小文字化 + 空白を - に", () => {
    const d = compile("flow", { actors: [actor("Hello World"), actor("B")], flow: [step("Hello World", "B")] });
    expect(d.nodes.some((n) => n.id === "hello-world")).toBe(true);
  });
  it("日本語 actor 名は保持される", () => {
    const d = compile("flow", { actors: [actor("残高"), actor("B")], flow: [step("残高", "B")] });
    expect(d.nodes.some((n) => n.id === "残高")).toBe(true);
  });
});

// ── applyEdgeInlineOptions: guard / cardinality / labelOffset の反映 ──
describe("applyEdgeInlineOptions", () => {
  it("step.guard → edge.guard、 state preset では sub にも同期", () => {
    const d = compile("state", { flow: [step("A", "B", { guard: "x>0" })] });
    const e = d.edges.find((x) => x.from === "a" && x.to === "b")!;
    expect(e.guard).toBe("x>0");
    expect(e.sub).toBe("x>0");
  });
  it("step.cardinality → edge.cardinality", () => {
    const d = compile("er", { flow: [step("A", "B", { cardinality: "1:1", label: "rel" })] });
    const e = d.edges[0]!;
    expect(e.cardinality).toBe("1:1");
  });
  it("step.labelOffsetX / Y → edge に反映", () => {
    const d = compile("swimlane", { flow: [step("A", "B", { labelOffsetX: 5, labelOffsetY: -8 })] });
    const e = d.edges[0]!;
    expect(e.labelOffsetX).toBe(5);
    expect(e.labelOffsetY).toBe(-8);
  });
});

// ── applyGroupContainers: group container lane ──
describe("applyGroupContainers", () => {
  it("doc.groups → group-{id} lane (width 800 / contain true / label)", () => {
    const d = compileToCdl(makeDoc("topology", {
      groups: { g1: { label: "G1", members: ["A"] } } as unknown as DslDocument["groups"],
    }));
    const l = lane(d, "group-g1");
    expect(l.width).toBe(800);
    expect(l.contain).toBe(true);
    expect(l.label).toBe("G1");
  });
});

// ── applyCanvasPivotPositions: actor posX/Y → lane / node 座標伝播 ──
describe("applyCanvasPivotPositions", () => {
  it("actor posX/Y/W/H を対応 lane と node に反映", () => {
    const d = compileToCdl(makeDoc("swimlane", {
      actors: [actor("A", { posX: 100, posY: 50, posW: 200, posH: 300 }), actor("B")],
    }));
    expect(lane(d, "a").posX).toBe(100);
    expect(lane(d, "a").posY).toBe(50);
    expect(lane(d, "a").posW).toBe(200);
    expect(lane(d, "a").posH).toBe(300);
    expect(node(d, "a").posX).toBe(100);
    expect(node(d, "a").posY).toBe(50);
    expect(node(d, "a").posW).toBe(200);
    expect(node(d, "a").posH).toBe(300);
  });
});

// ── compileGenericWithAnimate: phase 生成 / state / tween / set / highlight ──
const ANIM = {
  states: [{ name: "bal", initial: 100, pos: { line: 1 } }],
  phases: [{ name: "送金", durationMs: 1500, highlight: ["A"], tweens: [{ state: "bal", from: 100, to: 90, pos: { line: 1 } }], sets: [{ state: "bal", value: 0, pos: { line: 1 } }], body: "説明", badge: "NEW", pos: { line: 1 } }],
  pos: { line: 1 },
} as unknown as DslDocument["animate"];

describe("compileGenericWithAnimate (flow + animate)", () => {
  it("phase の id / duration / title / body / badge", () => {
    const p = compileToCdl(makeDoc("flow", { animate: ANIM })).phases[0]!;
    expect(p.id).toBe("送金");
    expect(p.duration).toBe(1500);
    expect(p.title).toBe("送金");
    expect(p.body).toBe("説明");
    expect(p.badge).toBe("NEW");
  });
  it("state は id / initial を保持", () => {
    const d = compileToCdl(makeDoc("flow", { animate: ANIM }));
    expect(d.states.find((s) => s.id === "bal")?.initial).toBe(100);
  });
  it("tween は stateId / from / to", () => {
    const p = compileToCdl(makeDoc("flow", { animate: ANIM })).phases[0]!;
    expect(p.tweens?.[0]).toMatchObject({ stateId: "bal", from: 100, to: 90 });
  });
  it("set は stateId / value", () => {
    const p = compileToCdl(makeDoc("flow", { animate: ANIM })).phases[0]!;
    expect(p.sets?.[0]).toMatchObject({ stateId: "bal", value: 0 });
  });
  it("highlight の actor 名は node id に解決され activate に入る", () => {
    const p = compileToCdl(makeDoc("flow", { animate: ANIM })).phases[0]!;
    expect(p.activate).toContain("a");
  });
});

// ── injectPhasesFallback: 独自 layout preset (class 等) + animate で phase 後段注入 ──
describe("injectPhasesFallback", () => {
  it("class + animate は phase が注入される (独自 layout preset)", () => {
    const d = compileToCdl(makeDoc("class", { animate: ANIM }));
    expect(d.phases.length).toBeGreaterThan(0);
    expect(d.phases[0]!.duration).toBe(1500);
  });
});

// ── mergePartsFromActors / mergePartIntoDiagram: parts merge ──
describe("parts merge", () => {
  function partsCompile() {
    const partDiagram = compile("flow");
    return compileToCdl(makeDoc("sequence", {
      actors: [actor("widget", { partId: "flow" }), actor("B")],
      flow: [step("widget", "B")],
    }), { partsCatalog: { flow: partDiagram } });
  }
  it("part の node は alias__ prefix で merge される", () => {
    const d = partsCompile();
    expect(d.nodes.some((n) => n.id === "widget__a")).toBe(true);
    expect(d.nodes.some((n) => n.id === "widget__b")).toBe(true);
  });
  it("part actor 由来の sequence node (widget-header 等) は削除される", () => {
    const d = partsCompile();
    expect(d.nodes.some((n) => n.id === "widget-header")).toBe(false);
    expect(d.nodes.some((n) => n.id.startsWith("widget-"))).toBe(false);
  });
  it("part lane は既存 (part 以外) lane 右端 + gap 300 の外側に配置", () => {
    const d = partsCompile();
    const nonPart = d.lanes.filter((l) => l.id !== "widget__flow");
    const maxRight = Math.max(...nonPart.map((l) => (l.x ?? 0) + l.width));
    expect(d.lanes.find((l) => l.id === "widget__flow")!.x).toBe(maxRight + 300);
  });
  it("catalog 不在の partId は crash せず無視 (壊さない設計)", () => {
    expect(() => compileToCdl(makeDoc("sequence", {
      actors: [actor("widget", { partId: "missing" }), actor("B")],
      flow: [step("widget", "B")],
    }), { partsCatalog: {} })).not.toThrow();
  });
});

// ── applyV05Extensions: inline option / lane merge / viewport ──
describe("applyV05Extensions", () => {
  it("actor subtitle / eyebrow / value を node に merge", () => {
    const d = compile("swimlane", {
      actors: [actor("A", { subtitle: "sub1", eyebrow: "eye1", value: "val1" }), actor("B")],
    });
    const n = node(d, "a");
    expect(n.subtitle).toBe("sub1");
    expect(n.eyebrow).toBe("eye1");
    expect(n.value).toBe("val1");
  });
  it("viewport.laneWidth → 全 lane width を override", () => {
    const d = compileToCdl(makeDoc("swimlane", {
      viewport: { laneWidth: 555 } as unknown as DslDocument["viewport"],
    }));
    for (const l of d.lanes) expect(l.width).toBe(555);
  });
  it("doc.lanes → 既存 lane に x / width / label を merge", () => {
    const d = compileToCdl(makeDoc("swimlane", {
      lanes: { a: { x: 88, width: 777, label: "custom" } } as unknown as DslDocument["lanes"],
    }));
    expect(lane(d, "a").x).toBe(88);
    expect(lane(d, "a").width).toBe(777);
    expect(lane(d, "a").label).toBe("custom");
  });
  it("viewport.width / height → diagram.viewport に集約", () => {
    const d = compileToCdl(makeDoc("swimlane", {
      viewport: { width: 1600, height: 900 } as unknown as DslDocument["viewport"],
    }));
    expect(d.viewport?.width).toBe(1600);
    expect(d.viewport?.height).toBe(900);
  });
  it("viewport の gap / laneGap / nodeGap / labelMargin も集約", () => {
    const d = compileToCdl(makeDoc("swimlane", {
      viewport: { gap: 10, laneGap: 20, nodeGap: 30, labelMargin: 40 } as unknown as DslDocument["viewport"],
    }));
    expect(d.viewport?.gap).toBe(10);
    expect(d.viewport?.laneGap).toBe(20);
    expect(d.viewport?.nodeGap).toBe(30);
    expect(d.viewport?.labelMargin).toBe(40);
  });
  it("actor.rows を node に merge", () => {
    const d = compile("class", { actors: [actor("A", { rows: ["f1", "f2"] }), actor("B")] });
    expect(node(d, "a").rows).toEqual(["f1", "f2"]);
  });
  it("doc.lanes で preset にない lane を新規追加 (x default 0 / width default)", () => {
    const d = compileToCdl(makeDoc("swimlane", {
      lanes: { extra: { width: 500, label: "Extra" } } as unknown as DslDocument["lanes"],
    }));
    expect(lane(d, "extra").width).toBe(500);
    expect(lane(d, "extra").label).toBe("Extra");
  });
});

// ── applyCanvasPivotPositions: actor.nodes[subKey] の sub-node override ──
describe("applyCanvasPivotPositions sub-node override", () => {
  it("actor.nodes[subKey] の posX/posY を {alias}-{subKey} node に反映", () => {
    const d = compileToCdl(makeDoc("sequence", {
      actors: [actor("A", { nodes: { header: { posX: 111, posY: 222 } } }), actor("B")],
      flow: [step("A", "B")],
    }));
    expect(node(d, "a-header").posX).toBe(111);
    expect(node(d, "a-header").posY).toBe(222);
  });
});

// ── compileMind: rootStack と leaf 左右分配の詳細 ──
describe("compileMind 詳細", () => {
  it("rootStack は floor(leafCount / 2) (4 leaf → 2)", () => {
    const d = compile("mind", { actors: [actor("R"), actor("L1"), actor("L2"), actor("L3"), actor("L4")], flow: [] });
    expect(node(d, "r").stack).toBe(2);
  });
  it("leaf は i%2 で left / right 交互分配", () => {
    const d = compile("mind", { actors: [actor("R"), actor("L1"), actor("L2"), actor("L3")], flow: [] });
    expect(node(d, "l1").lane).toBe("mind-left");
    expect(node(d, "l2").lane).toBe("mind-right");
    expect(node(d, "l3").lane).toBe("mind-left");
  });
});

// ── injectPhasesFallback: tween / set も注入 ──
describe("injectPhasesFallback 詳細", () => {
  it("class + animate で tween / set も注入される", () => {
    const p = compileToCdl(makeDoc("class", { animate: ANIM })).phases[0]!;
    expect(p.tweens?.[0]).toMatchObject({ stateId: "bal", from: 100, to: 90 });
    expect(p.sets?.[0]).toMatchObject({ stateId: "bal", value: 0 });
  });
});

// ── applyEdgeInlineOptions: er の cardinality label 併記 ──
describe("applyEdgeInlineOptions er cardinality label", () => {
  it("er で step.cardinality を label に (1:N) 形式で併記 (完全一致)", () => {
    const d = compile("er", { flow: [step("A", "B", { cardinality: "1:N", label: "owns" })] });
    expect(d.edges[0]!.label).toBe("owns (1:N)");
  });
});
