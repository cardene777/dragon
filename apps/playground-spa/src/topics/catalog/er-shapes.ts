/**
 * 表の繋がり方の型 4 種 (#2583)。
 *
 * `組み方の型` は説明文で「図の組立てで繰返し出る汎用構造の型」 と名乗るが、入っていたのは
 * 伝言の流れ方 (直結 / 貫通 / 分岐 / 繰り返し 等) だけで、静的な構造の型が 1 件も無かった。
 *
 * 表の繋がり方にも繰返し出る形がある。 どれに当たるかで図の読み方が変わる。
 *
 * | 型 | 見分け方 |
 * |---|---|
 * | 小さい形 | 表が 3 つ以下で、繋がりが枝分かれしない |
 * | 集まる形 | 1 つの表に何本も集まる (利用者を中心に据える形) |
 * | 連なる形 | 端から端まで一直線に繋がる (所有が階層になる形) |
 * | 多対多の形 | 中間の表を挟んで両側から繋がる組がある |
 *
 * ## 記法を元にして図を作る
 *
 * 組み立て API で書かず、記法 (YAML) から図を導く。 `組み方の型` の頁は全件が記法を持つ
 * 約束になっており (`catalog-notation-coverage.test.ts` の `揃ったページ`)、組み立て API で
 * 書くと同じ図を記法でもう一度書くことになる。 記法を元にすれば図と記法がずれない。
 *
 * JSON は同じ中身を機械向けに書いた並びで、`catalog-source-pair.test.ts` が
 * 「YAML と JSON が同じ図に解決される」 ことを確かめる。
 *
 * ## 4 枚とも同じ書き方で作る
 *
 * 形の違いだけを見せたいので、表の書き方と関係の書き方を 4 枚で揃える。
 * 揃えないと、読み手は形の違いと書き方の違いを区別できない。
 *
 * | 書くもの | 決め方 |
 * |---|---|
 * | 行の印 | 鍵は名前に下線、外を指す列は山形、空を許す列は中空 (形 x 塗りの 2 軸) |
 * | 線の種類 | 親の鍵が子の主キーに入る関係は実線、入らない関係は破線 |
 * | 端の記号 | 個数 (棒 = 1 / 三又 = 多) と、0 を許すか (丸) |
 * | 段の説明 | その段で何を読めばよいかを 1-2 文。 画面の「コード」 のタブに出る |
 *
 * 線の種類と端の記号は **別のことを表す** (#2587)。 線は親の鍵が子の主キーに入るか、
 * 端は個数と 0 を許すか。 以前はどちらも「0 を許すか」 を表しており、線から読めることが
 * 端から読めることの写しになっていた。 標準の記法 (Mermaid の ER 図、ERwin 系) に合わせて
 * 2 軸に分けた。
 *
 * 集まる形と連なる形は識別する関係を 1 本も持たないので、全ての線が破線になる。
 * `packages/dragon/test/er-line-style.test.ts` が対応の崩れを落とす。
 *
 * ## 器に収まる置き方を実測で決めた
 *
 * 図は器に収まるよう縮む。 箱の題が縮んだ後に 12px を割ると読めなくなるため、
 * `responsive-viewport` の軸が知らせる (拡大表示の器 1150 x 630px では幅 2108 が境)。
 * 下見で組んだ置き方は 3 枚で境を超えていたので、測りながら直した。
 *
 * | 形 | 直す前 | 何が起きたか | 直した形 |
 * |---|---|---|---|
 * | 集まる形 | 1 列に 4 段 | 高さ 1756 で題が 7.9px。 `users` から `reviews` へ引いた線が `sessions` を貫通 | 3 列 2 段に畳む |
 * | 連なる形 | 6 列 1 段 | 幅 3805 で題が 6.6px | 3 列 2 段に折り返す (往路は右へ、復路は左へ) |
 * | 多対多の形 | 1 列に 4 段 + 3 列 | 高さ 1700 で題が 8.2px。 `teams` から `projects` へ引いた線が中間の表を貫通 | 4 列 2 段に畳み、帯を狭める |
 *
 * **狭めた形では中間の表の名前も短くした**。 帯を狭めると題が箱幅を超え、`text-readability`
 * の軸が知らせる。 `user_roles` と `team_members` と `project_tags` を `grants` と `members`
 * と `taggings` に直した (列名は元のまま = 外を指す列の名前を保つ)。
 *
 * 直した後も境を超える分は受け入れて
 * `packages/dragon/test/support/responsive-accepted.ts` に理由付きで載せた。
 * 拡大表示では多対多の形だけが超え (幅 2645)、一覧に並べた枠 (幅 874px、境は幅 1602) では
 * 4 枚とも超える。 幅を決めているのは矢印の札で、詰めれば境に入るが札は繋がりの意味そのもの。
 */
