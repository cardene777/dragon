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
 * | この file の図すべて | 図の id | 組み立て API 側を残すことで変えない |
 *
 * 1 つ目は `focus:` が `A -> B` の形しか受けないため (`focus.ts`)。 「読む」 と「書く」 は
 * どちらも `残数を減らす(...) -> 残数の表` なので、書き分ける手段が無い。
 *
 * ## 箱の名前に空白が入る時は `focus:` を引用符で囲む
 *
 * `focus: [働き手 1]` は **黙って落ちない代わりに 2 つの名前として読まれる**
 * (`働き手` と `1`)。 どちらも実在しないので `focus-target-missing` の注意が出る。
 * 一覧はこの注意を受け取らないため画面には出ず、**光らせ忘れだけが残る**。
 *
 * 本 file の記法は全件を引用符付きで書き、注意が 0 件であることを検査で固定する。
 *
 * ## 画面に出る字と id を分ける
 *
 * 箱と矢印と段の **題** は日本語で書き、組み立て API の **id** (`fn` / `read` / `hook` など) は
 * 英数字のまま置く (#1888)。 id は画面に出ない内部の名前で、検査が id で引く
 * (`parallel-edge-separation.test.ts` が `pattern-call-rw::read` を名指しする)。
 * 題を訳すついでに id まで訳すと、画面は変わらないまま検査の宛先だけが消える。
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
  - 利用者側: { kind: actor, lane: l1 }
  - 処理側: { kind: function, lane: l2 }

flow:
  - 利用者側 -> 処理側: "要求" (accent, dotted-flow) { sub: "箱の端で止まる" }

animation:
  - step: "送り手" 1.2s
    focus: ["利用者側"]
    badge: "直結"
  - step: "受け手まで" 1.2s
    focus: ["利用者側", "処理側"]
    badge: "直結"
  - step: "直結" 2.4s
    focus: ["利用者側", "処理側", "利用者側 -> 処理側"]
    badge: "直結"
    description: "粒子は利用者側の端から処理側の端で止まり、箱の中には入らない。"
`;

export const sourceJson__patternDirect = `{
  "title": "pattern: Direct (隣接 node 直結)",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 280 },
    "l2": { "x": 600, "width": 280 }
  },
  "actors": [
    { "name": "利用者側", "kind": "actor", "lane": "l1" },
    { "name": "処理側", "kind": "function", "lane": "l2" }
  ],
  "flow": [
    {
      "from": "利用者側",
      "to": "処理側",
      "label": "要求",
      "sub": "箱の端で止まる",
      "tone": "accent",
      "style": "dotted-flow"
    }
  ],
  "animation": [
    { "step": "送り手", "duration": 1.2, "focus": ["利用者側"], "badge": "直結" },
    { "step": "受け手まで", "duration": 1.2, "focus": ["利用者側", "処理側"], "badge": "直結" },
    {
      "step": "直結",
      "duration": 2.4,
      "focus": ["利用者側", "処理側", "利用者側 -> 処理側"],
      "body": "粒子は利用者側の端から処理側の端で止まり、箱の中には入らない。",
      "badge": "直結"
    }
  ]
}`;

/** 1. 直結 dotted-flow (隣接 node 間) */
export const patternDirect = diagram("pattern-direct", { topic: "pattern: Direct (隣接 node 直結)" })
  .lane("l1", { x: L2_X1, width: L2_W })
  .lane("l2", { x: L2_X2, width: L2_W })
  .node("a", { lane: "l1", stack: 0, kind: "actor", title: "利用者側" })
  .node("b", { lane: "l2", stack: 0, kind: "function", title: "処理側" })
  .edge("a", "b", { id: "e", label: "要求", sub: "箱の端で止まる", tone: "accent", style: "dotted-flow" })
  .phase("p1", { duration: 1200, title: "送り手", body: "" }, (p: PhaseBuilder) => p.activate("a").badge("直結"))
  .phase("p2", { duration: 1200, title: "受け手まで", body: "" }, (p: PhaseBuilder) => p.activate("a", "b").badge("直結"))
  .phase("p3", { duration: 2400, title: "直結", body: "粒子は利用者側の端から処理側の端で止まり、箱の中には入らない。" }, (p: PhaseBuilder) => p.activate("a", "b", "e").badge("直結"))
  .build();

export const sourceYaml__patternPassthrough = `title: "pattern: Passthrough (中継 node 貫通)"
type: flow

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 520, width: 380, contain: true }
  l3: { x: 1140, width: 280 }

actors:
  - 利用者側: { kind: actor, lane: l1 }
  - 入口: { kind: function, lane: l2, subtitle: "利用者側から処理側へ中継する (代理の形)" }
  - 処理側: { kind: function, lane: l3 }

flow:
  - 利用者側 -> 処理側: "利用者側 → 処理側" (accent, dotted-flow) { sub: "入口を経由" }

animation:
  - step: "送り手" 1.2s
    focus: ["利用者側"]
    badge: "貫通"
  - step: "中継まで" 1.2s
    focus: ["利用者側", "入口"]
    badge: "貫通"
  - step: "貫通" 2.8s
    focus: ["利用者側", "入口", "処理側", "利用者側 -> 処理側"]
    badge: "貫通"
    description: "矢印の道筋が入口の上を通るため、描画側が自動の判定で粒子を入口の中央まで動かす。"
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
    { "name": "利用者側", "kind": "actor", "lane": "l1" },
    {
      "name": "入口",
      "kind": "function",
      "lane": "l2",
      "subtitle": "利用者側から処理側へ中継する (代理の形)"
    },
    { "name": "処理側", "kind": "function", "lane": "l3" }
  ],
  "flow": [
    {
      "from": "利用者側",
      "to": "処理側",
      "label": "利用者側 → 処理側",
      "sub": "入口を経由",
      "tone": "accent",
      "style": "dotted-flow"
    }
  ],
  "animation": [
    { "step": "送り手", "duration": 1.2, "focus": ["利用者側"], "badge": "貫通" },
    { "step": "中継まで", "duration": 1.2, "focus": ["利用者側", "入口"], "badge": "貫通" },
    {
      "step": "貫通",
      "duration": 2.8,
      "focus": ["利用者側", "入口", "処理側", "利用者側 -> 処理側"],
      "body": "矢印の道筋が入口の上を通るため、描画側が自動の判定で粒子を入口の中央まで動かす。",
      "badge": "貫通"
    }
  ]
}`;

/** 2. 経由 node 貫通 (Passthrough) */
export const patternPassthrough = diagram("pattern-passthrough", { topic: "pattern: Passthrough (中継 node 貫通)" })
  .lane("l1", { x: L3_X1, width: L3_W_LR })
  .lane("l2", { x: L3_X2, width: L3_W_C, contain: true })
  .lane("l3", { x: L3_X3, width: L3_W_LR })
  .node("a", { lane: "l1", stack: 0, kind: "actor", title: "利用者側" })
  .node("router", { lane: "l2", stack: 0, kind: "function", title: "入口", subtitle: "利用者側から処理側へ中継する (代理の形)" })
  .node("c", { lane: "l3", stack: 0, kind: "function", title: "処理側" })
  .edge("a", "c", { id: "e", label: "利用者側 → 処理側", sub: "入口を経由", tone: "accent", style: "dotted-flow" })
  .phase("p1", { duration: 1200, title: "送り手", body: "" }, (p: PhaseBuilder) => p.activate("a").badge("貫通"))
  .phase("p2", { duration: 1200, title: "中継まで", body: "" }, (p: PhaseBuilder) => p.activate("a", "router").badge("貫通"))
  .phase("p3", { duration: 2800, title: "貫通", body: "矢印の道筋が入口の上を通るため、描画側が自動の判定で粒子を入口の中央まで動かす。" }, (p: PhaseBuilder) => p.activate("a", "router", "c", "e").badge("貫通"))
  .build();

export const sourceYaml__patternCallReadWrite = `title: "pattern: Call → Read → Write"
type: flow

