import { diagram } from "@cardenelabs/cdl";
import type { PhaseBuilder } from "@cardenelabs/cdl";

/**
 * Catalog - Patterns ... 一般 web 開発で頻出する 12 構成 pattern。
 *
 * 全 pattern で lane width / gap を統一 (single 1700px / triple 1700px / quad 1700px)、
 * catalog 1 column max-w 1700px 内で SVG 縮小率 ~100% を維持、 全 card サイズ揃え。
 * 例外は Hook callback で、 横 1 列だと縦横比 6:1 を超えて潰れるため 2 列 2 段に折り返す。
 *
 * lane gap = 240px (label pill 最大幅 ~200px + node 端 margin 40px) で edge label が
 * adjacent node に侵食しない設計。
 *
 * ## 記法を併記する (#1371)
 *
 * 各図の手前に `sourceYaml__<key>` と `sourceJson__<key>` を置く。 一覧はこの名前で拾い
 * (`lib/catalog-items.ts`)、あると画面に「コード」 のタブが出て「エディタで開く」 が押せる。
 *
 * **図は組み立て API のまま残す**。 記法から組み立て直すと図の id が題から導かれ、
 * `pattern-direct` が `pattern-direct-隣接-node-直結` に変わる。 id は一覧と検索に出る。
 *
 * 併記は写し違いが起きるため、**同じ図になることを検査で固定する**
 * (`lib/catalog-source-parity.test.tsx`)。 記法を直して図がずれたらそこで落ちる。
 *
 * ## 記法で表せない 2 つ
 *
 * | 対象 | 表せないもの | どうしたか |
 * |---|---|---|
 * | `patternCallReadWrite` | 同じ 2 者を結ぶ 2 本目の矢印を段ごとに光らせ分けること | 両方光る形で書き、検査に宣言を置く |
 * | 全 12 件 | 図の id | 組み立て API 側を残すことで変えない |
 *
 * 1 つ目は `focus:` が `A -> B` の形しか受けないため (`focus.ts`)。 read と write は
 * どちらも `decrement(...) -> counter table` なので、書き分ける手段が無い。
 *
 * ## 箱の名前に空白が入る時は `focus:` を引用符で囲む
 *
 * `focus: [counter table]` は **黙って落ちない代わりに 2 つの名前として読まれる**
 * (`counter` と `table`)。 どちらも実在しないので `focus-target-missing` の注意が出る。
 * 一覧はこの注意を受け取らないため画面には出ず、**光らせ忘れだけが残る**。
 *
 * 本 file の記法は全件を引用符付きで書き、注意が 0 件であることを検査で固定する。
 */

// 3 lane 統一構成 (left 280 / center 380 / right 280、 gap 240px × 2 = 1700px total)
const L3_X1 = 0;
const L3_X2 = 520;
const L3_X3 = 1140;
const L3_W_LR = 280;
const L3_W_C = 380;
// 2 lane 統一構成
const L2_X1 = 0;
const L2_X2 = 600;
const L2_W = 280;

export const sourceYaml__patternDirect = `title: "pattern: Direct (隣接 node 直結)"
type: flow

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 600, width: 280 }

actors:
  - Client: { kind: actor, lane: l1 }
  - Service: { kind: function, lane: l2 }

flow:
  - Client -> Service: "request" (accent, dotted-flow) { sub: "node 端 stop" }

animation:
  - step: "送り手" 1.2s
    focus: ["Client"]
    badge: "direct"
  - step: "受け手まで" 1.2s
    focus: ["Client", "Service"]
    badge: "direct"
  - step: "直結" 2.4s
    focus: ["Client", "Service", "Client -> Service"]
    badge: "direct"
    description: "粒子が Client 端 → Service 端で stop、 node 内には入らない。"
`;

export const sourceJson__patternDirect = `{
  "title": "pattern: Direct (隣接 node 直結)",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 280 },
    "l2": { "x": 600, "width": 280 }
  },
  "actors": [
    { "name": "Client", "kind": "actor", "lane": "l1" },
    { "name": "Service", "kind": "function", "lane": "l2" }
  ],
  "flow": [
    {
      "from": "Client",
      "to": "Service",
      "label": "request",
      "sub": "node 端 stop",
      "tone": "accent",
      "style": "dotted-flow"
    }
  ],
  "animation": [
    { "step": "送り手", "duration": 1.2, "focus": ["Client"], "badge": "direct" },
    { "step": "受け手まで", "duration": 1.2, "focus": ["Client", "Service"], "badge": "direct" },
    {
      "step": "直結",
      "duration": 2.4,
      "focus": ["Client", "Service", "Client -> Service"],
      "body": "粒子が Client 端 → Service 端で stop、 node 内には入らない。",
      "badge": "direct"
    }
  ]
}`;

/** 1. 直結 dotted-flow (隣接 node 間) */
export const patternDirect = diagram("pattern-direct", { topic: "pattern: Direct (隣接 node 直結)" })
  .lane("l1", { x: L2_X1, width: L2_W })
  .lane("l2", { x: L2_X2, width: L2_W })
  .node("a", { lane: "l1", stack: 0, kind: "actor", title: "Client" })
  .node("b", { lane: "l2", stack: 0, kind: "function", title: "Service" })
  .edge("a", "b", { id: "e", label: "request", sub: "node 端 stop", tone: "accent", style: "dotted-flow" })
  .phase("p1", { duration: 1200, title: "送り手", body: "" }, (p: PhaseBuilder) => p.activate("a").badge("direct"))
  .phase("p2", { duration: 1200, title: "受け手まで", body: "" }, (p: PhaseBuilder) => p.activate("a", "b").badge("direct"))
  .phase("p3", { duration: 2400, title: "直結", body: "粒子が Client 端 → Service 端で stop、 node 内には入らない。" }, (p: PhaseBuilder) => p.activate("a", "b", "e").badge("direct"))
  .build();

export const sourceYaml__patternPassthrough = `title: "pattern: Passthrough (中継 node 貫通)"
type: flow

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 520, width: 380, contain: true }
  l3: { x: 1140, width: 280 }

actors:
  - Client: { kind: actor, lane: l1 }
  - API Gateway: { kind: function, lane: l2, subtitle: "Client → Service を relay (proxy pattern)" }
  - Service: { kind: function, lane: l3 }

flow:
  - Client -> Service: "Client → Service" (accent, dotted-flow) { sub: "Gateway 経由" }

animation:
  - step: "送り手" 1.2s
    focus: ["Client"]
    badge: "through"
  - step: "中継まで" 1.2s
    focus: ["Client", "API Gateway"]
    badge: "through"
  - step: "貫通" 2.8s
    focus: ["Client", "API Gateway", "Service", "Client -> Service"]
    badge: "through"
    description: "edge path が Gateway の上を通るため、 cdl が auto 判定で粒子を Gateway 中央まで動かす。"
`;

export const sourceJson__patternPassthrough = `{
  "title": "pattern: Passthrough (中継 node 貫通)",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 280 },
    "l2": { "x": 520, "width": 380, "contain": true },
    "l3": { "x": 1140, "width": 280 }
  },
  "actors": [
    { "name": "Client", "kind": "actor", "lane": "l1" },
    {
      "name": "API Gateway",
      "kind": "function",
      "lane": "l2",
      "subtitle": "Client → Service を relay (proxy pattern)"
    },
    { "name": "Service", "kind": "function", "lane": "l3" }
  ],
  "flow": [
    {
      "from": "Client",
      "to": "Service",
      "label": "Client → Service",
      "sub": "Gateway 経由",
      "tone": "accent",
      "style": "dotted-flow"
    }
  ],
  "animation": [
    { "step": "送り手", "duration": 1.2, "focus": ["Client"], "badge": "through" },
    { "step": "中継まで", "duration": 1.2, "focus": ["Client", "API Gateway"], "badge": "through" },
    {
      "step": "貫通",
      "duration": 2.8,
      "focus": ["Client", "API Gateway", "Service", "Client -> Service"],
      "body": "edge path が Gateway の上を通るため、 cdl が auto 判定で粒子を Gateway 中央まで動かす。",
      "badge": "through"
    }
  ]
}`;

