import { textDslToDiagram } from "@cardenelabs/dragon";

/**
 * Catalog - Text DSL demo (v0.5)
 *
 * Text DSL で書いた 6 preset × animation を visual 確認する場。
 * 「人 / LLM / 非エンジニア が書ける箇条書き DSL から完全な animated SVG が生成される」
 * ことを実際に動かして証明する。
 */

// ─── sequence + animation (API call フロー) ─────
export const textDslSequence = textDslToDiagram(`
title: "API call (Text DSL 6 行で書ける最小 sequence)"
type: sequence

actors:
  - Client
  - "API": function
  - DB: storage

flow:
  - Client -> "API": "GET /items" (info)
  - "API" -> DB: "SELECT" (success)

states:
  request_count: 0
  row_count: 0

animation:
  - step: "request" 1.5s
    focus: [Client, "API"]
    tween:
      request_count: 0 -> 1
    badge: "request"
    description: "Client が API を呼出"

  - step: "fetch" 1.5s
    focus: ["API", DB]
    tween:
      row_count: 0 -> 20
    badge: "fetched"
    description: "DB から 20 行取得"
`);

// ─── flow + animation (認証フロー) ─────
export const textDslFlow = textDslToDiagram(`
title: "認証フロー (DSL)"
type: flow

actors:
  - Start: event
  - Verify: function
  - Done: event

flow:
  - Start -> Verify: "入力"
  - Verify -> Done: "OK" (success)

states:
  progress: 0

animation:
  - step: "処理中" 1s
    focus: [Start, Verify]
    tween:
      progress: 0 -> 50
    badge: "進行中"

  - step: "完了" 1s
    focus: [Verify, Done]
    tween:
      progress: 50 -> 100
    badge: "完了"
`);

// ─── swimlane + animation (並列処理) ─────
export const textDslSwimlane = textDslToDiagram(`
title: "並列処理 (DSL)"
type: swimlane

actors:
  - ServiceA: service
  - ServiceB: service
  - ServiceC: service

flow:
  - ServiceA -> ServiceB: "dispatch" (info)
  - ServiceB -> ServiceC: "forward" (success)

animation:
  - step: "dispatch" 1.5s
    focus: [ServiceA, ServiceB]
    badge: "A → B"

  - step: "forward" 1.5s
    focus: [ServiceB, ServiceC]
    badge: "B → C"
`);

// ─── state + animation (FSM) ─────
export const textDslStateMachine = textDslToDiagram(`
title: "認証 FSM (DSL)"
type: state

actors:
  - Idle
  - Loading
  - Done
  - Error

flow:
  - Idle -> Loading: "submit"
  - Loading -> Done: "success" (success)
  - Loading -> Error: "fail" (error)

states:
  counter: 0

animation:
  - step: "submit" 1s
    focus: [Idle, Loading]
    tween:
      counter: 0 -> 1
    badge: "送信"

  - step: "success" 1s
    focus: [Loading, Done]
    tween:
      counter: 1 -> 2
    badge: "完了"
`);

// ─── topology + animation (システム構成) ─────
export const textDslTopology = textDslToDiagram(`
title: "System (DSL)"
type: topology

actors:
  - Browser: service
  - API: service
  - DB: database

flow:
  - Browser -> API: "HTTPS"
  - API -> DB: "SQL"

animation:
  - step: "request" 1s
    focus: [Browser, API]
    badge: "要求中"

  - step: "query" 1s
    focus: [API, DB]
    badge: "問合中"
`);

// ─── er + animation (ER 図) ─────
export const textDslEr = textDslToDiagram(`
title: "スキーマ (DSL)"
type: er

actors:
  - User
  - Order

flow:
  - User -> Order: "places" (info)

animation:
  - step: "show" 1s
    focus: [User, Order]
    badge: "1:N"
`);