lanes:
  client: { x: 0, width: 280 }
  service: { x: 600, width: 480, contain: true }

states:
  count: 100

actors:
  - 利用者: { kind: actor, lane: client, value: "{count}" }
  - 残数を減らす(...): { kind: function, lane: service }
  - 残数の表: { kind: storage, lane: service, stack: 1, rows: ["利用者: {count}"] }

flow:
  - 利用者 -> 残数を減らす(...): "呼ぶ" (accent, dotted-flow)
  - 残数を減らす(...) -> 残数の表: "読む" (teal, dotted-flow)
  - 残数を減らす(...) -> 残数の表: "書く" (accent, dotted-flow)

animation:
  - step: "呼ぶ" 1.8s
    focus: ["利用者", "残数を減らす(...)", "利用者 -> 残数を減らす(...)"]
    badge: "呼ぶ"
    description: "外から関数を呼ぶ。"
  - step: "読む" 1.8s
    focus: ["残数を減らす(...)", "残数の表", "残数を減らす(...) -> 残数の表"]
    badge: "読む"
    description: "残数の表から今の値を読む。"
  - step: "書く" 1.8s
    focus: ["残数を減らす(...)", "残数の表", "残数を減らす(...) -> 残数の表"]
    tween:
      count: 100 -> 90
    badge: "書く"
    description: "残数の表を書き換える。"
`;

export const sourceJson__patternCallReadWrite = `{
  "title": "pattern: Call → Read → Write",
  "type": "flow",
  "lanes": {
    "client": { "x": 0, "width": 280 },
    "service": { "x": 600, "width": 480, "contain": true }
  },
  "actors": [
    { "name": "利用者", "kind": "actor", "lane": "client", "value": "{count}" },
    { "name": "残数を減らす(...)", "kind": "function", "lane": "service" },
    {
      "name": "残数の表",
      "kind": "storage",
      "lane": "service",
      "stack": 1,
      "rows": ["利用者: {count}"]
    }
  ],
  "flow": [
    {
      "from": "利用者",
      "to": "残数を減らす(...)",
      "label": "呼ぶ",
      "tone": "accent",
      "style": "dotted-flow"
    },
    {
      "from": "残数を減らす(...)",
      "to": "残数の表",
      "label": "読む",
      "tone": "teal",
      "style": "dotted-flow"
    },
    {
      "from": "残数を減らす(...)",
      "to": "残数の表",
      "label": "書く",
      "tone": "accent",
      "style": "dotted-flow"
    }
  ],
  "states": { "count": 100 },
  "animation": [
    {
      "step": "呼ぶ",
      "duration": 1.8,
      "focus": ["利用者", "残数を減らす(...)", "利用者 -> 残数を減らす(...)"],
      "body": "外から関数を呼ぶ。",
      "badge": "呼ぶ"
    },
    {
      "step": "読む",
      "duration": 1.8,
      "focus": ["残数を減らす(...)", "残数の表", "残数を減らす(...) -> 残数の表"],
      "body": "残数の表から今の値を読む。",
      "badge": "読む"
    },
    {
      "step": "書く",
      "duration": 1.8,
      "focus": ["残数を減らす(...)", "残数の表", "残数を減らす(...) -> 残数の表"],
      "body": "残数の表を書き換える。",
      "tween": { "count": [100, 90] },
      "badge": "書く"
    }
  ]
}`;

/** 3. 呼ぶ → 読む → 書く (関数の中の処理) */
export const patternCallReadWrite = diagram("pattern-call-rw", { topic: "pattern: Call → Read → Write" })
  .lane("client", { x: L2_X1, width: L2_W })
  .lane("service", { x: L2_X2, width: 480, contain: true })
  .state("count", { initial: 100 })
  .node("user", { lane: "client", stack: 0, kind: "actor", title: "利用者", value: "{count}" })
  .node("fn", { lane: "service", stack: 0, kind: "function", title: "残数を減らす(...)" })
  .node("storage", { lane: "service", stack: 1, kind: "storage", title: "残数の表", rows: ["利用者: {count}"] })
  .edge("user", "fn", { id: "call", label: "呼ぶ", tone: "accent", style: "dotted-flow" })
  .edge("fn", "storage", { id: "read", label: "読む", tone: "teal", style: "dotted-flow" })
  .edge("fn", "storage", { id: "write", label: "書く", tone: "accent", style: "dotted-flow" })
  .phase("call", { duration: 1800, title: "呼ぶ", body: "外から関数を呼ぶ。" }, (p: PhaseBuilder) => p.activate("user", "fn", "call").badge("呼ぶ"))
  .phase("read", { duration: 1800, title: "読む", body: "残数の表から今の値を読む。" }, (p: PhaseBuilder) => p.activate("fn", "storage", "read").badge("読む"))
  .phase("write", { duration: 1800, title: "書く", body: "残数の表を書き換える。" }, (p: PhaseBuilder) => p.activate("fn", "storage", "write").tween("count", 100, 90).badge("書く"))
  .build();

export const sourceYaml__patternEmit = `title: "pattern: Emit Event (外部通知)"
type: flow

lanes:
  c: { x: 0, width: 280 }
  o: { x: 600, width: 280 }

actors:
  - 注文を処理する(...): { kind: function, lane: c, posW: 426 }
  - 注文ができた: { kind: event, lane: o, subtitle: "(注文の番号, 利用者の番号, 金額)" }

flow:
  - 注文を処理する(...) -> 注文ができた: "出来事を出す" (success, dotted-flow)

animation:
  - step: "関数" 1.2s
    focus: ["注文を処理する(...)"]
    badge: "出来事を出す"
  - step: "受け皿まで" 1.2s
    focus: ["注文を処理する(...)", "注文ができた"]
    badge: "出来事を出す"
  - step: "出来事を出す" 2.4s
    focus: ["注文を処理する(...)", "注文ができた", "注文を処理する(...) -> 注文ができた"]
    badge: "出来事を出す"
    description: "関数の中で出した出来事が、流し場と記録に書き込まれる。"
