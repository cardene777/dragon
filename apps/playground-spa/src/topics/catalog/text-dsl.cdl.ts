import { textDslToDiagram } from "@cardenelabs/dragon";

/**
 * Catalog - Text DSL demo (v0.5)
 *
 * Text DSL で書いた 6 preset × animation を visual 確認する場。
 * 「人 / LLM / 非エンジニア が書ける箇条書き DSL から完全な animated SVG が生成される」
 * ことを実際に動かして証明する。
 */

// ─── sequence + animation (API call フロー) ─────
export const sourceYaml__textDslSequence = `
title: "時系列のやり取りを Text DSL で書く例"
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
`;

export const textDslSequence = textDslToDiagram(sourceYaml__textDslSequence);

export const sourceJson__textDslSequence = `{
  "title": "時系列のやり取りを Text DSL で書く例",
  "type": "sequence",
  "actors": [
    {
      "name": "Client"
    },
    {
      "name": "API",
      "kind": "function"
    },
    {
      "name": "DB",
      "kind": "storage"
    }
  ],
  "flow": [
    {
      "from": "Client",
      "to": "API",
      "label": "GET /items",
      "tone": "info"
    },
    {
      "from": "API",
      "to": "DB",
      "label": "SELECT",
      "tone": "success"
    }
  ],
  "states": {
    "request_count": 0,
    "row_count": 0
  },
  "animation": [
    {
      "step": "request",
      "duration": 1.5,
      "focus": [
        "Client",
        "API"
      ],
      "body": "Client が API を呼出",
      "badge": "request",
      "tween": {
        "request_count": [
          0,
          1
        ]
      }
    },
    {
      "step": "fetch",
      "duration": 1.5,
      "focus": [
        "API",
        "DB"
      ],
      "body": "DB から 20 行取得",
      "badge": "fetched",
      "tween": {
        "row_count": [
          0,
          20
        ]
      }
    }
  ]
}`;

// ─── flow + animation (認証フロー) ─────
export const sourceYaml__textDslFlow = `
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
`;

export const textDslFlow = textDslToDiagram(sourceYaml__textDslFlow);

export const sourceJson__textDslFlow = `{
  "title": "認証フロー (DSL)",
  "type": "flow",
  "actors": [
    {
      "name": "Start",
      "kind": "event"
    },
    {
      "name": "Verify",
      "kind": "function"
    },
    {
      "name": "Done",
      "kind": "event"
    }
  ],
  "flow": [
    {
      "from": "Start",
      "to": "Verify",
      "label": "入力"
    },
    {
      "from": "Verify",
      "to": "Done",
      "label": "OK",
      "tone": "success"
    }
  ],
  "states": {
    "progress": 0
  },
  "animation": [
    {
      "step": "処理中",
      "duration": 1,
      "focus": [
        "Start",
        "Verify"
      ],
      "badge": "進行中",
      "tween": {
        "progress": [
          0,
          50
        ]
      }
    },
    {
      "step": "完了",
      "duration": 1,
      "focus": [
        "Verify",
        "Done"
      ],
      "badge": "完了",
      "tween": {
        "progress": [
          50,
          100
        ]
      }
    }
  ]
}`;

// ─── swimlane + animation (並列処理) ─────
export const sourceYaml__textDslSwimlane = `
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
`;

export const textDslSwimlane = textDslToDiagram(sourceYaml__textDslSwimlane);

export const sourceJson__textDslSwimlane = `{
  "title": "並列処理 (DSL)",
  "type": "swimlane",
  "actors": [
    {
      "name": "ServiceA",
      "kind": "service"
    },
    {
      "name": "ServiceB",
      "kind": "service"
    },
    {
      "name": "ServiceC",
      "kind": "service"
    }
  ],
  "flow": [
    {
      "from": "ServiceA",
      "to": "ServiceB",
      "label": "dispatch",
      "tone": "info"
    },
    {
      "from": "ServiceB",
      "to": "ServiceC",
      "label": "forward",
      "tone": "success"
    }
  ],
  "animation": [
    {
      "step": "dispatch",
      "duration": 1.5,
      "focus": [
        "ServiceA",
        "ServiceB"
      ],
      "badge": "A → B"
    },
    {
      "step": "forward",
      "duration": 1.5,
      "focus": [
        "ServiceB",
        "ServiceC"
      ],
      "badge": "B → C"
    }
  ]
}`;