/** 2. 経由 node 貫通 (Passthrough) */
export const patternPassthrough = diagram("pattern-passthrough", { topic: "pattern: Passthrough (中継 node 貫通)" })
  .lane("l1", { x: L3_X1, width: L3_W_LR })
  .lane("l2", { x: L3_X2, width: L3_W_C, contain: true })
  .lane("l3", { x: L3_X3, width: L3_W_LR })
  .node("a", { lane: "l1", stack: 0, kind: "actor", title: "Client" })
  .node("router", { lane: "l2", stack: 0, kind: "function", title: "API Gateway", subtitle: "Client → Service を relay (proxy pattern)" })
  .node("c", { lane: "l3", stack: 0, kind: "function", title: "Service" })
  .edge("a", "c", { id: "e", label: "Client → Service", sub: "Gateway 経由", tone: "accent", style: "dotted-flow" })
  .phase("p1", { duration: 1200, title: "送り手", body: "" }, (p: PhaseBuilder) => p.activate("a").badge("through"))
  .phase("p2", { duration: 1200, title: "中継まで", body: "" }, (p: PhaseBuilder) => p.activate("a", "router").badge("through"))
  .phase("p3", { duration: 2800, title: "貫通", body: "edge path が Gateway の上を通るため、 cdl が auto 判定で粒子を Gateway 中央まで動かす。" }, (p: PhaseBuilder) => p.activate("a", "router", "c", "e").badge("through"))
  .build();

export const sourceYaml__patternCallReadWrite = `title: "pattern: Call → Read → Write"
type: flow

lanes:
  client: { x: 0, width: 280 }
  service: { x: 600, width: 480, contain: true }

states:
  count: 100

actors:
  - User: { kind: actor, lane: client, value: "{count}" }
  - decrement(...): { kind: function, lane: service }
  - counter table: { kind: storage, lane: service, stack: 1, rows: ["User: {count}"] }

flow:
  - User -> decrement(...): "call" (accent, dotted-flow)
  - decrement(...) -> counter table: "read" (teal, dotted-flow)
  - decrement(...) -> counter table: "write" (accent, dotted-flow)

animation:
  - step: "call" 1.8s
    focus: ["User", "decrement(...)", "User -> decrement(...)"]
    badge: "call"
    description: "外部から関数呼び出し。"
  - step: "read" 1.8s
    focus: ["decrement(...)", "counter table", "decrement(...) -> counter table"]
    badge: "read"
    description: "storage から現在値を読む。"
  - step: "write" 1.8s
    focus: ["decrement(...)", "counter table", "decrement(...) -> counter table"]
    tween:
      count: 100 -> 90
    badge: "write"
    description: "storage を更新。"
`;

export const sourceJson__patternCallReadWrite = `{
  "title": "pattern: Call → Read → Write",
  "type": "flow",
  "lanes": {
    "client": { "x": 0, "width": 280 },
    "service": { "x": 600, "width": 480, "contain": true }
  },
  "actors": [
    { "name": "User", "kind": "actor", "lane": "client", "value": "{count}" },
    { "name": "decrement(...)", "kind": "function", "lane": "service" },
    {
      "name": "counter table",
      "kind": "storage",
      "lane": "service",
      "stack": 1,
      "rows": ["User: {count}"]
    }
  ],
  "flow": [
    {
      "from": "User",
      "to": "decrement(...)",
      "label": "call",
      "tone": "accent",
      "style": "dotted-flow"
    },
    {
      "from": "decrement(...)",
      "to": "counter table",
      "label": "read",
      "tone": "teal",
      "style": "dotted-flow"
    },
    {
      "from": "decrement(...)",
      "to": "counter table",
      "label": "write",
      "tone": "accent",
      "style": "dotted-flow"
    }
  ],
  "states": { "count": 100 },
  "animation": [
    {
      "step": "call",
      "duration": 1.8,
      "focus": ["User", "decrement(...)", "User -> decrement(...)"],
      "body": "外部から関数呼び出し。",
      "badge": "call"
    },
    {
      "step": "read",
      "duration": 1.8,
      "focus": ["decrement(...)", "counter table", "decrement(...) -> counter table"],
      "body": "storage から現在値を読む。",
      "badge": "read"
    },
    {
      "step": "write",
      "duration": 1.8,
      "focus": ["decrement(...)", "counter table", "decrement(...) -> counter table"],
      "body": "storage を更新。",
      "tween": { "count": [100, 90] },
      "badge": "write"
    }
  ]
}`;

/** 3. call → read → write (関数内部処理) */
export const patternCallReadWrite = diagram("pattern-call-rw", { topic: "pattern: Call → Read → Write" })
  .lane("client", { x: L2_X1, width: L2_W })
  .lane("service", { x: L2_X2, width: 480, contain: true })
  .state("count", { initial: 100 })
  .node("user", { lane: "client", stack: 0, kind: "actor", title: "User", value: "{count}" })
  .node("fn", { lane: "service", stack: 0, kind: "function", title: "decrement(...)" })
  .node("storage", { lane: "service", stack: 1, kind: "storage", title: "counter table", rows: ["User: {count}"] })
  .edge("user", "fn", { id: "call", label: "call", tone: "accent", style: "dotted-flow" })
  .edge("fn", "storage", { id: "read", label: "read", tone: "teal", style: "dotted-flow" })
  .edge("fn", "storage", { id: "write", label: "write", tone: "accent", style: "dotted-flow" })
  .phase("call", { duration: 1800, title: "call", body: "外部から関数呼び出し。" }, (p: PhaseBuilder) => p.activate("user", "fn", "call").badge("call"))
  .phase("read", { duration: 1800, title: "read", body: "storage から現在値を読む。" }, (p: PhaseBuilder) => p.activate("fn", "storage", "read").badge("read"))
  .phase("write", { duration: 1800, title: "write", body: "storage を更新。" }, (p: PhaseBuilder) => p.activate("fn", "storage", "write").tween("count", 100, 90).badge("write"))
  .build();

export const sourceYaml__patternEmit = `title: "pattern: Emit Event (外部通知)"
type: flow

lanes:
  c: { x: 0, width: 280 }
  o: { x: 600, width: 280 }

actors:
  - processOrder(...): { kind: function, lane: c, posW: 426 }
  - OrderCreated: { kind: event, lane: o, subtitle: "(orderId, userId, total)" }

flow:
  - processOrder(...) -> OrderCreated: "emit" (success, dotted-flow)

animation:
  - step: "関数" 1.2s
    focus: ["processOrder(...)"]
    badge: "emit"
  - step: "受け皿まで" 1.2s
    focus: ["processOrder(...)", "OrderCreated"]
    badge: "emit"
  - step: "emit" 2.4s
    focus: ["processOrder(...)", "OrderCreated", "processOrder(...) -> OrderCreated"]
    badge: "emit"
    description: "関数内で emit したイベントが event bus / log に書き込まれる。"
`;

