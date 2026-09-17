import { textDslToDiagram } from "@cardenelabs/dragon";
import type { CdlDiagram } from "@cardenelabs/cdl";

/**
 * Catalog - Cookbook ... 一般 web 開発で頻出する 25 例の sample。 5 群構成。
 *   A. API / Auth (5 例)
 *   B. データ操作 (5 例)
 *   C. UI / フォーム (5 例)
 *   D. 非同期 / バックグラウンド (5 例)
 *   E. 運用 / 配信 (5 例)
 *
 * 各 demo の id は cookbook.md の `[preview:cookbook/<slug>]` と一致させるため、
 * textDslToDiagram() の戻り値の `id` を slug で上書きする。
 *
 * 設計指針:
 * - DSL 本体は v0.5 Text DSL (英語 keyword) で記述
 * - actor 名は simple identifier (空白 / colon / slash 不使用) で lane id 生成 hazard を避ける
 * - actor 名と矢印と段の字は日本語で書く (#1890)。 HTTP の要求の種類 (`GET` / `POST` / `PUT`) と
 *   SQL の命令 (`SELECT` / `INSERT` / `ORDER BY`) と規格の名前 (`JWT` / `transfer`) は綴りが
 *   決まっているので残す。 残した語は `lib/diagram-words.test.tsx` の `残してよい語` に理由付きで載る
 * - title は WebApp 文脈で簡潔に
 * - 全 thumbnail で card サイズ統一 (catalog.astro grid 上の見え方)
 *
 * ## 記法をそのままコードタブに出す (#1378)
 *
 * 図は記法から組み立てているので、`sourceYaml__<図の export 名>` として export すれば
 * 一覧が拾って画面に「コード」 のタブが出る (`lib/catalog-items.ts`)。
 *
 * **書き足すのではなく取り出しただけ**。 図と記法が同じ source から来るため、
 * 他のページのような写し違いは起きない。
 *
 * `sourceJson__<key>` は記法を読んで JSON の欄へ並べ替えて作った。 組み立て済みの図から
 * 出すと `type: sequence` が失われて `flow` + 縦列の明示に変わり、2 つのタブが別物に
 * 見えてしまう。
 */

function withId(slug: string, diagram: CdlDiagram): CdlDiagram {
  return { ...diagram, id: slug };
}

// ─────────────────────────────────────────────────────────────
// A. API / Auth (5 例)
// ─────────────────────────────────────────────────────────────

/** A-1. REST API call (basic GET) */
export const sourceYaml__apiCall = `title: "REST API GET (Handler → DB SELECT → 200 JSON)"
type: sequence

actors:
  - 利用者側
  - 受け口
  - DB

flow:
  - 利用者側 -> 受け口: "GET /users/:id"
  - 受け口 -> DB: "SELECT"
  - DB -> 受け口: "行"
  - 受け口 -> 利用者側: "200 JSON"

animation:
  - step: "要求" 1.2s
    focus: [利用者側, 受け口]
    badge: "GET"
  - step: "照会" 1.2s
    focus: [受け口, DB]
    badge: "SELECT"
  - step: "返す" 1.2s
    focus: [DB, 受け口, 利用者側]
    badge: "200"
`;

export const sourceJson__apiCall = `{
  "title": "REST API GET (Handler → DB SELECT → 200 JSON)",
  "type": "sequence",
  "actors": [
    { "name": "利用者側" },
    { "name": "受け口" },
    { "name": "DB" }
  ],
  "flow": [
    { "from": "利用者側", "to": "受け口", "label": "GET /users/:id" },
    { "from": "受け口", "to": "DB", "label": "SELECT" },
    { "from": "DB", "to": "受け口", "label": "行" },
    { "from": "受け口", "to": "利用者側", "label": "200 JSON" }
  ],
  "animation": [
    { "step": "要求", "duration": 1.2, "focus": ["利用者側", "受け口"], "badge": "GET" },
    { "step": "照会", "duration": 1.2, "focus": ["受け口", "DB"], "badge": "SELECT" },
    { "step": "返す", "duration": 1.2, "focus": ["DB", "受け口", "利用者側"], "badge": "200" }
  ]
}`;

export const apiCall = withId("api-call", textDslToDiagram(sourceYaml__apiCall));

/** A-2. JWT auth (login → token → access) */
export const sourceYaml__jwtAuth = `title: "JWT auth (login → JWT issue → Bearer で API アクセス)"
type: sequence

actors:
  - 利用者
  - 認証窓口
  - API
  - DB

flow:
  - 利用者 -> 認証窓口: "POST 認証情報"
  - 認証窓口 -> DB: "照合"
  - 認証窓口 -> 利用者: "JWT を発行"
  - 利用者 -> API: "JWT を添えて呼ぶ"
  - API -> 利用者: "200 中身"

animation:
  - step: "照合" 1.5s
    focus: [利用者, 認証窓口, DB]
    badge: "照合"
  - step: "発行" 1.0s
    focus: [認証窓口, 利用者]
    badge: "JWT"
  - step: "鍵で呼ぶ" 1.5s
    focus: [利用者, API]
    badge: "200"
`;

export const sourceJson__jwtAuth = `{
  "title": "JWT auth (login → JWT issue → Bearer で API アクセス)",
  "type": "sequence",
  "actors": [
    { "name": "利用者" },
    { "name": "認証窓口" },
    { "name": "API" },
    { "name": "DB" }
  ],
  "flow": [
    { "from": "利用者", "to": "認証窓口", "label": "POST 認証情報" },
    { "from": "認証窓口", "to": "DB", "label": "照合" },
    { "from": "認証窓口", "to": "利用者", "label": "JWT を発行" },
    { "from": "利用者", "to": "API", "label": "JWT を添えて呼ぶ" },
    { "from": "API", "to": "利用者", "label": "200 中身" }
  ],
  "animation": [
    {
      "step": "照合",
      "duration": 1.5,
      "focus": ["利用者", "認証窓口", "DB"],
      "badge": "照合"
    },
    { "step": "発行", "duration": 1, "focus": ["認証窓口", "利用者"], "badge": "JWT" },
    { "step": "鍵で呼ぶ", "duration": 1.5, "focus": ["利用者", "API"], "badge": "200" }
  ]
}`;

export const jwtAuth = withId("jwt-auth", textDslToDiagram(sourceYaml__jwtAuth));

/** A-3. OAuth 2.0 authorization code flow */
export const sourceYaml__oauthFlow = `title: "OAuth code flow"
type: sequence

actors:
  - 利用者
  - 本体
  - 認可窓口
  - API

flow:
  - 利用者 -> 本体: "認証を始める"
  - 本体 -> 認可窓口: "転送"
  - 認可窓口 -> 利用者: "同意の確認"
  - 利用者 -> 認可窓口: "許可"
  - 認可窓口 -> 本体: "認可の番号"
  - 本体 -> 認可窓口: "番号を鍵に替える"
  - 認可窓口 -> 本体: "利用の鍵"
  - 本体 -> API: "鍵を添えて呼ぶ"

animation:
  - step: "転送" 1.2s
    focus: [利用者, 本体, 認可窓口]
    badge: "転送"
  - step: "同意の確認" 1.5s
    focus: [認可窓口, 利用者]
    badge: "同意の確認"
  - step: "許可" 1.0s
    focus: ["利用者 -> 認可窓口"]
    badge: "許可"
  - step: "引き換え" 1.2s
    focus: [本体, 認可窓口]
    badge: "認可の番号"
  - step: "利用" 1.0s
    focus: [本体, API]
    badge: "鍵"
`;

