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
  - Client
  - Handler: function
  - DB

flow:
  - Client -> Handler: "GET /users/:id"
  - Handler -> DB: "SELECT"
  - DB -> Handler: "row"
  - Handler -> Client: "200 JSON"

animation:
  - step: "request" 1.2s
    focus: [Client, Handler]
    badge: "GET"
  - step: "query" 1.2s
    focus: [Handler, DB]
    badge: "SELECT"
  - step: "respond" 1.2s
    focus: [DB, Handler, Client]
    badge: "200"
`;

export const sourceJson__apiCall = `{
  "title": "REST API GET (Handler → DB SELECT → 200 JSON)",
  "type": "sequence",
  "actors": [
    { "name": "Client" },
    { "name": "Handler", "kind": "function" },
    { "name": "DB" }
  ],
  "flow": [
    { "from": "Client", "to": "Handler", "label": "GET /users/:id" },
    { "from": "Handler", "to": "DB", "label": "SELECT" },
    { "from": "DB", "to": "Handler", "label": "row" },
    { "from": "Handler", "to": "Client", "label": "200 JSON" }
  ],
  "animation": [
    { "step": "request", "duration": 1.2, "focus": ["Client", "Handler"], "badge": "GET" },
    { "step": "query", "duration": 1.2, "focus": ["Handler", "DB"], "badge": "SELECT" },
    { "step": "respond", "duration": 1.2, "focus": ["DB", "Handler", "Client"], "badge": "200" }
  ]
}`;

export const apiCall = withId("api-call", textDslToDiagram(sourceYaml__apiCall));

/** A-2. JWT auth (login → token → access) */
export const sourceYaml__jwtAuth = `title: "JWT auth (login → JWT issue → Bearer で API アクセス)"
type: sequence

actors:
  - User
  - Login
  - API
  - DB

flow:
  - User -> Login: "POST credentials"
  - Login -> DB: "verify"
  - Login -> User: "issue JWT"
  - User -> API: "Bearer token"
  - API -> User: "200 data"

animation:
  - step: "credentials-verify" 1.5s
    focus: [User, Login, DB]
    badge: "verify"
  - step: "issue-token" 1.0s
    focus: [Login, User]
    badge: "JWT"
  - step: "bearer-access" 1.5s
    focus: [User, API]
    badge: "200"
`;

export const sourceJson__jwtAuth = `{
  "title": "JWT auth (login → JWT issue → Bearer で API アクセス)",
  "type": "sequence",
  "actors": [
    { "name": "User" },
    { "name": "Login" },
    { "name": "API" },
    { "name": "DB" }
  ],
  "flow": [
    { "from": "User", "to": "Login", "label": "POST credentials" },
    { "from": "Login", "to": "DB", "label": "verify" },
    { "from": "Login", "to": "User", "label": "issue JWT" },
    { "from": "User", "to": "API", "label": "Bearer token" },
    { "from": "API", "to": "User", "label": "200 data" }
  ],
  "animation": [
    {
      "step": "credentials-verify",
      "duration": 1.5,
      "focus": ["User", "Login", "DB"],
      "badge": "verify"
    },
    { "step": "issue-token", "duration": 1, "focus": ["Login", "User"], "badge": "JWT" },
    { "step": "bearer-access", "duration": 1.5, "focus": ["User", "API"], "badge": "200" }
  ]
}`;

export const jwtAuth = withId("jwt-auth", textDslToDiagram(sourceYaml__jwtAuth));

/** A-3. OAuth 2.0 authorization code flow */
export const sourceYaml__oauthFlow = `title: "OAuth code flow"
type: sequence

actors:
  - User
  - App
  - AuthServer: function
  - API

flow:
  - User -> App: "click login"
  - App -> AuthServer: "redirect"
  - AuthServer -> User: "consent"
  - User -> AuthServer: "allow"
  - AuthServer -> App: "code"
  - App -> AuthServer: "exchange code"
  - AuthServer -> App: "access_token"
  - App -> API: "Bearer access_token"

animation:
  - step: "redirect" 1.2s
    focus: [User, App, AuthServer]
    badge: "redirect"
  - step: "consent" 1.5s
    focus: [AuthServer, User]
    badge: "consent"
  - step: "exchange" 1.2s
    focus: [App, AuthServer]
    badge: "code"
  - step: "access" 1.0s
    focus: [App, API]
    badge: "token"
`;

export const sourceJson__oauthFlow = `{
  "title": "OAuth code flow",
  "type": "sequence",
  "actors": [
    { "name": "User" },
    { "name": "App" },
    { "name": "AuthServer", "kind": "function" },
    { "name": "API" }
  ],
  "flow": [
    { "from": "User", "to": "App", "label": "click login" },
    { "from": "App", "to": "AuthServer", "label": "redirect" },
    { "from": "AuthServer", "to": "User", "label": "consent" },
    { "from": "User", "to": "AuthServer", "label": "allow" },
    { "from": "AuthServer", "to": "App", "label": "code" },
    { "from": "App", "to": "AuthServer", "label": "exchange code" },
    { "from": "AuthServer", "to": "App", "label": "access_token" },
    { "from": "App", "to": "API", "label": "Bearer access_token" }
  ],
  "animation": [
    {
      "step": "redirect",
      "duration": 1.2,
      "focus": ["User", "App", "AuthServer"],
      "badge": "redirect"
    },
    { "step": "consent", "duration": 1.5, "focus": ["AuthServer", "User"], "badge": "consent" },
    { "step": "exchange", "duration": 1.2, "focus": ["App", "AuthServer"], "badge": "code" },
    { "step": "access", "duration": 1, "focus": ["App", "API"], "badge": "token" }
  ]
}`;

export const oauthFlow = withId("oauth-flow", textDslToDiagram(sourceYaml__oauthFlow));

/** A-4. Rate limit (429 + Retry-After) */
export const sourceYaml__rateLimit = `title: "Rate limit"
type: sequence

