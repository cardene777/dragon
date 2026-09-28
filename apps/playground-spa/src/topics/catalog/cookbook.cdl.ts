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
    description: "利用者側が id を添えて GET を送る。 まだ保存先には触らず、受け口が要求を受け取ったところ。"
  - step: "照会" 1.2s
    focus: [受け口, DB]
    badge: "SELECT"
    description: "受け口が SELECT を投げ、DB が該当する行を返す。 ここで初めて保存先に触る。"
  - step: "返す" 1.2s
    focus: [DB, 受け口, 利用者側]
    badge: "200"
    description: "受け口が行を JSON に組み直して 200 で返す。 往復 1 回で閉じる。"
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
    { "step": "要求", "duration": 1.2, "focus": ["利用者側", "受け口"], "badge": "GET", "description": "利用者側が id を添えて GET を送る。 まだ保存先には触らず、受け口が要求を受け取ったところ。" },
    { "step": "照会", "duration": 1.2, "focus": ["受け口", "DB"], "badge": "SELECT", "description": "受け口が SELECT を投げ、DB が該当する行を返す。 ここで初めて保存先に触る。" },
    { "step": "返す", "duration": 1.2, "focus": ["DB", "受け口", "利用者側"], "badge": "200", "description": "受け口が行を JSON に組み直して 200 で返す。 往復 1 回で閉じる。" }
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
    description: "利用者が認証情報を送り、認証窓口が DB と突き合わせる。 まだ鍵は渡っていない。"
  - step: "発行" 1.0s
    focus: [認証窓口, 利用者]
    badge: "JWT"
    description: "照合が通り、期限付きの鍵を利用者へ渡す。 DB はこの段に関わらない。"
  - step: "鍵で呼ぶ" 1.5s
    focus: [利用者, API]
    badge: "200"
    description: "利用者が鍵を添えて API を呼ぶ。 API は鍵の署名だけを見るので DB への照会が要らない。"
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
      "badge": "照合",
      "description": "利用者が認証情報を送り、認証窓口が DB と突き合わせる。 まだ鍵は渡っていない。"
    },
    { "step": "発行", "duration": 1, "focus": ["認証窓口", "利用者"], "badge": "JWT", "description": "照合が通り、期限付きの鍵を利用者へ渡す。 DB はこの段に関わらない。" },
    { "step": "鍵で呼ぶ", "duration": 1.5, "focus": ["利用者", "API"], "badge": "200", "description": "利用者が鍵を添えて API を呼ぶ。 API は鍵の署名だけを見るので DB への照会が要らない。" }
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
    description: "利用者が本体で認証を始め、本体が認可窓口へ送り出す。 本体はまだ鍵を持たない。"
  - step: "同意の確認" 1.5s
    focus: [認可窓口, 利用者]
    badge: "同意の確認"
    description: "認可窓口が利用者に何を渡すかを尋ねる。 決めるのは本体ではなく利用者。"
  - step: "許可" 1.0s
    focus: ["利用者 -> 認可窓口"]
    badge: "許可"
    description: "利用者が許可を出す。 この 1 往復は本体を通らず、利用者と認可窓口の間で閉じる。"
  - step: "引き換え" 1.2s
    focus: [本体, 認可窓口]
    badge: "認可の番号"
    description: "本体が受け取った認可の番号を鍵に替える。 番号は 1 度しか使えないのでここで使い切る。"
  - step: "利用" 1.0s
    focus: [本体, API]
    badge: "鍵"
    description: "本体が鍵を添えて API を呼ぶ。 利用者の認証情報を本体が預からずに済む。"
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
      "badge": "転送",
      "description": "利用者が本体で認証を始め、本体が認可窓口へ送り出す。 本体はまだ鍵を持たない。"
    },
    { "step": "同意の確認", "duration": 1.5, "focus": ["認可窓口", "利用者"], "badge": "同意の確認", "description": "認可窓口が利用者に何を渡すかを尋ねる。 決めるのは本体ではなく利用者。" },
    { "step": "許可", "duration": 1, "focus": ["利用者 -> 認可窓口"], "badge": "許可", "description": "利用者が許可を出す。 この 1 往復は本体を通らず、利用者と認可窓口の間で閉じる。" },
    { "step": "引き換え", "duration": 1.2, "focus": ["本体", "認可窓口"], "badge": "認可の番号", "description": "本体が受け取った認可の番号を鍵に替える。 番号は 1 度しか使えないのでここで使い切る。" },
    { "step": "利用", "duration": 1, "focus": ["本体", "API"], "badge": "鍵", "description": "本体が鍵を添えて API を呼ぶ。 利用者の認証情報を本体が預からずに済む。" }
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
    description: "要求が流量制限を通り、残り枠が 5 から 4 へ減る。 API まで届いて 200 が返る。"
  - step: "超過" 1.2s
    focus: [利用者側, 流量制限]
    badge: "429"
    description: "枠を使い切った 6 回目は API へ渡さず 429 を返す。 待ってから送り直す合図になる。"
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
      "badge": "許可",
      "description": "要求が流量制限を通り、残り枠が 5 から 4 へ減る。 API まで届いて 200 が返る。"
    },
    { "step": "超過", "duration": 1.2, "focus": ["利用者側", "流量制限"], "badge": "429", "description": "枠を使い切った 6 回目は API へ渡さず 429 を返す。 待ってから送り直す合図になる。" }
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
    description: "入力欄を出す前に、1 回だけ使える鍵を利用中の記録へ書く。 閲覧ソフトはまだ鍵を知らない。"
  - step: "発行" 1.2s
    focus: ["処理側 -> 閲覧ソフト"]
    badge: "発行"
    description: "入力欄と鍵をまとめて返す。 鍵は見えない項目として入力欄に埋まる。"
  - step: "送信" 1.2s
    focus: ["閲覧ソフト -> 処理側"]
    badge: "POST"
    description: "閲覧ソフトが中身と鍵を一緒に POST する。 鍵の無い送信をここで見分けられる。"
  - step: "照合" 1.2s
    focus: [処理側, 利用中の記録]
    badge: "照合"
    description: "受け取った鍵と記録側の鍵を突き合わせる。 食い違えば受け付けない。"
  - step: "受理" 1.0s
    focus: ["処理側 -> 閲覧ソフト"]
    badge: "200"
    description: "照合が通ったので 200 を返す。 使った鍵は捨て、次の送信には別の鍵を出す。"
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
    { "step": "保管", "duration": 1.2, "focus": ["処理側", "利用中の記録"], "badge": "保管", "description": "入力欄を出す前に、1 回だけ使える鍵を利用中の記録へ書く。 閲覧ソフトはまだ鍵を知らない。" },
    { "step": "発行", "duration": 1.2, "focus": ["処理側 -> 閲覧ソフト"], "badge": "発行", "description": "入力欄と鍵をまとめて返す。 鍵は見えない項目として入力欄に埋まる。" },
    { "step": "送信", "duration": 1.2, "focus": ["閲覧ソフト -> 処理側"], "badge": "POST", "description": "閲覧ソフトが中身と鍵を一緒に POST する。 鍵の無い送信をここで見分けられる。" },
    { "step": "照合", "duration": 1.2, "focus": ["処理側", "利用中の記録"], "badge": "照合", "description": "受け取った鍵と記録側の鍵を突き合わせる。 食い違えば受け付けない。" },
    { "step": "受理", "duration": 1, "focus": ["処理側 -> 閲覧ソフト"], "badge": "200", "description": "照合が通ったので 200 を返す。 使った鍵は捨て、次の送信には別の鍵を出す。" }
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
    description: "利用者側が作りたい中身を JSON で送る。 表にはまだ何も増えていない。"
  - step: "書き込み" 1.2s
    focus: [受け口, DB, 表]
    badge: "INSERT"
    description: "受け口が INSERT を投げ、表に行が 1 つ増える。 ここで初めて記録が残る。"
  - step: "返す" 1.0s
    focus: [受け口, 利用者側]
    badge: "201"
    description: "結果を 201 で返す。 200 ではないのは、新しく作られたことを表すため。"
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
    { "step": "送る", "duration": 1.2, "focus": ["利用者側", "受け口"], "badge": "POST", "description": "利用者側が作りたい中身を JSON で送る。 表にはまだ何も増えていない。" },
    {
      "step": "書き込み",
      "duration": 1.2,
      "focus": ["受け口", "DB", "表"],
      "badge": "INSERT",
      "description": "受け口が INSERT を投げ、表に行が 1 つ増える。 ここで初めて記録が残る。"
    },
    { "step": "返す", "duration": 1, "focus": ["受け口", "利用者側"], "badge": "201", "description": "結果を 201 で返す。 200 ではないのは、新しく作られたことを表すため。" }
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
    description: "続きの印なしで一覧を引き、20 行と次の印が返る。 印は次の位置を指す目印。"
  - step: "次の 20 件" 1.2s
    focus: [利用者側, API]
    badge: "次の 20 件"
    description: "受け取った印を添えて次を引く。 ページ番号ではなく印を使うので、途中で行が増えても重複しない。"
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
    { "step": "最初の 20 件", "duration": 1.5, "focus": ["利用者側", "API", "DB"], "badge": "最初の 20 件", "description": "続きの印なしで一覧を引き、20 行と次の印が返る。 印は次の位置を指す目印。" },
    { "step": "次の 20 件", "duration": 1.2, "focus": ["利用者側", "API"], "badge": "次の 20 件", "description": "受け取った印を添えて次を引く。 ページ番号ではなく印を使うので、途中で行が増えても重複しない。" }
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
    description: "API がまず一時置き場を見る。 DB へは行かず、置いてあるかだけを確かめる。"
  - step: "無い" 1.2s
    focus: ["一時置き場 -> API"]
    badge: "無い"
    description: "一時置き場に無いと返る。 ここで初めて DB を引く経路に入る。"
  - step: "DB から引く" 1.5s
    focus: [API, DB]
    badge: "SELECT"
    description: "API が SELECT を投げ、DB が行を返す。 この 1 回だけが遅い経路になる。"
  - step: "埋める" 1.2s
    focus: ["API -> 一時置き場"]
    badge: "置く"
    description: "引いた値を一時置き場に 60 秒だけ置く。 次の同じ要求は 1 段目で返せる。"
  - step: "返す" 1.0s
    focus: ["API -> 利用者側"]
    badge: "200"
    description: "利用者側へ 200 を返す。 置き場に有る時と無い時で、返る中身は同じ。"
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
    { "step": "探す", "duration": 1, "focus": ["API -> 一時置き場"], "badge": "探す", "description": "API がまず一時置き場を見る。 DB へは行かず、置いてあるかだけを確かめる。" },
    { "step": "無い", "duration": 1.2, "focus": ["一時置き場 -> API"], "badge": "無い", "description": "一時置き場に無いと返る。 ここで初めて DB を引く経路に入る。" },
    { "step": "DB から引く", "duration": 1.5, "focus": ["API", "DB"], "badge": "SELECT", "description": "API が SELECT を投げ、DB が行を返す。 この 1 回だけが遅い経路になる。" },
    { "step": "埋める", "duration": 1.2, "focus": ["API -> 一時置き場"], "badge": "置く", "description": "引いた値を一時置き場に 60 秒だけ置く。 次の同じ要求は 1 段目で返せる。" },
    { "step": "返す", "duration": 1, "focus": ["API -> 利用者側"], "badge": "200", "description": "利用者側へ 200 を返す。 置き場に有る時と無い時で、返る中身は同じ。" }
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
    description: "利用者側が語を添えて検索を投げる。 DB ではなく索引へ向かう経路。"
  - step: "点数付け" 1.5s
    focus: [API, 索引]
    badge: "順位付け"
    description: "索引が語に分けて点数を付け、当たりを順位付きで返す。 並び順は点数が決める。"
  - step: "返す" 1.0s
    focus: [API, 利用者側]
    badge: "当たり"
    description: "順位のまま結果を返す。 利用者側で並べ替えをやり直す必要が無い。"
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
    { "step": "照会", "duration": 1.2, "focus": ["利用者側", "API"], "badge": "q=りんご", "description": "利用者側が語を添えて検索を投げる。 DB ではなく索引へ向かう経路。" },
    { "step": "点数付け", "duration": 1.5, "focus": ["API", "索引"], "badge": "順位付け", "description": "索引が語に分けて点数を付け、当たりを順位付きで返す。 並び順は点数が決める。" },
    { "step": "返す", "duration": 1, "focus": ["API", "利用者側"], "badge": "当たり", "description": "順位のまま結果を返す。 利用者側で並べ替えをやり直す必要が無い。" }
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
    description: "利用者側が絞る条件と並び順を一緒に渡す。 DB はまだ動かない。"
  - step: "照会" 1.5s
    focus: [API, DB]
    badge: "ORDER BY"
    description: "絞ってから並べる。 絞る方が先なので、並べる行数が減る。"
  - step: "返す" 1.0s
    focus: [API, 利用者側]
    badge: "200"
    description: "絞って並べた行をそのまま返す。 利用者側での並べ替えが要らない。"
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
    { "step": "要求", "duration": 1, "focus": ["利用者側", "API"], "badge": "絞り込み", "description": "利用者側が絞る条件と並び順を一緒に渡す。 DB はまだ動かない。" },
    { "step": "照会", "duration": 1.5, "focus": ["API", "DB"], "badge": "ORDER BY", "description": "絞ってから並べる。 絞る方が先なので、並べる行数が減る。" },
    { "step": "返す", "duration": 1, "focus": ["API", "利用者側"], "badge": "200", "description": "絞って並べた行をそのまま返す。 利用者側での並べ替えが要らない。" }
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
    description: "利用者が項目を埋める。 この間は処理側へ何も送っていない。"
  - step: "押す" 0.8s
    focus: ["利用者 -> 入力欄"]
    badge: "送信"
    description: "送信を押す。 入力欄の側で形を確かめる時間がここに入る。"
  - step: "送信" 1.2s
    focus: [入力欄, 処理側]
    badge: "POST"
    description: "入力欄が中身を送り、処理側が受け取る。 初めて外へ出る段。"
  - step: "受け取った" 1.0s
    focus: ["入力欄 -> 利用者"]
    badge: "正常"
    description: "処理側の 200 を受けて成功の知らせを出す。 利用者が見るのはこの 1 行だけ。"
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
    { "step": "埋める", "duration": 1, "focus": ["利用者 -> 入力欄"], "badge": "埋める", "description": "利用者が項目を埋める。 この間は処理側へ何も送っていない。" },
    { "step": "押す", "duration": 0.8, "focus": ["利用者 -> 入力欄"], "badge": "送信", "description": "送信を押す。 入力欄の側で形を確かめる時間がここに入る。" },
    { "step": "送信", "duration": 1.2, "focus": ["入力欄", "処理側"], "badge": "POST", "description": "入力欄が中身を送り、処理側が受け取る。 初めて外へ出る段。" },
    { "step": "受け取った", "duration": 1, "focus": ["入力欄 -> 利用者"], "badge": "正常", "description": "処理側の 200 を受けて成功の知らせを出す。 利用者が見るのはこの 1 行だけ。" }
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
    description: "閲覧ソフトが本文を分割して送る。 大きな中身を 1 度に送らないための形。"
  - step: "保管" 1.2s
    focus: [API, 保管庫]
    badge: "PUT"
    description: "API が中身を保管庫へ置き、版の印と置き場所を受け取る。 中身は API に残さない。"
  - step: "返す" 1.0s
    focus: [API, 閲覧ソフト]
    badge: "置き場所"
    description: "201 と置き場所を返す。 次からは置き場所を使って直に引ける。"
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
    { "step": "送り込み", "duration": 1.5, "focus": ["閲覧ソフト", "API"], "badge": "分割", "description": "閲覧ソフトが本文を分割して送る。 大きな中身を 1 度に送らないための形。" },
    { "step": "保管", "duration": 1.2, "focus": ["API", "保管庫"], "badge": "PUT", "description": "API が中身を保管庫へ置き、版の印と置き場所を受け取る。 中身は API に残さない。" },
    { "step": "返す", "duration": 1, "focus": ["API", "閲覧ソフト"], "badge": "置き場所", "description": "201 と置き場所を返す。 次からは置き場所を使って直に引ける。" }
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
    description: "閲覧ソフトが 1 本の接続を開く。 こちらから送るのはこの 1 回だけ。"
  - step: "出来事 1" 0.8s
    focus: ["処理側 -> 閲覧ソフト"]
    badge: "出来事 1"
    description: "処理側が最初の出来事を流す。 閲覧ソフトは要求を出し直していない。"
  - step: "出来事 2" 0.8s
    focus: ["処理側 -> 閲覧ソフト", 閲覧ソフト]
    badge: "出来事 2"
    description: "2 つ目が同じ接続を通って届く。 接続は開いたまま保たれる。"
  - step: "出来事 3" 0.8s
    focus: ["処理側 -> 閲覧ソフト", 閲覧ソフト, 処理側]
    badge: "出来事 3"
    description: "3 つ目が届く。 数に上限は無く、閉じるまで一方向に流れ続ける。"
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
    { "step": "開く", "duration": 1, "focus": ["閲覧ソフト -> 処理側"], "badge": "開く", "description": "閲覧ソフトが 1 本の接続を開く。 こちらから送るのはこの 1 回だけ。" },
    { "step": "出来事 1", "duration": 0.8, "focus": ["処理側 -> 閲覧ソフト"], "badge": "出来事 1", "description": "処理側が最初の出来事を流す。 閲覧ソフトは要求を出し直していない。" },
    {
      "step": "出来事 2",
      "duration": 0.8,
      "focus": ["処理側 -> 閲覧ソフト", "閲覧ソフト"],
      "badge": "出来事 2",
      "description": "2 つ目が同じ接続を通って届く。 接続は開いたまま保たれる。"
    },
    {
      "step": "出来事 3",
      "duration": 0.8,
      "focus": ["処理側 -> 閲覧ソフト", "閲覧ソフト", "処理側"],
      "badge": "出来事 3",
      "description": "3 つ目が届く。 数に上限は無く、閉じるまで一方向に流れ続ける。"
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
    description: "利用者側が接続を申し込み、処理側が 101 で切り替える。 ここから双方向になる。"
  - step: "送る" 1.0s
    focus: ["利用者側 -> 処理側", 利用者側]
    badge: "文面"
    description: "利用者側が文面を送る。 一方向に流すだけの形と違い、こちらからも送れる。"
  - step: "全員へ送る" 1.0s
    focus: ["処理側 -> 利用者側", 利用者側, 処理側]
    badge: "受け取る"
    description: "処理側が受けた文面を繋がっている全員へ配る。 送り主にも同じものが返る。"
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
    { "step": "接続の確立", "duration": 1, "focus": ["利用者側 -> 処理側"], "badge": "接続", "description": "利用者側が接続を申し込み、処理側が 101 で切り替える。 ここから双方向になる。" },
    { "step": "送る", "duration": 1, "focus": ["利用者側 -> 処理側", "利用者側"], "badge": "文面", "description": "利用者側が文面を送る。 一方向に流すだけの形と違い、こちらからも送れる。" },
    {
      "step": "全員へ送る",
      "duration": 1,
      "focus": ["処理側 -> 利用者側", "利用者側", "処理側"],
      "badge": "受け取る",
      "description": "処理側が受けた文面を繋がっている全員へ配る。 送り主にも同じものが返る。"
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
    description: "本体が通知の中身を配達へ渡す。 端末の在り処は本体が知らなくてよい。"
  - step: "届ける" 1.2s
    focus: [通知の配達, 端末]
    badge: "通知"
    description: "配達が端末へ届ける。 端末が起きていなければここで待たされる。"
  - step: "押す" 1.0s
    focus: [端末, 本体]
    badge: "開く"
    description: "利用者が通知を押し、本体へ戻ってくる。 押した先に何を出すかは本体が決める。"
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
    { "step": "送る", "duration": 1.2, "focus": ["本体", "通知の配達"], "badge": "送る", "description": "本体が通知の中身を配達へ渡す。 端末の在り処は本体が知らなくてよい。" },
    { "step": "届ける", "duration": 1.2, "focus": ["通知の配達", "端末"], "badge": "通知", "description": "配達が端末へ届ける。 端末が起きていなければここで待たされる。" },
    { "step": "押す", "duration": 1, "focus": ["端末", "本体"], "badge": "開く", "description": "利用者が通知を押し、本体へ戻ってくる。 押した先に何を出すかは本体が決める。" }
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
    description: "API が仕事を待ち行列へ積む。 要求はここで返せるので利用者を待たせない。"
  - step: "処理" 1.5s
    focus: [待ち行列, 働き手]
    badge: "処理"
    description: "働き手が取り出して動かす。 API とは別の速さで進む。"
  - step: "受け取った" 1.0s
    focus: [働き手, 待ち行列]
    badge: "受け取った"
    description: "働き手が終わりを知らせ、待ち行列から仕事が消える。 知らせが無ければもう 1 度配られる。"
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
    { "step": "積む", "duration": 1.2, "focus": ["API", "待ち行列"], "badge": "積む", "description": "API が仕事を待ち行列へ積む。 要求はここで返せるので利用者を待たせない。" },
    { "step": "処理", "duration": 1.5, "focus": ["待ち行列", "働き手"], "badge": "処理", "description": "働き手が取り出して動かす。 API とは別の速さで進む。" },
    { "step": "受け取った", "duration": 1, "focus": ["働き手", "待ち行列"], "badge": "受け取った", "description": "働き手が終わりを知らせ、待ち行列から仕事が消える。 知らせが無ければもう 1 度配られる。" }
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
    description: "最初の呼びが 500 で落ちる。 待ち時間はまだ入っていない。"
  - step: "2 回目" 1.2s
    focus: ["利用者側 -> API", 利用者側]
    badge: "1 秒待つ"
    description: "1 秒待ってから送り直す。 待たずに連打すると相手の詰まりを深くする。"
  - step: "3 回目" 1.2s
    focus: ["API -> 利用者側", 利用者側, API]
    badge: "200"
    description: "待ち時間を 2 秒へ倍にして送り、200 が返る。 間隔を倍にしていくのがこの形。"
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
    { "step": "1 回目", "duration": 1, "focus": ["利用者側 -> API"], "badge": "500", "description": "最初の呼びが 500 で落ちる。 待ち時間はまだ入っていない。" },
    {
      "step": "2 回目",
      "duration": 1.2,
      "focus": ["利用者側 -> API", "利用者側"],
      "badge": "1 秒待つ",
      "description": "1 秒待ってから送り直す。 待たずに連打すると相手の詰まりを深くする。"
    },
    {
      "step": "3 回目",
      "duration": 1.2,
      "focus": ["API -> 利用者側", "利用者側", "API"],
      "badge": "200",
      "description": "待ち時間を 2 秒へ倍にして送り、200 が返る。 間隔を倍にしていくのがこの形。"
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
    description: "出どころで出来事が起き、配り手が受け取る。 受け手はまだ知らない。"
  - step: "届ける" 1.5s
    focus: [配り手, 受け手]
    badge: "POST"
    description: "配り手が受け手へ中身と署名を送る。 署名は差出人を確かめるため。"
  - step: "受け取った" 1.0s
    focus: [受け手, 配り手]
    badge: "200"
    description: "受け手が 200 を返す。 返らなければ配り手が後で送り直す。"
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
    { "step": "起動", "duration": 1.2, "focus": ["出どころ", "配り手"], "badge": "出来事", "description": "出どころで出来事が起き、配り手が受け取る。 受け手はまだ知らない。" },
    { "step": "届ける", "duration": 1.5, "focus": ["配り手", "受け手"], "badge": "POST", "description": "配り手が受け手へ中身と署名を送る。 署名は差出人を確かめるため。" },
    { "step": "受け取った", "duration": 1, "focus": ["受け手", "配り手"], "badge": "200", "description": "受け手が 200 を返す。 返らなければ配り手が後で送り直す。" }
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
    description: "利用者側が問い合わせを出す。 すぐには返らず、処理側で握られる。"
  - step: "待つ" 1.5s
    focus: [処理側, DB]
    badge: "待つ"
    description: "処理側が更新が来るまで待つ。 その間も接続は開いたまま。"
  - step: "返す" 1.0s
    focus: [処理側, 利用者側]
    badge: "中身"
    description: "新しい中身が来たので返す。 返った直後に次の問い合わせを出す形になる。"
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
    { "step": "要求", "duration": 1, "focus": ["利用者側", "処理側"], "badge": "問い合わせ", "description": "利用者側が問い合わせを出す。 すぐには返らず、処理側で握られる。" },
    { "step": "待つ", "duration": 1.5, "focus": ["処理側", "DB"], "badge": "待つ", "description": "処理側が更新が来るまで待つ。 その間も接続は開いたまま。" },
    { "step": "返す", "duration": 1, "focus": ["処理側", "利用者側"], "badge": "中身", "description": "新しい中身が来たので返す。 返った直後に次の問い合わせを出す形になる。" }
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
    description: "5 分ごとの合図が割り当てへ届く。 呼ぶ人が居なくても動き出す。"
  - step: "実行" 1.5s
    focus: [割り当て, 仕事]
    badge: "実行"
    description: "割り当てが仕事を起動する。 前の回が終わっていないと重なることがある。"
  - step: "結果" 1.0s
    focus: [仕事, 割り当て]
    badge: "正常"
    description: "仕事が結果を返す。 落ちた時に次の合図を待つか即やり直すかは決めておく。"
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
    { "step": "刻む", "duration": 1, "focus": ["定時の合図", "割り当て"], "badge": "刻む", "description": "5 分ごとの合図が割り当てへ届く。 呼ぶ人が居なくても動き出す。" },
    { "step": "実行", "duration": 1.5, "focus": ["割り当て", "仕事"], "badge": "実行", "description": "割り当てが仕事を起動する。 前の回が終わっていないと重なることがある。" },
    { "step": "結果", "duration": 1, "focus": ["仕事", "割り当て"], "badge": "正常", "description": "仕事が結果を返す。 落ちた時に次の合図を待つか即やり直すかは決めておく。" }
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
    description: "管理者が利用者を消す要求を出す。 記録はまだ残っていない。"
  - step: "記録" 1.2s
    focus: [API, 監査の記録]
    badge: "記録"
    description: "誰が何をしたかを監査の記録へ書く。 消した後では辿れないので、消す操作と対で残す。"
  - step: "受け取った" 1.0s
    focus: [API, 管理者]
    badge: "200"
    description: "200 を返す。 記録の書き込みが落ちたら操作自体を通さない。"
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
    { "step": "操作", "duration": 1.2, "focus": ["管理者", "API"], "badge": "削除", "description": "管理者が利用者を消す要求を出す。 記録はまだ残っていない。" },
    { "step": "記録", "duration": 1.2, "focus": ["API", "監査の記録"], "badge": "記録", "description": "誰が何をしたかを監査の記録へ書く。 消した後では辿れないので、消す操作と対で残す。" },
    { "step": "受け取った", "duration": 1, "focus": ["API", "管理者"], "badge": "200", "description": "200 を返す。 記録の書き込みが落ちたら操作自体を通さない。" }
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
    description: "本体がメールを送信待ちへ積む。 配信業者の詰まりが本体へ伝わらない。"
  - step: "送る" 1.2s
    focus: [送信待ち, 配信業者]
    badge: "送る"
    description: "送信待ちが配信業者へ渡す。 落ちた時はここから送り直す。"
  - step: "届ける" 1.0s
    focus: [配信業者, 受信箱]
    badge: "届ける"
    description: "配信業者が受信箱へ届ける。 届いたかどうかは本体からは見えない。"
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
    { "step": "積む", "duration": 1, "focus": ["本体", "送信待ち"], "badge": "積む", "description": "本体がメールを送信待ちへ積む。 配信業者の詰まりが本体へ伝わらない。" },
    { "step": "送る", "duration": 1.2, "focus": ["送信待ち", "配信業者"], "badge": "送る", "description": "送信待ちが配信業者へ渡す。 落ちた時はここから送り直す。" },
    { "step": "届ける", "duration": 1, "focus": ["配信業者", "受信箱"], "badge": "届ける", "description": "配信業者が受信箱へ届ける。 届いたかどうかは本体からは見えない。" }
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
    description: "利用者側が書き出しを頼む。 この時点では中身を 1 行も読んでいない。"
  - step: "流す" 1.5s
    focus: [API, DB]
    badge: "行"
    description: "API が DB から行を少しずつ流す。 全部を記憶に載せないための形。"
  - step: "保管" 1.2s
    focus: [API, 保管庫]
    badge: "PUT"
    description: "組み上げた CSV を保管庫へ置く。 応答に中身を載せない。"
  - step: "返す" 1.0s
    focus: [API, 利用者側]
    badge: "置き場所"
    description: "置き場所だけを返す。 利用者側はそこから好きな時に取り出す。"
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
    { "step": "要求", "duration": 1, "focus": ["利用者側", "API"], "badge": "書き出し", "description": "利用者側が書き出しを頼む。 この時点では中身を 1 行も読んでいない。" },
    { "step": "流す", "duration": 1.5, "focus": ["API", "DB"], "badge": "行", "description": "API が DB から行を少しずつ流す。 全部を記憶に載せないための形。" },
    { "step": "保管", "duration": 1.2, "focus": ["API", "保管庫"], "badge": "PUT", "description": "組み上げた CSV を保管庫へ置く。 応答に中身を載せない。" },
    { "step": "返す", "duration": 1, "focus": ["API", "利用者側"], "badge": "置き場所", "description": "置き場所だけを返す。 利用者側はそこから好きな時に取り出す。" }
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
    description: "利用者が CSV を送る。 まだ 1 行も書き込まない。"
  - step: "検証" 1.5s
    focus: [API, 検証役]
    badge: "検証"
    description: "検証役が行ごとに形を確かめ、正しい行と誤りに分ける。"
  - step: "書き込み" 1.2s
    focus: [API, DB]
    badge: "INSERT"
    description: "正しい行だけを書き込む。 誤りがあっても全部を止めない。"
  - step: "まとめ" 1.0s
    focus: [API, 利用者]
    badge: "報告"
    description: "何件入って何件落ちたかを返す。 落ちた行を直して送り直せる。"
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
    { "step": "送り込み", "duration": 1.2, "focus": ["利用者", "API"], "badge": "送り込み", "description": "利用者が CSV を送る。 まだ 1 行も書き込まない。" },
    { "step": "検証", "duration": 1.5, "focus": ["API", "検証役"], "badge": "検証", "description": "検証役が行ごとに形を確かめ、正しい行と誤りに分ける。" },
    { "step": "書き込み", "duration": 1.2, "focus": ["API", "DB"], "badge": "INSERT", "description": "正しい行だけを書き込む。 誤りがあっても全部を止めない。" },
    { "step": "まとめ", "duration": 1, "focus": ["API", "利用者"], "badge": "報告", "description": "何件入って何件落ちたかを返す。 落ちた行を直して送り直せる。" }
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
    description: "振り分け役が稼働の確認を投げる。 利用者の要求とは別の経路。"
  - step: "受け取った" 1.0s
    focus: [稼働中の本体, 振り分け役]
    badge: "200"
    description: "本体が 200 を返す。 返らない間は振り分けの対象から外れる。"
  - step: "記す" 1.0s
    focus: [振り分け役, 状態の掲示板]
    badge: "正常"
    description: "掲示板に正常と記す。 人が見るのはこの結果。"
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
    { "step": "確かめる", "duration": 1, "focus": ["振り分け役", "稼働中の本体"], "badge": "GET", "description": "振り分け役が稼働の確認を投げる。 利用者の要求とは別の経路。" },
    { "step": "受け取った", "duration": 1, "focus": ["稼働中の本体", "振り分け役"], "badge": "200", "description": "本体が 200 を返す。 返らない間は振り分けの対象から外れる。" },
    {
      "step": "記す",
      "duration": 1,
      "focus": ["振り分け役", "状態の掲示板"],
      "badge": "正常",
      "description": "掲示板に正常と記す。 人が見るのはこの結果。"
    }
  ]
}`;

export const healthCheck = withId("health-check", textDslToDiagram(sourceYaml__healthCheck));

// ─────────────────────────────────────────────────────────────
// F. 契約 (1 例、 #1411)
// ─────────────────────────────────────────────────────────────

/**
 * F-1. ERC-20 の送金 — `order: 種類` の見本。
 *
 * 順序図に並べ替えの軸を書くと、箱を種別の順に置き直す (#2655。 以前はこれを `solidity` と
 * いう別の図種が担っていたが、独自の組み立てを 1 行も持たないので順序図に畳んだ)。
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
 * 見本が並べ替えを実演していることは `lib/order-sample.test.ts` が固定する。
 */
export const sourceYaml__tokenTransferSolidity = `title: "ERC-20 の送金 (種別ごとに縦列が並ぶ)"
type: sequence
order: 種類

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
    description: "利用者が送金を呼ぶ。 種別ごとに縦列が分かれ、外から呼べるのは契約の列だけ。"
  - step: "書き換える" 1.2s
    focus: [トークン契約, 残高表]
    badge: "書き込み"
    description: "契約が残高表を書き換える。 記録が変わるのはこの段だけ。"
  - step: "知らせる" 1.2s
    focus: [トークン契約, Transfer]
    badge: "出来事"
    description: "送金があったことを出来事として出す。 外から追えるようにするためで、残高は動かない。"
  - step: "返す" 1.2s
    focus: [トークン契約, 利用者]
    badge: "戻り値"
    description: "成功を呼び出し元へ返す。 ここまでが 1 つの取引として一度に確定する。"
`;

export const sourceJson__tokenTransferSolidity = `{
  "title": "ERC-20 の送金 (種別ごとに縦列が並ぶ)",
  "type": "sequence",
  "order": "kind",
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
    { "step": "呼ぶ", "duration": 1.2, "focus": ["利用者", "トークン契約"], "badge": "呼び出し", "description": "利用者が送金を呼ぶ。 種別ごとに縦列が分かれ、外から呼べるのは契約の列だけ。" },
    { "step": "書き換える", "duration": 1.2, "focus": ["トークン契約", "残高表"], "badge": "書き込み", "description": "契約が残高表を書き換える。 記録が変わるのはこの段だけ。" },
    { "step": "知らせる", "duration": 1.2, "focus": ["トークン契約", "Transfer"], "badge": "出来事", "description": "送金があったことを出来事として出す。 外から追えるようにするためで、残高は動かない。" },
    { "step": "返す", "duration": 1.2, "focus": ["トークン契約", "利用者"], "badge": "戻り値", "description": "成功を呼び出し元へ返す。 ここまでが 1 つの取引として一度に確定する。" }
  ]
}`;

export const tokenTransferSolidity = withId(
  "erc20-transfer-solidity",
  textDslToDiagram(sourceYaml__tokenTransferSolidity),
);