export const sourceJson__oauthFlow = `{
  "title": "OAuth code flow",
  "type": "sequence",
  "actors": [
    { "name": "利用者" },
    { "name": "本体" },
    { "name": "認可窓口" },
    { "name": "API" }
  ],
  "flow": [
    { "from": "利用者", "to": "本体", "label": "認証を始める" },
    { "from": "本体", "to": "認可窓口", "label": "転送" },
    { "from": "認可窓口", "to": "利用者", "label": "同意の確認" },
    { "from": "利用者", "to": "認可窓口", "label": "許可" },
    { "from": "認可窓口", "to": "本体", "label": "認可の番号" },
    { "from": "本体", "to": "認可窓口", "label": "番号を鍵に替える" },
    { "from": "認可窓口", "to": "本体", "label": "利用の鍵" },
    { "from": "本体", "to": "API", "label": "鍵を添えて呼ぶ" }
  ],
  "animation": [
    {
      "step": "転送",
      "duration": 1.2,
      "focus": ["利用者", "本体", "認可窓口"],
      "badge": "転送"
    },
    { "step": "同意の確認", "duration": 1.5, "focus": ["認可窓口", "利用者"], "badge": "同意の確認" },
    { "step": "許可", "duration": 1, "focus": ["利用者 -> 認可窓口"], "badge": "許可" },
    { "step": "引き換え", "duration": 1.2, "focus": ["本体", "認可窓口"], "badge": "認可の番号" },
    { "step": "利用", "duration": 1, "focus": ["本体", "API"], "badge": "鍵" }
  ]
}`;

export const oauthFlow = withId("oauth-flow", textDslToDiagram(sourceYaml__oauthFlow));

/** A-4. Rate limit (429 + Retry-After) */
export const sourceYaml__rateLimit = `title: "Rate limit"
type: sequence

actors:
  - 利用者側
  - 流量制限
  - API
  - 残り枠

states:
  remaining: 5

flow:
  - 利用者側 -> 流量制限: "要求"
  - 流量制限 -> 残り枠: "1 減らす"
  - 流量制限 -> API: "正常"
  - API -> 利用者側: "200"
  - 利用者側 -> 流量制限: "6 回目の要求"
  - 流量制限 -> 利用者側: "429 待ってから再送"

animation:
  - step: "許可" 1.2s
    focus: [利用者側, 流量制限, API]
    tween:
      remaining: 5 -> 4
    badge: "許可"
  - step: "超過" 1.2s
    focus: [利用者側, 流量制限]
    badge: "429"
`;

export const sourceJson__rateLimit = `{
  "title": "Rate limit",
  "type": "sequence",
  "actors": [
    { "name": "利用者側" },
    { "name": "流量制限" },
    { "name": "API" },
    { "name": "残り枠" }
  ],
  "flow": [
    { "from": "利用者側", "to": "流量制限", "label": "要求" },
    { "from": "流量制限", "to": "残り枠", "label": "1 減らす" },
    { "from": "流量制限", "to": "API", "label": "正常" },
    { "from": "API", "to": "利用者側", "label": "200" },
    { "from": "利用者側", "to": "流量制限", "label": "6 回目の要求" },
    { "from": "流量制限", "to": "利用者側", "label": "429 待ってから再送" }
  ],
  "states": { "remaining": 5 },
  "animation": [
    {
      "step": "許可",
      "duration": 1.2,
      "focus": ["利用者側", "流量制限", "API"],
      "tween": { "remaining": [5, 4] },
      "badge": "許可"
    },
    { "step": "超過", "duration": 1.2, "focus": ["利用者側", "流量制限"], "badge": "429" }
  ]
}`;

export const rateLimit = withId("rate-limit", textDslToDiagram(sourceYaml__rateLimit));

/** A-5. CSRF token roundtrip */
export const sourceYaml__csrfToken = `title: "CSRF token"
type: sequence

actors:
  - 閲覧ソフト
  - 処理側
  - 利用中の記録

flow:
  - 閲覧ソフト -> 処理側: "GET 入力欄"
  - 処理側 -> 利用中の記録: "鍵を保管"
  - 処理側 -> 閲覧ソフト: "入力欄 + 鍵"
  - 閲覧ソフト -> 処理側: "POST 入力欄 + 鍵"
  - 処理側 -> 利用中の記録: "照合"
  - 処理側 -> 閲覧ソフト: "200"

animation:
  - step: "保管" 1.2s
    focus: [処理側, 利用中の記録]
    badge: "保管"
  - step: "発行" 1.2s
    focus: ["処理側 -> 閲覧ソフト"]
    badge: "発行"
  - step: "送信" 1.2s
    focus: ["閲覧ソフト -> 処理側"]
    badge: "POST"
  - step: "照合" 1.2s
    focus: [処理側, 利用中の記録]
    badge: "照合"
  - step: "受理" 1.0s
    focus: ["処理側 -> 閲覧ソフト"]
    badge: "200"
`;

export const sourceJson__csrfToken = `{
  "title": "CSRF token",
  "type": "sequence",
  "actors": [
    { "name": "閲覧ソフト" },
    { "name": "処理側" },
    { "name": "利用中の記録" }
  ],
  "flow": [
    { "from": "閲覧ソフト", "to": "処理側", "label": "GET 入力欄" },
    { "from": "処理側", "to": "利用中の記録", "label": "鍵を保管" },
    { "from": "処理側", "to": "閲覧ソフト", "label": "入力欄 + 鍵" },
    { "from": "閲覧ソフト", "to": "処理側", "label": "POST 入力欄 + 鍵" },
    { "from": "処理側", "to": "利用中の記録", "label": "照合" },
    { "from": "処理側", "to": "閲覧ソフト", "label": "200" }
  ],
  "animation": [
    { "step": "保管", "duration": 1.2, "focus": ["処理側", "利用中の記録"], "badge": "保管" },
    { "step": "発行", "duration": 1.2, "focus": ["処理側 -> 閲覧ソフト"], "badge": "発行" },
    { "step": "送信", "duration": 1.2, "focus": ["閲覧ソフト -> 処理側"], "badge": "POST" },
    { "step": "照合", "duration": 1.2, "focus": ["処理側", "利用中の記録"], "badge": "照合" },
    { "step": "受理", "duration": 1, "focus": ["処理側 -> 閲覧ソフト"], "badge": "200" }
  ]
}`;