actors:
  - Client
  - Limiter: function
  - API
  - Bucket: storage

states:
  remaining: 5

flow:
  - Client -> Limiter: "request"
  - Limiter -> Bucket: "decrement"
  - Limiter -> API: "ok"
  - API -> Client: "200"
  - Client -> Limiter: "6th request"
  - Limiter -> Client: "429 Retry-After"

animation:
  - step: "allow" 1.2s
    focus: [Client, Limiter, API]
    tween:
      remaining: 5 -> 4
    badge: "allow"
  - step: "exceed" 1.2s
    focus: [Client, Limiter]
    badge: "429"
`;

export const sourceJson__rateLimit = `{
  "title": "Rate limit",
  "type": "sequence",
  "actors": [
    { "name": "Client" },
    { "name": "Limiter", "kind": "function" },
    { "name": "API" },
    { "name": "Bucket", "kind": "storage" }
  ],
  "flow": [
    { "from": "Client", "to": "Limiter", "label": "request" },
    { "from": "Limiter", "to": "Bucket", "label": "decrement" },
    { "from": "Limiter", "to": "API", "label": "ok" },
    { "from": "API", "to": "Client", "label": "200" },
    { "from": "Client", "to": "Limiter", "label": "6th request" },
    { "from": "Limiter", "to": "Client", "label": "429 Retry-After" }
  ],
  "states": { "remaining": 5 },
  "animation": [
    {
      "step": "allow",
      "duration": 1.2,
      "focus": ["Client", "Limiter", "API"],
      "tween": { "remaining": [5, 4] },
      "badge": "allow"
    },
    { "step": "exceed", "duration": 1.2, "focus": ["Client", "Limiter"], "badge": "429" }
  ]
}`;

export const rateLimit = withId("rate-limit", textDslToDiagram(sourceYaml__rateLimit));

/** A-5. CSRF token roundtrip */
export const sourceYaml__csrfToken = `title: "CSRF token"
type: sequence

actors:
  - Browser
  - Server
  - Session: storage

flow:
  - Browser -> Server: "GET form"
  - Server -> Session: "store token"
  - Server -> Browser: "form + token"
  - Browser -> Server: "POST form + token"
  - Server -> Session: "verify"
  - Server -> Browser: "200"

animation:
  - step: "issue" 1.2s
    focus: [Browser, Server]
    badge: "issue"
  - step: "store" 1.2s
    focus: [Server, Session]
    badge: "store"
  - step: "submit" 1.5s
    focus: [Browser, Server, Session]
    badge: "verify"
