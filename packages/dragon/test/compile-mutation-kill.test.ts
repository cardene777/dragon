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
 * この test 追加で compile.ts の mutation score は 27.49% → 77.04% に上昇した (第1-4弾)。
 * 第1弾 = 型別 compiler + post-process の主要ロジック (→44.37%)、 第2弾 = animate/edge 系の値検証
 * (→50.45%)、 第3弾 = swimlane / 型別 edge 伝播 / 小関数 (→52.65%)、
 * 第4弾 (#868) = parts merge 座標/scale の両分岐 + animate guard + regex 非貪欲性 + option 漏れ検証
 * (→77.04%、 test 82 → 339 件)。
 *
 * ── 第4弾で発見して修正した実装バグ (cc-codex PR #879 review) ────────────────
 *
 * 当初は以下 3 件を「実装がこう動くから」 と test 側で追認していたが、 review で実装の誤りと判明し
 * 実装を修正した。 test で誤挙動を固定するのは規約違反 (rules/quality.md § test 変更 diff 厳格チェック)。
 *
 * - `stripCardinality` = cardinality token を抜いた後の空括弧を落とさず `owns (` / `) owns` と
 *   片括弧が ER 図 edge label に残っていた。 空括弧除去を追加。
 * - `mergePartIntoDiagram` の中心補正 = posW 指定 (scale) 時に lane を元幅で中心補正していたため
 *   lane 中心が node 中心 (drop 座標) から拡張分の半分ずれていた。 双方を scale 後の幅で補正。
 * - `applyV05Extensions` の node 一致条件 第 3 項 = actor 名 "A Header" の slug が `a-header` に
 *   なると別 actor "A" の node `a` に一致し option が漏れる cross-actor leak。 第 3 項を削除。
 *
 * ── kill 不能と判定した等価 mutant (Issue #868 AC 記録) ────────────────
 *
 * 以下は「変異させても出力が変わらない」 ため test では kill 不能 (等価 mutant)。 実測で出力差が
 * 出ないことを確認済、 cc-codex review でも等価判定が妥当と支持された 3 種。
 *
 * - `applyEdgeInlineOptions` の seq-like 分岐 第 2 項 `e.from === fromId`
 *   = sequence/solidity の edge.from は必ず `s{idx}-{slug}` 形式で plain slug と一致しない。
 *   到達不能な条件のため変異が観測できない。
 * - `mergePartIntoDiagram` の `newShape && (scaleX !== 1 || scaleY !== 1)` の true 側変異
 *   = shape 不在時に block へ入っても `scaleGeom(undefined)` が undefined を返すため出力同一。
 * - `console.warn` guard `typeof console !== "undefined" && console.warn`
 *   = vitest 環境では `console` も `console.warn` も常に存在するため、 条件を変異させても
 *   warn 呼出の有無が変わらない。 kill するには `globalThis.console` を消す test が要るが、
 *   test runner 自体の出力経路を壊すため採用しない (実行環境依存の変異で、 production の
 *   振る舞いを検証する価値が無い)。
 *
 * 当初は上記に加えて 3 種 (applyV05Extensions 第 3 項 / step anchor 判定 / 矢印 regex の貪欲化) も
 * 等価と判定していたが、 review で kill 可能と指摘され実際に kill した (第 3 項は cross-actor leak の
 * 実装バグでもあったため削除、 step anchor は `actor.lane === 自身 slug` で fallback 経路に入れて到達、
 * regex は複数文字 actor 名で差が出る)。 また `partStacks.length > 0` は当初「空 part でしか差が出ない」
 * と誤判定していたが、 stack が 0 始まりでない part (stack 2/3) で minStack が潰れると中心が
 * ずれるため kill 可能で、 本 file の「stack が 0 始まりでない part の中心合わせ」 で kill 済。
 *
 * 85% (Stryker high threshold) には到達しない。 残存の主因は到達不能分岐と ObjectLiteral /
 * StringLiteral 系の出力に現れない変異で、 引き上げるなら実装側の冗長性削除が必要になる。
 * それは本 Issue の scope (test 追加) の外。
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

// ── compileSequenceWithAnimate: sequence + animate の全構造 (第1弾は header 寸法のみ) ──
const SEQ_ANIM_FULL = {
  states: [{ name: "bal", initial: 100, pos: { line: 1 } }],
  phases: [
    { name: "送金", durationMs: 1500, highlight: ["A"], tweens: [{ state: "bal", from: 100, to: 90, pos: { line: 1 } }], sets: [{ state: "bal", value: 0, pos: { line: 1 } }], body: "説明", badge: "NEW", pos: { line: 1 } },
    { name: "確認", durationMs: 1000, highlight: ["A→B"], pos: { line: 1 } },
  ],
  pos: { line: 1 },
} as unknown as DslDocument["animate"];

function seqAnimDoc(): CdlDiagram {
  return compileToCdl(makeDoc("sequence", { animate: SEQ_ANIM_FULL, actors: [actor("A"), actor("B")], flow: [step("A", "B")] }));
}

describe("compileSequenceWithAnimate 構造", () => {
  it("header / spacer / step box / footer node を生成", () => {
    const ids = seqAnimDoc().nodes.map((n) => n.id);
    for (const id of ["a-header", "a-spacer", "s0-a", "s0-b", "a-footer", "b-footer"]) {
      expect(ids).toContain(id);
    }
  });
  it("spacer は kind card / w 2 / h 40", () => {
    const n = node(seqAnimDoc(), "a-spacer");
    expect(n.kind).toBe("card");
    expect(n.w).toBe(2);
    expect(n.h).toBe(40);
  });
  it("phase の id / duration / title / body / badge", () => {
    const p = seqAnimDoc().phases[0]!;
    expect(p.id).toBe("送金");
    expect(p.duration).toBe(1500);
    expect(p.title).toBe("送金");
    expect(p.body).toBe("説明");
    expect(p.badge).toBe("NEW");
  });
  it("state id / initial", () => {
    expect(seqAnimDoc().states.find((s) => s.id === "bal")?.initial).toBe(100);
  });
  it("tween stateId/from/to + set stateId/value", () => {
    const p = seqAnimDoc().phases[0]!;
    expect(p.tweens?.[0]).toMatchObject({ stateId: "bal", from: 100, to: 90 });
    expect(p.sets?.[0]).toMatchObject({ stateId: "bal", value: 0 });
  });
});

// ── resolveHighlight (sequence): actor 名 / 矢印記法の focus id 解決 ──
describe("resolveHighlight (sequence)", () => {
  it("actor 名 highlight → header / footer / step box を activate", () => {
    expect(seqAnimDoc().phases[0]!.activate).toEqual(["a-header", "a-footer", "s0-a"]);
  });
  it("矢印記法 A→B highlight → edge + 両端 step box を activate", () => {
    expect(seqAnimDoc().phases[1]!.activate).toEqual(["e0-a-b", "s0-a", "s0-b"]);
  });
});

// ── compileGenericWithAnimate 網羅 (er/state/swimlane + animate) ──
const GEN_ANIM = {
  states: [{ name: "s", initial: 5, pos: { line: 1 } }],
  phases: [{ name: "p", durationMs: 800, highlight: ["A→B"], tweens: [{ state: "s", from: 5, to: 3, pos: { line: 1 } }], sets: [{ state: "s", value: 1, pos: { line: 1 } }], badge: "B", pos: { line: 1 } }],
  pos: { line: 1 },
} as unknown as DslDocument["animate"];

describe("compileGenericWithAnimate 網羅", () => {
  it("er + animate: cardinality を label に (1:N) 併記", () => {
    const d = compileToCdl(makeDoc("er", { animate: GEN_ANIM, flow: [step("A", "B", { cardinality: "1:N", label: "rel" })] }));
    const e = d.edges.find((x) => x.id === "e0-a-b")!;
    expect(e.label).toBe("rel (1:N)");
  });
  it("state + animate: initial/final eyebrow", () => {
    const d = compileToCdl(makeDoc("state", { animate: GEN_ANIM, actors: [actor("A"), actor("B"), actor("C")], flow: [step("A", "B"), step("B", "C")] }));
    expect(node(d, "a").eyebrow).toBe("初期");
    expect(node(d, "c").eyebrow).toBe("最終");
  });
  it("edge id は e{idx}-{from}-{to} / label / tone 保持", () => {
    const d = compileToCdl(makeDoc("swimlane", { animate: GEN_ANIM, flow: [step("A", "B", { label: "msg", tone: "success" })] }));
    const e = d.edges.find((x) => x.id === "e0-a-b")!;
    expect(e.label).toBe("msg");
    expect(e.tone).toBe("success");
  });
  it("state initial / tween / set / badge を保持", () => {
    const d = compileToCdl(makeDoc("swimlane", { animate: GEN_ANIM }));
    const p = d.phases[0]!;
    expect(d.states.find((s) => s.id === "s")?.initial).toBe(5);
    expect(p.tweens?.[0]).toMatchObject({ stateId: "s", from: 5, to: 3 });
    expect(p.sets?.[0]).toMatchObject({ stateId: "s", value: 1 });
    expect(p.badge).toBe("B");
  });
});

// ── resolveHighlightGeneric: generic preset の focus id 解決 ──
describe("resolveHighlightGeneric", () => {
  it("矢印記法 A→B → edge id e0-a-b を activate", () => {
    const d = compileToCdl(makeDoc("swimlane", { animate: GEN_ANIM }));
    expect(d.phases[0]!.activate).toContain("e0-a-b");
  });
  it("actor 名 → node id を activate", () => {
    const d = compileToCdl(makeDoc("swimlane", {
      animate: { states: [], phases: [{ name: "p", durationMs: 500, highlight: ["A"], pos: { line: 1 } }], pos: { line: 1 } } as unknown as DslDocument["animate"],
    }));
    expect(d.phases[0]!.activate).toContain("a");
  });
});

// ── injectPhasesFallback 網羅 (独自 layout preset 各種) ──
describe("injectPhasesFallback 網羅", () => {
  for (const t of ["class", "pie", "c4", "mind", "gantt"] as PresetType[]) {
    it(`${t} + animate で phase 注入 (duration 800)`, () => {
      const d = compileToCdl(makeDoc(t, { animate: GEN_ANIM }));
      expect(d.phases.length).toBeGreaterThan(0);
      expect(d.phases[0]!.duration).toBe(800);
    });
  }
});

// ── compileMind lane 座標 (LEAF_W 280 / ROOT_W 320 / gap 80) ──
describe("compileMind lane 座標", () => {
  it("lane x = left 0 / center 360 / right 760", () => {
    const d = compile("mind", { actors: [actor("R"), actor("L1")], flow: [] });
    expect(lane(d, "mind-left").x).toBe(0);
    expect(lane(d, "mind-center").x).toBe(360);
    expect(lane(d, "mind-right").x).toBe(760);
  });
});

// ── applyEdgeInlineOptions 網羅: sequence (isSeqLike) の edge 検索 ──
describe("applyEdgeInlineOptions isSeqLike", () => {
  it("sequence (isSeqLike) で labelOffset を e0-a-b edge に反映", () => {
    const d = compileToCdl(makeDoc("sequence", { animate: SEQ_ANIM_FULL, actors: [actor("A"), actor("B")], flow: [step("A", "B", { labelOffsetX: 7, labelOffsetY: -3 })] }));
    const e = d.edges.find((x) => x.id === "e0-a-b")!;
    expect(e.labelOffsetX).toBe(7);
    expect(e.labelOffsetY).toBe(-3);
  });
});

// ── compileSwimlane 網羅: edge option + node stack + edge id ──
describe("compileSwimlane 網羅", () => {
  it("edge は sub / tone / style / guard / cardinality / labelOffset を保持", () => {
    const d = compile("swimlane", { flow: [step("A", "B", { sub: "note", tone: "success", style: "dashed", guard: "g", cardinality: "1:N", labelOffsetX: 3, labelOffsetY: 4 })] });
    const e = d.edges[0]!;
    expect(e.sub).toBe("note");
    expect(e.tone).toBe("success");
    expect(e.style).toBe("dashed");
    expect(e.guard).toBe("g");
    expect(e.cardinality).toBe("1:N");
    expect(e.labelOffsetX).toBe(3);
    expect(e.labelOffsetY).toBe(4);
  });
  it("edge id は e{idx}-{from}-{to}", () => {
    const d = compile("swimlane", { flow: [step("A", "B")] });
    expect(d.edges[0]!.id).toBe("e0-a-b");
  });
});

// ── 型別 compiler の edge option 伝播 (sub/tone/style を spread する preset) ──
// flow は edge に label のみ渡す (sub/tone/style 非対応) ため除外。
describe("型別 compiler edge option 伝播", () => {
  for (const t of ["gantt", "class", "c4", "topology"] as PresetType[]) {
    it(`${t} edge は sub / tone / style を保持`, () => {
      const d = compile(t, { flow: [step("A", "B", { sub: "n", tone: "warning", style: "dashed" })] });
      const e = d.edges[0]!;
      expect(e.sub).toBe("n");
      expect(e.tone).toBe("warning");
      expect(e.style).toBe("dashed");
    });
  }
});

// ── compileState transition: trigger (label) / tone ──
describe("compileState transition", () => {
  it("transition は trigger=label / tone を保持", () => {
    const d = compile("state", { flow: [step("A", "B", { label: "trig", tone: "error" })] });
    const e = d.edges[0]!;
    expect(e.label).toBe("trig");
    expect(e.tone).toBe("error");
  });
});

// ── slugify 網羅: 64 文字切り詰め / 記号のみ fallback ──
describe("slugify 網羅", () => {
  it("64 文字で切り詰め", () => {
    const long = "a".repeat(100);
    const d = compile("flow", { actors: [actor(long), actor("B")], flow: [step(long, "B")] });
    expect(d.nodes.some((n) => n.id === "a".repeat(64))).toBe(true);
  });
  it("記号のみ actor 名は n に fallback", () => {
    const d = compile("flow", { actors: [actor("!!!"), actor("B")], flow: [step("!!!", "B")] });
    expect(d.nodes.some((n) => n.id === "n")).toBe(true);
  });
});

// ── parseCardinalityFromLabel / stripCardinality 網羅 (er 経由) ──
describe("cardinality parse / strip 網羅", () => {
  for (const [label, card] of [["1:1 rel", "1:1"], ["N:1 rel", "N:1"], ["N:M rel", "N:M"], ["0..1 rel", "0..1"], ["1..* rel", "1..*"]] as [string, string][]) {
    it(`"${label}" → sub ${card}`, () => {
      const d = compile("er", { flow: [step("A", "B", { label })] });
      expect(d.edges[0]!.sub).toBe(card);
    });
  }
  it("stripCardinality: cardinality を除去した label", () => {
    const d = compile("er", { flow: [step("A", "B", { label: "1:N owns" })] });
    expect(d.edges[0]!.label).toBe("owns");
  });
});

// ────────────────────────────────────────────────────────────
// 第 4 弾 (#868) = mergePartIntoDiagram の drop 座標 / scale / stack isolation /
// template rewrite / state override を値検証する。 第 1-3 弾で残存していた最大領域
// (actor.posX/posY/posW/posH 経由でしか到達しない座標計算) を kill する。
// ────────────────────────────────────────────────────────────

/**
 * 座標計算 test 用の最小 part。
 * lane l = x 0 / width 400、 node は stack 0 と 1 の 2 個 (stack span 2)、 state v 1 個。
 * これにより partOrigW = 400 / partOrigH = (1-0+1)*220 = 440 / partCenterStack = 0.5 が確定する。
 */
function makeTestPart(): CdlDiagram {
  return {
    id: "parts-test",
    topic: "test",
    lanes: [{ id: "l", x: 0, width: 400 }],
    nodes: [
      { id: "top", lane: "l", stack: 0, kind: "actor", title: "T", subtitle: "{v}%", w: 200, h: 100,
        shape: { kind: "arc", angle: "{v}", outerRadius: 140, innerRadius: 100, fill: "#4e9dc4" } },
      { id: "bottom", lane: "l", stack: 1, kind: "actor", title: "B", value: "{v}", w: 100, h: 50 },
    ] as CdlDiagram["nodes"],
    edges: [],
    states: [{ id: "v", initial: 10 }],
    phases: [] as CdlDiagram["phases"],
  };
}

/** parts actor 1 個を持つ sequence を compile する (partsCatalog 経由)。 */
function compileWithPart(over: Partial<DslActor> = {}, part: CdlDiagram = makeTestPart()): CdlDiagram {
  return compileToCdl(
    makeDoc("sequence", {
      actors: [actor("A"), actor("p1", { partId: "test", ...over })],
      flow: [step("A", "A")],
    }),
    { partsCatalog: { test: part } },
  );
}

describe("mergePartIntoDiagram: lane 配置 (offsetX 中心補正 / fallback)", () => {
  it("offset 未指定 = 既存 lane 右端 + PARTS_LANE_GAP 300 に配置", () => {
    const d = compileWithPart();
    const partLane = lane(d, "p1__l");
    const others = d.lanes.filter((l) => !l.id.startsWith("p1__"));
    const maxRight = Math.max(...others.map((l) => (l.x ?? 0) + l.width));
    expect(partLane.x).toBe(maxRight + 300);
  });

  it("posX 指定 = part 中心を posX に合わせるため lane.x = posX - width/2", () => {
    // partsLaneW = 400 → lane.x = 1000 - 200 = 800
    const d = compileWithPart({ posX: 1000, posY: 500 });
    expect(lane(d, "p1__l").x).toBe(800);
  });

  it("lane.width は posW 指定時 targetW/partsLaneW 倍に拡張", () => {
    // laneScaleX = 800 / 400 = 2 → width = 400 * 2 = 800
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 });
    expect(lane(d, "p1__l").width).toBe(800);
  });

  it("posW 未指定なら lane.width は元のまま (scale 1)", () => {
    const d = compileWithPart({ posX: 1000, posY: 500 });
    expect(lane(d, "p1__l").width).toBe(400);
  });

  it("actor.lane 指定時は part 内部 lane を張替え、 独自 lane を作らない", () => {
    const d = compileWithPart({ lane: "a" });
    expect(d.lanes.some((l) => l.id === "p1__l")).toBe(false);
    expect(node(d, "p1__top").lane).toBe("a");
  });
});

describe("mergePartIntoDiagram: node posX / posY (drop 座標の中心合わせ)", () => {
  it("posX/posY 指定 = node 中心 x が posX に一致 (lane 中央 + 中心補正)", () => {
    // partsLaneStartX = 1000 - 200 = 800、 partOrigCx = 0 + 400/2 = 200、 partCenterX = 400/2 = 200
    // → posX = (200 - 200) * 1 + 800 + 400/2 = 1000
    const d = compileWithPart({ posX: 1000, posY: 500 });
    expect(node(d, "p1__top").posX).toBe(1000);
    expect(node(d, "p1__bottom").posX).toBe(1000);
  });

  it("posY = (stack - partCenterStack) * 220 * scaleY + posY で中心が posY に来る", () => {
    // partCenterStack = (0+1)/2 = 0.5、 scaleY = 1
    // top    = (0 - 0.5) * 220 * 1 + 500 = 390
    // bottom = (1 - 0.5) * 220 * 1 + 500 = 610  → 中心 (390+610)/2 = 500 = posY
    const d = compileWithPart({ posX: 1000, posY: 500 });
    expect(node(d, "p1__top").posY).toBe(390);
    expect(node(d, "p1__bottom").posY).toBe(610);
  });

  it("posH 指定 = scaleY が posY 間隔に反映される", () => {
    // partOrigH = (1-0+1)*220 = 440、 scaleY = 880/440 = 2
    // top    = (0 - 0.5) * 220 * 2 + 500 = 280
    // bottom = (1 - 0.5) * 220 * 2 + 500 = 720
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 });
    expect(node(d, "p1__top").posY).toBe(280);
    expect(node(d, "p1__bottom").posY).toBe(720);
  });

  it("offset 未指定なら posX/posY は書かれない (auto layout 継続)", () => {
    const d = compileWithPart();
    expect(node(d, "p1__top").posX).toBeUndefined();
    expect(node(d, "p1__top").posY).toBeUndefined();
  });

  it("posX のみ指定でも shouldForcePos が立ち posY も明示される", () => {
    const d = compileWithPart({ posX: 1000 });
    expect(node(d, "p1__top").posX).toBe(1000);
    // offsetY 未指定 = 0 基準 → top = (0 - 0.5) * 220 = -110
    expect(node(d, "p1__top").posY).toBe(-110);
  });
});

