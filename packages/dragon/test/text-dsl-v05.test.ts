/**
 * Text DSL v0.5 unit test
 *
 * 英語 keyword + 日本語値 quote 必須 + YAML 風 syntax の parser を検証。
 */
import { describe, it, expect } from "vitest";
import { parseTextDslV05, compileToCdl, textDslToDiagram } from "@cardenelabs/dragon";
import { diagram as buildDiagram, layout as layoutFromSrc } from "@cardenelabs/cdl";

describe("Text DSL v0.5 parser", () => {
  it("minimal sequence diagram (title / type / actors / flow)", () => {
    const r = parseTextDslV05(`
title: "送金フロー"
type: sequence

actors:
  - Alice
  - Vault: storage
  - Bob

flow:
  - Alice -> Vault: "deposit"
  - Vault -> Bob: "send" (success)
`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.doc.title).toBe("送金フロー");
    expect(r.doc.type).toBe("sequence");
    expect(r.doc.actors).toHaveLength(3);
    expect(r.doc.actors[0]).toMatchObject({ name: "Alice", kind: "actor" });
    expect(r.doc.actors[1]).toMatchObject({ name: "Vault", kind: "storage" });
    expect(r.doc.flow).toHaveLength(2);
    expect(r.doc.flow[0]).toMatchObject({ from: "Alice", to: "Vault", label: "deposit" });
    expect(r.doc.flow[1]).toMatchObject({ from: "Vault", to: "Bob", label: "send", tone: "success" });
  });

  it("with states + animation block (sequence + tween)", () => {
    const r = parseTextDslV05(`
title: "送金"
type: sequence

actors:
  - Alice
  - Vault: storage
  - Bob

flow:
  - Alice -> Vault: "deposit"
  - Vault -> Bob: "send"

states:
  alice_bal: 100
  bob_bal: 0

animation:
  - step: "送金開始" 1.5s
    focus: [Alice, Vault]
    tween:
      alice_bal: 100 -> 90
    badge: "送金開始"

  - step: "送金完了" 1.5s
    focus: [Vault, Bob]
    tween:
      bob_bal: 0 -> 10
    badge: "送金完了"
`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.doc.animate).toBeDefined();
    expect(r.doc.animate!.states).toHaveLength(2);
    expect(r.doc.animate!.states[0]).toMatchObject({ name: "alice_bal", initial: 100 });
    expect(r.doc.animate!.phases).toHaveLength(2);
    const p1 = r.doc.animate!.phases[0]!;
    expect(p1.name).toBe("送金開始");
    expect(p1.durationMs).toBe(1500);
    expect(p1.highlight).toEqual(["Alice", "Vault"]);
    expect(p1.tweens).toEqual([
      expect.objectContaining({ state: "alice_bal", from: 100, to: 90 }),
    ]);
    expect(p1.badge).toBe("送金開始");
  });

  it("set (string state)", () => {
    const r = parseTextDslV05(`
title: "auth"
type: flow

actors:
  - api: function
  - db: database

flow:
  - api -> db: "verify"

states:
  status: "idle"

animation:
  - step: "submit" 0.8s
    focus: [api]
    set:
      status: "loading"
  - step: "done" 1.2s
    focus: [api]
    set:
      status: "done"
`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.doc.animate!.phases).toHaveLength(2);
    const p1 = r.doc.animate!.phases[0]!;
    expect(p1.sets).toEqual([
      expect.objectContaining({ state: "status", value: "loading" }),
    ]);
  });

  it("missing title → error", () => {
    const r = parseTextDslV05(`
type: flow
actors:
  - a
  - b
flow:
  - a -> b
`);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.some((e) => e.message.includes("title"))).toBe(true);
  });

  it("missing type → error", () => {
    const r = parseTextDslV05(`
title: "t"
actors:
  - a
flow:
  - a -> a
`);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.some((e) => e.message.includes("type"))).toBe(true);
  });

  it("auto-detect: textDslToDiagram routes v0.5 source to v0.5 parser", () => {
    const diagram = textDslToDiagram(`
title: "demo"
type: sequence

actors:
  - A
  - B

flow:
  - A -> B: "hello"
`);
    expect(diagram).toBeDefined();
    expect(diagram.id).toBeDefined();
  });

  it("auto-detect: textDslToDiagram routes v0.4 source to v0.4 parser (deprecation path)", () => {
    const diagram = textDslToDiagram(`
タイトル: demo
種類: sequence

登場人物:
  - A
  - B

流れ:
  1. A → B: hello
`);
    expect(diagram).toBeDefined();
    expect(diagram.id).toBeDefined();
  });

  it("compile to CdlDiagram (v0.5 → engine output)", () => {
    const r = parseTextDslV05(`
title: "送金"
type: sequence

actors:
  - Alice
  - Bob

flow:
  - Alice -> Bob: "送金"
`);
    if (!r.ok) throw new Error("parse failed");
    const diagram = compileToCdl(r.doc);
    expect(diagram).toBeDefined();
    expect(diagram.lanes.length).toBeGreaterThanOrEqual(2);
    expect(diagram.nodes.some((n) => n.title === "Alice")).toBe(true);
    expect(diagram.nodes.some((n) => n.title === "Bob")).toBe(true);
  });
});