import { textDslToDiagram } from "@cardenelabs/dragon";

/** 枝分かれしない最小の形。 繋がりを一直線に追える */
export const sourceYaml__erShapeSmall = `title: "小さい形 / 3 表 2 関係"
type: record
palette: kinari
# 順番を持たない図なので、線は最初から全部出して触れた関係を光らせる
relations: hover
reveal: all

# 帯と段の割当を手で書く。 算法に任せると形ごとに違う置き方になり、
# 形の違いが置き方の偶然に左右される
lanes:
  c0: { width: 450 }
  c1: { width: 450 }
  c2: { width: 450 }

# 鍵は名前に下線、外を指す列は山形。 中間の表は全ての列が鍵で、それ自体は何も持たない
actors:
  - users: { lane: c0, stack: 0, kind: storage, subtitle: "利用者", rows: ["id: bigint", "email: text"], marks: ["鍵", ""] }
  - orders: { lane: c1, stack: 0, kind: storage, subtitle: "注文", rows: ["id: bigint", "user_id: bigint", "total: numeric"], marks: ["鍵", "外", ""] }
  - order_items: { lane: c2, stack: 0, kind: storage, subtitle: "注文の明細", rows: ["order_id: bigint", "product_id: bigint", "qty: int"], marks: ["鍵 外", "鍵 外", ""] }

# 端の印は両端に立つ。 箱に近い側が個数 (棒 = 1 / 三又 = 多)、その外側が任意か
flow:
  - users -> orders: "注文する" (info, dashed) { tailHead: one, head: zero-many }
  - orders -> order_items: "明細を持つ" (info, solid) { tailHead: one, head: many }

# 線も段に載せる。 段が名指ししていない線は光っていない合図として刻まれる
animation:
  - step: "1. 表を出す" 1.2s
    focus: ["users", "orders", "order_items"]
    badge: "3 表"
    body: "鍵は名前に下線。 外を指す列は山形の印。"
  - step: "2. 一直線に繋ぐ" 1.4s
    focus: ["users", "orders", "order_items", "users -> orders", "orders -> order_items"]
    badge: "2 関係"
    body: "実線は識別する関係で、明細は親の鍵を主キーに含む。 破線は識別しない関係。"
`;
export const erShapeSmall = textDslToDiagram(sourceYaml__erShapeSmall);

export const sourceJson__erShapeSmall = `{
  "title": "小さい形 / 3 表 2 関係",
  "type": "record",
  "relations": "hover",
  "reveal": "all",
  "palette": "kinari",
  "lanes": {
    "c0": {
      "width": 450
    },
    "c1": {
      "width": 450
    },
    "c2": {
      "width": 450
    }
  },
  "actors": [
    {
      "name": "users",
      "lane": "c0",
      "stack": 0,
      "kind": "storage",
      "subtitle": "利用者",
      "rows": [
        "id: bigint",
        "email: text"
      ],
      "marks": [
        "鍵",
        ""
      ]
    },
    {
      "name": "orders",
      "lane": "c1",
      "stack": 0,
      "kind": "storage",
      "subtitle": "注文",
      "rows": [
        "id: bigint",
        "user_id: bigint",
        "total: numeric"
      ],
      "marks": [
        "鍵",
        "外",
        ""
      ]
    },
    {
      "name": "order_items",
      "lane": "c2",
      "stack": 0,
      "kind": "storage",
      "subtitle": "注文の明細",
      "rows": [
        "order_id: bigint",
        "product_id: bigint",
        "qty: int"
      ],
      "marks": [
        "鍵 外",
        "鍵 外",
        ""
      ]
    }
  ],
  "flow": [
    {
      "from": "users",
      "to": "orders",
      "label": "注文する",
      "tone": "info",
      "style": "dashed",
      "tailHead": "one",
      "head": "zero-many"
    },
    {
      "from": "orders",
      "to": "order_items",
      "label": "明細を持つ",
      "tone": "info",
      "style": "solid",
      "tailHead": "one",
      "head": "many"
    }
  ],
  "animation": [
    {
      "step": "1. 表を出す",
      "duration": 1.2,
      "focus": [
        "users",
        "orders",
        "order_items"
      ],
      "badge": "3 表",
      "body": "鍵は名前に下線。 外を指す列は山形の印。"
    },
    {
      "step": "2. 一直線に繋ぐ",
      "duration": 1.4,
      "focus": [
        "users",
        "orders",
        "order_items",
        "users -> orders",
        "orders -> order_items"
      ],
      "badge": "2 関係",
      "body": "実線は識別する関係で、明細は親の鍵を主キーに含む。 破線は識別しない関係。"
    }
  ]
}`;