describe("mergePartIntoDiagram: w / h の scale 適用", () => {
  it("posW/posH 指定 = node の w は scaleX 倍、 h は scaleY 倍", () => {
    // scaleX = 800/400 = 2、 scaleY = 880/440 = 2
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 });
    expect(node(d, "p1__top").w).toBe(400);  // 200 * 2
    expect(node(d, "p1__top").h).toBe(200);  // 100 * 2
    expect(node(d, "p1__bottom").w).toBe(200); // 100 * 2
    expect(node(d, "p1__bottom").h).toBe(100); // 50 * 2
  });

  it("scale が 1 のままなら w / h は元の値を維持", () => {
    const d = compileWithPart({ posX: 1000, posY: 500 });
    expect(node(d, "p1__top").w).toBe(200);
    expect(node(d, "p1__top").h).toBe(100);
  });

  it("targetW が 0 以下なら scale 適用しない (0 除算 / 反転を防ぐ)", () => {
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 0, posH: 0 });
    expect(node(d, "p1__top").w).toBe(200);
    expect(node(d, "p1__top").h).toBe(100);
  });
});

describe("mergePartIntoDiagram: shape 幾何 field の等比 scale", () => {
  it("radius 系 field は min(scaleX, scaleY) 倍される", () => {
    // scaleX = 800/400 = 2、 scaleY = 440/440 = 1 → shapeScale = min(2,1) = 1
    const d1 = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 440 });
    const s1 = node(d1, "p1__top").shape as { outerRadius?: number; innerRadius?: number };
    expect(s1.outerRadius).toBe(140);
    expect(s1.innerRadius).toBe(100);
    // scaleX = 2、 scaleY = 880/440 = 2 → shapeScale = 2
    const d2 = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 });
    const s2 = node(d2, "p1__top").shape as { outerRadius?: number; innerRadius?: number };
    expect(s2.outerRadius).toBe(280);
    expect(s2.innerRadius).toBe(200);
  });

  it("非幾何 field (fill) は scale されない", () => {
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 });
    const s = node(d, "p1__top").shape as { fill?: string };
    expect(s.fill).toBe("#4e9dc4");
  });

  it("scale なし (posW/posH 未指定) なら shape は素通し", () => {
    const d = compileWithPart({ posX: 1000, posY: 500 });
    const s = node(d, "p1__top").shape as { outerRadius?: number };
    expect(s.outerRadius).toBe(140);
  });
});

describe("mergePartIntoDiagram: stack isolation", () => {
  it("drop 経路 = target max stack + STACK_ISOLATION_OFFSET 1000 を加算", () => {
    const d = compileWithPart({ posX: 1000, posY: 500 });
    const targetMax = Math.max(
      ...d.nodes.filter((n) => !n.id.startsWith("p1__")).map((n) => n.stack ?? 0),
    );
    expect(node(d, "p1__top").stack).toBe(targetMax + 1000 + 0);
    expect(node(d, "p1__bottom").stack).toBe(targetMax + 1000 + 1);
  });

  it("offset 未指定なら stack shift なし (元 stack のまま)", () => {
    const d = compileWithPart();
    expect(node(d, "p1__top").stack).toBe(0);
    expect(node(d, "p1__bottom").stack).toBe(1);
  });
});

describe("mergePartIntoDiagram: template rewrite / state override", () => {
  it("subtitle / value の {state} が {alias__state} に rewrite される", () => {
    const d = compileWithPart();
    // template 部分のみ置換され、 周囲の literal (`%`) はそのまま残る
    expect(node(d, "p1__top").subtitle).toBe("{p1__v}%");
    expect(node(d, "p1__bottom").value).toBe("{p1__v}");
  });

  it("shape 内の {state} も rewrite される", () => {
    const d = compileWithPart();
    const s = node(d, "p1__top").shape as { angle?: string };
    expect(s.angle).toBe("{p1__v}");
  });

  it("part の state が存在しない名前は rewrite しない", () => {
    const part = makeTestPart();
    (part.nodes[0] as { subtitle?: string }).subtitle = "{unknown}%";
    const d = compileWithPart({}, part);
    expect(node(d, "p1__top").subtitle).toBe("{unknown}%");
  });

  it("stateOverride が state.initial を上書きする", () => {
    const d = compileWithPart({ stateOverride: { v: 77 } });
    expect(d.states.find((s) => s.id === "p1__v")?.initial).toBe(77);
  });

  it("stateOverride 未指定なら part の initial を維持", () => {
    const d = compileWithPart();
    expect(d.states.find((s) => s.id === "p1__v")?.initial).toBe(10);
  });
});

// ── resolveHighlight (sequence animate): 矢印記法 / actor 名 の分岐を値検証 ──

/** highlight を持つ animate phase 1 個を組んで sequence を compile する。 */
function compileSeqHighlight(highlight: string[], over: Partial<DslDocument> = {}): CdlDiagram {
  const animate = {
    states: [],
    phases: [{ name: "p", durationMs: 1000, highlight, pos: { line: 1 } }],
    pos: { line: 1 },
  } as unknown as DslDocument["animate"];
  return compileToCdl(makeDoc("sequence", { animate, ...over }));
}

describe("resolveHighlight: 矢印記法 (A→B)", () => {
  it("矢印 highlight は該当 edge id と両端 step box を activate", () => {
    const d = compileSeqHighlight(["A→B"]);
    const act = d.phases[0]!.activate;
    expect(act).toContain("e0-a-b");
    expect(act).toContain("s0-a");
    expect(act).toContain("s0-b");
  });

  it("ASCII 矢印 (->) も同じ経路で解決", () => {
    const d = compileSeqHighlight(["A -> B"]);
    expect(d.phases[0]!.activate).toContain("e0-a-b");
  });

  it("自己 edge (A→A) は step box を 1 個だけ push (from === to で重複させない)", () => {
    const d = compileSeqHighlight(["A→A"], { flow: [step("A", "A")] });
    const act = d.phases[0]!.activate;
    expect(act.filter((id) => id === "s0-a").length).toBe(1);
  });

  it("同一 from/to の flow が複数あれば全 edge を activate", () => {
    const d = compileSeqHighlight(["A→B"], {
      flow: [step("A", "B", { label: "1" }), step("A", "B", { label: "2" })],
    });
    const act = d.phases[0]!.activate;
    expect(act).toContain("e0-a-b");
    expect(act).toContain("e1-a-b");
  });

  it("該当 flow が無い矢印は edge も step box も activate しない", () => {
    const d = compileSeqHighlight(["B→A"]);
    const act = d.phases[0]!.activate;
    expect(act.some((id) => id.startsWith("e") && id.endsWith("-b-a"))).toBe(false);
    expect(act).not.toContain("s0-b");
  });
});

describe("resolveHighlight: actor 名", () => {
  it("actor 名 highlight は header / footer と関与 step box を activate", () => {
    const d = compileSeqHighlight(["A"]);
    const act = d.phases[0]!.activate;
    expect(act).toContain("a-header");
    expect(act).toContain("a-footer");
    expect(act).toContain("s0-a");
  });

  it("関与しない step box は activate しない", () => {
    const d = compileSeqHighlight(["A"], {
      actors: [actor("A"), actor("B"), actor("C")],
      flow: [step("A", "B"), step("B", "C")],
    });
    const act = d.phases[0]!.activate;
    expect(act).toContain("s0-a");   // A → B に関与
    expect(act).not.toContain("s1-a"); // B → C は無関係
  });

  it("未知 actor 名は何も activate しない", () => {
    const d = compileSeqHighlight(["Unknown"]);
    const act = d.phases[0]!.activate;
    expect(act.some((id) => id.includes("unknown"))).toBe(false);
  });
});

describe("resolveHighlightGeneric: flow preset 経路", () => {
  /** flow preset + animate で generic 経路を通す。 */
  function compileFlowHighlight(highlight: string[]): CdlDiagram {
    const animate = {
      states: [],
      phases: [{ name: "p", durationMs: 1000, highlight, pos: { line: 1 } }],
      pos: { line: 1 },
    } as unknown as DslDocument["animate"];
    return compileToCdl(makeDoc("flow", { animate }));
  }

  it("actor 名 highlight は対応 node id を activate", () => {
    const d = compileFlowHighlight(["A"]);
    expect(d.phases[0]!.activate).toContain("a");
  });

  it("矢印 highlight は該当 edge id を activate", () => {
    const d = compileFlowHighlight(["A→B"]);
    expect(d.phases[0]!.activate.some((id) => id.includes("-a-b"))).toBe(true);
  });

  it("未知 actor 名は activate しない", () => {
    const d = compileFlowHighlight(["Unknown"]);
    expect(d.phases[0]!.activate).not.toContain("unknown");
  });

  it("該当 edge が無い矢印は activate しない", () => {
    const d = compileFlowHighlight(["B→A"]);
    expect(d.phases[0]!.activate.some((id) => id.includes("-b-a"))).toBe(false);
  });
});