describe("Text DSL v0.5 inline option (PR #101 表現力拡張)", () => {
  it("actor inline option: subtitle / eyebrow / value", () => {
    const r = parseTextDslV05(`
title: "demo"
type: sequence

actors:
  - Alice: { kind: actor, subtitle: "送り手", eyebrow: "User" }
  - Counter: { kind: actor, value: "{count}" }

flow:
  - Alice -> Counter: "tap"
`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.doc.actors[0]).toMatchObject({
      name: "Alice", kind: "actor", subtitle: "送り手", eyebrow: "User",
    });
    expect(r.doc.actors[1]).toMatchObject({
      name: "Counter", kind: "actor", value: "{count}",
    });
  });

  it("flow inline option: sub / guard / cardinality / labelOffsetY", () => {
    const r = parseTextDslV05(`
title: "demo"
type: er

actors:
  - User: entity
  - Order: entity

flow:
  - User -> Order: "places" { sub: "1:N", cardinality: "1:N", guard: "isActive", labelOffsetY: -8 }
`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.doc.flow[0]).toMatchObject({
      from: "User", to: "Order", label: "places",
      sub: "1:N", cardinality: "1:N", guard: "isActive", labelOffsetY: -8,
    });
  });

  it("top-level lanes / viewport / groups", () => {
    const r = parseTextDslV05(`
title: "demo"
type: topology

viewport: { width: 1400, height: 900, laneWidth: 480, gap: 80 }

lanes:
  l1: { x: 0, width: 320, label: "left" }
  aws: { x: 540, width: 460, label: "AWS", contain: true }

groups:
  cloud: { label: "Cloud", lanes: [aws, l1] }

actors:
  - a
  - b

flow:
  - a -> b: "call"
`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.doc.viewport).toMatchObject({ width: 1400, height: 900, laneWidth: 480, gap: 80 });
    expect(r.doc.lanes!.aws).toMatchObject({ id: "aws", x: 540, width: 460, label: "AWS", contain: true });
    expect(r.doc.groups!.cloud).toMatchObject({ id: "cloud", label: "Cloud", lanes: ["aws", "l1"] });
  });

  it("state machine: initial / final flag via inline option", () => {
    const r = parseTextDslV05(`
title: "auth fsm"
type: state

actors:
  - Idle: { kind: state, initial: true }
  - Loading: { kind: state }
  - Done: { kind: state, final: true }

flow:
  - Idle -> Loading: "submit"
  - Loading -> Done: "ok"
`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.doc.actors[0]).toMatchObject({ name: "Idle", kind: "state", initial: true });
    expect(r.doc.actors[2]).toMatchObject({ name: "Done", kind: "state", final: true });
  });
});

