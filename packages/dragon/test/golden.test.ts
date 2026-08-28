/**
 * Golden test ... DSL → compile → layout の構造 fingerprint snapshot regression test。
 *
 * 7 preset (sequence / flow / swimlane / topology / er / state / solidity) × 各 10-15 case
 * = 100 件の snapshot で DSL parser + compile + layout の組合せ regression を検出する。
 *
 * 実 SVG 文字列ではなく構造 fingerprint (lane / node / edge 数 + 位置 + viewBox) を snapshot
 * する設計。 実 SVG snapshot は冗長 + diff 読みづらい一方、 構造 fingerprint は regression を
 * 意味的に把握できる。
 *
 * fingerprint 算出 = textDslToDiagram → layout を一気通貫、 cx は Math.round で安定化。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "@cardenelabs/dragon";
import { layout } from "@cardenelabs/cdl";

function fingerprint(src: string) {
  const diagram = textDslToDiagram(src);
  const laid = layout(diagram);
  return {
    id: diagram.id,
    topic: diagram.topic,
    viewBox: laid.viewBox,
    lanes: laid.lanes.map((l) => ({
      id: l.id,
      x: l.x,
      y: l.y,
      width: l.width,
      height: l.height,
    })),
    nodes: laid.nodes.map((n) => ({
      id: n.id,
      kind: n.kind,
      cx: Math.round(n.cx),
      cy: Math.round(n.cy),
      w: n.w,
      h: n.h,
    })),
    edges: laid.edges.map((e) => ({
      id: e.id,
      from: e.from,
      to: e.to,
      label: e.label,
    })),
    states: diagram.states.map((s) => ({ id: s.id, initial: s.initial })),
    phases: diagram.phases.map((p) => ({ id: p.id, duration_ms: p.duration })),
  };
}

// ─── sequence preset (15 件) ─────
describe("golden: sequence preset", () => {
  it("S01 minimal 1 actor + 自分宛ては輪として残る (#1227 → #1462)", () => {
    // 描画側が輪として描けるようになった (`cdl#560`、0.15.0)。 矢印が残ることを固定する
    expect(
      fingerprint(`
title: "S01"
type: sequence

actors:
  - Alice

flow:
  - Alice -> Alice: "noop"
`),
    ).toMatchSnapshot();
  });

  it("S02 2 actor", () => {
    expect(
      fingerprint(`
title: "S02"
type: sequence

actors:
  - Alice
  - Bob

flow:
  - Alice -> Bob: "hello"
`),
    ).toMatchSnapshot();
  });

  it("S03 3 actor", () => {
    expect(
      fingerprint(`
title: "S03"
type: sequence

actors:
  - Alice
  - Vault: storage
  - Bob

flow:
  - Alice -> Vault: "deposit"
  - Vault -> Bob: "send"
`),
    ).toMatchSnapshot();
  });

  it("S04 3 actor + tween animation", () => {
    expect(
      fingerprint(`
title: "S04"
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
  - step: "in" 1.5s
    focus: [Alice, Vault]
    tween:
      alice_bal: 100 -> 90
    badge: "in"
  - step: "out" 1.5s
    focus: [Vault, Bob]
    tween:
      bob_bal: 0 -> 10
    badge: "out"
`),
    ).toMatchSnapshot();
  });

  it("S05 actor inline option (subtitle / eyebrow)", () => {
    expect(
      fingerprint(`
title: "S05"
type: sequence

actors:
  - Alice: { kind: actor, subtitle: "送り手", eyebrow: "User" }
  - Bob: { kind: actor, subtitle: "受け手" }

flow:
  - Alice -> Bob: "tap"
`),
    ).toMatchSnapshot();
  });

  it("S06 actor with value placeholder", () => {
    expect(
      fingerprint(`
title: "S06"
type: sequence

actors:
  - Counter: { kind: actor, value: "{count}" }
  - User

states:
  count: 0

flow:
  - User -> Counter: "increment"
`),
    ).toMatchSnapshot();
  });

  it("S07 4 actor pipeline", () => {
    expect(
      fingerprint(`
title: "S07"
type: sequence

actors:
  - A
  - B
  - C
  - D

flow:
  - A -> B: "1"
  - B -> C: "2"
  - C -> D: "3"
`),
    ).toMatchSnapshot();
  });

  it("S08 tone variation per edge", () => {
    expect(
      fingerprint(`
title: "S08"
type: sequence

actors:
  - Client
  - Server

flow:
  - Client -> Server: "req" (info)
  - Server -> Client: "ok" (success)
  - Client -> Server: "again" (warning)
  - Server -> Client: "fail" (error)
`),
    ).toMatchSnapshot();
  });

  it("S09 set (string state) animation", () => {
    expect(
      fingerprint(`
title: "S09"
type: sequence

actors:
  - Api: function
  - Db: database

flow:
  - Api -> Db: "verify"

states:
  status: "idle"

animation:
  - step: "submit" 0.8s
    focus: [Api]
    set:
      status: "loading"
  - step: "done" 1.2s
    focus: [Api]
    set:
      status: "done"
`),
    ).toMatchSnapshot();
  });

  it("S10 storage actor rows", () => {
    expect(
      fingerprint(`
title: "S10"
type: sequence

actors:
  - Alice
  - balances: { kind: storage, rows: ["Alice: {a}", "Bob: {b}"] }
  - Bob

states:
  a: 100
  b: 0

flow:
  - Alice -> balances: "read"
  - balances -> Bob: "write"
`),
    ).toMatchSnapshot();
  });

  it("S11 5 actor wide diagram", () => {
    expect(
      fingerprint(`
title: "S11"
type: sequence

actors:
  - A
  - B
  - C
  - D
  - E

flow:
  - A -> B: "a"
  - B -> C: "b"
  - C -> D: "c"
  - D -> E: "d"
  - E -> A: "back"
`),
    ).toMatchSnapshot();
  });

  it("S12 sub label on edge", () => {
    expect(
      fingerprint(`
title: "S12"
type: sequence

actors:
  - X
  - Y

flow:
  - X -> Y: "call" { sub: "100ms" }
  - Y -> X: "ack" { sub: "10ms" }
`),
    ).toMatchSnapshot();
  });

  it("S13 labelOffset fine adjust", () => {
    expect(
      fingerprint(`
title: "S13"
type: sequence

actors:
  - P
  - Q

flow:
  - P -> Q: "go" { labelOffsetY: -8, labelOffsetX: 4 }
`),
    ).toMatchSnapshot();
  });

  it("S14 viewport explicit width / height", () => {
    expect(
      fingerprint(`
title: "S14"
type: sequence

viewport: { width: 1600, height: 900 }

actors:
  - L
  - R

flow:
  - L -> R: "msg"
`),
    ).toMatchSnapshot();
  });

  it("S15 multi-phase animation", () => {
    expect(
      fingerprint(`
title: "S15"
type: sequence

actors:
  - Cli
  - Srv
  - Db: database

flow:
  - Cli -> Srv: "req"
  - Srv -> Db: "query"
  - Db -> Srv: "row"
  - Srv -> Cli: "resp"

states:
  n: 0

animation:
  - step: "p1" 1s
    focus: [Cli, Srv]
    tween:
      n: 0 -> 25
    badge: "phase1"
  - step: "p2" 1s
    focus: [Srv, Db]
    tween:
      n: 25 -> 50
    badge: "phase2"
  - step: "p3" 1s
    focus: [Db, Srv]
    tween:
      n: 50 -> 75
    badge: "phase3"
  - step: "p4" 1s
    focus: [Srv, Cli]
    tween:
      n: 75 -> 100
    badge: "phase4"
`),
    ).toMatchSnapshot();
  });
});

// ─── flow preset (15 件) ─────
describe("golden: flow preset", () => {
  it("F01 minimal 1 step", () => {
    expect(
      fingerprint(`
title: "F01"
type: flow

actors:
  - Start: event

flow:
  - Start -> Start: "self"
`),
    ).toMatchSnapshot();
  });

  it("F02 2 step", () => {
    expect(
      fingerprint(`
title: "F02"
type: flow

actors:
  - Start: event
  - End: event

flow:
  - Start -> End: "go"
`),
    ).toMatchSnapshot();
  });

  it("F03 4 step linear", () => {
    expect(
      fingerprint(`
title: "F03"
type: flow

actors:
  - Start: event
  - Verify: function
  - Save: function
  - Done: event

flow:
  - Start -> Verify: "input"
  - Verify -> Save: "ok"
  - Save -> Done: "saved"
`),
    ).toMatchSnapshot();
  });

  it("F04 6 step + tween", () => {
    expect(
      fingerprint(`
title: "F04"
type: flow

actors:
  - S0: event
  - S1: function
  - S2: function
  - S3: function
  - S4: function
  - S5: event

flow:
  - S0 -> S1: "1"
  - S1 -> S2: "2"
  - S2 -> S3: "3"
  - S3 -> S4: "4"
  - S4 -> S5: "5"

states:
  step: 0

animation:
  - step: "advance" 2s
    focus: [S0, S5]
    tween:
      step: 0 -> 5
    badge: "running"
`),
    ).toMatchSnapshot();
  });

  it("F05 tone variation (info / success / warning / error)", () => {
    expect(
      fingerprint(`
title: "F05"
type: flow

actors:
  - A: function
  - B: function
  - C: function
  - D: function

flow:
  - A -> B: "ok" (info)
  - B -> C: "good" (success)
  - C -> D: "warn" (warning)
  - D -> A: "loop" (error)
`),
    ).toMatchSnapshot();
  });

  it("F06 branching (1 → 2)", () => {
    expect(
      fingerprint(`
title: "F06"
type: flow

actors:
  - Input: event
  - Path1: function
  - Path2: function

flow:
  - Input -> Path1: "left"
  - Input -> Path2: "right"
`),
    ).toMatchSnapshot();
  });

  it("F07 merging (2 → 1)", () => {
    expect(
      fingerprint(`
title: "F07"
type: flow

actors:
  - A: function
  - B: function
  - Sink: event

flow:
  - A -> Sink: "in1"
  - B -> Sink: "in2"
`),
    ).toMatchSnapshot();
  });

  it("F08 step with guard", () => {
    expect(
      fingerprint(`
title: "F08"
type: flow

actors:
  - Check: function
  - Go: event
  - Stop: event

flow:
  - Check -> Go: "pass" { guard: "isAdmin" }
  - Check -> Stop: "deny"
`),
    ).toMatchSnapshot();
  });

  it("F09 inline option mix", () => {
    expect(
      fingerprint(`
title: "F09"
type: flow

actors:
  - Login: { kind: function, subtitle: "認証" }
  - Profile: { kind: function, eyebrow: "User" }

flow:
  - Login -> Profile: "ok" { sub: "200ms" }
`),
    ).toMatchSnapshot();
  });

  it("F10 multi-phase with set", () => {
    expect(
      fingerprint(`
title: "F10"
type: flow

actors:
  - Boot: event
  - Run: function
  - Halt: event

flow:
  - Boot -> Run: "start"
  - Run -> Halt: "end"

states:
  mode: "init"

animation:
  - step: "boot" 1s
    focus: [Boot, Run]
    set:
      mode: "running"
  - step: "halt" 1s
    focus: [Run, Halt]
    set:
      mode: "halted"
`),
    ).toMatchSnapshot();
  });

  it("F11 8 step long pipeline", () => {
    expect(
      fingerprint(`
title: "F11"
type: flow

actors:
  - n1: function
  - n2: function
  - n3: function
  - n4: function
  - n5: function
  - n6: function
  - n7: function
  - n8: function

flow:
  - n1 -> n2: "a"
  - n2 -> n3: "b"
  - n3 -> n4: "c"
  - n4 -> n5: "d"
  - n5 -> n6: "e"
  - n6 -> n7: "f"
  - n7 -> n8: "g"
`),
    ).toMatchSnapshot();
  });

  it("F12 viewport with gap override", () => {
    expect(
      fingerprint(`
title: "F12"
type: flow

viewport: { width: 1800, height: 600, gap: 120 }

actors:
  - A: function
  - B: function
  - C: function

flow:
  - A -> B: "x"
  - B -> C: "y"
`),
    ).toMatchSnapshot();
  });

  it("F13 cyclic back-edge", () => {
    expect(
      fingerprint(`
title: "F13"
type: flow

actors:
  - A: function
  - B: function
  - C: function

flow:
  - A -> B: "1"
  - B -> C: "2"
  - C -> A: "back"
`),
    ).toMatchSnapshot();
  });

  it("F14 single edge with all tones", () => {
    expect(
      fingerprint(`
title: "F14"
type: flow

actors:
  - X: function
  - Y: function

flow:
  - X -> Y: "go" (success)
`),
    ).toMatchSnapshot();
  });

  it("F15 storage + event mixed kinds", () => {
    expect(
      fingerprint(`
title: "F15"
type: flow

actors:
  - In: event
  - Mid: { kind: storage, rows: ["k: {v}"] }
  - Out: event

states:
  v: "x"

flow:
  - In -> Mid: "put"
  - Mid -> Out: "emit"
`),
    ).toMatchSnapshot();
  });
});

// ─── swimlane preset (15 件) ─────
describe("golden: swimlane preset", () => {
  it("L01 2 lane", () => {
    expect(
      fingerprint(`
title: "L01"
type: swimlane

actors:
  - SvcA: service
  - SvcB: service

flow:
  - SvcA -> SvcB: "call"
`),
    ).toMatchSnapshot();
  });

  it("L02 3 lane", () => {
    expect(
      fingerprint(`
title: "L02"
type: swimlane

actors:
  - SvcA: service
  - SvcB: service
  - SvcC: service

flow:
  - SvcA -> SvcB: "dispatch"
  - SvcB -> SvcC: "forward"
`),
    ).toMatchSnapshot();
  });

  it("L03 4 lane with all info tone", () => {
    expect(
      fingerprint(`
title: "L03"
type: swimlane

actors:
  - A: service
  - B: service
  - C: service
  - D: service

flow:
  - A -> B: "1" (info)
  - B -> C: "2" (info)
  - C -> D: "3" (info)
`),
    ).toMatchSnapshot();
  });

  it("L04 inline option subtitle", () => {
    expect(
      fingerprint(`
title: "L04"
type: swimlane

actors:
  - Front: { kind: service, subtitle: "UI" }
  - Back: { kind: service, subtitle: "API" }

flow:
  - Front -> Back: "GET /x"
`),
    ).toMatchSnapshot();
  });

  it("L05 animation focus + badge", () => {
    expect(
      fingerprint(`
title: "L05"
type: swimlane

actors:
  - A: service
  - B: service
  - C: service

flow:
  - A -> B: "dispatch" (info)
  - B -> C: "forward" (success)

animation:
  - step: "p1" 1.5s
    focus: [A, B]
    badge: "A → B"
  - step: "p2" 1.5s
    focus: [B, C]
    badge: "B → C"
`),
    ).toMatchSnapshot();
  });

  it("L06 5 service lane", () => {
    expect(
      fingerprint(`
title: "L06"
type: swimlane

actors:
  - s1: service
  - s2: service
  - s3: service
  - s4: service
  - s5: service

flow:
  - s1 -> s2: "a"
  - s2 -> s3: "b"
  - s3 -> s4: "c"
  - s4 -> s5: "d"
`),
    ).toMatchSnapshot();
  });

  it("L07 mixed kind (api / function)", () => {
    expect(
      fingerprint(`
title: "L07"
type: swimlane

actors:
  - Web: api
  - Worker: function
  - Storage: storage

flow:
  - Web -> Worker: "enqueue"
  - Worker -> Storage: "write"
`),
    ).toMatchSnapshot();
  });

  it("L08 back-edge across lane", () => {
    expect(
      fingerprint(`
title: "L08"
type: swimlane

actors:
  - A: service
  - B: service
  - C: service

flow:
  - A -> B: "forward"
  - B -> C: "next"
  - C -> A: "back"
`),
    ).toMatchSnapshot();
  });

  it("L09 sub label on lane edge", () => {
    expect(
      fingerprint(`
title: "L09"
type: swimlane

actors:
  - L: service
  - R: service

flow:
  - L -> R: "send" { sub: "100ms" }
`),
    ).toMatchSnapshot();
  });

  it("L10 6 lane with viewport", () => {
    expect(
      fingerprint(`
title: "L10"
type: swimlane

viewport: { width: 2400, height: 800 }

actors:
  - a: service
  - b: service
  - c: service
  - d: service
  - e: service
  - f: service

flow:
  - a -> b
  - b -> c
  - c -> d
  - d -> e
  - e -> f
`),
    ).toMatchSnapshot();
  });

  it("L11 tone variation", () => {
    expect(
      fingerprint(`
title: "L11"
type: swimlane

actors:
  - A: service
  - B: service
  - C: service

flow:
  - A -> B: "ok" (success)
  - B -> C: "warn" (warning)
`),
    ).toMatchSnapshot();
  });

  it("L12 with state + tween", () => {
    expect(
      fingerprint(`
title: "L12"
type: swimlane

actors:
  - A: service
  - B: service

flow:
  - A -> B: "send"

states:
  n: 0

animation:
  - step: "tx" 1s
    focus: [A, B]
    tween:
      n: 0 -> 100
    badge: "tx"
`),
    ).toMatchSnapshot();
  });

  it("L13 labelOffset on swimlane", () => {
    expect(
      fingerprint(`
title: "L13"
type: swimlane

actors:
  - A: service
  - B: service

flow:
  - A -> B: "x" { labelOffsetX: 12, labelOffsetY: -10 }
`),
    ).toMatchSnapshot();
  });

  it("L14 single lane 自己ループは輪として残る (#1227 → #1462)", () => {
    expect(
      fingerprint(`
title: "L14"
type: swimlane

actors:
  - Solo: service

flow:
  - Solo -> Solo: "retry"
`),
    ).toMatchSnapshot();
  });

  it("L15 mixed person + service", () => {
    expect(
      fingerprint(`
title: "L15"
type: swimlane

actors:
  - User: person
  - Web: service
  - Api: service

flow:
  - User -> Web: "open"
  - Web -> Api: "fetch"
`),
    ).toMatchSnapshot();
  });
});

// ─── topology preset (10 件) ─────
describe("golden: topology preset", () => {
  it("T01 simple 2 node", () => {
    expect(
      fingerprint(`
title: "T01"
type: topology

actors:
  - Browser: service
  - Api: service

flow:
  - Browser -> Api: "HTTPS"
`),
    ).toMatchSnapshot();
  });

  it("T02 3 node chain", () => {
    expect(
      fingerprint(`
title: "T02"
type: topology

actors:
  - Browser: service
  - API: service
  - DB: database

flow:
  - Browser -> API: "HTTPS"
  - API -> DB: "SQL"
`),
    ).toMatchSnapshot();
  });

  it("T03 with cache layer", () => {
    expect(
      fingerprint(`
title: "T03"
type: topology

actors:
  - Web: service
  - Cache: cache
  - DB: database

flow:
  - Web -> Cache: "GET"
  - Cache -> DB: "MISS"
`),
    ).toMatchSnapshot();
  });

  it("T04 queue + worker", () => {
    expect(
      fingerprint(`
title: "T04"
type: topology

actors:
  - Producer: service
  - Q: queue
  - Worker: service

flow:
  - Producer -> Q: "enqueue"
  - Q -> Worker: "dequeue"
`),
    ).toMatchSnapshot();
  });

  it("T05 cdn + origin", () => {
    expect(
      fingerprint(`
title: "T05"
type: topology

actors:
  - User: person
  - Cdn: cdn
  - Origin: service

flow:
  - User -> Cdn: "GET"
  - Cdn -> Origin: "MISS"
`),
    ).toMatchSnapshot();
  });

  it("T06 microservice mesh", () => {
    expect(
      fingerprint(`
title: "T06"
type: topology

actors:
  - Gw: api
  - Svc1: service
  - Svc2: service
  - Svc3: service

flow:
  - Gw -> Svc1: "/a"
  - Gw -> Svc2: "/b"
  - Gw -> Svc3: "/c"
`),
    ).toMatchSnapshot();
  });

  it("T07 with viewport explicit", () => {
    expect(
      fingerprint(`
title: "T07"
type: topology

viewport: { width: 1600, height: 1000 }

actors:
  - Front: service
  - Mid: service
  - Back: database

flow:
  - Front -> Mid
  - Mid -> Back
`),
    ).toMatchSnapshot();
  });

  it("T08 with top-level lanes group", () => {
    expect(
      fingerprint(`
title: "T08"
type: topology

viewport: { width: 1400, height: 900, laneWidth: 480, gap: 80 }

lanes:
  l1: { x: 0, width: 320, label: "left" }
  aws: { x: 540, width: 460, label: "AWS", contain: true }

groups:
  cloud: { label: "Cloud", lanes: [aws, l1] }

actors:
  - a: service
  - b: service

flow:
  - a -> b: "call"
`),
    ).toMatchSnapshot();
  });

  it("T09 multi-tier (cdn → web → cache → db)", () => {
    expect(
      fingerprint(`
title: "T09"
type: topology

actors:
  - Cdn: cdn
  - Web: service
  - Cache: cache
  - Db: database

flow:
  - Cdn -> Web: "edge"
  - Web -> Cache: "lookup"
  - Cache -> Db: "miss"
`),
    ).toMatchSnapshot();
  });

  it("T10 7 node fan-out", () => {
    expect(
      fingerprint(`
title: "T10"
type: topology

actors:
  - Hub: service
  - A: service
  - B: service
  - C: service
  - D: service
  - E: service
  - F: service

flow:
  - Hub -> A
  - Hub -> B
  - Hub -> C
  - Hub -> D
  - Hub -> E
  - Hub -> F
`),
    ).toMatchSnapshot();
  });
});

// ─── ER preset (10 件) ─────
describe("golden: er preset", () => {
  it("E01 minimal 2 entity 1 relation", () => {
    expect(
      fingerprint(`
title: "E01"
type: er

actors:
  - User: entity
  - Order: entity

flow:
  - User -> Order: "places"
`),
    ).toMatchSnapshot();
  });

  it("E02 3 entity (User / Order / Product)", () => {
    expect(
      fingerprint(`
title: "E02"
type: er

actors:
  - User: entity
  - Order: entity
  - Product: entity

flow:
  - User -> Order: "places"
  - Order -> Product: "contains"
`),
    ).toMatchSnapshot();
  });

  it("E03 cardinality 1:N", () => {
    expect(
      fingerprint(`
title: "E03"
type: er

actors:
  - User: entity
  - Order: entity

flow:
  - User -> Order: "places" { cardinality: "1:N" }
`),
    ).toMatchSnapshot();
  });

  it("E04 cardinality N:N", () => {
    expect(
      fingerprint(`
title: "E04"
type: er

actors:
  - Student: entity
  - Course: entity

flow:
  - Student -> Course: "enrolls" { cardinality: "N:N" }
`),
    ).toMatchSnapshot();
  });

  it("E05 entity with subtitle", () => {
    expect(
      fingerprint(`
title: "E05"
type: er

actors:
  - User: { kind: entity, subtitle: "ユーザー" }
  - Order: { kind: entity, subtitle: "注文" }

flow:
  - User -> Order: "places" (info)
`),
    ).toMatchSnapshot();
  });

  it("E06 4 entity ring", () => {
    expect(
      fingerprint(`
title: "E06"
type: er

actors:
  - A: entity
  - B: entity
  - C: entity
  - D: entity

flow:
  - A -> B: "ab"
  - B -> C: "bc"
  - C -> D: "cd"
  - D -> A: "da"
`),
    ).toMatchSnapshot();
  });

  it("E07 1:1 relation", () => {
    expect(
      fingerprint(`
title: "E07"
type: er

actors:
  - User: entity
  - Profile: entity

flow:
  - User -> Profile: "has" { cardinality: "1:1" }
`),
    ).toMatchSnapshot();
  });

  it("E08 cardinality animation badge", () => {
    // animation path requires NodeKind (entity is a preset alias, not a NodeKind)
    // so use kind: card for actor inline option, kept in the generic-animate path.
    expect(
      fingerprint(`
title: "E08"
type: er

actors:
  - User: { kind: card }
  - Order: { kind: card }

flow:
  - User -> Order: "places" (info)

animation:
  - step: "show" 1s
    focus: [User, Order]
    badge: "1:N"
`),
    ).toMatchSnapshot();
  });

  it("E09 自己参照は輪として残る (#1227 → #1462)", () => {
    expect(
      fingerprint(`
title: "E09"
type: er

actors:
  - Employee: entity

flow:
  - Employee -> Employee: "manages" { cardinality: "1:N" }
`),
    ).toMatchSnapshot();
  });

  it("E10 5 entity star schema", () => {
    expect(
      fingerprint(`
title: "E10"
type: er

actors:
  - Fact: entity
  - DimA: entity
  - DimB: entity
  - DimC: entity
  - DimD: entity

flow:
  - Fact -> DimA: "a"
  - Fact -> DimB: "b"
  - Fact -> DimC: "c"
  - Fact -> DimD: "d"
`),
    ).toMatchSnapshot();
  });
});

// ─── state machine preset (10 件) ─────
describe("golden: state preset", () => {
  it("M01 minimal Idle → Done", () => {
    expect(
      fingerprint(`
title: "M01"
type: state

actors:
  - Idle: { kind: state, initial: true }
  - Done: { kind: state, final: true }

flow:
  - Idle -> Done: "go"
`),
    ).toMatchSnapshot();
  });

  it("M02 Idle / Loading / Done", () => {
    expect(
      fingerprint(`
title: "M02"
type: state

actors:
  - Idle: { kind: state, initial: true }
  - Loading: { kind: state }
  - Done: { kind: state, final: true }

flow:
  - Idle -> Loading: "submit"
  - Loading -> Done: "ok"
`),
    ).toMatchSnapshot();
  });

  it("M03 with error path", () => {
    expect(
      fingerprint(`
title: "M03"
type: state

actors:
  - Idle: { kind: state, initial: true }
  - Loading: { kind: state }
  - Done: { kind: state, final: true }
  - Error: { kind: state, final: true }

flow:
  - Idle -> Loading: "submit"
  - Loading -> Done: "success" (success)
  - Loading -> Error: "fail" (error)
`),
    ).toMatchSnapshot();
  });

  it("M04 guard on transition", () => {
    expect(
      fingerprint(`
title: "M04"
type: state

actors:
  - Idle: { kind: state, initial: true }
  - Auth: { kind: state }
  - Denied: { kind: state, final: true }

flow:
  - Idle -> Auth: "login" { guard: "hasCreds" }
  - Idle -> Denied: "noCreds" { guard: "!hasCreds" }
`),
    ).toMatchSnapshot();
  });

  it("M05 cyclic states", () => {
    expect(
      fingerprint(`
title: "M05"
type: state

actors:
  - On: { kind: state, initial: true }
  - Off: { kind: state }

flow:
  - On -> Off: "toggle"
  - Off -> On: "toggle"
`),
    ).toMatchSnapshot();
  });

  it("M06 multiple initial-like layout", () => {
    expect(
      fingerprint(`
title: "M06"
type: state

actors:
  - Start: { kind: state, initial: true }
  - A: { kind: state }
  - B: { kind: state }
  - End: { kind: state, final: true }

flow:
  - Start -> A: "left"
  - Start -> B: "right"
  - A -> End: "ok"
  - B -> End: "ok"
`),
    ).toMatchSnapshot();
  });

  it("M07 with state counter + tween", () => {
    // animation path requires NodeKind (state alias is a preset role, not a NodeKind)
    // so use kind: card for the actor inline option in the generic-animate path.
    expect(
      fingerprint(`
title: "M07"
type: state

actors:
  - Idle: { kind: card }
  - Run: { kind: card }
  - Done: { kind: card }

flow:
  - Idle -> Run: "start"
  - Run -> Done: "end"

states:
  counter: 0

animation:
  - step: "start" 1s
    focus: [Idle, Run]
    tween:
      counter: 0 -> 1
    badge: "+1"
`),
    ).toMatchSnapshot();
  });

  it("M08 5 state diamond", () => {
    expect(
      fingerprint(`
title: "M08"
type: state

actors:
  - S0: { kind: state, initial: true }
  - L: { kind: state }
  - R: { kind: state }
  - Merge: { kind: state }
  - End: { kind: state, final: true }

flow:
  - S0 -> L: "left"
  - S0 -> R: "right"
  - L -> Merge: "join1"
  - R -> Merge: "join2"
  - Merge -> End: "done"
`),
    ).toMatchSnapshot();
  });

  it("M09 自己遷移は輪として残る (#1227 → #1462)", () => {
    expect(
      fingerprint(`
title: "M09"
type: state

actors:
  - Idle: { kind: state, initial: true }
  - Wait: { kind: state }
  - Done: { kind: state, final: true }

flow:
  - Idle -> Wait: "enter"
  - Wait -> Wait: "tick"
  - Wait -> Done: "exit"
`),
    ).toMatchSnapshot();
  });

  it("M10 with set on transition phase", () => {
    // animation path requires NodeKind (state alias is a preset role, not a NodeKind)
    // so use kind: card for the actor inline option in the generic-animate path.
    expect(
      fingerprint(`
title: "M10"
type: state

actors:
  - Idle: { kind: card }
  - Active: { kind: card }
  - Off: { kind: card }

flow:
  - Idle -> Active: "on"
  - Active -> Off: "stop"

states:
  mode: "idle"

animation:
  - step: "on" 1s
    focus: [Idle, Active]
    set:
      mode: "active"
  - step: "off" 1s
    focus: [Active, Off]
    set:
      mode: "off"
`),
    ).toMatchSnapshot();
  });
});

// ─── solidity preset (15 件) ─────
describe("golden: solidity preset", () => {
  it("Y01 ERC-20 transfer basic", () => {
    expect(
      fingerprint(`
title: "Y01"
type: solidity

actors:
  - Alice: { kind: eoa }
  - Token: { kind: contract }
  - Transfer: { kind: event }

flow:
  - Alice -> Token: "transfer(Bob, 10)"
  - Token -> Transfer: "emit" (success)
`),
    ).toMatchSnapshot();
  });

  it("Y02 ERC-20 with storage rows", () => {
    expect(
      fingerprint(`
title: "Y02"
type: solidity

actors:
  - Alice: { kind: eoa }
  - Token: { kind: contract }
  - balances: { kind: storage, rows: ["Alice: {a}", "Bob: {b}"] }

states:
  a: 100
  b: 0

flow:
  - Alice -> Token: "transfer"
  - Token -> balances: "write" (info)
`),
    ).toMatchSnapshot();
  });

  it("Y03 ERC-721 safeTransferFrom", () => {
    expect(
      fingerprint(`
title: "Y03"
type: solidity

actors:
  - Alice: { kind: eoa }
  - Nft: { kind: contract }
  - Receiver: { kind: contract }
  - Transfer: { kind: event }

flow:
  - Alice -> Nft: "safeTransferFrom(Alice, Receiver, 1)"
  - Nft -> Receiver: "onERC721Received"
  - Nft -> Transfer: "emit" (success)
`),
    ).toMatchSnapshot();
  });

  it("Y04 DeFi swap (DEX)", () => {
    expect(
      fingerprint(`
title: "Y04"
type: solidity

actors:
  - Trader: { kind: eoa }
  - Router: { kind: contract }
  - Pool: { kind: contract }
  - Swap: { kind: event }

flow:
  - Trader -> Router: "swapExactTokensForTokens"
  - Router -> Pool: "swap"
  - Pool -> Swap: "emit" (success)
`),
    ).toMatchSnapshot();
  });

  it("Y05 multisig execute", () => {
    expect(
      fingerprint(`
title: "Y05"
type: solidity

actors:
  - Owner1: { kind: eoa }
  - Owner2: { kind: eoa }
  - Safe: { kind: multisig }
  - Target: { kind: contract }

flow:
  - Owner1 -> Safe: "approveHash"
  - Owner2 -> Safe: "approveHash"
  - Safe -> Target: "execTransaction" (success)
`),
    ).toMatchSnapshot();
  });

  it("Y06 proxy delegatecall", () => {
    expect(
      fingerprint(`
title: "Y06"
type: solidity

actors:
  - User: { kind: eoa }
  - Proxy: { kind: proxy }
  - Impl: { kind: contract }

flow:
  - User -> Proxy: "call(data)"
  - Proxy -> Impl: "delegatecall" (warning)
`),
    ).toMatchSnapshot();
  });

  it("Y07 library use", () => {
    expect(
      fingerprint(`
title: "Y07"
type: solidity

actors:
  - User: { kind: eoa }
  - Vault: { kind: contract }
  - SafeMath: { kind: library }

flow:
  - User -> Vault: "deposit(10)"
  - Vault -> SafeMath: "add(a,b)" (info)
`),
    ).toMatchSnapshot();
  });

  it("Y08 interface call", () => {
    expect(
      fingerprint(`
title: "Y08"
type: solidity

actors:
  - Caller: { kind: contract }
  - IERC20: { kind: interface }
  - Token: { kind: contract }

flow:
  - Caller -> IERC20: "IERC20(token).transfer(to, amount)"
  - IERC20 -> Token: "transfer"
`),
    ).toMatchSnapshot();
  });

  it("Y09 ERC-20 with full animation", () => {
    expect(
      fingerprint(`
title: "Y09"
type: solidity

actors:
  - Alice: { kind: eoa, subtitle: "送り手" }
  - Bob: { kind: eoa, subtitle: "受け手" }
  - Token: { kind: contract, subtitle: "ERC-20" }
  - balances: { kind: storage, rows: ["Alice: {a}", "Bob: {b}"] }
  - Transfer: { kind: event }

states:
  a: 100
  b: 0

flow:
  - Alice -> Token: "transfer(Bob, 10)"
  - Token -> balances: "write" (info)
  - Token -> Transfer: "emit" (success)

animation:
  - step: "call" 1s
    focus: [Alice, Token]
    badge: "tx"
  - step: "write" 1s
    focus: [Token, balances]
    tween:
      a: 100 -> 90
      b: 0 -> 10
    badge: "update"
  - step: "emit" 1s
    focus: [Token, Transfer]
    badge: "event"
`),
    ).toMatchSnapshot();
  });

  it("Y10 reentrancy victim shape", () => {
    expect(
      fingerprint(`
title: "Y10"
type: solidity

actors:
  - Attacker: { kind: eoa }
  - Vault: { kind: contract }
  - Drain: { kind: event }

flow:
  - Attacker -> Vault: "withdraw"
  - Vault -> Attacker: "call(value)" (warning)
  - Attacker -> Vault: "withdraw (reentry)" (error)
  - Vault -> Drain: "emit" (error)
`),
    ).toMatchSnapshot();
  });

  it("Y11 ERC-1155 batch transfer", () => {
    expect(
      fingerprint(`
title: "Y11"
type: solidity

actors:
  - Alice: { kind: eoa }
  - Token: { kind: contract }
  - TransferBatch: { kind: event }

flow:
  - Alice -> Token: "safeBatchTransferFrom"
  - Token -> TransferBatch: "emit" (success)
`),
    ).toMatchSnapshot();
  });

  it("Y12 access control onlyOwner", () => {
    expect(
      fingerprint(`
title: "Y12"
type: solidity

actors:
  - Caller: { kind: eoa }
  - Contract: { kind: contract }
  - Revert: { kind: event }

flow:
  - Caller -> Contract: "adminOp" { guard: "msg.sender == owner" }
  - Contract -> Revert: "revert" (error)
`),
    ).toMatchSnapshot();
  });

  it("Y13 bridge node + relayer", () => {
    expect(
      fingerprint(`
title: "Y13"
type: solidity

actors:
  - User: { kind: eoa }
  - L1: { kind: contract, subtitle: "Ethereum" }
  - L2: { kind: contract, subtitle: "Rollup" }

flow:
  - User -> L1: "deposit"
  - L1 -> L2: "mint" (info)
`),
    ).toMatchSnapshot();
  });

  it("Y14 storage value placeholder + animation", () => {
    expect(
      fingerprint(`
title: "Y14"
type: solidity

actors:
  - User: { kind: eoa }
  - Counter: { kind: contract, value: "{n}" }

states:
  n: 0

flow:
  - User -> Counter: "increment"

animation:
  - step: "inc" 1s
    focus: [User, Counter]
    tween:
      n: 0 -> 1
    badge: "+1"
`),
    ).toMatchSnapshot();
  });

  it("Y15 complex 5 actor + nested guard", () => {
    expect(
      fingerprint(`
title: "Y15"
type: solidity

actors:
  - Alice: { kind: eoa }
  - Bob: { kind: eoa }
  - Pool: { kind: contract }
  - SafeMath: { kind: library }
  - Swap: { kind: event }

flow:
  - Alice -> Pool: "swap" { guard: "amount > 0", sub: "exact in" }
  - Pool -> SafeMath: "mul(x,y)"
  - Pool -> Bob: "transfer" (success)
  - Pool -> Swap: "emit" (success)
`),
    ).toMatchSnapshot();
  });
});

// ─── inline option edge case (10 件) ─────
describe("golden: inline option edge cases", () => {
  it("X01 subtitle only", () => {
    expect(
      fingerprint(`
title: "X01"
type: sequence

actors:
  - A: { kind: actor, subtitle: "サブ" }
  - B: { kind: actor }

flow:
  - A -> B: "x"
`),
    ).toMatchSnapshot();
  });

  it("X02 value placeholder", () => {
    expect(
      fingerprint(`
title: "X02"
type: sequence

actors:
  - Meter: { kind: actor, value: "{m}" }
  - Sensor: { kind: actor }

states:
  m: 42

flow:
  - Sensor -> Meter: "read"
`),
    ).toMatchSnapshot();
  });

  it("X03 rows on storage", () => {
    expect(
      fingerprint(`
title: "X03"
type: sequence

actors:
  - kv: { kind: storage, rows: ["k1: {v1}", "k2: {v2}", "k3: {v3}"] }
  - Cli: actor

states:
  v1: "a"
  v2: "b"
  v3: "c"

flow:
  - Cli -> kv: "scan"
`),
    ).toMatchSnapshot();
  });

  it("X04 labelOffsetX positive", () => {
    expect(
      fingerprint(`
title: "X04"
type: sequence

actors:
  - A
  - B

flow:
  - A -> B: "go" { labelOffsetX: 24 }
`),
    ).toMatchSnapshot();
  });

  it("X05 labelOffsetY negative", () => {
    expect(
      fingerprint(`
title: "X05"
type: sequence

actors:
  - A
  - B

flow:
  - A -> B: "go" { labelOffsetY: -20 }
`),
    ).toMatchSnapshot();
  });

  it("X06 nested {} on flow", () => {
    expect(
      fingerprint(`
title: "X06"
type: er

actors:
  - User: entity
  - Order: entity

flow:
  - User -> Order: "places" { sub: "1:N", cardinality: "1:N", guard: "isActive", labelOffsetY: -8 }
`),
    ).toMatchSnapshot();
  });

  it("X07 eyebrow + subtitle combo", () => {
    expect(
      fingerprint(`
title: "X07"
type: sequence

actors:
  - User: { kind: actor, eyebrow: "Role", subtitle: "Customer" }
  - Sys: { kind: function, eyebrow: "Backend", subtitle: "API" }

flow:
  - User -> Sys: "GET /user"
`),
    ).toMatchSnapshot();
  });

  it("X08 viewport with laneWidth + gap", () => {
    expect(
      fingerprint(`
title: "X08"
type: topology

viewport: { width: 2000, height: 1100, laneWidth: 500, gap: 100 }

actors:
  - X: service
  - Y: service
  - Z: service

flow:
  - X -> Y
  - Y -> Z
`),
    ).toMatchSnapshot();
  });

  it("X09 all 4 tones in single diagram", () => {
    expect(
      fingerprint(`
title: "X09"
type: sequence

actors:
  - A
  - B
  - C
  - D

flow:
  - A -> B: "i" (info)
  - B -> C: "s" (success)
  - C -> D: "w" (warning)
  - D -> A: "e" (error)
`),
    ).toMatchSnapshot();
  });

  it("X10 mixed inline + bare actor names", () => {
    expect(
      fingerprint(`
title: "X10"
type: sequence

actors:
  - A
  - B: { kind: function, subtitle: "API" }
  - C
  - D: { kind: storage, rows: ["x: {n}"] }
  - E

states:
  n: 0

flow:
  - A -> B: "1"
  - B -> D: "2" { sub: "write" }
  - D -> C: "3" (success)
  - C -> E: "4" { labelOffsetY: 6 }
`),
    ).toMatchSnapshot();
  });
});