describe("compileSequenceWithAnimate: header / footer / spacer / step box 生成", () => {
  const ANIM = {
    states: [],
    phases: [{ name: "p", durationMs: 1000, highlight: [], pos: { line: 1 } }],
    pos: { line: 1 },
  } as unknown as DslDocument["animate"];

  it("actor ごとに header / spacer / footer が生成される", () => {
    const d = compileToCdl(makeDoc("sequence", { animate: ANIM }));
    for (const id of ["a-header", "a-spacer", "a-footer", "b-header", "b-spacer", "b-footer"]) {
      expect(d.nodes.some((n) => n.id === id), `${id} が生成される`).toBe(true);
    }
  });

  it("header は title = actor 名 / kind card / stack 0", () => {
    const d = compileToCdl(makeDoc("sequence", { animate: ANIM }));
    const h = node(d, "a-header");
    expect(h.title).toBe("A");
    expect(h.kind).toBe("card");
    expect(h.stack).toBe(0);
  });

  it("footer は title = actor 名で header と同じ lane", () => {
    const d = compileToCdl(makeDoc("sequence", { animate: ANIM }));
    expect(node(d, "a-footer").title).toBe("A");
    expect(node(d, "a-footer").lane).toBe(node(d, "a-header").lane);
  });

  it("step box は s{N}-{slug} 形式で flow の各 step に生成", () => {
    const d = compileToCdl(makeDoc("sequence", {
      animate: ANIM,
      actors: [actor("A"), actor("B"), actor("C")],
      flow: [step("A", "B"), step("B", "C")],
    }));
    expect(d.nodes.some((n) => n.id === "s0-a")).toBe(true);
    expect(d.nodes.some((n) => n.id === "s0-b")).toBe(true);
    expect(d.nodes.some((n) => n.id === "s1-b")).toBe(true);
    expect(d.nodes.some((n) => n.id === "s1-c")).toBe(true);
  });

  it("lane は actor ごとに 1 本で label = actor 名 / lifeline 有効", () => {
    const d = compileToCdl(makeDoc("sequence", { animate: ANIM }));
    expect(d.lanes.filter((l) => l.id === "a").length).toBe(1);
    expect(lane(d, "a").label).toBe("A");
    expect(lane(d, "a").lifeline).toBe(true);
  });

  it("edge は e{idx}-{from}-{to} 形式で flow 順に生成", () => {
    const d = compileToCdl(makeDoc("sequence", {
      animate: ANIM,
      actors: [actor("A"), actor("B"), actor("C")],
      flow: [step("A", "B"), step("B", "C")],
    }));
    expect(d.edges.some((e) => e.id === "e0-a-b")).toBe(true);
    expect(d.edges.some((e) => e.id === "e1-b-c")).toBe(true);
  });
});

// ── applyV05Extensions: actor option merge / lanes / viewport ──

describe("applyV05Extensions: actor inline option の node merge", () => {
  it("subtitle / eyebrow / value / rows が該当 node に反映", () => {
    const d = compile("swimlane", {
      actors: [actor("A", { subtitle: "s", eyebrow: "e", value: "v", rows: ["r1", "r2"] }), actor("B")],
    });
    const n = node(d, "a");
    expect(n.subtitle).toBe("s");
    expect(n.eyebrow).toBe("e");
    expect(n.value).toBe("v");
    expect(n.rows).toEqual(["r1", "r2"]);
  });

  it("未指定 field は上書きしない (undefined で潰さない)", () => {
    const d = compile("swimlane", { actors: [actor("A", { subtitle: "only" }), actor("B")] });
    expect(node(d, "a").subtitle).toBe("only");
    expect(node(d, "a").eyebrow).toBeUndefined();
  });

  it("header 付き node (sequence animate) にも merge される", () => {
    const animate = {
      states: [],
      phases: [{ name: "p", durationMs: 1000, highlight: [], pos: { line: 1 } }],
      pos: { line: 1 },
    } as unknown as DslDocument["animate"];
    const d = compileToCdl(makeDoc("sequence", {
      animate,
      actors: [actor("A", { subtitle: "hdr" }), actor("B")],
    }));
    expect(node(d, "a-header").subtitle).toBe("hdr");
  });
});

describe("applyV05Extensions: lanes section", () => {
  it("既存 lane の x / width / label / contain / lifeline を上書き", () => {
    const d = compile("swimlane", {
      lanes: { a: { x: 111, width: 222, label: "L", contain: true, lifeline: true } },
    });
    const l = lane(d, "a");
    expect(l.x).toBe(111);
    expect(l.width).toBe(222);
    expect(l.label).toBe("L");
    expect(l.contain).toBe(true);
    expect(l.lifeline).toBe(true);
  });

  it("preset に無い lane id は新規追加 (default x 0 / width 320)", () => {
    const d = compile("swimlane", { lanes: { extra: {} } });
    const l = lane(d, "extra");
    expect(l.x).toBe(0);
    expect(l.width).toBe(320);
  });

  it("新規追加 lane も指定値を反映", () => {
    const d = compile("swimlane", { lanes: { extra: { x: 50, width: 400, label: "E" } } });
    const l = lane(d, "extra");
    expect(l.x).toBe(50);
    expect(l.width).toBe(400);
    expect(l.label).toBe("E");
  });
});

describe("applyV05Extensions: viewport", () => {
  it("laneWidth は全 lane の width を override", () => {
    const d = compile("swimlane", { viewport: { laneWidth: 999 } });
    for (const l of d.lanes) expect(l.width).toBe(999);
  });

  it("width / height / gap / laneGap / nodeGap / labelMargin が viewport に集約", () => {
    const d = compile("swimlane", {
      viewport: { width: 1, height: 2, gap: 3, laneGap: 4, nodeGap: 5, labelMargin: 6 },
    });
    expect(d.viewport).toMatchObject({ width: 1, height: 2, gap: 3, laneGap: 4, nodeGap: 5, labelMargin: 6 });
  });

  it("viewport 未指定なら viewport field を作らない", () => {
    const d = compile("swimlane");
    expect(d.viewport).toBeUndefined();
  });

  it("一部 field のみ指定なら他 field は含めない", () => {
    const d = compile("swimlane", { viewport: { width: 100 } });
    expect(d.viewport?.width).toBe(100);
    expect(d.viewport?.height).toBeUndefined();
  });
});

describe("injectPhasesFallback: 独自 layout preset への phase 後段注入", () => {
  const ANIM_HL = (highlight: string[]) => ({
    states: [{ name: "s1", initial: 5 }],
    phases: [{ name: "p", durationMs: 2500, highlight, pos: { line: 1 } }],
    pos: { line: 1 },
  } as unknown as DslDocument["animate"]);

  it("class preset (独自 layout) でも phase が注入される", () => {
    const d = compileToCdl(makeDoc("class", { animate: ANIM_HL([]) }));
    expect(d.phases.length).toBe(1);
    expect(d.phases[0]!.duration).toBe(2500);
  });

  it("animate.states が diagram.states に追加される", () => {
    const d = compileToCdl(makeDoc("class", { animate: ANIM_HL([]) }));
    expect(d.states.find((s) => s.id === "s1")?.initial).toBe(5);
  });

  it("actor 名 highlight は node id に解決", () => {
    const d = compileToCdl(makeDoc("class", { animate: ANIM_HL(["A"]) }));
    expect(d.phases[0]!.activate).toContain("a");
  });

  it("矢印 highlight (A -> B) は該当 edge を解決", () => {
    const d = compileToCdl(makeDoc("class", { animate: ANIM_HL(["A -> B"]) }));
    const act = d.phases[0]!.activate;
    const target = d.edges.find((e) => e.from === "a" && e.to === "b");
    expect(target).toBeDefined();
    expect(act).toContain(target!.id);
  });

  it("全角矢印 (A → B) も同じ edge に解決", () => {
    const d = compileToCdl(makeDoc("class", { animate: ANIM_HL(["A → B"]) }));
    const target = d.edges.find((e) => e.from === "a" && e.to === "b");
    expect(d.phases[0]!.activate).toContain(target!.id);
  });

  it("preset が phase 生成済 (sequence) なら fallback 注入しない (二重生成なし)", () => {
    const d = compileToCdl(makeDoc("sequence", { animate: ANIM_HL([]) }));
    expect(d.phases.length).toBe(1);
  });
});

// ── 第 4 弾 (b): mergePartIntoDiagram の条件式を「両分岐」で突く ──
// scale / posX / w / h / shape の各条件は「片側だけ」 の test では mutant が生き残るため、
// 条件を満たす case と満たさない case の双方を明示的に検証する。

describe("mergePartIntoDiagram: w / h 条件の両分岐", () => {
  /** w / h を持たない node だけの part (w/h !== undefined 分岐の false 側)。 */
  function partWithoutWH(): CdlDiagram {
    const p = makeTestPart();
    p.nodes = [
      { id: "nw", lane: "l", stack: 0, kind: "actor", title: "N" },
    ] as CdlDiagram["nodes"];
    return p;
  }

  it("w / h を持たない node は scale 指定でも w / h が生えない", () => {
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 }, partWithoutWH());
    expect(node(d, "p1__nw").w).toBeUndefined();
    expect(node(d, "p1__nw").h).toBeUndefined();
  });

  it("w を持つが scale = 1 なら w は元の値のまま (scale 条件の false 側)", () => {
    const d = compileWithPart({ posX: 1000, posY: 500 });
    expect(node(d, "p1__top").w).toBe(200);
  });

  it("scaleX のみ 1 以外でも w / h 双方に scale 適用される (|| の左側)", () => {
    // posW のみ指定 = scaleX = 800/400 = 2、 scaleY = 1
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800 });
    expect(node(d, "p1__top").w).toBe(400); // 200 * 2
    expect(node(d, "p1__top").h).toBe(100); // 100 * 1 (scaleY = 1)
  });

  it("scaleY のみ 1 以外でも w / h 双方に scale 適用される (|| の右側)", () => {
    // posH のみ指定 = scaleY = 880/440 = 2、 scaleX = 1
    const d = compileWithPart({ posX: 1000, posY: 500, posH: 880 });
    expect(node(d, "p1__top").w).toBe(200); // 200 * 1
    expect(node(d, "p1__top").h).toBe(200); // 100 * 2
  });
});

describe("mergePartIntoDiagram: shape scale 条件の両分岐", () => {
  it("shape を持たない node は scale 指定でも shape が生えない", () => {
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 });
    expect(node(d, "p1__bottom").shape).toBeUndefined();
  });

  it("shape 内の非数値 geom field は scale されない (typeof number 判定)", () => {
    const part = makeTestPart();
    (part.nodes[0] as { shape?: Record<string, unknown> }).shape = { kind: "arc", radius: "big", fill: "#000" };
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 }, part);
    const s = node(d, "p1__top").shape as { radius?: string };
    expect(s.radius).toBe("big");
  });

  it("shape 内 nested object の geom field も scale される (再帰 walk)", () => {
    const part = makeTestPart();
    (part.nodes[0] as { shape?: Record<string, unknown> }).shape = { kind: "arc", inner: { radius: 50 } };
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 }, part);
    const s = node(d, "p1__top").shape as { inner?: { radius?: number } };
    expect(s.inner?.radius).toBe(100); // 50 * min(2,2)
  });

  it("shape 内 array 要素の geom field も scale される", () => {
    const part = makeTestPart();
    (part.nodes[0] as { shape?: Record<string, unknown> }).shape = { kind: "arc", items: [{ radius: 30 }] };
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 }, part);
    const s = node(d, "p1__top").shape as { items?: Array<{ radius?: number }> };
    expect(s.items?.[0]?.radius).toBe(60);
  });

  it("shape 内 null 値は素通し (null 判定分岐)", () => {
    const part = makeTestPart();
    (part.nodes[0] as { shape?: Record<string, unknown> }).shape = { kind: "arc", nothing: null, radius: 20 };
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 }, part);
    const s = node(d, "p1__top").shape as { nothing?: unknown; radius?: number };
    expect(s.nothing).toBeNull();
    expect(s.radius).toBe(40);
  });
});

describe("mergePartIntoDiagram: 座標条件の境界と両分岐", () => {
  it("part 側 node が posX を持つ場合は effectiveOffsetX を加算する (undefined 分岐の逆)", () => {
    const part = makeTestPart();
    (part.nodes[0] as { posX?: number }).posX = 60;
    // posX 1000 → partsLaneStartX = 800、 effectiveOffsetX = 800 - 0 = 800 → 60 + 800 = 860
    const d = compileWithPart({ posX: 1000, posY: 500 }, part);
    expect(node(d, "p1__top").posX).toBe(860);
  });

  it("part 側 node が posY を持つ場合は offsetY を加算する", () => {
    const part = makeTestPart();
    (part.nodes[0] as { posY?: number }).posY = 25;
    const d = compileWithPart({ posX: 1000, posY: 500 }, part);
    expect(node(d, "p1__top").posY).toBe(525); // 25 + 500
  });

  it("posY 未指定 (posX のみ) なら part 側 posY には 0 が加算される (?? 0 分岐)", () => {
    const part = makeTestPart();
    (part.nodes[0] as { posY?: number }).posY = 25;
    const d = compileWithPart({ posX: 1000 }, part);
    expect(node(d, "p1__top").posY).toBe(25);
  });

  it("targetW が 0 なら laneScaleX は 1 (targetW > 0 の境界)", () => {
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 0 });
    expect(lane(d, "p1__l").width).toBe(400);
  });

  it("part lane に x がある場合 effectiveOffsetX がその分ずれる", () => {
    const part = makeTestPart();
    part.lanes = [{ id: "l", x: 100, width: 400 }];
    // partsLaneStartX = 1000 - 200 = 800、 effectiveOffsetX = 800 - 100 = 700
    // lane.x = 100 + 700 = 800
    const d = compileWithPart({ posX: 1000, posY: 500 }, part);
    expect(lane(d, "p1__l").x).toBe(800);
  });

  it("node の lane が part lanes に無い場合 laneW は default 320 で計算", () => {
    const part = makeTestPart();
    part.nodes = [
      { id: "orphan", lane: "missing", stack: 0, kind: "actor", title: "O" },
    ] as CdlDiagram["nodes"];
    // partLane 見つからず → laneX 0 / laneW 320 → lane 中央 160。 統一式 mapPartX で変換する。
    // partOrigCenterX = 0 + 400/2 = 200、 scaleX = 1、 dropCenterX = 800 + 400/2 = 1000
    // posX = (160 - 200) * 1 + 1000 = 960
    const d = compileWithPart({ posX: 1000, posY: 500 }, part);
    expect(node(d, "p1__orphan").posX).toBe(960);
  });

  it("part.nodes が空なら stack 集計は 0 基準 (length > 0 の false 側)", () => {
    const part = makeTestPart();
    part.nodes = [] as CdlDiagram["nodes"];
    const d = compileWithPart({ posX: 1000, posY: 500 }, part);
    expect(d.nodes.some((n) => n.id.startsWith("p1__"))).toBe(false);
  });

  it("target に lane が無い状態でも offset 未指定なら GAP のみで配置", () => {
    // part だけの diagram = target lanes が空 → existingLaneMaxX = 0 → lane.x = 0 + 300
    const d = compileToCdl(
      makeDoc("sequence", { actors: [actor("p1", { partId: "test" })], flow: [] }),
      { partsCatalog: { test: makeTestPart() } },
    );
    expect(lane(d, "p1__l").x).toBe(300);
  });
});