export const sourceJson__patternEmit = `{
  "title": "pattern: Emit Event (外部通知)",
  "type": "flow",
  "lanes": {
    "c": { "x": 0, "width": 280 },
    "o": { "x": 600, "width": 280 }
  },
  "actors": [
    { "name": "processOrder(...)", "kind": "function", "lane": "c", "posW": 426 },
    {
      "name": "OrderCreated",
      "kind": "event",
      "lane": "o",
      "subtitle": "(orderId, userId, total)"
    }
  ],
  "flow": [
    {
      "from": "processOrder(...)",
      "to": "OrderCreated",
      "label": "emit",
      "tone": "success",
      "style": "dotted-flow"
    }
  ],
  "animation": [
    { "step": "関数", "duration": 1.2, "focus": ["processOrder(...)"], "badge": "emit" },
    {
      "step": "受け皿まで",
      "duration": 1.2,
      "focus": ["processOrder(...)", "OrderCreated"],
      "badge": "emit"
    },
    {
      "step": "emit",
      "duration": 2.4,
      "focus": ["processOrder(...)", "OrderCreated", "processOrder(...) -> OrderCreated"],
      "body": "関数内で emit したイベントが event bus / log に書き込まれる。",
      "badge": "emit"
    }
  ]
}`;

/** 4. emit event (外部通知) */
export const patternEmit = diagram("pattern-emit", { topic: "pattern: Emit Event (外部通知)" })
  .lane("c", { x: L2_X1, width: L2_W })
  .lane("o", { x: L2_X2, width: L2_W })
  .node("fn", { lane: "c", stack: 0, kind: "function", title: "processOrder(...)", w: 426 })
  .node("ev", { lane: "o", stack: 0, kind: "event", title: "OrderCreated", subtitle: "(orderId, userId, total)" })
  .edge("fn", "ev", { id: "emit", label: "emit", tone: "success", style: "dotted-flow" })
  .phase("p1", { duration: 1200, title: "関数", body: "" }, (p: PhaseBuilder) => p.activate("fn").badge("emit"))
  .phase("p2", { duration: 1200, title: "受け皿まで", body: "" }, (p: PhaseBuilder) => p.activate("fn", "ev").badge("emit"))
  .phase("p3", { duration: 2400, title: "emit", body: "関数内で emit したイベントが event bus / log に書き込まれる。" }, (p: PhaseBuilder) => p.activate("fn", "ev", "emit").badge("emit"))
  .build();

export const sourceYaml__patternHook = `title: "pattern: Hook callback"
type: flow

lanes:
  col1: { x: 0, width: 430 }
  col2: { x: 470, width: 430 }

actors:
  - Sender: { kind: actor, lane: col1 }
  - deliver: { kind: function, lane: col2, subtitle: "送付前 hook" }
  - onReceive: { kind: function, lane: col1, stack: 1, subtitle: "受信側で実装" }

flow:
  - Sender -> deliver: "call" (accent, dotted-flow)
  - deliver -> onReceive: "hook callback" (teal, dotted-flow) { sub: "受信可否確認" }

animation:
  - step: "call" 1.8s
    focus: ["Sender", "deliver", "Sender -> deliver"]
    badge: "call"
    description: "送信側が deliver を呼ぶ。"
  - step: "hook callback" 1.8s
    focus: ["deliver", "onReceive", "deliver -> onReceive"]
    badge: "hook"
    description: "Service が受信側の onReceive hook を呼んで「受け取れますか」 と確認。"
`;

export const sourceJson__patternHook = `{
  "title": "pattern: Hook callback",
  "type": "flow",
  "lanes": {
    "col1": { "x": 0, "width": 430 },
    "col2": { "x": 470, "width": 430 }
  },
  "actors": [
    { "name": "Sender", "kind": "actor", "lane": "col1" },
    { "name": "deliver", "kind": "function", "lane": "col2", "subtitle": "送付前 hook" },
    {
      "name": "onReceive",
      "kind": "function",
      "lane": "col1",
      "stack": 1,
      "subtitle": "受信側で実装"
    }
  ],
  "flow": [
    {
      "from": "Sender",
      "to": "deliver",
      "label": "call",
      "tone": "accent",
      "style": "dotted-flow"
    },
    {
      "from": "deliver",
      "to": "onReceive",
      "label": "hook callback",
      "sub": "受信可否確認",
      "tone": "teal",
      "style": "dotted-flow"
    }
  ],
  "animation": [
    {
      "step": "call",
      "duration": 1.8,
      "focus": ["Sender", "deliver", "Sender -> deliver"],
      "body": "送信側が deliver を呼ぶ。",
      "badge": "call"
    },
    {
      "step": "hook callback",
      "duration": 1.8,
      "focus": ["deliver", "onReceive", "deliver -> onReceive"],
      "body": "Service が受信側の onReceive hook を呼んで「受け取れますか」 と確認。",
      "badge": "hook"
    }
  ]
}`;

/** 5. Hook callback ... 受信側 hook で「受け取れますか」 確認 */
// 3 節を横 1 列に置くと幅 2099 world / 縦横比 6.3 になり、 親幅に収めた時に帯状に潰れて
// label が読めなかった。 2 列 2 段に折り返して縦横比 2.2 に収める。
// col1 = 送信側と受信側 hook を縦に重ね、 col2 = 中継する deliver を置く。 帯 id は内容ではなく
// 位置を表す (段をまたぐと 1 つの帯に別の役割の節が入るため、 意味を名前にすると嘘になる)。
export const patternHook = diagram("pattern-hook", { topic: "pattern: Hook callback" })
  .lane("col1", { x: 0, width: 430 })
  .lane("col2", { x: 470, width: 430 })
  .node("from", { lane: "col1", stack: 0, kind: "actor", title: "Sender" })
  .node("fn", { lane: "col2", stack: 0, kind: "function", title: "deliver", subtitle: "送付前 hook" })
  .node("hook", { lane: "col1", stack: 1, kind: "function", title: "onReceive", subtitle: "受信側で実装" })
  .edge("from", "fn", { id: "call", label: "call", tone: "accent", style: "dotted-flow" })
  .edge("fn", "hook", { id: "hook-callback", label: "hook callback", sub: "受信可否確認", tone: "teal", style: "dotted-flow" })
  .phase("call", { duration: 1800, title: "call", body: "送信側が deliver を呼ぶ。" }, (p: PhaseBuilder) => p.activate("from", "fn", "call").badge("call"))
  .phase("hook", { duration: 1800, title: "hook callback", body: "Service が受信側の onReceive hook を呼んで「受け取れますか」 と確認。" }, (p: PhaseBuilder) => p.activate("fn", "hook", "hook-callback").badge("hook"))
  .build();

export const sourceYaml__patternBranch = `title: "pattern: Branch (条件分岐)"
type: flow

lanes:
  u: { x: 0, width: 280 }
  d: { x: 520, width: 380, contain: true }
  r: { x: 1140, width: 280 }

actors:
  - Input: { kind: actor, lane: u }
  - if (valid?): { kind: function, lane: d, subtitle: "分岐 node" }
  - process(): { kind: function, lane: r }
  - ValidationError: { kind: event, lane: r, stack: 1, posW: 382 }

flow:
  - Input -> if (valid?): "evaluate" (accent, dotted-flow)
  - if (valid?) -> process(): "true" (success, dotted-flow)
  - if (valid?) -> ValidationError: "false" (error, dotted-flow)

animation:
  - step: "evaluate" 1.8s
    focus: ["Input", "if (valid?)", "Input -> if (valid?)"]
    badge: "evaluate"
    description: "input を条件 node に渡す。"
  - step: "true 経路" 1.8s
    focus: ["if (valid?)", "process()", "if (valid?) -> process()"]
    badge: "true"
    description: "条件成立で process を呼ぶ。"
  - step: "false 経路" 1.8s
    focus: ["if (valid?)", "ValidationError", "if (valid?) -> ValidationError"]
    badge: "false"
    description: "条件不成立で error イベントを emit。"
`;