describe("Text DSL v0.5 viewport reflected in CdlDiagram (PR #102)", () => {
  it("viewport.width / height は CdlDiagram に保持され layout viewBox の minimum size に", () => {
    const r = parseTextDslV05(`
title: "wide canvas"
type: sequence

viewport: { width: 2000, height: 1200 }

actors:
  - A
  - B

flow:
  - A -> B: "hi"
`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const diagram = compileToCdl(r.doc);
    expect(diagram.viewport).toMatchObject({ width: 2000, height: 1200 });
  });

  it("viewport なし時は従来の auto 計算が維持される (回帰防止)", () => {
    const r = parseTextDslV05(`
title: "auto"
type: sequence

actors:
  - A
  - B

flow:
  - A -> B
`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const diagram = compileToCdl(r.doc);
    expect(diagram.viewport).toBeUndefined();
  });
});

describe("Text DSL v0.5 Solidity preset (PR #104)", () => {
  it("type: solidity を受理し、 contract / eoa / event kind を parse", () => {
    const r = parseTextDslV05(`
title: "ERC-20 transfer"
type: solidity

actors:
  - Alice: { kind: eoa }
  - Token: { kind: contract }
  - "Transfer": { kind: event }

flow:
  - Alice -> Token: "transfer(Bob, 10)"
  - Token -> "Transfer": "emit" (success)
`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.doc.type).toBe("solidity");
    expect(r.doc.actors[0]).toMatchObject({ name: "Alice", kind: "eoa" });
    expect(r.doc.actors[1]).toMatchObject({ name: "Token", kind: "contract" });
    expect(r.doc.actors[2]).toMatchObject({ name: "Transfer", kind: "event" });
  });

  it("Solidity preset compile ... lane が EOA / Contract / Storage / Event 順に並ぶ", () => {
    const r = parseTextDslV05(`
title: "ordering test"
type: solidity

actors:
  - logs: { kind: event }
  - balances: { kind: storage }
  - Token: { kind: contract }
  - Alice: { kind: eoa }

flow:
  - Alice -> Token: "call"
`);
    if (!r.ok) throw new Error("parse failed");
    const diagram = compileToCdl(r.doc);
    const laneIds = diagram.lanes.map((l) => l.id);
    // sequence preset 経由なので lane id は actor 名 slugify
    // sort 後の順序: eoa (Alice) -> contract (Token) -> storage (balances) -> event (logs)
    const idxAlice = laneIds.indexOf("alice");
    const idxToken = laneIds.indexOf("token");
    const idxBalances = laneIds.indexOf("balances");
    const idxLogs = laneIds.indexOf("logs");
    expect(idxAlice).toBeLessThan(idxToken);
    expect(idxToken).toBeLessThan(idxBalances);
    expect(idxBalances).toBeLessThan(idxLogs);
  });

  it("kind: multisig / proxy / library / interface も受理", () => {
    const r = parseTextDslV05(`
title: "advanced solidity"
type: solidity

actors:
  - Safe: { kind: multisig }
  - Proxy: { kind: proxy }
  - SafeMath: { kind: library }
  - IERC20: { kind: interface }

flow:
  - Safe -> Proxy: "delegatecall"
`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.doc.actors[0]!.kind).toBe("multisig");
    expect(r.doc.actors[1]!.kind).toBe("proxy");
    expect(r.doc.actors[2]!.kind).toBe("library");
    expect(r.doc.actors[3]!.kind).toBe("interface");
  });
});

describe("Text DSL v0.5 新規 5 preset (PR Gantt/Class/Pie/C4/Mind)", () => {
  it("type: gantt を受理し compile が CdlDiagram を返す", () => {
    const diagram = textDslToDiagram(`
title: "ロードマップ"
type: gantt

actors:
  - task1: { kind: card, subtitle: "Q1" }
  - task2: { kind: card, subtitle: "Q2" }

flow:
  - task1 -> task2: "depends"
`);
    expect(diagram).toBeDefined();
    expect(diagram.lanes.length).toBeGreaterThanOrEqual(2);
  });

  it("type: class を受理し subtitle / rows が node に反映", () => {
    const r = parseTextDslV05(`
title: "UML"
type: class

actors:
  - User: { kind: card, subtitle: "+name: string", rows: ["+login(): void"] }
  - Admin: { kind: card, subtitle: "+role: string" }

flow:
  - User -> Admin: "extends"
`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.doc.type).toBe("class");
    expect(r.doc.actors[0]).toMatchObject({
      name: "User", subtitle: "+name: string", rows: ["+login(): void"],
    });
    const diagram = compileToCdl(r.doc);
    expect(diagram).toBeDefined();
  });

  it("type: pie を受理し value 属性が actor に保持される", () => {
    const r = parseTextDslV05(`
title: "シェア"
type: pie

actors:
  - A: { kind: card, value: "30%" }
  - B: { kind: card, value: "70%" }
`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.doc.type).toBe("pie");
    expect(r.doc.actors[0]).toMatchObject({ name: "A", value: "30%" });
    const diagram = compileToCdl(r.doc);
    expect(diagram).toBeDefined();
  });

  it("type: c4 を受理し person / api / database kind を保持", () => {
    const r = parseTextDslV05(`
title: "C4 context"
type: c4

actors:
  - User: { kind: person }
  - API: { kind: api }
  - DB: { kind: database }

flow:
  - User -> API: "calls"
  - API -> DB: "reads"
`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.doc.type).toBe("c4");
    expect(r.doc.actors[0]!.kind).toBe("person");
    expect(r.doc.actors[1]!.kind).toBe("api");
    const diagram = compileToCdl(r.doc);
    expect(diagram).toBeDefined();
  });

  it("type: mind を受理し flow 空時に root → leaf の暗黙 edge を生成", () => {
    const r = parseTextDslV05(`
title: "アイデア"
type: mind

actors:
  - Core: { kind: card }
  - Idea1: { kind: card }
  - Idea2: { kind: card }
`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.doc.type).toBe("mind");
    const diagram = compileToCdl(r.doc);
    expect(diagram).toBeDefined();
    // 暗黙 edge ... Core → Idea1, Core → Idea2 が 2 本生成
    expect(diagram.edges.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Text DSL v0.5 新規 5 preset structure (専用 layout 検証)", () => {
  // gantt / pie / mind は flow `->` がない最小入力もあり得るため
  // textDslToDiagram の v0.5 auto-detect (`-> 検出経路) では fallback して旧 parser に
  // 行きうる。 新 preset の structure 検証は parseTextDslV05 + compileToCdl 直接経路で行う。

  it("gantt: 各 actor が card kind で個別 lane に stack 配置される", () => {
    const r = parseTextDslV05(`
title: "ロードマップ"
type: gantt

actors:
  - task1: { kind: card, subtitle: "Q1" }
  - task2: { kind: card, subtitle: "Q2" }
  - task3: { kind: card, subtitle: "Q3" }
`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const diagram = compileToCdl(r.doc);
    // 背景 lane (gantt-timeline) + 各 task 用 lane (3 本) = 4 本
    expect(diagram.lanes).toHaveLength(4);
    expect(diagram.lanes[0]!.id).toBe("gantt-timeline");
    expect(diagram.lanes[1]!.id).toBe("gantt-task1");
    // 全 task node が card kind
    expect(diagram.nodes.every((n) => n.kind === "card")).toBe(true);
    expect(diagram.nodes).toHaveLength(3);
    // 各 task は独立 stack (上下並び)
    const stacks = diagram.nodes.map((n) => n.stack).sort((a, b) => a - b);
    expect(stacks).toEqual([0, 1, 2]);
    // 横棒 size を明示 (TASK_W=280 / TASK_H=64)
    expect(diagram.nodes.every((n) => n.w === 280 && n.h === 64)).toBe(true);
  });

  it("class: 各 actor が storage kind に強制され rows 表示が可能", () => {
    const r = parseTextDslV05(`
title: "UML"
type: class

actors:
  - User: { kind: card, subtitle: "+name: string", rows: ["+login(): void", "+logout(): void"] }
  - Admin: { kind: card }

flow:
  - User -> Admin: "extends"
`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const diagram = compileToCdl(r.doc);
    // 1 lane に縦 stack
    expect(diagram.lanes).toHaveLength(1);
    expect(diagram.lanes[0]!.id).toBe("class-stack");
    // 全 actor は storage kind に強制 (UML class box 表示)
    expect(diagram.nodes.every((n) => n.kind === "storage")).toBe(true);
    expect(diagram.nodes).toHaveLength(2);
    // rows が User node に反映 (applyV05Extensions 経由)
    const userNode = diagram.nodes.find((n) => n.id === "user");
    expect(userNode?.rows).toEqual(["+login(): void", "+logout(): void"]);
    // 継承 edge が描かれる
    expect(diagram.edges).toHaveLength(1);
    expect(diagram.edges[0]!.label).toBe("extends");
  });

  it("pie: 各 actor が card kind で 1 lane に slice 縦並びされ value が反映", () => {
    const r = parseTextDslV05(`
title: "シェア"
type: pie

actors:
  - SliceA: { kind: card, value: "30%" }
  - SliceB: { kind: card, value: "25%" }
  - SliceC: { kind: card, value: "45%" }
`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const diagram = compileToCdl(r.doc);
    // 1 lane (pie-slices) に slice 縦並び
    expect(diagram.lanes).toHaveLength(1);
    expect(diagram.lanes[0]!.id).toBe("pie-slices");
    // 全 slice は card kind
    expect(diagram.nodes.every((n) => n.kind === "card")).toBe(true);
    expect(diagram.nodes).toHaveLength(3);
    // value が各 node に反映 (% 表示が pie chart の意図)
    const sliceA = diagram.nodes.find((n) => n.id === "slicea");
    expect(sliceA?.value).toBe("30%");
  });

  it("c4: subtitle L1/L2/L3 で 3 段 lane に配置 + group container 存在", () => {
    const r = parseTextDslV05(`
title: "C4 context"
type: c4

actors:
  - User: { kind: person, subtitle: "L1" }
  - System: { kind: service, subtitle: "L1" }
  - Frontend: { kind: frontend, subtitle: "L2" }
  - Backend: { kind: backend, subtitle: "L2" }
  - DB: { kind: database, subtitle: "L3" }

flow:
  - User -> System: "uses"
`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const diagram = compileToCdl(r.doc);
    // 3 段の lane (L1 / L2 / L3) + contain
    expect(diagram.lanes).toHaveLength(3);
    expect(diagram.lanes.map((l) => l.id)).toEqual(["c4-l1", "c4-l2", "c4-l3"]);
    expect(diagram.lanes.every((l) => l.contain === true)).toBe(true);
    // 各 actor は対応 L lane に配置
    const userNode = diagram.nodes.find((n) => n.id === "user");
    expect(userNode?.lane).toBe("c4-l1");
    const frontendNode = diagram.nodes.find((n) => n.id === "frontend");
    expect(frontendNode?.lane).toBe("c4-l2");
    const dbNode = diagram.nodes.find((n) => n.id === "db");
    expect(dbNode?.lane).toBe("c4-l3");
    // edge が描かれる
    expect(diagram.edges).toHaveLength(1);
  });

  it("mind: root を中央 lane、 leaf を左右 lane に交互配置 + edge 自動生成", () => {
    const r = parseTextDslV05(`
title: "アイデア"
type: mind

actors:
  - Core: { kind: card }
  - Idea1: { kind: card }
  - Idea2: { kind: card }
  - Idea3: { kind: card }
  - Idea4: { kind: card }
`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const diagram = compileToCdl(r.doc);
    // 3 lane (left / center / right)
    expect(diagram.lanes).toHaveLength(3);
    expect(diagram.lanes.map((l) => l.id)).toEqual(["mind-left", "mind-center", "mind-right"]);
    // root は center lane
    const rootNode = diagram.nodes.find((n) => n.id === "core");
    expect(rootNode?.lane).toBe("mind-center");
    // leaf は左右交互配置 (Idea1 → left、 Idea2 → right、 Idea3 → left、 Idea4 → right)
    expect(diagram.nodes.find((n) => n.id === "idea1")?.lane).toBe("mind-left");
    expect(diagram.nodes.find((n) => n.id === "idea2")?.lane).toBe("mind-right");
    expect(diagram.nodes.find((n) => n.id === "idea3")?.lane).toBe("mind-left");
    expect(diagram.nodes.find((n) => n.id === "idea4")?.lane).toBe("mind-right");
    // 全 node は card kind
    expect(diagram.nodes.every((n) => n.kind === "card")).toBe(true);
    // 暗黙 edge ... root → 各 leaf の 4 本
    expect(diagram.edges).toHaveLength(4);
    expect(diagram.edges.every((e) => e.from === "core")).toBe(true);
  });
});

describe("Text DSL v0.5 viewport.gap 細粒度 field (PR #102 拡張)", () => {
  it("viewport.laneGap / nodeGap / labelMargin が CdlDiagram.viewport に反映 (inline mapping)", () => {
    const r = parseTextDslV05(`
title: "gap test"
type: swimlane
viewport: { laneGap: 120, nodeGap: 32, labelMargin: 16 }
actors:
  - A
  - B
flow:
  - A -> B: "msg"
`);
    if (!r.ok) throw new Error("parse failed");
    const d = compileToCdl(r.doc);
    expect(d.viewport).toMatchObject({ laneGap: 120, nodeGap: 32, labelMargin: 16 });
  });

  it("viewport.laneGap が layout の lanes 間 horizontal gap に反映される", () => {
    const r = parseTextDslV05(`
title: "lane gap"
type: swimlane
viewport: { laneGap: 200 }
actors:
  - A
  - B
flow:
  - A -> B: "msg"
`);
    if (!r.ok) throw new Error("parse failed");
    const d = compileToCdl(r.doc);
    const laid = layoutFromSrc(d);
    // swimlane preset で 2 lane 横並び、 lane.width は engine の expand で確定。
    // lane[0] 右端 + 200 = lane[1] 左端 になることを検証 (laneGap 200 が auto 配置に反映)。
    const l0 = laid.lanes[0]!;
    const l1 = laid.lanes[1]!;
    expect(l1.x - (l0.x + l0.width)).toBe(200);
  });

  it("viewport.gap だけ指定時は laneGap / nodeGap / labelMargin の fallback として使われる", () => {
    const r = parseTextDslV05(`
title: "fallback test"
type: swimlane
viewport: { gap: 150 }
actors:
  - A
  - B
flow:
  - A -> B: "msg"
`);
    if (!r.ok) throw new Error("parse failed");
    const d = compileToCdl(r.doc);
    const laid = layoutFromSrc(d);
    const l0 = laid.lanes[0]!;
    const l1 = laid.lanes[1]!;
    // viewport.gap=150 が laneGap の fallback として効くこと
    expect(l1.x - (l0.x + l0.width)).toBe(150);
  });

  it("block 形式 viewport も laneGap / nodeGap / labelMargin を parse", () => {
    const r = parseTextDslV05(`
title: "block viewport"
type: flow

viewport:
  width: 1400
  laneGap: 90
  nodeGap: 28
  labelMargin: 12

actors:
  - A
  - B

flow:
  - A -> B
`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.doc.viewport).toMatchObject({ width: 1400, laneGap: 90, nodeGap: 28, labelMargin: 12 });
  });
});

describe("Text DSL v0.5 inline option compile reflection (PR #105)", () => {
  it("labelOffsetX / labelOffsetY が CdlEdge に反映 (swimlane preset)", () => {
    const r = parseTextDslV05(`
title: "offset demo"
type: swimlane

actors:
  - Alice
  - Bob

flow:
  - Alice -> Bob: "send" { labelOffsetX: 12, labelOffsetY: -8 }
`);
    if (!r.ok) throw new Error("parse failed");
    const diagram = compileToCdl(r.doc);
    const edge = diagram.edges.find((e) => e.from === "alice" && e.to === "bob");
    expect(edge).toBeDefined();
    expect(edge!.labelOffsetX).toBe(12);
    expect(edge!.labelOffsetY).toBe(-8);
  });

  it("guard が CdlEdge.guard に反映 (state preset、 sub にも同期)", () => {
    const r = parseTextDslV05(`
title: "guard demo"
type: state

actors:
  - Idle: { kind: state, initial: true }
  - Done: { kind: state, final: true }

flow:
  - Idle -> Done: "submit" { guard: "isValid" }
`);
    if (!r.ok) throw new Error("parse failed");
    const diagram = compileToCdl(r.doc);
    const edge = diagram.edges.find((e) => e.from === "idle" && e.to === "done");
    expect(edge).toBeDefined();
    expect(edge!.guard).toBe("isValid");
    // FSM preset では guard を sub にも同期 (旧挙動互換)
    expect(edge!.sub).toBe("isValid");
  });

  it("cardinality が ER preset の edge label に '(1:N)' 形式で含まれる", () => {
    const r = parseTextDslV05(`
title: "er card"
type: er

actors:
  - User: entity
  - Order: entity

flow:
  - User -> Order: "places" { cardinality: "1:N" }
`);
    if (!r.ok) throw new Error("parse failed");
    const diagram = compileToCdl(r.doc);
    const edge = diagram.edges.find((e) => e.from === "user" && e.to === "order");
    expect(edge).toBeDefined();
    expect(edge!.cardinality).toBe("1:N");
    expect(edge!.label).toContain("(1:N)");
  });

  it("topology の group が contain: true の lane として生成される", () => {
    const r = parseTextDslV05(`
title: "topo groups"
type: topology

groups:
  aws: { label: "AWS Cloud", lanes: [alb, ecs] }

actors:
  - alb: service
  - ecs: service

flow:
  - alb -> ecs: "route"
`);
    if (!r.ok) throw new Error("parse failed");
    const diagram = compileToCdl(r.doc);
    const group = diagram.lanes.find((l) => l.id === "group-aws");
    expect(group).toBeDefined();
    expect(group!.contain).toBe(true);
    expect(group!.label).toBe("AWS Cloud");
  });
});

describe("storage / class rows の column 揃え + width 自動拡張 (DB table 風)", () => {
  it("storage rows の left / right 自動揃え (DB table 風)", () => {
    // 課題仕様 ... 各 row を delimiter (`:` / `=` / `→` / `->`) で left / right に分割し、
    // 左列 max 幅 + 右列 max 幅 + padding から node.w を自動拡張する。
    // 検証は layout 後の LaidNode の w field で行う (render 層は同 w を 2 column grid で配置)。
    // 短い rows (alice:100 等) は default 400 を保つ ... requiredRowsWidth = 26 + (7+6)*11 + 16 + 26 = 211 < 400
    const d = buildDiagram("rows-test", { topic: "rows test" })
      .lane("l", { x: 0, width: 400 })
      .node("balances", {
        lane: "l",
        stack: 0,
        kind: "storage",
        title: "balances",
        rows: ["alice: 100", "bob: 0", "charlie: 999999"],
      })
      .build();
    const laid = layoutFromSrc(d);
    const node = laid.nodes.find((n) => n.id === "balances");
    expect(node).toBeDefined();
    expect(node!.rows?.length).toBe(3);
    expect(node!.w).toBe(400);
  });

  it("storage rows ... 長い row があれば node.w が必要幅まで自動拡張 (charlie: 999999 超え)", () => {
    // 18 chars (alice_long_address) + 21 chars (100000000000000000000) = 39 chars × 11px + padding (68) = 497px
    // default 400 から確実に拡張される
    const d = buildDiagram("rows-wide", { topic: "wide rows" })
      .lane("l", { x: 0, width: 400 })
      .node("bal", {
        lane: "l",
        stack: 0,
        kind: "storage",
        title: "balances",
        rows: ["alice_long_address: 100000000000000000000", "bob: 0", "charlie: 1"],
      })
      .build();
    const laid = layoutFromSrc(d);
    const node = laid.nodes.find((n) => n.id === "bal");
    expect(node!.w).toBeGreaterThan(400);
    // 過度な拡張ではない (39 chars × 11 + 68 = 497 程度)
    expect(node!.w).toBeLessThan(600);
  });

  it("storage rows ... 著者が n.w を明示時は尊重 (catalog thumbnail 縮小互換)", () => {
    const d = buildDiagram("rows-explicit-w", { topic: "explicit w" })
      .lane("l", { x: 0, width: 800 })
      .node("bal", {
        lane: "l",
        stack: 0,
        kind: "storage",
        title: "balances",
        w: 600, // 著者明示
        rows: ["alice: 1"],
      })
      .build();
    const laid = layoutFromSrc(d);
    const node = laid.nodes.find((n) => n.id === "bal");
    expect(node!.w).toBe(600);
  });

  it("storage rows ... rows なしなら default w を維持", () => {
    const d = buildDiagram("rows-none", { topic: "no rows" })
      .lane("l", { x: 0, width: 400 })
      .node("bal", {
        lane: "l",
        stack: 0,
        kind: "storage",
        title: "balances",
      })
      .build();
    const laid = layoutFromSrc(d);
    const node = laid.nodes.find((n) => n.id === "bal");
    expect(node!.w).toBe(400);
  });

  it("class preset (UML) ... rows / subtitle が node に正しく反映 (compile chain 回帰)", () => {
    // class preset は CLASS_W=400 を node の w に明示渡しするため、 著者明示経路として
    // autoRowsWidth は素通り。 row の column 揃えは render 層で発火する。
    const r = parseTextDslV05(`
title: "UML"
type: class
actors:
  - User: { kind: card, subtitle: "+name: string", rows: ["+veryLongMethodNameHere(): Promise<void>", "+short(): void"] }
  - Admin: { kind: card }
flow:
  - User -> Admin: "extends"
`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const compiled = compileToCdl(r.doc);
    const userNode = compiled.nodes.find((n) => n.id === "user");
    expect(userNode).toBeDefined();
    expect(userNode!.w).toBe(400);
    expect(userNode!.rows).toEqual([
      "+veryLongMethodNameHere(): Promise<void>",
      "+short(): void",
    ]);
  });

  it("storage rows ... delimiter `=` / `->` も left / right 分割対象", () => {
    // requiredRowsWidth は ` = ` / ` -> ` も検出するので、 = / → / -> delimited row も auto 拡張
    const d = buildDiagram("rows-mixed-delim", { topic: "mixed delim" })
      .lane("l", { x: 0, width: 400 })
      .node("vars", {
        lane: "l",
        stack: 0,
        kind: "storage",
        title: "vars",
        rows: [
          "really_long_left_label = 999999999999999",
          "x -> y",
          "z: 1",
        ],
      })
      .build();
    const laid = layoutFromSrc(d);
    const node = laid.nodes.find((n) => n.id === "vars");
    // really_long_left_label (22) + 999999999999999 (15) = 37 chars × 11 + 68 = 475px > 400
    expect(node!.w).toBeGreaterThan(400);
  });
});