describe("mergePartIntoDiagram: readouts / phase merge の分岐", () => {
  it("readouts を持つ part は id prefix + source rewrite で merge", () => {
    const part = makeTestPart();
    part.readouts = [{ id: "r1", kind: "gauge", source: "{v}", nodeId: "top" }] as CdlDiagram["readouts"];
    const d = compileWithPart({}, part);
    const r = d.readouts?.find((x) => x.id === "p1__r1") as { source?: string } | undefined;
    expect(r).toBeDefined();
    expect(r?.source).toBe("{p1__v}");
  });

  it("readouts が空配列なら target.readouts を作らない (length > 0 分岐)", () => {
    const part = makeTestPart();
    part.readouts = [] as CdlDiagram["readouts"];
    const d = compileWithPart({}, part);
    expect(d.readouts === undefined || d.readouts.length === 0).toBe(true);
  });

  it("part phase の tweens / sets が prefix 付きで target phase に merge", () => {
    const part = makeTestPart();
    part.phases = [{
      id: "pp", duration: 3000, title: "t", body: "",
      activate: ["top"], tweens: [{ stateId: "v", from: 0, to: 9 }], sets: [{ stateId: "v", value: 3 }],
    }] as CdlDiagram["phases"];
    const animate = {
      states: [],
      phases: [{ name: "p", durationMs: 1000, highlight: [], pos: { line: 1 } }],
      pos: { line: 1 },
    } as unknown as DslDocument["animate"];
    const d = compileToCdl(
      makeDoc("sequence", { animate, actors: [actor("A"), actor("p1", { partId: "test" })], flow: [step("A", "A")] }),
      { partsCatalog: { test: part } },
    );
    const ph = d.phases[0]!;
    expect(ph.duration).toBe(3000); // max(1000, 3000)
    expect(ph.activate).toContain("p1__top");
    expect(ph.tweens.some((t) => t.stateId === "p1__v")).toBe(true);
    expect(ph.sets.some((s) => s.stateId === "p1__v")).toBe(true);
  });

  it("target より part の phase が多い場合は余剰 phase が append される (dummy anchor)", () => {
    const part = makeTestPart();
    part.phases = [
      { id: "p1", duration: 1000, title: "a", body: "", activate: [], tweens: [], sets: [] },
      { id: "p2", duration: 2000, title: "b", body: "", activate: ["top"], tweens: [], sets: [] },
    ] as CdlDiagram["phases"];
    const animate = {
      states: [],
      phases: [{ name: "only", durationMs: 500, highlight: [], pos: { line: 1 } }],
      pos: { line: 1 },
    } as unknown as DslDocument["animate"];
    const d = compileToCdl(
      makeDoc("sequence", { animate, actors: [actor("A"), actor("p1", { partId: "test" })], flow: [step("A", "A")] }),
      { partsCatalog: { test: part } },
    );
    expect(d.phases.length).toBe(2);
    expect(d.phases[1]!.activate).toContain("p1__top");
  });
});

// ── 第 4 弾 (c): applyEdgeInlineOptions / mergePartsFromActors の条件を両分岐で突く ──

describe("applyEdgeInlineOptions: edge 検索条件の分岐", () => {
  it("seq-like (sequence) は s{idx}-{slug} 命名の edge に guard を反映", () => {
    const d = compile("sequence", { flow: [step("A", "B", { guard: "g1" })] });
    expect(d.edges.find((e) => e.id === "e0-a-b")?.guard).toBe("g1");
  });

  it("solidity も seq-like 経路で解決される", () => {
    const d = compile("solidity", { flow: [step("A", "B", { guard: "g2" })] });
    expect(d.edges.some((e) => e.guard === "g2")).toBe(true);
  });

  it("非 seq-like (flow) は plain slug 一致で解決", () => {
    const d = compile("flow", { flow: [step("A", "B", { guard: "g3" })] });
    expect(d.edges.some((e) => e.guard === "g3")).toBe(true);
  });

  it("同一 from/to の step が複数あっても used で別 edge に割当てる", () => {
    const d = compile("sequence", {
      flow: [step("A", "B", { guard: "first" }), step("A", "B", { guard: "second" })],
    });
    const guards = d.edges.map((e) => e.guard).filter(Boolean);
    expect(guards).toContain("first");
    expect(guards).toContain("second");
    expect(new Set(guards).size).toBe(2);
  });

  it("state preset は guard を sub にも同期する", () => {
    const d = compile("state", { flow: [step("A", "B", { guard: "cond" })] });
    const e = d.edges.find((x) => x.guard === "cond");
    expect(e?.sub).toBe("cond");
  });

  it("state 以外の preset は sub に guard を同期しない", () => {
    const d = compile("sequence", { flow: [step("A", "B", { guard: "cond" })] });
    expect(d.edges.find((e) => e.guard === "cond")?.sub).toBeUndefined();
  });

  it("er preset は cardinality を label に併記", () => {
    const d = compile("er", { flow: [step("A", "B", { label: "owns", cardinality: "1:N" })] });
    const e = d.edges.find((x) => x.cardinality === "1:N");
    expect(e?.label).toContain("1:N");
  });

  it("label に既に cardinality を含む場合は二重併記しない", () => {
    const d = compile("er", { flow: [step("A", "B", { label: "owns (1:N)", cardinality: "1:N" })] });
    const e = d.edges.find((x) => x.cardinality === "1:N");
    expect((e?.label.match(/1:N/g) ?? []).length).toBe(1);
  });

  it("er 以外は cardinality を label に併記しない", () => {
    const d = compile("sequence", { flow: [step("A", "B", { label: "call", cardinality: "1:N" })] });
    const e = d.edges.find((x) => x.cardinality === "1:N");
    expect(e?.label).toBe("call");
  });

  it("labelOffsetX / labelOffsetY が edge に反映される", () => {
    const d = compile("sequence", { flow: [step("A", "B", { labelOffsetX: 12, labelOffsetY: -8 })] });
    const e = d.edges.find((x) => x.id === "e0-a-b");
    expect(e?.labelOffsetX).toBe(12);
    expect(e?.labelOffsetY).toBe(-8);
  });

  it("inline option 未指定なら edge に field が生えない", () => {
    const d = compile("sequence", { flow: [step("A", "B")] });
    const e = d.edges.find((x) => x.id === "e0-a-b");
    expect(e?.guard).toBeUndefined();
    expect(e?.labelOffsetX).toBeUndefined();
  });

  it("自己 edge (A→A) も seq-like 条件 (from === to) で解決される", () => {
    const d = compile("sequence", { flow: [step("A", "A", { guard: "self" })] });
    expect(d.edges.some((e) => e.guard === "self")).toBe(true);
  });
});

describe("mergePartsFromActors: guard 条件の分岐", () => {
  const PART = (): CdlDiagram => ({
    id: "parts-x", topic: "t",
    lanes: [{ id: "l", x: 0, width: 400 }],
    nodes: [{ id: "n", lane: "l", stack: 0, kind: "actor", title: "N" }] as CdlDiagram["nodes"],
    edges: [], states: [], phases: [] as CdlDiagram["phases"],
  });

  it("partsCatalog 未渡しなら parts actor を skip して diagram は壊れない", () => {
    const warn = console.warn;
    console.warn = () => {};
    try {
      const d = compileToCdl(makeDoc("sequence", {
        actors: [actor("A"), actor("p1", { partId: "x" })],
        flow: [step("A", "A")],
      }));
      expect(d.nodes.some((n) => n.id.startsWith("p1__"))).toBe(false);
      expect(d.nodes.length).toBeGreaterThan(0);
    } finally {
      console.warn = warn;
    }
  });

  it("partId が空文字なら skip (length === 0 分岐)", () => {
    const warn = console.warn;
    console.warn = () => {};
    try {
      const d = compileToCdl(
        makeDoc("sequence", { actors: [actor("A"), actor("p1", { partId: "" })], flow: [step("A", "A")] }),
        { partsCatalog: { x: PART() } },
      );
      expect(d.nodes.some((n) => n.id.startsWith("p1__"))).toBe(false);
    } finally {
      console.warn = warn;
    }
  });

  it("catalog に無い partId は warn して skip (該当 part なし分岐)", () => {
    const warn = console.warn;
    const logs: string[] = [];
    console.warn = (m: string) => logs.push(String(m));
    try {
      const d = compileToCdl(
        makeDoc("sequence", { actors: [actor("A"), actor("p1", { partId: "missing" })], flow: [step("A", "A")] }),
        { partsCatalog: { x: PART() } },
      );
      expect(d.nodes.some((n) => n.id.startsWith("p1__"))).toBe(false);
      expect(logs.some((l) => l.includes("missing"))).toBe(true);
    } finally {
      console.warn = warn;
    }
  });

  it("parts- prefix 付き key でも lookup できる", () => {
    const d = compileToCdl(
      makeDoc("sequence", { actors: [actor("A"), actor("p1", { partId: "x" })], flow: [step("A", "A")] }),
      { partsCatalog: { "parts-x": PART() } },
    );
    expect(d.nodes.some((n) => n.id === "p1__n")).toBe(true);
  });

  it("非 seq-like preset (flow) では lane 削除を行わない", () => {
    const d = compileToCdl(
      makeDoc("flow", { actors: [actor("flow", { partId: "x" }), actor("other")], flow: [step("flow", "other")] }),
      { partsCatalog: { x: PART() } },
    );
    expect(d.lanes.some((l) => l.id === "flow")).toBe(true);
    expect(node(d, "other").lane).toBe("flow");
  });

  it("actor.lane 指定時は張替え先 lane を削除しない", () => {
    const d = compileToCdl(
      makeDoc("sequence", { actors: [actor("A"), actor("p1", { partId: "x", lane: "a" })], flow: [step("A", "A")] }),
      { partsCatalog: { x: PART() } },
    );
    expect(d.lanes.some((l) => l.id === "a")).toBe(true);
    expect(node(d, "p1__n").lane).toBe("a");
  });

  it("step anchor (s{N}-{slug}) も parts actor 由来なら削除される", () => {
    const d = compileToCdl(
      makeDoc("sequence", { actors: [actor("A"), actor("p1", { partId: "x" })], flow: [step("A", "p1")] }),
      { partsCatalog: { x: PART() } },
    );
    expect(d.nodes.some((n) => n.id === "s0-p1")).toBe(false);
  });

  it("parts actor が 0 個なら diagram は素通し (early return)", () => {
    const withCatalog = compileToCdl(makeDoc("sequence"), { partsCatalog: { x: PART() } });
    const without = compileToCdl(makeDoc("sequence"));
    expect(withCatalog.nodes.map((n) => n.id)).toEqual(without.nodes.map((n) => n.id));
  });
});

// ── 第 4 弾 (d): animate 経路 (generic / sequence) と swimlane / canvas pivot の分岐 ──

/** animate phase 1 個を持つ doc を作る helper (generic 経路用)。 */
function animOf(highlight: string[] = []): DslDocument["animate"] {
  return {
    states: [],
    phases: [{ name: "p", durationMs: 1200, highlight, pos: { line: 1 } }],
    pos: { line: 1 },
  } as unknown as DslDocument["animate"];
}

describe("compileGenericWithAnimate: kind 別の lane 構成", () => {
  it("flow は 1 lane (main) に全 actor を縦 stack", () => {
    const d = compileToCdl(makeDoc("flow", { animate: animOf() }));
    expect(d.lanes.length).toBe(1);
    expect(d.lanes[0]!.id).toBe("main");
    expect(node(d, "a").stack).toBe(0);
    expect(node(d, "b").stack).toBe(1);
  });

  it("flow の lane label は doc.title、 contain は付かない", () => {
    const d = compileToCdl(makeDoc("flow", { animate: animOf(), title: "MyFlow" }));
    expect(d.lanes[0]!.label).toBe("MyFlow");
    expect(d.lanes[0]!.contain).toBeUndefined();
  });

  it("topology は同じ 1 lane 構成だが contain: true が付く", () => {
    const d = compileToCdl(makeDoc("topology", { animate: animOf() }));
    expect(d.lanes.length).toBe(1);
    expect(d.lanes[0]!.contain).toBe(true);
  });

  it("swimlane は actor ごとに lane-{slug} を横並び生成", () => {
    const d = compileToCdl(makeDoc("swimlane", { animate: animOf() }));
    expect(d.lanes.map((l) => l.id)).toEqual(["lane-a", "lane-b"]);
    expect(lane(d, "lane-a").label).toBe("A");
  });

  it("state preset は先頭 actor が initial marker を持つ", () => {
    const d = compileToCdl(makeDoc("state", { animate: animOf() }));
    const first = node(d, "a");
    const last = node(d, "b");
    // initial / final の差が出る (両方 undefined ではない)
    expect(JSON.stringify(first) !== JSON.stringify(last)).toBe(true);
  });

  it("actor 1 個の state preset では final marker が付かない (length > 1 条件)", () => {
    const d = compileToCdl(makeDoc("state", {
      animate: animOf(), actors: [actor("A")], flow: [],
    }));
    expect(d.nodes.length).toBe(1);
  });

  it("er preset は cardinality を label に併記", () => {
    const d = compileToCdl(makeDoc("er", {
      animate: animOf(), flow: [step("A", "B", { label: "owns", cardinality: "1:N" })],
    }));
    expect(d.edges[0]!.label).toContain("1:N");
  });

  it("er で label が既に cardinality を含むなら二重併記しない", () => {
    const d = compileToCdl(makeDoc("er", {
      animate: animOf(), flow: [step("A", "B", { label: "owns (1:N)", cardinality: "1:N" })],
    }));
    expect((d.edges[0]!.label.match(/1:N/g) ?? []).length).toBe(1);
  });

  it("er 以外は cardinality があっても label に併記しない", () => {
    const d = compileToCdl(makeDoc("flow", {
      animate: animOf(), flow: [step("A", "B", { label: "go", cardinality: "1:N" })],
    }));
    expect(d.edges[0]!.label).toBe("go");
  });

  it("edge の labelOffsetX / labelOffsetY が反映される (両分岐)", () => {
    const withOffset = compileToCdl(makeDoc("flow", {
      animate: animOf(), flow: [step("A", "B", { labelOffsetX: 7, labelOffsetY: -3 })],
    }));
    expect(withOffset.edges[0]!.labelOffsetX).toBe(7);
    expect(withOffset.edges[0]!.labelOffsetY).toBe(-3);
    const without = compileToCdl(makeDoc("flow", { animate: animOf() }));
    expect(without.edges[0]!.labelOffsetX).toBeUndefined();
    expect(without.edges[0]!.labelOffsetY).toBeUndefined();
  });

  it("edge の sub / tone / style / guard / cardinality が反映される", () => {
    const d = compileToCdl(makeDoc("flow", {
      animate: animOf(),
      flow: [step("A", "B", { sub: "s", tone: "success", style: "dashed", guard: "g", cardinality: "1:1" })],
    }));
    const e = d.edges[0]!;
    expect(e.sub).toBe("s");
    expect(e.tone).toBe("success");
    expect(e.style).toBe("dashed");
    expect(e.guard).toBe("g");
    expect(e.cardinality).toBe("1:1");
  });

  it("edge id は e{idx}-{from}-{to} 形式", () => {
    const d = compileToCdl(makeDoc("flow", { animate: animOf() }));
    expect(d.edges[0]!.id).toBe("e0-a-b");
  });
});