export const sourceJson__patternBranch = `{
  "title": "pattern: Branch (条件分岐)",
  "type": "flow",
  "lanes": {
    "u": { "x": 0, "width": 280 },
    "d": { "x": 520, "width": 380, "contain": true },
    "r": { "x": 1140, "width": 280 }
  },
  "actors": [
    { "name": "Input", "kind": "actor", "lane": "u" },
    { "name": "if (valid?)", "kind": "function", "lane": "d", "subtitle": "分岐 node" },
    { "name": "process()", "kind": "function", "lane": "r" },
    { "name": "ValidationError", "kind": "event", "lane": "r", "stack": 1, "posW": 382 }
  ],
  "flow": [
    {
      "from": "Input",
      "to": "if (valid?)",
      "label": "evaluate",
      "tone": "accent",
      "style": "dotted-flow"
    },
    {
      "from": "if (valid?)",
      "to": "process()",
      "label": "true",
      "tone": "success",
      "style": "dotted-flow"
    },
    {
      "from": "if (valid?)",
      "to": "ValidationError",
      "label": "false",
      "tone": "error",
      "style": "dotted-flow"
    }
  ],
  "animation": [
    {
      "step": "evaluate",
      "duration": 1.8,
      "focus": ["Input", "if (valid?)", "Input -> if (valid?)"],
      "body": "input を条件 node に渡す。",
      "badge": "evaluate"
    },
    {
      "step": "true 経路",
      "duration": 1.8,
      "focus": ["if (valid?)", "process()", "if (valid?) -> process()"],
      "body": "条件成立で process を呼ぶ。",
      "badge": "true"
    },
    {
      "step": "false 経路",
      "duration": 1.8,
      "focus": ["if (valid?)", "ValidationError", "if (valid?) -> ValidationError"],
      "body": "条件不成立で error イベントを emit。",
      "badge": "false"
    }
  ]
}`;

/** 6. Branch (条件分岐 if/else) */
export const patternBranch = diagram("pattern-branch", { topic: "pattern: Branch (条件分岐)" })
  .lane("u", { x: L3_X1, width: L3_W_LR })
  .lane("d", { x: L3_X2, width: L3_W_C, contain: true })
  .lane("r", { x: L3_X3, width: L3_W_LR })
  .node("input", { lane: "u", stack: 0, kind: "actor", title: "Input" })
  .node("check", { lane: "d", stack: 0, kind: "function", title: "if (valid?)", subtitle: "分岐 node" })
  .node("ok", { lane: "r", stack: 0, kind: "function", title: "process()" })
  .node("ng", { lane: "r", stack: 1, kind: "event", title: "ValidationError", w: 382 })
  .edge("input", "check", { id: "e1", label: "evaluate", tone: "accent", style: "dotted-flow" })
  .edge("check", "ok", { id: "e2", label: "true", tone: "success", style: "dotted-flow" })
  .edge("check", "ng", { id: "e3", label: "false", tone: "error", style: "dotted-flow" })
  .phase("eval", { duration: 1800, title: "evaluate", body: "input を条件 node に渡す。" }, (p: PhaseBuilder) => p.activate("input", "check", "e1").badge("evaluate"))
  .phase("true", { duration: 1800, title: "true 経路", body: "条件成立で process を呼ぶ。" }, (p: PhaseBuilder) => p.activate("check", "ok", "e2").badge("true"))
  .phase("false", { duration: 1800, title: "false 経路", body: "条件不成立で error イベントを emit。" }, (p: PhaseBuilder) => p.activate("check", "ng", "e3").badge("false"))
  .build();

export const sourceYaml__patternLoop = `title: "pattern: Loop (繰り返し処理)"
type: flow

lanes:
  c: { x: 0, width: 280 }
  w: { x: 600, width: 480, contain: true }

states:
  i: 0

actors:
  - Client: { kind: actor, lane: c }
  - for i in items: { kind: function, lane: w, subtitle: "ループ node" }
  - process(item): { kind: function, lane: w, stack: 1 }

flow:
  - Client -> for i in items: "run" (accent, dotted-flow)
  - for i in items -> process(item): "each item" (teal, dotted-flow)

animation:
  - step: "start" 1.5s
    focus: ["Client", "for i in items", "Client -> for i in items"]
    badge: "start"
    description: "Client が一括実行を呼ぶ。"
  - step: "iter 1" 1.5s
    focus: ["for i in items", "process(item)", "for i in items -> process(item)"]
    tween:
      i: 0 -> 1
    badge: "i=1"
    description: "1 件目を処理。"
  - step: "iter 2" 1.5s
    focus: ["for i in items", "process(item)", "for i in items -> process(item)"]
    tween:
      i: 1 -> 2
    badge: "i=2"
    description: "2 件目を処理。"
  - step: "iter 3" 1.5s
    focus: ["for i in items", "process(item)", "for i in items -> process(item)"]
    tween:
      i: 2 -> 3
    badge: "i=3"
    description: "3 件目を処理。"
`;

export const sourceJson__patternLoop = `{
  "title": "pattern: Loop (繰り返し処理)",
  "type": "flow",
  "lanes": {
    "c": { "x": 0, "width": 280 },
    "w": { "x": 600, "width": 480, "contain": true }
  },
  "actors": [
    { "name": "Client", "kind": "actor", "lane": "c" },
    { "name": "for i in items", "kind": "function", "lane": "w", "subtitle": "ループ node" },
    { "name": "process(item)", "kind": "function", "lane": "w", "stack": 1 }
  ],
  "flow": [
    {
      "from": "Client",
      "to": "for i in items",
      "label": "run",
      "tone": "accent",
      "style": "dotted-flow"
    },
    {
      "from": "for i in items",
      "to": "process(item)",
      "label": "each item",
      "tone": "teal",
      "style": "dotted-flow"
    }
  ],
  "states": { "i": 0 },
  "animation": [
    {
      "step": "start",
      "duration": 1.5,
      "focus": ["Client", "for i in items", "Client -> for i in items"],
      "body": "Client が一括実行を呼ぶ。",
      "badge": "start"
    },
    {
      "step": "iter 1",
      "duration": 1.5,
      "focus": ["for i in items", "process(item)", "for i in items -> process(item)"],
      "body": "1 件目を処理。",
      "tween": { "i": [0, 1] },
      "badge": "i=1"
    },
    {
      "step": "iter 2",
      "duration": 1.5,
      "focus": ["for i in items", "process(item)", "for i in items -> process(item)"],
      "body": "2 件目を処理。",
      "tween": { "i": [1, 2] },
      "badge": "i=2"
    },
    {
      "step": "iter 3",
      "duration": 1.5,
      "focus": ["for i in items", "process(item)", "for i in items -> process(item)"],
      "body": "3 件目を処理。",
      "tween": { "i": [2, 3] },
      "badge": "i=3"
    }
  ]
}`;