// ─── gantt preset (Q1-Q3 ロードマップ) ─────
export const textDslGantt = textDslToDiagram(`
title: "ロードマップ (DSL)"
type: gantt

actors:
  - task1: { kind: card, subtitle: "Q1" }
  - task2: { kind: card, subtitle: "Q2" }
  - task3: { kind: card, subtitle: "Q3" }

flow:
  - task1 -> task2: "depends"
  - task2 -> task3: "depends"

states:
  task1_progress: 0
  task2_progress: 0

animation:
  - step: "Q1 進行" 1.2s
    focus: [task1]
    tween:
      task1_progress: 0 -> 100
    badge: "Q1 完了"

  - step: "Q2 開始" 1.2s
    focus: [task1, task2]
    tween:
      task2_progress: 0 -> 50
    badge: "Q2 進行中"
`);

// ─── class preset (UML class diagram 風) ─────
export const textDslClass = textDslToDiagram(`
title: "UML class (DSL)"
type: flow

actors:
  - User: { kind: card, subtitle: "+name / +login()" }
  - Admin: { kind: card, subtitle: "+role / +delete()" }

flow:
  - User -> Admin: "extends"

animation:
  - step: "継承" 1s
    focus: [User, Admin]
    badge: "Admin extends User"
`);

// ─── pie preset (シェア円グラフ) ─────
export const textDslPie = textDslToDiagram(`
title: "シェア (DSL)"
type: pie

actors:
  - A: { kind: card, value: "30%" }
  - B: { kind: card, value: "50%" }
  - C: { kind: card, value: "20%" }

states:
  a_share: 30
  b_share: 50

animation:
  - step: "シェア更新" 1s
    focus: [A, B]
    tween:
      a_share: 30 -> 40
      b_share: 50 -> 40
    badge: "再分配"
`);

// ─── c4 preset (system context) ─────
export const textDslC4 = textDslToDiagram(`
title: "C4 (DSL)"
type: c4

actors:
  - User: { kind: person, subtitle: "End user" }
  - Web: { kind: service, subtitle: "Frontend" }
  - API: { kind: api, subtitle: "Backend" }
  - DB: { kind: database, subtitle: "PostgreSQL" }

flow:
  - User -> Web: "uses"
  - Web -> API: "calls"
  - API -> DB: "reads"

animation:
  - step: "request" 1s
    focus: [User, Web]
    badge: "アクセス"
  - step: "fetch" 1s
    focus: [API, DB]
    badge: "DB 参照"
`);

// ─── mind preset (放射状 mind map) ─────
export const textDslMind = textDslToDiagram(`
title: "アイデア (DSL)"
type: mind

actors:
  - Core: { kind: card, subtitle: "中心テーマ" }
  - Idea1: { kind: card, subtitle: "案 1" }
  - Idea2: { kind: card, subtitle: "案 2" }
  - Idea3: { kind: card, subtitle: "案 3" }

animation:
  - step: "展開" 1s
    focus: [Core]
    badge: "発想"
`);

// ─── code preset (関数呼出 + DB write + event emit) ─────
export const textDslCode = textDslToDiagram(`
title: "Service call + write + emit"
type: sequence

actors:
  - Client: { kind: actor, subtitle: "request" }
  - Server: { kind: function, subtitle: "handler" }
  - DB: { kind: storage, rows: ["count: {count}"] }
  - OrderCreated: { kind: event, subtitle: "orderId, total" }

states:
  count: 100

flow:
  - Client -> Server: "POST /orders"
  - Server -> DB: "UPDATE count -= 1" (info)
  - Server -> OrderCreated: "emit" (success)

animation:
  - step: "call" 1.2s
    focus: [Client, Server]
    badge: "request"
  - step: "write" 1.5s
    focus: [Server, DB]
    tween:
      count: 100 -> 99
    badge: "DB update"
  - step: "emit" 0.8s
    focus: [Server, OrderCreated]
    badge: "OrderCreated"
`);