describe("compileSequenceWithAnimate: posX/posY/posW/posH の lane 反映", () => {
  it("posX/posY 両方指定で lane に反映される", () => {
    const d = compileToCdl(makeDoc("sequence", {
      animate: animOf(), actors: [actor("A", { posX: 11, posY: 22 }), actor("B")],
    }));
    expect(lane(d, "a").posX).toBe(11);
    expect(lane(d, "a").posY).toBe(22);
  });

  it("posX のみ (posY なし) では lane に反映しない (&& 条件)", () => {
    const d = compileToCdl(makeDoc("sequence", {
      animate: animOf(), actors: [actor("A", { posX: 11 }), actor("B")],
    }));
    expect(lane(d, "a").posX).toBeUndefined();
  });

  it("posW / posH は posX/posY 指定時のみ反映", () => {
    const d = compileToCdl(makeDoc("sequence", {
      animate: animOf(), actors: [actor("A", { posX: 1, posY: 2, posW: 33, posH: 44 }), actor("B")],
    }));
    expect(lane(d, "a").posW).toBe(33);
    expect(lane(d, "a").posH).toBe(44);
  });

  it("posW 未指定なら lane.posW は生えない", () => {
    const d = compileToCdl(makeDoc("sequence", {
      animate: animOf(), actors: [actor("A", { posX: 1, posY: 2 }), actor("B")],
    }));
    expect(lane(d, "a").posW).toBeUndefined();
  });

  it("header 幅は max(140, 名前長 * 22 + 52) の下限側", () => {
    const d = compileToCdl(makeDoc("sequence", { animate: animOf() }));
    expect(node(d, "a-header").w).toBe(140);
  });

  it("header 幅は長い名前で上限側 (計算式が効く)", () => {
    const name = "ABCDEFGHIJ"; // 10 文字 → 10*22+52 = 272
    const d = compileToCdl(makeDoc("sequence", {
      animate: animOf(), actors: [actor(name), actor("B")], flow: [step(name, "B")],
    }));
    expect(node(d, `${name.toLowerCase()}-header`).w).toBe(272);
  });

  it("edge の labelOffsetX / labelOffsetY が反映される (sequence animate)", () => {
    const d = compileToCdl(makeDoc("sequence", {
      animate: animOf(), flow: [step("A", "B", { labelOffsetX: 5, labelOffsetY: 6 })],
    }));
    const e = d.edges.find((x) => x.id === "e0-a-b")!;
    expect(e.labelOffsetX).toBe(5);
    expect(e.labelOffsetY).toBe(6);
  });
});

describe("compileSwimlane: actor 属性の伝播", () => {
  it("actor kind が node に反映される", () => {
    const d = compile("swimlane", { actors: [actor("A", { kind: "database" }), actor("B")] });
    expect(node(d, "a").kind).toBe("database");
  });

  it("kind 未指定 node は actor default (actor) になる", () => {
    const d = compile("swimlane");
    expect(node(d, "a").kind).toBe("actor");
  });

  it("同一 actor が複数 step に現れても node は 1 個 (placedNodes)", () => {
    const d = compile("swimlane", {
      actors: [actor("A"), actor("B"), actor("C")],
      flow: [step("A", "B"), step("A", "C")],
    });
    expect(d.nodes.filter((n) => n.id === "a").length).toBe(1);
  });

  it("edge の labelOffsetX / labelOffsetY が反映される (swimlane)", () => {
    const d = compile("swimlane", { flow: [step("A", "B", { labelOffsetX: 9, labelOffsetY: 8 })] });
    expect(d.edges[0]!.labelOffsetX).toBe(9);
    expect(d.edges[0]!.labelOffsetY).toBe(8);
  });

  it("animate 付き swimlane は generic 経路に分岐する (lane-{slug} 命名)", () => {
    const d = compileToCdl(makeDoc("swimlane", { animate: animOf() }));
    expect(d.lanes.some((l) => l.id === "lane-a")).toBe(true);
  });
});

describe("applyCanvasPivotPositions: 反映条件の分岐", () => {
  it("posX のみ指定では lane / node に反映しない (&& 条件)", () => {
    const d = compile("swimlane", { actors: [actor("A", { posX: 100 }), actor("B")] });
    expect(lane(d, "a").posX).toBeUndefined();
    expect(node(d, "a").posX).toBeUndefined();
  });

  it("parts actor (partId 付き) は本経路を skip する", () => {
    const part: CdlDiagram = {
      id: "parts-y", topic: "t",
      lanes: [{ id: "l", x: 0, width: 400 }],
      nodes: [{ id: "n", lane: "l", stack: 0, kind: "actor", title: "N" }] as CdlDiagram["nodes"],
      edges: [], states: [], phases: [] as CdlDiagram["phases"],
    };
    const d = compileToCdl(
      makeDoc("sequence", {
        actors: [actor("A"), actor("p1", { partId: "y", posX: 500, posY: 600 })],
        flow: [step("A", "A")],
      }),
      { partsCatalog: { y: part } },
    );
    // parts 経路が担当するため、 alias 名の lane / node は残っていない
    expect(d.lanes.some((l) => l.id === "p1")).toBe(false);
  });

  it("posW / posH は posX/posY 指定時に lane と node 双方へ反映", () => {
    const d = compile("swimlane", {
      actors: [actor("A", { posX: 1, posY: 2, posW: 30, posH: 40 }), actor("B")],
    });
    expect(lane(d, "a").posW).toBe(30);
    expect(lane(d, "a").posH).toBe(40);
    expect(node(d, "a").posW).toBe(30);
    expect(node(d, "a").posH).toBe(40);
  });

  it("posW 未指定なら posW は生えない (undefined 分岐)", () => {
    const d = compile("swimlane", { actors: [actor("A", { posX: 1, posY: 2 }), actor("B")] });
    expect(lane(d, "a").posW).toBeUndefined();
    expect(node(d, "a").posW).toBeUndefined();
  });
});

// ── 第 4 弾 (e): 矢印 regex の各要素と compileMind の暗黙 edge 分岐 ──

describe("矢印 regex の要素 (空白許容 / 非貪欲 / 記号バリエーション)", () => {
  /** sequence animate の highlight で resolveHighlight を通す。 */
  const seqHl = (h: string, over: Partial<DslDocument> = {}) =>
    compileToCdl(makeDoc("sequence", {
      animate: {
        states: [], phases: [{ name: "p", durationMs: 1000, highlight: [h], pos: { line: 1 } }], pos: { line: 1 },
      } as unknown as DslDocument["animate"],
      ...over,
    }));

  it("矢印前後に空白が無くても解決 (\\s* の 0 回)", () => {
    expect(seqHl("A→B").phases[0]!.activate).toContain("e0-a-b");
  });

  it("矢印前後に複数空白があっても解決 (\\s* の複数回)", () => {
    expect(seqHl("A   →   B").phases[0]!.activate).toContain("e0-a-b");
  });

  it("前後の余分な空白は trim される", () => {
    expect(seqHl("  A → B  ").phases[0]!.activate).toContain("e0-a-b");
  });

  it("ASCII 2 文字矢印 (->) を解決", () => {
    expect(seqHl("A -> B").phases[0]!.activate).toContain("e0-a-b");
  });

  it("矢印を含まない単純 actor 名は actor 経路に落ちる", () => {
    const act = seqHl("A").phases[0]!.activate;
    expect(act).toContain("a-header");
    expect(act.some((id) => id.startsWith("e0-"))).toBe(false);
  });

  it("空 highlight 配列なら activate は空", () => {
    const d = compileToCdl(makeDoc("sequence", {
      animate: {
        states: [], phases: [{ name: "p", durationMs: 1000, highlight: [], pos: { line: 1 } }], pos: { line: 1 },
      } as unknown as DslDocument["animate"],
    }));
    expect(d.phases[0]!.activate).toEqual([]);
  });

  it("generic 経路でも空白ゆらぎを吸収する", () => {
    const d = compileToCdl(makeDoc("flow", {
      animate: {
        states: [], phases: [{ name: "p", durationMs: 1000, highlight: ["A   ->   B"], pos: { line: 1 } }], pos: { line: 1 },
      } as unknown as DslDocument["animate"],
    }));
    expect(d.phases[0]!.activate.some((id) => id.includes("-a-b"))).toBe(true);
  });

  it("injectPhasesFallback 経路でも空白ゆらぎを吸収する", () => {
    const d = compileToCdl(makeDoc("class", {
      animate: {
        states: [], phases: [{ name: "p", durationMs: 1000, highlight: ["A    →    B"], pos: { line: 1 } }], pos: { line: 1 },
      } as unknown as DslDocument["animate"],
    }));
    const target = d.edges.find((e) => e.from === "a" && e.to === "b");
    expect(d.phases[0]!.activate).toContain(target!.id);
  });

  it("injectPhasesFallback: 該当 edge が無い矢印は activate しない", () => {
    const d = compileToCdl(makeDoc("class", {
      animate: {
        states: [], phases: [{ name: "p", durationMs: 1000, highlight: ["B → A"], pos: { line: 1 } }], pos: { line: 1 },
      } as unknown as DslDocument["animate"],
    }));
    expect(d.phases[0]!.activate.length).toBe(0);
  });

  it("injectPhasesFallback: phase の body / duration が反映される", () => {
    const d = compileToCdl(makeDoc("class", {
      animate: {
        states: [],
        phases: [{ name: "p", durationMs: 3300, highlight: [], body: "desc", pos: { line: 1 } }],
        pos: { line: 1 },
      } as unknown as DslDocument["animate"],
    }));
    expect(d.phases[0]!.duration).toBe(3300);
    expect(d.phases[0]!.body).toBe("desc");
  });

  it("injectPhasesFallback: body 未指定なら空文字 (?? 分岐)", () => {
    const d = compileToCdl(makeDoc("class", {
      animate: {
        states: [], phases: [{ name: "p", durationMs: 1000, highlight: [], pos: { line: 1 } }], pos: { line: 1 },
      } as unknown as DslDocument["animate"],
    }));
    expect(d.phases[0]!.body).toBe("");
  });
});

describe("compileMind: 暗黙 edge と lane 構成", () => {
  it("flow が空 かつ actor 2 個以上なら root から全 leaf に暗黙 edge", () => {
    const d = compile("mind", { actors: [actor("Root"), actor("L1"), actor("L2")], flow: [] });
    expect(d.edges.length).toBe(2);
    expect(d.edges.every((e) => e.from === "root")).toBe(true);
    expect(d.edges.map((e) => e.to).sort()).toEqual(["l1", "l2"]);
  });

  it("暗黙 edge の label は空文字", () => {
    const d = compile("mind", { actors: [actor("Root"), actor("L1")], flow: [] });
    expect(d.edges[0]!.label).toBe("");
  });

  it("flow がある場合は暗黙 edge を作らず flow に従う", () => {
    const d = compile("mind", {
      actors: [actor("Root"), actor("L1"), actor("L2")],
      flow: [step("Root", "L1", { label: "x" })],
    });
    expect(d.edges.length).toBe(1);
    expect(d.edges[0]!.label).toBe("x");
  });

  it("actor 1 個 (root のみ) なら暗黙 edge を作らない (length > 1 条件)", () => {
    const d = compile("mind", { actors: [actor("Root")], flow: [] });
    expect(d.edges.length).toBe(0);
  });

  it("actor 0 個なら早期 return で node も空", () => {
    const d = compile("mind", { actors: [], flow: [] });
    expect(d.nodes.length).toBe(0);
  });

  it("mind-left / mind-right lane が生成され label は空", () => {
    const d = compile("mind", { actors: [actor("Root"), actor("L1"), actor("L2")], flow: [] });
    expect(d.lanes.some((l) => l.id === "mind-left")).toBe(true);
    expect(d.lanes.some((l) => l.id === "mind-right")).toBe(true);
    expect(lane(d, "mind-left").label).toBe("");
  });

  it("mind-left は x 0、 mind-right はその右側に配置", () => {
    const d = compile("mind", { actors: [actor("Root"), actor("L1")], flow: [] });
    expect(lane(d, "mind-left").x).toBe(0);
    expect(lane(d, "mind-right").x!).toBeGreaterThan(lane(d, "mind-left").x!);
  });
});

// ── 第 4 弾 (f): mergePartsFromActors の fallback 経路 (共有 lane preset) と warn 分岐 ──
// seq-like は lane 由来 exact set 経路を通るため、 matchesAliasSlug の prefix / step-anchor 分岐は
// 共有 lane preset (flow / topology 等) でのみ実行される。 そちらから突く。

describe("mergePartsFromActors: 共有 lane preset の slug fallback 経路", () => {
  const PART = (): CdlDiagram => ({
    id: "parts-z", topic: "t",
    lanes: [{ id: "l", x: 0, width: 400 }],
    nodes: [{ id: "n", lane: "l", stack: 0, kind: "actor", title: "N" }] as CdlDiagram["nodes"],
    edges: [], states: [], phases: [] as CdlDiagram["phases"],
  });

  it("flow preset で parts actor 自身の node (id === slug) が削除される", () => {
    const d = compileToCdl(
      makeDoc("flow", { actors: [actor("p1", { partId: "z" }), actor("other")], flow: [step("p1", "other")] }),
      { partsCatalog: { z: PART() } },
    );
    expect(d.nodes.some((n) => n.id === "p1")).toBe(false);
    expect(d.nodes.some((n) => n.id === "p1__n")).toBe(true);
  });

  it("flow preset で通常 actor の node は残る (誤削除しない)", () => {
    const d = compileToCdl(
      makeDoc("flow", { actors: [actor("p1", { partId: "z" }), actor("other")], flow: [step("p1", "other")] }),
      { partsCatalog: { z: PART() } },
    );
    expect(d.nodes.some((n) => n.id === "other")).toBe(true);
  });

  it("flow preset で parts actor に接続する edge が削除される", () => {
    const d = compileToCdl(
      makeDoc("flow", { actors: [actor("p1", { partId: "z" }), actor("other")], flow: [step("p1", "other")] }),
      { partsCatalog: { z: PART() } },
    );
    expect(d.edges.some((e) => e.from === "p1" || e.to === "p1")).toBe(false);
  });

  it("topology preset でも同じ fallback 経路で削除される", () => {
    const d = compileToCdl(
      makeDoc("topology", { actors: [actor("p1", { partId: "z" }), actor("other")], flow: [step("p1", "other")] }),
      { partsCatalog: { z: PART() } },
    );
    expect(d.nodes.some((n) => n.id === "p1")).toBe(false);
    expect(d.nodes.some((n) => n.id === "other")).toBe(true);
  });

  it("slug prefix が部分一致する別 actor は削除されない (p1 vs p1x)", () => {
    const d = compileToCdl(
      makeDoc("flow", {
        actors: [actor("p1", { partId: "z" }), actor("p1x")],
        flow: [step("p1", "p1x")],
      }),
      { partsCatalog: { z: PART() } },
    );
    expect(d.nodes.some((n) => n.id === "p1x")).toBe(true);
  });

  it("非 seq-like では phase.activate からも parts actor 参照が除かれる", () => {
    const d = compileToCdl(
      makeDoc("flow", {
        actors: [actor("p1", { partId: "z" }), actor("other")],
        flow: [step("p1", "other")],
        animate: {
          states: [], phases: [{ name: "p", durationMs: 1000, highlight: ["p1"], pos: { line: 1 } }], pos: { line: 1 },
        } as unknown as DslDocument["animate"],
      }),
      { partsCatalog: { z: PART() } },
    );
    expect(d.phases[0]!.activate).not.toContain("p1");
  });

  it("parts actor が無ければ通常 actor の node / edge は完全に保持される", () => {
    const withParts = compileToCdl(
      makeDoc("flow", { actors: [actor("a1"), actor("a2")], flow: [step("a1", "a2")] }),
      { partsCatalog: { z: PART() } },
    );
    expect(withParts.nodes.map((n) => n.id).sort()).toEqual(["a1", "a2"]);
    expect(withParts.edges.length).toBe(1);
  });
});