/** 7. Loop (繰り返し処理) */
export const patternLoop = diagram("pattern-loop", { topic: "pattern: Loop (繰り返し処理)" })
  .lane("c", { x: L2_X1, width: L2_W })
  .lane("w", { x: L2_X2, width: 480, contain: true })
  .state("i", { initial: 0 })
  .node("client", { lane: "c", stack: 0, kind: "actor", title: "Client" })
  .node("iter", { lane: "w", stack: 0, kind: "function", title: "for i in items", subtitle: "ループ node" })
  .node("body", { lane: "w", stack: 1, kind: "function", title: "process(item)" })
  .edge("client", "iter", { id: "e1", label: "run", tone: "accent", style: "dotted-flow" })
  .edge("iter", "body", { id: "e2", label: "each item", tone: "teal", style: "dotted-flow" })
  .phase("start", { duration: 1500, title: "start", body: "Client が一括実行を呼ぶ。" }, (p: PhaseBuilder) => p.activate("client", "iter", "e1").badge("start"))
  .phase("iter1", { duration: 1500, title: "iter 1", body: "1 件目を処理。" }, (p: PhaseBuilder) => p.activate("iter", "body", "e2").tween("i", 0, 1).badge("i=1"))
  .phase("iter2", { duration: 1500, title: "iter 2", body: "2 件目を処理。" }, (p: PhaseBuilder) => p.activate("iter", "body", "e2").tween("i", 1, 2).badge("i=2"))
  .phase("iter3", { duration: 1500, title: "iter 3", body: "3 件目を処理。" }, (p: PhaseBuilder) => p.activate("iter", "body", "e2").tween("i", 2, 3).badge("i=3"))
  .build();

export const sourceYaml__patternFanOut = `title: "pattern: Fan-out (1 入力 → 複数 worker)"
type: flow

lanes:
  u: { x: 0, width: 280 }
  d: { x: 520, width: 380 }
  w: { x: 1140, width: 280 }

actors:
  - Producer: { kind: actor, lane: u }
  - Dispatcher: { kind: function, lane: d, subtitle: "分配" }
  - Worker 1: { kind: function, lane: w }
  - Worker 2: { kind: function, lane: w, stack: 1 }
  - Worker 3: { kind: function, lane: w, stack: 2 }

flow:
  - Producer -> Dispatcher: "submit" (accent, solid)
  - Dispatcher -> Worker 1: "job 1" (teal, solid)
  - Dispatcher -> Worker 2: "job 2" (teal, solid)
  - Dispatcher -> Worker 3: "job 3" (teal, solid)

animation:
  - step: "submit" 1.8s
    focus: ["Producer", "Dispatcher"]
    badge: "submit"
    description: "Producer が 1 入力を Dispatcher に submit。"
  - step: "fan-out" 1.8s
    focus: ["Dispatcher", "Worker 1", "Worker 2", "Worker 3"]
    badge: "fan-out"
    description: "Dispatcher が 1 job を 3 worker に並列 dispatch (round-robin)、 各 worker が独立処理。"
`;

export const sourceJson__patternFanOut = `{
  "title": "pattern: Fan-out (1 入力 → 複数 worker)",
  "type": "flow",
  "lanes": {
    "u": { "x": 0, "width": 280 },
    "d": { "x": 520, "width": 380 },
    "w": { "x": 1140, "width": 280 }
  },
  "actors": [
    { "name": "Producer", "kind": "actor", "lane": "u" },
    { "name": "Dispatcher", "kind": "function", "lane": "d", "subtitle": "分配" },
    { "name": "Worker 1", "kind": "function", "lane": "w" },
    { "name": "Worker 2", "kind": "function", "lane": "w", "stack": 1 },
    { "name": "Worker 3", "kind": "function", "lane": "w", "stack": 2 }
  ],
  "flow": [
    {
      "from": "Producer",
      "to": "Dispatcher",
      "label": "submit",
      "tone": "accent",
      "style": "solid"
    },
    {
      "from": "Dispatcher",
      "to": "Worker 1",
      "label": "job 1",
      "tone": "teal",
      "style": "solid"
    },
    {
      "from": "Dispatcher",
      "to": "Worker 2",
      "label": "job 2",
      "tone": "teal",
      "style": "solid"
    },
    {
      "from": "Dispatcher",
      "to": "Worker 3",
      "label": "job 3",
      "tone": "teal",
      "style": "solid"
    }
  ],
  "animation": [
    {
      "step": "submit",
      "duration": 1.8,
      "focus": ["Producer", "Dispatcher"],
      "body": "Producer が 1 入力を Dispatcher に submit。",
      "badge": "submit"
    },
    {
      "step": "fan-out",
      "duration": 1.8,
      "focus": ["Dispatcher", "Worker 1", "Worker 2", "Worker 3"],
      "body": "Dispatcher が 1 job を 3 worker に並列 dispatch (round-robin)、 各 worker が独立処理。",
      "badge": "fan-out"
    }
  ]
}`;

/** 8. Fan-out (1 入力 → 複数 worker) */
export const patternFanOut = diagram("pattern-fan-out", { topic: "pattern: Fan-out (1 入力 → 複数 worker)" })
  .lane("u", { x: L3_X1, width: L3_W_LR })
  .lane("d", { x: L3_X2, width: L3_W_C })
  .lane("w", { x: L3_X3, width: L3_W_LR })
  .node("client", { lane: "u", stack: 0, kind: "actor", title: "Producer" })
  .node("dist", { lane: "d", stack: 0, kind: "function", title: "Dispatcher", subtitle: "分配" })
  .node("w1", { lane: "w", stack: 0, kind: "function", title: "Worker 1" })
  .node("w2", { lane: "w", stack: 1, kind: "function", title: "Worker 2" })
  .node("w3", { lane: "w", stack: 2, kind: "function", title: "Worker 3" })
  .edge("client", "dist", { id: "e1", label: "submit", tone: "accent", style: "solid" })
  .edge("dist", "w1", { id: "e2", label: "job 1", tone: "teal", style: "solid" })
  .edge("dist", "w2", { id: "e3", label: "job 2", tone: "teal", style: "solid" })
  .edge("dist", "w3", { id: "e4", label: "job 3", tone: "teal", style: "solid" })
  .phase("submit", { duration: 1800, title: "submit", body: "Producer が 1 入力を Dispatcher に submit。" }, (p: PhaseBuilder) => p.activate("client", "dist").badge("submit"))
  .phase("fanout", { duration: 1800, title: "fan-out", body: "Dispatcher が 1 job を 3 worker に並列 dispatch (round-robin)、 各 worker が独立処理。" }, (p: PhaseBuilder) => p.activate("dist", "w1", "w2", "w3").badge("fan-out"))
  .build();

export const sourceYaml__patternFanIn = `title: "pattern: Fan-in (複数 worker → 集約)"
type: flow

lanes:
  w: { x: 0, width: 280 }
  a: { x: 520, width: 380, contain: true }
  r: { x: 1140, width: 280 }

actors:
  - Worker 1: { kind: function, lane: w }
  - Worker 2: { kind: function, lane: w, stack: 1 }
  - Worker 3: { kind: function, lane: w, stack: 2 }
  - Aggregator: { kind: function, lane: a, subtitle: "集約" }
  - result table: { kind: storage, lane: a, stack: 1 }
  - Consumer: { kind: actor, lane: r }

flow:
  - Worker 1 -> Aggregator: "result 1" (teal, solid)
  - Worker 2 -> Aggregator: "result 2" (teal, solid)
  - Worker 3 -> Aggregator: "result 3" (teal, solid)
  - Aggregator -> result table: "write" (warning, solid)
  - result table -> Consumer: "read" (accent, solid)

animation:
  - step: "collect" 1.8s
    focus: ["Worker 1", "Worker 2", "Worker 3", "Aggregator"]
    badge: "fan-in"
    description: "3 worker が結果を Aggregator に送る。"
  - step: "write" 1.8s
    focus: ["Aggregator", "result table"]
    badge: "write"
    description: "Aggregator が集約結果を store に書込。"
  - step: "read" 1.8s
    focus: ["result table", "Consumer"]
    badge: "read"
    description: "Consumer が集約結果を取得。"
`;