export const csrfToken = withId("csrf-token", textDslToDiagram(sourceYaml__csrfToken));

// ─────────────────────────────────────────────────────────────
// B. データ操作 (5 例)
// ─────────────────────────────────────────────────────────────

/** B-1. CRUD create */
export const sourceYaml__crudCreate = `title: "CRUD create"
type: sequence

actors:
  - 利用者側
  - 受け口
  - DB
  - 表

flow:
  - 利用者側 -> 受け口: "POST 本文 (JSON)"
  - 受け口 -> DB: "INSERT"
  - DB -> 表: "行"
  - 受け口 -> 利用者側: "201 作成済み"

animation:
  - step: "送る" 1.2s
    focus: [利用者側, 受け口]
    badge: "POST"
  - step: "書き込み" 1.2s
    focus: [受け口, DB, 表]
    badge: "INSERT"
  - step: "返す" 1.0s
    focus: [受け口, 利用者側]
    badge: "201"
`;

export const sourceJson__crudCreate = `{
  "title": "CRUD create",
  "type": "sequence",
  "actors": [
    { "name": "利用者側" },
    { "name": "受け口" },
    { "name": "DB" },
    { "name": "表" }
  ],
  "flow": [
    { "from": "利用者側", "to": "受け口", "label": "POST 本文 (JSON)" },
    { "from": "受け口", "to": "DB", "label": "INSERT" },
    { "from": "DB", "to": "表", "label": "行" },
    { "from": "受け口", "to": "利用者側", "label": "201 作成済み" }
  ],
  "animation": [
    { "step": "送る", "duration": 1.2, "focus": ["利用者側", "受け口"], "badge": "POST" },
    {
      "step": "書き込み",
      "duration": 1.2,
      "focus": ["受け口", "DB", "表"],
      "badge": "INSERT"
    },
    { "step": "返す", "duration": 1, "focus": ["受け口", "利用者側"], "badge": "201" }
  ]
}`;

export const crudCreate = withId("crud-create", textDslToDiagram(sourceYaml__crudCreate));

/** B-2. Pagination (cursor based) */
export const sourceYaml__pagination = `title: "Cursor pagination"
type: sequence

actors:
  - 利用者側
  - API
  - DB

flow:
  - 利用者側 -> API: "GET 一覧 (続きの印なし)"
  - API -> DB: "LIMIT 20"
  - DB -> API: "20 行 + 次の印"
  - API -> 利用者側: "最初の 20 件 + 続きの印"
  - 利用者側 -> API: "GET 一覧 (続きの印つき)"
  - API -> 利用者側: "次の 20 件"

animation:
  - step: "最初の 20 件" 1.5s
    focus: [利用者側, API, DB]
    badge: "最初の 20 件"
  - step: "次の 20 件" 1.2s
    focus: [利用者側, API]
    badge: "次の 20 件"
`;

export const sourceJson__pagination = `{
  "title": "Cursor pagination",
  "type": "sequence",
  "actors": [
    { "name": "利用者側" },
    { "name": "API" },
    { "name": "DB" }
  ],
  "flow": [
    { "from": "利用者側", "to": "API", "label": "GET 一覧 (続きの印なし)" },
    { "from": "API", "to": "DB", "label": "LIMIT 20" },
    { "from": "DB", "to": "API", "label": "20 行 + 次の印" },
    { "from": "API", "to": "利用者側", "label": "最初の 20 件 + 続きの印" },
    { "from": "利用者側", "to": "API", "label": "GET 一覧 (続きの印つき)" },
    { "from": "API", "to": "利用者側", "label": "次の 20 件" }
  ],
  "animation": [
    { "step": "最初の 20 件", "duration": 1.5, "focus": ["利用者側", "API", "DB"], "badge": "最初の 20 件" },
    { "step": "次の 20 件", "duration": 1.2, "focus": ["利用者側", "API"], "badge": "次の 20 件" }
  ]
}`;

export const pagination = withId("pagination", textDslToDiagram(sourceYaml__pagination));

/** B-3. Cache (read-through + TTL) */
export const sourceYaml__cacheReadThrough = `title: "Cache read-through"
type: sequence

actors:
  - 利用者側
  - API
  - 一時置き場
  - DB

flow:
  - 利用者側 -> API: "GET 値を引く"
  - API -> 一時置き場: "探す"
  - 一時置き場 -> API: "無い"
  - API -> DB: "SELECT"
  - DB -> API: "行"
  - API -> 一時置き場: "60 秒だけ置く"
  - API -> 利用者側: "200"

animation:
  - step: "探す" 1.0s
    focus: ["API -> 一時置き場"]
    badge: "探す"
  - step: "無い" 1.2s
    focus: ["一時置き場 -> API"]
    badge: "無い"
  - step: "DB から引く" 1.5s
    focus: [API, DB]
    badge: "SELECT"
  - step: "埋める" 1.2s
    focus: ["API -> 一時置き場"]
    badge: "置く"
  - step: "返す" 1.0s
    focus: ["API -> 利用者側"]
    badge: "200"
`;

export const sourceJson__cacheReadThrough = `{
  "title": "Cache read-through",
  "type": "sequence",
  "actors": [
    { "name": "利用者側" },
    { "name": "API" },
    { "name": "一時置き場" },
    { "name": "DB" }
  ],
  "flow": [
    { "from": "利用者側", "to": "API", "label": "GET 値を引く" },
    { "from": "API", "to": "一時置き場", "label": "探す" },
    { "from": "一時置き場", "to": "API", "label": "無い" },
    { "from": "API", "to": "DB", "label": "SELECT" },
    { "from": "DB", "to": "API", "label": "行" },
    { "from": "API", "to": "一時置き場", "label": "60 秒だけ置く" },
    { "from": "API", "to": "利用者側", "label": "200" }
  ],
  "animation": [
    { "step": "探す", "duration": 1, "focus": ["API -> 一時置き場"], "badge": "探す" },
    { "step": "無い", "duration": 1.2, "focus": ["一時置き場 -> API"], "badge": "無い" },
    { "step": "DB から引く", "duration": 1.5, "focus": ["API", "DB"], "badge": "SELECT" },
    { "step": "埋める", "duration": 1.2, "focus": ["API -> 一時置き場"], "badge": "置く" },
    { "step": "返す", "duration": 1, "focus": ["API -> 利用者側"], "badge": "200" }
  ]
}`;

export const cacheReadThrough = withId(
  "cache-read",
  textDslToDiagram(sourceYaml__cacheReadThrough),
);

/** B-4. Search (full-text query) */
export const sourceYaml__searchQuery = `title: "Search full-text"
type: sequence

actors:
  - 利用者側
  - API
  - 索引

flow:
  - 利用者側 -> API: "GET 検索 q=りんご"
  - API -> 索引: "語に分けて点数付け"
  - 索引 -> API: "順位付きの当たり"
  - API -> 利用者側: "結果"

animation:
  - step: "照会" 1.2s
    focus: [利用者側, API]
    badge: "q=りんご"
  - step: "点数付け" 1.5s
    focus: [API, 索引]
    badge: "順位付け"
  - step: "返す" 1.0s
    focus: [API, 利用者側]
    badge: "当たり"
`;