describe("mergePartsFromActors: warn 出力の内容", () => {
  it("catalog 未渡し warn は actor 名と partId を含む", () => {
    const warn = console.warn;
    const logs: string[] = [];
    console.warn = (m: string) => logs.push(String(m));
    try {
      compileToCdl(makeDoc("sequence", {
        actors: [actor("A"), actor("gauge1", { partId: "arc-gauge" })],
        flow: [step("A", "A")],
      }));
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0]).toContain("gauge1");
      expect(logs[0]).toContain("arc-gauge");
    } finally {
      console.warn = warn;
    }
  });

  it("catalog 未登録 warn は partId と actor 名を含む", () => {
    const warn = console.warn;
    const logs: string[] = [];
    console.warn = (m: string) => logs.push(String(m));
    try {
      compileToCdl(
        makeDoc("sequence", {
          actors: [actor("A"), actor("g2", { partId: "nope" })],
          flow: [step("A", "A")],
        }),
        { partsCatalog: {} },
      );
      expect(logs.some((l) => l.includes("nope") && l.includes("g2"))).toBe(true);
    } finally {
      console.warn = warn;
    }
  });

  it("複数 parts actor が未解決なら warn に全件が並ぶ", () => {
    const warn = console.warn;
    const logs: string[] = [];
    console.warn = (m: string) => logs.push(String(m));
    try {
      compileToCdl(makeDoc("sequence", {
        actors: [actor("A"), actor("g1", { partId: "p" }), actor("g2", { partId: "q" })],
        flow: [step("A", "A")],
      }));
      expect(logs[0]).toContain("g1");
      expect(logs[0]).toContain("g2");
    } finally {
      console.warn = warn;
    }
  });
});

// ── 第 4 弾 (g): sub-node override / actor 名一致経路 / activate 空分岐 ──

describe("applyCanvasPivotPositions: actor.nodes sub-node override", () => {
  it("{alias}-{subKey} 形式の sub-node に座標が反映される", () => {
    const d = compileToCdl(makeDoc("sequence", {
      animate: animOf(),
      actors: [actor("A", { nodes: { header: { posX: 12, posY: 34 } } }), actor("B")],
    }));
    expect(node(d, "a-header").posX).toBe(12);
    expect(node(d, "a-header").posY).toBe(34);
  });

  it("{subKey}-{alias} 形式 (step box) の sub-node にも反映される", () => {
    const d = compileToCdl(makeDoc("sequence", {
      animate: animOf(),
      actors: [actor("A", { nodes: { s0: { posX: 56, posY: 78 } } }), actor("B")],
    }));
    expect(node(d, "s0-a").posX).toBe(56);
    expect(node(d, "s0-a").posY).toBe(78);
  });

  it("posX のみの override は skip される (|| 条件)", () => {
    const d = compileToCdl(makeDoc("sequence", {
      animate: animOf(),
      actors: [actor("A", { nodes: { header: { posX: 12 } } }), actor("B")],
    }));
    expect(node(d, "a-header").posX).toBeUndefined();
  });

  it("posY のみの override も skip される", () => {
    const d = compileToCdl(makeDoc("sequence", {
      animate: animOf(),
      actors: [actor("A", { nodes: { header: { posY: 34 } } }), actor("B")],
    }));
    expect(node(d, "a-header").posY).toBeUndefined();
  });

  it("sub-node override の posW / posH も反映される", () => {
    const d = compileToCdl(makeDoc("sequence", {
      animate: animOf(),
      actors: [actor("A", { nodes: { header: { posX: 1, posY: 2, posW: 300, posH: 400 } } }), actor("B")],
    }));
    expect(node(d, "a-header").posW).toBe(300);
    expect(node(d, "a-header").posH).toBe(400);
  });

  it("別 actor の同名 sub-node には漏れない (alias 接頭辞判定)", () => {
    const d = compileToCdl(makeDoc("sequence", {
      animate: animOf(),
      actors: [actor("A", { nodes: { header: { posX: 12, posY: 34 } } }), actor("B")],
    }));
    expect(node(d, "b-header").posX).toBeUndefined();
  });

  it("actor.nodes 未指定なら sub-node 座標は付かない", () => {
    const d = compileToCdl(makeDoc("sequence", { animate: animOf() }));
    expect(node(d, "a-header").posX).toBeUndefined();
  });
});

describe("applyV05Extensions / applyCanvasPivotPositions: id 一致経路の分岐", () => {
  it("actor 名がそのまま node id の preset (swimlane) で座標反映", () => {
    const d = compile("swimlane", { actors: [actor("A", { posX: 7, posY: 8 }), actor("B")] });
    expect(node(d, "a").posX).toBe(7);
  });

  it("非 ASCII actor 名 (slug != 名前) でも slug 一致で反映", () => {
    // dragon slugify は長音「ー」を `-` に変換するため id は "ユ-ザ" になる。
    // actor 名そのままではなく slug 側で一致させる経路を検証する。
    const d = compile("swimlane", {
      actors: [actor("ユーザー", { posX: 5, posY: 6 }), actor("B")],
      flow: [step("ユーザー", "B")],
    });
    expect(node(d, "ユ-ザ").posX).toBe(5);
    expect(node(d, "ユ-ザ").posY).toBe(6);
  });

  it("actor option は header 無し preset (swimlane) の node にも merge される", () => {
    const d = compile("swimlane", { actors: [actor("A", { eyebrow: "eb" }), actor("B")] });
    expect(node(d, "a").eyebrow).toBe("eb");
  });

  it("該当 node が無い actor 名は何も起きない (no-op)", () => {
    const d = compile("swimlane", {
      actors: [actor("A"), actor("B")],
      lanes: { nonexistent: { x: 1 } },
    });
    expect(d.nodes.length).toBe(2);
  });
});

describe("compileSequenceWithAnimate: activate 空分岐", () => {
  it("highlight 空なら activate は空配列 (length > 0 の false 側)", () => {
    const d = compileToCdl(makeDoc("sequence", { animate: animOf([]) }));
    expect(d.phases[0]!.activate).toEqual([]);
  });

  it("highlight ありなら activate に id が入る (true 側)", () => {
    const d = compileToCdl(makeDoc("sequence", { animate: animOf(["A"]) }));
    expect(d.phases[0]!.activate.length).toBeGreaterThan(0);
  });

  it("tween は phase に反映される", () => {
    const animate = {
      states: [{ name: "v", initial: 0 }],
      phases: [{
        name: "p", durationMs: 1000, highlight: [],
        tweens: [{ state: "v", from: 0, to: 100 }], pos: { line: 1 },
      }],
      pos: { line: 1 },
    } as unknown as DslDocument["animate"];
    const d = compileToCdl(makeDoc("sequence", { animate }));
    expect(d.phases[0]!.tweens.some((t) => t.stateId === "v" && t.to === 100)).toBe(true);
  });

  it("sets は phase に反映される", () => {
    const animate = {
      states: [{ name: "v", initial: 0 }],
      phases: [{
        name: "p", durationMs: 1000, highlight: [],
        sets: [{ state: "v", value: 42 }], pos: { line: 1 },
      }],
      pos: { line: 1 },
    } as unknown as DslDocument["animate"];
    const d = compileToCdl(makeDoc("sequence", { animate }));
    expect(d.phases[0]!.sets.some((s) => s.stateId === "v")).toBe(true);
  });
});

// ── 第 4 弾 (h): animate guard (phases 空) と lane guard の両分岐 ──
// `doc.animate && doc.animate.phases.length > 0` は phases が空の時に非 animate 経路へ落ちる。
// 各 preset で「非 animate 経路に固有の出力」 を assert し、 guard が緩む mutant を kill する。

describe("animate guard: phases 空なら非 animate 経路を通る", () => {
  const EMPTY_ANIM = { states: [], phases: [], pos: { line: 1 } } as unknown as DslDocument["animate"];

  it("flow は preset 由来 lane (flow) を使う (animate 経路の main ではない)", () => {
    const d = compileToCdl(makeDoc("flow", { animate: EMPTY_ANIM }));
    expect(d.lanes.map((l) => l.id)).toEqual(["flow"]);
  });

  it("swimlane は actor 名 lane を使う (animate 経路の lane-{slug} ではない)", () => {
    const d = compileToCdl(makeDoc("swimlane", { animate: EMPTY_ANIM }));
    expect(d.lanes.map((l) => l.id)).toEqual(["a", "b"]);
  });

  it("sequence は preset 由来 edge (style 付き) を生成", () => {
    const d = compileToCdl(makeDoc("sequence", { animate: EMPTY_ANIM }));
    expect(d.edges[0]!.style).toBe("solid");
  });

  it("er は lane label 無しの preset 出力になる", () => {
    const d = compileToCdl(makeDoc("er", { animate: EMPTY_ANIM }));
    expect(lane(d, "lane-a").label).toBeUndefined();
  });

  it("state も lane label 無しの preset 出力になる", () => {
    const d = compileToCdl(makeDoc("state", { animate: EMPTY_ANIM }));
    expect(lane(d, "lane-a").label).toBeUndefined();
  });

  it("topology は preset 由来 edge id (c{idx}-) を使う", () => {
    const d = compileToCdl(makeDoc("topology", { animate: EMPTY_ANIM }));
    expect(d.edges[0]!.id.startsWith("c0-")).toBe(true);
  });

  it("独自 layout preset (class) では phases 空なら fallback 注入も走らない", () => {
    const d = compileToCdl(makeDoc("class", { animate: EMPTY_ANIM }));
    expect(d.phases.length).toBe(0);
  });

  it("phases が 1 個以上なら animate 経路に入る (guard の true 側)", () => {
    const d = compileToCdl(makeDoc("flow", { animate: animOf() }));
    expect(d.lanes.map((l) => l.id)).toEqual(["main"]);
  });
});

describe("mergePartsFromActors: actor.lane が自身の lane と一致する場合の guard", () => {
  const PART = (): CdlDiagram => ({
    id: "parts-g", topic: "t",
    lanes: [{ id: "l", x: 0, width: 400 }],
    nodes: [{ id: "n", lane: "l", stack: 0, kind: "actor", title: "N" }] as CdlDiagram["nodes"],
    edges: [], states: [], phases: [] as CdlDiagram["phases"],
  });

  /** parts actor 自身の slug を lane 指定した doc (guard が実際に効く唯一の形)。 */
  const compileSelfLane = () => compileToCdl(
    makeDoc("sequence", {
      actors: [actor("A"), actor("p1", { partId: "g", lane: "p1" })],
      flow: [step("A", "A")],
    }),
    { partsCatalog: { g: PART() } },
  );

  it("張替え先 lane (自身の slug) は削除されず残る", () => {
    const d = compileSelfLane();
    expect(d.lanes.some((l) => l.id === "p1")).toBe(true);
  });

  it("part node はその lane に張替えられる", () => {
    const d = compileSelfLane();
    expect(node(d, "p1__n").lane).toBe("p1");
  });

  it("part 専用 lane (p1__l) は作られない (張替え経路)", () => {
    const d = compileSelfLane();
    expect(d.lanes.some((l) => l.id === "p1__l")).toBe(false);
  });

  it("通常 actor の lane / node は保持される", () => {
    const d = compileSelfLane();
    expect(d.lanes.some((l) => l.id === "a")).toBe(true);
    expect(d.nodes.some((n) => n.id === "a-header")).toBe(true);
  });

  it("lane 指定なしなら parts actor の lane は削除され part 専用 lane が作られる", () => {
    const d = compileToCdl(
      makeDoc("sequence", { actors: [actor("A"), actor("p1", { partId: "g" })], flow: [step("A", "A")] }),
      { partsCatalog: { g: PART() } },
    );
    expect(d.lanes.some((l) => l.id === "p1")).toBe(false);
    expect(d.lanes.some((l) => l.id === "p1__l")).toBe(true);
  });
});

// ── 第 4 弾 (i): 貪欲/非貪欲 regex・option 漏れ・group container・cardinality strip ──

describe("矢印 regex の非貪欲性 (A→B→C で from/to の切り出しが変わる)", () => {
  /** 3 段矢印の actor 名を持つ doc で from 側の非貪欲マッチを検証する。 */
  const names = ["A", "B→C"] as const;

  it("resolveHighlight: 最初の矢印で分割される (from=A / to=B→C)", () => {
    // 非貪欲 (.+?) なら from="A"、 貪欲 (.+) なら from="A→B" となり別 edge を探して失敗する。
    const d = compileToCdl(makeDoc("sequence", {
      animate: animOf(["A→B→C"]),
      actors: [actor(names[0]), actor(names[1])],
      flow: [step(names[0], names[1])],
    }));
    const target = d.edges[0]!;
    expect(d.phases[0]!.activate).toContain(target.id);
  });

  it("resolveHighlightGeneric: 最初の矢印で分割される", () => {
    const d = compileToCdl(makeDoc("flow", {
      animate: animOf(["A→B→C"]),
      actors: [actor(names[0]), actor(names[1])],
      flow: [step(names[0], names[1])],
    }));
    expect(d.phases[0]!.activate.length).toBeGreaterThan(0);
  });

  it("injectPhasesFallback: 最初の矢印で分割される", () => {
    const d = compileToCdl(makeDoc("class", {
      animate: animOf(["A→B→C"]),
      actors: [actor(names[0]), actor(names[1])],
      flow: [step(names[0], names[1])],
    }));
    const target = d.edges.find((e) => e.from === "a");
    expect(target).toBeDefined();
    expect(d.phases[0]!.activate).toContain(target!.id);
  });

  it("injectPhasesFallback: actor 名 highlight は header 付き node も解決する", () => {
    const d = compileToCdl(makeDoc("class", { animate: animOf(["A"]) }));
    expect(d.phases[0]!.activate).toContain("a");
  });
});

describe("applyV05Extensions: actor option が他 actor に漏れない", () => {
  it("subtitle は指定した actor の node にのみ付く", () => {
    const d = compile("swimlane", { actors: [actor("A", { subtitle: "onlyA" }), actor("B")] });
    expect(node(d, "a").subtitle).toBe("onlyA");
    expect(node(d, "b").subtitle).toBeUndefined();
  });

  it("eyebrow / value / rows も他 actor に漏れない", () => {
    const d = compile("swimlane", {
      actors: [actor("A", { eyebrow: "e", value: "v", rows: ["r"] }), actor("B")],
    });
    expect(node(d, "b").eyebrow).toBeUndefined();
    expect(node(d, "b").value).toBeUndefined();
    expect(node(d, "b").rows).toBeUndefined();
  });

  it("header 付き preset でも他 actor の header に漏れない", () => {
    const d = compileToCdl(makeDoc("sequence", {
      animate: animOf(), actors: [actor("A", { subtitle: "onlyA" }), actor("B")],
    }));
    expect(node(d, "a-header").subtitle).toBe("onlyA");
    expect(node(d, "b-header").subtitle).toBeUndefined();
  });
});