export const sourceJson__patternFanIn = `{
  "title": "pattern: Fan-in (複数 worker → 集約)",
  "type": "flow",
  "lanes": {
    "w": { "x": 0, "width": 280 },
    "a": { "x": 520, "width": 380, "contain": true },
    "r": { "x": 1140, "width": 280 }
  },
  "actors": [
    { "name": "Worker 1", "kind": "function", "lane": "w" },
    { "name": "Worker 2", "kind": "function", "lane": "w", "stack": 1 },
    { "name": "Worker 3", "kind": "function", "lane": "w", "stack": 2 },
    { "name": "Aggregator", "kind": "function", "lane": "a", "subtitle": "集約" },
    { "name": "result table", "kind": "storage", "lane": "a", "stack": 1 },
    { "name": "Consumer", "kind": "actor", "lane": "r" }
  ],
  "flow": [
    {
      "from": "Worker 1",
      "to": "Aggregator",
      "label": "result 1",
      "tone": "teal",
      "style": "solid"
    },
    {
      "from": "Worker 2",
      "to": "Aggregator",
      "label": "result 2",
      "tone": "teal",
      "style": "solid"
    },
    {
      "from": "Worker 3",
      "to": "Aggregator",
      "label": "result 3",
      "tone": "teal",
      "style": "solid"
    },
    {
      "from": "Aggregator",
      "to": "result table",
      "label": "write",
      "tone": "warning",
      "style": "solid"
    },
    {
      "from": "result table",
      "to": "Consumer",
      "label": "read",
      "tone": "accent",
      "style": "solid"
    }
  ],
  "animation": [
    {
      "step": "collect",
      "duration": 1.8,
      "focus": ["Worker 1", "Worker 2", "Worker 3", "Aggregator"],
      "body": "3 worker が結果を Aggregator に送る。",
      "badge": "fan-in"
    },
    {
      "step": "write",
      "duration": 1.8,
      "focus": ["Aggregator", "result table"],
      "body": "Aggregator が集約結果を store に書込。",
      "badge": "write"
    },
    {
      "step": "read",
      "duration": 1.8,
      "focus": ["result table", "Consumer"],
      "body": "Consumer が集約結果を取得。",
      "badge": "read"
    }
  ]
}`;

/** 9. Fan-in (複数 worker → 集約) */
export const patternFanIn = diagram("pattern-fan-in", { topic: "pattern: Fan-in (複数 worker → 集約)" })
  .lane("w", { x: L3_X1, width: L3_W_LR })
  .lane("a", { x: L3_X2, width: L3_W_C, contain: true })
  .lane("r", { x: L3_X3, width: L3_W_LR })
  .node("w1", { lane: "w", stack: 0, kind: "function", title: "Worker 1" })
  .node("w2", { lane: "w", stack: 1, kind: "function", title: "Worker 2" })
  .node("w3", { lane: "w", stack: 2, kind: "function", title: "Worker 3" })
  .node("agg", { lane: "a", stack: 0, kind: "function", title: "Aggregator", subtitle: "集約" })
  .node("store", { lane: "a", stack: 1, kind: "storage", title: "result table" })
  .node("client", { lane: "r", stack: 0, kind: "actor", title: "Consumer" })
  .edge("w1", "agg", { id: "e1", label: "result 1", tone: "teal", style: "solid" })
  .edge("w2", "agg", { id: "e2", label: "result 2", tone: "teal", style: "solid" })
  .edge("w3", "agg", { id: "e3", label: "result 3", tone: "teal", style: "solid" })
  .edge("agg", "store", { id: "e4", label: "write", tone: "warning", style: "solid" })
  .edge("store", "client", { id: "e5", label: "read", tone: "accent", style: "solid" })
  .phase("collect", { duration: 1800, title: "collect", body: "3 worker が結果を Aggregator に送る。" }, (p: PhaseBuilder) => p.activate("w1", "w2", "w3", "agg").badge("fan-in"))
  .phase("write", { duration: 1800, title: "write", body: "Aggregator が集約結果を store に書込。" }, (p: PhaseBuilder) => p.activate("agg", "store").badge("write"))
  .phase("read", { duration: 1800, title: "read", body: "Consumer が集約結果を取得。" }, (p: PhaseBuilder) => p.activate("store", "client").badge("read"))
  .build();

export const sourceYaml__patternRollback = `title: "pattern: Rollback (失敗時巻き戻し)"
type: flow

lanes:
  u: { x: 0, width: 280 }
  t: { x: 520, width: 380, contain: true }
  s: { x: 1140, width: 280 }

states:
  balance: 100

actors:
  - Client: { kind: actor, lane: u, value: "{balance}" }
  - BEGIN tx: { kind: function, lane: t }
  - operation(): { kind: function, lane: t, stack: 1 }
  - COMMIT / ROLLBACK: { kind: function, lane: t, stack: 2, posW: 426 }
  - DB: { kind: storage, lane: s, rows: ["balance: {balance}"] }

flow:
  - Client -> BEGIN tx: "BEGIN" (accent, dotted-flow)
  - BEGIN tx -> operation(): "execute" (teal, dotted-flow)
  - operation() -> DB: "write" (warning, dotted-flow)
  - operation() -> COMMIT / ROLLBACK: "on error" (error, dotted-flow)
  - COMMIT / ROLLBACK -> DB: "ROLLBACK" (error, dotted-flow)

animation:
  - step: "BEGIN" 1.5s
    focus: ["Client", "BEGIN tx", "Client -> BEGIN tx"]
    badge: "BEGIN"
    description: "tx 開始。"
  - step: "tentative write" 1.5s
    focus: ["BEGIN tx", "operation()", "DB", "BEGIN tx -> operation()", "operation() -> DB"]
    tween:
      balance: 100 -> 80
    badge: "write"
    description: "operation 内で DB を仮更新。"
  - step: "ROLLBACK" 1.5s
    focus: ["operation()", "COMMIT / ROLLBACK", "DB", "operation() -> COMMIT / ROLLBACK", "COMMIT / ROLLBACK -> DB"]
    tween:
      balance: 80 -> 100
    badge: "ROLLBACK"
    description: "失敗検知で元の値に巻き戻し。"
`;