export const sourceJson__searchQuery = `{
  "title": "Search full-text",
  "type": "sequence",
  "actors": [
    { "name": "利用者側" },
    { "name": "API" },
    { "name": "索引" }
  ],
  "flow": [
    { "from": "利用者側", "to": "API", "label": "GET 検索 q=りんご" },
    { "from": "API", "to": "索引", "label": "語に分けて点数付け" },
    { "from": "索引", "to": "API", "label": "順位付きの当たり" },
    { "from": "API", "to": "利用者側", "label": "結果" }
  ],
  "animation": [
    { "step": "照会", "duration": 1.2, "focus": ["利用者側", "API"], "badge": "q=りんご" },
    { "step": "点数付け", "duration": 1.5, "focus": ["API", "索引"], "badge": "順位付け" },
    { "step": "返す", "duration": 1, "focus": ["API", "利用者側"], "badge": "当たり" }
  ]
}`;

export const searchQuery = withId("search-query", textDslToDiagram(sourceYaml__searchQuery));

/** B-5. Sort / Filter combinator */
export const sourceYaml__sortFilter = `title: "Sort + Filter"
type: sequence

actors:
  - 利用者側
  - API
  - DB

flow:
  - 利用者側 -> API: "GET 状態=有効 並び=新しい順"
  - API -> DB: "WHERE + ORDER BY DESC"
  - DB -> API: "絞った行"
  - API -> 利用者側: "200"

animation:
  - step: "要求" 1.0s
    focus: [利用者側, API]
    badge: "絞り込み"
  - step: "照会" 1.5s
    focus: [API, DB]
    badge: "ORDER BY"
  - step: "返す" 1.0s
    focus: [API, 利用者側]
    badge: "200"
`;

export const sourceJson__sortFilter = `{
  "title": "Sort + Filter",
  "type": "sequence",
  "actors": [
    { "name": "利用者側" },
    { "name": "API" },
    { "name": "DB" }
  ],
  "flow": [
    { "from": "利用者側", "to": "API", "label": "GET 状態=有効 並び=新しい順" },
    { "from": "API", "to": "DB", "label": "WHERE + ORDER BY DESC" },
    { "from": "DB", "to": "API", "label": "絞った行" },
    { "from": "API", "to": "利用者側", "label": "200" }
  ],
  "animation": [
    { "step": "要求", "duration": 1, "focus": ["利用者側", "API"], "badge": "絞り込み" },
    { "step": "照会", "duration": 1.5, "focus": ["API", "DB"], "badge": "ORDER BY" },
    { "step": "返す", "duration": 1, "focus": ["API", "利用者側"], "badge": "200" }
  ]
}`;

export const sortFilter = withId("sort-filter", textDslToDiagram(sourceYaml__sortFilter));

// ─────────────────────────────────────────────────────────────
// C. UI / フォーム (5 例)
// ─────────────────────────────────────────────────────────────

/** C-1. Form submit (POST + validate) */
export const sourceYaml__formSubmit = `title: "Form submit"
type: sequence

actors:
  - 利用者
  - 入力欄
  - 処理側

flow:
  - 利用者 -> 入力欄: "項目を埋める"
  - 利用者 -> 入力欄: "送信"
  - 入力欄 -> 処理側: "POST 入力欄"
  - 処理側 -> 入力欄: "200"
  - 入力欄 -> 利用者: "成功の知らせ"

animation:
  - step: "埋める" 1.0s
    focus: ["利用者 -> 入力欄"]
    badge: "埋める"
  - step: "押す" 0.8s
    focus: ["利用者 -> 入力欄"]
    badge: "送信"
  - step: "送信" 1.2s
    focus: [入力欄, 処理側]
    badge: "POST"
  - step: "受け取った" 1.0s
    focus: ["入力欄 -> 利用者"]
    badge: "正常"
`;

export const sourceJson__formSubmit = `{
  "title": "Form submit",
  "type": "sequence",
  "actors": [
    { "name": "利用者" },
    { "name": "入力欄" },
    { "name": "処理側" }
  ],
  "flow": [
    { "from": "利用者", "to": "入力欄", "label": "項目を埋める" },
    { "from": "利用者", "to": "入力欄", "label": "送信" },
    { "from": "入力欄", "to": "処理側", "label": "POST 入力欄" },
    { "from": "処理側", "to": "入力欄", "label": "200" },
    { "from": "入力欄", "to": "利用者", "label": "成功の知らせ" }
  ],
  "animation": [
    { "step": "埋める", "duration": 1, "focus": ["利用者 -> 入力欄"], "badge": "埋める" },
    { "step": "押す", "duration": 0.8, "focus": ["利用者 -> 入力欄"], "badge": "送信" },
    { "step": "送信", "duration": 1.2, "focus": ["入力欄", "処理側"], "badge": "POST" },
    { "step": "受け取った", "duration": 1, "focus": ["入力欄 -> 利用者"], "badge": "正常" }
  ]
}`;

export const formSubmit = withId("form-submit", textDslToDiagram(sourceYaml__formSubmit));

/** C-2. File upload (multipart + progress) */
export const sourceYaml__fileUpload = `title: "File upload"
type: sequence

actors:
  - 閲覧ソフト
  - API
  - 保管庫

flow:
  - 閲覧ソフト -> API: "POST 分割の本文"
  - API -> 保管庫: "PUT 中身"
  - 保管庫 -> API: "版の印 + 置き場所"
  - API -> 閲覧ソフト: "201 + 置き場所"

animation:
  - step: "送り込み" 1.5s
    focus: [閲覧ソフト, API]
    badge: "分割"
  - step: "保管" 1.2s
    focus: [API, 保管庫]
    badge: "PUT"
  - step: "返す" 1.0s
    focus: [API, 閲覧ソフト]
    badge: "置き場所"
`;

export const sourceJson__fileUpload = `{
  "title": "File upload",
  "type": "sequence",
  "actors": [
    { "name": "閲覧ソフト" },
    { "name": "API" },
    { "name": "保管庫" }
  ],
  "flow": [
    { "from": "閲覧ソフト", "to": "API", "label": "POST 分割の本文" },
    { "from": "API", "to": "保管庫", "label": "PUT 中身" },
    { "from": "保管庫", "to": "API", "label": "版の印 + 置き場所" },
    { "from": "API", "to": "閲覧ソフト", "label": "201 + 置き場所" }
  ],
  "animation": [
    { "step": "送り込み", "duration": 1.5, "focus": ["閲覧ソフト", "API"], "badge": "分割" },
    { "step": "保管", "duration": 1.2, "focus": ["API", "保管庫"], "badge": "PUT" },
    { "step": "返す", "duration": 1, "focus": ["API", "閲覧ソフト"], "badge": "置き場所" }
  ]
}`;