// ─── state + animation (FSM) ─────
export const sourceYaml__textDslStateMachine = `
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
`;

export const textDslStateMachine = textDslToDiagram(sourceYaml__textDslStateMachine);

export const sourceJson__textDslStateMachine = `{
  "title": "認証 FSM (DSL)",
  "type": "state",
  "actors": [
    {
      "name": "Idle"
    },
    {
      "name": "Loading"
    },
    {
      "name": "Done"
    },
    {
      "name": "Error"
    }
  ],
  "flow": [
    {
      "from": "Idle",
      "to": "Loading",
      "label": "submit"
    },
    {
      "from": "Loading",
      "to": "Done",
      "label": "success",
      "tone": "success"
    },
    {
      "from": "Loading",
      "to": "Error",
      "label": "fail",
      "tone": "error"
    }
  ],
  "states": {
    "counter": 0
  },
  "animation": [
    {
      "step": "submit",
      "duration": 1,
      "focus": [
        "Idle",
        "Loading"
      ],
      "badge": "送信",
      "tween": {
        "counter": [
          0,
          1
        ]
      }
    },
    {
      "step": "success",
      "duration": 1,
      "focus": [
        "Loading",
        "Done"
      ],
      "badge": "完了",
      "tween": {
        "counter": [
          1,
          2
        ]
      }
    }
  ]
}`;

// ─── topology + animation (システム構成) ─────
export const sourceYaml__textDslTopology = `
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
`;

export const textDslTopology = textDslToDiagram(sourceYaml__textDslTopology);

export const sourceJson__textDslTopology = `{
  "title": "System (DSL)",
  "type": "topology",
  "actors": [
    {
      "name": "Browser",
      "kind": "service"
    },
    {
      "name": "API",
      "kind": "service"
    },
    {
      "name": "DB",
      "kind": "database"
    }
  ],
  "flow": [
    {
      "from": "Browser",
      "to": "API",
      "label": "HTTPS"
    },
    {
      "from": "API",
      "to": "DB",
      "label": "SQL"
    }
  ],
  "animation": [
    {
      "step": "request",
      "duration": 1,
      "focus": [
        "Browser",
        "API"
      ],
      "badge": "要求中"
    },
    {
      "step": "query",
      "duration": 1,
      "focus": [
        "API",
        "DB"
      ],
      "badge": "問合中"
    }
  ]
}`;

// ─── er + animation (ER 図) ─────
export const sourceYaml__textDslEr = `
title: "スキーマ (DSL)"
type: er

actors:
  - User
  - Order

flow:
  - User -> Order: "places" (info)

animation:
  - step: "片方" 1s
    focus: [User]
    badge: "User"
  - step: "つながり" 1s
    focus: ["User -> Order"]
    badge: "places"
  - step: "全体" 1s
    focus: [User, Order]
    badge: "1:N"
`;

export const textDslEr = textDslToDiagram(sourceYaml__textDslEr);

export const sourceJson__textDslEr = `{
  "title": "スキーマ (DSL)",
  "type": "er",
  "actors": [
    {
      "name": "User"
    },
    {
      "name": "Order"
    }
  ],
  "flow": [
    {
      "from": "User",
      "to": "Order",
      "label": "places",
      "tone": "info"
    }
  ],
  "animation": [
    {
      "step": "片方",
      "duration": 1,
      "focus": [
        "User"
      ],
      "badge": "User"
    },
    {
      "step": "つながり",
      "duration": 1,
      "focus": [
        "User -> Order"
      ],
      "badge": "places"
    },
    {
      "step": "全体",
      "duration": 1,
      "focus": [
        "User",
        "Order"
      ],
      "badge": "1:N"
    }
  ]
}`;

// ─── gantt preset (Q1-Q3 ロードマップ) ─────
export const sourceYaml__textDslGantt = `
title: "四半期ロードマップを Text DSL で書く例"
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
  - step: "Q1 進行" 2.4s
    focus: [task1]
    draw: gantt
    tween:
      task1_progress: 0 -> 100
    badge: "Q1 完了"

  - step: "Q2 開始" 1.2s
    focus: [task1, task2]
    tween:
      task2_progress: 0 -> 50
    badge: "Q2 進行中"
`;