export const sourceJson__patternRollback = `{
  "title": "pattern: Rollback (失敗時巻き戻し)",
  "type": "flow",
  "lanes": {
    "u": { "x": 0, "width": 280 },
    "t": { "x": 520, "width": 380, "contain": true },
    "s": { "x": 1140, "width": 280 }
  },
  "actors": [
    { "name": "Client", "kind": "actor", "lane": "u", "value": "{balance}" },
    { "name": "BEGIN tx", "kind": "function", "lane": "t" },
    { "name": "operation()", "kind": "function", "lane": "t", "stack": 1 },
    { "name": "COMMIT / ROLLBACK", "kind": "function", "lane": "t", "stack": 2, "posW": 426 },
    { "name": "DB", "kind": "storage", "lane": "s", "rows": ["balance: {balance}"] }
  ],
  "flow": [
    {
      "from": "Client",
      "to": "BEGIN tx",
      "label": "BEGIN",
      "tone": "accent",
      "style": "dotted-flow"
    },
    {
      "from": "BEGIN tx",
      "to": "operation()",
      "label": "execute",
      "tone": "teal",
      "style": "dotted-flow"
    },
    {
      "from": "operation()",
      "to": "DB",
      "label": "write",
      "tone": "warning",
      "style": "dotted-flow"
    },
    {
      "from": "operation()",
      "to": "COMMIT / ROLLBACK",
      "label": "on error",
      "tone": "error",
      "style": "dotted-flow"
    },
    {
      "from": "COMMIT / ROLLBACK",
      "to": "DB",
      "label": "ROLLBACK",
      "tone": "error",
      "style": "dotted-flow"
    }
  ],
  "states": { "balance": 100 },
  "animation": [
    {
      "step": "BEGIN",
      "duration": 1.5,
      "focus": ["Client", "BEGIN tx", "Client -> BEGIN tx"],
      "body": "tx 開始。",
      "badge": "BEGIN"
    },
    {
      "step": "tentative write",
      "duration": 1.5,
      "focus": ["BEGIN tx", "operation()", "DB", "BEGIN tx -> operation()", "operation() -> DB"],
      "body": "operation 内で DB を仮更新。",
      "tween": { "balance": [100, 80] },
      "badge": "write"
    },
    {
      "step": "ROLLBACK",
      "duration": 1.5,
      "focus": [
        "operation()",
        "COMMIT / ROLLBACK",
        "DB",
        "operation() -> COMMIT / ROLLBACK",
        "COMMIT / ROLLBACK -> DB"
      ],
      "body": "失敗検知で元の値に巻き戻し。",
      "tween": { "balance": [80, 100] },
      "badge": "ROLLBACK"
    }
  ]
}`;

/** 10. Rollback (失敗時に元の状態へ巻き戻す) */
export const patternRollback = diagram("pattern-rollback", { topic: "pattern: Rollback (失敗時巻き戻し)" })
  .lane("u", { x: L3_X1, width: L3_W_LR })
  .lane("t", { x: L3_X2, width: L3_W_C, contain: true })
  .lane("s", { x: L3_X3, width: L3_W_LR })
  .state("balance", { initial: 100 })
  .node("client", { lane: "u", stack: 0, kind: "actor", title: "Client", value: "{balance}" })
  .node("tx", { lane: "t", stack: 0, kind: "function", title: "BEGIN tx" })
  .node("op", { lane: "t", stack: 1, kind: "function", title: "operation()" })
  .node("commit", { lane: "t", stack: 2, kind: "function", title: "COMMIT / ROLLBACK", w: 426 })
  .node("db", { lane: "s", stack: 0, kind: "storage", title: "DB", rows: ["balance: {balance}"] })
  .edge("client", "tx", { id: "e1", label: "BEGIN", tone: "accent", style: "dotted-flow" })
  .edge("tx", "op", { id: "e2", label: "execute", tone: "teal", style: "dotted-flow" })
  .edge("op", "db", { id: "e3", label: "write", tone: "warning", style: "dotted-flow" })
  .edge("op", "commit", { id: "e4", label: "on error", tone: "error", style: "dotted-flow" })
  .edge("commit", "db", { id: "e5", label: "ROLLBACK", tone: "error", style: "dotted-flow" })
  .phase("begin", { duration: 1500, title: "BEGIN", body: "tx 開始。" }, (p: PhaseBuilder) => p.activate("client", "tx", "e1").badge("BEGIN"))
  .phase("write", { duration: 1500, title: "tentative write", body: "operation 内で DB を仮更新。" }, (p: PhaseBuilder) => p.activate("tx", "op", "db", "e2", "e3").tween("balance", 100, 80).badge("write"))
  .phase("rollback", { duration: 1500, title: "ROLLBACK", body: "失敗検知で元の値に巻き戻し。" }, (p: PhaseBuilder) => p.activate("op", "commit", "db", "e4", "e5").tween("balance", 80, 100).badge("ROLLBACK"))
  .build();

export const sourceYaml__patternSchedule = `title: "pattern: Schedule (定期実行)"
type: flow

lanes:
  s: { x: 0, width: 280 }
  j: { x: 520, width: 380, contain: true }
  t: { x: 1140, width: 280 }

actors:
  - Cron: { kind: actor, lane: s, subtitle: "*/5 * * * *" }
  - Scheduler: { kind: function, lane: j, subtitle: "起動判定" }
  - Job.run(): { kind: function, lane: j, stack: 1 }
  - Target service: { kind: function, lane: t }

flow:
  - Cron -> Scheduler: "tick" (info, dotted-flow)
  - Scheduler -> Job.run(): "trigger" (accent, dotted-flow)
  - Job.run() -> Target service: "invoke" (teal, dotted-flow)

animation:
  - step: "tick" 1.8s
    focus: ["Cron", "Scheduler", "Cron -> Scheduler"]
    badge: "tick"
    description: "Cron が 5 分ごとに tick。"
  - step: "trigger" 1.8s
    focus: ["Scheduler", "Job.run()", "Scheduler -> Job.run()"]
    badge: "trigger"
    description: "Scheduler が Job を起動。"
  - step: "invoke" 1.8s
    focus: ["Job.run()", "Target service", "Job.run() -> Target service"]
    badge: "invoke"
    description: "Job が Target を呼ぶ。"
`;

export const sourceJson__patternSchedule = `{
  "title": "pattern: Schedule (定期実行)",
  "type": "flow",
  "lanes": {
    "s": { "x": 0, "width": 280 },
    "j": { "x": 520, "width": 380, "contain": true },
    "t": { "x": 1140, "width": 280 }
  },
  "actors": [
    { "name": "Cron", "kind": "actor", "lane": "s", "subtitle": "*/5 * * * *" },
    { "name": "Scheduler", "kind": "function", "lane": "j", "subtitle": "起動判定" },
    { "name": "Job.run()", "kind": "function", "lane": "j", "stack": 1 },
    { "name": "Target service", "kind": "function", "lane": "t" }
  ],
  "flow": [
    {
      "from": "Cron",
      "to": "Scheduler",
      "label": "tick",
      "tone": "info",
      "style": "dotted-flow"
    },
    {
      "from": "Scheduler",
      "to": "Job.run()",
      "label": "trigger",
      "tone": "accent",
      "style": "dotted-flow"
    },
    {
      "from": "Job.run()",
      "to": "Target service",
      "label": "invoke",
      "tone": "teal",
      "style": "dotted-flow"
    }
  ],
  "animation": [
    {
      "step": "tick",
      "duration": 1.8,
      "focus": ["Cron", "Scheduler", "Cron -> Scheduler"],
      "body": "Cron が 5 分ごとに tick。",
      "badge": "tick"
    },
    {
      "step": "trigger",
      "duration": 1.8,
      "focus": ["Scheduler", "Job.run()", "Scheduler -> Job.run()"],
      "body": "Scheduler が Job を起動。",
      "badge": "trigger"
    },
    {
      "step": "invoke",
      "duration": 1.8,
      "focus": ["Job.run()", "Target service", "Job.run() -> Target service"],
      "body": "Job が Target を呼ぶ。",
      "badge": "invoke"
    }
  ]
}`;