/** 1 つの表に何本も集まる形。 利用者を中心に据えると出る */
export const sourceYaml__erShapeHub = `title: "集まる形 / 6 表 5 関係"
type: record
palette: kinari
# 順番を持たない図なので、線は最初から全部出して触れた関係を光らせる
relations: hover
reveal: all

# 帯と段の割当を手で書く。 算法に任せると形ごとに違う置き方になり、
# 形の違いが置き方の偶然に左右される
lanes:
  c0: { width: 450 }
  c1: { width: 450 }
  c2: { width: 450 }

# 鍵は名前に下線、外を指す列は山形。 中間の表は全ての列が鍵で、それ自体は何も持たない
actors:
  - addresses: { lane: c0, stack: 0, kind: storage, subtitle: "届け先", rows: ["id: bigint", "user_id: bigint"], marks: ["鍵", "外"] }
  - sessions: { lane: c0, stack: 1, kind: storage, subtitle: "接続", rows: ["id: bigint", "user_id: bigint", "expires_at: timestamptz"], marks: ["鍵", "外", ""] }
  - users: { lane: c1, stack: 0, kind: storage, subtitle: "利用者", rows: ["id: bigint", "email: text"], marks: ["鍵", ""] }
  - reviews: { lane: c1, stack: 1, kind: storage, subtitle: "感想", rows: ["id: bigint", "user_id: bigint", "score: int"], marks: ["鍵", "外", ""] }
  - orders: { lane: c2, stack: 0, kind: storage, subtitle: "注文", rows: ["id: bigint", "user_id: bigint"], marks: ["鍵", "外"] }
  - payments: { lane: c2, stack: 1, kind: storage, subtitle: "支払い", rows: ["id: bigint", "order_id: bigint"], marks: ["鍵", "外"] }

# 端の印は両端に立つ。 箱に近い側が個数 (棒 = 1 / 三又 = 多)、その外側が任意か
flow:
  - users -> addresses: "届け先を持つ" (info, dashed) { tailHead: one, head: zero-many }
  - users -> sessions: "接続する" (info, dashed) { tailHead: one, head: zero-many }
  - users -> orders: "注文する" (info, dashed) { tailHead: one, head: zero-many }
  - users -> reviews: "感想を書く" (info, dashed) { tailHead: one, head: zero-many }
  - orders -> payments: "支払う" (info, dashed) { tailHead: one, head: one }

# 線も段に載せる。 段が名指ししていない線は光っていない合図として刻まれる
animation:
  - step: "1. 表を出す" 1.2s
    focus: ["addresses", "sessions", "users", "reviews", "orders", "payments"]
    badge: "6 表"
    body: "鍵は名前に下線。 外を指す列は山形の印。"
  - step: "2. 中心へ集める" 1.4s
    focus: ["users", "addresses", "sessions", "orders", "reviews", "users -> addresses", "users -> sessions", "users -> orders", "users -> reviews"]
    badge: "1 表に 4 本"
    body: "どれも識別しない関係で破線。 0 を許すかは端の丸で読む (届け先も注文も 0 件でよい)。"
  - step: "3. 先へ繋ぐ" 1.2s
    focus: ["orders", "payments", "orders -> payments"]
    badge: "先は 1 対 1"
    body: "端が両方とも棒。 1 件の注文に支払いが 1 件で、どちらも欠けない。"
`;
export const erShapeHub = textDslToDiagram(sourceYaml__erShapeHub);

