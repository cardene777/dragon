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
  - "API"
  - DB

flow:
  - Client -> "API": "GET /items"
  - "API" -> DB: "SELECT"

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
      "name": "API"
    },
    {
      "name": "DB"
    }
  ],
  "flow": [
    {
      "from": "Client",
      "to": "API",
      "label": "GET /items"
    },
    {
      "from": "API",
      "to": "DB",
      "label": "SELECT"
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

/**
 * 面に説明を添える形 (#1706)。
 *
 * 面 (`actors`) に説明を書くと `sequence-actor-subtitle` が出て、その面が何なのかが
 * 図に載る。 時系列のやり取りの見本は 29 件あるが、記法で書いた側は名前だけで、
 * **説明つきの形は組立て API の見本にしか無かった**。 別の行に分かれていると見比べられない
 * ので、同じ見本の切替にする。
 */
export const patternBase__textDslSequence = "名前だけ";

export const sourceYaml__pattern__textDslSequence__説明つき = `
title: "面に説明を添えた時系列のやり取り"
type: sequence

actors:
  - Client: "利用者の画面"
  - "API": "受け口"
  - DB: "保管先"

flow:
  - Client -> "API": "GET /items"
  - "API" -> DB: "SELECT"

animation:
  - step: "request" 1.5s
    focus: [Client, "API"]
    badge: "request"
    description: "Client が API を呼出"

  - step: "fetch" 1.5s
    focus: ["API", DB]
    badge: "fetched"
    description: "DB から 20 行取得"
`;

export const sourceJson__pattern__textDslSequence__説明つき = `{
  "title": "面に説明を添えた時系列のやり取り",
  "type": "sequence",
  "actors": [
    { "name": "Client", "subtitle": "利用者の画面" },
    { "name": "API", "subtitle": "受け口" },
    { "name": "DB", "subtitle": "保管先" }
  ],
  "flow": [
    { "from": "Client", "to": "API", "label": "GET /items" },
    { "from": "API", "to": "DB", "label": "SELECT" }
  ],
  "animation": [
    {
      "step": "request",
      "duration": 1.5,
      "focus": ["Client", "API"],
      "body": "Client が API を呼出",
      "badge": "request"
    },
    {
      "step": "fetch",
      "duration": 1.5,
      "focus": ["API", "DB"],
      "body": "DB から 20 行取得",
      "badge": "fetched"
    }
  ]
}`;

export const pattern__textDslSequence__説明つき = textDslToDiagram(
  sourceYaml__pattern__textDslSequence__説明つき,
);

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
  - Loading -> Done: "success" (success) { guard: "入力が正しい" }
  - Loading -> Error: "fail" (error)
  - Error -> Idle: "retry"

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
      "tone": "success",
      "guard": "入力が正しい"
    },
    {
      "from": "Loading",
      "to": "Error",
      "label": "fail",
      "tone": "error"
    },
    {
      "from": "Error",
      "to": "Idle",
      "label": "retry"
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
# 順番を持たない図なので、触れた箱の関係を光らせる (#1757)。
# 線は最初から全部出す = 段は引くのをやめて光らせるだけになる
relations: hover
reveal: all

actors:
  - User
  - Order

flow:
  - User -> Order: "places" (info) { cardinality: "1:N" }

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
  "relations": "hover",
  "reveal": "all",
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
      "tone": "info",
      "cardinality": "1:N"
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

// ─── er + 縦列 (8 表 8 関係、多対多が 2 組) ─────
//
// 意匠帳 (`docs/design/er/note.md`) が線の手当てを決めた図。
// 同じ通り道を並走する線 / 交わる線 / 札の位置は、表が 3 つの図では 1 つも見えない。
export const sourceYaml__textDslErMesh = `title: "多対多が 2 組 / 8 表 8 関係"
type: er
palette: kinari
# 順番を持たない図なので、触れた箱の関係を光らせる (#1757)。
# 線は最初から全部出す = 段は引くのをやめて光らせるだけになる
relations: hover
reveal: all

# 表を 3 列の格子に置く (#1571)。 全ての箱に縦列を書くと書いたとおりに置かれる。
# 書かないと 1 箱 1 縦列で横一列になり、関係を 4 本持つ実体で 2 本が隣を飛び越す
lanes:
  c0: { width: 470 }
  c1: { width: 470 }

# 鍵は名前に下線、外部キーは山形。 中継表は全ての列が鍵で、それ自体は何も持たない
actors:
  - roles: { lane: c0, stack: 0, kind: storage, subtitle: "役割", rows: ["id: bigint", "name: text"], marks: ["pk", ""] }
  - users: { lane: c0, stack: 1, kind: storage, subtitle: "利用者", rows: ["id: bigint", "email: text"], marks: ["pk", ""] }
  - teams: { lane: c0, stack: 2, kind: storage, subtitle: "組", rows: ["id: bigint", "name: text"], marks: ["pk", ""] }
  - tags: { lane: c0, stack: 3, kind: storage, subtitle: "札", rows: ["id: bigint", "name: text"], marks: ["pk", ""] }
  - projects: { lane: c1, stack: 2, kind: storage, subtitle: "案件", rows: ["id: bigint", "team_id: bigint", "owner_id: bigint"], marks: ["pk", "fk", "fk"] }
  - user_roles: { lane: c1, stack: 0, kind: storage, subtitle: "役割の割当", rows: ["user_id: bigint", "role_id: bigint"], marks: ["pk fk", "pk fk"] }
  - team_members: { lane: c1, stack: 1, kind: storage, subtitle: "組の一員", rows: ["team_id: bigint", "user_id: bigint"], marks: ["pk fk", "pk fk"] }
  - project_tags: { lane: c1, stack: 3, kind: storage, subtitle: "案件の札", rows: ["project_id: bigint", "tag_id: bigint"], marks: ["pk fk", "pk fk"] }

# 端の印は両端に立つ。 箱に近い側が個数 (棒 = 1 / 三又 = 多)、その外側が任意か
flow:
  - users -> user_roles: "持つ" (info, solid) { tailHead: one, head: many }
  - roles -> user_roles: "割り当てる" (info, solid) { tailHead: one, head: many }
  - users -> team_members: "入る" (info, solid) { tailHead: one, head: many }
  - teams -> team_members: "集める" (info, solid) { tailHead: one, head: many }
  - teams -> projects: "抱える" (info, dashed) { tailHead: one, head: zero-many }
  - projects -> project_tags: "付ける" (info, solid) { tailHead: one, head: many }
  - tags -> project_tags: "貼る" (info, solid) { tailHead: one, head: many }
  - users -> projects: "受け持つ" (info, dashed) { tailHead: one, head: zero-many }

# 線も段に載せる。 段が名指ししていない線は「光っていない合図」 として刻まれるので、
# 載せないと実線で書いた関係が破線に見える
animation:
  - step: "1. 実体の表" 1.2s
    focus: [roles, users, teams, tags]
    badge: "5 つの実体"
  - step: "2. 中継表" 1.2s
    focus: [user_roles, team_members, project_tags]
    badge: "鍵だけの 3 表"
  - step: "3. 多対多の 2 組" 1.4s
    focus: [users, user_roles, roles, teams, team_members, users -> user_roles, roles -> user_roles, users -> team_members, teams -> team_members]
    badge: "役割と組"
  - step: "4. 案件と札" 1.4s
    focus: [projects, project_tags, tags, teams, users, projects -> project_tags, tags -> project_tags, teams -> projects, users -> projects]
    badge: "案件と札"
`;

export const textDslErMesh = textDslToDiagram(sourceYaml__textDslErMesh);

export const sourceJson__textDslErMesh = `{
  "title": "多対多が 2 組 / 8 表 8 関係",
  "type": "er",
  "relations": "hover",
  "reveal": "all",
  "palette": "kinari",
  "lanes": { "c0": { "width": 470 }, "c1": { "width": 470 } },
  "actors": [
    {
      "name": "roles",
      "lane": "c0",
      "stack": 0,
      "kind": "storage",
      "subtitle": "役割",
      "rows": ["id: bigint", "name: text"],
      "marks": ["pk", ""]
    },
    {
      "name": "users",
      "lane": "c0",
      "stack": 1,
      "kind": "storage",
      "subtitle": "利用者",
      "rows": ["id: bigint", "email: text"],
      "marks": ["pk", ""]
    },
    {
      "name": "teams",
      "lane": "c0",
      "stack": 2,
      "kind": "storage",
      "subtitle": "組",
      "rows": ["id: bigint", "name: text"],
      "marks": ["pk", ""]
    },
    {
      "name": "tags",
      "lane": "c0",
      "stack": 3,
      "kind": "storage",
      "subtitle": "札",
      "rows": ["id: bigint", "name: text"],
      "marks": ["pk", ""]
    },
    {
      "name": "projects",
      "lane": "c1",
      "stack": 2,
      "kind": "storage",
      "subtitle": "案件",
      "rows": ["id: bigint", "team_id: bigint", "owner_id: bigint"],
      "marks": ["pk", "fk", "fk"]
    },
    {
      "name": "user_roles",
      "lane": "c1",
      "stack": 0,
      "kind": "storage",
      "subtitle": "役割の割当",
      "rows": ["user_id: bigint", "role_id: bigint"],
      "marks": ["pk fk", "pk fk"]
    },
    {
      "name": "team_members",
      "lane": "c1",
      "stack": 1,
      "kind": "storage",
      "subtitle": "組の一員",
      "rows": ["team_id: bigint", "user_id: bigint"],
      "marks": ["pk fk", "pk fk"]
    },
    {
      "name": "project_tags",
      "lane": "c1",
      "stack": 3,
      "kind": "storage",
      "subtitle": "案件の札",
      "rows": ["project_id: bigint", "tag_id: bigint"],
      "marks": ["pk fk", "pk fk"]
    }
  ],
  "flow": [
    { "from": "users", "to": "user_roles", "label": "持つ", "tone": "info", "style": "solid", "tailHead": "one", "head": "many" },
    { "from": "roles", "to": "user_roles", "label": "割り当てる", "tone": "info", "style": "solid", "tailHead": "one", "head": "many" },
    { "from": "users", "to": "team_members", "label": "入る", "tone": "info", "style": "solid", "tailHead": "one", "head": "many" },
    { "from": "teams", "to": "team_members", "label": "集める", "tone": "info", "style": "solid", "tailHead": "one", "head": "many" },
    { "from": "teams", "to": "projects", "label": "抱える", "tone": "info", "style": "dashed", "tailHead": "one", "head": "zero-many" },
    { "from": "projects", "to": "project_tags", "label": "付ける", "tone": "info", "style": "solid", "tailHead": "one", "head": "many" },
    { "from": "tags", "to": "project_tags", "label": "貼る", "tone": "info", "style": "solid", "tailHead": "one", "head": "many" },
    { "from": "users", "to": "projects", "label": "受け持つ", "tone": "info", "style": "dashed", "tailHead": "one", "head": "zero-many" }
  ],
  "animation": [
    { "step": "1. 実体の表", "duration": 1.2, "focus": ["roles", "users", "teams", "tags"], "badge": "5 つの実体" },
    { "step": "2. 中継表", "duration": 1.2, "focus": ["user_roles", "team_members", "project_tags"], "badge": "鍵だけの 3 表" },
    { "step": "3. 多対多の 2 組", "duration": 1.4, "focus": ["users", "user_roles", "roles", "teams", "team_members", "users -> user_roles", "roles -> user_roles", "users -> team_members", "teams -> team_members"], "badge": "役割と組" },
    { "step": "4. 案件と札", "duration": 1.4, "focus": ["projects", "project_tags", "tags", "teams", "users", "projects -> project_tags", "tags -> project_tags", "teams -> projects", "users -> projects"], "badge": "案件と札" }
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
  - Client: { subtitle: "request" }
  - Server: { subtitle: "handler" }
  - DB
  - OrderCreated: { subtitle: "orderId, total" }

states:
  count: 100

flow:
  - Client -> Server: "POST /orders"
  - Server -> DB: "UPDATE count -= 1"
  - Server -> OrderCreated: "emit"

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
      "subtitle": "request"
    },
    {
      "name": "Server",
      "subtitle": "handler"
    },
    {
      "name": "DB"
    },
    {
      "name": "OrderCreated",
      "subtitle": "orderId, total"
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
      "label": "UPDATE count -= 1"
    },
    {
      "from": "Server",
      "to": "OrderCreated",
      "label": "emit"
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

// ============================================================
// 始点終点の印を置く状態の図 (#1450)
//
// 状態の図は既定で全ての箱を同じ形で描くが、`kind:` を書くとその種類で描く。
// `mark-start` (塗りつぶした丸) と `mark-end` (輪の中に丸) は、
// 「ここから」「ここまで」 を状態そのものと分けて示すための印。
//
// **書いた形は動きの有無を問わず効く**。 動く図だけで効かせると、
// 同じ記法でも静止図では指定が黙って消える。
// ============================================================
export const sourceYaml__textDslStateMarks = `title: "注文の状態"
type: state

actors:
  - 始: { kind: mark-start }
  - 受付: "注文を受け取った"
  - 発送準備: "在庫を引き当てた"
  - 発送済: "配送業者へ渡した"
  - 終: { kind: mark-end }

flow:
  - 始 -> 受付: "注文が入る"
  - 受付 -> 発送準備: "在庫あり"
  - 発送準備 -> 発送済: "集荷"
  - 発送済 -> 終: "受取完了"

animation:
  - step: "受け付ける" 1.4s
    focus: [始, 受付]
    description: "印から始まり、最初の状態へ入る"

  - step: "発送する" 1.4s
    focus: [発送準備, 発送済]
    description: "在庫を引き当てて配送業者へ渡す"

  - step: "終わる" 1.4s
    focus: [発送済, 終]
    description: "受取が済むと終わりの印へ入る"
`;

export const textDslStateMarks = textDslToDiagram(sourceYaml__textDslStateMarks);

export const sourceJson__textDslStateMarks = `{
  "title": "注文の状態",
  "type": "state",
  "actors": [
    { "name": "始", "kind": "mark-start" },
    { "name": "受付", "subtitle": "注文を受け取った" },
    { "name": "発送準備", "subtitle": "在庫を引き当てた" },
    { "name": "発送済", "subtitle": "配送業者へ渡した" },
    { "name": "終", "kind": "mark-end" }
  ],
  "flow": [
    { "from": "始", "to": "受付", "label": "注文が入る" },
    { "from": "受付", "to": "発送準備", "label": "在庫あり" },
    { "from": "発送準備", "to": "発送済", "label": "集荷" },
    { "from": "発送済", "to": "終", "label": "受取完了" }
  ],
  "animation": [
    {
      "step": "受け付ける",
      "duration": 1.4,
      "focus": ["始", "受付"],
      "body": "印から始まり、最初の状態へ入る"
    },
    {
      "step": "発送する",
      "duration": 1.4,
      "focus": ["発送準備", "発送済"],
      "body": "在庫を引き当てて配送業者へ渡す"
    },
    {
      "step": "終わる",
      "duration": 1.4,
      "focus": ["発送済", "終"],
      "body": "受取が済むと終わりの印へ入る"
    }
  ]
}`;
