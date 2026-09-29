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
title: "時系列のやり取りを書く例"
type: sequence

actors:
  - 利用者側
  - "API"
  - DB

flow:
  - 利用者側 -> "API": "GET /items"
  - "API" -> DB: "SELECT"

states:
  request_count: 0
  row_count: 0

animation:
  - step: "要求" 1.5s
    focus: [利用者側, "API"]
    tween:
      request_count: 0 -> 1
    badge: "要求"
    description: "利用者側が API を呼ぶ。 要求の数が 1 に増える。"

  - step: "取得" 1.5s
    focus: ["API", DB]
    tween:
      row_count: 0 -> 20
    badge: "取得済"
    description: "API が DB を引き、20 行を受け取る。 行の数が 20 に増える。"
`;

export const textDslSequence = textDslToDiagram(sourceYaml__textDslSequence);

export const sourceJson__textDslSequence = `{
  "title": "時系列のやり取りを書く例",
  "type": "sequence",
  "actors": [
    {
      "name": "利用者側"
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
      "from": "利用者側",
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
      "step": "要求",
      "duration": 1.5,
      "focus": [
        "利用者側",
        "API"
      ],
      "description": "利用者側が API を呼ぶ。 要求の数が 1 に増える。",
      "badge": "要求",
      "tween": {
        "request_count": [
          0,
          1
        ]
      }
    },
    {
      "step": "取得",
      "duration": 1.5,
      "focus": [
        "API",
        "DB"
      ],
      "description": "API が DB を引き、20 行を受け取る。 行の数が 20 に増える。",
      "badge": "取得済",
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
 * 図に載る。 時系列のやり取りの見本はカタログに数多くあるが、記法で書いた側は名前だけで、
 * **説明つきの形は組立て API の見本にしか無かった**。 別の行に分かれていると見比べられない
 * ので、同じ見本の切替にする。
 */
export const patternBase__textDslSequence = "名前だけ";

export const sourceYaml__pattern__textDslSequence__説明つき = `
title: "面に説明を添えた時系列のやり取り"
type: sequence

actors:
  - 利用者側: "利用者の画面"
  - "API": "受け口"
  - DB: "保管先"

flow:
  - 利用者側 -> "API": "GET /items"
  - "API" -> DB: "SELECT"

animation:
  - step: "要求" 1.5s
    focus: [利用者側, "API"]
    badge: "要求"
    description: "利用者側が API を呼ぶ。 要求の数が 1 に増える。"

  - step: "取得" 1.5s
    focus: ["API", DB]
    badge: "取得済"
    description: "API が DB を引き、20 行を受け取る。 行の数が 20 に増える。"
`;

export const sourceJson__pattern__textDslSequence__説明つき = `{
  "title": "面に説明を添えた時系列のやり取り",
  "type": "sequence",
  "actors": [
    { "name": "利用者側", "subtitle": "利用者の画面" },
    { "name": "API", "subtitle": "受け口" },
    { "name": "DB", "subtitle": "保管先" }
  ],
  "flow": [
    { "from": "利用者側", "to": "API", "label": "GET /items" },
    { "from": "API", "to": "DB", "label": "SELECT" }
  ],
  "animation": [
    {
      "step": "要求",
      "duration": 1.5,
      "focus": ["利用者側", "API"],
      "description": "利用者側が API を呼ぶ。 要求の数が 1 に増える。",
      "badge": "要求"
    },
    {
      "step": "取得",
      "duration": 1.5,
      "focus": ["API", "DB"],
      "description": "API が DB を引き、20 行を受け取る。 行の数が 20 に増える。",
      "badge": "取得済"
    }
  ]
}`;

export const pattern__textDslSequence__説明つき = textDslToDiagram(
  sourceYaml__pattern__textDslSequence__説明つき,
);

// ─── flow + animation (認証フロー) ─────
export const sourceYaml__textDslFlow = `
title: "認証の流れ"
type: flow

actors:
  - 開始: event
  - 確認: function
  - 完了: event

flow:
  - 開始 -> 確認: "入力"
  - 確認 -> 完了: "はい" (success)

states:
  progress: 0

animation:
  - step: "処理中" 1s
    focus: [開始, 確認]
    tween:
      progress: 0 -> 50
    badge: "進行中"
    description: "開始から確認へ進み、進み具合の値が 0 から 50 へ動く。 まだ完了へは繋がっていない。"

  - step: "完了" 1s
    focus: [確認, 完了]
    tween:
      progress: 50 -> 100
    badge: "完了"
    description: "確認から完了へ進み、値が 100 になる。 成功の色で描かれた線が最後の 1 本。"
`;

export const textDslFlow = textDslToDiagram(sourceYaml__textDslFlow);

export const sourceJson__textDslFlow = `{
  "title": "認証の流れ",
  "type": "flow",
  "actors": [
    {
      "name": "開始",
      "kind": "event"
    },
    {
      "name": "確認",
      "kind": "function"
    },
    {
      "name": "完了",
      "kind": "event"
    }
  ],
  "flow": [
    {
      "from": "開始",
      "to": "確認",
      "label": "入力"
    },
    {
      "from": "確認",
      "to": "完了",
      "label": "はい",
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
        "開始",
        "確認"
      ],
      "badge": "進行中",
      "tween": {
        "progress": [
          0,
          50
        ]
      },
      "description": "開始から確認へ進み、進み具合の値が 0 から 50 へ動く。 まだ完了へは繋がっていない。"
    },
    {
      "step": "完了",
      "duration": 1,
      "focus": [
        "確認",
        "完了"
      ],
      "badge": "完了",
      "tween": {
        "progress": [
          50,
          100
        ]
      },
      "description": "確認から完了へ進み、値が 100 になる。 成功の色で描かれた線が最後の 1 本。"
    }
  ]
}`;

// ─── swimlane + animation (並列処理) ─────
export const sourceYaml__textDslSwimlane = `
title: "同時に走らせる処理"
type: swimlane

actors:
  - 役務 A: service
  - 役務 B: service
  - 役務 C: service

flow:
  - 役務 A -> 役務 B: "振り分け" (info)
  - 役務 B -> 役務 C: "転送" (success)

animation:
  - step: "振り分け" 1.5s
    focus: ["役務 A", "役務 B"]
    badge: "A → B"
    description: "役務 A から役務 B へ振り分けが渡る。 帯が持ち場を分けるので、どこで処理しているかが横の位置で分かる。"

  - step: "転送" 1.5s
    focus: ["役務 B", "役務 C"]
    badge: "B → C"
    description: "役務 B から役務 C へ転送される。 帯をまたぐ線が処理の受け渡しを表す。"
`;

export const textDslSwimlane = textDslToDiagram(sourceYaml__textDslSwimlane);

export const sourceJson__textDslSwimlane = `{
  "title": "同時に走らせる処理",
  "type": "swimlane",
  "actors": [
    {
      "name": "役務 A",
      "kind": "service"
    },
    {
      "name": "役務 B",
      "kind": "service"
    },
    {
      "name": "役務 C",
      "kind": "service"
    }
  ],
  "flow": [
    {
      "from": "役務 A",
      "to": "役務 B",
      "label": "振り分け",
      "tone": "info"
    },
    {
      "from": "役務 B",
      "to": "役務 C",
      "label": "転送",
      "tone": "success"
    }
  ],
  "animation": [
    {
      "step": "振り分け",
      "duration": 1.5,
      "focus": [
        "役務 A",
        "役務 B"
      ],
      "badge": "A → B",
      "description": "役務 A から役務 B へ振り分けが渡る。 帯が持ち場を分けるので、どこで処理しているかが横の位置で分かる。"
    },
    {
      "step": "転送",
      "duration": 1.5,
      "focus": [
        "役務 B",
        "役務 C"
      ],
      "badge": "B → C",
      "description": "役務 B から役務 C へ転送される。 帯をまたぐ線が処理の受け渡しを表す。"
    }
  ]
}`;

// ─── flowchart (分かれ道と担当) ─────
export const sourceYaml__textDslFlowchart = `
title: "経費申請の承認"
type: flowchart

actors:
  - 申請を出す: mark-start
    title: "申請"
    lane: 申請者
  - 金額を確かめる
    lane: 承認者
  - 5 万円を超えるか: decision
    lane: 承認者
  - 部長が承認する
    lane: 承認者
  - 支払う: mark-end
    title: "支払"
    lane: 承認者

flow:
  - 申請を出す -> 金額を確かめる: "提出"
  - 金額を確かめる -> 5 万円を超えるか: "確認"
  - 5 万円を超えるか -> 部長が承認する: "超える"
  - 5 万円を超えるか -> 支払う: "超えない"
  - 部長が承認する -> 支払う: "承認"

animation:
  - step: "受け取る" 1.2s
    focus: ["申請を出す", "金額を確かめる"]
    badge: "提出"
    description: "申請が出され、承認者が金額を確かめる段へ移る。 始まりの印が付いた箱から入る。"

  - step: "分かれ道" 1.2s
    focus: ["5 万円を超えるか"]
    badge: "判断"
    description: "5 万円を超えるかで道が 2 つに分かれる。 菱形の箱が分かれ道を表す。"

  - step: "決まる" 1.2s
    focus: ["部長が承認する", "支払う"]
    badge: "承認"
    description: "超える時は部長の承認を経て、超えない時は直に支払いへ進む。 どちらの道も終わりの印の箱へ着く。"
`;

export const textDslFlowchart = textDslToDiagram(sourceYaml__textDslFlowchart);

export const sourceJson__textDslFlowchart = `{
  "title": "経費申請の承認",
  "type": "flowchart",
  "actors": [
    {
      "name": "申請を出す",
      "kind": "mark-start",
      "title": "申請",
      "lane": "申請者"
    },
    {
      "name": "金額を確かめる",
      "lane": "承認者"
    },
    {
      "name": "5 万円を超えるか",
      "kind": "decision",
      "lane": "承認者"
    },
    {
      "name": "部長が承認する",
      "lane": "承認者"
    },
    {
      "name": "支払う",
      "kind": "mark-end",
      "title": "支払",
      "lane": "承認者"
    }
  ],
  "flow": [
    {
      "from": "申請を出す",
      "to": "金額を確かめる",
      "label": "提出"
    },
    {
      "from": "金額を確かめる",
      "to": "5 万円を超えるか",
      "label": "確認"
    },
    {
      "from": "5 万円を超えるか",
      "to": "部長が承認する",
      "label": "超える"
    },
    {
      "from": "5 万円を超えるか",
      "to": "支払う",
      "label": "超えない"
    },
    {
      "from": "部長が承認する",
      "to": "支払う",
      "label": "承認"
    }
  ],
  "animation": [
    {
      "step": "受け取る",
      "duration": 1.2,
      "focus": [
        "申請を出す",
        "金額を確かめる"
      ],
      "badge": "提出",
      "description": "申請が出され、承認者が金額を確かめる段へ移る。 始まりの印が付いた箱から入る。"
    },
    {
      "step": "分かれ道",
      "duration": 1.2,
      "focus": [
        "5 万円を超えるか"
      ],
      "badge": "判断",
      "description": "5 万円を超えるかで道が 2 つに分かれる。 菱形の箱が分かれ道を表す。"
    },
    {
      "step": "決まる",
      "duration": 1.2,
      "focus": [
        "部長が承認する",
        "支払う"
      ],
      "badge": "承認",
      "description": "超える時は部長の承認を経て、超えない時は直に支払いへ進む。 どちらの道も終わりの印の箱へ着く。"
    }
  ]
}`;

// ─── state + animation (FSM) ─────
export const sourceYaml__textDslStateMachine = `
title: "認証の状態遷移"
type: state

actors:
  - 待機
  - 読込中
  - 完了
  - 異常

flow:
  - 待機 -> 読込中: "送信"
  - 読込中 -> 完了: "成功" (success) { guard: "入力が正しい" }
  - 読込中 -> 異常: "失敗" (error)
  - 異常 -> 待機: "再試行"

states:
  counter: 0

animation:
  - step: "送信" 1s
    focus: [待機, 読込中]
    tween:
      counter: 0 -> 1
    badge: "送信"
    description: "待機から読込中へ移る。 数える値が 1 へ増え、遷移した回数を表す。"

  - step: "成功" 1s
    focus: [読込中, 完了]
    tween:
      counter: 1 -> 2
    badge: "完了"
    description: "読込中から完了へ移る。 この線には条件が添えてあり、入力が正しい時だけ通る。"
`;

export const textDslStateMachine = textDslToDiagram(sourceYaml__textDslStateMachine);

export const sourceJson__textDslStateMachine = `{
  "title": "認証の状態遷移",
  "type": "state",
  "actors": [
    {
      "name": "待機"
    },
    {
      "name": "読込中"
    },
    {
      "name": "完了"
    },
    {
      "name": "異常"
    }
  ],
  "flow": [
    {
      "from": "待機",
      "to": "読込中",
      "label": "送信"
    },
    {
      "from": "読込中",
      "to": "完了",
      "label": "成功",
      "tone": "success",
      "guard": "入力が正しい"
    },
    {
      "from": "読込中",
      "to": "異常",
      "label": "失敗",
      "tone": "error"
    },
    {
      "from": "異常",
      "to": "待機",
      "label": "再試行"
    }
  ],
  "states": {
    "counter": 0
  },
  "animation": [
    {
      "step": "送信",
      "duration": 1,
      "focus": [
        "待機",
        "読込中"
      ],
      "badge": "送信",
      "tween": {
        "counter": [
          0,
          1
        ]
      },
      "description": "待機から読込中へ移る。 数える値が 1 へ増え、遷移した回数を表す。"
    },
    {
      "step": "成功",
      "duration": 1,
      "focus": [
        "読込中",
        "完了"
      ],
      "badge": "完了",
      "tween": {
        "counter": [
          1,
          2
        ]
      },
      "description": "読込中から完了へ移る。 この線には条件が添えてあり、入力が正しい時だけ通る。"
    }
  ]
}`;

// ─── topology + animation (システム構成) ─────
export const sourceYaml__textDslTopology = `
title: "系の構成"
type: topology

actors:
  - 閲覧ソフト: service
  - API: service
  - DB: database

flow:
  - 閲覧ソフト -> API: "HTTPS"
  - API -> DB: "SQL"

animation:
  - step: "要求" 1s
    focus: [閲覧ソフト, API]
    badge: "要求中"
    description: "閲覧ソフトから API へ要求が渡る。 線の脇に何で繋ぐかを書く。"

  - step: "問い合わせ" 1s
    focus: [API, DB]
    badge: "問合中"
    description: "API から DB へ問い合わせが渡る。 箱の種別で処理役と保存先が描き分けられる。"
`;

export const textDslTopology = textDslToDiagram(sourceYaml__textDslTopology);

export const sourceJson__textDslTopology = `{
  "title": "系の構成",
  "type": "topology",
  "actors": [
    {
      "name": "閲覧ソフト",
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
      "from": "閲覧ソフト",
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
      "step": "要求",
      "duration": 1,
      "focus": [
        "閲覧ソフト",
        "API"
      ],
      "badge": "要求中",
      "description": "閲覧ソフトから API へ要求が渡る。 線の脇に何で繋ぐかを書く。"
    },
    {
      "step": "問い合わせ",
      "duration": 1,
      "focus": [
        "API",
        "DB"
      ],
      "badge": "問合中",
      "description": "API から DB へ問い合わせが渡る。 箱の種別で処理役と保存先が描き分けられる。"
    }
  ]
}`;

// ─── er + animation (ER 図) ─────
export const sourceYaml__textDslEr = `
title: "表と関係の設計"
type: er
# 順番を持たない図なので、触れた箱の関係を光らせる (#1757)。
# 線は最初から全部出す = 段は引くのをやめて光らせるだけになる
relations: hover
reveal: all

actors:
  - User
  - Order

flow:
  - User -> Order: "注文する" (info) { cardinality: "1:N" }

animation:
  - step: "片方" 1s
    focus: [User]
    badge: "User"
    description: "User の表だけを見る。 線は最初から全部出ているので、段は引く代わりに見る先を移す。"
  - step: "つながり" 1s
    focus: ["User -> Order"]
    badge: "注文する"
    description: "User と Order を結ぶ関係を見る。 線の脇の語が何の関係かを表す。"
  - step: "全体" 1s
    focus: [User, Order]
    badge: "1:N"
    description: "2 つの表と関係をまとめて見る。 1 対多なので、Order の側の端が三又になる。"
`;

export const textDslEr = textDslToDiagram(sourceYaml__textDslEr);

/**
 * 多重度の語を全て並べる形 (#2105)。
 *
 * 多重度の欄 (`cardinality`) は 6 語を受け、語ごとに両端の形が決まる (`ER_CARDINALITY_HEAD`)。
 * 元の見本は `1:N` の 1 語しか書いておらず、残る 5 語の端がどう描かれるかをカタログで見られなかった。
 * 同じ見本の切替にして、語と端の形を 1 枚で見比べられるようにする。
 *
 * 語は関係の意味に合うものを 1 つずつ当てる。 表は 2 列に置き、6 本の関係が全て隣り合う表を
 * 縦か横に結ぶようにする (斜めの線と交わる線を作らない)。 一覧の枠 (幅 874px) に 3 列で置くと
 * 読めない倍率まで縮む。
 */
export const patternBase__textDslEr = "1 つの関係";

export const sourceYaml__pattern__textDslEr__多重度を全て並べる = `
title: "通販の表と 6 通りの多重度"
type: er
# 順番を持たない図なので、触れた箱の関係を光らせる (#1757)。
# 線は最初から全部出す = 段は引くのをやめて光らせるだけになる
relations: hover
reveal: all

# 表を 2 列に置く。 どの関係も隣り合う表を縦か横に結ぶ
lanes:
  c0: { width: 470 }
  c1: { width: 470 }

actors:
  - 会員証: { lane: c0, stack: 0 }
  - 利用者: { lane: c0, stack: 1 }
  - 注文: { lane: c0, stack: 2 }
  - 支払い: { lane: c0, stack: 3 }
  - 届け先: { lane: c1, stack: 1 }
  - 店舗: { lane: c1, stack: 2 }
  - 商品: { lane: c1, stack: 3 }

# 語ごとに両端の形が決まる。 語は名前の下の行に出る
flow:
  - 利用者 -> 会員証: "発行を受ける" (info) { cardinality: "1:1" }
  - 利用者 -> 注文: "注文する" (info) { cardinality: "1:N" }
  - 注文 -> 店舗: "受け付けられる" (info) { cardinality: "N:1" }
  - 店舗 -> 商品: "取り扱う" (info) { cardinality: "N:M" }
  - 利用者 -> 届け先: "既定に選ぶ" (info) { cardinality: "0..1" }
  - 注文 -> 支払い: "支払われる" (info) { cardinality: "1..*" }

# 最初の段は表だけを光らせる。 一覧の縮小図は最初の段を描くので、線を光らせると引き始めの姿で止まる
animation:
  - step: "7 つの表" 1s
    focus: [会員証, 利用者, 注文, 支払い, 届け先, 店舗, 商品]
    badge: "表"
    description: "7 つの表を先に見せる。 一覧の縮小図はこの段を描くので、線は光らせない。"
  - step: "ちょうど 1 つずつ" 1s
    focus: [利用者, 会員証, "利用者 -> 会員証"]
    badge: "1:1"
    description: "利用者と会員証を結ぶ関係を見る。 両端がどちらも 1 なので、相手はちょうど 1 つ。"
  - step: "1 つから多数" 1s
    focus: [利用者, 注文, "利用者 -> 注文"]
    badge: "1:N"
    description: "利用者と注文の関係を見る。 注文の側が多数で、1 人が何件でも持てる。"
  - step: "多数から 1 つ" 1s
    focus: [注文, 店舗, "注文 -> 店舗"]
    badge: "N:1"
    description: "注文と店舗の関係を見る。 向きが逆で、多数の注文が 1 つの店舗に属する。"
  - step: "多数どうし" 1s
    focus: [店舗, 商品, "店舗 -> 商品"]
    badge: "N:M"
    description: "店舗と商品の関係を見る。 両端が多数なので、間に中継の表を置くのが普通。"
  - step: "無いか 1 つ" 1s
    focus: [利用者, 届け先, "利用者 -> 届け先"]
    badge: "0..1"
    description: "利用者と届け先の関係を見る。 無くてもよい相手なので、端に 0 の印が付く。"
  - step: "1 つ以上" 1s
    focus: [注文, 支払い, "注文 -> 支払い"]
    badge: "1..*"
    description: "注文と支払いの関係を見る。 少なくとも 1 つは要るので、0 件は許されない。"
`;

export const sourceJson__pattern__textDslEr__多重度を全て並べる = `{
  "title": "通販の表と 6 通りの多重度",
  "type": "er",
  "relations": "hover",
  "reveal": "all",
  "lanes": { "c0": { "width": 470 }, "c1": { "width": 470 } },
  "actors": [
    { "name": "会員証", "lane": "c0", "stack": 0 },
    { "name": "利用者", "lane": "c0", "stack": 1 },
    { "name": "注文", "lane": "c0", "stack": 2 },
    { "name": "支払い", "lane": "c0", "stack": 3 },
    { "name": "届け先", "lane": "c1", "stack": 1 },
    { "name": "店舗", "lane": "c1", "stack": 2 },
    { "name": "商品", "lane": "c1", "stack": 3 }
  ],
  "flow": [
    { "from": "利用者", "to": "会員証", "label": "発行を受ける", "tone": "info", "cardinality": "1:1" },
    { "from": "利用者", "to": "注文", "label": "注文する", "tone": "info", "cardinality": "1:N" },
    { "from": "注文", "to": "店舗", "label": "受け付けられる", "tone": "info", "cardinality": "N:1" },
    { "from": "店舗", "to": "商品", "label": "取り扱う", "tone": "info", "cardinality": "N:M" },
    { "from": "利用者", "to": "届け先", "label": "既定に選ぶ", "tone": "info", "cardinality": "0..1" },
    { "from": "注文", "to": "支払い", "label": "支払われる", "tone": "info", "cardinality": "1..*" }
  ],
  "animation": [
    { "step": "7 つの表", "duration": 1, "focus": ["会員証", "利用者", "注文", "支払い", "届け先", "店舗", "商品"], "badge": "表", "description": "7 つの表を先に見せる。 一覧の縮小図はこの段を描くので、線は光らせない。" },
    { "step": "ちょうど 1 つずつ", "duration": 1, "focus": ["利用者", "会員証", "利用者 -> 会員証"], "badge": "1:1", "description": "利用者と会員証を結ぶ関係を見る。 両端がどちらも 1 なので、相手はちょうど 1 つ。" },
    { "step": "1 つから多数", "duration": 1, "focus": ["利用者", "注文", "利用者 -> 注文"], "badge": "1:N", "description": "利用者と注文の関係を見る。 注文の側が多数で、1 人が何件でも持てる。" },
    { "step": "多数から 1 つ", "duration": 1, "focus": ["注文", "店舗", "注文 -> 店舗"], "badge": "N:1", "description": "注文と店舗の関係を見る。 向きが逆で、多数の注文が 1 つの店舗に属する。" },
    { "step": "多数どうし", "duration": 1, "focus": ["店舗", "商品", "店舗 -> 商品"], "badge": "N:M", "description": "店舗と商品の関係を見る。 両端が多数なので、間に中継の表を置くのが普通。" },
    { "step": "無いか 1 つ", "duration": 1, "focus": ["利用者", "届け先", "利用者 -> 届け先"], "badge": "0..1", "description": "利用者と届け先の関係を見る。 無くてもよい相手なので、端に 0 の印が付く。" },
    { "step": "1 つ以上", "duration": 1, "focus": ["注文", "支払い", "注文 -> 支払い"], "badge": "1..*", "description": "注文と支払いの関係を見る。 少なくとも 1 つは要るので、0 件は許されない。" }
  ]
}`;

export const pattern__textDslEr__多重度を全て並べる = textDslToDiagram(
  sourceYaml__pattern__textDslEr__多重度を全て並べる,
);

export const sourceJson__textDslEr = `{
  "title": "表と関係の設計",
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
      "label": "注文する",
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
      "badge": "User",
      "description": "User の表だけを見る。 線は最初から全部出ているので、段は引く代わりに見る先を移す。"
    },
    {
      "step": "つながり",
      "duration": 1,
      "focus": [
        "User -> Order"
      ],
      "badge": "注文する",
      "description": "User と Order を結ぶ関係を見る。 線の脇の語が何の関係かを表す。"
    },
    {
      "step": "全体",
      "duration": 1,
      "focus": [
        "User",
        "Order"
      ],
      "badge": "1:N",
      "description": "2 つの表と関係をまとめて見る。 1 対多なので、Order の側の端が三又になる。"
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
  - teams: { lane: c0, stack: 2, kind: storage, subtitle: "チーム", rows: ["id: bigint", "name: text"], marks: ["pk", ""] }
  - tags: { lane: c0, stack: 3, kind: storage, subtitle: "タグ", rows: ["id: bigint", "name: text"], marks: ["pk", ""] }
  - projects: { lane: c1, stack: 2, kind: storage, subtitle: "案件", rows: ["id: bigint", "team_id: bigint", "owner_id: bigint"], marks: ["pk", "fk", "fk"] }
  - user_roles: { lane: c1, stack: 0, kind: storage, subtitle: "役割の割当", rows: ["user_id: bigint", "role_id: bigint"], marks: ["pk fk", "pk fk"] }
  - team_members: { lane: c1, stack: 1, kind: storage, subtitle: "チームの所属", rows: ["team_id: bigint", "user_id: bigint"], marks: ["pk fk", "pk fk"] }
  - project_tags: { lane: c1, stack: 3, kind: storage, subtitle: "案件のタグ", rows: ["project_id: bigint", "tag_id: bigint"], marks: ["pk fk", "pk fk"] }

# 端の印は両端に立つ。 箱に近い側が個数 (棒 = 1 / 三又 = 多)、その外側が任意か
flow:
  - users -> user_roles: "役割を持つ" (info, solid) { tailHead: one, head: many }
  - roles -> user_roles: "割り当てる" (info, solid) { tailHead: one, head: many }
  - users -> team_members: "所属する" (info, solid) { tailHead: one, head: many }
  - teams -> team_members: "メンバーを持つ" (info, solid) { tailHead: one, head: many }
  - teams -> projects: "担当する" (info, dashed) { tailHead: one, head: zero-many }
  - projects -> project_tags: "タグを持つ" (info, solid) { tailHead: one, head: many }
  - tags -> project_tags: "案件に付く" (info, solid) { tailHead: one, head: many }
  - users -> projects: "責任者になる" (info, dashed) { tailHead: one, head: zero-many }

# 線も段に載せる。 段が名指ししていない線は「光っていない合図」 として刻まれるので、
# 載せないと実線で書いた関係が破線に見える
animation:
  - step: "1. 実体の表" 1.2s
    focus: [roles, users, teams, tags]
    badge: "5 つの実体"
    description: "それ自体で意味を持つ 4 つの表を見る。 鍵の列は名前に下線が付く。"
  - step: "2. 中継表" 1.2s
    focus: [user_roles, team_members, project_tags]
    badge: "鍵だけの 3 表"
    description: "鍵だけで出来た 3 つの表を見る。 多対多を 2 つの 1 対多に分けるために置く。"
  - step: "3. 多対多の 2 組" 1.4s
    focus: [users, user_roles, roles, teams, team_members, users -> user_roles, roles -> user_roles, users -> team_members, teams -> team_members]
    badge: "役割とチーム"
    description: "役割の割当とチームの所属を、両側の表と一緒に見る。 中継表の左右から線が 1 本ずつ入る。"
  - step: "4. 案件とタグ" 1.4s
    focus: [projects, project_tags, tags, teams, users, projects -> project_tags, tags -> project_tags, teams -> projects, users -> projects]
    badge: "案件とタグ"
    description: "案件とタグの組を見る。 担当と責任者の 2 本は破線で、相手が無くてもよいことを表す。"
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
      "subtitle": "チーム",
      "rows": ["id: bigint", "name: text"],
      "marks": ["pk", ""]
    },
    {
      "name": "tags",
      "lane": "c0",
      "stack": 3,
      "kind": "storage",
      "subtitle": "タグ",
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
      "subtitle": "チームの所属",
      "rows": ["team_id: bigint", "user_id: bigint"],
      "marks": ["pk fk", "pk fk"]
    },
    {
      "name": "project_tags",
      "lane": "c1",
      "stack": 3,
      "kind": "storage",
      "subtitle": "案件のタグ",
      "rows": ["project_id: bigint", "tag_id: bigint"],
      "marks": ["pk fk", "pk fk"]
    }
  ],
  "flow": [
    { "from": "users", "to": "user_roles", "label": "役割を持つ", "tone": "info", "style": "solid", "tailHead": "one", "head": "many" },
    { "from": "roles", "to": "user_roles", "label": "割り当てる", "tone": "info", "style": "solid", "tailHead": "one", "head": "many" },
    { "from": "users", "to": "team_members", "label": "所属する", "tone": "info", "style": "solid", "tailHead": "one", "head": "many" },
    { "from": "teams", "to": "team_members", "label": "メンバーを持つ", "tone": "info", "style": "solid", "tailHead": "one", "head": "many" },
    { "from": "teams", "to": "projects", "label": "担当する", "tone": "info", "style": "dashed", "tailHead": "one", "head": "zero-many" },
    { "from": "projects", "to": "project_tags", "label": "タグを持つ", "tone": "info", "style": "solid", "tailHead": "one", "head": "many" },
    { "from": "tags", "to": "project_tags", "label": "案件に付く", "tone": "info", "style": "solid", "tailHead": "one", "head": "many" },
    { "from": "users", "to": "projects", "label": "責任者になる", "tone": "info", "style": "dashed", "tailHead": "one", "head": "zero-many" }
  ],
  "animation": [
    { "step": "1. 実体の表", "duration": 1.2, "focus": ["roles", "users", "teams", "tags"], "badge": "5 つの実体", "description": "それ自体で意味を持つ 4 つの表を見る。 鍵の列は名前に下線が付く。" },
    { "step": "2. 中継表", "duration": 1.2, "focus": ["user_roles", "team_members", "project_tags"], "badge": "鍵だけの 3 表", "description": "鍵だけで出来た 3 つの表を見る。 多対多を 2 つの 1 対多に分けるために置く。" },
    { "step": "3. 多対多の 2 組", "duration": 1.4, "focus": ["users", "user_roles", "roles", "teams", "team_members", "users -> user_roles", "roles -> user_roles", "users -> team_members", "teams -> team_members"], "badge": "役割とチーム", "description": "役割の割当とチームの所属を、両側の表と一緒に見る。 中継表の左右から線が 1 本ずつ入る。" },
    { "step": "4. 案件とタグ", "duration": 1.4, "focus": ["projects", "project_tags", "tags", "teams", "users", "projects -> project_tags", "tags -> project_tags", "teams -> projects", "users -> projects"], "badge": "案件とタグ", "description": "案件とタグの組を見る。 担当と責任者の 2 本は破線で、相手が無くてもよいことを表す。" }
  ]
}`;

// ─── gantt preset (Q1-Q3 ロードマップ) ─────
export const sourceYaml__textDslGantt = `
title: "新しい画面を出すまで"
type: gantt

actors:
  - 要件を固める: { subtitle: "Q1" }
  - 作って試す: { subtitle: "Q2" }
  - 配って直す: { subtitle: "Q3" }

flow:
  - 要件を固める -> 作って試す
  - 作って試す -> 配って直す

states:
  design_progress: 0
  build_progress: 0

animation:
  - step: "Q1 進行" 2.4s
    focus: ["要件を固める", "作って試す", "配って直す"]
    draw: gantt
    tween:
      design_progress: 0 -> 100
    badge: "Q1 完了"
    description: "Q1 の帯が引かれ、進み具合が 100 まで動く。 帯の長さが期間、塗りが進み具合。"

  - step: "Q2 開始" 1.2s
    focus: ["要件を固める", "作って試す", "配って直す"]
    tween:
      build_progress: 0 -> 50
    badge: "Q2 進行中"
    description: "Q2 の進み具合が 50 まで進む。 Q1 の帯は引き終わったまま残る。"
`;

export const textDslGantt = textDslToDiagram(sourceYaml__textDslGantt);

export const sourceJson__textDslGantt = `{
  "title": "新しい画面を出すまで",
  "type": "gantt",
  "actors": [
    {
      "name": "要件を固める",
      "kind": "card",
      "subtitle": "Q1"
    },
    {
      "name": "作って試す",
      "kind": "card",
      "subtitle": "Q2"
    },
    {
      "name": "配って直す",
      "kind": "card",
      "subtitle": "Q3"
    }
  ],
  "flow": [
    {
      "from": "要件を固める",
      "to": "作って試す",
      "label": ""
    },
    {
      "from": "作って試す",
      "to": "配って直す",
      "label": ""
    }
  ],
  "states": {
    "design_progress": 0,
    "build_progress": 0
  },
  "animation": [
    {
      "step": "Q1 進行",
      "duration": 2.4,
      "focus": [
        "要件を固める",
        "作って試す",
        "配って直す"
      ],
      "draw": "gantt",
      "badge": "Q1 完了",
      "tween": {
        "design_progress": [
          0,
          100
        ]
      },
      "description": "Q1 の帯が引かれ、進み具合が 100 まで動く。 帯の長さが期間、塗りが進み具合。"
    },
    {
      "step": "Q2 開始",
      "duration": 1.2,
      "focus": [
        "要件を固める",
        "作って試す",
        "配って直す"
      ],
      "badge": "Q2 進行中",
      "tween": {
        "build_progress": [
          0,
          50
        ]
      },
      "description": "Q2 の進み具合が 50 まで進む。 Q1 の帯は引き終わったまま残る。"
    }
  ]
}`;

// ─── class preset (UML class diagram 風) ─────
export const sourceYaml__textDslClass = `
title: "クラスの関係"
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
    description: "親にあたる User だけを見る。 箱の下の行に持ち物と操作を書く。"
  - step: "つながり" 1s
    focus: ["User -> Admin"]
    badge: "extends"
    description: "User と Admin を結ぶ線を見る。 線の脇の語が継承を表す。"
  - step: "子まで" 1s
    focus: [User, Admin]
    badge: "Admin extends User"
    description: "親と子をまとめて見る。 Admin は User の持ち物を受け継いだ上で自分の分を足している。"
`;

export const textDslClass = textDslToDiagram(sourceYaml__textDslClass);

export const sourceJson__textDslClass = `{
  "title": "クラスの関係",
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
      "badge": "User",
      "description": "親にあたる User だけを見る。 箱の下の行に持ち物と操作を書く。"
    },
    {
      "step": "つながり",
      "duration": 1,
      "focus": [
        "User -> Admin"
      ],
      "badge": "extends",
      "description": "User と Admin を結ぶ線を見る。 線の脇の語が継承を表す。"
    },
    {
      "step": "子まで",
      "duration": 1,
      "focus": [
        "User",
        "Admin"
      ],
      "badge": "Admin extends User",
      "description": "親と子をまとめて見る。 Admin は User の持ち物を受け継いだ上で自分の分を足している。"
    }
  ]
}`;

/**
 * 同じ関係を `type: class` で書く形 (#2396)。
 *
 * 元の見本はフローで 2 箱を繋いでいる。 クラス図で書くと、行 (`rows:`) が持ち物と
 * 振る舞いに割れ (括弧の有無で分かれる)、関係の種類 (`relation:`) が線と端の形を決める。
 *
 * **段 (`stack:`) を書かずに縦列だけ書く**。 段を書かない箱は、その縦列の空いている
 * 一番小さい段に順に載る。 この形はかつて配置の計算が投げて 1 枚も描けなかった。
 *
 * 順番を持たない図なので触れて読む形にする (#1757)。 線は最初から全部出す。
 */
export const patternBase__textDslClass = "フローで書く";

export const sourceYaml__pattern__textDslClass__クラス図で書く = `title: "クラスの関係をクラス図で書く"
type: class
relations: hover
reveal: all

lanes:
  c0: { width: 320 }
  c1: { width: 320 }

actors:
  - 利用者: { lane: c0, eyebrow: "抽象", rows: ["+名前: 文字", "───", "+入る(): 通行証"] }
  - 管理者: { lane: c0, rows: ["+権限: 文字", "───", "+止める(): 無し"] }
  - 注文: { lane: c1, rows: ["+番号: 数", "───", "+支払う(): 受領書"] }
  - 受領書: { lane: c1, rows: ["+控え番号: 文字"] }

flow:
  - 管理者 -> 利用者: "継承" { relation: extends }
  - 管理者 -> 注文: "集約" { relation: aggregates, sub: "1..*", tailSub: "1" }
  - 注文 -> 受領書: "依存" { relation: uses }

animation:
  - step: "親と子" 1s
    focus: [利用者, 管理者]
    badge: "継承"
    description: "管理者は利用者の性質をそのまま受け継ぐ。 線は実線で、先が白抜きの三角になる。 色は縦の関係を表す群で、実装も同じ色で描かれる。"
  - step: "持つ" 1s
    focus: [管理者, 注文]
    badge: "集約"
    description: "管理者は注文をまとめて持つ。 元の端に白抜きの菱形が付き、1 人が 1 つ以上を持つことを添字が書く。 色は所有を表す群で、コンポジションも同じ色で描かれる。"
  - step: "使う" 1s
    focus: [注文, 受領書]
    badge: "依存"
    description: "注文は受領書を戻り値として使うだけで、持ち続けはしない。 線は破線で、先が開いた矢になる。 色は向きだけの関係を表す群で、関連も同じ色で描かれる。"
`;

export const sourceJson__pattern__textDslClass__クラス図で書く = `{
  "title": "クラスの関係をクラス図で書く",
  "type": "class",
  "relations": "hover",
  "reveal": "all",
  "lanes": {
    "c0": { "width": 320 },
    "c1": { "width": 320 }
  },
  "actors": [
    { "name": "利用者", "lane": "c0", "eyebrow": "抽象", "rows": ["+名前: 文字", "───", "+入る(): 通行証"] },
    { "name": "管理者", "lane": "c0", "rows": ["+権限: 文字", "───", "+止める(): 無し"] },
    { "name": "注文", "lane": "c1", "rows": ["+番号: 数", "───", "+支払う(): 受領書"] },
    { "name": "受領書", "lane": "c1", "rows": ["+控え番号: 文字"] }
  ],
  "flow": [
    { "from": "管理者", "to": "利用者", "label": "継承", "relation": "extends" },
    { "from": "管理者", "to": "注文", "label": "集約", "relation": "aggregates", "sub": "1..*", "tailSub": "1" },
    { "from": "注文", "to": "受領書", "label": "依存", "relation": "uses" }
  ],
  "animation": [
    { "step": "親と子", "duration": 1, "focus": ["利用者", "管理者"], "badge": "継承", "description": "管理者は利用者の性質をそのまま受け継ぐ。 線は実線で、先が白抜きの三角になる。 色は縦の関係を表す群で、実装も同じ色で描かれる。" },
    { "step": "持つ", "duration": 1, "focus": ["管理者", "注文"], "badge": "集約", "description": "管理者は注文をまとめて持つ。 元の端に白抜きの菱形が付き、1 人が 1 つ以上を持つことを添字が書く。 色は所有を表す群で、コンポジションも同じ色で描かれる。" },
    { "step": "使う", "duration": 1, "focus": ["注文", "受領書"], "badge": "依存", "description": "注文は受領書を戻り値として使うだけで、持ち続けはしない。 線は破線で、先が開いた矢になる。 色は向きだけの関係を表す群で、関連も同じ色で描かれる。" }
  ]
}`;

export const pattern__textDslClass__クラス図で書く = textDslToDiagram(
  sourceYaml__pattern__textDslClass__クラス図で書く,
);

// ─── pie preset (シェア円グラフ) ─────
export const sourceYaml__textDslPie = `
title: "問い合わせの手段の割合"
type: chart
shape: pie

actors:
  - 電話: { value: "30%" }
  - メール: { value: "50%" }
  - 窓口: { value: "20%" }

states:
  phone_share: 30
  mail_share: 50

animation:
  - step: "割合が入れ替わる" 2.4s
    focus: [電話, メール, 窓口]
    draw: pie
    tween:
      phone_share: 30 -> 40
      mail_share: 50 -> 40
    badge: "入れ替え後"
`;

export const textDslPie = textDslToDiagram(sourceYaml__textDslPie);

export const sourceJson__textDslPie = `{
  "title": "問い合わせの手段の割合",
  "type": "chart",
  "shape": "pie",
  "actors": [
    {
      "name": "電話",
      "kind": "card",
      "value": "30%"
    },
    {
      "name": "メール",
      "kind": "card",
      "value": "50%"
    },
    {
      "name": "窓口",
      "kind": "card",
      "value": "20%"
    }
  ],
  "flow": [],
  "states": {
    "phone_share": 30,
    "mail_share": 50
  },
  "animation": [
    {
      "step": "割合が入れ替わる",
      "duration": 2.4,
      "focus": [
        "電話",
        "メール",
        "窓口"
      ],
      "draw": "pie",
      "badge": "入れ替え後",
      "tween": {
        "phone_share": [
          30,
          40
        ],
        "mail_share": [
          50,
          40
        ]
      }
    }
  ]
}`;

/*
 * ─── c4 preset (全体の見取り図 → 動かす単位 → 部品) ─────
 *
 * **箱の説明の先頭に段の目印 (`L1` / `L2` / `L3`) を書く** (#2135)。 目印を書かない箱は全て
 * 「全体の見取り図」 に入り、C4 の図が他の図種と違う点 (段で見る粒度を分ける) が出ない。
 * 以前の見本は目印を 1 つも書かず、4 つの箱が 1 列に縦積みになっていた。
 *
 * 矢印は段の中の流れと、上の段の箱から下の段の箱へ「中を開く」 矢印の 2 種類。 1 つの箱から
 * 右の段へ 2 本出す繋ぎ方は、矢印の端と縦の間隔の検査に掛かるため採らない。
 * 見本が 3 段を使うことは `lib/c4-sample-levels.test.ts` が固定する。
 */
export const sourceYaml__textDslC4 = `
title: "ネット注文の C4 系統図"
type: c4

actors:
  - 購入者: { kind: person, subtitle: "L1 画面から注文する人" }
  - 注文の仕組み: { kind: service, subtitle: "L1 注文を受けて在庫を引き当てる系統" }
  - 画面: { kind: service, subtitle: "L2 閲覧ソフトで動く" }
  - 注文の受け口: { kind: api, subtitle: "L2 要求を受けて処理する" }
  - 注文の記録: { kind: database, subtitle: "L2 注文と在庫を保つ" }
  - 認証部品: { kind: service, subtitle: "L3 鍵を確かめる" }
  - 在庫部品: { kind: service, subtitle: "L3 在庫を引き当てる" }

flow:
  - 購入者 -> 注文の仕組み: "注文する"
  - 注文の仕組み -> 画面: "中を開く"
  - 画面 -> 注文の受け口: "POST 注文"
  - 注文の受け口 -> 注文の記録: "書く"
  - 注文の受け口 -> 認証部品: "中を開く"
  - 認証部品 -> 在庫部品: "通す"

animation:
  - step: "全体の見取り図" 1.4s
    focus: [購入者, 注文の仕組み, "購入者 -> 注文の仕組み"]
    badge: "L1"
    body: "系統を 1 つの箱として置き、使う人との関係だけを描く。"
  - step: "中を開く" 1.4s
    focus: ["注文の仕組み -> 画面", 画面, 注文の受け口, 注文の記録]
    badge: "L2"
    body: "系統の中を、単体で動かす画面と受け口と記録に分ける。"
  - step: "動かす単位の間" 1.2s
    focus: ["画面 -> 注文の受け口", "注文の受け口 -> 注文の記録"]
    badge: "POST 注文"
    body: "画面が受け口を呼び、受け口が記録へ書く。"
  - step: "部品まで開く" 1.4s
    focus: ["注文の受け口 -> 認証部品", 認証部品, 在庫部品, "認証部品 -> 在庫部品"]
    badge: "L3"
    body: "受け口の中を、鍵を確かめる部品と在庫を引き当てる部品に分ける。"
`;

export const textDslC4 = textDslToDiagram(sourceYaml__textDslC4);

export const sourceJson__textDslC4 = `{
  "title": "ネット注文の C4 系統図",
  "type": "c4",
  "actors": [
    { "name": "購入者", "kind": "person", "subtitle": "L1 画面から注文する人" },
    { "name": "注文の仕組み", "kind": "service", "subtitle": "L1 注文を受けて在庫を引き当てる系統" },
    { "name": "画面", "kind": "service", "subtitle": "L2 閲覧ソフトで動く" },
    { "name": "注文の受け口", "kind": "api", "subtitle": "L2 要求を受けて処理する" },
    { "name": "注文の記録", "kind": "database", "subtitle": "L2 注文と在庫を保つ" },
    { "name": "認証部品", "kind": "service", "subtitle": "L3 鍵を確かめる" },
    { "name": "在庫部品", "kind": "service", "subtitle": "L3 在庫を引き当てる" }
  ],
  "flow": [
    { "from": "購入者", "to": "注文の仕組み", "label": "注文する" },
    { "from": "注文の仕組み", "to": "画面", "label": "中を開く" },
    { "from": "画面", "to": "注文の受け口", "label": "POST 注文" },
    { "from": "注文の受け口", "to": "注文の記録", "label": "書く" },
    { "from": "注文の受け口", "to": "認証部品", "label": "中を開く" },
    { "from": "認証部品", "to": "在庫部品", "label": "通す" }
  ],
  "animation": [
    {
      "step": "全体の見取り図",
      "duration": 1.4,
      "focus": ["購入者", "注文の仕組み", "購入者 -> 注文の仕組み"],
      "badge": "L1",
      "body": "系統を 1 つの箱として置き、使う人との関係だけを描く。"
    },
    {
      "step": "中を開く",
      "duration": 1.4,
      "focus": ["注文の仕組み -> 画面", "画面", "注文の受け口", "注文の記録"],
      "badge": "L2",
      "body": "系統の中を、単体で動かす画面と受け口と記録に分ける。"
    },
    {
      "step": "動かす単位の間",
      "duration": 1.2,
      "focus": ["画面 -> 注文の受け口", "注文の受け口 -> 注文の記録"],
      "badge": "POST 注文",
      "body": "画面が受け口を呼び、受け口が記録へ書く。"
    },
    {
      "step": "部品まで開く",
      "duration": 1.4,
      "focus": ["注文の受け口 -> 認証部品", "認証部品", "在庫部品", "認証部品 -> 在庫部品"],
      "badge": "L3",
      "body": "受け口の中を、鍵を確かめる部品と在庫を引き当てる部品に分ける。"
    }
  ]
}`;

// ─── mind preset (放射状 mind map) ─────
export const sourceYaml__textDslMind = `
title: "思いつきの枝分かれ"
type: mind

states:
  stage: "下書き"

actors:
  - 中心
  - 案 1
  - 案 2
  - "決め手 {stage}"

animation:
  - step: "中心" 2.4s
    draw: mind
    set:
      stage: "下書き"
    badge: "発想"
    description: "中心から枝が引かれる。 差し替えの値は下書きのまま。"
  - step: "案が出る" 1s
    set:
      stage: "比べる"
    badge: "案 1"
    description: "枝の先に案が並ぶ。 値が比べるへ替わり、題の文字も一緒に変わる。"
  - step: "広がる" 1s
    set:
      stage: "選ぶ"
    badge: "案 3"
    description: "さらに枝が広がり、値が選ぶへ替わる。 名前に値を埋めておくと段ごとに題が変わる。"
`;

export const textDslMind = textDslToDiagram(sourceYaml__textDslMind);

export const sourceJson__textDslMind = `{
  "title": "思いつきの枝分かれ",
  "type": "mind",
  "actors": [
    {
      "name": "中心"
    },
    {
      "name": "案 1"
    },
    {
      "name": "案 2"
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
      },
      "description": "中心から枝が引かれる。 差し替えの値は下書きのまま。"
    },
    {
      "step": "案が出る",
      "duration": 1,
      "badge": "案 1",
      "set": {
        "stage": "比べる"
      },
      "description": "枝の先に案が並ぶ。 値が比べるへ替わり、題の文字も一緒に変わる。"
    },
    {
      "step": "広がる",
      "duration": 1,
      "badge": "案 3",
      "set": {
        "stage": "選ぶ"
      },
      "description": "さらに枝が広がり、値が選ぶへ替わる。 名前に値を埋めておくと段ごとに題が変わる。"
    }
  ]
}`;

// ─── code preset (関数呼出 + DB write + event emit) ─────
export const sourceYaml__textDslCode = `
title: "呼び出しと書き込みと出来事"
type: sequence

actors:
  - 利用者側: { subtitle: "要求" }
  - 処理側: { subtitle: "受け口" }
  - DB
  - OrderCreated: { subtitle: "注文の番号, 金額" }

states:
  count: 100

flow:
  - 利用者側 -> 処理側: "POST /orders"
  - 処理側 -> DB: "UPDATE orders 残数 -1"
  - 処理側 -> OrderCreated: "出来事を出す"

animation:
  - step: "呼び出し" 1.2s
    focus: [利用者側, 処理側]
    badge: "要求"
    description: "利用者側から処理側へ要求が渡る。 記録はまだ動いていない。"
  - step: "書き込み" 1.5s
    focus: [処理側, DB]
    tween:
      count: 100 -> 99
    badge: "DB を更新"
    description: "処理側が DB を更新し、残数が 100 から 99 へ減る。 記録が変わるのはこの段だけ。"
  - step: "出来事" 0.8s
    focus: [処理側, OrderCreated]
    badge: "OrderCreated"
    description: "注文が作られたことを出来事として出す。 受け取る先は図に描かれていなくてよい。"
`;

export const textDslCode = textDslToDiagram(sourceYaml__textDslCode);

export const sourceJson__textDslCode = `{
  "title": "呼び出しと書き込みと出来事",
  "type": "sequence",
  "actors": [
    {
      "name": "利用者側",
      "subtitle": "要求"
    },
    {
      "name": "処理側",
      "subtitle": "受け口"
    },
    {
      "name": "DB"
    },
    {
      "name": "OrderCreated",
      "subtitle": "注文の番号, 金額"
    }
  ],
  "flow": [
    {
      "from": "利用者側",
      "to": "処理側",
      "label": "POST /orders"
    },
    {
      "from": "処理側",
      "to": "DB",
      "label": "UPDATE orders 残数 -1"
    },
    {
      "from": "処理側",
      "to": "OrderCreated",
      "label": "出来事を出す"
    }
  ],
  "states": {
    "count": 100
  },
  "animation": [
    {
      "step": "呼び出し",
      "duration": 1.2,
      "focus": [
        "利用者側",
        "処理側"
      ],
      "badge": "要求",
      "description": "利用者側から処理側へ要求が渡る。 記録はまだ動いていない。"
    },
    {
      "step": "書き込み",
      "duration": 1.5,
      "focus": [
        "処理側",
        "DB"
      ],
      "badge": "DB を更新",
      "tween": {
        "count": [
          100,
          99
        ]
      },
      "description": "処理側が DB を更新し、残数が 100 から 99 へ減る。 記録が変わるのはこの段だけ。"
    },
    {
      "step": "出来事",
      "duration": 0.8,
      "focus": [
        "処理側",
        "OrderCreated"
      ],
      "badge": "OrderCreated",
      "description": "注文が作られたことを出来事として出す。 受け取る先は図に描かれていなくてよい。"
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
    description: "待ち行列は書かなくても 40 になる。"

  - step: "捌き始める" 1.4s
    focus: [待ち行列, 処理]
    tween:
      done: 0 -> 10
    badge: "処理 10"
    description: "待ち行列は 30 に減る。"

  - step: "追いつく" 1.4s
    focus: [処理]
    tween:
      done: 10 -> 25
    badge: "処理 25"
    description: "待ち行列は 15 まで減る。"
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
      "description": "待ち行列は書かなくても 40 になる。",
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
      "description": "待ち行列は 30 に減る。",
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
      "description": "待ち行列は 15 まで減る。",
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
    description: "印から始まり、最初の状態へ入る。"

  - step: "発送する" 1.4s
    focus: [発送準備, 発送済]
    description: "在庫を引き当てて配送業者へ渡す。"

  - step: "終わる" 1.4s
    focus: [発送済, 終]
    description: "受取が済むと終わりの印へ入る。"
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
      "description": "印から始まり、最初の状態へ入る。"
    },
    {
      "step": "発送する",
      "duration": 1.4,
      "focus": ["発送準備", "発送済"],
      "description": "在庫を引き当てて配送業者へ渡す。"
    },
    {
      "step": "終わる",
      "duration": 1.4,
      "focus": ["発送済", "終"],
      "description": "受取が済むと終わりの印へ入る。"
    }
  ]
}`;


// ─── 箱の項目名を日本語で書く (#2332) ─────
//
// 記法は箱の項目名を日本語でも読む (#1026 / #1301) のに、**カタログには 1 枚も見本が無かった**
// (実測 = 記法 570 件 17303 行を走査して、日本語の項目名は `位置` の 7 件だけ。 その 7 件も
// 値の書き方が日本語なので一緒に出ているだけだった)。 記法を学ぶ場はカタログしかないので、
// 書ける形が見えないまま残っていた。
//
// **同じ図を 2 通りで書いて切替で並べる**。 別々の図にすると「書き方が違う」 のか
// 「別の意味なのか」 が読めない。 題だけを変えて項目名を入れ替え、出来上がる図が同じことを
// `packages/dragon/test/catalog-japanese-actor-keys.test.ts` が突き合わせる。
//
// **JSON の欄名は英語だけ**。 日本語の別名は記法 (YAML) の読み手が持ち、JSON に書くと
// 読めない欄として弾かれる。 切替のどちらでも JSON の欄は英語のまま出る。

export const sourceYaml__textDslActorKeys = `title: "箱の項目名を英語で書く"
type: flow

lanes:
  l1: { x: 0, width: 420 }
  l2: { x: 520, width: 420 }

states:
  progress: 20

actors:
  - 受付:
      lane: l1
      stack: 0
      kind: card
      title: "受け付け"
      subtitle: "入口"
      color: 成功
  - 記録:
      lane: l1
      stack: 1
      kind: storage
      rows: ["番号: 数", "名前: 文字"]
  - 進み:
      lane: l2
      stack: 0
      kind: dyn-rect
      size: 200,96
      shape: { kind: rect, source: "{progress}", fillMax: 100, orient: up, fill: "#22c55e", radius: 6 }
      value: "{progress}%"
      visibleIf: "progress > 0"

flow:
  - 受付 -> 記録: "書き込む"
  - 記録 -> 進み: "読み出す"

animation:
  - step: "受け付けて記録する" 1.4s
    focus: ["受付", "記録"]
    description: "題と補足と色を書いた箱から、行と印を書いた表へ進む。"
  - step: "進みを上げる" 1.6s
    focus: ["記録", "進み"]
    tween:
      progress: 20 -> 80
    description: "図形の塗りが状態を読んで伸び、値を書いた箱が同じ状態を数字で出す。"
`;

export const sourceJson__textDslActorKeys = `{
  "title": "箱の項目名を英語で書く",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 420 },
    "l2": { "x": 520, "width": 420 }
  },
  "states": { "progress": 20 },
  "actors": [
    { "name": "受付", "lane": "l1", "stack": 0, "kind": "card", "title": "受け付け", "subtitle": "入口", "color": "成功" },
    { "name": "記録", "lane": "l1", "stack": 1, "kind": "storage", "rows": ["番号: 数", "名前: 文字"] },
    {
      "name": "進み",
      "lane": "l2",
      "stack": 0,
      "kind": "dyn-rect",
      "posW": 200,
      "posH": 96,
      "shape": { "kind": "rect", "source": "{progress}", "fillMax": 100, "orient": "up", "fill": "#22c55e", "radius": 6 },
      "value": "{progress}%",
      "visibleIf": "progress > 0"
    }
  ],
  "flow": [
    { "from": "受付", "to": "記録", "label": "書き込む" },
    { "from": "記録", "to": "進み", "label": "読み出す" }
  ],
  "animation": [
    {
      "step": "受け付けて記録する",
      "duration": 1.4,
      "focus": ["受付", "記録"],
      "description": "題と補足と色を書いた箱から、行と印を書いた表へ進む。"
    },
    {
      "step": "進みを上げる",
      "duration": 1.6,
      "focus": ["記録", "進み"],
      "tween": { "progress": [20, 80] },
      "description": "図形の塗りが状態を読んで伸び、値を書いた箱が同じ状態を数字で出す。"
    }
  ]
}`;

export const textDslActorKeys = textDslToDiagram(sourceYaml__textDslActorKeys);

export const patternBase__textDslActorKeys = "英語で書く";

export const sourceYaml__pattern__textDslActorKeys__日本語で書く = `title: "箱の項目名を日本語で書く"
type: flow

lanes:
  l1: { x: 0, width: 420 }
  l2: { x: 520, width: 420 }

states:
  progress: 20

actors:
  - 受付:
      lane: l1
      stack: 0
      種類: card
      題: "受け付け"
      補足: "入口"
      色: 成功
  - 記録:
      lane: l1
      stack: 1
      種類: storage
      行: ["番号: 数", "名前: 文字"]
  - 進み:
      lane: l2
      stack: 0
      種類: dyn-rect
      大きさ: 200,96
      図形: { kind: rect, source: "{progress}", fillMax: 100, orient: up, fill: "#22c55e", radius: 6 }
      値: "{progress}%"
      出す条件: "progress > 0"

flow:
  - 受付 -> 記録: "書き込む"
  - 記録 -> 進み: "読み出す"

animation:
  - step: "受け付けて記録する" 1.4s
    focus: ["受付", "記録"]
    description: "題と補足と色を書いた箱から、行と印を書いた表へ進む。"
  - step: "進みを上げる" 1.6s
    focus: ["記録", "進み"]
    tween:
      progress: 20 -> 80
    description: "図形の塗りが状態を読んで伸び、値を書いた箱が同じ状態を数字で出す。"
`;

export const sourceJson__pattern__textDslActorKeys__日本語で書く = `{
  "title": "箱の項目名を日本語で書く",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 420 },
    "l2": { "x": 520, "width": 420 }
  },
  "states": { "progress": 20 },
  "actors": [
    { "name": "受付", "lane": "l1", "stack": 0, "kind": "card", "title": "受け付け", "subtitle": "入口", "color": "成功" },
    { "name": "記録", "lane": "l1", "stack": 1, "kind": "storage", "rows": ["番号: 数", "名前: 文字"] },
    {
      "name": "進み",
      "lane": "l2",
      "stack": 0,
      "kind": "dyn-rect",
      "posW": 200,
      "posH": 96,
      "shape": { "kind": "rect", "source": "{progress}", "fillMax": 100, "orient": "up", "fill": "#22c55e", "radius": 6 },
      "value": "{progress}%",
      "visibleIf": "progress > 0"
    }
  ],
  "flow": [
    { "from": "受付", "to": "記録", "label": "書き込む" },
    { "from": "記録", "to": "進み", "label": "読み出す" }
  ],
  "animation": [
    {
      "step": "受け付けて記録する",
      "duration": 1.4,
      "focus": ["受付", "記録"],
      "description": "題と補足と色を書いた箱から、行と印を書いた表へ進む。"
    },
    {
      "step": "進みを上げる",
      "duration": 1.6,
      "focus": ["記録", "進み"],
      "tween": { "progress": [20, 80] },
      "description": "図形の塗りが状態を読んで伸び、値を書いた箱が同じ状態を数字で出す。"
    }
  ]
}`;

export const pattern__textDslActorKeys__日本語で書く = textDslToDiagram(
  sourceYaml__pattern__textDslActorKeys__日本語で書く,
);

// ─── 日本語の項目名を 1 行にまとめて書く (#2344) ─────
//
// 中括弧の形でも日本語の項目名を読む。 ただし `位置` と `大きさ` は英語 (`pos` / `size`) も
// 中括弧では読まないので、段を分けて書く。 上の 2 つと出来上がる図は同じ。

export const sourceYaml__pattern__textDslActorKeys__1行にまとめて書く = `title: "箱の項目名を1行にまとめて書く"
type: flow

lanes:
  l1: { x: 0, width: 420 }
  l2: { x: 520, width: 420 }

states:
  progress: 20

actors:
  - 受付: { lane: l1, stack: 0, 種類: card, 題: "受け付け", 補足: "入口", 色: 成功 }
  - 記録: { lane: l1, stack: 1, 種類: storage, 行: ["番号: 数", "名前: 文字"] }
  - 進み: { lane: l2, stack: 0, 種類: dyn-rect, 値: "{progress}%", 出す条件: "progress > 0" }
      大きさ: 200,96
      図形: { kind: rect, source: "{progress}", fillMax: 100, orient: up, fill: "#22c55e", radius: 6 }

flow:
  - 受付 -> 記録: "書き込む"
  - 記録 -> 進み: "読み出す"

animation:
  - step: "受け付けて記録する" 1.4s
    focus: ["受付", "記録"]
    description: "1 行にまとめても、段を分けて書いた時と同じ図になる。"
  - step: "進みを上げる" 1.6s
    focus: ["記録", "進み"]
    tween:
      progress: 20 -> 80
    description: "図形の塗りが状態を読んで伸び、値を書いた箱が同じ状態を数字で出す。"
`;

// JSON の欄名は英語だけで、1 行にまとめるかどうかの違いも持たない。
// 上の 2 つと同じ内容を、この見本の題と説明文で置いてある。
export const sourceJson__pattern__textDslActorKeys__1行にまとめて書く = `{
  "title": "箱の項目名を1行にまとめて書く",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 420 },
    "l2": { "x": 520, "width": 420 }
  },
  "states": { "progress": 20 },
  "actors": [
    { "name": "受付", "lane": "l1", "stack": 0, "kind": "card", "title": "受け付け", "subtitle": "入口", "color": "成功" },
    { "name": "記録", "lane": "l1", "stack": 1, "kind": "storage", "rows": ["番号: 数", "名前: 文字"] },
    {
      "name": "進み",
      "lane": "l2",
      "stack": 0,
      "kind": "dyn-rect",
      "posW": 200,
      "posH": 96,
      "shape": { "kind": "rect", "source": "{progress}", "fillMax": 100, "orient": "up", "fill": "#22c55e", "radius": 6 },
      "value": "{progress}%",
      "visibleIf": "progress > 0"
    }
  ],
  "flow": [
    { "from": "受付", "to": "記録", "label": "書き込む" },
    { "from": "記録", "to": "進み", "label": "読み出す" }
  ],
  "animation": [
    {
      "step": "受け付けて記録する",
      "duration": 1.4,
      "focus": ["受付", "記録"],
      "description": "1 行にまとめても、段を分けて書いた時と同じ図になる。"
    },
    {
      "step": "進みを上げる",
      "duration": 1.6,
      "focus": ["記録", "進み"],
      "tween": { "progress": [20, 80] },
      "description": "図形の塗りが状態を読んで伸び、値を書いた箱が同じ状態を数字で出す。"
    }
  ]
}`;

export const pattern__textDslActorKeys__1行にまとめて書く = textDslToDiagram(
  sourceYaml__pattern__textDslActorKeys__1行にまとめて書く,
);

// ─── 値と前の値を日本語で書く (#2332) ─────
//
// `前の値` は値を並べる図でだけ効く。 上のフローに書いても図は 1 ピクセルも変わらないので、
// 帯で内訳を出す図に分けて見せる。

export const sourceYaml__textDslValueKeys = `title: "販路ごとの売上"
type: chart
shape: stacked

states:
  mail: 120

actors:
  - 直販:
      value: "420"
      previous: "380"
  - 代理店:
      value: "260"
      previous: "300"
  - 通販:
      value: "{mail}"
      previous: "120"

flow:

animation:
  - step: "今の内訳を見る" 1.4s
    draw: stacked
    focus: ["直販", "代理店", "通販"]
    description: "値に書いた数が帯の長さになる。"
  - step: "通販が伸びる" 1.6s
    focus: ["直販", "代理店", "通販"]
    tween:
      mail: 120 -> 180
    description: "前の値に書いた数が、増えた分と減った分の向きを決める。"
`;

export const sourceJson__textDslValueKeys = `{
  "title": "販路ごとの売上",
  "type": "chart",
  "shape": "stacked",
  "states": { "mail": 120 },
  "actors": [
    { "name": "直販", "value": "420", "previous": "380" },
    { "name": "代理店", "value": "260", "previous": "300" },
    { "name": "通販", "value": "{mail}", "previous": "120" }
  ],
  "flow": [],
  "animation": [
    {
      "step": "今の内訳を見る",
      "duration": 1.4,
      "draw": "stacked",
      "focus": ["直販", "代理店", "通販"],
      "description": "値に書いた数が帯の長さになる。"
    },
    {
      "step": "通販が伸びる",
      "duration": 1.6,
      "focus": ["直販", "代理店", "通販"],
      "tween": { "mail": [120, 180] },
      "description": "前の値に書いた数が、増えた分と減った分の向きを決める。"
    }
  ]
}`;

export const textDslValueKeys = textDslToDiagram(sourceYaml__textDslValueKeys);

export const patternBase__textDslValueKeys = "英語で書く";

export const sourceYaml__pattern__textDslValueKeys__日本語で書く = `title: "値と前の値を日本語で書く"
type: chart
shape: stacked

states:
  mail: 120

actors:
  - 直販:
      値: "420"
      前の値: "380"
  - 代理店:
      値: "260"
      前の値: "300"
  - 通販:
      値: "{mail}"
      前の値: "120"

flow:

animation:
  - step: "今の内訳を見る" 1.4s
    draw: stacked
    focus: ["直販", "代理店", "通販"]
    description: "値に書いた数が帯の長さになる。"
  - step: "通販が伸びる" 1.6s
    focus: ["直販", "代理店", "通販"]
    tween:
      mail: 120 -> 180
    description: "前の値に書いた数が、増えた分と減った分の向きを決める。"
`;

export const sourceJson__pattern__textDslValueKeys__日本語で書く = `{
  "title": "値と前の値を日本語で書く",
  "type": "chart",
  "shape": "stacked",
  "states": { "mail": 120 },
  "actors": [
    { "name": "直販", "value": "420", "previous": "380" },
    { "name": "代理店", "value": "260", "previous": "300" },
    { "name": "通販", "value": "{mail}", "previous": "120" }
  ],
  "flow": [],
  "animation": [
    {
      "step": "今の内訳を見る",
      "duration": 1.4,
      "draw": "stacked",
      "focus": ["直販", "代理店", "通販"],
      "description": "値に書いた数が帯の長さになる。"
    },
    {
      "step": "通販が伸びる",
      "duration": 1.6,
      "focus": ["直販", "代理店", "通販"],
      "tween": { "mail": [120, 180] },
      "description": "前の値に書いた数が、増えた分と減った分の向きを決める。"
    }
  ]
}`;

export const pattern__textDslValueKeys__日本語で書く = textDslToDiagram(
  sourceYaml__pattern__textDslValueKeys__日本語で書く,
);

// ─── 行と印を日本語で書く (#2377) ─────
//
// `印` は行頭の記号を決める項目で、ER 図と状態遷移図でだけ効く。 フローに書いても
// 図は 1 ピクセルも変わらず知らせが 1 件出るので、鍵と外を指す列を持つ図に分けて見せる。

export const sourceYaml__textDslRowMarkKeys = `title: "行と印を英語で書く"
type: er
# 順番を持たない図なので触れて読む形にする (#1757)
relations: hover
reveal: all

actors:
  - 会員:
      kind: storage
      subtitle: "会員の表"
      rows: ["番号: 数", "所属の番号: 数", "連絡先: 文字"]
      marks: ["pk", "fk", ""]
  - 組:
      kind: storage
      subtitle: "組の表"
      rows: ["番号: 数", "名前: 文字"]
      marks: ["pk", ""]

flow:
  - 会員 -> 組: "所属する" (info, dashed) { tailHead: many, head: one }

animation:
  - step: "鍵に下線が付く" 1.2s
    focus: [会員]
    description: "印に pk と書いた行は、名前に下線が付く。"
  - step: "外を指す列が山形になる" 1.2s
    focus: [会員, 組, "会員 -> 組"]
    description: "印に fk と書いた行は、行頭の記号が山形になる。"
`;

export const sourceJson__textDslRowMarkKeys = `{
  "title": "行と印を英語で書く",
  "type": "er",
  "relations": "hover",
  "reveal": "all",
  "actors": [
    {
      "name": "会員",
      "kind": "storage",
      "subtitle": "会員の表",
      "rows": ["番号: 数", "所属の番号: 数", "連絡先: 文字"],
      "marks": ["pk", "fk", ""]
    },
    {
      "name": "組",
      "kind": "storage",
      "subtitle": "組の表",
      "rows": ["番号: 数", "名前: 文字"],
      "marks": ["pk", ""]
    }
  ],
  "flow": [
    {
      "from": "会員",
      "to": "組",
      "label": "所属する",
      "tone": "info",
      "style": "dashed",
      "tailHead": "many",
      "head": "one"
    }
  ],
  "animation": [
    {
      "step": "鍵に下線が付く",
      "duration": 1.2,
      "focus": ["会員"],
      "description": "印に pk と書いた行は、名前に下線が付く。"
    },
    {
      "step": "外を指す列が山形になる",
      "duration": 1.2,
      "focus": ["会員", "組", "会員 -> 組"],
      "description": "印に fk と書いた行は、行頭の記号が山形になる。"
    }
  ]
}`;

export const textDslRowMarkKeys = textDslToDiagram(sourceYaml__textDslRowMarkKeys);

export const patternBase__textDslRowMarkKeys = "英語で書く";

export const sourceYaml__pattern__textDslRowMarkKeys__日本語で書く = `title: "行と印を日本語で書く"
type: er
# 順番を持たない図なので触れて読む形にする (#1757)
relations: hover
reveal: all

actors:
  - 会員:
      種類: storage
      補足: "会員の表"
      行: ["番号: 数", "所属の番号: 数", "連絡先: 文字"]
      印: ["pk", "fk", ""]
  - 組:
      種類: storage
      補足: "組の表"
      行: ["番号: 数", "名前: 文字"]
      印: ["pk", ""]

flow:
  - 会員 -> 組: "所属する" (info, dashed) { tailHead: many, head: one }

animation:
  - step: "鍵に下線が付く" 1.2s
    focus: [会員]
    description: "印に pk と書いた行は、名前に下線が付く。"
  - step: "外を指す列が山形になる" 1.2s
    focus: [会員, 組, "会員 -> 組"]
    description: "印に fk と書いた行は、行頭の記号が山形になる。"
`;

export const sourceJson__pattern__textDslRowMarkKeys__日本語で書く =
  sourceJson__textDslRowMarkKeys.replace('"行と印を英語で書く"', '"行と印を日本語で書く"');

export const pattern__textDslRowMarkKeys__日本語で書く = textDslToDiagram(
  sourceYaml__pattern__textDslRowMarkKeys__日本語で書く,
);