export const sourceJson__erShapeHub = `{
  "title": "集まる形 / 6 表 5 関係",
  "type": "record",
  "relations": "hover",
  "reveal": "all",
  "palette": "kinari",
  "lanes": {
    "c0": {
      "width": 450
    },
    "c1": {
      "width": 450
    },
    "c2": {
      "width": 450
    }
  },
  "actors": [
    {
      "name": "addresses",
      "lane": "c0",
      "stack": 0,
      "kind": "storage",
      "subtitle": "届け先",
      "rows": [
        "id: bigint",
        "user_id: bigint"
      ],
      "marks": [
        "鍵",
        "外"
      ]
    },
    {
      "name": "sessions",
      "lane": "c0",
      "stack": 1,
      "kind": "storage",
      "subtitle": "接続",
      "rows": [
        "id: bigint",
        "user_id: bigint",
        "expires_at: timestamptz"
      ],
      "marks": [
        "鍵",
        "外",
        ""
      ]
    },
    {
      "name": "users",
      "lane": "c1",
      "stack": 0,
      "kind": "storage",
      "subtitle": "利用者",
      "rows": [
        "id: bigint",
        "email: text"
      ],
      "marks": [
        "鍵",
        ""
      ]
    },
    {
      "name": "reviews",
      "lane": "c1",
      "stack": 1,
      "kind": "storage",
      "subtitle": "感想",
      "rows": [
        "id: bigint",
        "user_id: bigint",
        "score: int"
      ],
      "marks": [
        "鍵",
        "外",
        ""
      ]
    },
    {
      "name": "orders",
      "lane": "c2",
      "stack": 0,
      "kind": "storage",
      "subtitle": "注文",
      "rows": [
        "id: bigint",
        "user_id: bigint"
      ],
      "marks": [
        "鍵",
        "外"
      ]
    },
    {
      "name": "payments",
      "lane": "c2",
      "stack": 1,
      "kind": "storage",
      "subtitle": "支払い",
      "rows": [
        "id: bigint",
        "order_id: bigint"
      ],
      "marks": [
        "鍵",
        "外"
      ]
    }
  ],
  "flow": [
    {
      "from": "users",
      "to": "addresses",
      "label": "届け先を持つ",
      "tone": "info",
      "style": "dashed",
      "tailHead": "one",
      "head": "zero-many"
    },
    {
      "from": "users",
      "to": "sessions",
      "label": "接続する",
      "tone": "info",
      "style": "dashed",
      "tailHead": "one",
      "head": "zero-many"
    },
    {
      "from": "users",
      "to": "orders",
      "label": "注文する",
      "tone": "info",
      "style": "dashed",
      "tailHead": "one",
      "head": "zero-many"
    },
    {
      "from": "users",
      "to": "reviews",
      "label": "感想を書く",
      "tone": "info",
      "style": "dashed",
      "tailHead": "one",
      "head": "zero-many"
    },
    {
      "from": "orders",
      "to": "payments",
      "label": "支払う",
      "tone": "info",
      "style": "dashed",
      "tailHead": "one",
      "head": "one"
    }
  ],
  "animation": [
    {
      "step": "1. 表を出す",
      "duration": 1.2,
      "focus": [
        "addresses",
        "sessions",
        "users",
        "reviews",
        "orders",
        "payments"
      ],
      "badge": "6 表",
      "body": "鍵は名前に下線。 外を指す列は山形の印。"
    },
    {
      "step": "2. 中心へ集める",
      "duration": 1.4,
      "focus": [
        "users",
        "addresses",
        "sessions",
        "orders",
        "reviews",
        "users -> addresses",
        "users -> sessions",
        "users -> orders",
        "users -> reviews"
      ],
      "badge": "1 表に 4 本",
      "body": "どれも識別しない関係で破線。 0 を許すかは端の丸で読む (届け先も注文も 0 件でよい)。"
    },
    {
      "step": "3. 先へ繋ぐ",
      "duration": 1.2,
      "focus": [
        "orders",
        "payments",
        "orders -> payments"
      ],
      "badge": "先は 1 対 1",
      "body": "端が両方とも棒。 1 件の注文に支払いが 1 件で、どちらも欠けない。"
    }
  ]
}`;