export const fileUpload = withId("file-upload", textDslToDiagram(sourceYaml__fileUpload));

/** C-3. SSE (server-sent events) */
export const sourceYaml__sseStream = `title: "SSE stream"
type: sequence

actors:
  - 閲覧ソフト
  - 処理側

flow:
  - 閲覧ソフト -> 処理側: "GET 出来事の流れ"
  - 処理側 -> 閲覧ソフト: "出来事 1"
  - 処理側 -> 閲覧ソフト: "出来事 2"
  - 処理側 -> 閲覧ソフト: "出来事 3"

animation:
  - step: "開く" 1.0s
    focus: ["閲覧ソフト -> 処理側"]
    badge: "開く"
  - step: "出来事 1" 0.8s
    focus: ["処理側 -> 閲覧ソフト"]
    badge: "出来事 1"
  - step: "出来事 2" 0.8s
    focus: ["処理側 -> 閲覧ソフト", 閲覧ソフト]
    badge: "出来事 2"
  - step: "出来事 3" 0.8s
    focus: ["処理側 -> 閲覧ソフト", 閲覧ソフト, 処理側]
    badge: "出来事 3"
`;

export const sourceJson__sseStream = `{
  "title": "SSE stream",
  "type": "sequence",
  "actors": [
    { "name": "閲覧ソフト" },
    { "name": "処理側" }
  ],
  "flow": [
    { "from": "閲覧ソフト", "to": "処理側", "label": "GET 出来事の流れ" },
    { "from": "処理側", "to": "閲覧ソフト", "label": "出来事 1" },
    { "from": "処理側", "to": "閲覧ソフト", "label": "出来事 2" },
    { "from": "処理側", "to": "閲覧ソフト", "label": "出来事 3" }
  ],
  "animation": [
    { "step": "開く", "duration": 1, "focus": ["閲覧ソフト -> 処理側"], "badge": "開く" },
    { "step": "出来事 1", "duration": 0.8, "focus": ["処理側 -> 閲覧ソフト"], "badge": "出来事 1" },
    {
      "step": "出来事 2",
      "duration": 0.8,
      "focus": ["処理側 -> 閲覧ソフト", "閲覧ソフト"],
      "badge": "出来事 2"
    },
    {
      "step": "出来事 3",
      "duration": 0.8,
      "focus": ["処理側 -> 閲覧ソフト", "閲覧ソフト", "処理側"],
      "badge": "出来事 3"
    }
  ]
}`;

export const sseStream = withId("sse-stream", textDslToDiagram(sourceYaml__sseStream));

/** C-4. WebSocket bi-directional */
export const sourceYaml__websocket = `title: "WebSocket"
type: sequence

actors:
  - 利用者側
  - 処理側

flow:
  - 利用者側 -> 処理側: "接続の確立"
  - 処理側 -> 利用者側: "101 切り替え"
  - 利用者側 -> 処理側: "文面を送る"
  - 処理側 -> 利用者側: "全員へ送る"

animation:
  - step: "接続の確立" 1.0s
    focus: ["利用者側 -> 処理側"]
    badge: "接続"
  - step: "送る" 1.0s
    focus: ["利用者側 -> 処理側", 利用者側]
    badge: "文面"
  - step: "全員へ送る" 1.0s
    focus: ["処理側 -> 利用者側", 利用者側, 処理側]
    badge: "受け取る"
`;

export const sourceJson__websocket = `{
  "title": "WebSocket",
  "type": "sequence",
  "actors": [
    { "name": "利用者側" },
    { "name": "処理側" }
  ],
  "flow": [
    { "from": "利用者側", "to": "処理側", "label": "接続の確立" },
    { "from": "処理側", "to": "利用者側", "label": "101 切り替え" },
    { "from": "利用者側", "to": "処理側", "label": "文面を送る" },
    { "from": "処理側", "to": "利用者側", "label": "全員へ送る" }
  ],
  "animation": [
    { "step": "接続の確立", "duration": 1, "focus": ["利用者側 -> 処理側"], "badge": "接続" },
    { "step": "送る", "duration": 1, "focus": ["利用者側 -> 処理側", "利用者側"], "badge": "文面" },
    {
      "step": "全員へ送る",
      "duration": 1,
      "focus": ["処理側 -> 利用者側", "利用者側", "処理側"],
      "badge": "受け取る"
    }
  ]
}`;

export const websocket = withId("websocket", textDslToDiagram(sourceYaml__websocket));

/** C-5. Notification (toast / push) */
export const sourceYaml__notification = `title: "Notification"
type: sequence

actors:
  - 本体
  - 通知の配達
  - 端末

flow:
  - 本体 -> 通知の配達: "中身を送る"
  - 通知の配達 -> 端末: "届ける"
  - 端末 -> 本体: "押す"

animation:
  - step: "送る" 1.2s
    focus: [本体, 通知の配達]
    badge: "送る"
  - step: "届ける" 1.2s
    focus: [通知の配達, 端末]
    badge: "通知"
  - step: "押す" 1.0s
    focus: [端末, 本体]
    badge: "開く"
`;

export const sourceJson__notification = `{
  "title": "Notification",
  "type": "sequence",
  "actors": [
    { "name": "本体" },
    { "name": "通知の配達" },
    { "name": "端末" }
  ],
  "flow": [
    { "from": "本体", "to": "通知の配達", "label": "中身を送る" },
    { "from": "通知の配達", "to": "端末", "label": "届ける" },
    { "from": "端末", "to": "本体", "label": "押す" }
  ],
  "animation": [
    { "step": "送る", "duration": 1.2, "focus": ["本体", "通知の配達"], "badge": "送る" },
    { "step": "届ける", "duration": 1.2, "focus": ["通知の配達", "端末"], "badge": "通知" },
    { "step": "押す", "duration": 1, "focus": ["端末", "本体"], "badge": "開く" }
  ]
}`;

export const notification = withId("notification", textDslToDiagram(sourceYaml__notification));

// ─────────────────────────────────────────────────────────────
// D. 非同期 / バックグラウンド (5 例)
// ─────────────────────────────────────────────────────────────

/** D-1. Background job (enqueue + worker) */
export const sourceYaml__backgroundJob = `title: "Background job"
type: sequence

actors:
  - API
  - 待ち行列
  - 働き手

flow:
  - API -> 待ち行列: "仕事を積む"
  - 待ち行列 -> 働き手: "届ける"
  - 働き手 -> 待ち行列: "受け取った"

animation:
  - step: "積む" 1.2s
    focus: [API, 待ち行列]
    badge: "積む"
  - step: "処理" 1.5s
    focus: [待ち行列, 働き手]
    badge: "処理"
  - step: "受け取った" 1.0s
    focus: [働き手, 待ち行列]
    badge: "受け取った"
`;