`;

export const sourceJson__csrfToken = `{
  "title": "CSRF token",
  "type": "sequence",
  "actors": [
    { "name": "Browser" },
    { "name": "Server" },
    { "name": "Session", "kind": "storage" }
  ],
  "flow": [
    { "from": "Browser", "to": "Server", "label": "GET form" },
    { "from": "Server", "to": "Session", "label": "store token" },
    { "from": "Server", "to": "Browser", "label": "form + token" },
    { "from": "Browser", "to": "Server", "label": "POST form + token" },
    { "from": "Server", "to": "Session", "label": "verify" },
    { "from": "Server", "to": "Browser", "label": "200" }
  ],
  "animation": [
    { "step": "issue", "duration": 1.2, "focus": ["Browser", "Server"], "badge": "issue" },
    { "step": "store", "duration": 1.2, "focus": ["Server", "Session"], "badge": "store" },
    {
      "step": "submit",
      "duration": 1.5,
      "focus": ["Browser", "Server", "Session"],
      "badge": "verify"
    }
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
  - Client
  - Handler: function
  - DB
  - Table: storage

flow:
  - Client -> Handler: "POST json body"
  - Handler -> DB: "INSERT"
  - DB -> Table: "row"
  - Handler -> Client: "201 Created"

animation:
  - step: "post" 1.2s
    focus: [Client, Handler]
    badge: "POST"
  - step: "insert" 1.2s
    focus: [Handler, DB, Table]
    badge: "INSERT"
  - step: "respond" 1.0s
    focus: [Handler, Client]
    badge: "201"
`;

export const sourceJson__crudCreate = `{
  "title": "CRUD create",
  "type": "sequence",
  "actors": [
    { "name": "Client" },
    { "name": "Handler", "kind": "function" },
    { "name": "DB" },
    { "name": "Table", "kind": "storage" }
  ],
  "flow": [
    { "from": "Client", "to": "Handler", "label": "POST json body" },
    { "from": "Handler", "to": "DB", "label": "INSERT" },
    { "from": "DB", "to": "Table", "label": "row" },
    { "from": "Handler", "to": "Client", "label": "201 Created" }
  ],
  "animation": [
    { "step": "post", "duration": 1.2, "focus": ["Client", "Handler"], "badge": "POST" },
    {
      "step": "insert",
      "duration": 1.2,
      "focus": ["Handler", "DB", "Table"],
      "badge": "INSERT"
    },
    { "step": "respond", "duration": 1, "focus": ["Handler", "Client"], "badge": "201" }
  ]
}`;

export const crudCreate = withId("crud-create", textDslToDiagram(sourceYaml__crudCreate));

/** B-2. Pagination (cursor based) */
export const sourceYaml__pagination = `title: "Cursor pagination"
type: sequence

actors:
  - Client
  - API
  - DB

flow:
  - Client -> API: "GET items cursor=null"
  - API -> DB: "LIMIT 20"
  - DB -> API: "20 rows + next_cursor"
  - API -> Client: "page 1 + cursor"
  - Client -> API: "GET items cursor=X"
  - API -> Client: "page 2"

animation:
  - step: "page1" 1.5s
    focus: [Client, API, DB]
    badge: "page 1"
  - step: "page2" 1.2s
    focus: [Client, API]
    badge: "page 2"
`;

export const sourceJson__pagination = `{
  "title": "Cursor pagination",
  "type": "sequence",
  "actors": [
    { "name": "Client" },
    { "name": "API" },
    { "name": "DB" }
  ],
  "flow": [
    { "from": "Client", "to": "API", "label": "GET items cursor=null" },
    { "from": "API", "to": "DB", "label": "LIMIT 20" },
    { "from": "DB", "to": "API", "label": "20 rows + next_cursor" },
    { "from": "API", "to": "Client", "label": "page 1 + cursor" },
    { "from": "Client", "to": "API", "label": "GET items cursor=X" },
    { "from": "API", "to": "Client", "label": "page 2" }
  ],
  "animation": [
    { "step": "page1", "duration": 1.5, "focus": ["Client", "API", "DB"], "badge": "page 1" },
    { "step": "page2", "duration": 1.2, "focus": ["Client", "API"], "badge": "page 2" }
  ]
}`;

export const pagination = withId("pagination", textDslToDiagram(sourceYaml__pagination));

/** B-3. Cache (read-through + TTL) */
export const sourceYaml__cacheReadThrough = `title: "Cache read-through"
type: sequence

actors:
  - Client
  - API
  - Cache: storage
  - DB

flow:
  - Client -> API: "GET key"
  - API -> Cache: "lookup"
  - Cache -> API: "miss"
  - API -> DB: "SELECT"
  - DB -> API: "row"
  - API -> Cache: "set TTL=60s"
  - API -> Client: "200"

animation:
  - step: "miss" 1.5s
    focus: [Client, API, Cache, DB]
    badge: "miss"
  - step: "fill" 1.2s
    focus: [API, Cache]
    badge: "set"
  - step: "respond" 1.0s
    focus: [API, Client]
    badge: "200"
`;

export const sourceJson__cacheReadThrough = `{
  "title": "Cache read-through",
  "type": "sequence",
  "actors": [
    { "name": "Client" },
    { "name": "API" },
    { "name": "Cache", "kind": "storage" },
    { "name": "DB" }
  ],
  "flow": [
    { "from": "Client", "to": "API", "label": "GET key" },
    { "from": "API", "to": "Cache", "label": "lookup" },
    { "from": "Cache", "to": "API", "label": "miss" },
    { "from": "API", "to": "DB", "label": "SELECT" },
    { "from": "DB", "to": "API", "label": "row" },
    { "from": "API", "to": "Cache", "label": "set TTL=60s" },
    { "from": "API", "to": "Client", "label": "200" }
  ],
  "animation": [
    {
      "step": "miss",
      "duration": 1.5,
      "focus": ["Client", "API", "Cache", "DB"],
      "badge": "miss"
    },
    { "step": "fill", "duration": 1.2, "focus": ["API", "Cache"], "badge": "set" },
    { "step": "respond", "duration": 1, "focus": ["API", "Client"], "badge": "200" }
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
  - Client
  - API
  - Index: storage

flow:
  - Client -> API: "GET search q=foo"
  - API -> Index: "tokenize + score"
  - Index -> API: "ranked hits"
  - API -> Client: "results"

animation:
  - step: "query" 1.2s
    focus: [Client, API]
    badge: "q=foo"
  - step: "score" 1.5s
    focus: [API, Index]
    badge: "rank"
  - step: "respond" 1.0s
    focus: [API, Client]
    badge: "hits"
`;

export const sourceJson__searchQuery = `{
  "title": "Search full-text",
  "type": "sequence",
  "actors": [
    { "name": "Client" },
    { "name": "API" },
    { "name": "Index", "kind": "storage" }
  ],
  "flow": [
    { "from": "Client", "to": "API", "label": "GET search q=foo" },
    { "from": "API", "to": "Index", "label": "tokenize + score" },
    { "from": "Index", "to": "API", "label": "ranked hits" },
    { "from": "API", "to": "Client", "label": "results" }
  ],
  "animation": [
    { "step": "query", "duration": 1.2, "focus": ["Client", "API"], "badge": "q=foo" },
    { "step": "score", "duration": 1.5, "focus": ["API", "Index"], "badge": "rank" },
    { "step": "respond", "duration": 1, "focus": ["API", "Client"], "badge": "hits" }
  ]
}`;

export const searchQuery = withId("search-query", textDslToDiagram(sourceYaml__searchQuery));

/** B-5. Sort / Filter combinator */
export const sourceYaml__sortFilter = `title: "Sort + Filter"
type: sequence

actors:
  - Client
  - API
  - DB

flow:
  - Client -> API: "GET status=active sort=-created"
  - API -> DB: "WHERE + ORDER BY DESC"
  - DB -> API: "filtered rows"
  - API -> Client: "200"

animation:
  - step: "request" 1.0s
    focus: [Client, API]
    badge: "filter"
  - step: "query" 1.5s
    focus: [API, DB]
    badge: "ORDER BY"
  - step: "respond" 1.0s
    focus: [API, Client]
    badge: "200"
`;

export const sourceJson__sortFilter = `{
  "title": "Sort + Filter",
  "type": "sequence",
  "actors": [
    { "name": "Client" },
    { "name": "API" },
    { "name": "DB" }
  ],
  "flow": [
    { "from": "Client", "to": "API", "label": "GET status=active sort=-created" },
    { "from": "API", "to": "DB", "label": "WHERE + ORDER BY DESC" },
    { "from": "DB", "to": "API", "label": "filtered rows" },
    { "from": "API", "to": "Client", "label": "200" }
  ],
  "animation": [
    { "step": "request", "duration": 1, "focus": ["Client", "API"], "badge": "filter" },
    { "step": "query", "duration": 1.5, "focus": ["API", "DB"], "badge": "ORDER BY" },
    { "step": "respond", "duration": 1, "focus": ["API", "Client"], "badge": "200" }
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
  - User
  - Form
  - Server

flow:
  - User -> Form: "fill fields"
  - User -> Form: "submit"
  - Form -> Server: "POST form"
  - Server -> Form: "200"
  - Form -> User: "success toast"

animation:
  - step: "fill" 1.0s
    focus: [User, Form]
    badge: "fill"
  - step: "submit" 1.2s
    focus: [Form, Server]
    badge: "POST"
  - step: "ack" 1.0s
    focus: [Form, User]
    badge: "ok"
`;

export const sourceJson__formSubmit = `{
  "title": "Form submit",
  "type": "sequence",
  "actors": [
    { "name": "User" },
    { "name": "Form" },
    { "name": "Server" }
  ],
  "flow": [
    { "from": "User", "to": "Form", "label": "fill fields" },
    { "from": "User", "to": "Form", "label": "submit" },
    { "from": "Form", "to": "Server", "label": "POST form" },
    { "from": "Server", "to": "Form", "label": "200" },
    { "from": "Form", "to": "User", "label": "success toast" }
  ],
  "animation": [
    { "step": "fill", "duration": 1, "focus": ["User", "Form"], "badge": "fill" },
    { "step": "submit", "duration": 1.2, "focus": ["Form", "Server"], "badge": "POST" },
    { "step": "ack", "duration": 1, "focus": ["Form", "User"], "badge": "ok" }
  ]
}`;

export const formSubmit = withId("form-submit", textDslToDiagram(sourceYaml__formSubmit));

/** C-2. File upload (multipart + progress) */
export const sourceYaml__fileUpload = `title: "File upload"
type: sequence

actors:
  - Browser
  - API
  - ObjectStorage: storage

flow:
  - Browser -> API: "POST multipart"
  - API -> ObjectStorage: "PUT object"
  - ObjectStorage -> API: "etag + url"
  - API -> Browser: "201 + url"

animation:
  - step: "upload" 1.5s
    focus: [Browser, API]
    badge: "multipart"
  - step: "store" 1.2s
    focus: [API, ObjectStorage]
    badge: "PUT"
  - step: "respond" 1.0s
    focus: [API, Browser]
    badge: "url"
`;

export const sourceJson__fileUpload = `{
  "title": "File upload",
  "type": "sequence",
  "actors": [
    { "name": "Browser" },
    { "name": "API" },
    { "name": "ObjectStorage", "kind": "storage" }
  ],
  "flow": [
    { "from": "Browser", "to": "API", "label": "POST multipart" },
    { "from": "API", "to": "ObjectStorage", "label": "PUT object" },
    { "from": "ObjectStorage", "to": "API", "label": "etag + url" },
    { "from": "API", "to": "Browser", "label": "201 + url" }
  ],
  "animation": [
    { "step": "upload", "duration": 1.5, "focus": ["Browser", "API"], "badge": "multipart" },
    { "step": "store", "duration": 1.2, "focus": ["API", "ObjectStorage"], "badge": "PUT" },
    { "step": "respond", "duration": 1, "focus": ["API", "Browser"], "badge": "url" }
  ]
}`;

export const fileUpload = withId("file-upload", textDslToDiagram(sourceYaml__fileUpload));

/** C-3. SSE (server-sent events) */
export const sourceYaml__sseStream = `title: "SSE stream"
type: sequence

actors:
  - Browser
  - Server

flow:
  - Browser -> Server: "GET events"
  - Server -> Browser: "event 1"
  - Server -> Browser: "event 2"
  - Server -> Browser: "event 3"

animation:
  - step: "open" 1.0s
    focus: ["Browser -> Server"]
    badge: "open"
  - step: "event1" 0.8s
    focus: ["Server -> Browser"]
    badge: "event 1"
  - step: "event2" 0.8s
    focus: ["Server -> Browser", Browser]
    badge: "event 2"
  - step: "event3" 0.8s
    focus: ["Server -> Browser", Browser, Server]
    badge: "event 3"
`;

export const sourceJson__sseStream = `{
  "title": "SSE stream",
  "type": "sequence",
  "actors": [
    { "name": "Browser" },
    { "name": "Server" }
  ],
  "flow": [
    { "from": "Browser", "to": "Server", "label": "GET events" },
    { "from": "Server", "to": "Browser", "label": "event 1" },
    { "from": "Server", "to": "Browser", "label": "event 2" },
    { "from": "Server", "to": "Browser", "label": "event 3" }
  ],
  "animation": [
    { "step": "open", "duration": 1, "focus": ["Browser -> Server"], "badge": "open" },
    { "step": "event1", "duration": 0.8, "focus": ["Server -> Browser"], "badge": "event 1" },
    {
      "step": "event2",
      "duration": 0.8,
      "focus": ["Server -> Browser", "Browser"],
      "badge": "event 2"
    },
    {
      "step": "event3",
      "duration": 0.8,
      "focus": ["Server -> Browser", "Browser", "Server"],
      "badge": "event 3"
    }
  ]
}`;

export const sseStream = withId("sse-stream", textDslToDiagram(sourceYaml__sseStream));

/** C-4. WebSocket bi-directional */
export const sourceYaml__websocket = `title: "WebSocket"
type: sequence

actors:
  - Client
  - Server

flow:
  - Client -> Server: "ws handshake"
  - Server -> Client: "101 Switching"
  - Client -> Server: "send msg"
  - Server -> Client: "broadcast"

animation:
  - step: "handshake" 1.0s
    focus: ["Client -> Server"]
    badge: "ws"
  - step: "send" 1.0s
    focus: ["Client -> Server", Client]
    badge: "msg"
  - step: "broadcast" 1.0s
    focus: ["Server -> Client", Client, Server]
    badge: "recv"
`;

export const sourceJson__websocket = `{
  "title": "WebSocket",
  "type": "sequence",
  "actors": [
    { "name": "Client" },
    { "name": "Server" }
  ],
  "flow": [
    { "from": "Client", "to": "Server", "label": "ws handshake" },
    { "from": "Server", "to": "Client", "label": "101 Switching" },
    { "from": "Client", "to": "Server", "label": "send msg" },
    { "from": "Server", "to": "Client", "label": "broadcast" }
  ],
  "animation": [
    { "step": "handshake", "duration": 1, "focus": ["Client -> Server"], "badge": "ws" },
    { "step": "send", "duration": 1, "focus": ["Client -> Server", "Client"], "badge": "msg" },
    {
      "step": "broadcast",
      "duration": 1,
      "focus": ["Server -> Client", "Client", "Server"],
      "badge": "recv"
    }
  ]
}`;

export const websocket = withId("websocket", textDslToDiagram(sourceYaml__websocket));

/** C-5. Notification (toast / push) */
export const sourceYaml__notification = `title: "Notification"
type: sequence

actors:
  - App
  - PushService: function
  - Device

flow:
  - App -> PushService: "send payload"
  - PushService -> Device: "deliver"
  - Device -> App: "tap"

animation:
  - step: "send" 1.2s
    focus: [App, PushService]
    badge: "send"
  - step: "deliver" 1.2s
    focus: [PushService, Device]
    badge: "push"
  - step: "tap" 1.0s
    focus: [Device, App]
    badge: "open"
`;

export const sourceJson__notification = `{
  "title": "Notification",
  "type": "sequence",
  "actors": [
    { "name": "App" },
    { "name": "PushService", "kind": "function" },
    { "name": "Device" }
  ],
  "flow": [
    { "from": "App", "to": "PushService", "label": "send payload" },
    { "from": "PushService", "to": "Device", "label": "deliver" },
    { "from": "Device", "to": "App", "label": "tap" }
  ],
  "animation": [
    { "step": "send", "duration": 1.2, "focus": ["App", "PushService"], "badge": "send" },
    { "step": "deliver", "duration": 1.2, "focus": ["PushService", "Device"], "badge": "push" },
    { "step": "tap", "duration": 1, "focus": ["Device", "App"], "badge": "open" }
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
  - Queue
  - Worker

flow:
  - API -> Queue: "enqueue job"
  - Queue -> Worker: "deliver"
  - Worker -> Queue: "ack"

animation:
  - step: "enqueue" 1.2s
    focus: [API, Queue]
    badge: "enqueue"
  - step: "process" 1.5s
    focus: [Queue, Worker]
    badge: "process"
  - step: "ack" 1.0s
    focus: [Worker, Queue]
    badge: "ack"
`;

export const sourceJson__backgroundJob = `{
  "title": "Background job",
  "type": "sequence",
  "actors": [
    { "name": "API" },
    { "name": "Queue" },
    { "name": "Worker" }
  ],
  "flow": [
    { "from": "API", "to": "Queue", "label": "enqueue job" },
    { "from": "Queue", "to": "Worker", "label": "deliver" },
    { "from": "Worker", "to": "Queue", "label": "ack" }
  ],
  "animation": [
    { "step": "enqueue", "duration": 1.2, "focus": ["API", "Queue"], "badge": "enqueue" },
    { "step": "process", "duration": 1.5, "focus": ["Queue", "Worker"], "badge": "process" },
    { "step": "ack", "duration": 1, "focus": ["Worker", "Queue"], "badge": "ack" }
  ]
}`;

export const backgroundJob = withId("background-job", textDslToDiagram(sourceYaml__backgroundJob));

/** D-2. Retry with exponential backoff */
export const sourceYaml__retryBackoff = `title: "Retry + backoff"
type: sequence

actors:
  - Client
  - API

flow:
  - Client -> API: "attempt 1"
  - API -> Client: "500"
  - Client -> API: "attempt 2 wait 1s"
  - API -> Client: "500"
  - Client -> API: "attempt 3 wait 2s"
  - API -> Client: "200"

animation:
  - step: "attempt1" 1.0s
    focus: ["Client -> API"]
    badge: "500"
  - step: "attempt2" 1.2s
    focus: ["Client -> API", Client]
    badge: "wait 1s"
  - step: "attempt3" 1.2s
    focus: ["API -> Client", Client, API]
    badge: "200"
`;

export const sourceJson__retryBackoff = `{
  "title": "Retry + backoff",
  "type": "sequence",
  "actors": [
    { "name": "Client" },
    { "name": "API" }
  ],
  "flow": [
    { "from": "Client", "to": "API", "label": "attempt 1" },
    { "from": "API", "to": "Client", "label": "500" },
    { "from": "Client", "to": "API", "label": "attempt 2 wait 1s" },
    { "from": "API", "to": "Client", "label": "500" },
    { "from": "Client", "to": "API", "label": "attempt 3 wait 2s" },
    { "from": "API", "to": "Client", "label": "200" }
  ],
  "animation": [
    { "step": "attempt1", "duration": 1, "focus": ["Client -> API"], "badge": "500" },
    {
      "step": "attempt2",
      "duration": 1.2,
      "focus": ["Client -> API", "Client"],
      "badge": "wait 1s"
    },
    {
      "step": "attempt3",
      "duration": 1.2,
      "focus": ["API -> Client", "Client", "API"],
      "badge": "200"
    }
  ]
}`;

export const retryBackoff = withId("retry-backoff", textDslToDiagram(sourceYaml__retryBackoff));

/** D-3. Webhook delivery */
export const sourceYaml__webhook = `title: "Webhook"
type: sequence

actors:
  - Source
  - Dispatcher: function
  - Consumer

flow:
  - Source -> Dispatcher: "event"
  - Dispatcher -> Consumer: "POST payload + sig"
  - Consumer -> Dispatcher: "200"

animation:
  - step: "trigger" 1.2s
    focus: [Source, Dispatcher]
    badge: "event"
  - step: "deliver" 1.5s
    focus: [Dispatcher, Consumer]
    badge: "POST"
  - step: "ack" 1.0s
    focus: [Consumer, Dispatcher]
    badge: "200"
`;

export const sourceJson__webhook = `{
  "title": "Webhook",
  "type": "sequence",
  "actors": [
    { "name": "Source" },
    { "name": "Dispatcher", "kind": "function" },
    { "name": "Consumer" }
  ],
  "flow": [
    { "from": "Source", "to": "Dispatcher", "label": "event" },
    { "from": "Dispatcher", "to": "Consumer", "label": "POST payload + sig" },
    { "from": "Consumer", "to": "Dispatcher", "label": "200" }
  ],
  "animation": [
    { "step": "trigger", "duration": 1.2, "focus": ["Source", "Dispatcher"], "badge": "event" },
    { "step": "deliver", "duration": 1.5, "focus": ["Dispatcher", "Consumer"], "badge": "POST" },
    { "step": "ack", "duration": 1, "focus": ["Consumer", "Dispatcher"], "badge": "200" }
  ]
}`;

export const webhook = withId("webhook", textDslToDiagram(sourceYaml__webhook));

/** D-4. Polling vs Long-polling */
export const sourceYaml__polling = `title: "Long polling"
type: sequence

actors:
  - Client
  - Server
  - DB

flow:
  - Client -> Server: "GET poll"
  - Server -> DB: "wait for update"
  - DB -> Server: "new data"
  - Server -> Client: "200 + data"

animation:
  - step: "request" 1.0s
    focus: [Client, Server]
    badge: "poll"
  - step: "wait" 1.5s
    focus: [Server, DB]
    badge: "wait"
  - step: "respond" 1.0s
    focus: [Server, Client]
    badge: "data"
`;

export const sourceJson__polling = `{
  "title": "Long polling",
  "type": "sequence",
  "actors": [
    { "name": "Client" },
    { "name": "Server" },
    { "name": "DB" }
  ],
  "flow": [
    { "from": "Client", "to": "Server", "label": "GET poll" },
    { "from": "Server", "to": "DB", "label": "wait for update" },
    { "from": "DB", "to": "Server", "label": "new data" },
    { "from": "Server", "to": "Client", "label": "200 + data" }
  ],
  "animation": [
    { "step": "request", "duration": 1, "focus": ["Client", "Server"], "badge": "poll" },
    { "step": "wait", "duration": 1.5, "focus": ["Server", "DB"], "badge": "wait" },
    { "step": "respond", "duration": 1, "focus": ["Server", "Client"], "badge": "data" }
  ]
}`;

export const polling = withId("polling", textDslToDiagram(sourceYaml__polling));

/** D-5. Scheduled task (cron) */
export const sourceYaml__scheduledTask = `title: "Scheduled task"
type: sequence

actors:
  - Cron
  - Scheduler
  - Job

flow:
  - Cron -> Scheduler: "tick 5min"
  - Scheduler -> Job: "trigger"
  - Job -> Scheduler: "result"

animation:
  - step: "tick" 1.0s
    focus: [Cron, Scheduler]
    badge: "tick"
  - step: "run" 1.5s
    focus: [Scheduler, Job]
    badge: "run"
  - step: "result" 1.0s
    focus: [Job, Scheduler]
    badge: "ok"
`;

export const sourceJson__scheduledTask = `{
  "title": "Scheduled task",
  "type": "sequence",
  "actors": [
    { "name": "Cron" },
    { "name": "Scheduler" },
    { "name": "Job" }
  ],
  "flow": [
    { "from": "Cron", "to": "Scheduler", "label": "tick 5min" },
    { "from": "Scheduler", "to": "Job", "label": "trigger" },
    { "from": "Job", "to": "Scheduler", "label": "result" }
  ],
  "animation": [
    { "step": "tick", "duration": 1, "focus": ["Cron", "Scheduler"], "badge": "tick" },
    { "step": "run", "duration": 1.5, "focus": ["Scheduler", "Job"], "badge": "run" },
    { "step": "result", "duration": 1, "focus": ["Job", "Scheduler"], "badge": "ok" }
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
  - Admin
  - API
  - AuditStore: storage

flow:
  - Admin -> API: "delete user"
  - API -> AuditStore: "log entry"
  - API -> Admin: "200"

animation:
  - step: "action" 1.2s
    focus: [Admin, API]
    badge: "delete"
  - step: "log" 1.2s
    focus: [API, AuditStore]
    badge: "log"
  - step: "ack" 1.0s
    focus: [API, Admin]
    badge: "200"
`;

export const sourceJson__auditLog = `{
  "title": "Audit log",
  "type": "sequence",
  "actors": [
    { "name": "Admin" },
    { "name": "API" },
    { "name": "AuditStore", "kind": "storage" }
  ],
  "flow": [
    { "from": "Admin", "to": "API", "label": "delete user" },
    { "from": "API", "to": "AuditStore", "label": "log entry" },
    { "from": "API", "to": "Admin", "label": "200" }
  ],
  "animation": [
    { "step": "action", "duration": 1.2, "focus": ["Admin", "API"], "badge": "delete" },
    { "step": "log", "duration": 1.2, "focus": ["API", "AuditStore"], "badge": "log" },
    { "step": "ack", "duration": 1, "focus": ["API", "Admin"], "badge": "200" }
  ]
}`;

export const auditLog = withId("audit-log", textDslToDiagram(sourceYaml__auditLog));

/** E-2. Email notification */
export const sourceYaml__emailNotification = `title: "Email notification"
type: sequence

actors:
  - App
  - MailQueue: storage
  - MailProvider: function
  - Inbox

flow:
  - App -> MailQueue: "enqueue mail"
  - MailQueue -> MailProvider: "send"
  - MailProvider -> Inbox: "deliver"

animation:
  - step: "enqueue" 1.0s
    focus: [App, MailQueue]
    badge: "enqueue"
  - step: "send" 1.2s
    focus: [MailQueue, MailProvider]
    badge: "send"
  - step: "deliver" 1.0s
    focus: [MailProvider, Inbox]
    badge: "deliver"
`;

export const sourceJson__emailNotification = `{
  "title": "Email notification",
  "type": "sequence",
  "actors": [
    { "name": "App" },
    { "name": "MailQueue", "kind": "storage" },
    { "name": "MailProvider", "kind": "function" },
    { "name": "Inbox" }
  ],
  "flow": [
    { "from": "App", "to": "MailQueue", "label": "enqueue mail" },
    { "from": "MailQueue", "to": "MailProvider", "label": "send" },
    { "from": "MailProvider", "to": "Inbox", "label": "deliver" }
  ],
  "animation": [
    { "step": "enqueue", "duration": 1, "focus": ["App", "MailQueue"], "badge": "enqueue" },
    { "step": "send", "duration": 1.2, "focus": ["MailQueue", "MailProvider"], "badge": "send" },
    { "step": "deliver", "duration": 1, "focus": ["MailProvider", "Inbox"], "badge": "deliver" }
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
  - Client
  - API
  - DB
  - ObjectStorage: storage

flow:
  - Client -> API: "POST export"
  - API -> DB: "stream rows"
  - DB -> API: "rows"
  - API -> ObjectStorage: "PUT csv"
  - API -> Client: "200 + url"

animation:
  - step: "request" 1.0s
    focus: [Client, API]
    badge: "export"
  - step: "stream" 1.5s
    focus: [API, DB]
    badge: "rows"
  - step: "store" 1.2s
    focus: [API, ObjectStorage]
    badge: "PUT"
  - step: "respond" 1.0s
    focus: [API, Client]
    badge: "url"
`;

export const sourceJson__exportData = `{
  "title": "Export CSV",
  "type": "sequence",
  "actors": [
    { "name": "Client" },
    { "name": "API" },
    { "name": "DB" },
    { "name": "ObjectStorage", "kind": "storage" }
  ],
  "flow": [
    { "from": "Client", "to": "API", "label": "POST export" },
    { "from": "API", "to": "DB", "label": "stream rows" },
    { "from": "DB", "to": "API", "label": "rows" },
    { "from": "API", "to": "ObjectStorage", "label": "PUT csv" },
    { "from": "API", "to": "Client", "label": "200 + url" }
  ],
  "animation": [
    { "step": "request", "duration": 1, "focus": ["Client", "API"], "badge": "export" },
    { "step": "stream", "duration": 1.5, "focus": ["API", "DB"], "badge": "rows" },
    { "step": "store", "duration": 1.2, "focus": ["API", "ObjectStorage"], "badge": "PUT" },
    { "step": "respond", "duration": 1, "focus": ["API", "Client"], "badge": "url" }
  ]
}`;

export const exportData = withId("export-data", textDslToDiagram(sourceYaml__exportData));

/** E-4. Import (bulk upload + validate) */
export const sourceYaml__importData = `title: "Import CSV"
type: sequence

actors:
  - User
  - API
  - Validator
  - DB

flow:
  - User -> API: "POST csv"
  - API -> Validator: "validate rows"
  - Validator -> API: "ok rows + errors"
  - API -> DB: "INSERT ok rows"
  - API -> User: "summary report"

animation:
  - step: "upload" 1.2s
    focus: [User, API]
    badge: "upload"
  - step: "validate" 1.5s
    focus: [API, Validator]
    badge: "validate"
  - step: "insert" 1.2s
    focus: [API, DB]
    badge: "INSERT"
  - step: "summary" 1.0s
    focus: [API, User]
    badge: "report"
`;

export const sourceJson__importData = `{
  "title": "Import CSV",
  "type": "sequence",
  "actors": [
    { "name": "User" },
    { "name": "API" },
    { "name": "Validator" },
    { "name": "DB" }
  ],
  "flow": [
    { "from": "User", "to": "API", "label": "POST csv" },
    { "from": "API", "to": "Validator", "label": "validate rows" },
    { "from": "Validator", "to": "API", "label": "ok rows + errors" },
    { "from": "API", "to": "DB", "label": "INSERT ok rows" },
    { "from": "API", "to": "User", "label": "summary report" }
  ],
  "animation": [
    { "step": "upload", "duration": 1.2, "focus": ["User", "API"], "badge": "upload" },
    { "step": "validate", "duration": 1.5, "focus": ["API", "Validator"], "badge": "validate" },
    { "step": "insert", "duration": 1.2, "focus": ["API", "DB"], "badge": "INSERT" },
    { "step": "summary", "duration": 1, "focus": ["API", "User"], "badge": "report" }
  ]
}`;

export const importData = withId("import-data", textDslToDiagram(sourceYaml__importData));

/** E-5. Health check / heartbeat */
export const sourceYaml__healthCheck = `title: "Health check"
type: sequence

actors:
  - LoadBalancer: function
  - AppInstance: function
  - StatusBoard: storage

flow:
  - LoadBalancer -> AppInstance: "GET health"
  - AppInstance -> LoadBalancer: "200 ok"
  - LoadBalancer -> StatusBoard: "mark healthy"

animation:
  - step: "probe" 1.0s
    focus: [LoadBalancer, AppInstance]
    badge: "GET"
  - step: "ack" 1.0s
    focus: [AppInstance, LoadBalancer]
    badge: "200"
  - step: "record" 1.0s
    focus: [LoadBalancer, StatusBoard]
    badge: "healthy"
`;

export const sourceJson__healthCheck = `{
  "title": "Health check",
  "type": "sequence",
  "actors": [
    { "name": "LoadBalancer", "kind": "function" },
    { "name": "AppInstance", "kind": "function" },
    { "name": "StatusBoard", "kind": "storage" }
  ],
  "flow": [
    { "from": "LoadBalancer", "to": "AppInstance", "label": "GET health" },
    { "from": "AppInstance", "to": "LoadBalancer", "label": "200 ok" },
    { "from": "LoadBalancer", "to": "StatusBoard", "label": "mark healthy" }
  ],
  "animation": [
    { "step": "probe", "duration": 1, "focus": ["LoadBalancer", "AppInstance"], "badge": "GET" },
    { "step": "ack", "duration": 1, "focus": ["AppInstance", "LoadBalancer"], "badge": "200" },
    {
      "step": "record",
      "duration": 1,
      "focus": ["LoadBalancer", "StatusBoard"],
      "badge": "healthy"
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
 */
export const sourceYaml__tokenTransferSolidity = `title: "ERC-20 の送金 (種別ごとに縦列が並ぶ)"
type: solidity

actors:
  - Transfer: { kind: event }
  - Balances: { kind: storage }
  - Token: { kind: contract }
  - User: { kind: eoa }

flow:
  - User -> Token: "transfer(Bob, 100)"
  - Token -> Balances: "残高を書き換える"
  - Token -> Transfer: "Transfer を出す"
  - Token -> User: "true" (success)

animation:
  - step: "呼ぶ" 1.2s
    focus: [User, Token]
    badge: "call"
  - step: "書き換える" 1.2s
    focus: [Token, Balances]
    badge: "write"
  - step: "知らせる" 1.2s
    focus: [Token, Transfer]
    badge: "event"
  - step: "返す" 1.2s
    focus: [Token, User]
    badge: "return"
`;

export const sourceJson__tokenTransferSolidity = `{
  "title": "ERC-20 の送金 (種別ごとに縦列が並ぶ)",
  "type": "solidity",
  "actors": [
    { "name": "Transfer", "kind": "event" },
    { "name": "Balances", "kind": "storage" },
    { "name": "Token", "kind": "contract" },
    { "name": "User", "kind": "eoa" }
  ],
  "flow": [
    { "from": "User", "to": "Token", "label": "transfer(Bob, 100)" },
    { "from": "Token", "to": "Balances", "label": "残高を書き換える" },
    { "from": "Token", "to": "Transfer", "label": "Transfer を出す" },
    { "from": "Token", "to": "User", "label": "true", "tone": "success" }
  ],
  "animation": [
    { "step": "呼ぶ", "duration": 1.2, "focus": ["User", "Token"], "badge": "call" },
    { "step": "書き換える", "duration": 1.2, "focus": ["Token", "Balances"], "badge": "write" },
    { "step": "知らせる", "duration": 1.2, "focus": ["Token", "Transfer"], "badge": "event" },
    { "step": "返す", "duration": 1.2, "focus": ["Token", "User"], "badge": "return" }
  ]
}`;

export const tokenTransferSolidity = withId(
  "erc20-transfer-solidity",
  textDslToDiagram(sourceYaml__tokenTransferSolidity),
);