/** 端から端まで一直線に繋がる形。 所有が階層になると出る */
export const sourceYaml__erShapeChain = `title: "連なる形 / 6 表 5 関係"
type: record
palette: kinari
# 順番を持たない図なので、線は最初から全部出して触れた関係を光らせる
relations: hover
reveal: all

# 帯と段の割当を手で書く。 算法に任せると形ごとに違う置き方になり、
# 形の違いが置き方の偶然に左右される
lanes:
  c0: { width: 340 }
  c1: { width: 340 }
  c2: { width: 340 }

# 鍵は名前に下線、外を指す列は山形。 中間の表は全ての列が鍵で、それ自体は何も持たない
actors:
  - tenants: { lane: c0, stack: 0, kind: storage, subtitle: "契約者", rows: ["id: bigint", "name: text"], marks: ["鍵", ""] }
  - projects: { lane: c1, stack: 0, kind: storage, subtitle: "案件", rows: ["id: bigint", "tenant_id: bigint"], marks: ["鍵", "外"] }
  - boards: { lane: c2, stack: 0, kind: storage, subtitle: "掲示板", rows: ["id: bigint", "project_id: bigint"], marks: ["鍵", "外"] }
  - cards: { lane: c2, stack: 1, kind: storage, subtitle: "付箋", rows: ["id: bigint", "board_id: bigint"], marks: ["鍵", "外"] }
  - comments: { lane: c1, stack: 1, kind: storage, subtitle: "書き込み", rows: ["id: bigint", "card_id: bigint"], marks: ["鍵", "外"] }
  - attachments: { lane: c0, stack: 1, kind: storage, subtitle: "添付", rows: ["id: bigint", "comment_id: bigint"], marks: ["鍵", "外"] }

# 端の印は両端に立つ。 箱に近い側が個数 (棒 = 1 / 三又 = 多)、その外側が任意か
flow:
  - tenants -> projects: "持つ" (info, dashed) { tailHead: one, head: zero-many }
  - projects -> boards: "並べる" (info, dashed) { tailHead: one, head: zero-many }
  - boards -> cards: "含む" (info, dashed) { tailHead: one, head: many }
  - cards -> comments: "受ける" (info, dashed) { tailHead: one, head: zero-many }
  - comments -> attachments: "添える" (info, dashed) { tailHead: one, head: zero-many }

# 線も段に載せる。 段が名指ししていない線は光っていない合図として刻まれる
animation:
  - step: "1. 表を出す" 1.2s
    focus: ["tenants", "projects", "boards", "cards", "comments", "attachments"]
    badge: "6 表"
    body: "鍵は名前に下線。 外を指す列は山形の印。"
  - step: "2. 端から端へ繋ぐ" 1.6s
    focus: ["tenants", "projects", "boards", "cards", "comments", "attachments", "tenants -> projects", "projects -> boards", "boards -> cards", "cards -> comments", "comments -> attachments"]
    badge: "5 段の階層"
    body: "どれも識別しない関係で破線。 掲示板だけは付箋を 1 枚以上持つ (端が三又)。"
`;
export const erShapeChain = textDslToDiagram(sourceYaml__erShapeChain);