export const textDslGantt = textDslToDiagram(sourceYaml__textDslGantt);

export const sourceJson__textDslGantt = `{
  "title": "四半期ロードマップを Text DSL で書く例",
  "type": "gantt",
  "actors": [
    {
      "name": "task1",
      "kind": "card",
      "subtitle": "Q1"
    },
    {
      "name": "task2",
      "kind": "card",
      "subtitle": "Q2"
    },
    {
      "name": "task3",
      "kind": "card",
      "subtitle": "Q3"
    }
  ],
  "flow": [
    {
      "from": "task1",
      "to": "task2",
      "label": "depends"
    },
    {
      "from": "task2",
      "to": "task3",
      "label": "depends"
    }
  ],
  "states": {
    "task1_progress": 0,
    "task2_progress": 0
  },
  "animation": [
    {
      "step": "Q1 進行",
      "duration": 2.4,
      "focus": [
        "task1"
      ],
      "draw": "gantt",
      "badge": "Q1 完了",
      "tween": {
        "task1_progress": [
          0,
          100
        ]
      }
    },
    {
      "step": "Q2 開始",
      "duration": 1.2,
      "focus": [
        "task1",
        "task2"
      ],
      "badge": "Q2 進行中",
      "tween": {
        "task2_progress": [
          0,
          50
        ]
      }
    }
  ]
}`;

// ─── class preset (UML class diagram 風) ─────
export const sourceYaml__textDslClass = `
title: "UML class (DSL)"
type: flow

actors:
  - User: { kind: card, subtitle: "+name / +login()" }
  - Admin: { kind: card, subtitle: "+role / +delete()" }

flow:
  - User -> Admin: "extends"

animation:
  - step: "親" 1s
    focus: [User]
    badge: "User"
  - step: "つながり" 1s
    focus: ["User -> Admin"]
    badge: "extends"
  - step: "子まで" 1s
    focus: [User, Admin]
    badge: "Admin extends User"
`;

export const textDslClass = textDslToDiagram(sourceYaml__textDslClass);

export const sourceJson__textDslClass = `{
  "title": "UML class (DSL)",
  "type": "flow",
  "actors": [
    {
      "name": "User",
      "kind": "card",
      "subtitle": "+name / +login()"
    },
    {
      "name": "Admin",
      "kind": "card",
      "subtitle": "+role / +delete()"
    }
  ],
  "flow": [
    {
      "from": "User",
      "to": "Admin",
      "label": "extends"
    }
  ],
  "animation": [
    {
      "step": "親",
      "duration": 1,
      "focus": [
        "User"
      ],
      "badge": "User"
    },
    {
      "step": "つながり",
      "duration": 1,
      "focus": [
        "User -> Admin"
      ],
      "badge": "extends"
    },
    {
      "step": "子まで",
      "duration": 1,
      "focus": [
        "User",
        "Admin"
      ],
      "badge": "Admin extends User"
    }
  ]
}`;

// ─── pie preset (シェア円グラフ) ─────
export const sourceYaml__textDslPie = `
title: "内訳の割合を Text DSL で書く例"
type: pie

actors:
  - A: { kind: card, value: "30%" }
  - B: { kind: card, value: "50%" }
  - C: { kind: card, value: "20%" }

states:
  a_share: 30
  b_share: 50

animation:
  - step: "シェア更新" 2.4s
    focus: [A, B]
    draw: pie
    tween:
      a_share: 30 -> 40
      b_share: 50 -> 40
    badge: "再分配"
`;

export const textDslPie = textDslToDiagram(sourceYaml__textDslPie);

export const sourceJson__textDslPie = `{
  "title": "内訳の割合を Text DSL で書く例",
  "type": "pie",
  "actors": [
    {
      "name": "A",
      "kind": "card",
      "value": "30%"
    },
    {
      "name": "B",
      "kind": "card",
      "value": "50%"
    },
    {
      "name": "C",
      "kind": "card",
      "value": "20%"
    }
  ],
  "flow": [],
  "states": {
    "a_share": 30,
    "b_share": 50
  },
  "animation": [
    {
      "step": "シェア更新",
      "duration": 2.4,
      "focus": [
        "A",
        "B"
      ],
      "draw": "pie",
      "badge": "再分配",
      "tween": {
        "a_share": [
          30,
          40
        ],
        "b_share": [
          50,
          40
        ]
      }
    }
  ]
}`;