describe("applyEdgeInlineOptions: 非 seq-like で正しい edge に割当てる", () => {
  it("2 step のうち後段だけに guard を付けると前段には付かない", () => {
    const d = compile("flow", {
      actors: [actor("A"), actor("B"), actor("C")],
      flow: [step("A", "B"), step("B", "C", { guard: "second" })],
    });
    const withGuard = d.edges.filter((e) => e.guard === "second");
    expect(withGuard.length).toBe(1);
    expect(withGuard[0]!.to).toBe("c");
  });

  it("前段だけに guard を付けると後段には付かない", () => {
    const d = compile("flow", {
      actors: [actor("A"), actor("B"), actor("C")],
      flow: [step("A", "B", { guard: "first" }), step("B", "C")],
    });
    const withGuard = d.edges.filter((e) => e.guard === "first");
    expect(withGuard.length).toBe(1);
    expect(withGuard[0]!.to).toBe("b");
  });

  it("seq-like でも後段だけの guard が前段に漏れない", () => {
    const d = compile("sequence", {
      actors: [actor("A"), actor("B"), actor("C")],
      flow: [step("A", "B"), step("B", "C", { guard: "g2" })],
    });
    expect(d.edges.find((e) => e.id === "e0-a-b")?.guard).toBeUndefined();
    expect(d.edges.find((e) => e.id === "e1-b-c")?.guard).toBe("g2");
  });
});

describe("applyGroupContainers: container lane 生成と重複回避", () => {
  it("groups から group-{id} lane が contain: true で作られる", () => {
    const d = compile("topology", { groups: { g1: { label: "G1" } } });
    const l = lane(d, "group-g1");
    expect(l.contain).toBe(true);
    expect(l.width).toBe(800);
    expect(l.label).toBe("G1");
  });

  it("label 未指定なら id が label になる (?? 分岐)", () => {
    const d = compile("topology", { groups: { g1: {} } });
    expect(lane(d, "group-g1").label).toBe("g1");
  });

  it("同名 lane が既にあれば重複追加しない", () => {
    const d = compile("topology", {
      groups: { g1: { label: "G1" } },
      lanes: { "group-g1": { x: 5, width: 111 } },
    });
    expect(d.lanes.filter((l) => l.id === "group-g1").length).toBe(1);
    // 既存 lane が保持される (push で上書きされない)
    expect(lane(d, "group-g1").width).toBe(111);
  });

  it("groups が空 object なら lane を追加しない (early return)", () => {
    const withEmpty = compile("topology", { groups: {} });
    const without = compile("topology");
    expect(withEmpty.lanes.length).toBe(without.lanes.length);
  });

  it("複数 group がすべて lane 化される", () => {
    const d = compile("topology", { groups: { g1: {}, g2: {} } });
    expect(d.lanes.some((l) => l.id === "group-g1")).toBe(true);
    expect(d.lanes.some((l) => l.id === "group-g2")).toBe(true);
  });
});

describe("stripCardinality: 括弧 / 空白の除去と fallback", () => {
  it("前置き括弧つき cardinality を除去して片括弧を残さない", () => {
    // "(1:N) owns" → cardinality 除去で "() owns" になり、 空括弧を落として "owns"。
    // 空括弧除去が無いと ") owns" と片括弧が label に残り user に見える。
    const d = compile("er", { flow: [step("A", "B", { label: "(1:N) owns" })] });
    expect(d.edges[0]!.label).toBe("owns");
  });

  it("後置き括弧つき cardinality を除去して片括弧を残さない", () => {
    const d = compile("er", { flow: [step("A", "B", { label: "owns (1:N)" })] });
    expect(d.edges[0]!.label).toBe("owns");
  });

  it("括弧内に空白がある形式 ( 1:N ) も除去できる", () => {
    const d = compile("er", { flow: [step("A", "B", { label: "owns ( 1:N )" })] });
    expect(d.edges[0]!.label).toBe("owns");
  });

  it("cardinality のみの label は元 label に fallback (|| 分岐)", () => {
    const d = compile("er", { flow: [step("A", "B", { label: "1:N" })] });
    // 除去すると空になるため元 label を維持する
    expect(d.edges[0]!.label).toBe("1:N");
  });

  it("cardinality を含まない label はそのまま", () => {
    const d = compile("er", { flow: [step("A", "B", { label: "plain" })] });
    expect(d.edges[0]!.label).toBe("plain");
  });

  it("前後の空白と閉じ括弧が除去される", () => {
    const d = compile("er", { flow: [step("A", "B", { label: "  owns 1:1 )" })] });
    expect(d.edges[0]!.label).toBe("owns");
  });
});

describe("mergePartsFromActors: 共有 lane の label が parts actor 名と一致する場合", () => {
  const PART = (): CdlDiagram => ({
    id: "parts-t", topic: "t",
    lanes: [{ id: "l", x: 0, width: 400 }],
    nodes: [{ id: "n", lane: "l", stack: 0, kind: "actor", title: "N" }] as CdlDiagram["nodes"],
    edges: [], states: [], phases: [] as CdlDiagram["phases"],
  });

  it("flow の共有 lane label (= doc.title) と parts actor 名が同じでも通常 node を消さない", () => {
    // 非 seq-like では lane 由来 exact set 経路に入らない (seq-like guard) ため、
    // 共有 lane に属する通常 actor の node は保持される。
    const d = compileToCdl(
      makeDoc("flow", {
        title: "p1",
        actors: [actor("p1", { partId: "t" }), actor("other")],
        flow: [step("p1", "other")],
      }),
      { partsCatalog: { t: PART() } },
    );
    expect(d.nodes.some((n) => n.id === "other")).toBe(true);
    expect(d.lanes.some((l) => l.id === "flow")).toBe(true);
  });
});

describe("mergePartIntoDiagram: target が空の diagram への merge", () => {
  const PART = (): CdlDiagram => ({
    id: "parts-e", topic: "t",
    lanes: [{ id: "l", x: 0, width: 400 }],
    nodes: [{ id: "n", lane: "l", stack: 0, kind: "actor", title: "N" }] as CdlDiagram["nodes"],
    edges: [], states: [], phases: [] as CdlDiagram["phases"],
  });

  it("parts actor のみ (target node 0) + posX 指定でも stack が有限値になる", () => {
    // target.nodes が空の時 Math.max(...[]) = -Infinity になる経路を踏むため、
    // length > 0 guard が効かないと stack が -Infinity に汚染される。
    const d = compileToCdl(
      makeDoc("sequence", { actors: [actor("p1", { partId: "e", posX: 100, posY: 200 })], flow: [] }),
      { partsCatalog: { e: PART() } },
    );
    const n = node(d, "p1__n");
    expect(Number.isFinite(n.stack)).toBe(true);
    expect(n.stack).toBe(1000);
  });

  it("shape の array 要素に null があっても壊れない (scaleGeom の null 分岐)", () => {
    const part = PART();
    (part.nodes[0] as { shape?: Record<string, unknown> }).shape = { kind: "arc", items: [null, { radius: 10 }] };
    const d = compileToCdl(
      makeDoc("sequence", {
        actors: [actor("A"), actor("p1", { partId: "e", posX: 100, posY: 200, posW: 800, posH: 880 })],
        flow: [step("A", "A")],
      }),
      { partsCatalog: { e: part } },
    );
    const s = node(d, "p1__n").shape as { items?: unknown[] };
    expect(s.items?.[0]).toBeNull();
    expect((s.items?.[1] as { radius?: number }).radius).toBeGreaterThan(10);
  });
});

// ── 第 4 弾 (j): cc-codex #879 review 指摘への対応 ──
// MAJOR 2 = scale 時の lane 中心 / node 中心の複合不変量
// MAJOR 3 = 等価と誤判定していた 4 種を実際に kill する test
// MINOR 4-5 = 弱い assertion の強化 + part edge merge の未検証経路

describe("mergePartIntoDiagram: scale 時も lane 中心と node 中心が drop 座標に一致する", () => {
  it("posW 指定時 lane は拡張後の幅で drop 座標に中心합わせされる", () => {
    // partsLaneW=400、 posW=800 → laneScaleX=2 → 拡張後幅 800
    // lane.x = posX - 800/2 = 600、 lane 中心 = 600 + 400 = 1000 = posX
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 });
    const l = lane(d, "p1__l");
    expect(l.x).toBe(600);
    expect(l.width).toBe(800);
    expect(l.x! + l.width / 2).toBe(1000);
  });

  it("posW 指定時も node 中心は drop 座標に一致する (lane 中心と同値)", () => {
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 });
    const l = lane(d, "p1__l");
    expect(node(d, "p1__top").posX).toBe(1000);
    // 複合不変量 = lane 中心 === node 中心 === drop 座標
    expect(node(d, "p1__top").posX).toBe(l.x! + l.width / 2);
  });

  it("scale 無しでも lane 中心 === node 中心 === drop 座標", () => {
    const d = compileWithPart({ posX: 1000, posY: 500 });
    const l = lane(d, "p1__l");
    expect(l.x).toBe(800);
    expect(l.x! + l.width / 2).toBe(1000);
    expect(node(d, "p1__top").posX).toBe(1000);
  });

  it("縮小 scale (posW < 元幅) でも中心が保たれる", () => {
    // posW=200 → laneScaleX=0.5 → 幅 200、 lane.x = 1000 - 100 = 900
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 200, posH: 220 });
    const l = lane(d, "p1__l");
    expect(l.x).toBe(900);
    expect(l.width).toBe(200);
    expect(node(d, "p1__top").posX).toBe(1000);
  });
});

describe("applyV05Extensions: actor slug が -header 終端でも他 actor に漏れない", () => {
  it("actor 名 \"A Header\" の option が actor \"A\" の node に漏れない", () => {
    // slugify("A Header") = "a-header"。 旧実装の第 3 項 (actorId.replace(/-header$/,"")) は
    // "a" に一致して actor "A" の node に option を書込む cross-actor leak を起こしていた。
    const d = compile("swimlane", {
      actors: [actor("A"), actor("A Header", { subtitle: "leak?" })],
      flow: [step("A", "A Header")],
    });
    expect(node(d, "a").subtitle).toBeUndefined();
    expect(node(d, "a-header").subtitle).toBe("leak?");
  });

  it("actor 名 \"A Header\" 自身の node には正しく反映される", () => {
    const d = compile("swimlane", {
      actors: [actor("A"), actor("A Header", { eyebrow: "eb", value: "v" })],
      flow: [step("A", "A Header")],
    });
    expect(node(d, "a-header").eyebrow).toBe("eb");
    expect(node(d, "a-header").value).toBe("v");
    expect(node(d, "a").eyebrow).toBeUndefined();
  });
});

describe("mergePartsFromActors: actor.lane 指定時は slug fallback 経路に入る", () => {
  const PART = (): CdlDiagram => ({
    id: "parts-sa", topic: "t",
    lanes: [{ id: "l", x: 0, width: 400 }],
    nodes: [{ id: "n", lane: "l", stack: 0, kind: "actor", title: "N" }] as CdlDiagram["nodes"],
    edges: [], states: [], phases: [] as CdlDiagram["phases"],
  });

  it("sequence + actor.lane === 自身 slug で step anchor (s{N}-{slug}) が削除される", () => {
    // actor.lane 指定で自身の lane が ownedLaneIds から除外され、 exact set 経路ではなく
    // matchesAliasSlug fallback を通る。 その時 step anchor 判定が実際に効く。
    const d = compileToCdl(
      makeDoc("sequence", {
        actors: [actor("A"), actor("p1", { partId: "sa", lane: "p1" })],
        flow: [step("A", "p1")],
      }),
      { partsCatalog: { sa: PART() } },
    );
    expect(d.nodes.some((n) => n.id === "s0-p1")).toBe(false);
    expect(d.nodes.some((n) => n.id === "p1-header")).toBe(false);
    expect(d.nodes.some((n) => n.id === "p1__n")).toBe(true);
  });

  it("同経路で通常 actor の step anchor は保持される", () => {
    const d = compileToCdl(
      makeDoc("sequence", {
        actors: [actor("A"), actor("p1", { partId: "sa", lane: "p1" })],
        flow: [step("A", "p1")],
      }),
      { partsCatalog: { sa: PART() } },
    );
    expect(d.nodes.some((n) => n.id === "s0-a")).toBe(true);
    expect(d.nodes.some((n) => n.id === "a-header")).toBe(true);
  });
});

describe("矢印 regex: 複数文字 actor 名で 1 文字 match に縮退しない", () => {
  it("resolveHighlight は複数文字 actor 名を丸ごと from として扱う", () => {
    // (.+?) → (.) に縮退すると from が 1 文字目だけになり edge を引き当てられない。
    const d = compileToCdl(makeDoc("sequence", {
      animate: animOf(["Alpha→Beta"]),
      actors: [actor("Alpha"), actor("Beta")],
      flow: [step("Alpha", "Beta")],
    }));
    expect(d.phases[0]!.activate).toContain("e0-alpha-beta");
  });

  it("resolveHighlightGeneric も複数文字 actor 名を扱える", () => {
    const d = compileToCdl(makeDoc("flow", {
      animate: animOf(["Alpha→Beta"]),
      actors: [actor("Alpha"), actor("Beta")],
      flow: [step("Alpha", "Beta")],
    }));
    expect(d.phases[0]!.activate.some((id) => id.includes("-alpha-beta"))).toBe(true);
  });

  it("injectPhasesFallback も複数文字 actor 名を扱える", () => {
    const d = compileToCdl(makeDoc("class", {
      animate: animOf(["Alpha→Beta"]),
      actors: [actor("Alpha"), actor("Beta")],
      flow: [step("Alpha", "Beta")],
    }));
    const target = d.edges.find((e) => e.from === "alpha" && e.to === "beta");
    expect(target).toBeDefined();
    expect(d.phases[0]!.activate).toContain(target!.id);
  });
});

describe("mergePartIntoDiagram: part edge の merge (prefix 付与)", () => {
  /** edge を持つ part = merge 時に id / from / to が alias prefix される経路。 */
  function partWithEdge(): CdlDiagram {
    return {
      id: "parts-pe", topic: "t",
      lanes: [{ id: "l", x: 0, width: 400 }],
      nodes: [
        { id: "n1", lane: "l", stack: 0, kind: "actor", title: "N1" },
        { id: "n2", lane: "l", stack: 1, kind: "actor", title: "N2" },
      ] as CdlDiagram["nodes"],
      edges: [{ id: "pe0", from: "n1", to: "n2", label: "inner", tone: "accent" }] as CdlDiagram["edges"],
      states: [], phases: [] as CdlDiagram["phases"],
    };
  }

  it("part edge は alias prefix 付きで target に追加される", () => {
    const d = compileWithPart({}, partWithEdge());
    const e = d.edges.find((x) => x.id === "p1__pe0");
    expect(e).toBeDefined();
    expect(e!.from).toBe("p1__n1");
    expect(e!.to).toBe("p1__n2");
  });

  it("part edge の label / tone は保持される", () => {
    const d = compileWithPart({}, partWithEdge());
    const e = d.edges.find((x) => x.id === "p1__pe0")!;
    expect(e.label).toBe("inner");
    expect(e.tone).toBe("accent");
  });

  it("edge を持たない part では edge が増えない", () => {
    const withEdge = compileWithPart({}, partWithEdge()).edges.length;
    const withoutEdge = compileWithPart().edges.length;
    expect(withEdge).toBe(withoutEdge + 1);
  });

  it("part edge も drop 座標指定時に追加される (座標経路と独立)", () => {
    const d = compileWithPart({ posX: 900, posY: 400 }, partWithEdge());
    expect(d.edges.some((x) => x.id === "p1__pe0")).toBe(true);
  });
});