export const sourceJson__erShapeChain = `{
  "title": "連なる形 / 6 表 5 関係",
  "type": "record",
  "relations": "hover",
  "reveal": "all",
  "palette": "kinari",
  "lanes": {
    "c0": {
      "width": 340
    },
    "c1": {
      "width": 340
    },
    "c2": {
      "width": 340
    }
  },
  "actors": [
    {
      "name": "tenants",
      "lane": "c0",
      "stack": 0,
      "kind": "storage",
      "subtitle": "契約者",
      "rows": [
        "id: bigint",
        "name: text"
      ],
      "marks": [
        "鍵",
        ""
      ]
    },
    {
      "name": "projects",
      "lane": "c1",
      "stack": 0,
      "kind": "storage",
      "subtitle": "案件",
      "rows": [
        "id: bigint",
        "tenant_id: bigint"
      ],
      "marks": [
        "鍵",
        "外"
      ]
    },
    {
      "name": "boards",
      "lane": "c2",
      "stack": 0,
      "kind": "storage",
      "subtitle": "掲示板",
      "rows": [
        "id: bigint",
        "project_id: bigint"
      ],
      "marks": [
        "鍵",
        "外"
      ]
    },
    {
      "name": "cards",
      "lane": "c2",
      "stack": 1,
      "kind": "storage",
      "subtitle": "付箋",
      "rows": [
        "id: bigint",
        "board_id: bigint"
      ],
      "marks": [
        "鍵",
        "外"
      ]
    },
    {
      "name": "comments",
      "lane": "c1",
      "stack": 1,
      "kind": "storage",
      "subtitle": "書き込み",
      "rows": [
        "id: bigint",
        "card_id: bigint"
      ],
      "marks": [
        "鍵",
        "外"
      ]
    },
    {
      "name": "attachments",
      "lane": "c0",
      "stack": 1,
      "kind": "storage",
      "subtitle": "添付",
      "rows": [
        "id: bigint",
        "comment_id: bigint"
      ],
      "marks": [
        "鍵",
        "外"
      ]
    }
  ],
  "flow": [
    {
      "from": "tenants",
      "to": "projects",
      "label": "持つ",
      "tone": "info",
      "style": "dashed",
      "tailHead": "one",
      "head": "zero-many"
    },
    {
      "from": "projects",
      "to": "boards",
      "label": "並べる",
      "tone": "info",
      "style": "dashed",
      "tailHead": "one",
      "head": "zero-many"
    },
    {
      "from": "boards",
      "to": "cards",
      "label": "含む",
      "tone": "info",
      "style": "dashed",
      "tailHead": "one",
      "head": "many"
    },
    {
      "from": "cards",
      "to": "comments",
      "label": "受ける",
      "tone": "info",
      "style": "dashed",
      "tailHead": "one",
      "head": "zero-many"
    },
    {
      "from": "comments",
      "to": "attachments",
      "label": "添える",
      "tone": "info",
      "style": "dashed",
      "tailHead": "one",
      "head": "zero-many"
    }
  ],
  "animation": [
    {
      "step": "1. 表を出す",
      "duration": 1.2,
      "focus": [
        "tenants",
        "projects",
        "boards",
        "cards",
        "comments",
        "attachments"
      ],
      "badge": "6 表",
      "body": "鍵は名前に下線。 外を指す列は山形の印。"
    },
    {
      "step": "2. 端から端へ繋ぐ",
      "duration": 1.6,
      "focus": [
        "tenants",
        "projects",
        "boards",
        "cards",
        "comments",
        "attachments",
        "tenants -> projects",
        "projects -> boards",
        "boards -> cards",
        "cards -> comments",
        "comments -> attachments"
      ],
      "badge": "5 段の階層",
      "body": "どれも識別しない関係で破線。 掲示板だけは付箋を 1 枚以上持つ (端が三又)。"
    }
  ]
}`;