// ─── c4 preset (system context) ─────
export const sourceYaml__textDslC4 = `
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
`;

export const textDslC4 = textDslToDiagram(sourceYaml__textDslC4);

export const sourceJson__textDslC4 = `{
  "title": "C4 (DSL)",
  "type": "c4",
  "actors": [
    {
      "name": "User",
      "kind": "person",
      "subtitle": "End user"
    },
    {
      "name": "Web",
      "kind": "service",
      "subtitle": "Frontend"
    },
    {
      "name": "API",
      "kind": "api",
      "subtitle": "Backend"
    },
    {
      "name": "DB",
      "kind": "database",
      "subtitle": "PostgreSQL"
    }
  ],
  "flow": [
    {
      "from": "User",
      "to": "Web",
      "label": "uses"
    },
    {
      "from": "Web",
      "to": "API",
      "label": "calls"
    },
    {
      "from": "API",
      "to": "DB",
      "label": "reads"
    }
  ],
  "animation": [
    {
      "step": "request",
      "duration": 1,
      "focus": [
        "User",
        "Web"
      ],
      "badge": "アクセス"
    },
    {
      "step": "fetch",
      "duration": 1,
      "focus": [
        "API",
        "DB"
      ],
      "badge": "DB 参照"
    }
  ]
}`;

// ─── mind preset (放射状 mind map) ─────
export const sourceYaml__textDslMind = `
title: "アイデア DSL (中心 + 放射の枝)"
type: mind

states:
  stage: "下書き"

actors:
  - Core
  - Idea1
  - Idea2
  - "決め手 {stage}"

animation:
  - step: "中心" 2.4s
    draw: mind
    set:
      stage: "下書き"
    badge: "発想"
  - step: "案が出る" 1s
    set:
      stage: "比べる"
    badge: "案 1"
  - step: "広がる" 1s
    set:
      stage: "選ぶ"
    badge: "案 3"
`;

export const textDslMind = textDslToDiagram(sourceYaml__textDslMind);

export const sourceJson__textDslMind = `{
  "title": "アイデア DSL (中心 + 放射の枝)",
  "type": "mind",
  "actors": [
    {
      "name": "Core"
    },
    {
      "name": "Idea1"
    },
    {
      "name": "Idea2"
    },
    {
      "name": "決め手 {stage}"
    }
  ],
  "flow": [],
  "states": {
    "stage": "下書き"
  },
  "animation": [
    {
      "step": "中心",
      "duration": 2.4,
      "draw": "mind",
      "badge": "発想",
      "set": {
        "stage": "下書き"
      }
    },
    {
      "step": "案が出る",
      "duration": 1,
      "badge": "案 1",
      "set": {
        "stage": "比べる"
      }
    },
    {
      "step": "広がる",
      "duration": 1,
      "badge": "案 3",
      "set": {
        "stage": "選ぶ"
      }
    }
  ]
}`;

// ─── code preset (関数呼出 + DB write + event emit) ─────
export const sourceYaml__textDslCode = `
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
`;

export const textDslCode = textDslToDiagram(sourceYaml__textDslCode);