export const sourceJson__backgroundJob = `{
  "title": "Background job",
  "type": "sequence",
  "actors": [
    { "name": "API" },
    { "name": "待ち行列" },
    { "name": "働き手" }
  ],
  "flow": [
    { "from": "API", "to": "待ち行列", "label": "仕事を積む" },
    { "from": "待ち行列", "to": "働き手", "label": "届ける" },
    { "from": "働き手", "to": "待ち行列", "label": "受け取った" }
  ],
  "animation": [
    { "step": "積む", "duration": 1.2, "focus": ["API", "待ち行列"], "badge": "積む" },
    { "step": "処理", "duration": 1.5, "focus": ["待ち行列", "働き手"], "badge": "処理" },
    { "step": "受け取った", "duration": 1, "focus": ["働き手", "待ち行列"], "badge": "受け取った" }
  ]
}`;

export const backgroundJob = withId("background-job", textDslToDiagram(sourceYaml__backgroundJob));

/** D-2. Retry with exponential backoff */
export const sourceYaml__retryBackoff = `title: "Retry + backoff"
type: sequence

actors:
  - 利用者側
  - API

flow:
  - 利用者側 -> API: "1 回目"
  - API -> 利用者側: "500"
  - 利用者側 -> API: "2 回目 (1 秒待つ)"
  - API -> 利用者側: "500"
  - 利用者側 -> API: "3 回目 (2 秒待つ)"
  - API -> 利用者側: "200"

animation:
  - step: "1 回目" 1.0s
    focus: ["利用者側 -> API"]
    badge: "500"
  - step: "2 回目" 1.2s
    focus: ["利用者側 -> API", 利用者側]
    badge: "1 秒待つ"
  - step: "3 回目" 1.2s
    focus: ["API -> 利用者側", 利用者側, API]
    badge: "200"
`;

export const sourceJson__retryBackoff = `{
  "title": "Retry + backoff",
  "type": "sequence",
  "actors": [
    { "name": "利用者側" },
    { "name": "API" }
  ],
  "flow": [
    { "from": "利用者側", "to": "API", "label": "1 回目" },
    { "from": "API", "to": "利用者側", "label": "500" },
    { "from": "利用者側", "to": "API", "label": "2 回目 (1 秒待つ)" },
    { "from": "API", "to": "利用者側", "label": "500" },
    { "from": "利用者側", "to": "API", "label": "3 回目 (2 秒待つ)" },
    { "from": "API", "to": "利用者側", "label": "200" }
  ],
  "animation": [
    { "step": "1 回目", "duration": 1, "focus": ["利用者側 -> API"], "badge": "500" },
    {
      "step": "2 回目",
      "duration": 1.2,
      "focus": ["利用者側 -> API", "利用者側"],
      "badge": "1 秒待つ"
    },
    {
      "step": "3 回目",
      "duration": 1.2,
      "focus": ["API -> 利用者側", "利用者側", "API"],
      "badge": "200"
    }
  ]
}`;

export const retryBackoff = withId("retry-backoff", textDslToDiagram(sourceYaml__retryBackoff));

/** D-3. Webhook delivery */
export const sourceYaml__webhook = `title: "Webhook"
type: sequence

actors:
  - 出どころ
  - 配り手
  - 受け手

flow:
  - 出どころ -> 配り手: "出来事"
  - 配り手 -> 受け手: "POST 中身 + 署名"
  - 受け手 -> 配り手: "200"

animation:
  - step: "起動" 1.2s
    focus: [出どころ, 配り手]
    badge: "出来事"
  - step: "届ける" 1.5s
    focus: [配り手, 受け手]
    badge: "POST"
  - step: "受け取った" 1.0s
    focus: [受け手, 配り手]
    badge: "200"
`;

export const sourceJson__webhook = `{
  "title": "Webhook",
  "type": "sequence",
  "actors": [
    { "name": "出どころ" },
    { "name": "配り手" },
    { "name": "受け手" }
  ],
  "flow": [
    { "from": "出どころ", "to": "配り手", "label": "出来事" },
    { "from": "配り手", "to": "受け手", "label": "POST 中身 + 署名" },
    { "from": "受け手", "to": "配り手", "label": "200" }
  ],
  "animation": [
    { "step": "起動", "duration": 1.2, "focus": ["出どころ", "配り手"], "badge": "出来事" },
    { "step": "届ける", "duration": 1.5, "focus": ["配り手", "受け手"], "badge": "POST" },
    { "step": "受け取った", "duration": 1, "focus": ["受け手", "配り手"], "badge": "200" }
  ]
}`;

export const webhook = withId("webhook", textDslToDiagram(sourceYaml__webhook));

/** D-4. Polling vs Long-polling */
export const sourceYaml__polling = `title: "Long polling"
type: sequence

actors:
  - 利用者側
  - 処理側
  - DB

flow:
  - 利用者側 -> 処理側: "GET 問い合わせ"
  - 処理側 -> DB: "更新を待つ"
  - DB -> 処理側: "新しい中身"
  - 処理側 -> 利用者側: "200 + 中身"

animation:
  - step: "要求" 1.0s
    focus: [利用者側, 処理側]
    badge: "問い合わせ"
  - step: "待つ" 1.5s
    focus: [処理側, DB]
    badge: "待つ"
  - step: "返す" 1.0s
    focus: [処理側, 利用者側]
    badge: "中身"
`;

export const sourceJson__polling = `{
  "title": "Long polling",
  "type": "sequence",
  "actors": [
    { "name": "利用者側" },
    { "name": "処理側" },
    { "name": "DB" }
  ],
  "flow": [
    { "from": "利用者側", "to": "処理側", "label": "GET 問い合わせ" },
    { "from": "処理側", "to": "DB", "label": "更新を待つ" },
    { "from": "DB", "to": "処理側", "label": "新しい中身" },
    { "from": "処理側", "to": "利用者側", "label": "200 + 中身" }
  ],
  "animation": [
    { "step": "要求", "duration": 1, "focus": ["利用者側", "処理側"], "badge": "問い合わせ" },
    { "step": "待つ", "duration": 1.5, "focus": ["処理側", "DB"], "badge": "待つ" },
    { "step": "返す", "duration": 1, "focus": ["処理側", "利用者側"], "badge": "中身" }
  ]
}`;

export const polling = withId("polling", textDslToDiagram(sourceYaml__polling));

/** D-5. Scheduled task (cron) */
export const sourceYaml__scheduledTask = `title: "Scheduled task"
type: sequence

actors:
  - 定時の合図
  - 割り当て
  - 仕事

flow:
  - 定時の合図 -> 割り当て: "5 分ごとに刻む"
  - 割り当て -> 仕事: "起動"
  - 仕事 -> 割り当て: "結果"

animation:
  - step: "刻む" 1.0s
    focus: [定時の合図, 割り当て]
    badge: "刻む"
  - step: "実行" 1.5s
    focus: [割り当て, 仕事]
    badge: "実行"
  - step: "結果" 1.0s
    focus: [仕事, 割り当て]
    badge: "正常"
`;

