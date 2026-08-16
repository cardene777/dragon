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
 */

function withId(slug: string, diagram: CdlDiagram): CdlDiagram {
  return { ...diagram, id: slug };
}

// ─────────────────────────────────────────────────────────────
// A. API / Auth (5 例)
// ─────────────────────────────────────────────────────────────

/** A-1. REST API call (basic GET) */
export const apiCall = withId(
  "api-call",
  textDslToDiagram(`
title: "REST API GET (Handler → DB SELECT → 200 JSON)"
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
`),
);

/** A-2. JWT auth (login → token → access) */
export const jwtAuth = withId(
  "jwt-auth",
  textDslToDiagram(`
title: "JWT auth (login → JWT issue → Bearer で API アクセス)"
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
`),
);

/** A-3. OAuth 2.0 authorization code flow */
export const oauthFlow = withId(
  "oauth-flow",
  textDslToDiagram(`
title: "OAuth code flow"
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
`),
);

/** A-4. Rate limit (429 + Retry-After) */
export const rateLimit = withId(
  "rate-limit",
  textDslToDiagram(`
title: "Rate limit"
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
`),
);

/** A-5. CSRF token roundtrip */
export const csrfToken = withId(
  "csrf-token",
  textDslToDiagram(`
title: "CSRF token"
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
`),
);

// ─────────────────────────────────────────────────────────────
// B. データ操作 (5 例)
// ─────────────────────────────────────────────────────────────

/** B-1. CRUD create */
export const crudCreate = withId(
  "crud-create",
  textDslToDiagram(`
title: "CRUD create"
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
`),
);

/** B-2. Pagination (cursor based) */
export const pagination = withId(
  "pagination",
  textDslToDiagram(`
title: "Cursor pagination"
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
`),
);

/** B-3. Cache (read-through + TTL) */
export const cacheReadThrough = withId(
  "cache-read",
  textDslToDiagram(`
title: "Cache read-through"
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
`),
);

/** B-4. Search (full-text query) */
export const searchQuery = withId(
  "search-query",
  textDslToDiagram(`
title: "Search full-text"
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
`),
);

/** B-5. Sort / Filter combinator */
export const sortFilter = withId(
  "sort-filter",
  textDslToDiagram(`
title: "Sort + Filter"
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
`),
);

// ─────────────────────────────────────────────────────────────
// C. UI / フォーム (5 例)
// ─────────────────────────────────────────────────────────────

/** C-1. Form submit (POST + validate) */
export const formSubmit = withId(
  "form-submit",
  textDslToDiagram(`
title: "Form submit"
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
`),
);

/** C-2. File upload (multipart + progress) */
export const fileUpload = withId(
  "file-upload",
  textDslToDiagram(`
title: "File upload"
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
`),
);

/** C-3. SSE (server-sent events) */
export const sseStream = withId(
  "sse-stream",
  textDslToDiagram(`
title: "SSE stream"
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
`),
);

/** C-4. WebSocket bi-directional */
export const websocket = withId(
  "websocket",
  textDslToDiagram(`
title: "WebSocket"
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
`),
);

/** C-5. Notification (toast / push) */
export const notification = withId(
  "notification",
  textDslToDiagram(`
title: "Notification"
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
`),
);

// ─────────────────────────────────────────────────────────────
// D. 非同期 / バックグラウンド (5 例)
// ─────────────────────────────────────────────────────────────

/** D-1. Background job (enqueue + worker) */
export const backgroundJob = withId(
  "background-job",
  textDslToDiagram(`
title: "Background job"
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
`),
);

/** D-2. Retry with exponential backoff */
export const retryBackoff = withId(
  "retry-backoff",
  textDslToDiagram(`
title: "Retry + backoff"
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
`),
);

/** D-3. Webhook delivery */
export const webhook = withId(
  "webhook",
  textDslToDiagram(`
title: "Webhook"
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
`),
);

/** D-4. Polling vs Long-polling */
export const polling = withId(
  "polling",
  textDslToDiagram(`
title: "Long polling"
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
`),
);

/** D-5. Scheduled task (cron) */
export const scheduledTask = withId(
  "scheduled-task",
  textDslToDiagram(`
title: "Scheduled task"
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
`),
);

// ─────────────────────────────────────────────────────────────
// E. 運用 / 配信 (5 例)
// ─────────────────────────────────────────────────────────────

/** E-1. Audit log */
export const auditLog = withId(
  "audit-log",
  textDslToDiagram(`
title: "Audit log"
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
`),
);

/** E-2. Email notification */
export const emailNotification = withId(
  "email-notification",
  textDslToDiagram(`
title: "Email notification"
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
`),
);

/** E-3. Export (CSV / JSON download) */
export const exportData = withId(
  "export-data",
  textDslToDiagram(`
title: "Export CSV"
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
`),
);

/** E-4. Import (bulk upload + validate) */
export const importData = withId(
  "import-data",
  textDslToDiagram(`
title: "Import CSV"
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
`),
);

/** E-5. Health check / heartbeat */
export const healthCheck = withId(
  "health-check",
  textDslToDiagram(`
title: "Health check"
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
`),
);