`;

export const sourceJson__patternEmit = `{
  "title": "pattern: Emit Event (外部通知)",
  "type": "flow",
  "lanes": {
    "c": { "x": 0, "width": 280 },
    "o": { "x": 600, "width": 280 }
  },
  "actors": [
    { "name": "注文を処理する(...)", "kind": "function", "lane": "c", "posW": 426 },
    {
      "name": "注文ができた",
      "kind": "event",
      "lane": "o",
      "subtitle": "(注文の番号, 利用者の番号, 金額)"
    }
  ],
  "flow": [
    {
      "from": "注文を処理する(...)",
      "to": "注文ができた",
      "label": "出来事を出す",
      "tone": "success",
      "style": "dotted-flow"
    }
  ],
  "animation": [
    { "step": "関数", "duration": 1.2, "focus": ["注文を処理する(...)"], "badge": "出来事を出す" },
    {
      "step": "受け皿まで",
      "duration": 1.2,
      "focus": ["注文を処理する(...)", "注文ができた"],
      "badge": "出来事を出す"
    },
    {
      "step": "出来事を出す",
      "duration": 2.4,
      "focus": ["注文を処理する(...)", "注文ができた", "注文を処理する(...) -> 注文ができた"],
      "body": "関数の中で出した出来事が、流し場と記録に書き込まれる。",
      "badge": "出来事を出す"
    }
  ]
}`;

/** 4. emit event (外部通知) */
export const patternEmit = diagram("pattern-emit", { topic: "pattern: Emit Event (外部通知)" })
  .lane("c", { x: L2_X1, width: L2_W })
  .lane("o", { x: L2_X2, width: L2_W })
  .node("fn", { lane: "c", stack: 0, kind: "function", title: "注文を処理する(...)", w: 426 })
  .node("ev", { lane: "o", stack: 0, kind: "event", title: "注文ができた", subtitle: "(注文の番号, 利用者の番号, 金額)" })
  .edge("fn", "ev", { id: "emit", label: "出来事を出す", tone: "success", style: "dotted-flow" })
  .phase("p1", { duration: 1200, title: "関数", body: "" }, (p: PhaseBuilder) => p.activate("fn").badge("出来事を出す"))
  .phase("p2", { duration: 1200, title: "受け皿まで", body: "" }, (p: PhaseBuilder) => p.activate("fn", "ev").badge("出来事を出す"))
  .phase("p3", { duration: 2400, title: "出来事を出す", body: "関数の中で出した出来事が、流し場と記録に書き込まれる。" }, (p: PhaseBuilder) => p.activate("fn", "ev", "emit").badge("出来事を出す"))
  .build();

export const sourceYaml__patternHook = `title: "pattern: Hook callback"
type: flow

lanes:
  col1: { x: 0, width: 430 }
  col2: { x: 470, width: 430 }

actors:
  - 送信側: { kind: actor, lane: col1 }
  - 届ける: { kind: function, lane: col2, subtitle: "送付前の差し込み" }
  - 受け取れるか: { kind: function, lane: col1, stack: 1, subtitle: "受信側で実装" }

flow:
  - 送信側 -> 届ける: "呼ぶ" (accent, dotted-flow)
  - 届ける -> 受け取れるか: "差し込みの呼び戻し" (teal, dotted-flow) { sub: "受信可否確認" }

animation:
  - step: "呼ぶ" 1.8s
    focus: ["送信側", "届ける", "送信側 -> 届ける"]
    badge: "呼ぶ"
    description: "送信側が届ける処理を呼ぶ。"
  - step: "差し込みの呼び戻し" 1.8s
    focus: ["届ける", "受け取れるか", "届ける -> 受け取れるか"]
    badge: "差し込み"
    description: "届ける処理が、受信側の「受け取れるか」を呼んで確かめる。"
`;

export const sourceJson__patternHook = `{
  "title": "pattern: Hook callback",
  "type": "flow",
  "lanes": {
    "col1": { "x": 0, "width": 430 },
    "col2": { "x": 470, "width": 430 }
  },
  "actors": [
    { "name": "送信側", "kind": "actor", "lane": "col1" },
    { "name": "届ける", "kind": "function", "lane": "col2", "subtitle": "送付前の差し込み" },
    {
      "name": "受け取れるか",
      "kind": "function",
      "lane": "col1",
      "stack": 1,
      "subtitle": "受信側で実装"
    }
  ],
  "flow": [
    {
      "from": "送信側",
      "to": "届ける",
      "label": "呼ぶ",
      "tone": "accent",
      "style": "dotted-flow"
    },
    {
      "from": "届ける",
      "to": "受け取れるか",
      "label": "差し込みの呼び戻し",
      "sub": "受信可否確認",
      "tone": "teal",
      "style": "dotted-flow"
    }
  ],
  "animation": [
    {
      "step": "呼ぶ",
      "duration": 1.8,
      "focus": ["送信側", "届ける", "送信側 -> 届ける"],
      "body": "送信側が届ける処理を呼ぶ。",
      "badge": "呼ぶ"
    },
    {
      "step": "差し込みの呼び戻し",
      "duration": 1.8,
      "focus": ["届ける", "受け取れるか", "届ける -> 受け取れるか"],
      "body": "届ける処理が、受信側の「受け取れるか」を呼んで確かめる。",
      "badge": "差し込み"
    }
  ]
}`;

/** 5. 差し込みの呼び戻し ... 受信側の差し込みで「受け取れるか」 を確かめる */
// 3 節を横 1 列に置くと幅 2099 world / 縦横比 6.3 になり、 親幅に収めた時に帯状に潰れて
// label が読めなかった。 2 列 2 段に折り返して縦横比 2.2 に収める。
// col1 = 送信側と受信側の差し込みを縦に重ね、 col2 = 中継する「届ける」 を置く。 帯 id は内容ではなく
// 位置を表す (段をまたぐと 1 つの帯に別の役割の節が入るため、 意味を名前にすると嘘になる)。
export const patternHook = diagram("pattern-hook", { topic: "pattern: Hook callback" })
  .lane("col1", { x: 0, width: 430 })
  .lane("col2", { x: 470, width: 430 })
  .node("from", { lane: "col1", stack: 0, kind: "actor", title: "送信側" })
  .node("fn", { lane: "col2", stack: 0, kind: "function", title: "届ける", subtitle: "送付前の差し込み" })
  .node("hook", { lane: "col1", stack: 1, kind: "function", title: "受け取れるか", subtitle: "受信側で実装" })
  .edge("from", "fn", { id: "call", label: "呼ぶ", tone: "accent", style: "dotted-flow" })
  .edge("fn", "hook", { id: "hook-callback", label: "差し込みの呼び戻し", sub: "受信可否確認", tone: "teal", style: "dotted-flow" })
  .phase("call", { duration: 1800, title: "呼ぶ", body: "送信側が届ける処理を呼ぶ。" }, (p: PhaseBuilder) => p.activate("from", "fn", "call").badge("呼ぶ"))
  .phase("hook", { duration: 1800, title: "差し込みの呼び戻し", body: "届ける処理が、受信側の「受け取れるか」を呼んで確かめる。" }, (p: PhaseBuilder) => p.activate("fn", "hook", "hook-callback").badge("差し込み"))
  .build();

export const sourceYaml__patternBranch = `title: "pattern: Branch (条件分岐)"
type: flow

lanes:
  u: { x: 0, width: 280 }
  d: { x: 520, width: 380, contain: true }
  r: { x: 1140, width: 280 }

actors:
  - 入力: { kind: actor, lane: u }
  - もし (正しい?): { kind: function, lane: d, subtitle: "分岐の箱" }
  - 処理する(): { kind: function, lane: r }
  - 検証の失敗: { kind: event, lane: r, stack: 1, posW: 382 }