/** 中間の表を挟んで両側から繋がる組がある形。 割当や貼り付けを表すと出る */
export const sourceYaml__erShapeMesh = `title: "多対多の形 / 8 表 8 関係"
type: record
palette: kinari
# 順番を持たない図なので、線は最初から全部出して触れた関係を光らせる
relations: hover
reveal: all

# 帯と段の割当を手で書く。 算法に任せると形ごとに違う置き方になり、
# 形の違いが置き方の偶然に左右される
lanes:
  c0: { width: 280 }
  c1: { width: 280 }
  c2: { width: 280 }
  c3: { width: 280 }

# 鍵は名前に下線、外を指す列は山形。 中間の表は全ての列が鍵で、それ自体は何も持たない
actors:
  - roles: { lane: c0, stack: 0, kind: storage, subtitle: "役割", rows: ["id: bigint", "name: text"], marks: ["鍵", ""] }
  - tags: { lane: c0, stack: 1, kind: storage, subtitle: "名札", rows: ["id: bigint", "name: text"], marks: ["鍵", ""] }
  - grants: { lane: c1, stack: 0, kind: storage, subtitle: "役割の割当", rows: ["user_id: bigint", "role_id: bigint"], marks: ["鍵 外", "鍵 外"] }
  - taggings: { lane: c1, stack: 1, kind: storage, subtitle: "案件の名札", rows: ["project_id: bigint", "tag_id: bigint"], marks: ["鍵 外", "鍵 外"] }
  - users: { lane: c2, stack: 0, kind: storage, subtitle: "利用者", rows: ["id: bigint", "email: text"], marks: ["鍵", ""] }
  - projects: { lane: c2, stack: 1, kind: storage, subtitle: "案件", rows: ["id: bigint", "team_id: bigint", "owner_id: bigint"], marks: ["鍵", "外", "外 条件"] }
  - teams: { lane: c3, stack: 0, kind: storage, subtitle: "班", rows: ["id: bigint", "name: text"], marks: ["鍵", ""] }
  - members: { lane: c3, stack: 1, kind: storage, subtitle: "班の一員", rows: ["team_id: bigint", "user_id: bigint"], marks: ["鍵 外", "鍵 外"] }

# 端の印は両端に立つ。 箱に近い側が個数 (棒 = 1 / 三又 = 多)、その外側が任意か
flow:
  - users -> grants: "持つ" (info, solid) { tailHead: one, head: many }
  - roles -> grants: "割り当てる" (info, solid) { tailHead: one, head: many }
  - users -> members: "入る" (info, solid) { tailHead: one, head: many }
  - teams -> members: "集める" (info, solid) { tailHead: one, head: many }
  - teams -> projects: "進める" (info, dashed) { tailHead: one, head: zero-many }
  - projects -> taggings: "付ける" (info, solid) { tailHead: one, head: many }
  - tags -> taggings: "貼る" (info, solid) { tailHead: one, head: many }
  - users -> projects: "受け持つ" (info, dashed) { tailHead: zero-one, head: zero-many }

# 線も段に載せる。 段が名指ししていない線は光っていない合図として刻まれる
animation:
  - step: "1. 実体の表を出す" 1.2s
    focus: ["roles", "tags", "users", "projects", "teams"]
    badge: "5 つの実体"
    body: "鍵は名前に下線、外を指す列は山形の印。 空を許す列は中空 (案件の受け持ち)。"
  - step: "2. 中間の表を出す" 1.2s
    focus: ["grants", "taggings", "members"]
    badge: "鍵だけの 3 表"
    body: "中間の表は全ての列が鍵。 2 つの鍵がそのまま主キーになる。"
  - step: "3. 両側から繋ぐ" 1.6s
    focus: ["users", "roles", "grants", "teams", "members", "projects", "tags", "taggings", "users -> grants", "roles -> grants", "users -> members", "teams -> members", "projects -> taggings", "tags -> taggings", "teams -> projects", "users -> projects"]
    badge: "中間の表が 3 つ"
    body: "実線は識別する関係。 中間の表は両側の鍵をそのまま主キーに持つ。"
`;
export const erShapeMesh = textDslToDiagram(sourceYaml__erShapeMesh);