export const sourceJson__textDslCode = `{
  "title": "Service call + write + emit",
  "type": "sequence",
  "actors": [
    {
      "name": "Client",
      "kind": "actor",
      "subtitle": "request"
    },
    {
      "name": "Server",
      "kind": "function",
      "subtitle": "handler"
    },
    {
      "name": "DB",
      "kind": "storage",
      "rows": [
        "count: {count}"
      ]
    },
    {
      "name": "OrderCreated",
      "kind": "event",
      "subtitle": "\\"orderId"
    }
  ],
  "flow": [
    {
      "from": "Client",
      "to": "Server",
      "label": "POST /orders"
    },
    {
      "from": "Server",
      "to": "DB",
      "label": "UPDATE count -= 1",
      "tone": "info"
    },
    {
      "from": "Server",
      "to": "OrderCreated",
      "label": "emit",
      "tone": "success"
    }
  ],
  "states": {
    "count": 100
  },
  "animation": [
    {
      "step": "call",
      "duration": 1.2,
      "focus": [
        "Client",
        "Server"
      ],
      "badge": "request"
    },
    {
      "step": "write",
      "duration": 1.5,
      "focus": [
        "Server",
        "DB"
      ],
      "badge": "DB update",
      "tween": {
        "count": [
          100,
          99
        ]
      }
    },
    {
      "step": "emit",
      "duration": 0.8,
      "focus": [
        "Server",
        "OrderCreated"
      ],
      "badge": "OrderCreated"
    }
  ]
}`;

// ─── values (値どうしの関係) ─────
//
// `states` は初期値だけを持ち、`values` が「他の値からどう決まるか」 を書く。 段が動かすのは
// `inflow` と `done` の 2 つで、待ち行列の数はその 2 つから毎 frame 決まる。 段ごとに書くと
// 4 段 × 3 値を手で合わせることになり、1 つ直すたびに残りがずれる。
export const sourceYaml__textDslValues = `
title: "値どうしの関係を書く例"
type: flow

actors:
  - 受付: api "入ってくる数" "{inflow}"
  - 待ち行列: queue "まだ捌けていない" "{waiting}"
  - 処理: service "捌いた数" "{done}"

flow:
  - 受付 -> 待ち行列: "積む"
  - 待ち行列 -> 処理: "取り出す" (success)

states:
  inflow: 0
  done: 0

values:
  waiting: "{inflow} - {done}"
  busy: "{waiting} > 20"

animation:
  - step: "入ってくる" 1.4s
    focus: [受付, 待ち行列]
    tween:
      inflow: 0 -> 40
    badge: "流入 40"
    description: "待ち行列は書かなくても 40 になる"

  - step: "捌き始める" 1.4s
    focus: [待ち行列, 処理]
    tween:
      done: 0 -> 10
    badge: "処理 10"
    description: "待ち行列は 30 に減る"

  - step: "追いつく" 1.4s
    focus: [処理]
    tween:
      done: 10 -> 25
    badge: "処理 25"
    description: "待ち行列は 15 まで減る"
`;

export const textDslValues = textDslToDiagram(sourceYaml__textDslValues);

export const sourceJson__textDslValues = `{
  "title": "値どうしの関係を書く例",
  "type": "flow",
  "actors": [
    {
      "name": "受付",
      "kind": "api",
      "subtitle": "入ってくる数",
      "value": "{inflow}"
    },
    {
      "name": "待ち行列",
      "kind": "queue",
      "subtitle": "まだ捌けていない",
      "value": "{waiting}"
    },
    {
      "name": "処理",
      "kind": "service",
      "subtitle": "捌いた数",
      "value": "{done}"
    }
  ],
  "flow": [
    {
      "from": "受付",
      "to": "待ち行列",
      "label": "積む"
    },
    {
      "from": "待ち行列",
      "to": "処理",
      "label": "取り出す",
      "tone": "success"
    }
  ],
  "states": {
    "inflow": 0,
    "done": 0
  },
  "values": {
    "waiting": "{inflow} - {done}",
    "busy": "{waiting} > 20"
  },
  "animation": [
    {
      "step": "入ってくる",
      "duration": 1.4,
      "focus": [
        "受付",
        "待ち行列"
      ],
      "body": "待ち行列は書かなくても 40 になる",
      "badge": "流入 40",
      "tween": {
        "inflow": [
          0,
          40
        ]
      }
    },
    {
      "step": "捌き始める",
      "duration": 1.4,
      "focus": [
        "待ち行列",
        "処理"
      ],
      "body": "待ち行列は 30 に減る",
      "badge": "処理 10",
      "tween": {
        "done": [
          0,
          10
        ]
      }
    },
    {
      "step": "追いつく",
      "duration": 1.4,
      "focus": [
        "処理"
      ],
      "body": "待ち行列は 15 まで減る",
      "badge": "処理 25",
      "tween": {
        "done": [
          10,
          25
        ]
      }
    }
  ]
}`;