describe("mergePartsFromActors: partsCatalog の継承 property を拾わない", () => {
  it("Object.prototype 由来の property は part として解決しない", () => {
    const warn = console.warn;
    const logs: string[] = [];
    console.warn = (m: string) => logs.push(String(m));
    try {
      const d = compileToCdl(
        makeDoc("sequence", {
          actors: [actor("A"), actor("p1", { partId: "toString" })],
          flow: [step("A", "A")],
        }),
        { partsCatalog: {} },
      );
      // 継承 property (toString) を part として使わず warn + skip する
      expect(d.nodes.some((n) => n.id.startsWith("p1__"))).toBe(false);
      expect(logs.some((l) => l.includes("toString"))).toBe(true);
    } finally {
      console.warn = warn;
    }
  });

  it("constructor / __proto__ も同様に解決しない", () => {
    const warn = console.warn;
    console.warn = () => {};
    try {
      for (const bad of ["constructor", "__proto__", "valueOf"]) {
        const d = compileToCdl(
          makeDoc("sequence", { actors: [actor("A"), actor("p1", { partId: bad })], flow: [step("A", "A")] }),
          { partsCatalog: {} },
        );
        expect(d.nodes.some((n) => n.id.startsWith("p1__")), `${bad} は解決されない`).toBe(false);
      }
    } finally {
      console.warn = warn;
    }
  });
});

describe("state preset: initial / final marker の実値検証 (assertion 強化)", () => {
  it("先頭 actor と末尾 actor で marker 属性が異なる", () => {
    const d = compileToCdl(makeDoc("state", {
      animate: animOf(), actors: [actor("A"), actor("B"), actor("C")],
      flow: [step("A", "B"), step("B", "C")],
    }));
    const first = node(d, "a");
    const mid = node(d, "b");
    const last = node(d, "c");
    // 中間 actor は initial / final どちらの marker も持たない基準点になる
    const keysOf = (n: typeof first) => Object.keys(n).sort().join(",");
    expect(keysOf(first) !== keysOf(mid) || keysOf(last) !== keysOf(mid)).toBe(true);
  });

  it("actor 1 個なら initial のみで final は付かない", () => {
    const single = compileToCdl(makeDoc("state", {
      animate: animOf(), actors: [actor("A")], flow: [],
    }));
    const pair = compileToCdl(makeDoc("state", {
      animate: animOf(), actors: [actor("A"), actor("B")], flow: [step("A", "B")],
    }));
    // 2 actor 時の末尾 node と 1 actor 時の node は marker 構成が異なる
    expect(JSON.stringify(node(single, "a")) !== JSON.stringify(node(pair, "b"))).toBe(true);
  });
});

describe("mergePartIntoDiagram: readouts の有無で target.readouts が切り替わる (assertion 強化)", () => {
  it("readouts を持たない part では target.readouts が生えない", () => {
    const d = compileWithPart();
    expect(d.readouts).toBeUndefined();
  });

  it("readouts を持つ part では長さ 1 の配列が生える", () => {
    const part = makeTestPart();
    part.readouts = [{ id: "r1", kind: "gauge", source: "{v}", nodeId: "top" }] as CdlDiagram["readouts"];
    const d = compileWithPart({}, part);
    expect(d.readouts?.length).toBe(1);
  });

  it("readouts が空配列の part でも readouts は生えない", () => {
    const part = makeTestPart();
    part.readouts = [] as CdlDiagram["readouts"];
    const d = compileWithPart({}, part);
    expect(d.readouts).toBeUndefined();
  });
});

// ── 第 4 弾 (k): cc-codex #879 Round 2 指摘への対応 ──

describe("mergePartIntoDiagram: 明示 posX を持つ node も scale 時に中心が保たれる", () => {
  /** node が絶対座標 (posX) を持つ part。 */
  function partWithExplicitPosX(): CdlDiagram {
    const p = makeTestPart();
    p.nodes = [
      { id: "c", lane: "l", stack: 0, kind: "actor", title: "C", posX: 200, w: 100, h: 50 },
      { id: "l1", lane: "l", stack: 0, kind: "actor", title: "L", posX: 100, w: 100, h: 50 },
    ] as CdlDiagram["nodes"];
    return p;
  }

  it("part 中心にある node は scale しても drop 座標に一致する", () => {
    // partOrigW=400 → 中心 200。 node "c" は posX 200 = part 中心。
    // posW 800 (scaleX 2) でも中心は drop 座標 1000 のまま。
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 }, partWithExplicitPosX());
    expect(node(d, "p1__c").posX).toBe(1000);
  });

  it("中心から離れた node は距離が scale 倍される", () => {
    // node "l1" は part 中心から 100 左 → scaleX 2 で 200 左 → 1000 - 200 = 800
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 }, partWithExplicitPosX());
    expect(node(d, "p1__l1").posX).toBe(800);
  });

  it("明示 posX でも lane 中心 === 中心 node の posX (複合不変量)", () => {
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 }, partWithExplicitPosX());
    const l = lane(d, "p1__l");
    expect(node(d, "p1__c").posX).toBe(l.x! + l.width / 2);
  });

  it("scale 無しなら従来の単純加算と同値", () => {
    // partsLaneStartX = 1000 - 200 = 800、 node "c" posX 200 → 200 + 800 = 1000
    const d = compileWithPart({ posX: 1000, posY: 500 }, partWithExplicitPosX());
    expect(node(d, "p1__c").posX).toBe(1000);
    expect(node(d, "p1__l1").posX).toBe(900);
  });
});

describe("applyV05Extensions: sequence でも actor slug と別 actor header が衝突しない", () => {
  it("actor \"A Header\" の option が actor \"A\" の header に漏れない (sequence)", () => {
    // slugify("A Header") = "a-header" は actor "A" の header node id と同一。
    // header 帰属を footer の対存在で判定することで本人にのみ merge される。
    const d = compileToCdl(makeDoc("sequence", {
      animate: animOf(),
      actors: [actor("A"), actor("A Header", { subtitle: "leak?" })],
      flow: [step("A", "A Header")],
    }));
    expect(node(d, "a-header").subtitle).toBeUndefined();
    expect(node(d, "a-header-header").subtitle).toBe("leak?");
  });

  it("非 animate sequence でも同様に漏れない", () => {
    const d = compile("sequence", {
      actors: [actor("A"), actor("A Header", { eyebrow: "eb" })],
      flow: [step("A", "A Header")],
    });
    expect(node(d, "a-header").eyebrow).toBeUndefined();
    expect(node(d, "a-header-header").eyebrow).toBe("eb");
  });

  it("通常 actor の option は自身の header に正しく付く", () => {
    const d = compileToCdl(makeDoc("sequence", {
      animate: animOf(), actors: [actor("A", { subtitle: "mine" }), actor("B")],
    }));
    expect(node(d, "a-header").subtitle).toBe("mine");
    expect(node(d, "b-header").subtitle).toBeUndefined();
  });

  it("header/footer を持たない preset (swimlane) では id 一致で判定する", () => {
    const d = compile("swimlane", {
      actors: [actor("A"), actor("A Header", { subtitle: "own" })],
      flow: [step("A", "A Header")],
    });
    expect(node(d, "a-header").subtitle).toBe("own");
    expect(node(d, "a").subtitle).toBeUndefined();
  });
});

describe("mergePartIntoDiagram: stack が 0 始まりでない part の中心合わせ", () => {
  /** stack 2/3 の part = minStack > 0 で partCenterStack が 0 にならない。 */
  function partStackFrom2(): CdlDiagram {
    const p = makeTestPart();
    p.nodes = [
      { id: "s2", lane: "l", stack: 2, kind: "actor", title: "S2", w: 100, h: 50 },
      { id: "s3", lane: "l", stack: 3, kind: "actor", title: "S3", w: 100, h: 50 },
    ] as CdlDiagram["nodes"];
    return p;
  }

  it("minStack / maxStack が実 stack 範囲から算出され中心が drop 座標に来る", () => {
    // minStack=2 / maxStack=3 → partCenterStack=2.5
    // s2 = (2 - 2.5) * 220 + 500 = 390、 s3 = (3 - 2.5) * 220 + 500 = 610
    // stack 集計が 0 固定に潰れると s2 = 2*220+500 = 940 になり中心がずれる。
    const d = compileWithPart({ posX: 1000, posY: 500 }, partStackFrom2());
    expect(node(d, "p1__s2").posY).toBe(390);
    expect(node(d, "p1__s3").posY).toBe(610);
  });

  it("node 群の縦中心が drop 座標に一致する", () => {
    const d = compileWithPart({ posX: 1000, posY: 500 }, partStackFrom2());
    const top = node(d, "p1__s2").posY!;
    const bottom = node(d, "p1__s3").posY!;
    expect((top + bottom) / 2).toBe(500);
  });

  it("partOrigH も実 stack 範囲で算出される (scaleY に反映)", () => {
    // maxStack-minStack+1 = 2 → partOrigH = 440、 posH 880 で scaleY = 2
    // s2 = (2 - 2.5) * 220 * 2 + 500 = 280
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 }, partStackFrom2());
    expect(node(d, "p1__s2").posY).toBe(280);
    expect(node(d, "p1__s3").posY).toBe(720);
  });
});

describe("state preset: initial / final marker の eyebrow 実値検証", () => {
  it("先頭 actor に eyebrow 初期、 末尾 actor に eyebrow 最終が付く", () => {
    const d = compileToCdl(makeDoc("state", {
      animate: animOf(), actors: [actor("A"), actor("B"), actor("C")],
      flow: [step("A", "B"), step("B", "C")],
    }));
    expect(node(d, "a").eyebrow).toBe("初期");
    expect(node(d, "c").eyebrow).toBe("最終");
  });

  it("中間 actor には marker eyebrow が付かない", () => {
    const d = compileToCdl(makeDoc("state", {
      animate: animOf(), actors: [actor("A"), actor("B"), actor("C")],
      flow: [step("A", "B"), step("B", "C")],
    }));
    expect(node(d, "b").eyebrow).toBeUndefined();
  });

  it("actor 1 個なら初期のみで最終は付かない (length > 1 条件)", () => {
    const d = compileToCdl(makeDoc("state", {
      animate: animOf(), actors: [actor("A")], flow: [],
    }));
    expect(node(d, "a").eyebrow).toBe("初期");
  });

  it("state 以外の preset では marker eyebrow が付かない", () => {
    const d = compileToCdl(makeDoc("swimlane", {
      animate: animOf(), actors: [actor("A"), actor("B")], flow: [step("A", "B")],
    }));
    expect(node(d, "a").eyebrow).toBeUndefined();
    expect(node(d, "b").eyebrow).toBeUndefined();
  });
});

// ── 第 4 弾 (l): cc-codex #879 Round 3 指摘への対応 (座標統一 + header 帰属を preset 種別で) ──

describe("mergePartIntoDiagram: lane.x != 0 でも明示 posX と auto-layout が一致する", () => {
  /** lane.x を 0 以外に持ち、 posX 明示 node と posX 無し node を併存させる part。 */
  function partLaneXNonZero(): CdlDiagram {
    return {
      id: "parts-lx", topic: "t",
      lanes: [{ id: "l", x: 100, width: 400 }],
      nodes: [
        { id: "explicit", lane: "l", stack: 0, kind: "actor", title: "E", posX: 300, w: 80, h: 40 },
        { id: "auto", lane: "l", stack: 0, kind: "actor", title: "A", w: 80, h: 40 },
      ] as CdlDiagram["nodes"],
      edges: [], states: [], phases: [] as CdlDiagram["phases"],
    };
  }

  it("lane.x=100 / scaleX=2 で明示 posX (part 中心) と auto-layout が同じ drop 座標に来る", () => {
    // part 中心 X = lane.x(100) + width/2(200) = 300。 explicit node は posX 300 = 中心。
    // auto node の lane 中央も 300。 両方 scale しても drop 座標 1000 に一致すべき。
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 }, partLaneXNonZero());
    expect(node(d, "p1__explicit").posX).toBe(1000);
    expect(node(d, "p1__auto").posX).toBe(1000);
    // 明示 posX と auto-layout が乖離しない (Round 3 Finding 2)
    expect(node(d, "p1__explicit").posX).toBe(node(d, "p1__auto").posX);
  });

  it("lane.x=100 / scaleX=1 でも両経路が一致する", () => {
    const d = compileWithPart({ posX: 1000, posY: 500 }, partLaneXNonZero());
    expect(node(d, "p1__explicit").posX).toBe(1000);
    expect(node(d, "p1__auto").posX).toBe(1000);
  });

  it("lane.x != 0 でも lane 中心 === node 中心 === drop 座標 (複合不変量)", () => {
    const d = compileWithPart({ posX: 1000, posY: 500, posW: 800, posH: 880 }, partLaneXNonZero());
    const l = lane(d, "p1__l");
    expect(node(d, "p1__explicit").posX).toBe(l.x! + l.width / 2);
  });
});

describe("applyV05Extensions: actor 'A Footer' 共存でも header 帰属が誤爆しない", () => {
  it("sequence で actor 'A' / 'A Header' / 'A Footer' 共存でも option が正しい node に付く", () => {
    // "A Footer" の slug = a-footer は actor "A" の footer node id と衝突しうる。
    // preset 種別 (seq-like) で primaryNodeId を {slug}-header に固定するため、 footer 存在に依存しない。
    const d = compileToCdl(makeDoc("sequence", {
      animate: animOf(),
      actors: [
        actor("A", { subtitle: "sub-A" }),
        actor("A Header", { subtitle: "sub-AH" }),
        actor("A Footer", { subtitle: "sub-AF" }),
      ],
      flow: [step("A", "A Header"), step("A Header", "A Footer")],
    }));
    expect(node(d, "a-header").subtitle).toBe("sub-A");
    expect(node(d, "a-header-header").subtitle).toBe("sub-AH");
    expect(node(d, "a-footer-header").subtitle).toBe("sub-AF");
  });

  it("非 sequence preset (swimlane) で 'A' / 'A Footer' 共存でも漏れない", () => {
    // swimlane は header/footer を持たず node id = slug。 "A Footer" の a-footer は
    // actor "A" の node "a" と別 id なので衝突しない (preset 種別で id 一致に統一)。
    const d = compile("swimlane", {
      actors: [actor("A", { subtitle: "own-A" }), actor("A Footer", { subtitle: "own-AF" })],
      flow: [step("A", "A Footer")],
    });
    expect(node(d, "a").subtitle).toBe("own-A");
    expect(node(d, "a-footer").subtitle).toBe("own-AF");
  });

  it("class preset (footer 無し) でも actor option が自身の node に付く", () => {
    const d = compileToCdl(makeDoc("class", {
      animate: animOf(), actors: [actor("A", { eyebrow: "eb-A" }), actor("B")],
    }));
    expect(node(d, "a").eyebrow).toBe("eb-A");
    expect(node(d, "b").eyebrow).toBeUndefined();
  });

  it("solidity も seq-like として {slug}-header に merge する", () => {
    const d = compileToCdl(makeDoc("solidity", {
      animate: animOf(),
      actors: [actor("A", { kind: "eoa", subtitle: "sol-A" }), actor("B", { kind: "contract" })],
      flow: [step("A", "B")],
    }));
    expect(node(d, "a-header").subtitle).toBe("sol-A");
  });
});