flow:
  - 入力 -> もし (正しい?): "判定" (accent, dotted-flow)
  - もし (正しい?) -> 処理する(): "成立" (success, dotted-flow)
  - もし (正しい?) -> 検証の失敗: "不成立" (error, dotted-flow)

animation:
  - step: "判定" 1.8s
    focus: ["入力", "もし (正しい?)", "入力 -> もし (正しい?)"]
    badge: "判定"
    description: "入力を条件の箱へ渡す。"
  - step: "成立の経路" 1.8s
    focus: ["もし (正しい?)", "処理する()", "もし (正しい?) -> 処理する()"]
    badge: "成立"
    description: "条件が成り立つと、処理を呼ぶ。"
  - step: "不成立の経路" 1.8s
    focus: ["もし (正しい?)", "検証の失敗", "もし (正しい?) -> 検証の失敗"]
    badge: "不成立"
    description: "条件が成り立たないと、失敗の出来事を出す。"
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
    { "name": "入力", "kind": "actor", "lane": "u" },
    { "name": "もし (正しい?)", "kind": "function", "lane": "d", "subtitle": "分岐の箱" },
    { "name": "処理する()", "kind": "function", "lane": "r" },
    { "name": "検証の失敗", "kind": "event", "lane": "r", "stack": 1, "posW": 382 }
  ],
  "flow": [
    {
      "from": "入力",
      "to": "もし (正しい?)",
      "label": "判定",
      "tone": "accent",
      "style": "dotted-flow"
    },
    {
      "from": "もし (正しい?)",
      "to": "処理する()",
      "label": "成立",
      "tone": "success",
      "style": "dotted-flow"
    },
    {
      "from": "もし (正しい?)",
      "to": "検証の失敗",
      "label": "不成立",
      "tone": "error",
      "style": "dotted-flow"
    }
  ],
  "animation": [
    {
      "step": "判定",
      "duration": 1.8,
      "focus": ["入力", "もし (正しい?)", "入力 -> もし (正しい?)"],
      "body": "入力を条件の箱へ渡す。",
      "badge": "判定"
    },
    {
      "step": "成立の経路",
      "duration": 1.8,
      "focus": ["もし (正しい?)", "処理する()", "もし (正しい?) -> 処理する()"],
      "body": "条件が成り立つと、処理を呼ぶ。",
      "badge": "成立"
    },
    {
      "step": "不成立の経路",
      "duration": 1.8,
      "focus": ["もし (正しい?)", "検証の失敗", "もし (正しい?) -> 検証の失敗"],
      "body": "条件が成り立たないと、失敗の出来事を出す。",
      "badge": "不成立"
    }
  ]
}`;

/** 6. Branch (条件分岐 if/else) */
export const patternBranch = diagram("pattern-branch", { topic: "pattern: Branch (条件分岐)" })
  .lane("u", { x: L3_X1, width: L3_W_LR })
  .lane("d", { x: L3_X2, width: L3_W_C, contain: true })
  .lane("r", { x: L3_X3, width: L3_W_LR })
  .node("input", { lane: "u", stack: 0, kind: "actor", title: "入力" })
  .node("check", { lane: "d", stack: 0, kind: "function", title: "もし (正しい?)", subtitle: "分岐の箱" })
  .node("ok", { lane: "r", stack: 0, kind: "function", title: "処理する()" })
  .node("ng", { lane: "r", stack: 1, kind: "event", title: "検証の失敗", w: 382 })
  .edge("input", "check", { id: "e1", label: "判定", tone: "accent", style: "dotted-flow" })
  .edge("check", "ok", { id: "e2", label: "成立", tone: "success", style: "dotted-flow" })
  .edge("check", "ng", { id: "e3", label: "不成立", tone: "error", style: "dotted-flow" })
  .phase("eval", { duration: 1800, title: "判定", body: "入力を条件の箱へ渡す。" }, (p: PhaseBuilder) => p.activate("input", "check", "e1").badge("判定"))
  .phase("true", { duration: 1800, title: "成立の経路", body: "条件が成り立つと、処理を呼ぶ。" }, (p: PhaseBuilder) => p.activate("check", "ok", "e2").badge("成立"))
  .phase("false", { duration: 1800, title: "不成立の経路", body: "条件が成り立たないと、失敗の出来事を出す。" }, (p: PhaseBuilder) => p.activate("check", "ng", "e3").badge("不成立"))
  .build();

export const sourceYaml__patternLoop = `title: "pattern: Loop (繰り返し処理)"
type: flow

lanes:
  c: { x: 0, width: 280 }
  w: { x: 600, width: 480, contain: true }

states:
  i: 0

actors:
  - 利用者側: { kind: actor, lane: c }
  - 品目ごとに繰り返す: { kind: function, lane: w, subtitle: "繰り返しの箱" }
  - 処理する(品目): { kind: function, lane: w, stack: 1 }

flow:
  - 利用者側 -> 品目ごとに繰り返す: "実行" (accent, dotted-flow)
  - 品目ごとに繰り返す -> 処理する(品目): "品目ごと" (teal, dotted-flow)