export const sourceJson__erShapeMesh = `{
  "title": "多対多の形 / 8 表 8 関係",
  "type": "record",
  "relations": "hover",
  "reveal": "all",
  "palette": "kinari",
  "lanes": {
    "c0": {
      "width": 280
    },
    "c1": {
      "width": 280
    },
    "c2": {
      "width": 280
    },
    "c3": {
      "width": 280
    }
  },
  "actors": [
    {
      "name": "roles",
      "lane": "c0",
      "stack": 0,
      "kind": "storage",
      "subtitle": "役割",
      "rows": [
        "id: bigint",
        "name: text"
      ],
      "marks": [
        "鍵",
        ""
      ]
    },
    {
      "name": "tags",
      "lane": "c0",
      "stack": 1,
      "kind": "storage",
      "subtitle": "名札",
      "rows": [
        "id: bigint",
        "name: text"
      ],
      "marks": [
        "鍵",
        ""
      ]
    },
    {
      "name": "grants",
      "lane": "c1",
      "stack": 0,
      "kind": "storage",
      "subtitle": "役割の割当",
      "rows": [
        "user_id: bigint",
        "role_id: bigint"
      ],
      "marks": [
        "鍵 外",
        "鍵 外"
      ]
    },
    {
      "name": "taggings",
      "lane": "c1",
      "stack": 1,
      "kind": "storage",
      "subtitle": "案件の名札",
      "rows": [
        "project_id: bigint",
        "tag_id: bigint"
      ],
      "marks": [
        "鍵 外",
        "鍵 外"
      ]
    },
    {
      "name": "users",
      "lane": "c2",
      "stack": 0,
      "kind": "storage",
      "subtitle": "利用者",
      "rows": [
        "id: bigint",
        "email: text"
      ],
      "marks": [
        "鍵",
        ""
      ]
    },
    {
      "name": "projects",
      "lane": "c2",
      "stack": 1,
      "kind": "storage",
      "subtitle": "案件",
      "rows": [
        "id: bigint",
        "team_id: bigint",
        "owner_id: bigint"
      ],
      "marks": [
        "鍵",
        "外",
        "外 条件"
      ]
    },
    {
      "name": "teams",
      "lane": "c3",
      "stack": 0,
      "kind": "storage",
      "subtitle": "班",
      "rows": [
        "id: bigint",
        "name: text"
      ],
      "marks": [
        "鍵",
        ""
      ]
    },
    {
      "name": "members",
      "lane": "c3",
      "stack": 1,
      "kind": "storage",
      "subtitle": "班の一員",
      "rows": [
        "team_id: bigint",
        "user_id: bigint"
      ],
      "marks": [
        "鍵 外",
        "鍵 外"
      ]
    }
  ],
  "flow": [
    {
      "from": "users",
      "to": "grants",
      "label": "持つ",
      "tone": "info",
      "style": "solid",
      "tailHead": "one",
      "head": "many"
    },
    {
      "from": "roles",
      "to": "grants",
      "label": "割り当てる",
      "tone": "info",
      "style": "solid",
      "tailHead": "one",
      "head": "many"
    },
    {
      "from": "users",
      "to": "members",
      "label": "入る",
      "tone": "info",
      "style": "solid",
      "tailHead": "one",
      "head": "many"
    },
    {
      "from": "teams",
      "to": "members",
      "label": "集める",
      "tone": "info",
      "style": "solid",
      "tailHead": "one",
      "head": "many"
    },
    {
      "from": "teams",
      "to": "projects",
      "label": "進める",
      "tone": "info",
      "style": "dashed",
      "tailHead": "one",
      "head": "zero-many"
    },
    {
      "from": "projects",
      "to": "taggings",
      "label": "付ける",
      "tone": "info",
      "style": "solid",
      "tailHead": "one",
      "head": "many"
    },
    {
      "from": "tags",
      "to": "taggings",
      "label": "貼る",
      "tone": "info",
      "style": "solid",
      "tailHead": "one",
      "head": "many"
    },
    {
      "from": "users",
      "to": "projects",
      "label": "受け持つ",
      "tone": "info",
      "style": "dashed",
      "tailHead": "zero-one",
      "head": "zero-many"
    }
  ],
  "animation": [
    {
      "step": "1. 実体の表を出す",
      "duration": 1.2,
      "focus": [
        "roles",
        "tags",
        "users",
        "projects",
        "teams"
      ],
      "badge": "5 つの実体",
      "body": "鍵は名前に下線、外を指す列は山形の印。 空を許す列は中空 (案件の受け持ち)。"
    },
    {
      "step": "2. 中間の表を出す",
      "duration": 1.2,
      "focus": [
        "grants",
        "taggings",
        "members"
      ],
      "badge": "鍵だけの 3 表",
      "body": "中間の表は全ての列が鍵。 2 つの鍵がそのまま主キーになる。"
    },
    {
      "step": "3. 両側から繋ぐ",
      "duration": 1.6,
      "focus": [
        "users",
        "roles",
        "grants",
        "teams",
        "members",
        "projects",
        "tags",
        "taggings",
        "users -> grants",
        "roles -> grants",
        "users -> members",
        "teams -> members",
        "projects -> taggings",
        "tags -> taggings",
        "teams -> projects",
        "users -> projects"
      ],
      "badge": "中間の表が 3 つ",
      "body": "実線は識別する関係。 中間の表は両側の鍵をそのまま主キーに持つ。"
    }
  ]
}`;