export const sourceJson__scheduledTask = `{
  "title": "Scheduled task",
  "type": "sequence",
  "actors": [
    { "name": "定時の合図" },
    { "name": "割り当て" },
    { "name": "仕事" }
  ],
  "flow": [
    { "from": "定時の合図", "to": "割り当て", "label": "5 分ごとに刻む" },
    { "from": "割り当て", "to": "仕事", "label": "起動" },
    { "from": "仕事", "to": "割り当て", "label": "結果" }
  ],
  "animation": [
    { "step": "刻む", "duration": 1, "focus": ["定時の合図", "割り当て"], "badge": "刻む" },
    { "step": "実行", "duration": 1.5, "focus": ["割り当て", "仕事"], "badge": "実行" },
    { "step": "結果", "duration": 1, "focus": ["仕事", "割り当て"], "badge": "正常" }
  ]
}`;

export const scheduledTask = withId("scheduled-task", textDslToDiagram(sourceYaml__scheduledTask));

// ─────────────────────────────────────────────────────────────
// E. 運用 / 配信 (5 例)
// ─────────────────────────────────────────────────────────────

/** E-1. Audit log */
export const sourceYaml__auditLog = `title: "Audit log"
type: sequence

actors:
  - 管理者
  - API
  - 監査の記録

flow:
  - 管理者 -> API: "利用者を消す"
  - API -> 監査の記録: "記録を残す"
  - API -> 管理者: "200"

animation:
  - step: "操作" 1.2s
    focus: [管理者, API]
    badge: "削除"
  - step: "記録" 1.2s
    focus: [API, 監査の記録]
    badge: "記録"
  - step: "受け取った" 1.0s
    focus: [API, 管理者]
    badge: "200"
`;

export const sourceJson__auditLog = `{
  "title": "Audit log",
  "type": "sequence",
  "actors": [
    { "name": "管理者" },
    { "name": "API" },
    { "name": "監査の記録" }
  ],
  "flow": [
    { "from": "管理者", "to": "API", "label": "利用者を消す" },
    { "from": "API", "to": "監査の記録", "label": "記録を残す" },
    { "from": "API", "to": "管理者", "label": "200" }
  ],
  "animation": [
    { "step": "操作", "duration": 1.2, "focus": ["管理者", "API"], "badge": "削除" },
    { "step": "記録", "duration": 1.2, "focus": ["API", "監査の記録"], "badge": "記録" },
    { "step": "受け取った", "duration": 1, "focus": ["API", "管理者"], "badge": "200" }
  ]
}`;

export const auditLog = withId("audit-log", textDslToDiagram(sourceYaml__auditLog));

/** E-2. Email notification */
export const sourceYaml__emailNotification = `title: "Email notification"
type: sequence

actors:
  - 本体
  - 送信待ち
  - 配信業者
  - 受信箱

flow:
  - 本体 -> 送信待ち: "メールを積む"
  - 送信待ち -> 配信業者: "送る"
  - 配信業者 -> 受信箱: "届ける"

animation:
  - step: "積む" 1.0s
    focus: [本体, 送信待ち]
    badge: "積む"
  - step: "送る" 1.2s
    focus: [送信待ち, 配信業者]
    badge: "送る"
  - step: "届ける" 1.0s
    focus: [配信業者, 受信箱]
    badge: "届ける"
`;

export const sourceJson__emailNotification = `{
  "title": "Email notification",
  "type": "sequence",
  "actors": [
    { "name": "本体" },
    { "name": "送信待ち" },
    { "name": "配信業者" },
    { "name": "受信箱" }
  ],
  "flow": [
    { "from": "本体", "to": "送信待ち", "label": "メールを積む" },
    { "from": "送信待ち", "to": "配信業者", "label": "送る" },
    { "from": "配信業者", "to": "受信箱", "label": "届ける" }
  ],
  "animation": [
    { "step": "積む", "duration": 1, "focus": ["本体", "送信待ち"], "badge": "積む" },
    { "step": "送る", "duration": 1.2, "focus": ["送信待ち", "配信業者"], "badge": "送る" },
    { "step": "届ける", "duration": 1, "focus": ["配信業者", "受信箱"], "badge": "届ける" }
  ]
}`;

export const emailNotification = withId(
  "email-notification",
  textDslToDiagram(sourceYaml__emailNotification),
);

/** E-3. Export (CSV / JSON download) */
export const sourceYaml__exportData = `title: "Export CSV"
type: sequence

actors:
  - 利用者側
  - API
  - DB
  - 保管庫

flow:
  - 利用者側 -> API: "POST 書き出し"
  - API -> DB: "行を流す"
  - DB -> API: "行"
  - API -> 保管庫: "PUT CSV"
  - API -> 利用者側: "200 + 置き場所"

animation:
  - step: "要求" 1.0s
    focus: [利用者側, API]
    badge: "書き出し"
  - step: "流す" 1.5s
    focus: [API, DB]
    badge: "行"
  - step: "保管" 1.2s
    focus: [API, 保管庫]
    badge: "PUT"
  - step: "返す" 1.0s
    focus: [API, 利用者側]
    badge: "置き場所"
`;

export const sourceJson__exportData = `{
  "title": "Export CSV",
  "type": "sequence",
  "actors": [
    { "name": "利用者側" },
    { "name": "API" },
    { "name": "DB" },
    { "name": "保管庫" }
  ],
  "flow": [
    { "from": "利用者側", "to": "API", "label": "POST 書き出し" },
    { "from": "API", "to": "DB", "label": "行を流す" },
    { "from": "DB", "to": "API", "label": "行" },
    { "from": "API", "to": "保管庫", "label": "PUT CSV" },
    { "from": "API", "to": "利用者側", "label": "200 + 置き場所" }
  ],
  "animation": [
    { "step": "要求", "duration": 1, "focus": ["利用者側", "API"], "badge": "書き出し" },
    { "step": "流す", "duration": 1.5, "focus": ["API", "DB"], "badge": "行" },
    { "step": "保管", "duration": 1.2, "focus": ["API", "保管庫"], "badge": "PUT" },
    { "step": "返す", "duration": 1, "focus": ["API", "利用者側"], "badge": "置き場所" }
  ]
}`;

export const exportData = withId("export-data", textDslToDiagram(sourceYaml__exportData));

/** E-4. Import (bulk upload + validate) */
export const sourceYaml__importData = `title: "Import CSV"
type: sequence

actors:
  - 利用者
  - API
  - 検証役
  - DB

flow:
  - 利用者 -> API: "POST CSV"
  - API -> 検証役: "行を検証"
  - 検証役 -> API: "正しい行 + 誤り"
  - API -> DB: "正しい行を INSERT"
  - API -> 利用者: "結果のまとめ"

animation:
  - step: "送り込み" 1.2s
    focus: [利用者, API]
    badge: "送り込み"
  - step: "検証" 1.5s
    focus: [API, 検証役]
    badge: "検証"
  - step: "書き込み" 1.2s
    focus: [API, DB]
    badge: "INSERT"
  - step: "まとめ" 1.0s
    focus: [API, 利用者]
    badge: "報告"
`;