animation:
  - step: "開始" 1.5s
    focus: ["利用者側", "品目ごとに繰り返す", "利用者側 -> 品目ごとに繰り返す"]
    badge: "開始"
    description: "利用者側がまとめて実行を呼ぶ。"
  - step: "周回 1" 1.5s
    focus: ["品目ごとに繰り返す", "処理する(品目)", "品目ごとに繰り返す -> 処理する(品目)"]
    tween:
      i: 0 -> 1
    badge: "i=1"
    description: "1 件目を処理。"
  - step: "周回 2" 1.5s
    focus: ["品目ごとに繰り返す", "処理する(品目)", "品目ごとに繰り返す -> 処理する(品目)"]
    tween:
      i: 1 -> 2
    badge: "i=2"
    description: "2 件目を処理。"
  - step: "周回 3" 1.5s
    focus: ["品目ごとに繰り返す", "処理する(品目)", "品目ごとに繰り返す -> 処理する(品目)"]
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
    { "name": "利用者側", "kind": "actor", "lane": "c" },
    { "name": "品目ごとに繰り返す", "kind": "function", "lane": "w", "subtitle": "繰り返しの箱" },
    { "name": "処理する(品目)", "kind": "function", "lane": "w", "stack": 1 }
  ],
  "flow": [
    {
      "from": "利用者側",
      "to": "品目ごとに繰り返す",
      "label": "実行",
      "tone": "accent",
      "style": "dotted-flow"
    },
    {
      "from": "品目ごとに繰り返す",
      "to": "処理する(品目)",
      "label": "品目ごと",
      "tone": "teal",
      "style": "dotted-flow"
    }
  ],
  "states": { "i": 0 },
  "animation": [
    {
      "step": "開始",
      "duration": 1.5,
      "focus": ["利用者側", "品目ごとに繰り返す", "利用者側 -> 品目ごとに繰り返す"],
      "body": "利用者側がまとめて実行を呼ぶ。",
      "badge": "開始"
    },
    {
      "step": "周回 1",
      "duration": 1.5,
      "focus": ["品目ごとに繰り返す", "処理する(品目)", "品目ごとに繰り返す -> 処理する(品目)"],
      "body": "1 件目を処理。",
      "tween": { "i": [0, 1] },
      "badge": "i=1"
    },
    {
      "step": "周回 2",
      "duration": 1.5,
      "focus": ["品目ごとに繰り返す", "処理する(品目)", "品目ごとに繰り返す -> 処理する(品目)"],
      "body": "2 件目を処理。",
      "tween": { "i": [1, 2] },
      "badge": "i=2"
    },
    {
      "step": "周回 3",
      "duration": 1.5,
      "focus": ["品目ごとに繰り返す", "処理する(品目)", "品目ごとに繰り返す -> 処理する(品目)"],
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
  .node("client", { lane: "c", stack: 0, kind: "actor", title: "利用者側" })
  .node("iter", { lane: "w", stack: 0, kind: "function", title: "品目ごとに繰り返す", subtitle: "繰り返しの箱" })
  .node("body", { lane: "w", stack: 1, kind: "function", title: "処理する(品目)" })
  .edge("client", "iter", { id: "e1", label: "実行", tone: "accent", style: "dotted-flow" })
  .edge("iter", "body", { id: "e2", label: "品目ごと", tone: "teal", style: "dotted-flow" })
  .phase("start", { duration: 1500, title: "開始", body: "利用者側がまとめて実行を呼ぶ。" }, (p: PhaseBuilder) => p.activate("client", "iter", "e1").badge("開始"))
  .phase("iter1", { duration: 1500, title: "周回 1", body: "1 件目を処理。" }, (p: PhaseBuilder) => p.activate("iter", "body", "e2").tween("i", 0, 1).badge("i=1"))
  .phase("iter2", { duration: 1500, title: "周回 2", body: "2 件目を処理。" }, (p: PhaseBuilder) => p.activate("iter", "body", "e2").tween("i", 1, 2).badge("i=2"))
  .phase("iter3", { duration: 1500, title: "周回 3", body: "3 件目を処理。" }, (p: PhaseBuilder) => p.activate("iter", "body", "e2").tween("i", 2, 3).badge("i=3"))
  .build();

export const sourceYaml__patternFanOut = `title: "pattern: Fan-out (1 入力 → 複数 worker)"
type: flow

lanes:
  u: { x: 0, width: 280 }
  d: { x: 520, width: 380 }
  w: { x: 1140, width: 280 }

actors:
  - 出し手: { kind: actor, lane: u }
  - 配り手: { kind: function, lane: d, subtitle: "分配" }
  - 働き手 1: { kind: function, lane: w }
  - 働き手 2: { kind: function, lane: w, stack: 1 }
  - 働き手 3: { kind: function, lane: w, stack: 2 }

flow:
  - 出し手 -> 配り手: "送る" (accent, solid)
  - 配り手 -> 働き手 1: "仕事 1" (teal, solid)
  - 配り手 -> 働き手 2: "仕事 2" (teal, solid)
  - 配り手 -> 働き手 3: "仕事 3" (teal, solid)

animation:
  - step: "送る" 1.8s
    focus: ["出し手", "配り手"]
    badge: "送る"
    description: "出し手が 1 つの入力を配り手へ送る。"
  - step: "配る" 1.8s
    focus: ["配り手", "働き手 1", "働き手 2", "働き手 3"]
    badge: "配る"
    description: "配り手が 1 つの入力を 3 つの働き手へ順ぐりに配り、働き手はそれぞれ独立に処理する。"
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
    { "name": "出し手", "kind": "actor", "lane": "u" },
    { "name": "配り手", "kind": "function", "lane": "d", "subtitle": "分配" },
    { "name": "働き手 1", "kind": "function", "lane": "w" },
    { "name": "働き手 2", "kind": "function", "lane": "w", "stack": 1 },
    { "name": "働き手 3", "kind": "function", "lane": "w", "stack": 2 }
  ],
  "flow": [
    {
      "from": "出し手",
      "to": "配り手",
      "label": "送る",
      "tone": "accent",
      "style": "solid"
    },
    {
      "from": "配り手",
      "to": "働き手 1",
      "label": "仕事 1",
      "tone": "teal",
      "style": "solid"
    },
    {
      "from": "配り手",
      "to": "働き手 2",
      "label": "仕事 2",
      "tone": "teal",
      "style": "solid"
    },
    {
      "from": "配り手",
      "to": "働き手 3",
      "label": "仕事 3",
      "tone": "teal",
      "style": "solid"
    }
  ],
  "animation": [
    {
      "step": "送る",
      "duration": 1.8,
      "focus": ["出し手", "配り手"],
      "body": "出し手が 1 つの入力を配り手へ送る。",
      "badge": "送る"
    },
    {
      "step": "配る",
      "duration": 1.8,
      "focus": ["配り手", "働き手 1", "働き手 2", "働き手 3"],
      "body": "配り手が 1 つの入力を 3 つの働き手へ順ぐりに配り、働き手はそれぞれ独立に処理する。",
      "badge": "配る"
    }
  ]
}`;

/** 8. Fan-out (1 入力 → 複数 worker) */
export const patternFanOut = diagram("pattern-fan-out", { topic: "pattern: Fan-out (1 入力 → 複数 worker)" })
  .lane("u", { x: L3_X1, width: L3_W_LR })
  .lane("d", { x: L3_X2, width: L3_W_C })
  .lane("w", { x: L3_X3, width: L3_W_LR })
  .node("client", { lane: "u", stack: 0, kind: "actor", title: "出し手" })
  .node("dist", { lane: "d", stack: 0, kind: "function", title: "配り手", subtitle: "分配" })
  .node("w1", { lane: "w", stack: 0, kind: "function", title: "働き手 1" })
  .node("w2", { lane: "w", stack: 1, kind: "function", title: "働き手 2" })
  .node("w3", { lane: "w", stack: 2, kind: "function", title: "働き手 3" })
  .edge("client", "dist", { id: "e1", label: "送る", tone: "accent", style: "solid" })
  .edge("dist", "w1", { id: "e2", label: "仕事 1", tone: "teal", style: "solid" })
  .edge("dist", "w2", { id: "e3", label: "仕事 2", tone: "teal", style: "solid" })
  .edge("dist", "w3", { id: "e4", label: "仕事 3", tone: "teal", style: "solid" })
  .phase("submit", { duration: 1800, title: "送る", body: "出し手が 1 つの入力を配り手へ送る。" }, (p: PhaseBuilder) => p.activate("client", "dist").badge("送る"))
  .phase("fanout", { duration: 1800, title: "配る", body: "配り手が 1 つの入力を 3 つの働き手へ順ぐりに配り、働き手はそれぞれ独立に処理する。" }, (p: PhaseBuilder) => p.activate("dist", "w1", "w2", "w3").badge("配る"))
  .build();

export const sourceYaml__patternFanIn = `title: "pattern: Fan-in (複数 worker → 集約)"
type: flow

lanes:
  w: { x: 0, width: 280 }
  a: { x: 520, width: 380, contain: true }
  r: { x: 1140, width: 280 }

actors:
  - 働き手 1: { kind: function, lane: w }
  - 働き手 2: { kind: function, lane: w, stack: 1 }
  - 働き手 3: { kind: function, lane: w, stack: 2 }
  - 集め手: { kind: function, lane: a, subtitle: "集約" }
  - 結果の表: { kind: storage, lane: a, stack: 1 }
  - 受け手: { kind: actor, lane: r }

flow:
  - 働き手 1 -> 集め手: "結果 1" (teal, solid)
  - 働き手 2 -> 集め手: "結果 2" (teal, solid)
  - 働き手 3 -> 集め手: "結果 3" (teal, solid)
  - 集め手 -> 結果の表: "書く" (warning, solid)
  - 結果の表 -> 受け手: "読む" (accent, solid)

animation:
  - step: "集める" 1.8s
    focus: ["働き手 1", "働き手 2", "働き手 3", "集め手"]
    badge: "集める"
    description: "3 つの働き手が結果を集め手へ送る。"
  - step: "書く" 1.8s
    focus: ["集め手", "結果の表"]
    badge: "書く"
    description: "集め手がまとめた結果を結果の表へ書き込む。"
  - step: "読む" 1.8s
    focus: ["結果の表", "受け手"]
    badge: "読む"
    description: "受け手がまとめた結果を受け取る。"
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
    { "name": "働き手 1", "kind": "function", "lane": "w" },
    { "name": "働き手 2", "kind": "function", "lane": "w", "stack": 1 },
    { "name": "働き手 3", "kind": "function", "lane": "w", "stack": 2 },
    { "name": "集め手", "kind": "function", "lane": "a", "subtitle": "集約" },
    { "name": "結果の表", "kind": "storage", "lane": "a", "stack": 1 },
    { "name": "受け手", "kind": "actor", "lane": "r" }
  ],
  "flow": [
    {
      "from": "働き手 1",
      "to": "集め手",
      "label": "結果 1",
      "tone": "teal",
      "style": "solid"
    },
    {
      "from": "働き手 2",
      "to": "集め手",
      "label": "結果 2",
      "tone": "teal",
      "style": "solid"
    },
    {
      "from": "働き手 3",
      "to": "集め手",
      "label": "結果 3",
      "tone": "teal",
      "style": "solid"
    },
    {
      "from": "集め手",
      "to": "結果の表",
      "label": "書く",
      "tone": "warning",
      "style": "solid"
    },
    {
      "from": "結果の表",
      "to": "受け手",
      "label": "読む",
      "tone": "accent",
      "style": "solid"
    }
  ],
  "animation": [
    {
      "step": "集める",
      "duration": 1.8,
      "focus": ["働き手 1", "働き手 2", "働き手 3", "集め手"],
      "body": "3 つの働き手が結果を集め手へ送る。",
      "badge": "集める"
    },
    {
      "step": "書く",
      "duration": 1.8,
      "focus": ["集め手", "結果の表"],
      "body": "集め手がまとめた結果を結果の表へ書き込む。",
      "badge": "書く"
    },
    {
      "step": "読む",
      "duration": 1.8,
      "focus": ["結果の表", "受け手"],
      "body": "受け手がまとめた結果を受け取る。",
      "badge": "読む"
    }
  ]
}`;

/** 9. Fan-in (複数 worker → 集約) */
export const patternFanIn = diagram("pattern-fan-in", { topic: "pattern: Fan-in (複数 worker → 集約)" })
  .lane("w", { x: L3_X1, width: L3_W_LR })
  .lane("a", { x: L3_X2, width: L3_W_C, contain: true })
  .lane("r", { x: L3_X3, width: L3_W_LR })
  .node("w1", { lane: "w", stack: 0, kind: "function", title: "働き手 1" })
  .node("w2", { lane: "w", stack: 1, kind: "function", title: "働き手 2" })
  .node("w3", { lane: "w", stack: 2, kind: "function", title: "働き手 3" })
  .node("agg", { lane: "a", stack: 0, kind: "function", title: "集め手", subtitle: "集約" })
  .node("store", { lane: "a", stack: 1, kind: "storage", title: "結果の表" })
  .node("client", { lane: "r", stack: 0, kind: "actor", title: "受け手" })
  .edge("w1", "agg", { id: "e1", label: "結果 1", tone: "teal", style: "solid" })
  .edge("w2", "agg", { id: "e2", label: "結果 2", tone: "teal", style: "solid" })
  .edge("w3", "agg", { id: "e3", label: "結果 3", tone: "teal", style: "solid" })
  .edge("agg", "store", { id: "e4", label: "書く", tone: "warning", style: "solid" })
  .edge("store", "client", { id: "e5", label: "読む", tone: "accent", style: "solid" })
  .phase("collect", { duration: 1800, title: "集める", body: "3 つの働き手が結果を集め手へ送る。" }, (p: PhaseBuilder) => p.activate("w1", "w2", "w3", "agg").badge("集める"))
  .phase("write", { duration: 1800, title: "書く", body: "集め手がまとめた結果を結果の表へ書き込む。" }, (p: PhaseBuilder) => p.activate("agg", "store").badge("書く"))
  .phase("read", { duration: 1800, title: "読む", body: "受け手がまとめた結果を受け取る。" }, (p: PhaseBuilder) => p.activate("store", "client").badge("読む"))
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
  - 利用者側: { kind: actor, lane: u, value: "{balance}" }
  - BEGIN tx: { kind: function, lane: t }
  - 処理(): { kind: function, lane: t, stack: 1 }
  - COMMIT / ROLLBACK: { kind: function, lane: t, stack: 2, posW: 426 }
  - DB: { kind: storage, lane: s, rows: ["残高: {balance}"] }

flow:
  - 利用者側 -> BEGIN tx: "BEGIN" (accent, dotted-flow)
  - BEGIN tx -> 処理(): "実行" (teal, dotted-flow)
  - 処理() -> DB: "書く" (warning, dotted-flow)
  - 処理() -> COMMIT / ROLLBACK: "失敗した時" (error, dotted-flow)
  - COMMIT / ROLLBACK -> DB: "ROLLBACK" (error, dotted-flow)

animation:
  - step: "BEGIN" 1.5s
    focus: ["利用者側", "BEGIN tx", "利用者側 -> BEGIN tx"]
    badge: "BEGIN"
    description: "取引を始める。"
  - step: "仮の書き込み" 1.5s
    focus: ["BEGIN tx", "処理()", "DB", "BEGIN tx -> 処理()", "処理() -> DB"]
    tween:
      balance: 100 -> 80
    badge: "書く"
    description: "処理の中で DB を仮に書き換える。"
  - step: "ROLLBACK" 1.5s
    focus: ["処理()", "COMMIT / ROLLBACK", "DB", "処理() -> COMMIT / ROLLBACK", "COMMIT / ROLLBACK -> DB"]
    tween:
      balance: 80 -> 100
    badge: "ROLLBACK"
    description: "失敗に気付いたら、元の値へ巻き戻す。"
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
    { "name": "利用者側", "kind": "actor", "lane": "u", "value": "{balance}" },
    { "name": "BEGIN tx", "kind": "function", "lane": "t" },
    { "name": "処理()", "kind": "function", "lane": "t", "stack": 1 },
    { "name": "COMMIT / ROLLBACK", "kind": "function", "lane": "t", "stack": 2, "posW": 426 },
    { "name": "DB", "kind": "storage", "lane": "s", "rows": ["残高: {balance}"] }
  ],
  "flow": [
    {
      "from": "利用者側",
      "to": "BEGIN tx",
      "label": "BEGIN",
      "tone": "accent",
      "style": "dotted-flow"
    },
    {
      "from": "BEGIN tx",
      "to": "処理()",
      "label": "実行",
      "tone": "teal",
      "style": "dotted-flow"
    },
    {
      "from": "処理()",
      "to": "DB",
      "label": "書く",
      "tone": "warning",
      "style": "dotted-flow"
    },
    {
      "from": "処理()",
      "to": "COMMIT / ROLLBACK",
      "label": "失敗した時",
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
      "focus": ["利用者側", "BEGIN tx", "利用者側 -> BEGIN tx"],
      "body": "取引を始める。",
      "badge": "BEGIN"
    },
    {
      "step": "仮の書き込み",
      "duration": 1.5,
      "focus": ["BEGIN tx", "処理()", "DB", "BEGIN tx -> 処理()", "処理() -> DB"],
      "body": "処理の中で DB を仮に書き換える。",
      "tween": { "balance": [100, 80] },
      "badge": "書く"
    },
    {
      "step": "ROLLBACK",
      "duration": 1.5,
      "focus": [
        "処理()",
        "COMMIT / ROLLBACK",
        "DB",
        "処理() -> COMMIT / ROLLBACK",
        "COMMIT / ROLLBACK -> DB"
      ],
      "body": "失敗に気付いたら、元の値へ巻き戻す。",
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
  .node("client", { lane: "u", stack: 0, kind: "actor", title: "利用者側", value: "{balance}" })
  .node("tx", { lane: "t", stack: 0, kind: "function", title: "BEGIN tx" })
  .node("op", { lane: "t", stack: 1, kind: "function", title: "処理()" })
  .node("commit", { lane: "t", stack: 2, kind: "function", title: "COMMIT / ROLLBACK", w: 426 })
  .node("db", { lane: "s", stack: 0, kind: "storage", title: "DB", rows: ["残高: {balance}"] })
  .edge("client", "tx", { id: "e1", label: "BEGIN", tone: "accent", style: "dotted-flow" })
  .edge("tx", "op", { id: "e2", label: "実行", tone: "teal", style: "dotted-flow" })
  .edge("op", "db", { id: "e3", label: "書く", tone: "warning", style: "dotted-flow" })
  .edge("op", "commit", { id: "e4", label: "失敗した時", tone: "error", style: "dotted-flow" })
  .edge("commit", "db", { id: "e5", label: "ROLLBACK", tone: "error", style: "dotted-flow" })
  .phase("begin", { duration: 1500, title: "BEGIN", body: "取引を始める。" }, (p: PhaseBuilder) => p.activate("client", "tx", "e1").badge("BEGIN"))
  .phase("write", { duration: 1500, title: "仮の書き込み", body: "処理の中で DB を仮に書き換える。" }, (p: PhaseBuilder) => p.activate("tx", "op", "db", "e2", "e3").tween("balance", 100, 80).badge("書く"))
  .phase("rollback", { duration: 1500, title: "ROLLBACK", body: "失敗に気付いたら、元の値へ巻き戻す。" }, (p: PhaseBuilder) => p.activate("op", "commit", "db", "e4", "e5").tween("balance", 80, 100).badge("ROLLBACK"))
  .build();

export const sourceYaml__patternSchedule = `title: "pattern: Schedule (定期実行)"
type: flow

lanes:
  s: { x: 0, width: 280 }
  j: { x: 520, width: 380, contain: true }
  t: { x: 1140, width: 280 }

actors:
  - 定時の合図: { kind: actor, lane: s, subtitle: "*/5 * * * *" }
  - 割り当て: { kind: function, lane: j, subtitle: "起動判定" }
  - 仕事.実行(): { kind: function, lane: j, stack: 1 }
  - 呼ばれる側: { kind: function, lane: t }

flow:
  - 定時の合図 -> 割り当て: "刻む" (info, dotted-flow)
  - 割り当て -> 仕事.実行(): "起動" (accent, dotted-flow)
  - 仕事.実行() -> 呼ばれる側: "呼ぶ" (teal, dotted-flow)

animation:
  - step: "刻む" 1.8s
    focus: ["定時の合図", "割り当て", "定時の合図 -> 割り当て"]
    badge: "刻む"
    description: "定時の合図が 5 分ごとに刻む。"
  - step: "起動" 1.8s
    focus: ["割り当て", "仕事.実行()", "割り当て -> 仕事.実行()"]
    badge: "起動"
    description: "割り当てが仕事を起動する。"
  - step: "呼ぶ" 1.8s
    focus: ["仕事.実行()", "呼ばれる側", "仕事.実行() -> 呼ばれる側"]
    badge: "呼ぶ"
    description: "仕事が呼ばれる側を呼ぶ。"
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
    { "name": "定時の合図", "kind": "actor", "lane": "s", "subtitle": "*/5 * * * *" },
    { "name": "割り当て", "kind": "function", "lane": "j", "subtitle": "起動判定" },
    { "name": "仕事.実行()", "kind": "function", "lane": "j", "stack": 1 },
    { "name": "呼ばれる側", "kind": "function", "lane": "t" }
  ],
  "flow": [
    {
      "from": "定時の合図",
      "to": "割り当て",
      "label": "刻む",
      "tone": "info",
      "style": "dotted-flow"
    },
    {
      "from": "割り当て",
      "to": "仕事.実行()",
      "label": "起動",
      "tone": "accent",
      "style": "dotted-flow"
    },
    {
      "from": "仕事.実行()",
      "to": "呼ばれる側",
      "label": "呼ぶ",
      "tone": "teal",
      "style": "dotted-flow"
    }
  ],
  "animation": [
    {
      "step": "刻む",
      "duration": 1.8,
      "focus": ["定時の合図", "割り当て", "定時の合図 -> 割り当て"],
      "body": "定時の合図が 5 分ごとに刻む。",
      "badge": "刻む"
    },
    {
      "step": "起動",
      "duration": 1.8,
      "focus": ["割り当て", "仕事.実行()", "割り当て -> 仕事.実行()"],
      "body": "割り当てが仕事を起動する。",
      "badge": "起動"
    },
    {
      "step": "呼ぶ",
      "duration": 1.8,
      "focus": ["仕事.実行()", "呼ばれる側", "仕事.実行() -> 呼ばれる側"],
      "body": "仕事が呼ばれる側を呼ぶ。",
      "badge": "呼ぶ"
    }
  ]
}`;

/** 11. Schedule (定期実行) */
export const patternSchedule = diagram("pattern-schedule", { topic: "pattern: Schedule (定期実行)" })
  .lane("s", { x: L3_X1, width: L3_W_LR })
  .lane("j", { x: L3_X2, width: L3_W_C, contain: true })
  .lane("t", { x: L3_X3, width: L3_W_LR })
  .node("cron", { lane: "s", stack: 0, kind: "actor", title: "定時の合図", subtitle: "*/5 * * * *" })
  .node("scheduler", { lane: "j", stack: 0, kind: "function", title: "割り当て", subtitle: "起動判定" })
  .node("job", { lane: "j", stack: 1, kind: "function", title: "仕事.実行()" })
  .node("target", { lane: "t", stack: 0, kind: "function", title: "呼ばれる側" })
  .edge("cron", "scheduler", { id: "e1", label: "刻む", tone: "info", style: "dotted-flow" })
  .edge("scheduler", "job", { id: "e2", label: "起動", tone: "accent", style: "dotted-flow" })
  .edge("job", "target", { id: "e3", label: "呼ぶ", tone: "teal", style: "dotted-flow" })
  .phase("tick", { duration: 1800, title: "刻む", body: "定時の合図が 5 分ごとに刻む。" }, (p: PhaseBuilder) => p.activate("cron", "scheduler", "e1").badge("刻む"))
  .phase("trigger", { duration: 1800, title: "起動", body: "割り当てが仕事を起動する。" }, (p: PhaseBuilder) => p.activate("scheduler", "job", "e2").badge("起動"))
  .phase("invoke", { duration: 1800, title: "呼ぶ", body: "仕事が呼ばれる側を呼ぶ。" }, (p: PhaseBuilder) => p.activate("job", "target", "e3").badge("呼ぶ"))
  .build();

export const sourceYaml__patternValidateProcess = `title: "pattern: Validate → Process (検証後処理)"
type: flow

lanes:
  u: { x: 0, width: 280 }
  v: { x: 520, width: 380, contain: true }
  p: { x: 1140, width: 280 }

actors:
  - 利用者側: { kind: actor, lane: u }
  - 確かめる(入力): { kind: function, lane: v }
  - 形の定め: { kind: storage, lane: v, stack: 1, rows: ["道具: zod / yup"] }
  - 処理する(): { kind: function, lane: p }
  - 検証の失敗: { kind: event, lane: p, stack: 1, posW: 382 }

flow:
  - 利用者側 -> 確かめる(入力): "送る" (accent, dotted-flow)
  - 確かめる(入力) -> 形の定め: "検証" (teal, dotted-flow)
  - 確かめる(入力) -> 処理する(): "合格" (success, dotted-flow)
  - 確かめる(入力) -> 検証の失敗: "不合格" (error, dotted-flow)

animation:
  - step: "送る" 1.5s
    focus: ["利用者側", "確かめる(入力)", "利用者側 -> 確かめる(入力)"]
    badge: "送る"
    description: "利用者側が入力を送る。"
  - step: "検証" 1.5s
    focus: ["確かめる(入力)", "形の定め", "確かめる(入力) -> 形の定め"]
    badge: "検証"
    description: "形の定めで確かめる。"
  - step: "合格" 1.5s
    focus: ["確かめる(入力)", "処理する()", "確かめる(入力) -> 処理する()"]
    badge: "合格"
    description: "確かめられたら処理へ進む。"
  - step: "不合格" 1.5s
    focus: ["確かめる(入力)", "検証の失敗", "確かめる(入力) -> 検証の失敗"]
    badge: "不合格"
    description: "失敗した時は検証の失敗を出す。"
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
    { "name": "利用者側", "kind": "actor", "lane": "u" },
    { "name": "確かめる(入力)", "kind": "function", "lane": "v" },
    { "name": "形の定め", "kind": "storage", "lane": "v", "stack": 1, "rows": ["道具: zod / yup"] },
    { "name": "処理する()", "kind": "function", "lane": "p" },
    { "name": "検証の失敗", "kind": "event", "lane": "p", "stack": 1, "posW": 382 }
  ],
  "flow": [
    {
      "from": "利用者側",
      "to": "確かめる(入力)",
      "label": "送る",
      "tone": "accent",
      "style": "dotted-flow"
    },
    {
      "from": "確かめる(入力)",
      "to": "形の定め",
      "label": "検証",
      "tone": "teal",
      "style": "dotted-flow"
    },
    {
      "from": "確かめる(入力)",
      "to": "処理する()",
      "label": "合格",
      "tone": "success",
      "style": "dotted-flow"
    },
    {
      "from": "確かめる(入力)",
      "to": "検証の失敗",
      "label": "不合格",
      "tone": "error",
      "style": "dotted-flow"
    }
  ],
  "animation": [
    {
      "step": "送る",
      "duration": 1.5,
      "focus": ["利用者側", "確かめる(入力)", "利用者側 -> 確かめる(入力)"],
      "body": "利用者側が入力を送る。",
      "badge": "送る"
    },
    {
      "step": "検証",
      "duration": 1.5,
      "focus": ["確かめる(入力)", "形の定め", "確かめる(入力) -> 形の定め"],
      "body": "形の定めで確かめる。",
      "badge": "検証"
    },
    {
      "step": "合格",
      "duration": 1.5,
      "focus": ["確かめる(入力)", "処理する()", "確かめる(入力) -> 処理する()"],
      "body": "確かめられたら処理へ進む。",
      "badge": "合格"
    },
    {
      "step": "不合格",
      "duration": 1.5,
      "focus": ["確かめる(入力)", "検証の失敗", "確かめる(入力) -> 検証の失敗"],
      "body": "失敗した時は検証の失敗を出す。",
      "badge": "不合格"
    }
  ]
}`;

/** 12. Validate → Process (検証後処理) */
export const patternValidateProcess = diagram("pattern-validate-process", { topic: "pattern: Validate → Process (検証後処理)" })
  .lane("u", { x: L3_X1, width: L3_W_LR })
  .lane("v", { x: L3_X2, width: L3_W_C, contain: true })
  .lane("p", { x: L3_X3, width: L3_W_LR })
  .node("client", { lane: "u", stack: 0, kind: "actor", title: "利用者側" })
  .node("validate", { lane: "v", stack: 0, kind: "function", title: "確かめる(入力)" })
  .node("schema", { lane: "v", stack: 1, kind: "storage", title: "形の定め", rows: ["道具: zod / yup"] })
  .node("process", { lane: "p", stack: 0, kind: "function", title: "処理する()" })
  .node("err", { lane: "p", stack: 1, kind: "event", title: "検証の失敗", w: 382 })
  .edge("client", "validate", { id: "e1", label: "送る", tone: "accent", style: "dotted-flow" })
  .edge("validate", "schema", { id: "e2", label: "検証", tone: "teal", style: "dotted-flow" })
  .edge("validate", "process", { id: "e3", label: "合格", tone: "success", style: "dotted-flow" })
  .edge("validate", "err", { id: "e4", label: "不合格", tone: "error", style: "dotted-flow" })
  .phase("submit", { duration: 1500, title: "送る", body: "利用者側が入力を送る。" }, (p: PhaseBuilder) => p.activate("client", "validate", "e1").badge("送る"))
  .phase("check", { duration: 1500, title: "検証", body: "形の定めで確かめる。" }, (p: PhaseBuilder) => p.activate("validate", "schema", "e2").badge("検証"))
  .phase("ok", { duration: 1500, title: "合格", body: "確かめられたら処理へ進む。" }, (p: PhaseBuilder) => p.activate("validate", "process", "e3").badge("合格"))
  .phase("ng", { duration: 1500, title: "不合格", body: "失敗した時は検証の失敗を出す。" }, (p: PhaseBuilder) => p.activate("validate", "err", "e4").badge("不合格"))
  .build();