/** 11. Schedule (定期実行) */
export const patternSchedule = diagram("pattern-schedule", { topic: "pattern: Schedule (定期実行)" })
  .lane("s", { x: L3_X1, width: L3_W_LR })
  .lane("j", { x: L3_X2, width: L3_W_C, contain: true })
  .lane("t", { x: L3_X3, width: L3_W_LR })
  .node("cron", { lane: "s", stack: 0, kind: "actor", title: "Cron", subtitle: "*/5 * * * *" })
  .node("scheduler", { lane: "j", stack: 0, kind: "function", title: "Scheduler", subtitle: "起動判定" })
  .node("job", { lane: "j", stack: 1, kind: "function", title: "Job.run()" })
  .node("target", { lane: "t", stack: 0, kind: "function", title: "Target service" })
  .edge("cron", "scheduler", { id: "e1", label: "tick", tone: "info", style: "dotted-flow" })
  .edge("scheduler", "job", { id: "e2", label: "trigger", tone: "accent", style: "dotted-flow" })
  .edge("job", "target", { id: "e3", label: "invoke", tone: "teal", style: "dotted-flow" })
  .phase("tick", { duration: 1800, title: "tick", body: "Cron が 5 分ごとに tick。" }, (p: PhaseBuilder) => p.activate("cron", "scheduler", "e1").badge("tick"))
  .phase("trigger", { duration: 1800, title: "trigger", body: "Scheduler が Job を起動。" }, (p: PhaseBuilder) => p.activate("scheduler", "job", "e2").badge("trigger"))
  .phase("invoke", { duration: 1800, title: "invoke", body: "Job が Target を呼ぶ。" }, (p: PhaseBuilder) => p.activate("job", "target", "e3").badge("invoke"))
  .build();

export const sourceYaml__patternValidateProcess = `title: "pattern: Validate → Process (検証後処理)"
type: flow

lanes:
  u: { x: 0, width: 280 }
  v: { x: 520, width: 380, contain: true }
  p: { x: 1140, width: 280 }

actors:
  - Client: { kind: actor, lane: u }
  - validate(input): { kind: function, lane: v }
  - schema: { kind: storage, lane: v, stack: 1, rows: ["lib: zod / yup"] }
  - process(): { kind: function, lane: p }
  - ValidationError: { kind: event, lane: p, stack: 1, posW: 382 }

flow:
  - Client -> validate(input): "submit" (accent, dotted-flow)
  - validate(input) -> schema: "check" (teal, dotted-flow)
  - validate(input) -> process(): "ok" (success, dotted-flow)
  - validate(input) -> ValidationError: "ng" (error, dotted-flow)

animation:
  - step: "submit" 1.5s
    focus: ["Client", "validate(input)", "Client -> validate(input)"]
    badge: "submit"
    description: "Client が input を送る。"
  - step: "check" 1.5s
    focus: ["validate(input)", "schema", "validate(input) -> schema"]
    badge: "check"
    description: "schema で検証。"
  - step: "ok" 1.5s
    focus: ["validate(input)", "process()", "validate(input) -> process()"]
    badge: "ok"
    description: "検証成功で process。"
  - step: "ng" 1.5s
    focus: ["validate(input)", "ValidationError", "validate(input) -> ValidationError"]
    badge: "ng"
    description: "失敗時は ValidationError emit。"
`;

export const sourceJson__patternValidateProcess = `{
  "title": "pattern: Validate → Process (検証後処理)",
  "type": "flow",
  "lanes": {
    "u": { "x": 0, "width": 280 },
    "v": { "x": 520, "width": 380, "contain": true },
    "p": { "x": 1140, "width": 280 }
  },
  "actors": [
    { "name": "Client", "kind": "actor", "lane": "u" },
    { "name": "validate(input)", "kind": "function", "lane": "v" },
    { "name": "schema", "kind": "storage", "lane": "v", "stack": 1, "rows": ["lib: zod / yup"] },
    { "name": "process()", "kind": "function", "lane": "p" },
    { "name": "ValidationError", "kind": "event", "lane": "p", "stack": 1, "posW": 382 }
  ],
  "flow": [
    {
      "from": "Client",
      "to": "validate(input)",
      "label": "submit",
      "tone": "accent",
      "style": "dotted-flow"
    },
    {
      "from": "validate(input)",
      "to": "schema",
      "label": "check",
      "tone": "teal",
      "style": "dotted-flow"
    },
    {
      "from": "validate(input)",
      "to": "process()",
      "label": "ok",
      "tone": "success",
      "style": "dotted-flow"
    },
    {
      "from": "validate(input)",
      "to": "ValidationError",
      "label": "ng",
      "tone": "error",
      "style": "dotted-flow"
    }
  ],
  "animation": [
    {
      "step": "submit",
      "duration": 1.5,
      "focus": ["Client", "validate(input)", "Client -> validate(input)"],
      "body": "Client が input を送る。",
      "badge": "submit"
    },
    {
      "step": "check",
      "duration": 1.5,
      "focus": ["validate(input)", "schema", "validate(input) -> schema"],
      "body": "schema で検証。",
      "badge": "check"
    },
    {
      "step": "ok",
      "duration": 1.5,
      "focus": ["validate(input)", "process()", "validate(input) -> process()"],
      "body": "検証成功で process。",
      "badge": "ok"
    },
    {
      "step": "ng",
      "duration": 1.5,
      "focus": ["validate(input)", "ValidationError", "validate(input) -> ValidationError"],
      "body": "失敗時は ValidationError emit。",
      "badge": "ng"
    }
  ]
}`;

/** 12. Validate → Process (検証後処理) */
export const patternValidateProcess = diagram("pattern-validate-process", { topic: "pattern: Validate → Process (検証後処理)" })
  .lane("u", { x: L3_X1, width: L3_W_LR })
  .lane("v", { x: L3_X2, width: L3_W_C, contain: true })
  .lane("p", { x: L3_X3, width: L3_W_LR })
  .node("client", { lane: "u", stack: 0, kind: "actor", title: "Client" })
  .node("validate", { lane: "v", stack: 0, kind: "function", title: "validate(input)" })
  .node("schema", { lane: "v", stack: 1, kind: "storage", title: "schema", rows: ["lib: zod / yup"] })
  .node("process", { lane: "p", stack: 0, kind: "function", title: "process()" })
  .node("err", { lane: "p", stack: 1, kind: "event", title: "ValidationError", w: 382 })
  .edge("client", "validate", { id: "e1", label: "submit", tone: "accent", style: "dotted-flow" })
  .edge("validate", "schema", { id: "e2", label: "check", tone: "teal", style: "dotted-flow" })
  .edge("validate", "process", { id: "e3", label: "ok", tone: "success", style: "dotted-flow" })
  .edge("validate", "err", { id: "e4", label: "ng", tone: "error", style: "dotted-flow" })
  .phase("submit", { duration: 1500, title: "submit", body: "Client が input を送る。" }, (p: PhaseBuilder) => p.activate("client", "validate", "e1").badge("submit"))
  .phase("check", { duration: 1500, title: "check", body: "schema で検証。" }, (p: PhaseBuilder) => p.activate("validate", "schema", "e2").badge("check"))
  .phase("ok", { duration: 1500, title: "ok", body: "検証成功で process。" }, (p: PhaseBuilder) => p.activate("validate", "process", "e3").badge("ok"))
  .phase("ng", { duration: 1500, title: "ng", body: "失敗時は ValidationError emit。" }, (p: PhaseBuilder) => p.activate("validate", "err", "e4").badge("ng"))
  .build();