export const sourceJson__importData = `{
  "title": "Import CSV",
  "type": "sequence",
  "actors": [
    { "name": "利用者" },
    { "name": "API" },
    { "name": "検証役" },
    { "name": "DB" }
  ],
  "flow": [
    { "from": "利用者", "to": "API", "label": "POST CSV" },
    { "from": "API", "to": "検証役", "label": "行を検証" },
    { "from": "検証役", "to": "API", "label": "正しい行 + 誤り" },
    { "from": "API", "to": "DB", "label": "正しい行を INSERT" },
    { "from": "API", "to": "利用者", "label": "結果のまとめ" }
  ],
  "animation": [
    { "step": "送り込み", "duration": 1.2, "focus": ["利用者", "API"], "badge": "送り込み" },
    { "step": "検証", "duration": 1.5, "focus": ["API", "検証役"], "badge": "検証" },
    { "step": "書き込み", "duration": 1.2, "focus": ["API", "DB"], "badge": "INSERT" },
    { "step": "まとめ", "duration": 1, "focus": ["API", "利用者"], "badge": "報告" }
  ]
}`;

export const importData = withId("import-data", textDslToDiagram(sourceYaml__importData));

/** E-5. Health check / heartbeat */
export const sourceYaml__healthCheck = `title: "Health check"
type: sequence

actors:
  - 振り分け役
  - 稼働中の本体
  - 状態の掲示板

flow:
  - 振り分け役 -> 稼働中の本体: "GET 稼働の確認"
  - 稼働中の本体 -> 振り分け役: "200 正常"
  - 振り分け役 -> 状態の掲示板: "正常と記す"

animation:
  - step: "確かめる" 1.0s
    focus: [振り分け役, 稼働中の本体]
    badge: "GET"
  - step: "受け取った" 1.0s
    focus: [稼働中の本体, 振り分け役]
    badge: "200"
  - step: "記す" 1.0s
    focus: [振り分け役, 状態の掲示板]
    badge: "正常"
`;

export const sourceJson__healthCheck = `{
  "title": "Health check",
  "type": "sequence",
  "actors": [
    { "name": "振り分け役" },
    { "name": "稼働中の本体" },
    { "name": "状態の掲示板" }
  ],
  "flow": [
    { "from": "振り分け役", "to": "稼働中の本体", "label": "GET 稼働の確認" },
    { "from": "稼働中の本体", "to": "振り分け役", "label": "200 正常" },
    { "from": "振り分け役", "to": "状態の掲示板", "label": "正常と記す" }
  ],
  "animation": [
    { "step": "確かめる", "duration": 1, "focus": ["振り分け役", "稼働中の本体"], "badge": "GET" },
    { "step": "受け取った", "duration": 1, "focus": ["稼働中の本体", "振り分け役"], "badge": "200" },
    {
      "step": "記す",
      "duration": 1,
      "focus": ["振り分け役", "状態の掲示板"],
      "badge": "正常"
    }
  ]
}`;

export const healthCheck = withId("health-check", textDslToDiagram(sourceYaml__healthCheck));

// ─────────────────────────────────────────────────────────────
// F. 契約 (1 例、 #1411)
// ─────────────────────────────────────────────────────────────

/**
 * F-1. ERC-20 の送金 — `type: solidity` の見本。
 *
 * **`solidity` は `sequence` の別名ではない**。 箱の種別で縦列を並べ替える。
 *
 * | 種別 | 並び |
 * |---|---|
 * | `eoa` / `actor` / `multisig` / `signer` / `wallet` | 0 (左) |
 * | `contract` / `proxy` / `library` / `interface` | 1 |
 * | `storage` | 2 |
 * | `event` | 3 (右) |
 *
 * 書いた順に関わらず「人 → 契約 → 保存 → 出来事」 で並ぶため、契約のやり取りを読む時に
 * 左から右へ流れが揃う。
 *
 * **わざと逆順で書いている**。 出来事から書いても図は人から始まる = 並べ替えが働いている
 * ことが見本そのもので分かる。 順に書くと `sequence` との違いが見えない。
 *
 * **種別を書かない箱は `actor` として左端に並ぶ** (#2131)。 全ての箱で書かないと並べ替えの鍵が
 * 揃い、書いた順のまま並ぶ。 この見本は 4 つとも種別を書いていなかったので、題が謳う並びと
 * 逆 (出来事から始まる) に出ていた。
 * 見本が並べ替えを実演していることは `lib/solidity-sample-order.test.ts` が固定する。
 */
export const sourceYaml__tokenTransferSolidity = `title: "ERC-20 の送金 (種別ごとに縦列が並ぶ)"
type: solidity

actors:
  - Transfer: { kind: event }
  - 残高表: { kind: storage }
  - トークン契約: { kind: contract }
  - 利用者: { kind: eoa }

flow:
  - 利用者 -> トークン契約: "transfer(花子, 100)"
  - トークン契約 -> 残高表: "残高を書き換える"
  - トークン契約 -> Transfer: "Transfer を出す"
  - トークン契約 -> 利用者: "成功を返す"

animation:
  - step: "呼ぶ" 1.2s
    focus: [利用者, トークン契約]
    badge: "呼び出し"
  - step: "書き換える" 1.2s
    focus: [トークン契約, 残高表]
    badge: "書き込み"
  - step: "知らせる" 1.2s
    focus: [トークン契約, Transfer]
    badge: "出来事"
  - step: "返す" 1.2s
    focus: [トークン契約, 利用者]
    badge: "戻り値"
`;

export const sourceJson__tokenTransferSolidity = `{
  "title": "ERC-20 の送金 (種別ごとに縦列が並ぶ)",
  "type": "solidity",
  "actors": [
    { "name": "Transfer", "kind": "event" },
    { "name": "残高表", "kind": "storage" },
    { "name": "トークン契約", "kind": "contract" },
    { "name": "利用者", "kind": "eoa" }
  ],
  "flow": [
    { "from": "利用者", "to": "トークン契約", "label": "transfer(花子, 100)" },
    { "from": "トークン契約", "to": "残高表", "label": "残高を書き換える" },
    { "from": "トークン契約", "to": "Transfer", "label": "Transfer を出す" },
    { "from": "トークン契約", "to": "利用者", "label": "成功を返す" }
  ],
  "animation": [
    { "step": "呼ぶ", "duration": 1.2, "focus": ["利用者", "トークン契約"], "badge": "呼び出し" },
    { "step": "書き換える", "duration": 1.2, "focus": ["トークン契約", "残高表"], "badge": "書き込み" },
    { "step": "知らせる", "duration": 1.2, "focus": ["トークン契約", "Transfer"], "badge": "出来事" },
    { "step": "返す", "duration": 1.2, "focus": ["トークン契約", "利用者"], "badge": "戻り値" }
  ]
}`;

export const tokenTransferSolidity = withId(
  "erc20-transfer-solidity",
  textDslToDiagram(sourceYaml__tokenTransferSolidity),
);
