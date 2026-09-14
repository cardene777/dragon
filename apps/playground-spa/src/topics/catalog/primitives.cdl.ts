import { diagram } from "@cardenelabs/cdl";
import type { NodeKind, PhaseBuilder } from "@cardenelabs/cdl";
import { textDslToDiagram } from "@cardenelabs/dragon";

/**
 * Catalog - Primitives ... lane / node の基本パーツ。
 * 全 card で lane width 440 統一 = SVG viewBox 同サイズ = catalog grid 整列。
 */

const W = 440;

/**
 * 1. NodeKind 全 5 種 (actor / function / storage / event / card)。
 *
 * **種別ごとに数の出し場所が違う** (#1196 の実測)。 値の欄を描くのは `actor` だけ、
 * `storage` は行、残り 3 種は副題に出る。 種別の説明を潰さないため、数はその種別が
 * もともと持っている欄に足す。
 */
export const kindActor = diagram("kind-actor", { topic: "kind: actor (外部主体)" })
  .lane("l", { x: 0, width: W })
  .state("v", { initial: 42 })
  .node("a", { lane: "l", stack: 0, kind: "actor", title: "利用者", eyebrow: "外部主体", value: "{v} 人" })
  .phase("p", { duration: 1500, title: "actor", body: "外から関わる主体 (利用者や外部の仕組み)。 値の欄に数を出せる。" }, (p: PhaseBuilder) => p.activate("a").badge("動作中"))
  .phase("p2", { duration: 1500, title: "actor の数が動く", body: "値の欄が段の中で動く。 この欄を描くのは actor だけ。" }, (p: PhaseBuilder) => p.activate("a").tween("v", 42, 137).badge("動作中"))
  .build();

export const kindFunction = diagram("kind-function", { topic: "kind: function (関数呼び出し)" })
  .lane("l", { x: 0, width: W })
  .state("v", { initial: 12 })
  .node("fn", { lane: "l", stack: 0, kind: "function", title: "注文を受ける(要求)", eyebrow: "関数呼び出し", subtitle: "-> 注文か失敗 · 呼出 {v} 回" })
  .phase("p", { duration: 1500, title: "function", body: "処理を受け持つ関数。 題を等幅の字で書き、副題に戻り値を書いて署名に見せる。" }, (p: PhaseBuilder) => p.activate("fn").badge("動作中"))
  .phase("p2", { duration: 1500, title: "function の数が動く", body: "副題の呼出回数が段の中で動く。 署名の形は変えない。" }, (p: PhaseBuilder) => p.activate("fn").tween("v", 12, 480).badge("動作中"))
  .build();

export const kindStorage = diagram("kind-storage", { topic: "kind: storage (保存データ)" })
  .lane("l", { x: 0, width: W })
  .state("v", { initial: 1200 })
  .node("s", { lane: "l", stack: 0, kind: "storage", title: "利用者の表", eyebrow: "保存データ", rows: ["番号: 主キー", "メール: 文字列", "行数: {v}"] })
  .phase("p", { duration: 1500, title: "storage", body: "DB の表。 列を rows に 1 行ずつ書く。" }, (p: PhaseBuilder) => p.activate("s").badge("動作中"))
  .phase("p2", { duration: 1500, title: "storage の数が動く", body: "行の数が段の中で動く。 行も同じ経路で置換される。" }, (p: PhaseBuilder) => p.activate("s").tween("v", 1200, 8400).badge("動作中"))
  .build();

export const kindEvent = diagram("kind-event", { topic: "kind: event (イベントログ)" })
  .lane("l", { x: 0, width: W })
  .state("v", { initial: 3 })
  .node("e", { lane: "l", stack: 0, kind: "event", title: "注文ができた", eyebrow: "イベント", subtitle: "(注文, 利用者) · 毎秒 {v} 件" })
  .phase("p", { duration: 1500, title: "event", body: "発行された出来事。 出来事を配る経路や記録が読む。" }, (p: PhaseBuilder) => p.activate("e").badge("動作中"))
  .phase("p2", { duration: 1500, title: "event の数が動く", body: "副題の発生件数が段の中で動く。 中身の形は変えない。" }, (p: PhaseBuilder) => p.activate("e").tween("v", 3, 96).badge("動作中"))
  .build();

export const kindCard = diagram("kind-card", { topic: "kind: card (汎用情報)" })
  .lane("l", { x: 0, width: W })
  .state("v", { initial: 2 })
  .node("c", { lane: "l", stack: 0, kind: "card", title: "備考", eyebrow: "汎用カード", subtitle: "汎用の説明カード · {v} 件" })
  .phase("p", { duration: 1500, title: "card", body: "kind に当てはまらない補足情報。" }, (p: PhaseBuilder) => p.activate("c").badge("動作中"))
  .phase("p2", { duration: 1500, title: "card の数が動く", body: "副題の件数が段の中で動く。 説明の文は変えない。" }, (p: PhaseBuilder) => p.activate("c").tween("v", 2, 31).badge("動作中"))
  .build();

/** 2. Lane バリエーション */
export const laneSingle = diagram("lane-single", { topic: "lane: 1 本" })
  .lane("only", { x: 0, width: W })
  .node("a", { lane: "only", stack: 0, kind: "actor", title: "A" })
  .node("b", { lane: "only", stack: 1, kind: "function", title: "B" })
  .phase("p", { duration: 1500, title: "1 lane", body: "1 本の lane に node を縦に積む。" }, (p: PhaseBuilder) => p.activate("a", "b").badge("正常"))
  .build();

export const laneMulti = diagram("lane-multi", { topic: "lane: 3 本 (横並び)" })
  .lane("l1", { width: 240 })
  .lane("l2", { width: 240 })
  .lane("l3", { width: 240 })
  .node("a", { lane: "l1", stack: 0, kind: "function", title: "A" })
  .node("b", { lane: "l2", stack: 0, kind: "function", title: "B" })
  .node("c", { lane: "l3", stack: 0, kind: "event", title: "C" })
  .phase("p", { duration: 1500, title: "3 lane", body: "lane を横に並べて役割を分ける (利用者 / 処理 / 出来事)。" }, (p: PhaseBuilder) => p.activate("a", "b", "c").badge("正常"))
  .build();

export const laneContain = diagram("lane-contain", { topic: "lane: contain (枠囲み)" })
  .lane("inner", { x: 0, width: W, contain: true })
  .node("fn", { lane: "inner", stack: 0, kind: "function", title: "内部の処理" })
  .node("st", { lane: "inner", stack: 1, kind: "storage", title: "保存先" })
  .phase("p", { duration: 1500, title: "contain", body: "lane に contain を付けると、 lane ごと枠で囲んで内と外の境を示す。" }, (p: PhaseBuilder) => p.activate("fn", "st").badge("正常"))
  .build();

// ==== #1969 縦列の縦線と図全体の間隔 ここから ====
// ---- 縦列の縦の点線 (lifeline) ----
//
// 順序図は縦列の中心に縦の点線を引くが、`lifeline: true` は他の図種の縦列にも書ける。 段をずらして
// 並べた箱で、線の有無だけが違う 2 枚を切り替える。

export const patternBase__laneLifeline = "引かない";

export const subtitle__laneLifeline =
  "縦列の中心に縦の点線を引く (lifeline)。 段がずれた箱でも、どの縦列に属するかを線で追える";

export const sourceYaml__laneLifeline = `title: "縦列に縦の点線を引かない"
type: flow

lanes:
  l1: { width: 280, label: "利用者" }
  l2: { width: 280, label: "受付の窓口" }

actors:
  - 注文する: { kind: actor, lane: l1, stack: 0 }
  - 受け付ける: { kind: function, lane: l2, stack: 1 }
  - 在庫を引く: { kind: storage, lane: l2, stack: 2 }

flow:
  - 注文する -> 受け付ける: "注文"
  - 受け付ける -> 在庫を引く: "引き当て"

animation:
  - step: "箱の位置だけで縦列を読む" 1.8s
    focus: ["注文する", "受け付ける", "在庫を引く"]
    description: "縦列の見出しの下に線は無い。 段がずれて並ぶと、箱がどの縦列に属するかは箱の位置だけで読む"
`;

export const sourceJson__laneLifeline = `{
  "title": "縦列に縦の点線を引かない",
  "type": "flow",
  "lanes": {
    "l1": { "width": 280, "label": "利用者" },
    "l2": { "width": 280, "label": "受付の窓口" }
  },
  "actors": [
    { "name": "注文する", "kind": "actor", "lane": "l1", "stack": 0 },
    { "name": "受け付ける", "kind": "function", "lane": "l2", "stack": 1 },
    { "name": "在庫を引く", "kind": "storage", "lane": "l2", "stack": 2 }
  ],
  "flow": [
    { "from": "注文する", "to": "受け付ける", "label": "注文" },
    { "from": "受け付ける", "to": "在庫を引く", "label": "引き当て" }
  ],
  "animation": [
    {
      "step": "箱の位置だけで縦列を読む",
      "duration": 1.8,
      "focus": ["注文する", "受け付ける", "在庫を引く"],
      "body": "縦列の見出しの下に線は無い。 段がずれて並ぶと、箱がどの縦列に属するかは箱の位置だけで読む"
    }
  ]
}`;

export const laneLifeline = textDslToDiagram(sourceYaml__laneLifeline);

export const sourceYaml__pattern__laneLifeline__引く = `title: "縦列の中心に縦の点線を引く"
type: flow

lanes:
  l1: { width: 280, label: "利用者", lifeline: true }
  l2: { width: 280, label: "受付の窓口", lifeline: true }

actors:
  - 注文する: { kind: actor, lane: l1, stack: 0 }
  - 受け付ける: { kind: function, lane: l2, stack: 1 }
  - 在庫を引く: { kind: storage, lane: l2, stack: 2 }

flow:
  - 注文する -> 受け付ける: "注文"
  - 受け付ける -> 在庫を引く: "引き当て"

animation:
  - step: "縦の点線で縦列を追う" 1.8s
    focus: ["注文する", "受け付ける", "在庫を引く"]
    description: "縦列の中心を縦の点線が通る。 段がずれて並んでも、箱がどの縦列に属するかを線で上から下まで追える"
`;

export const sourceJson__pattern__laneLifeline__引く = `{
  "title": "縦列の中心に縦の点線を引く",
  "type": "flow",
  "lanes": {
    "l1": { "width": 280, "label": "利用者", "lifeline": true },
    "l2": { "width": 280, "label": "受付の窓口", "lifeline": true }
  },
  "actors": [
    { "name": "注文する", "kind": "actor", "lane": "l1", "stack": 0 },
    { "name": "受け付ける", "kind": "function", "lane": "l2", "stack": 1 },
    { "name": "在庫を引く", "kind": "storage", "lane": "l2", "stack": 2 }
  ],
  "flow": [
    { "from": "注文する", "to": "受け付ける", "label": "注文" },
    { "from": "受け付ける", "to": "在庫を引く", "label": "引き当て" }
  ],
  "animation": [
    {
      "step": "縦の点線で縦列を追う",
      "duration": 1.8,
      "focus": ["注文する", "受け付ける", "在庫を引く"],
      "body": "縦列の中心を縦の点線が通る。 段がずれて並んでも、箱がどの縦列に属するかを線で上から下まで追える"
    }
  ]
}`;

export const pattern__laneLifeline__引く = textDslToDiagram(sourceYaml__pattern__laneLifeline__引く);

// ---- 図全体の間隔と大きさ (viewport) ----
//
// 同じ 3 つの箱と 2 本の矢印で、視点の欄を 1 つずつ書いた切替を並べる。 縦列の横の位置 (`x`) は書かない =
// 書くと縦列がその位置に固定され、縦列の間 (`laneGap`) が効かない (実測)。 縦列の幅 (`laneWidth`) は
// 箱の幅から決まる最小の幅 (390) より大きい値にする = 小さい値は図に出ない。

export const patternBase__viewportSpacing = "書かない";

export const subtitle__viewportSpacing =
  "縦列の間・箱の間・名札の余白・縦列の幅・図の広さ・倍率を、図全体の欄 (viewport) で 1 つずつ変える";

export const sourceYaml__viewportSpacing = `title: "図全体の間隔を書かない"
type: flow

lanes:
  l1: { width: 240, label: "受付" }
  l2: { width: 240, label: "処理" }

actors:
  - 注文: { kind: card, lane: l1, stack: 0 }
  - 問い合わせ: { kind: card, lane: l1, stack: 1 }
  - 発送: { kind: card, lane: l2, stack: 0 }
  - 回答: { kind: card, lane: l2, stack: 1 }

flow:
  - 注文 -> 発送: "依頼"
  - 問い合わせ -> 回答: "転送"

animation:
  - step: "間隔を書かない" 1.8s
    focus: ["注文", "問い合わせ", "発送", "回答", "注文 -> 発送", "問い合わせ -> 回答"]
    description: "縦列の間も箱の間も名札の余白も書かず、描く側が決めた間隔で並べる"
`;

export const sourceJson__viewportSpacing = `{
  "title": "図全体の間隔を書かない",
  "type": "flow",
  "lanes": {
    "l1": { "width": 240, "label": "受付" },
    "l2": { "width": 240, "label": "処理" }
  },
  "actors": [
    { "name": "注文", "kind": "card", "lane": "l1", "stack": 0 },
    { "name": "問い合わせ", "kind": "card", "lane": "l1", "stack": 1 },
    { "name": "発送", "kind": "card", "lane": "l2", "stack": 0 },
    { "name": "回答", "kind": "card", "lane": "l2", "stack": 1 }
  ],
  "flow": [
    { "from": "注文", "to": "発送", "label": "依頼" },
    { "from": "問い合わせ", "to": "回答", "label": "転送" }
  ],
  "animation": [
    {
      "step": "間隔を書かない",
      "duration": 1.8,
      "focus": ["注文", "問い合わせ", "発送", "回答", "注文 -> 発送", "問い合わせ -> 回答"],
      "body": "縦列の間も箱の間も名札の余白も書かず、描く側が決めた間隔で並べる"
    }
  ]
}`;

export const viewportSpacing = textDslToDiagram(sourceYaml__viewportSpacing);

export const sourceYaml__pattern__viewportSpacing__縦列の間 = `title: "縦列の間を広げる"
type: flow

viewport: { laneGap: 400 }

lanes:
  l1: { width: 240, label: "受付" }
  l2: { width: 240, label: "処理" }

actors:
  - 注文: { kind: card, lane: l1, stack: 0 }
  - 問い合わせ: { kind: card, lane: l1, stack: 1 }
  - 発送: { kind: card, lane: l2, stack: 0 }
  - 回答: { kind: card, lane: l2, stack: 1 }

flow:
  - 注文 -> 発送: "依頼"
  - 問い合わせ -> 回答: "転送"

animation:
  - step: "縦列の間を 400 にする" 1.8s
    focus: ["注文", "問い合わせ", "発送", "回答", "注文 -> 発送", "問い合わせ -> 回答"]
    description: "受付と処理の縦列の間が 400 に広がり、横に結ぶ 2 本の矢印が長くなる。 同じ縦列の箱の間は変わらない"
`;

export const sourceJson__pattern__viewportSpacing__縦列の間 = `{
  "title": "縦列の間を広げる",
  "type": "flow",
  "viewport": { "laneGap": 400 },
  "lanes": {
    "l1": { "width": 240, "label": "受付" },
    "l2": { "width": 240, "label": "処理" }
  },
  "actors": [
    { "name": "注文", "kind": "card", "lane": "l1", "stack": 0 },
    { "name": "問い合わせ", "kind": "card", "lane": "l1", "stack": 1 },
    { "name": "発送", "kind": "card", "lane": "l2", "stack": 0 },
    { "name": "回答", "kind": "card", "lane": "l2", "stack": 1 }
  ],
  "flow": [
    { "from": "注文", "to": "発送", "label": "依頼" },
    { "from": "問い合わせ", "to": "回答", "label": "転送" }
  ],
  "animation": [
    {
      "step": "縦列の間を 400 にする",
      "duration": 1.8,
      "focus": ["注文", "問い合わせ", "発送", "回答", "注文 -> 発送", "問い合わせ -> 回答"],
      "body": "受付と処理の縦列の間が 400 に広がり、横に結ぶ 2 本の矢印が長くなる。 同じ縦列の箱の間は変わらない"
    }
  ]
}`;

export const pattern__viewportSpacing__縦列の間 = textDslToDiagram(sourceYaml__pattern__viewportSpacing__縦列の間);

export const sourceYaml__pattern__viewportSpacing__箱の間 = `title: "同じ縦列の箱の間を広げる"
type: flow

viewport: { nodeGap: 80 }

lanes:
  l1: { width: 240, label: "受付" }
  l2: { width: 240, label: "処理" }

actors:
  - 注文: { kind: card, lane: l1, stack: 0 }
  - 問い合わせ: { kind: card, lane: l1, stack: 1 }
  - 発送: { kind: card, lane: l2, stack: 0 }
  - 回答: { kind: card, lane: l2, stack: 1 }

flow:
  - 注文 -> 発送: "依頼"
  - 問い合わせ -> 回答: "転送"

animation:
  - step: "箱の間を 80 にする" 1.8s
    focus: ["注文", "問い合わせ", "発送", "回答", "注文 -> 発送", "問い合わせ -> 回答"]
    description: "同じ縦列で上下に並ぶ注文と問い合わせ、発送と回答の間が広がる。 縦列の間は変わらない"
`;

export const sourceJson__pattern__viewportSpacing__箱の間 = `{
  "title": "同じ縦列の箱の間を広げる",
  "type": "flow",
  "viewport": { "nodeGap": 80 },
  "lanes": {
    "l1": { "width": 240, "label": "受付" },
    "l2": { "width": 240, "label": "処理" }
  },
  "actors": [
    { "name": "注文", "kind": "card", "lane": "l1", "stack": 0 },
    { "name": "問い合わせ", "kind": "card", "lane": "l1", "stack": 1 },
    { "name": "発送", "kind": "card", "lane": "l2", "stack": 0 },
    { "name": "回答", "kind": "card", "lane": "l2", "stack": 1 }
  ],
  "flow": [
    { "from": "注文", "to": "発送", "label": "依頼" },
    { "from": "問い合わせ", "to": "回答", "label": "転送" }
  ],
  "animation": [
    {
      "step": "箱の間を 80 にする",
      "duration": 1.8,
      "focus": ["注文", "問い合わせ", "発送", "回答", "注文 -> 発送", "問い合わせ -> 回答"],
      "body": "同じ縦列で上下に並ぶ注文と問い合わせ、発送と回答の間が広がる。 縦列の間は変わらない"
    }
  ]
}`;

export const pattern__viewportSpacing__箱の間 = textDslToDiagram(sourceYaml__pattern__viewportSpacing__箱の間);

export const sourceYaml__pattern__viewportSpacing__名札の余白 = `title: "矢印の名札の余白を広げる"
type: flow

viewport: { labelMargin: 40 }

lanes:
  l1: { width: 240, label: "受付" }
  l2: { width: 240, label: "処理" }

actors:
  - 注文: { kind: card, lane: l1, stack: 0 }
  - 問い合わせ: { kind: card, lane: l1, stack: 1 }
  - 発送: { kind: card, lane: l2, stack: 0 }
  - 回答: { kind: card, lane: l2, stack: 1 }

flow:
  - 注文 -> 発送: "依頼"
  - 問い合わせ -> 回答: "転送"

animation:
  - step: "名札の余白を 40 にする" 1.8s
    focus: ["注文", "問い合わせ", "発送", "回答", "注文 -> 発送", "問い合わせ -> 回答"]
    description: "依頼と転送の名札が、矢印から離れて上に置かれる。 箱と縦列の位置は変わらない"
`;

export const sourceJson__pattern__viewportSpacing__名札の余白 = `{
  "title": "矢印の名札の余白を広げる",
  "type": "flow",
  "viewport": { "labelMargin": 40 },
  "lanes": {
    "l1": { "width": 240, "label": "受付" },
    "l2": { "width": 240, "label": "処理" }
  },
  "actors": [
    { "name": "注文", "kind": "card", "lane": "l1", "stack": 0 },
    { "name": "問い合わせ", "kind": "card", "lane": "l1", "stack": 1 },
    { "name": "発送", "kind": "card", "lane": "l2", "stack": 0 },
    { "name": "回答", "kind": "card", "lane": "l2", "stack": 1 }
  ],
  "flow": [
    { "from": "注文", "to": "発送", "label": "依頼" },
    { "from": "問い合わせ", "to": "回答", "label": "転送" }
  ],
  "animation": [
    {
      "step": "名札の余白を 40 にする",
      "duration": 1.8,
      "focus": ["注文", "問い合わせ", "発送", "回答", "注文 -> 発送", "問い合わせ -> 回答"],
      "body": "依頼と転送の名札が、矢印から離れて上に置かれる。 箱と縦列の位置は変わらない"
    }
  ]
}`;

export const pattern__viewportSpacing__名札の余白 = textDslToDiagram(sourceYaml__pattern__viewportSpacing__名札の余白);

export const sourceYaml__pattern__viewportSpacing__まとめた間隔 = `title: "間隔をまとめて広げる"
type: flow

viewport: { gap: 120 }

lanes:
  l1: { width: 240, label: "受付" }
  l2: { width: 240, label: "処理" }

actors:
  - 注文: { kind: card, lane: l1, stack: 0 }
  - 問い合わせ: { kind: card, lane: l1, stack: 1 }
  - 発送: { kind: card, lane: l2, stack: 0 }
  - 回答: { kind: card, lane: l2, stack: 1 }

flow:
  - 注文 -> 発送: "依頼"
  - 問い合わせ -> 回答: "転送"

animation:
  - step: "間隔をまとめて 120 にする" 1.8s
    focus: ["注文", "問い合わせ", "発送", "回答", "注文 -> 発送", "問い合わせ -> 回答"]
    description: "縦列の間と箱の間と名札の余白を書かない時に、この 1 つの値が 3 つの代わりに使われ、全てが広がる"
`;

export const sourceJson__pattern__viewportSpacing__まとめた間隔 = `{
  "title": "間隔をまとめて広げる",
  "type": "flow",
  "viewport": { "gap": 120 },
  "lanes": {
    "l1": { "width": 240, "label": "受付" },
    "l2": { "width": 240, "label": "処理" }
  },
  "actors": [
    { "name": "注文", "kind": "card", "lane": "l1", "stack": 0 },
    { "name": "問い合わせ", "kind": "card", "lane": "l1", "stack": 1 },
    { "name": "発送", "kind": "card", "lane": "l2", "stack": 0 },
    { "name": "回答", "kind": "card", "lane": "l2", "stack": 1 }
  ],
  "flow": [
    { "from": "注文", "to": "発送", "label": "依頼" },
    { "from": "問い合わせ", "to": "回答", "label": "転送" }
  ],
  "animation": [
    {
      "step": "間隔をまとめて 120 にする",
      "duration": 1.8,
      "focus": ["注文", "問い合わせ", "発送", "回答", "注文 -> 発送", "問い合わせ -> 回答"],
      "body": "縦列の間と箱の間と名札の余白を書かない時に、この 1 つの値が 3 つの代わりに使われ、全てが広がる"
    }
  ]
}`;

export const pattern__viewportSpacing__まとめた間隔 = textDslToDiagram(sourceYaml__pattern__viewportSpacing__まとめた間隔);

export const sourceYaml__pattern__viewportSpacing__縦列の幅 = `title: "全ての縦列の幅を揃える"
type: flow

viewport: { laneWidth: 520 }

lanes:
  l1: { width: 240, label: "受付" }
  l2: { width: 240, label: "処理" }

actors:
  - 注文: { kind: card, lane: l1, stack: 0 }
  - 問い合わせ: { kind: card, lane: l1, stack: 1 }
  - 発送: { kind: card, lane: l2, stack: 0 }
  - 回答: { kind: card, lane: l2, stack: 1 }

flow:
  - 注文 -> 発送: "依頼"
  - 問い合わせ -> 回答: "転送"

animation:
  - step: "縦列の幅を 520 に揃える" 1.8s
    focus: ["注文", "問い合わせ", "発送", "回答", "注文 -> 発送", "問い合わせ -> 回答"]
    description: "縦列ごとに書いた幅 240 より、図全体に書いた 520 が勝つ。 箱は広がった縦列の中央に置かれる"
`;

export const sourceJson__pattern__viewportSpacing__縦列の幅 = `{
  "title": "全ての縦列の幅を揃える",
  "type": "flow",
  "viewport": { "laneWidth": 520 },
  "lanes": {
    "l1": { "width": 240, "label": "受付" },
    "l2": { "width": 240, "label": "処理" }
  },
  "actors": [
    { "name": "注文", "kind": "card", "lane": "l1", "stack": 0 },
    { "name": "問い合わせ", "kind": "card", "lane": "l1", "stack": 1 },
    { "name": "発送", "kind": "card", "lane": "l2", "stack": 0 },
    { "name": "回答", "kind": "card", "lane": "l2", "stack": 1 }
  ],
  "flow": [
    { "from": "注文", "to": "発送", "label": "依頼" },
    { "from": "問い合わせ", "to": "回答", "label": "転送" }
  ],
  "animation": [
    {
      "step": "縦列の幅を 520 に揃える",
      "duration": 1.8,
      "focus": ["注文", "問い合わせ", "発送", "回答", "注文 -> 発送", "問い合わせ -> 回答"],
      "body": "縦列ごとに書いた幅 240 より、図全体に書いた 520 が勝つ。 箱は広がった縦列の中央に置かれる"
    }
  ]
}`;

export const pattern__viewportSpacing__縦列の幅 = textDslToDiagram(sourceYaml__pattern__viewportSpacing__縦列の幅);

export const sourceYaml__pattern__viewportSpacing__図の広さ = `title: "図を描く広さを決める"
type: flow

viewport: { width: 1400, height: 800 }

lanes:
  l1: { width: 240, label: "受付" }
  l2: { width: 240, label: "処理" }

actors:
  - 注文: { kind: card, lane: l1, stack: 0 }
  - 問い合わせ: { kind: card, lane: l1, stack: 1 }
  - 発送: { kind: card, lane: l2, stack: 0 }
  - 回答: { kind: card, lane: l2, stack: 1 }

flow:
  - 注文 -> 発送: "依頼"
  - 問い合わせ -> 回答: "転送"

animation:
  - step: "広さを横 1400 と縦 800 にする" 1.8s
    focus: ["注文", "問い合わせ", "発送", "回答", "注文 -> 発送", "問い合わせ -> 回答"]
    description: "図を描く広さが横 1400、縦 800 になる。 箱の置き方は変わらず、右と下に余白が残る"
`;

export const sourceJson__pattern__viewportSpacing__図の広さ = `{
  "title": "図を描く広さを決める",
  "type": "flow",
  "viewport": { "width": 1400, "height": 800 },
  "lanes": {
    "l1": { "width": 240, "label": "受付" },
    "l2": { "width": 240, "label": "処理" }
  },
  "actors": [
    { "name": "注文", "kind": "card", "lane": "l1", "stack": 0 },
    { "name": "問い合わせ", "kind": "card", "lane": "l1", "stack": 1 },
    { "name": "発送", "kind": "card", "lane": "l2", "stack": 0 },
    { "name": "回答", "kind": "card", "lane": "l2", "stack": 1 }
  ],
  "flow": [
    { "from": "注文", "to": "発送", "label": "依頼" },
    { "from": "問い合わせ", "to": "回答", "label": "転送" }
  ],
  "animation": [
    {
      "step": "広さを横 1400 と縦 800 にする",
      "duration": 1.8,
      "focus": ["注文", "問い合わせ", "発送", "回答", "注文 -> 発送", "問い合わせ -> 回答"],
      "body": "図を描く広さが横 1400、縦 800 になる。 箱の置き方は変わらず、右と下に余白が残る"
    }
  ]
}`;

export const pattern__viewportSpacing__図の広さ = textDslToDiagram(sourceYaml__pattern__viewportSpacing__図の広さ);

export const sourceYaml__pattern__viewportSpacing__倍率 = `title: "図を大きく描く"
type: flow

viewport: { scale: 1.5 }

lanes:
  l1: { width: 240, label: "受付" }
  l2: { width: 240, label: "処理" }

actors:
  - 注文: { kind: card, lane: l1, stack: 0 }
  - 問い合わせ: { kind: card, lane: l1, stack: 1 }
  - 発送: { kind: card, lane: l2, stack: 0 }
  - 回答: { kind: card, lane: l2, stack: 1 }

flow:
  - 注文 -> 発送: "依頼"
  - 問い合わせ -> 回答: "転送"

animation:
  - step: "1.5 倍で描く" 1.8s
    focus: ["注文", "問い合わせ", "発送", "回答", "注文 -> 発送", "問い合わせ -> 回答"]
    description: "箱と字と線を 1.5 倍の大きさで描く。 置き方は書かない図と同じで、描く大きさだけが変わる"
`;

export const sourceJson__pattern__viewportSpacing__倍率 = `{
  "title": "図を大きく描く",
  "type": "flow",
  "viewport": { "scale": 1.5 },
  "lanes": {
    "l1": { "width": 240, "label": "受付" },
    "l2": { "width": 240, "label": "処理" }
  },
  "actors": [
    { "name": "注文", "kind": "card", "lane": "l1", "stack": 0 },
    { "name": "問い合わせ", "kind": "card", "lane": "l1", "stack": 1 },
    { "name": "発送", "kind": "card", "lane": "l2", "stack": 0 },
    { "name": "回答", "kind": "card", "lane": "l2", "stack": 1 }
  ],
  "flow": [
    { "from": "注文", "to": "発送", "label": "依頼" },
    { "from": "問い合わせ", "to": "回答", "label": "転送" }
  ],
  "animation": [
    {
      "step": "1.5 倍で描く",
      "duration": 1.8,
      "focus": ["注文", "問い合わせ", "発送", "回答", "注文 -> 発送", "問い合わせ -> 回答"],
      "body": "箱と字と線を 1.5 倍の大きさで描く。 置き方は書かない図と同じで、描く大きさだけが変わる"
    }
  ]
}`;

export const pattern__viewportSpacing__倍率 = textDslToDiagram(sourceYaml__pattern__viewportSpacing__倍率);

// ==== #1969 縦列の縦線と図全体の間隔 ここまで ====

// ==== #1969 並ぶ向きと始まりと終わり ここから ====
// ---- 流れ図の並ぶ向き (direction) ----
//
// 向きは流れ図と担当の図だけに効く。 箱に縦列を書くと縦列が勝つので、縦列を書かない 2 つの箱で比べる。

export const patternBase__flowDirection = "書かない";

export const subtitle__flowDirection =
  "流れ図の並ぶ向きを書く (direction)。 縦は 1 つの縦列に積み、横は 1 人ずつ縦列を作る";

export const sourceYaml__flowDirection = `title: "流れ図の並ぶ向きを書かない"
type: flow

actors:
  - 申し込む: { kind: card }
  - 登録する: { kind: card }

flow:
  - 申し込む -> 登録する: "申込書"

animation:
  - step: "書かない時の並び" 1.8s
    focus: ["申し込む", "登録する"]
    description: "流れ図は向きを書かないと、1 つの縦列に上から積む"
`;

export const sourceJson__flowDirection = `{
  "title": "流れ図の並ぶ向きを書かない",
  "type": "flow",
  "actors": [
    { "name": "申し込む", "kind": "card" },
    { "name": "登録する", "kind": "card" }
  ],
  "flow": [
    { "from": "申し込む", "to": "登録する", "label": "申込書" }
  ],
  "animation": [
    {
      "step": "書かない時の並び",
      "duration": 1.8,
      "focus": ["申し込む", "登録する"],
      "body": "流れ図は向きを書かないと、1 つの縦列に上から積む"
    }
  ]
}`;

export const flowDirection = textDslToDiagram(sourceYaml__flowDirection);

export const sourceYaml__pattern__flowDirection__縦に積む = `title: "流れ図を縦に積む"
type: flow
direction: vertical

actors:
  - 申し込む: { kind: card }
  - 登録する: { kind: card }

flow:
  - 申し込む -> 登録する: "申込書"

animation:
  - step: "縦に積む" 1.8s
    focus: ["申し込む", "登録する"]
    description: "縦に積むと書くと、1 つの縦列に上から積む。 流れ図では書かない時と同じ並びになる"
`;

export const sourceJson__pattern__flowDirection__縦に積む = `{
  "title": "流れ図を縦に積む",
  "type": "flow",
  "direction": "vertical",
  "actors": [
    { "name": "申し込む", "kind": "card" },
    { "name": "登録する", "kind": "card" }
  ],
  "flow": [
    { "from": "申し込む", "to": "登録する", "label": "申込書" }
  ],
  "animation": [
    {
      "step": "縦に積む",
      "duration": 1.8,
      "focus": ["申し込む", "登録する"],
      "body": "縦に積むと書くと、1 つの縦列に上から積む。 流れ図では書かない時と同じ並びになる"
    }
  ]
}`;

export const pattern__flowDirection__縦に積む = textDslToDiagram(sourceYaml__pattern__flowDirection__縦に積む);

export const sourceYaml__pattern__flowDirection__横に並べる = `title: "流れ図を横に並べる"
type: flow
direction: horizontal

actors:
  - 申し込む: { kind: card }
  - 登録する: { kind: card }

flow:
  - 申し込む -> 登録する: "申込書"

animation:
  - step: "横に並べる" 1.8s
    focus: ["申し込む", "登録する"]
    description: "横に並べると書くと、1 人ずつ縦列を作って左から並べる"
`;

export const sourceJson__pattern__flowDirection__横に並べる = `{
  "title": "流れ図を横に並べる",
  "type": "flow",
  "direction": "horizontal",
  "actors": [
    { "name": "申し込む", "kind": "card" },
    { "name": "登録する", "kind": "card" }
  ],
  "flow": [
    { "from": "申し込む", "to": "登録する", "label": "申込書" }
  ],
  "animation": [
    {
      "step": "横に並べる",
      "duration": 1.8,
      "focus": ["申し込む", "登録する"],
      "body": "横に並べると書くと、1 人ずつ縦列を作って左から並べる"
    }
  ]
}`;

export const pattern__flowDirection__横に並べる = textDslToDiagram(sourceYaml__pattern__flowDirection__横に並べる);

// ---- 状態の始まりと終わり (initial / final) ----
//
// 書かない図は並びの最初と最後で決まる。 書くと書いた箱だけが始まりと終わりになり、終わりを 2 つ持てる。

export const patternBase__stateStartEnd = "書かない";

export const subtitle__stateStartEnd =
  "状態の図の始まりと終わりを箱に書く (initial / final)。 書かない図は並びの最初と最後で決まる";

export const sourceYaml__stateStartEnd = `title: "状態の始まりと終わりを書かない"
type: state

actors:
  - 受付: { kind: card, posW: 240 }
  - 完了: { kind: card, posW: 240 }
  - 取り下げ: { kind: card, posW: 240 }

flow:
  - 受付 -> 完了: "承認"
  - 受付 -> 取り下げ: "撤回"

animation:
  - step: "並びで決まる札" 1.8s
    focus: ["受付", "完了", "取り下げ"]
    description: "書かない図は、最初に書いた受付が「初期」、最後に書いた取り下げだけが「最終」 になる"
`;

export const sourceJson__stateStartEnd = `{
  "title": "状態の始まりと終わりを書かない",
  "type": "state",
  "actors": [
    { "name": "受付", "kind": "card", "posW": 240 },
    { "name": "完了", "kind": "card", "posW": 240 },
    { "name": "取り下げ", "kind": "card", "posW": 240 }
  ],
  "flow": [
    { "from": "受付", "to": "完了", "label": "承認" },
    { "from": "受付", "to": "取り下げ", "label": "撤回" }
  ],
  "animation": [
    {
      "step": "並びで決まる札",
      "duration": 1.8,
      "focus": ["受付", "完了", "取り下げ"],
      "body": "書かない図は、最初に書いた受付が「初期」、最後に書いた取り下げだけが「最終」 になる"
    }
  ]
}`;

export const stateStartEnd = textDslToDiagram(sourceYaml__stateStartEnd);

export const sourceYaml__pattern__stateStartEnd__書く = `title: "状態の始まりと終わりを書く"
type: state

actors:
  - 受付: { kind: card, posW: 240, initial: true }
  - 完了: { kind: card, posW: 240, final: true }
  - 取り下げ: { kind: card, posW: 240, final: true }

flow:
  - 受付 -> 完了: "承認"
  - 受付 -> 取り下げ: "撤回"

animation:
  - step: "始まりと終わりの札" 1.8s
    focus: ["受付", "完了", "取り下げ"]
    description: "始まりと書いた受付に「初期」、終わりと書いた完了と取り下げの 2 つに「最終」 の札が付く"
`;

export const sourceJson__pattern__stateStartEnd__書く = `{
  "title": "状態の始まりと終わりを書く",
  "type": "state",
  "actors": [
    { "name": "受付", "kind": "card", "posW": 240, "initial": true },
    { "name": "完了", "kind": "card", "posW": 240, "final": true },
    { "name": "取り下げ", "kind": "card", "posW": 240, "final": true }
  ],
  "flow": [
    { "from": "受付", "to": "完了", "label": "承認" },
    { "from": "受付", "to": "取り下げ", "label": "撤回" }
  ],
  "animation": [
    {
      "step": "始まりと終わりの札",
      "duration": 1.8,
      "focus": ["受付", "完了", "取り下げ"],
      "body": "始まりと書いた受付に「初期」、終わりと書いた完了と取り下げの 2 つに「最終」 の札が付く"
    }
  ]
}`;

export const pattern__stateStartEnd__書く = textDslToDiagram(sourceYaml__pattern__stateStartEnd__書く);
// ==== #1969 並ぶ向きと始まりと終わり ここまで ====

// ==== #1971 位置のずらし ここから ====
// ---- 位置のずらし (pos / offsetX / offsetY) ----
//
// 箱と縦列と矢印の名前を、自動で決まった位置からずらす。 JSON は `pos`、記法は箱と縦列が
// `offsetX` / `offsetY`、矢印は名前のずらし (`labelOffsetX` / `labelOffsetY`) で書き、同じ図になる。

export const patternBase__layoutOffset = "ずらさない";

export const subtitle__layoutOffset =
  "箱と縦列と矢印の名前を、自動で決まった位置から書いた量だけずらす。 記法と JSON で書き方が違い、同じ図になる";

export const sourceYaml__layoutOffset = `title: "位置をずらさない"
type: flow

lanes:
  l1: { width: 280, label: "利用者" }
  l2: { width: 280, label: "受付の窓口" }

actors:
  - 注文する: { kind: actor, lane: l1, stack: 0 }
  - 受け付ける: { kind: function, lane: l2, stack: 1 }
  - 在庫を引く: { kind: storage, lane: l2, stack: 2 }

flow:
  - 注文する -> 受け付ける: "注文"
  - 受け付ける -> 在庫を引く: "引き当て"

animation:
  - step: "自動で決まった位置に置く" 1.8s
    focus: ["注文する", "受け付ける", "在庫を引く", "注文する -> 受け付ける"]
    description: "位置のずらしを書かず、縦列と段から決まった位置に箱と縦列と矢印の名前を置く"
`;

export const sourceJson__layoutOffset = `{
  "title": "位置をずらさない",
  "type": "flow",
  "lanes": {
    "l1": { "width": 280, "label": "利用者" },
    "l2": { "width": 280, "label": "受付の窓口" }
  },
  "actors": [
    { "name": "注文する", "kind": "actor", "lane": "l1", "stack": 0 },
    { "name": "受け付ける", "kind": "function", "lane": "l2", "stack": 1 },
    { "name": "在庫を引く", "kind": "storage", "lane": "l2", "stack": 2 }
  ],
  "flow": [
    { "from": "注文する", "to": "受け付ける", "label": "注文" },
    { "from": "受け付ける", "to": "在庫を引く", "label": "引き当て" }
  ],
  "animation": [
    {
      "step": "自動で決まった位置に置く",
      "duration": 1.8,
      "focus": ["注文する", "受け付ける", "在庫を引く", "注文する -> 受け付ける"],
      "body": "位置のずらしを書かず、縦列と段から決まった位置に箱と縦列と矢印の名前を置く"
    }
  ]
}`;

export const layoutOffset = textDslToDiagram(sourceYaml__layoutOffset);

export const sourceYaml__pattern__layoutOffset__箱をずらす = `title: "箱を自動で決まった位置からずらす"
type: flow

lanes:
  l1: { width: 280, label: "利用者" }
  l2: { width: 280, label: "受付の窓口" }

actors:
  - 注文する: { kind: actor, lane: l1, stack: 0, offsetX: 40, offsetY: 60 }
  - 受け付ける: { kind: function, lane: l2, stack: 1 }
  - 在庫を引く: { kind: storage, lane: l2, stack: 2 }

flow:
  - 注文する -> 受け付ける: "注文"
  - 受け付ける -> 在庫を引く: "引き当て"

animation:
  - step: "注文するの箱を右へ 40、下へ 60 ずらす" 1.8s
    focus: ["注文する", "受け付ける", "在庫を引く", "注文する -> 受け付ける"]
    description: "注文するの箱だけが右へ 40、下へ 60 動き、矢印は動いた箱から出る。 縦列と他の箱は動かない"
`;

export const sourceJson__pattern__layoutOffset__箱をずらす = `{
  "title": "箱を自動で決まった位置からずらす",
  "type": "flow",
  "lanes": {
    "l1": { "width": 280, "label": "利用者" },
    "l2": { "width": 280, "label": "受付の窓口" }
  },
  "actors": [
    { "name": "注文する", "kind": "actor", "lane": "l1", "stack": 0, "pos": { "x": 40, "y": 60 } },
    { "name": "受け付ける", "kind": "function", "lane": "l2", "stack": 1 },
    { "name": "在庫を引く", "kind": "storage", "lane": "l2", "stack": 2 }
  ],
  "flow": [
    { "from": "注文する", "to": "受け付ける", "label": "注文" },
    { "from": "受け付ける", "to": "在庫を引く", "label": "引き当て" }
  ],
  "animation": [
    {
      "step": "注文するの箱を右へ 40、下へ 60 ずらす",
      "duration": 1.8,
      "focus": ["注文する", "受け付ける", "在庫を引く", "注文する -> 受け付ける"],
      "body": "注文するの箱だけが右へ 40、下へ 60 動き、矢印は動いた箱から出る。 縦列と他の箱は動かない"
    }
  ]
}`;

export const pattern__layoutOffset__箱をずらす = textDslToDiagram(sourceYaml__pattern__layoutOffset__箱をずらす);

export const sourceYaml__pattern__layoutOffset__縦列をずらす = `title: "縦列を自動で決まった位置からずらす"
type: flow

lanes:
  l1: { width: 280, label: "利用者" }
  l2: { width: 280, label: "受付の窓口", offsetX: 120, offsetY: 40 }

actors:
  - 注文する: { kind: actor, lane: l1, stack: 0 }
  - 受け付ける: { kind: function, lane: l2, stack: 1 }
  - 在庫を引く: { kind: storage, lane: l2, stack: 2 }

flow:
  - 注文する -> 受け付ける: "注文"
  - 受け付ける -> 在庫を引く: "引き当て"

animation:
  - step: "受付の窓口の縦列を右へ 120、下へ 40 ずらす" 1.8s
    focus: ["注文する", "受け付ける", "在庫を引く", "注文する -> 受け付ける"]
    description: "受付の窓口の縦列が右へ 120、下へ 40 動き、中の 2 つの箱も一緒に動く。 縦列の幅と高さと、利用者の縦列は変わらない"
`;

export const sourceJson__pattern__layoutOffset__縦列をずらす = `{
  "title": "縦列を自動で決まった位置からずらす",
  "type": "flow",
  "lanes": {
    "l1": { "width": 280, "label": "利用者" },
    "l2": { "width": 280, "label": "受付の窓口", "pos": { "x": 120, "y": 40 } }
  },
  "actors": [
    { "name": "注文する", "kind": "actor", "lane": "l1", "stack": 0 },
    { "name": "受け付ける", "kind": "function", "lane": "l2", "stack": 1 },
    { "name": "在庫を引く", "kind": "storage", "lane": "l2", "stack": 2 }
  ],
  "flow": [
    { "from": "注文する", "to": "受け付ける", "label": "注文" },
    { "from": "受け付ける", "to": "在庫を引く", "label": "引き当て" }
  ],
  "animation": [
    {
      "step": "受付の窓口の縦列を右へ 120、下へ 40 ずらす",
      "duration": 1.8,
      "focus": ["注文する", "受け付ける", "在庫を引く", "注文する -> 受け付ける"],
      "body": "受付の窓口の縦列が右へ 120、下へ 40 動き、中の 2 つの箱も一緒に動く。 縦列の幅と高さと、利用者の縦列は変わらない"
    }
  ]
}`;

export const pattern__layoutOffset__縦列をずらす = textDslToDiagram(sourceYaml__pattern__layoutOffset__縦列をずらす);

export const sourceYaml__pattern__layoutOffset__矢印の名前をずらす = `title: "矢印の名前を自動で決まった位置からずらす"
type: flow

lanes:
  l1: { width: 280, label: "利用者" }
  l2: { width: 280, label: "受付の窓口" }

actors:
  - 注文する: { kind: actor, lane: l1, stack: 0 }
  - 受け付ける: { kind: function, lane: l2, stack: 1 }
  - 在庫を引く: { kind: storage, lane: l2, stack: 2 }

flow:
  - 注文する -> 受け付ける: "注文" { labelOffsetX: 40, labelOffsetY: -24 }
  - 受け付ける -> 在庫を引く: "引き当て"

animation:
  - step: "注文の名前を右へ 40、上へ 24 ずらす" 1.8s
    focus: ["注文する", "受け付ける", "在庫を引く", "注文する -> 受け付ける"]
    description: "注文の矢印の名前だけが右へ 40、上へ 24 動く。 矢印の線と箱は動かない"
`;

export const sourceJson__pattern__layoutOffset__矢印の名前をずらす = `{
  "title": "矢印の名前を自動で決まった位置からずらす",
  "type": "flow",
  "lanes": {
    "l1": { "width": 280, "label": "利用者" },
    "l2": { "width": 280, "label": "受付の窓口" }
  },
  "actors": [
    { "name": "注文する", "kind": "actor", "lane": "l1", "stack": 0 },
    { "name": "受け付ける", "kind": "function", "lane": "l2", "stack": 1 },
    { "name": "在庫を引く", "kind": "storage", "lane": "l2", "stack": 2 }
  ],
  "flow": [
    { "from": "注文する", "to": "受け付ける", "label": "注文", "pos": { "x": 40, "y": -24 } },
    { "from": "受け付ける", "to": "在庫を引く", "label": "引き当て" }
  ],
  "animation": [
    {
      "step": "注文の名前を右へ 40、上へ 24 ずらす",
      "duration": 1.8,
      "focus": ["注文する", "受け付ける", "在庫を引く", "注文する -> 受け付ける"],
      "body": "注文の矢印の名前だけが右へ 40、上へ 24 動く。 矢印の線と箱は動かない"
    }
  ]
}`;

export const pattern__layoutOffset__矢印の名前をずらす = textDslToDiagram(sourceYaml__pattern__layoutOffset__矢印の名前をずらす);

// ==== #1971 位置のずらし ここまで ====

// ==== #1972 縦列の組 ここから ====
// ---- 縦列の組 (groups) ----
//
// 並べた縦列のうち何本かを 1 つの枠で囲む。 箱の種別は `card` にし、矢印の名前は 2 字にする =
// 箱と名前が広いと 3 本の縦列で横 1602 を超え、一覧の枠で箱の題が 12px を割る (実測 = 1620 で 11.9px)。

export const patternBase__laneGroup = "書かない";

export const subtitle__laneGroup =
  "並べた縦列のうち何本かを 1 つの組にまとめ、束ねた縦列と中の箱を枠で囲む";

export const sourceYaml__laneGroup = `title: "縦列を組で束ねない"
type: flow

lanes:
  web: { label: "受付の層" }
  app: { label: "処理の層" }
  db: { label: "保存の層" }

actors:
  - 利用者: { kind: card, lane: web }
  - 注文の処理: { kind: card, lane: app }
  - 注文の台帳: { kind: card, lane: db }

flow:
  - 利用者 -> 注文の処理: "依頼"
  - 注文の処理 -> 注文の台帳: "保存"

animation:
  - step: "縦列を 1 本ずつ並べる" 1.8s
    focus: ["利用者", "注文の処理", "注文の台帳"]
    description: "組を書かず、受付の層と処理の層と保存の層を枠で囲まずに横へ並べる"
`;

export const sourceJson__laneGroup = `{
  "title": "縦列を組で束ねない",
  "type": "flow",
  "lanes": {
    "web": { "label": "受付の層" },
    "app": { "label": "処理の層" },
    "db": { "label": "保存の層" }
  },
  "actors": [
    { "name": "利用者", "kind": "card", "lane": "web" },
    { "name": "注文の処理", "kind": "card", "lane": "app" },
    { "name": "注文の台帳", "kind": "card", "lane": "db" }
  ],
  "flow": [
    { "from": "利用者", "to": "注文の処理", "label": "依頼" },
    { "from": "注文の処理", "to": "注文の台帳", "label": "保存" }
  ],
  "animation": [
    {
      "step": "縦列を 1 本ずつ並べる",
      "duration": 1.8,
      "focus": ["利用者", "注文の処理", "注文の台帳"],
      "body": "組を書かず、受付の層と処理の層と保存の層を枠で囲まずに横へ並べる"
    }
  ]
}`;

export const laneGroup = textDslToDiagram(sourceYaml__laneGroup);

export const sourceYaml__pattern__laneGroup__縦列を束ねる = `title: "処理と保存の縦列を 1 つの組で囲む"
type: flow

lanes:
  web: { label: "受付の層" }
  app: { label: "処理の層" }
  db: { label: "保存の層" }

groups:
  inside: { label: "社内の網", lanes: [app, db] }

actors:
  - 利用者: { kind: card, lane: web }
  - 注文の処理: { kind: card, lane: app }
  - 注文の台帳: { kind: card, lane: db }

flow:
  - 利用者 -> 注文の処理: "依頼"
  - 注文の処理 -> 注文の台帳: "保存"

animation:
  - step: "社内の網で 2 本の縦列を囲む" 1.8s
    focus: ["利用者", "注文の処理", "注文の台帳"]
    description: "社内の網の枠が処理の層と保存の層と中の箱を囲み、受付の層は枠の外に残る。 縦列と箱の位置は束ねない図と同じ"
`;

export const sourceJson__pattern__laneGroup__縦列を束ねる = `{
  "title": "処理と保存の縦列を 1 つの組で囲む",
  "type": "flow",
  "lanes": {
    "web": { "label": "受付の層" },
    "app": { "label": "処理の層" },
    "db": { "label": "保存の層" }
  },
  "groups": {
    "inside": { "label": "社内の網", "lanes": ["app", "db"] }
  },
  "actors": [
    { "name": "利用者", "kind": "card", "lane": "web" },
    { "name": "注文の処理", "kind": "card", "lane": "app" },
    { "name": "注文の台帳", "kind": "card", "lane": "db" }
  ],
  "flow": [
    { "from": "利用者", "to": "注文の処理", "label": "依頼" },
    { "from": "注文の処理", "to": "注文の台帳", "label": "保存" }
  ],
  "animation": [
    {
      "step": "社内の網で 2 本の縦列を囲む",
      "duration": 1.8,
      "focus": ["利用者", "注文の処理", "注文の台帳"],
      "body": "社内の網の枠が処理の層と保存の層と中の箱を囲み、受付の層は枠の外に残る。 縦列と箱の位置は束ねない図と同じ"
    }
  ]
}`;

export const pattern__laneGroup__縦列を束ねる = textDslToDiagram(sourceYaml__pattern__laneGroup__縦列を束ねる);

export const sourceYaml__pattern__laneGroup__2つの組 = `title: "組を 2 つ書いて縦列を分けて囲む"
type: flow

lanes:
  web: { label: "受付の層" }
  app: { label: "処理の層" }
  db: { label: "保存の層" }

groups:
  front: { label: "社外", lanes: [web] }
  inside: { label: "社内の網", lanes: [app, db] }

actors:
  - 利用者: { kind: card, lane: web }
  - 注文の処理: { kind: card, lane: app }
  - 注文の台帳: { kind: card, lane: db }

flow:
  - 利用者 -> 注文の処理: "依頼"
  - 注文の処理 -> 注文の台帳: "保存"

animation:
  - step: "社外と社内の網を別の枠で囲む" 1.8s
    focus: ["利用者", "注文の処理", "注文の台帳"]
    description: "社外の枠が受付の層を、社内の網の枠が処理の層と保存の層を囲む。 依頼の矢印は 2 つの枠の間を渡る"
`;

export const sourceJson__pattern__laneGroup__2つの組 = `{
  "title": "組を 2 つ書いて縦列を分けて囲む",
  "type": "flow",
  "lanes": {
    "web": { "label": "受付の層" },
    "app": { "label": "処理の層" },
    "db": { "label": "保存の層" }
  },
  "groups": {
    "front": { "label": "社外", "lanes": ["web"] },
    "inside": { "label": "社内の網", "lanes": ["app", "db"] }
  },
  "actors": [
    { "name": "利用者", "kind": "card", "lane": "web" },
    { "name": "注文の処理", "kind": "card", "lane": "app" },
    { "name": "注文の台帳", "kind": "card", "lane": "db" }
  ],
  "flow": [
    { "from": "利用者", "to": "注文の処理", "label": "依頼" },
    { "from": "注文の処理", "to": "注文の台帳", "label": "保存" }
  ],
  "animation": [
    {
      "step": "社外と社内の網を別の枠で囲む",
      "duration": 1.8,
      "focus": ["利用者", "注文の処理", "注文の台帳"],
      "body": "社外の枠が受付の層を、社内の網の枠が処理の層と保存の層を囲む。 依頼の矢印は 2 つの枠の間を渡る"
    }
  ]
}`;

export const pattern__laneGroup__2つの組 = textDslToDiagram(sourceYaml__pattern__laneGroup__2つの組);

// ==== #1972 縦列の組 ここまで ====

/** 3. Node stack バリエーション */
export const stackPair = diagram("stack-pair", { topic: "stack: 縦 2 段" })
  .lane("l", { x: 0, width: W })
  .node("top", { lane: "l", stack: 0, kind: "actor", title: "上" })
  .node("bot", { lane: "l", stack: 1, kind: "actor", title: "下" })
  .phase("p", { duration: 1500, title: "stack 0/1", body: "同じ lane の中で、 stack の番号が縦の並びを決める。" }, (p: PhaseBuilder) => p.activate("top", "bot").badge("正常"))
  .build();

export const stackTriple = diagram("stack-triple", { topic: "stack: 縦 3 段" })
  .lane("l", { x: 0, width: W })
  .node("a", { lane: "l", stack: 0, kind: "actor", title: "stack 0" })
  .node("b", { lane: "l", stack: 1, kind: "function", title: "stack 1" })
  .node("c", { lane: "l", stack: 2, kind: "storage", title: "stack 2" })
  .phase("p", { duration: 1500, title: "stack 0/1/2", body: "stack を増やすと縦に伸びる。 間隔は row_gap が自動で決める。" }, (p: PhaseBuilder) => p.activate("a", "b", "c").badge("正常"))
  .build();

/**
 * 形の見本 1 件 (#1196)。
 *
 * **動かすのはその形が表すものの数量だけ**。 題 (`title`) と目次 (`eyebrow`) は形の見本と
 * しての説明なので段をまたいで変えない。 数は副題に置く = 値の欄 (`node.value`) を描くのは
 * `ActorNode` と `GenericNode` の 2 経路だけで、`shape-*` はそこに含まれない (#1194 の実測)。
 *
 * 段は 2 つ。 1 段目が今の数、2 段目でそこから動かす。 段の中の値は整数に丸められるため
 * (cdl の `computeStateValues` が `Math.round`)、`from` / `to` は整数で書く。
 */
type ShapeSpec = {
  id: string;
  kind: NodeKind;
  title: string;
  eyebrow: string;
  /** 段の題と説明 */
  phase: { title: string; body: string };
  topic: string;
  /** 副題。 `{v}` の位置に数が入る。 省略した見本は動かない (理由を添えて 1 件ずつ書く) */
  subtitle?: string;
  metric?: { from: number; to: number };
  w?: number;
};

function shapeSample(spec: ShapeSpec) {
  const d = diagram(spec.id, { structuredData: "exclude", topic: spec.topic }).lane("l", { x: 0, width: W });
  if (spec.metric) d.state("v", { initial: spec.metric.from });
  d.node("n", {
    lane: "l",
    stack: 0,
    kind: spec.kind,
    title: spec.title,
    eyebrow: spec.eyebrow,
    ...(spec.subtitle ? { subtitle: spec.subtitle } : {}),
    ...(spec.w ? { w: spec.w } : {}),
  });
  d.phase("p", { duration: 1500, title: spec.phase.title, body: spec.phase.body }, (p: PhaseBuilder) =>
    p.activate("n").badge("shape"),
  );
  if (spec.metric) {
    const { from, to } = spec.metric;
    d.phase(
      "p2",
      { duration: 1500, title: `${spec.phase.title} の数が動く`, body: "副題の数が段の中で動く。 形と説明は変えない。" },
      (p: PhaseBuilder) => p.activate("n").tween("v", from, to).badge("shape"),
    );
  }
  return d.build();
}


/** 4. Shape-driven basement 8 (CAR-1099) ... 要素形状自体が意味を持つ SVG path node */
export const shapeFile = shapeSample({
  id: "shape-file",
  kind: "shape-file",
  title: "月次報告書",
  eyebrow: "ファイル",
  subtitle: "PDF · {v} MB",
  metric: { from: 2, to: 9 },
  w: 272,
  topic: "shape: file (角を折った rect、 ファイル / document 表現)",
  phase: { title: "shape-file", body: "右上の角を折り返した四角。 ファイルや文書、報告書を表す。" },
});
export const shapeFolder = shapeSample({
  id: "shape-folder",
  kind: "shape-folder",
  title: "設計資料/",
  eyebrow: "フォルダ",
  subtitle: "ファイル {v} 件",
  metric: { from: 24, to: 118 },
  topic: "shape: folder (tab 付き rect、 フォルダ / パッケージ)",
  phase: { title: "shape-folder", body: "上の縁につまみの付いた四角。 フォルダや、部品をまとめた単位を表す。" },
});
export const shapeCloud = shapeSample({
  id: "shape-cloud",
  kind: "shape-cloud",
  title: "AWS",
  eyebrow: "クラウド",
  subtitle: "{v} リージョン",
  metric: { from: 3, to: 12 },
  topic: "shape: cloud (5 円 合成、 クラウド / SaaS 表現)",
  phase: { title: "shape-cloud", body: "5 つの円を重ねた雲の形。 クラウドの事業者や、外から呼ぶ API を表す。" },
});
export const shapeCylinder = shapeSample({
  id: "shape-cylinder",
  kind: "shape-cylinder",
  title: "PostgreSQL",
  eyebrow: "データベース",
  subtitle: "{v} GB 使用",
  metric: { from: 120, to: 480 },
  w: 272,
  topic: "shape: cylinder (円柱、 DB / storage 表現)",
  phase: { title: "shape-cylinder", body: "円柱 (上面と側面と底の楕円)。 DB や、消えずに残る保存先を表す。" },
});
export const shapeHexagon = shapeSample({
  id: "shape-hexagon",
  kind: "shape-hexagon",
  title: "認証の役務",
  eyebrow: "部品",
  subtitle: "毎秒 {v} 件",
  metric: { from: 60, to: 940 },
  w: 294,
  topic: "shape: hexagon (六角形、 component / service)",
  phase: { title: "shape-hexagon", body: "六角形。 小さく分けた役務や、業務ごとの部品を表す。" },
});
export const shapeDiamond = shapeSample({
  id: "shape-diamond",
  kind: "shape-diamond",
  title: "正しい?",
  eyebrow: "判定",
  subtitle: "はい {v}%",
  metric: { from: 40, to: 92 },
  topic: "shape: diamond (ひし形、 decision / 判定)",
  phase: { title: "shape-diamond", body: "ひし形。 条件で道が分かれる所を表す。" },
});
export const shapeStack = shapeSample({
  id: "shape-stack",
  kind: "shape-stack",
  title: "v3.2.0",
  eyebrow: "公開版",
  subtitle: "{v} 版",
  metric: { from: 3, to: 14 },
  topic: "shape: stack (重ね rect、 layer / history)",
  phase: { title: "shape-stack", body: "3 枚重ねた四角。 版の履歴や層、ある時点の写しの束を表す。" },
});
export const shapePerson = shapeSample({
  id: "shape-person",
  kind: "shape-person",
  title: "エンドユーザ",
  eyebrow: "人物",
  subtitle: "{v} 操作",
  metric: { from: 2, to: 21 },
  topic: "shape: person (人型 figure、 actor / user 表現)",
  phase: { title: "shape-person", body: "人の形 (丸い頭と台形の胴、曲げた腕)。 登場する人や利用者、担当者を表す。" },
});

/** 4-b. Shape-driven software 6 (CAR-1111 Phase 2-B) ... OS ウィンドウ / 端末 / コード block / kanban ticket / チャット吹き出し / 歯車 */
export const shapeWindow = shapeSample({
  id: "shape-window",
  kind: "shape-window",
  title: "ダッシュボード",
  eyebrow: "アプリの画面",
  subtitle: "開いた画面 {v}",
  metric: { from: 1, to: 6 },
  topic: "shape: window (GUI アプリ、 traffic lights + body)",
  phase: { title: "shape-window", body: "題の帯と 3 色の丸ボタン、本体。 アプリの画面や、閲覧ソフトで開いた画面を表す。" },
});
// 段を付けていない (#1196)。 この種別は副題を描かない (題と目次だけを自前で描く)。
// 数を置ける欄が識別の文字しか残らず、形の見本としての説明を潰すことになる。
// cdl 側で副題を読むようにしてから動かす (cdl #469)。
export const shapeTerminal = shapeSample({
  id: "shape-terminal",
  kind: "shape-terminal",
  title: "zsh",
  eyebrow: "端末",
  subtitle: "命令を打つ画面",
  topic: "shape: terminal (CLI shell、 mac bar + prompt)",
  phase: { title: "shape-terminal", body: "上の帯と $ の入力待ち、点滅する印。 命令を打つ画面や、遠くの機械への接続、手順の自動実行を表す。" },
});
// 段を付けていない (#1196)。 この種別は副題を描かない (題と目次だけを自前で描く)。
// 数を置ける欄が識別の文字しか残らず、形の見本としての説明を潰すことになる。
// cdl 側で副題を読むようにしてから動かす (cdl #469)。
export const shapeCodeBlock = shapeSample({
  id: "shape-code-block",
  kind: "shape-code-block",
  title: "共通の処理",
  eyebrow: "コード",
  subtitle: "3 行の抜粋",
  topic: "shape: code-block (snippet、 editor tab + 4 syntax lines)",
  phase: { title: "shape-code-block", body: "編集画面の見出しと行番号の欄、色分けした 4 行。 コードの抜粋や、実装そのものを表す。" },
});
// 段を付けていない (#1196)。 この種別は副題を描かない (題と目次だけを自前で描く)。
// 数を置ける欄が識別の文字しか残らず、形の見本としての説明を潰すことになる。
// cdl 側で副題を読むようにしてから動かす (cdl #469)。
export const shapeKanbanCard = shapeSample({
  id: "shape-kanban-card",
  kind: "shape-kanban-card",
  title: "課題 #1111",
  eyebrow: "作業中",
  subtitle: "形で見せる種別",
  topic: "shape: kanban-card (ticket + priority + tags)",
  phase: { title: "shape-kanban-card", body: "優先度の帯と番号、状態の札、題、分類の札、担当者の顔。 看板に貼る作業札や課題を表す。" },
});
export const shapeMessageBubble = shapeSample({
  id: "shape-message-bubble",
  kind: "shape-message-bubble",
  title: "了解しました",
  eyebrow: "発言",
  subtitle: "未読 {v}",
  metric: { from: 0, to: 9 },
  topic: "shape: message-bubble (吹き出し、 rounded rect + tail)",
  phase: { title: "shape-message-bubble", body: "角の丸い四角と、左下のしっぽ。 会話の発言や、変更への意見、通知を表す。" },
});
export const shapeGear = shapeSample({
  id: "shape-gear",
  kind: "shape-gear",
  title: "環境設定",
  eyebrow: "構成",
  subtitle: "設定 {v} 件",
  metric: { from: 8, to: 26 },
  topic: "shape: gear (歯車、 設定 / 処理エンジン)",
  phase: { title: "shape-gear", body: "歯が 12 枚の大きな歯車と、4 本の腕、中心の軸、留め具。 設定や、処理を回す仕組みを表す。" },
});

/** 5. Shape-driven hardware 6 (CAR-1111 Phase 2-C) ... ハードウェア / IoT / エッジ領域の視覚要素 */
export const shapeServerRack = shapeSample({
  id: "shape-server-rack",
  kind: "shape-server-rack",
  title: "公開用 1 号機",
  eyebrow: "サーバ",
  subtitle: "{v} U 分を使用",
  metric: { from: 3, to: 12 },
  topic: "shape: server-rack (19 inch rack、 物理サーバ)",
  phase: { title: "shape-server-rack", body: "外枠と 3 段の差し込み口を持つ棚。 実機のサーバや、データセンター、自社に置く機器を表す。" },
});
export const shapeNetworkNode = shapeSample({
  id: "shape-network-node",
  kind: "shape-network-node",
  title: "基幹ルータ",
  eyebrow: "通信網",
  subtitle: "L3 · 接続 {v} 台",
  metric: { from: 12, to: 96 },
  topic: "shape: network-node (network hub、 router / switch)",
  phase: { title: "shape-network-node", body: "中央の円と 4 方向の線。 通信を中継する機器 (経路を選ぶもの、線を束ねるもの) を表す。" },
});
export const shapeMobileDevice = shapeSample({
  id: "shape-mobile-device",
  kind: "shape-mobile-device",
  title: "iPhone",
  eyebrow: "携帯端末",
  subtitle: "{v} 台が稼働",
  metric: { from: 200, to: 1800 },
  topic: "shape: mobile-device (携帯端末)",
  phase: { title: "shape-mobile-device", body: "上の話し口と画面、下のボタンを持つスマホ。 携帯のアプリや、利用者の手元の端末を表す。" },
});
export const shapeIotSensor = shapeSample({
  id: "shape-iot-sensor",
  kind: "shape-iot-sensor",
  title: "温度センサー",
  eyebrow: "計測機器",
  subtitle: "無線 · {v} 度",
  metric: { from: 18, to: 34 },
  topic: "shape: iot-sensor (IoT beacon、 電波発信)",
  phase: { title: "shape-iot-sensor", body: "計測器の円と 3 重の波紋。 電波で知らせる計測器や、ものにつないだ端末を表す。" },
});
export const shapeRobotArm = shapeSample({
  id: "shape-robot-arm",
  kind: "shape-robot-arm",
  title: "組立ライン",
  eyebrow: "ロボット",
  subtitle: "6 軸 · {v} 個/時",
  metric: { from: 40, to: 260 },
  topic: "shape: robot-arm (機械の腕、 産業機器)",
  phase: { title: "shape-robot-arm", body: "台座と 2 つの関節、先のつかみ手を持つ腕。 産業機器や、自動にした工程、制御する対象を表す。" },
});
export const shapeSatellite = shapeSample({
  id: "shape-satellite",
  kind: "shape-satellite",
  title: "Starlink",
  eyebrow: "人工衛星",
  subtitle: "低軌道 · 高度 {v} km",
  metric: { from: 340, to: 550 },
  topic: "shape: satellite (人工衛星、 エッジ通信)",
  phase: { title: "shape-satellite", body: "中央の本体と左右の太陽電池板、アンテナ。 人工衛星や、宇宙を経由する通信を表す。" },
});

/** 6. Shape-driven blockchain / web3 6 (CAR-1111 Phase 2-D) ... Solidity / EVM 系開発主体 */
export const shapeSmartContract = shapeSample({
  id: "shape-smart-contract",
  kind: "shape-smart-contract",
  title: "預かり契約",
  eyebrow: "契約",
  subtitle: "0.8.24 · 呼出 {v}",
  metric: { from: 12, to: 480 },
  topic: "shape: smart-contract (契約書 + 歯車 = 自動実行)",
  phase: { title: "shape-smart-contract", body: "文書と、底の歯車 (自動で動く印)。 自動で動く契約や、参加者で決める組織の規約、条件付きの預かりを表す。" },
});
// 段を付けていない (#1196)。 この種別は絵の文字を自前で固定していて、書き手が渡した
// 題 / 副題 / 目次 を 1 つも読まない。 副題に数を置いても変わるのは見えない控えの欄だけ。
// cdl 側の別 Issue (cdl #469) で種別が値を読むようにしてから動かす。
export const shapeBlockchainBlock = shapeSample({
  id: "shape-blockchain-block",
  kind: "shape-blockchain-block",
  title: "ブロック #421",
  eyebrow: "台帳",
  subtitle: "0xaf31c9d2...",
  topic: "shape: blockchain-block (連結 3 block + hash pointer)",
  phase: { title: "shape-blockchain-block", body: "3 つのブロックを縦につなぎ、前のブロックの要約値と取引の数を持たせた形。 Ethereum や Bitcoin のブロックを表す。" },
});
export const shapeRpcNode = shapeSample({
  id: "shape-rpc-node",
  kind: "shape-rpc-node",
  title: "Alchemy",
  eyebrow: "RPC の窓口",
  subtitle: "本番の網 · 毎秒 {v} 件",
  metric: { from: 90, to: 1200 },
  topic: "shape: rpc-node (JSON-RPC node + 6 peers + sync bar)",
  phase: { title: "shape-rpc-node", body: "中央の球と周りの 6 つの点、同期の帯。 分散台帳へ問い合わせる窓口を貸す事業者を表す。" },
});
export const shapeWallet = shapeSample({
  id: "shape-wallet",
  kind: "shape-wallet",
  title: "MetaMask",
  eyebrow: "財布",
  subtitle: "個人の口座 · 残高 {v} ETH",
  metric: { from: 1, to: 12 },
  topic: "shape: wallet (財布 + coin + balance display)",
  phase: { title: "shape-wallet", body: "財布と差し込んだ硬貨、残高。 閲覧ソフトの財布や、鍵を持ち歩く機器、契約でできた財布を表す。" },
});
export const shapeNft = shapeSample({
  id: "shape-nft",
  kind: "shape-nft",
  title: "CryptoPunk",
  eyebrow: "NFT",
  subtitle: "ERC-721 · {v} ETH",
  metric: { from: 3, to: 28 },
  w: 272,
  topic: "shape: nft (額縁 + polygonal art + verified badge)",
  phase: { title: "shape-nft", body: "額縁と角ばった絵、本物の印。 ERC-721 の作品や、譲れない証明、作品の集まりを表す。" },
});
export const shapeToken = shapeSample({
  id: "shape-token",
  kind: "shape-token",
  title: "ETH",
  eyebrow: "通貨",
  subtitle: "ERC-20 · {v} ドル",
  metric: { from: 2100, to: 3400 },
  topic: "shape: token (硬貨、 fungible currency)",
  phase: { title: "shape-token", body: "硬貨と通貨の記号 Ξ、光。 ERC-20 の通貨や、台帳そのものの通貨、値を固定した通貨を表す。" },
});

/** 7. Shape-driven finance 6 (CAR-1111 Phase 2-D) ... 銀行 / 決済 / 信託 / 取引所主体 */
export const shapeBank = shapeSample({
  id: "shape-bank",
  kind: "shape-bank",
  title: "みずほ銀行",
  eyebrow: "銀行",
  subtitle: "都銀 · 預金 {v} 兆円",
  metric: { from: 90, to: 142 },
  topic: "shape: bank (Greek facade + 4 columns + $)",
  phase: { title: "shape-bank", body: "神殿風の正面 (三角の屋根と柱と土台)。 都市銀行や地方銀行、銀行の本店を表す。" },
});
export const shapeTrustBank = shapeSample({
  id: "shape-trust-bank",
  kind: "shape-trust-bank",
  title: "三菱 UFJ 信託",
  eyebrow: "信託銀行",
  subtitle: "受託 {v} 兆円",
  metric: { from: 40, to: 88 },
  topic: "shape: trust-bank (bank facade + 冠 crown = 受託の信頼)",
  phase: { title: "shape-trust-bank", body: "冠と正面の柱、T の印。 信託銀行や、預かって運用する業務、資産の管理を表す。" },
});
export const shapePaymentProvider = shapeSample({
  id: "shape-payment-provider",
  kind: "shape-payment-provider",
  title: "Stripe",
  eyebrow: "決済",
  subtitle: "決済 {v} 件/s",
  metric: { from: 30, to: 420 },
  topic: "shape: payment-provider (POS 端末 + screen + keypad)",
  phase: { title: "shape-payment-provider", body: "支払いの端末と承認の表示、数字の鍵盤。 決済の代行業者や、電子決済の取次を表す。" },
});
export const shapeBrokerage = shapeSample({
  id: "shape-brokerage",
  kind: "shape-brokerage",
  title: "野村證券",
  eyebrow: "証券",
  subtitle: "約定 {v} 件",
  metric: { from: 120, to: 940 },
  topic: "shape: brokerage (証券会社 tower + candle chart + up arrow)",
  phase: { title: "shape-brokerage", body: "高い建物と格子の窓、ろうそく足の図、上向きの矢印。 証券会社や投資銀行を表す。" },
});
export const shapeExchange = shapeSample({
  id: "shape-exchange",
  kind: "shape-exchange",
  title: "Coinbase",
  eyebrow: "取引所",
  subtitle: "出来高 {v} 億",
  metric: { from: 12, to: 86 },
  topic: "shape: exchange (取引所、 $ ⇄ Ξ swap)",
  phase: { title: "shape-exchange", body: "2 つの通貨の硬貨と両向きの矢印、交換の比率。 取引所や、仲介なしで交換する場、両替を表す。" },
});
export const shapeAtm = shapeSample({
  id: "shape-atm",
  kind: "shape-atm",
  title: "ATM",
  eyebrow: "現金の窓口",
  subtitle: "24 時間 · {v} 件/日",
  metric: { from: 180, to: 620 },
  topic: "shape: atm (現金自動預払機、 card slot + cash dispenser)",
  phase: { title: "shape-atm", body: "画面とボタン、カードの差し込み口、お金の出口。 銀行やコンビニの ATM を表す。" },
});

/** 8. Shape-driven commerce / web 6 (CAR-1111 Phase 2-D) ... web / EC / インフラ主体 */
export const shapeWebsite = shapeSample({
  id: "shape-website",
  kind: "shape-website",
  title: "会社案内",
  eyebrow: "サイト",
  subtitle: "閲覧 {v} 回/日",
  metric: { from: 1200, to: 8600 },
  topic: "shape: website (browser + URL + page layout)",
  phase: { title: "shape-website", body: "閲覧ソフトの枠と住所の欄、見出し、2 列の本文。 会社の案内や製品の紹介、日記のようなサイトを表す。" },
});
export const shapeStorefront = shapeSample({
  id: "shape-storefront",
  kind: "shape-storefront",
  title: "コンビニ",
  eyebrow: "店舗",
  subtitle: "来店 {v} 人/日",
  metric: { from: 240, to: 810 },
  topic: "shape: storefront (実店舗、 awning + door + windows)",
  phase: { title: "shape-storefront", body: "赤と白の日よけ、営業中の札、扉、窓。 実際の店や小売を表す。" },
});
export const shapeWarehouse = shapeSample({
  id: "shape-warehouse",
  kind: "shape-warehouse",
  title: "市川倉庫",
  eyebrow: "物流拠点",
  subtitle: "在庫 {v} 千点",
  metric: { from: 12, to: 48 },
  topic: "shape: warehouse (倉庫、 roof + shutter + boxes)",
  phase: { title: "shape-warehouse", body: "屋根と巻き上げの扉、積んだ箱。 出荷を受け持つ拠点や倉庫を表す。" },
});
export const shapeOnlineShop = shapeSample({
  id: "shape-online-shop",
  kind: "shape-online-shop",
  title: "Amazon",
  eyebrow: "通販",
  subtitle: "注文 {v} 件/分",
  metric: { from: 6, to: 74 },
  topic: "shape: online-shop (browser + cart badge + product grid)",
  phase: { title: "shape-online-shop", body: "閲覧ソフトの枠と、かごの数 (3)、6 つの商品の並び。 通販やネットの販売を表す。" },
});
export const shapeCdnEdge = shapeSample({
  id: "shape-cdn-edge",
  kind: "shape-cdn-edge",
  title: "Cloudflare",
  eyebrow: "配信網",
  subtitle: "拠点 {v} か所",
  metric: { from: 300, to: 380 },
  topic: "shape: cdn-edge (地球儀 + 5 edge nodes + arc)",
  phase: { title: "shape-cdn-edge", body: "地球儀と 5 つの拠点、点線のつながり。 配信網の事業者や、利用者の近くで返す網を表す。" },
});
export const shapeApiGateway = shapeSample({
  id: "shape-api-gateway",
  kind: "shape-api-gateway",
  title: "Kong",
  eyebrow: "API の入口",
  subtitle: "毎秒 {v} 件",
  metric: { from: 400, to: 3200 },
  topic: "shape: api-gateway (門柱 + arch + traffic arrow)",
  phase: { title: "shape-api-gateway", body: "2 本の柱と弧、API の字、行き交う矢印。 API の入口に立つ門番を表す。" },
});

/** 9. Shape-driven people 6 (CAR-1111 Phase 2-D) ... 職種別 person 型 */
export const shapeAuditor = shapeSample({
  id: "shape-auditor",
  kind: "shape-auditor",
  title: "監査法人",
  eyebrow: "監査",
  subtitle: "指摘 {v} 件",
  metric: { from: 2, to: 17 },
  topic: "shape: auditor (監査人 + magnifier + check)",
  phase: { title: "shape-auditor", body: "人とネクタイ、虫眼鏡、確認の印。 監査人や公認会計士、内部の監査を表す。" },
});
export const shapeRegulator = shapeSample({
  id: "shape-regulator",
  kind: "shape-regulator",
  title: "金融庁",
  eyebrow: "規制当局",
  subtitle: "検査 {v} 件",
  metric: { from: 4, to: 23 },
  topic: "shape: regulator (規制当局 + 冠 crown + 章 badge)",
  phase: { title: "shape-regulator", body: "人と冠、五芒星の記章。 金融庁や消費者庁のような規制の当局を表す。" },
});
export const shapeNotary = shapeSample({
  id: "shape-notary",
  kind: "shape-notary",
  title: "公証役場",
  eyebrow: "公証",
  subtitle: "認証 {v} 件",
  metric: { from: 6, to: 31 },
  topic: "shape: notary (公証人 + 儒学者風 hat + seal 印)",
  phase: { title: "shape-notary", body: "人と儒学者風の帽子、赤い印。 公証人や、書類が正しいと認める業務を表す。" },
});
export const shapeLawyer = shapeSample({
  id: "shape-lawyer",
  kind: "shape-lawyer",
  title: "顧問弁護士",
  eyebrow: "法務",
  subtitle: "案件 {v} 件",
  metric: { from: 3, to: 19 },
  topic: "shape: lawyer (弁護士 + wig + 天秤)",
  phase: { title: "shape-lawyer", body: "人と髪、正義の天秤の印。 弁護士や法務の顧問、法律事務所を表す。" },
});
export const shapeTrader = shapeSample({
  id: "shape-trader",
  kind: "shape-trader",
  title: "デイトレーダー",
  eyebrow: "売買",
  subtitle: "約定 {v} 回",
  metric: { from: 8, to: 152 },
  topic: "shape: trader (トレーダー + headset + laptop chart)",
  phase: { title: "shape-trader", body: "人とヘッドセット、値動きの映るパソコン。 トレーダーや、値付けを受け持つ業者、機械の自動発注を表す。" },
});
export const shapeCustomerService = shapeSample({
  id: "shape-customer-service",
  kind: "shape-customer-service",
  title: "サポート担当",
  eyebrow: "問い合わせ",
  subtitle: "対応 {v} 件",
  metric: { from: 14, to: 88 },
  topic: "shape: customer-service (CS + headset + bubble)",
  phase: { title: "shape-customer-service", body: "人とヘッドセット、吹き出し、名札。 お客様の窓口やコールセンターを表す。" },
});

/** 10. Phase 2-D 追加分 (blockchain 4 新 + credit-card 分離) */
export const shapeBlockchain = shapeSample({
  id: "shape-blockchain",
  kind: "shape-blockchain",
  title: "ブロックチェーン",
  eyebrow: "台帳",
  subtitle: "{v} ブロック",
  metric: { from: 5, to: 42 },
  topic: "shape: blockchain (5 block linked chain)",
  phase: { title: "shape-blockchain", body: "5 つのブロックを、前の要約値を指す形で横につなぐ。 分散台帳の一般の形を表す。" },
});
export const shapeBitcoinChain = shapeSample({
  id: "shape-bitcoin-chain",
  kind: "shape-bitcoin-chain",
  title: "Bitcoin",
  eyebrow: "分散台帳",
  subtitle: "ブロック高 {v} 万",
  metric: { from: 84, to: 89 },
  topic: "shape: bitcoin-chain (₿ + PoW + 橙色)",
  phase: { title: "shape-bitcoin-chain", body: "橙の色と ₿ の記号、計算の量で合意する採掘。 Bitcoin の本番の網や、試しの網を表す。" },
});
export const shapeEthereumChain = shapeSample({
  id: "shape-ethereum-chain",
  kind: "shape-ethereum-chain",
  title: "Ethereum",
  eyebrow: "分散台帳",
  subtitle: "{v} 万ブロック",
  metric: { from: 2000, to: 2400 },
  topic: "shape: ethereum-chain (Ξ + PoS + 紫色)",
  phase: { title: "shape-ethereum-chain", body: "紫の色と Ξ の記号、預けた量で合意する検証役。 Ethereum の本番の網や、その上に重ねた網を表す。" },
});
export const shapeBlockchainNode = shapeSample({
  id: "shape-blockchain-node",
  kind: "shape-blockchain-node",
  title: "フルノード",
  eyebrow: "参加者",
  subtitle: "直接つながる相手 {v} 台",
  metric: { from: 8, to: 64 },
  topic: "shape: blockchain-node (P2P hex + 6 peers)",
  phase: { title: "shape-blockchain-node", body: "中央の六角形と周りの 6 つの六角形、積んだブロックの印。 分散台帳の参加者 (全記録を持つもの、過去の状態まで持つもの、最小限だけ持つもの) を表す。" },
});
export const shapeCreditCard = shapeSample({
  id: "shape-credit-card",
  kind: "shape-credit-card",
  title: "クレカ",
  eyebrow: "カード",
  subtitle: "利用額 {v} 万円",
  metric: { from: 3, to: 18 },
  topic: "shape: credit-card (chip + magstripe + brand mark)",
  phase: { title: "shape-credit-card", body: "金色の端子と非接触の波、番号、名義、有効期限、ブランドの印。 実物のクレジットカードを表す。" },
});

/** 11. 実シーン (Scene) diagram = 複数 shape の連携例、 catalog の実用性向上 */

/** S-1. crypto 送金 flow = wallet → exchange → blockchain */
export const sceneCryptoTransfer = diagram("scene-crypto-transfer", { topic: "scene: crypto 送金 (wallet → exchange → chain)" })
  .lane("l", { x: 0, width: W })
  .node("w", { lane: "l", stack: 0, kind: "shape-wallet", title: "送金者", eyebrow: "財布", subtitle: "MetaMask の口座" })
  .node("e", { lane: "l", stack: 1, kind: "shape-exchange", title: "分散型取引所", eyebrow: "取引所", subtitle: "清算" })
  .node("c", { lane: "l", stack: 2, kind: "shape-ethereum-chain", title: "Ethereum", eyebrow: "台帳", subtitle: "L1 の本番の網" })
  .edge("w", "e", { label: "" })
  .edge("e", "c", { label: "" })
  .phase("p1", { duration: 750, title: "1. 送金者", body: "MetaMask の口座" }, (p: PhaseBuilder) => p.activate("w").badge("財布"))
  .phase("p2", { duration: 750, title: "2. 分散型取引所", body: "清算" }, (p: PhaseBuilder) => p.activate("w").activate("e").badge("取引所"))
  .phase("p3", { duration: 750, title: "暗号資産の送金", body: "送金者の財布が分散型取引所へ注文を出し、取引所が Ethereum の台帳で決済する。 個人の口座から L1 まで 3 段で進む場面。" }, (p: PhaseBuilder) => p.activate("w").activate("e").activate("c").badge("台帳"))
  .build();

/** S-2. 弁護士 → 公証人 → 登記 (法務 flow) */
export const sceneLegalNotarization = diagram("scene-legal-notarization", { topic: "scene: 法務 (弁護士 → 公証人 → 登記)" })
  .lane("l", { x: 0, width: W })
  .node("l1", { lane: "l", stack: 0, kind: "shape-lawyer", title: "代理人", eyebrow: "法務", subtitle: "起草" })
  .node("n", { lane: "l", stack: 1, kind: "shape-notary", title: "公証役場", eyebrow: "公証", subtitle: "認証" })
  .node("f", { lane: "l", stack: 2, kind: "shape-file", title: "登記簿", eyebrow: "記録", subtitle: "法務局に保管" })
  .edge("l1", "n", { label: "" })
  .edge("n", "f", { label: "" })
  .phase("p1", { duration: 750, title: "1. 代理人", body: "起草" }, (p: PhaseBuilder) => p.activate("l1").badge("法務"))
  .phase("p2", { duration: 750, title: "2. 公証役場", body: "認証" }, (p: PhaseBuilder) => p.activate("l1").activate("n").badge("公証"))
  .phase("p3", { duration: 750, title: "法務の流れ", body: "代理人が起草し、公証役場が認証して、登記簿に記録する。 契約や遺言、不動産の譲渡で踏む正式な流れ。" }, (p: PhaseBuilder) => p.activate("l1").activate("n").activate("f").badge("記録"))
  .build();

/** S-3. ATM → 銀行 → EC 送金 (金融 flow) */
export const sceneBankingFlow = diagram("scene-banking-flow", { topic: "scene: 銀行送金 (ATM → 銀行 → EC)" })
  .lane("l", { x: 0, width: W })
  .node("a", { lane: "l", stack: 0, kind: "shape-atm", title: "ATM", eyebrow: "現金の窓口", subtitle: "現金を引き出す" })
  .node("b", { lane: "l", stack: 1, kind: "shape-bank", title: "みずほ銀行", eyebrow: "銀行", subtitle: "都銀" })
  .node("s", { lane: "l", stack: 2, kind: "shape-online-shop", title: "Amazon", eyebrow: "店", subtitle: "ネット通販" })
  .edge("a", "b", { label: "" })
  .edge("b", "s", { label: "" })
  .phase("p1", { duration: 750, title: "1. ATM", body: "現金を引き出す" }, (p: PhaseBuilder) => p.activate("a").badge("現金の窓口"))
  .phase("p2", { duration: 750, title: "2. みずほ銀行", body: "都銀" }, (p: PhaseBuilder) => p.activate("a").activate("b").badge("銀行"))
  .phase("p3", { duration: 750, title: "銀行の送金", body: "ATM で現金を引き出し、銀行の口座を通して、通販の代金を払う。 暮らしの中でお金が動く流れ。" }, (p: PhaseBuilder) => p.activate("a").activate("b").activate("s").badge("店"))
  .build();

/** S-4. IoT センサー → RPC → smart-contract (web3 IoT) */
export const sceneIotOnchain = diagram("scene-iot-onchain", { topic: "scene: IoT 機器から台帳へ (sensor → RPC → contract)" })
  .lane("l", { x: 0, width: W })
  .node("s", { lane: "l", stack: 0, kind: "shape-iot-sensor", title: "温度計", eyebrow: "計測機器", subtitle: "近距離の無線" })
  .node("r", { lane: "l", stack: 1, kind: "shape-rpc-node", title: "Infura", eyebrow: "RPC の窓口", subtitle: "窓口を貸す事業者" })
  .node("c", { lane: "l", stack: 2, kind: "shape-smart-contract", title: "外部データの受け口", eyebrow: "契約", subtitle: "Solidity", w: 360 })
  .edge("s", "r", { label: "" })
  .edge("r", "c", { label: "" })
  .phase("p1", { duration: 750, title: "1. 温度計", body: "近距離の無線" }, (p: PhaseBuilder) => p.activate("s").badge("計測機器"))
  .phase("p2", { duration: 750, title: "2. Infura", body: "窓口を貸す事業者" }, (p: PhaseBuilder) => p.activate("s").activate("r").badge("RPC の窓口"))
  .phase("p3", { duration: 750, title: "計測値を台帳へ", body: "温度計の値を RPC の窓口へ送り、外部データの受け口の契約が台帳に書き込む。 現実の計測値を台帳に残す流れ。" }, (p: PhaseBuilder) => p.activate("s").activate("r").activate("c").badge("契約"))
  .build();

/** S-5. 監査人 → 帳簿 → 規制当局 (監査 flow) */
export const sceneAuditFlow = diagram("scene-audit-flow", { topic: "scene: 監査 (auditor → 帳簿 → regulator)" })
  .lane("l", { x: 0, width: W })
  .node("a", { lane: "l", stack: 0, kind: "shape-auditor", title: "監査法人", eyebrow: "監査", subtitle: "検査" })
  .node("f", { lane: "l", stack: 1, kind: "shape-file", title: "会計帳簿", eyebrow: "記録", subtitle: "元帳" })
  .node("r", { lane: "l", stack: 2, kind: "shape-regulator", title: "金融庁", eyebrow: "規制当局", subtitle: "監督" })
  .edge("a", "f", { label: "" })
  .edge("f", "r", { label: "" })
  .phase("p1", { duration: 750, title: "1. 監査法人", body: "検査" }, (p: PhaseBuilder) => p.activate("a").badge("監査"))
  .phase("p2", { duration: 750, title: "2. 会計帳簿", body: "元帳" }, (p: PhaseBuilder) => p.activate("a").activate("f").badge("記録"))
  .phase("p3", { duration: 750, title: "監査の流れ", body: "監査法人が帳簿を確かめ、規制当局へ報告する。 上場企業の財務監査で踏む 3 段の流れ。" }, (p: PhaseBuilder) => p.activate("a").activate("f").activate("r").badge("規制当局"))
  .build();

/** S-6. トレーダー → 証券会社 → 取引所 (証券取引) */
export const sceneStockTrading = diagram("scene-stock-trading", { topic: "scene: 証券取引 (trader → 証券会社 → 取引所)" })
  .lane("l", { x: 0, width: W })
  .node("t", { lane: "l", stack: 0, kind: "shape-trader", title: "個人投資家", eyebrow: "売買", subtitle: "小口の注文" })
  .node("b", { lane: "l", stack: 1, kind: "shape-brokerage", title: "野村証券", eyebrow: "証券", subtitle: "投資銀行" })
  .node("e", { lane: "l", stack: 2, kind: "shape-exchange", title: "東証", eyebrow: "取引所", subtitle: "プライム市場" })
  .edge("t", "b", { label: "" })
  .edge("b", "e", { label: "" })
  .phase("p1", { duration: 750, title: "1. 個人投資家", body: "小口の注文" }, (p: PhaseBuilder) => p.activate("t").badge("売買"))
  .phase("p2", { duration: 750, title: "2. 野村証券", body: "投資銀行" }, (p: PhaseBuilder) => p.activate("t").activate("b").badge("証券"))
  .phase("p3", { duration: 750, title: "証券取引", body: "個人投資家が証券会社へ発注し、取引所で約定する。 株の売買で踏む 3 段の場面。" }, (p: PhaseBuilder) => p.activate("t").activate("b").activate("e").badge("取引所"))
  .build();

/** S-7. 顧客対応 → チケット → 開発チーム (問い合わせ flow) */
export const sceneSupportFlow = diagram("scene-support-flow", { topic: "scene: 問い合わせ (CS → ticket → 開発)" })
  .lane("l", { x: 0, width: W })
  .node("c", { lane: "l", stack: 0, kind: "shape-customer-service", title: "サポート担当", eyebrow: "問い合わせ", subtitle: "24 時間対応" })
  .node("k", { lane: "l", stack: 1, kind: "shape-kanban-card", title: "不具合 #1234", eyebrow: "課題", subtitle: "管理表に起票" })
  .node("d", { lane: "l", stack: 2, kind: "shape-code-block", title: "緊急の修正", eyebrow: "変更の確定", subtitle: "開発者が直す" })
  .edge("c", "k", { label: "" })
  .edge("k", "d", { label: "" })
  .phase("p1", { duration: 750, title: "1. サポート担当", body: "24 時間対応" }, (p: PhaseBuilder) => p.activate("c").badge("問い合わせ"))
  .phase("p2", { duration: 750, title: "2. 不具合 #1234", body: "管理表に起票" }, (p: PhaseBuilder) => p.activate("c").activate("k").badge("課題"))
  .phase("p3", { duration: 750, title: "問い合わせの流れ", body: "サポート担当が電話を受け、課題として起票し、開発者が緊急の修正を出す。 不具合の報告から修正までの、よくある 3 段の流れ。" }, (p: PhaseBuilder) => p.activate("c").activate("k").activate("d").badge("変更の確定"))
  .build();

/** S-8. 決済業者 → クレカ → 銀行 (決済 flow) */
export const scenePaymentSettlement = diagram("scene-payment-settlement", { topic: "scene: 決済 (provider → クレカ → 銀行)" })
  .lane("l", { x: 0, width: W })
  .node("p", { lane: "l", stack: 0, kind: "shape-payment-provider", title: "Stripe", eyebrow: "決済代行", subtitle: "クラウドで提供" })
  .node("c", { lane: "l", stack: 1, kind: "shape-credit-card", title: "VISA", eyebrow: "カード", subtitle: "後払い" })
  .node("b", { lane: "l", stack: 2, kind: "shape-bank", title: "発行銀行", eyebrow: "発行元", subtitle: "三菱 UFJ 銀行" })
  .edge("p", "c", { label: "" })
  .edge("c", "b", { label: "" })
  .phase("p1", { duration: 750, title: "1. Stripe", body: "クラウドで提供" }, (p: PhaseBuilder) => p.activate("p").badge("決済代行"))
  .phase("p2", { duration: 750, title: "2. VISA", body: "後払い" }, (p: PhaseBuilder) => p.activate("p").activate("c").badge("カード"))
  .phase("p3", { duration: 750, title: "決済の流れ", body: "Stripe がカードの承認を求め、発行銀行が決済する。 通販のカード払いで踏む 3 段の流れ。" }, (p: PhaseBuilder) => p.activate("p").activate("c").activate("b").badge("発行元"))
  .build();

/** S-9. website → CDN → server-rack (web infra) */
export const sceneWebInfra = diagram("scene-web-infra", { topic: "scene: web infra (website → CDN → server)" })
  .lane("l", { x: 0, width: W })
  .node("w", { lane: "l", stack: 0, kind: "shape-website", title: "会社案内", eyebrow: "サイト", subtitle: "1 画面で動くアプリ" })
  .node("c", { lane: "l", stack: 1, kind: "shape-cdn-edge", title: "Cloudflare", eyebrow: "配信網", subtitle: "近くの拠点" })
  .node("s", { lane: "l", stack: 2, kind: "shape-server-rack", title: "配信元", eyebrow: "サーバ", subtitle: "AWS" })
  .edge("w", "c", { label: "" })
  .edge("c", "s", { label: "" })
  .phase("p1", { duration: 750, title: "1. 会社案内", body: "1 画面で動くアプリ" }, (p: PhaseBuilder) => p.activate("w").badge("サイト"))
  .phase("p2", { duration: 750, title: "2. Cloudflare", body: "近くの拠点" }, (p: PhaseBuilder) => p.activate("w").activate("c").badge("配信網"))
  .phase("p3", { duration: 750, title: "サイトの配信", body: "サイトへの要求を配信網の控えで返し、無い時だけ配信元のサーバへ取りに行く。 サイトの配信でよく使う 3 層の形。" }, (p: PhaseBuilder) => p.activate("w").activate("c").activate("s").badge("サーバ"))
  .build();

/** S-10. NFT mint (wallet → smart-contract → NFT) */
export const sceneNftMint = diagram("scene-nft-mint", { topic: "scene: NFT mint (wallet → contract → NFT)" })
  .lane("l", { x: 0, width: W })
  .node("w", { lane: "l", stack: 0, kind: "shape-wallet", title: "作者", eyebrow: "財布", subtitle: "絵描き" })
  .node("c", { lane: "l", stack: 1, kind: "shape-smart-contract", title: "ERC-721", eyebrow: "契約", subtitle: "OpenSea に出品" })
  .node("n", { lane: "l", stack: 2, kind: "shape-nft", title: "一点物の絵", eyebrow: "NFT", subtitle: "#42" })
  .edge("w", "c", { label: "" })
  .edge("c", "n", { label: "" })
  .phase("p1", { duration: 750, title: "1. 作者", body: "絵描き" }, (p: PhaseBuilder) => p.activate("w").badge("財布"))
  .phase("p2", { duration: 750, title: "2. ERC-721", body: "OpenSea に出品" }, (p: PhaseBuilder) => p.activate("w").activate("c").badge("契約"))
  .phase("p3", { duration: 750, title: "NFT の発行", body: "作者の財布が ERC-721 の契約を呼び、NFT が発行される。 NFT を発行する時の典型的な 3 段の流れ。" }, (p: PhaseBuilder) => p.activate("w").activate("c").activate("n").badge("NFT"))
  .build();

/** S-11. token bridge (chain A → bridge contract → chain B) */
export const sceneTokenBridge = diagram("scene-token-bridge", { topic: "scene: token bridge (chain A → bridge → chain B)" })
  .lane("l", { x: 0, width: W })
  .node("a", { lane: "l", stack: 0, kind: "shape-ethereum-chain", title: "Ethereum", eyebrow: "送る側の台帳", subtitle: "L1" })
  .node("b", { lane: "l", stack: 1, kind: "shape-smart-contract", title: "橋渡し", eyebrow: "契約", subtitle: "預かって凍結" })
  .node("c", { lane: "l", stack: 2, kind: "shape-blockchain", title: "Arbitrum", eyebrow: "受ける側の台帳", subtitle: "L2" })
  .edge("a", "b", { label: "" })
  .edge("b", "c", { label: "" })
  .phase("p1", { duration: 750, title: "1. Ethereum", body: "L1" }, (p: PhaseBuilder) => p.activate("a").badge("送る側の台帳"))
  .phase("p2", { duration: 750, title: "2. 橋渡し", body: "預かって凍結" }, (p: PhaseBuilder) => p.activate("a").activate("b").badge("契約"))
  .phase("p3", { duration: 750, title: "通貨の橋渡し", body: "送る側の台帳で通貨を凍結し、橋渡しの契約を通して、受ける側の台帳で同じ額を発行する。 台帳をまたいで資産を移す流れ。" }, (p: PhaseBuilder) => p.activate("a").activate("b").activate("c").badge("受ける側の台帳"))
  .build();

/** S-12. DeFi lending (wallet → lending contract → interest) */
export const sceneDefiLending = diagram("scene-defi-lending", { topic: "scene: DeFi lending (wallet → contract → token)" })
  .lane("l", { x: 0, width: W })
  .node("w", { lane: "l", stack: 0, kind: "shape-wallet", title: "供給者", eyebrow: "財布", subtitle: "USDC を預ける" })
  .node("c", { lane: "l", stack: 1, kind: "shape-smart-contract", title: "Aave v3", eyebrow: "貸し出し", subtitle: "まとめた資金" })
  .node("t", { lane: "l", stack: 2, kind: "shape-token", title: "aUSDC", eyebrow: "通貨", subtitle: "利息が付く" })
  .edge("w", "c", { label: "" })
  .edge("c", "t", { label: "" })
  .phase("p1", { duration: 750, title: "1. 供給者", body: "USDC を預ける" }, (p: PhaseBuilder) => p.activate("w").badge("財布"))
  .phase("p2", { duration: 750, title: "2. Aave v3", body: "まとめた資金" }, (p: PhaseBuilder) => p.activate("w").activate("c").badge("貸し出し"))
  .phase("p3", { duration: 750, title: "分散型の貸し出し", body: "財布から Aave に USDC を預けると、利息が付く aUSDC を受け取る。 利息の付く貸し出しの典型的な流れ。" }, (p: PhaseBuilder) => p.activate("w").activate("c").activate("t").badge("通貨"))
  .build();

/** S-13. bitcoin transaction (wallet → bitcoin chain → node) */
export const sceneBitcoinTx = diagram("scene-bitcoin-tx", { topic: "scene: bitcoin tx (wallet → BTC chain → node)" })
  .lane("l", { x: 0, width: W })
  .node("w", { lane: "l", stack: 0, kind: "shape-wallet", title: "送金者", eyebrow: "財布", subtitle: "Bitcoin の公式ソフト" })
  .node("c", { lane: "l", stack: 1, kind: "shape-bitcoin-chain", title: "BTC の本番網", eyebrow: "台帳", subtitle: "計算の量で合意" })
  .node("n", { lane: "l", stack: 2, kind: "shape-blockchain-node", title: "全記録の保持者", eyebrow: "参加者", subtitle: "検証役" })
  .edge("w", "c", { label: "" })
  .edge("c", "n", { label: "" })
  .phase("p1", { duration: 750, title: "1. 送金者", body: "Bitcoin の公式ソフト" }, (p: PhaseBuilder) => p.activate("w").badge("財布"))
  .phase("p2", { duration: 750, title: "2. BTC の本番網", body: "計算の量で合意" }, (p: PhaseBuilder) => p.activate("w").activate("c").badge("台帳"))
  .phase("p3", { duration: 750, title: "Bitcoin の送金", body: "財布で取引に署名し、Bitcoin の網へ流して、全記録の保持者が承認する。 仲介なしで直接送る 3 段の流れ。" }, (p: PhaseBuilder) => p.activate("w").activate("c").activate("n").badge("参加者"))
  .build();

/** S-14. e-commerce order (customer → storefront → warehouse) */
export const sceneEcOrder = diagram("scene-ec-order", { topic: "scene: EC 注文 (customer → shop → warehouse)" })
  .lane("l", { x: 0, width: W })
  .node("c", { lane: "l", stack: 0, kind: "shape-customer-service", title: "購入者", eyebrow: "顧客", subtitle: "注文" })
  .node("s", { lane: "l", stack: 1, kind: "shape-online-shop", title: "楽天市場", eyebrow: "店", subtitle: "ネット通販" })
  .node("w", { lane: "l", stack: 2, kind: "shape-warehouse", title: "市川倉庫", eyebrow: "物流拠点", subtitle: "出荷" })
  .edge("c", "s", { label: "" })
  .edge("s", "w", { label: "" })
  .phase("p1", { duration: 750, title: "1. 購入者", body: "注文" }, (p: PhaseBuilder) => p.activate("c").badge("顧客"))
  .phase("p2", { duration: 750, title: "2. 楽天市場", body: "ネット通販" }, (p: PhaseBuilder) => p.activate("c").activate("s").badge("店"))
  .phase("p3", { duration: 750, title: "通販の注文", body: "購入者が注文し、通販の店が受けて、倉庫へ出荷を指示する。 物を売る時の、注文から出荷までの流れ。" }, (p: PhaseBuilder) => p.activate("c").activate("s").activate("w").badge("物流拠点"))
  .build();

/** S-15. mobile app (mobile → API gateway → server) */
export const sceneMobileApi = diagram("scene-mobile-api", { topic: "scene: mobile app (mobile → API gateway → server)" })
  .lane("l", { x: 0, width: W })
  .node("m", { lane: "l", stack: 0, kind: "shape-mobile-device", title: "iOS のアプリ", eyebrow: "携帯端末", subtitle: "SwiftUI" })
  .node("g", { lane: "l", stack: 1, kind: "shape-api-gateway", title: "GraphQL", eyebrow: "API の入口", subtitle: "要求を振り分ける" })
  .node("s", { lane: "l", stack: 2, kind: "shape-server-rack", title: "裏側の処理", eyebrow: "サーバ", subtitle: "コンテナで稼働" })
  .edge("m", "g", { label: "" })
  .edge("g", "s", { label: "" })
  .phase("p1", { duration: 750, title: "1. iOS のアプリ", body: "SwiftUI" }, (p: PhaseBuilder) => p.activate("m").badge("携帯端末"))
  .phase("p2", { duration: 750, title: "2. GraphQL", body: "要求を振り分ける" }, (p: PhaseBuilder) => p.activate("m").activate("g").badge("API の入口"))
  .phase("p3", { duration: 750, title: "携帯アプリの API", body: "携帯のアプリが要求を送り、API の入口が認証して振り分け、裏側のサーバが処理する。 いまどきの携帯アプリの組み立て。" }, (p: PhaseBuilder) => p.activate("m").activate("g").activate("s").badge("サーバ"))
  .build();

/** S-16. robot arm production (robot → sensor → cylinder db) */
export const sceneFactoryLine = diagram("scene-factory-line", { topic: "scene: 工場の組立 (robot → sensor → DB)" })
  .lane("l", { x: 0, width: W })
  .node("r", { lane: "l", stack: 0, kind: "shape-robot-arm", title: "ファナックの腕", eyebrow: "ロボット", subtitle: "組立", w: 294 })
  .node("s", { lane: "l", stack: 1, kind: "shape-iot-sensor", title: "外観の検査", eyebrow: "計測機器", subtitle: "品質" })
  .node("d", { lane: "l", stack: 2, kind: "shape-cylinder", title: "製造管理の DB", eyebrow: "データベース", subtitle: "履歴を追える" })
  .edge("r", "s", { label: "" })
  .edge("s", "d", { label: "" })
  .phase("p1", { duration: 750, title: "1. ファナックの腕", body: "組立" }, (p: PhaseBuilder) => p.activate("r").badge("ロボット"))
  .phase("p2", { duration: 750, title: "2. 外観の検査", body: "品質" }, (p: PhaseBuilder) => p.activate("r").activate("s").badge("計測機器"))
  .phase("p3", { duration: 750, title: "工場の組立", body: "ロボットの腕が組み立て、計測機器が品質を確かめ、製造管理の DB に記録する。 機械でつないだ工場の典型的な流れ。" }, (p: PhaseBuilder) => p.activate("r").activate("s").activate("d").badge("データベース"))
  .build();

/** S-17. satellite communication (satellite → RPC → chain) */
export const sceneSatelliteChain = diagram("scene-satellite-chain", { topic: "scene: satellite (satellite → RPC → chain)" })
  .lane("l", { x: 0, width: W })
  .node("s", { lane: "l", stack: 0, kind: "shape-satellite", title: "Starlink", eyebrow: "人工衛星", subtitle: "低軌道" })
  .node("r", { lane: "l", stack: 1, kind: "shape-rpc-node", title: "Alchemy", eyebrow: "RPC の窓口", subtitle: "接続先" })
  .node("c", { lane: "l", stack: 2, kind: "shape-blockchain", title: "Solana", eyebrow: "台帳", subtitle: "処理が速い" })
  .edge("s", "r", { label: "" })
  .edge("r", "c", { label: "" })
  .phase("p1", { duration: 750, title: "1. Starlink", body: "低軌道" }, (p: PhaseBuilder) => p.activate("s").badge("人工衛星"))
  .phase("p2", { duration: 750, title: "2. Alchemy", body: "接続先" }, (p: PhaseBuilder) => p.activate("s").activate("r").badge("RPC の窓口"))
  .phase("p3", { duration: 750, title: "衛星から台帳へ", body: "衛星のデータを RPC の窓口が中継し、台帳に記録する。 宇宙から現実のデータを台帳へ送る流れ。" }, (p: PhaseBuilder) => p.activate("s").activate("r").activate("c").badge("台帳"))
  .build();

/** S-18. dev workflow (code block → gear ci → cloud deploy) */
export const sceneDevOps = diagram("scene-devops", { topic: "scene: DevOps (code → CI → cloud)" })
  .lane("l", { x: 0, width: W })
  .node("c", { lane: "l", stack: 0, kind: "shape-code-block", title: "注文画面/", eyebrow: "コード", subtitle: "TypeScript" })
  .node("g", { lane: "l", stack: 1, kind: "shape-gear", title: "GitHub の実行環境", eyebrow: "自動化", subtitle: "組み立てと検査", w: 360 })
  .node("d", { lane: "l", stack: 2, kind: "shape-cloud", title: "AWS ECS", eyebrow: "配備先", subtitle: "コンテナで稼働" })
  .edge("c", "g", { label: "" })
  .edge("g", "d", { label: "" })
  .phase("p1", { duration: 750, title: "1. 注文画面/", body: "TypeScript" }, (p: PhaseBuilder) => p.activate("c").badge("コード"))
  .phase("p2", { duration: 750, title: "2. GitHub の実行環境", body: "組み立てと検査" }, (p: PhaseBuilder) => p.activate("c").activate("g").badge("自動化"))
  .phase("p3", { duration: 750, title: "開発と運用", body: "コードを送ると、自動で組み立てて検査し、クラウドへ配備する。 いまどきの自動配備の典型的な 3 段の流れ。" }, (p: PhaseBuilder) => p.activate("c").activate("g").activate("d").badge("配備先"))
  .build();

/** S-19. kanban task (kanban → terminal → file) */
export const sceneTaskFlow = diagram("scene-task-flow", { topic: "scene: task flow (kanban → terminal → file)" })
  .lane("l", { x: 0, width: W })
  .node("k", { lane: "l", stack: 0, kind: "shape-kanban-card", title: "課題 #42", eyebrow: "看板", subtitle: "作業中" })
  .node("t", { lane: "l", stack: 1, kind: "shape-terminal", title: "zsh", eyebrow: "端末", subtitle: "組み立てを実行", w: 382 })
  .node("f", { lane: "l", stack: 2, kind: "shape-file", title: "組み立ての記録", eyebrow: "ファイル", subtitle: "出力" })
  .edge("k", "t", { label: "" })
  .edge("t", "f", { label: "" })
  .phase("p1", { duration: 750, title: "1. 課題 #42", body: "作業中" }, (p: PhaseBuilder) => p.activate("k").badge("看板"))
  .phase("p2", { duration: 750, title: "2. zsh", body: "組み立てを実行" }, (p: PhaseBuilder) => p.activate("k").activate("t").badge("端末"))
  .phase("p3", { duration: 750, title: "作業の流れ", body: "看板の課題に着手し、端末で命令を打ち、出力をファイルに残す。 開発者の日々の流れ。" }, (p: PhaseBuilder) => p.activate("k").activate("t").activate("f").badge("ファイル"))
  .build();

/** S-20. message notification (message bubble → hexagon → window) */
export const sceneNotification = diagram("scene-notification", { topic: "scene: 通知 (message → service → app)" })
  .lane("l", { x: 0, width: W })
  .node("m", { lane: "l", stack: 0, kind: "shape-message-bubble", title: "@花子", eyebrow: "発言", subtitle: "社内の連絡" })
  .node("h", { lane: "l", stack: 1, kind: "shape-hexagon", title: "通知の配達", eyebrow: "役務", subtitle: "即時に知らせる", w: 338 })
  .node("w", { lane: "l", stack: 2, kind: "shape-window", title: "デスクトップ通知", eyebrow: "アプリの画面", subtitle: "端末の標準機能" })
  .edge("m", "h", { label: "" })
  .edge("h", "w", { label: "" })
  .phase("p1", { duration: 750, title: "1. @花子", body: "社内の連絡" }, (p: PhaseBuilder) => p.activate("m").badge("発言"))
  .phase("p2", { duration: 750, title: "2. 通知の配達", body: "即時に知らせる" }, (p: PhaseBuilder) => p.activate("m").activate("h").badge("役務"))
  .phase("p3", { duration: 750, title: "通知", body: "発言を送ると通知の配達が受け取り、相手の画面に通知を出す。 送り手から受け手までをつなぐ流れ。" }, (p: PhaseBuilder) => p.activate("m").activate("h").activate("w").badge("アプリの画面"))
  .build();

/** S-21. trust bank asset (trader → 信託銀行 → 帳簿) */
export const sceneTrustAsset = diagram("scene-trust-asset", { topic: "scene: 信託資産 (trader → trust bank → 帳簿)" })
  .lane("l", { x: 0, width: W })
  .node("t", { lane: "l", stack: 0, kind: "shape-trader", title: "資産運用者", eyebrow: "売買", subtitle: "買いの指示" })
  .node("b", { lane: "l", stack: 1, kind: "shape-trust-bank", title: "三井住友信託", eyebrow: "信託銀行", subtitle: "受託" })
  .node("f", { lane: "l", stack: 2, kind: "shape-file", title: "運用報告書", eyebrow: "記録", subtitle: "月次" })
  .edge("t", "b", { label: "" })
  .edge("b", "f", { label: "" })
  .phase("p1", { duration: 750, title: "1. 資産運用者", body: "買いの指示" }, (p: PhaseBuilder) => p.activate("t").badge("売買"))
  .phase("p2", { duration: 750, title: "2. 三井住友信託", body: "受託" }, (p: PhaseBuilder) => p.activate("t").activate("b").badge("信託銀行"))
  .phase("p3", { duration: 750, title: "信託資産", body: "資産運用者が買いを指示し、信託銀行が預かって、月ごとの報告書を出す。 機関投資家の資産管理。" }, (p: PhaseBuilder) => p.activate("t").activate("b").activate("f").badge("記録"))
  .build();

/** S-22. blockchain node consensus (blockchain-node → blockchain-block → chain) */
export const sceneConsensus = diagram("scene-consensus", { topic: "scene: consensus (node → block → chain)" })
  .lane("l", { x: 0, width: W })
  .node("n", { lane: "l", stack: 0, kind: "shape-blockchain-node", title: "検証役", eyebrow: "参加者", subtitle: "預けた量で合意" })
  .node("b", { lane: "l", stack: 1, kind: "shape-blockchain-block", title: "高さ 8123456", eyebrow: "ブロック", subtitle: "提案中", w: 360 })
  .node("c", { lane: "l", stack: 2, kind: "shape-blockchain", title: "本流", eyebrow: "台帳", subtitle: "確定済み" })
  .edge("n", "b", { label: "" })
  .edge("b", "c", { label: "" })
  .phase("p1", { duration: 750, title: "1. 検証役", body: "預けた量で合意" }, (p: PhaseBuilder) => p.activate("n").badge("参加者"))
  .phase("p2", { duration: 750, title: "2. 高さ 8123456", body: "提案中" }, (p: PhaseBuilder) => p.activate("n").activate("b").badge("ブロック"))
  .phase("p3", { duration: 750, title: "合意の形成", body: "検証役がブロックを提案し、他の検証役の承認を集めて、本流の台帳で確定する。 預けた量で合意する方式の典型的な流れ。" }, (p: PhaseBuilder) => p.activate("n").activate("b").activate("c").badge("台帳"))
  .build();

/** S-23. token deploy (developer → contract → token) */
export const sceneTokenDeploy = diagram("scene-token-deploy", { topic: "scene: token deploy (dev → contract → token)" })
  .lane("l", { x: 0, width: W })
  .node("d", { lane: "l", stack: 0, kind: "shape-lawyer", title: "発行者", eyebrow: "開発者", subtitle: "創業者" })
  .node("c", { lane: "l", stack: 1, kind: "shape-smart-contract", title: "ERC-20", eyebrow: "契約", subtitle: "OpenZeppelin" })
  .node("t", { lane: "l", stack: 2, kind: "shape-token", title: "$KIWA", eyebrow: "通貨", subtitle: "発行 10 億枚" })
  .edge("d", "c", { label: "" })
  .edge("c", "t", { label: "" })
  .phase("p1", { duration: 750, title: "1. 発行者", body: "創業者" }, (p: PhaseBuilder) => p.activate("d").badge("開発者"))
  .phase("p2", { duration: 750, title: "2. ERC-20", body: "OpenZeppelin" }, (p: PhaseBuilder) => p.activate("d").activate("c").badge("契約"))
  .phase("p3", { duration: 750, title: "通貨の発行", body: "発行者が ERC-20 の契約を配備し、通貨を発行して市場へ出す。 新しい事業の立ち上げ。" }, (p: PhaseBuilder) => p.activate("d").activate("c").activate("t").badge("通貨"))
  .build();

/** S-24. regulator compliance (regulator → 帳簿 → 信託銀行) */
export const sceneCompliance = diagram("scene-compliance", { topic: "scene: 規制対応 (regulator → 帳簿 → bank)" })
  .lane("l", { x: 0, width: W })
  .node("r", { lane: "l", stack: 0, kind: "shape-regulator", title: "金融庁", eyebrow: "規制当局", subtitle: "検査" })
  .node("f", { lane: "l", stack: 1, kind: "shape-file", title: "取引の明細", eyebrow: "記録", subtitle: "監査の証跡" })
  .node("b", { lane: "l", stack: 2, kind: "shape-bank", title: "あおば銀行", eyebrow: "銀行", subtitle: "検査対象" })
  .edge("r", "f", { label: "" })
  .edge("f", "b", { label: "" })
  .phase("p1", { duration: 750, title: "1. 金融庁", body: "検査" }, (p: PhaseBuilder) => p.activate("r").badge("規制当局"))
  .phase("p2", { duration: 750, title: "2. 取引の明細", body: "監査の証跡" }, (p: PhaseBuilder) => p.activate("r").activate("f").badge("記録"))
  .phase("p3", { duration: 750, title: "規制への対応", body: "規制当局が検査を始めて取引の明細を出させ、銀行が検査に応じる。 金融庁の検査で踏む典型的な流れ。" }, (p: PhaseBuilder) => p.activate("r").activate("f").activate("b").badge("銀行"))
  .build();

/** S-25. cross-chain swap (wallet → exchange → NFT) */
export const sceneNftMarketplace = diagram("scene-nft-marketplace", { topic: "scene: NFT 売買 (buyer → marketplace → NFT)" })
  .lane("l", { x: 0, width: W })
  .node("b", { lane: "l", stack: 0, kind: "shape-wallet", title: "買い手", eyebrow: "財布", subtitle: "収集家" })
  .node("m", { lane: "l", stack: 1, kind: "shape-exchange", title: "OpenSea", eyebrow: "売買の場", subtitle: "作者への還元 5%" })
  .node("n", { lane: "l", stack: 2, kind: "shape-nft", title: "猿の絵 #7890", eyebrow: "NFT", subtitle: "人気の作品群", w: 272 })
  .edge("b", "m", { label: "" })
  .edge("m", "n", { label: "" })
  .phase("p1", { duration: 750, title: "1. 買い手", body: "収集家" }, (p: PhaseBuilder) => p.activate("b").badge("財布"))
  .phase("p2", { duration: 750, title: "2. OpenSea", body: "作者への還元 5%" }, (p: PhaseBuilder) => p.activate("b").activate("m").badge("売買の場"))
  .phase("p3", { duration: 750, title: "NFT の売買", body: "買い手が売買の場で値を付け、契約が動いて NFT の持ち主が移る。 二次流通の流れ。" }, (p: PhaseBuilder) => p.activate("b").activate("m").activate("n").badge("NFT"))
  .build();

/** S-26. network topology (router → network node → server) */
export const sceneNetworkPath = diagram("scene-network-path", { topic: "scene: network (router → hub → server)" })
  .lane("l", { x: 0, width: W })
  .node("m", { lane: "l", stack: 0, kind: "shape-mobile-device", title: "社員の携帯", eyebrow: "端末", subtitle: "無線でつなぐ" })
  .node("n", { lane: "l", stack: 1, kind: "shape-network-node", title: "基幹の中継器", eyebrow: "通信網", subtitle: "L2/L3" })
  .node("s", { lane: "l", stack: 2, kind: "shape-server-rack", title: "業務の処理役", eyebrow: "サーバ", subtitle: "データセンター", w: 272 })
  .edge("m", "n", { label: "" })
  .edge("n", "s", { label: "" })
  .phase("p1", { duration: 750, title: "1. 社員の携帯", body: "無線でつなぐ" }, (p: PhaseBuilder) => p.activate("m").badge("端末"))
  .phase("p2", { duration: 750, title: "2. 基幹の中継器", body: "L2/L3" }, (p: PhaseBuilder) => p.activate("m").activate("n").badge("通信網"))
  .phase("p3", { duration: 750, title: "通信の経路", body: "社員の携帯から基幹の中継器を通って、業務のサーバへ届く。 会社の通信網でよくある 3 段の経路。" }, (p: PhaseBuilder) => p.activate("m").activate("n").activate("s").badge("サーバ"))
  .build();

/** S-27. website checkout (website → payment → credit card) */
export const sceneCheckout = diagram("scene-checkout", { topic: "scene: checkout (site → provider → card)" })
  .lane("l", { x: 0, width: W })
  .node("w", { lane: "l", stack: 0, kind: "shape-website", title: "山田商店の通販", eyebrow: "サイト", subtitle: "かごの中身", w: 404 })
  .node("p", { lane: "l", stack: 1, kind: "shape-payment-provider", title: "PayPal", eyebrow: "決済代行", subtitle: "支払いの手続き" })
  .node("c", { lane: "l", stack: 2, kind: "shape-credit-card", title: "MasterCard", eyebrow: "カード", subtitle: "後払い" })
  .edge("w", "p", { label: "" })
  .edge("p", "c", { label: "" })
  .phase("p1", { duration: 750, title: "1. 山田商店の通販", body: "かごの中身" }, (p: PhaseBuilder) => p.activate("w").badge("サイト"))
  .phase("p2", { duration: 750, title: "2. PayPal", body: "支払いの手続き" }, (p: PhaseBuilder) => p.activate("w").activate("p").badge("決済代行"))
  .phase("p3", { duration: 750, title: "通販の支払い", body: "サイトでかごの中身を送り、決済代行を通して、カードの承認を得る。 通販の支払いの典型的な流れ。" }, (p: PhaseBuilder) => p.activate("w").activate("p").activate("c").badge("カード"))
  .build();

/** S-28. edge computing (mobile → CDN edge → cloud) */
export const sceneEdgeCompute = diagram("scene-edge-compute", { topic: "scene: edge compute (mobile → CDN → cloud)" })
  .lane("l", { x: 0, width: W })
  .node("m", { lane: "l", stack: 0, kind: "shape-mobile-device", title: "Android のアプリ", eyebrow: "携帯端末", subtitle: "利用者", w: 294 })
  .node("e", { lane: "l", stack: 1, kind: "shape-cdn-edge", title: "Fastly", eyebrow: "配信網", subtitle: "拠点で処理する" })
  .node("c", { lane: "l", stack: 2, kind: "shape-cloud", title: "GCP の配信元", eyebrow: "クラウド", subtitle: "拠点で返せない時" })
  .edge("m", "e", { label: "" })
  .edge("e", "c", { label: "" })
  .phase("p1", { duration: 750, title: "1. Android のアプリ", body: "利用者" }, (p: PhaseBuilder) => p.activate("m").badge("携帯端末"))
  .phase("p2", { duration: 750, title: "2. Fastly", body: "拠点で処理する" }, (p: PhaseBuilder) => p.activate("m").activate("e").badge("配信網"))
  .phase("p3", { duration: 750, title: "拠点での処理", body: "携帯の要求を配信網の拠点で処理し、返せない時だけ配信元へ回す。 待ち時間の短い配信。" }, (p: PhaseBuilder) => p.activate("m").activate("e").activate("c").badge("クラウド"))
  .build();

/** S-29. stack version deploy (stack → gear → website) */
export const sceneVersionDeploy = diagram("scene-version-deploy", { topic: "scene: version deploy (stack → gear → site)" })
  .lane("l", { x: 0, width: W })
  .node("s", { lane: "l", stack: 0, kind: "shape-stack", title: "v3.2.0", eyebrow: "公開版", subtitle: "目印を付けた", w: 360 })
  .node("g", { lane: "l", stack: 1, kind: "shape-gear", title: "配備の流れ", eyebrow: "自動化", subtitle: "一部へ先に配る", w: 382 })
  .node("w", { lane: "l", stack: 2, kind: "shape-website", title: "本番の画面", eyebrow: "サイト", subtitle: "公開中", w: 404 })
  .edge("s", "g", { label: "" })
  .edge("g", "w", { label: "" })
  .phase("p1", { duration: 750, title: "1. v3.2.0", body: "目印を付けた" }, (p: PhaseBuilder) => p.activate("s").badge("公開版"))
  .phase("p2", { duration: 750, title: "2. 配備の流れ", body: "一部へ先に配る" }, (p: PhaseBuilder) => p.activate("s").activate("g").badge("自動化"))
  .phase("p3", { duration: 750, title: "版の配備", body: "版に目印を付け、配備の流れで一部へ先に配ってから、本番のサイトに出す。 クラウドの役務でよくある配備の形。" }, (p: PhaseBuilder) => p.activate("s").activate("g").activate("w").badge("サイト"))
  .build();

/** S-30. audit compliance chain (auditor → file → regulator) */
export const sceneAuditChain = diagram("scene-audit-chain", { topic: "scene: audit chain (auditor → file → regulator)" })
  .lane("l", { x: 0, width: W })
  .node("a", { lane: "l", stack: 0, kind: "shape-auditor", title: "監査法人", eyebrow: "監査", subtitle: "大手の一つ" })
  .node("f", { lane: "l", stack: 1, kind: "shape-file", title: "監査報告書", eyebrow: "提出物", subtitle: "署名済み" })
  .node("r", { lane: "l", stack: 2, kind: "shape-regulator", title: "金融庁", eyebrow: "規制当局", subtitle: "受領" })
  .edge("a", "f", { label: "" })
  .edge("f", "r", { label: "" })
  .phase("p1", { duration: 750, title: "1. 監査法人", body: "大手の一つ" }, (p: PhaseBuilder) => p.activate("a").badge("監査"))
  .phase("p2", { duration: 750, title: "2. 監査報告書", body: "署名済み" }, (p: PhaseBuilder) => p.activate("a").activate("f").badge("提出物"))
  .phase("p3", { duration: 750, title: "監査の報告", body: "監査法人が検査して報告書を作り、規制当局が受け取る。 上場企業の四半期ごとの監査の典型的な流れ。" }, (p: PhaseBuilder) => p.activate("a").activate("f").activate("r").badge("規制当局"))
  .build();

/**
 * source 記法 sample (人 / LLM が dragon で書く時の記法対応表を catalog UI で表示するため)。
 * key convention = `sourceYaml__<diagram export key>` / `sourceJson__<diagram export key>`。
 * catalog-items.ts の moduleToItems がこの suffix を検出して該当 CatalogItem に付与する。
 */

export const sourceYaml__sceneCryptoTransfer = `title: "scene: crypto 送金 (wallet → exchange → chain)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 送金者: { kind: shape-wallet, lane: l, stack: 0, eyebrow: "財布", subtitle: "MetaMask の口座" }
  - 分散型取引所: { kind: shape-exchange, lane: l, stack: 1, eyebrow: "取引所", subtitle: "清算" }
  - Ethereum: { kind: shape-ethereum-chain, lane: l, stack: 2, eyebrow: "台帳", subtitle: "L1 の本番の網" }

flow:
  - 送金者 -> 分散型取引所: "" (accent)
  - 分散型取引所 -> Ethereum: "" (accent)

animation:
  - step: "1. 送金者" 0.75s
    focus: ["送金者"]
    badge: "財布"
    description: "MetaMask の口座"
  - step: "2. 分散型取引所" 0.75s
    focus: ["送金者", "分散型取引所"]
    badge: "取引所"
    description: "清算"
  - step: "暗号資産の送金" 0.75s
    focus: ["送金者", "分散型取引所", "Ethereum"]
    badge: "台帳"
    description: "送金者の財布が分散型取引所へ注文を出し、取引所が Ethereum の台帳で決済する。 個人の口座から L1 まで 3 段で進む場面。"
`;

export const sourceJson__sceneCryptoTransfer = `{
  "title": "scene: crypto 送金 (wallet → exchange → chain)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "送金者",
      "kind": "shape-wallet",
      "lane": "l",
      "stack": 0,
      "eyebrow": "財布",
      "subtitle": "MetaMask の口座"
    },
    {
      "name": "分散型取引所",
      "kind": "shape-exchange",
      "lane": "l",
      "stack": 1,
      "eyebrow": "取引所",
      "subtitle": "清算"
    },
    {
      "name": "Ethereum",
      "kind": "shape-ethereum-chain",
      "lane": "l",
      "stack": 2,
      "eyebrow": "台帳",
      "subtitle": "L1 の本番の網"
    }
  ],
  "flow": [
    { "from": "送金者", "to": "分散型取引所", "label": "", "tone": "accent" },
    { "from": "分散型取引所", "to": "Ethereum", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. 送金者",
      "duration": 0.75,
      "focus": ["送金者"],
      "badge": "財布",
      "body": "MetaMask の口座"
    },
    {
      "step": "2. 分散型取引所",
      "duration": 0.75,
      "focus": ["送金者", "分散型取引所"],
      "badge": "取引所",
      "body": "清算"
    },
    {
      "step": "暗号資産の送金",
      "duration": 0.75,
      "focus": ["送金者", "分散型取引所", "Ethereum"],
      "badge": "台帳",
      "body": "送金者の財布が分散型取引所へ注文を出し、取引所が Ethereum の台帳で決済する。 個人の口座から L1 まで 3 段で進む場面。"
    }
  ]
}`;

export const sourceYaml__sceneLegalNotarization = `title: "scene: 法務 (弁護士 → 公証人 → 登記)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 代理人: { kind: shape-lawyer, lane: l, stack: 0, eyebrow: "法務", subtitle: "起草" }
  - 公証役場: { kind: shape-notary, lane: l, stack: 1, eyebrow: "公証", subtitle: "認証" }
  - 登記簿: { kind: shape-file, lane: l, stack: 2, eyebrow: "記録", subtitle: "法務局に保管" }

flow:
  - 代理人 -> 公証役場: "" (accent)
  - 公証役場 -> 登記簿: "" (accent)

animation:
  - step: "1. 代理人" 0.75s
    focus: ["代理人"]
    badge: "法務"
    description: "起草"
  - step: "2. 公証役場" 0.75s
    focus: ["代理人", "公証役場"]
    badge: "公証"
    description: "認証"
  - step: "法務の流れ" 0.75s
    focus: ["代理人", "公証役場", "登記簿"]
    badge: "記録"
    description: "代理人が起草し、公証役場が認証して、登記簿に記録する。 契約や遺言、不動産の譲渡で踏む正式な流れ。"
`;

export const sourceJson__sceneLegalNotarization = `{
  "title": "scene: 法務 (弁護士 → 公証人 → 登記)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "代理人",
      "kind": "shape-lawyer",
      "lane": "l",
      "stack": 0,
      "eyebrow": "法務",
      "subtitle": "起草"
    },
    {
      "name": "公証役場",
      "kind": "shape-notary",
      "lane": "l",
      "stack": 1,
      "eyebrow": "公証",
      "subtitle": "認証"
    },
    {
      "name": "登記簿",
      "kind": "shape-file",
      "lane": "l",
      "stack": 2,
      "eyebrow": "記録",
      "subtitle": "法務局に保管"
    }
  ],
  "flow": [
    { "from": "代理人", "to": "公証役場", "label": "", "tone": "accent" },
    { "from": "公証役場", "to": "登記簿", "label": "", "tone": "accent" }
  ],
  "animation": [
    { "step": "1. 代理人", "duration": 0.75, "focus": ["代理人"], "badge": "法務", "body": "起草" },
    {
      "step": "2. 公証役場",
      "duration": 0.75,
      "focus": ["代理人", "公証役場"],
      "badge": "公証",
      "body": "認証"
    },
    {
      "step": "法務の流れ",
      "duration": 0.75,
      "focus": ["代理人", "公証役場", "登記簿"],
      "badge": "記録",
      "body": "代理人が起草し、公証役場が認証して、登記簿に記録する。 契約や遺言、不動産の譲渡で踏む正式な流れ。"
    }
  ]
}`;

export const sourceYaml__sceneNftMint = `title: "scene: NFT mint (wallet → contract → NFT)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 作者: { kind: shape-wallet, lane: l, stack: 0, eyebrow: "財布", subtitle: "絵描き" }
  - ERC-721: { kind: shape-smart-contract, lane: l, stack: 1, eyebrow: "契約", subtitle: "OpenSea に出品" }
  - 一点物の絵: { kind: shape-nft, lane: l, stack: 2, eyebrow: "NFT", subtitle: "#42" }

flow:
  - 作者 -> ERC-721: "" (accent)
  - ERC-721 -> 一点物の絵: "" (accent)

animation:
  - step: "1. 作者" 0.75s
    focus: ["作者"]
    badge: "財布"
    description: "絵描き"
  - step: "2. ERC-721" 0.75s
    focus: ["作者", "ERC-721"]
    badge: "契約"
    description: "OpenSea に出品"
  - step: "NFT の発行" 0.75s
    focus: ["作者", "ERC-721", "一点物の絵"]
    badge: "NFT"
    description: "作者の財布が ERC-721 の契約を呼び、NFT が発行される。 NFT を発行する時の典型的な 3 段の流れ。"
`;

export const sourceJson__sceneNftMint = `{
  "title": "scene: NFT mint (wallet → contract → NFT)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "作者",
      "kind": "shape-wallet",
      "lane": "l",
      "stack": 0,
      "eyebrow": "財布",
      "subtitle": "絵描き"
    },
    {
      "name": "ERC-721",
      "kind": "shape-smart-contract",
      "lane": "l",
      "stack": 1,
      "eyebrow": "契約",
      "subtitle": "OpenSea に出品"
    },
    {
      "name": "一点物の絵",
      "kind": "shape-nft",
      "lane": "l",
      "stack": 2,
      "eyebrow": "NFT",
      "subtitle": "#42"
    }
  ],
  "flow": [
    { "from": "作者", "to": "ERC-721", "label": "", "tone": "accent" },
    { "from": "ERC-721", "to": "一点物の絵", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. 作者",
      "duration": 0.75,
      "focus": ["作者"],
      "badge": "財布",
      "body": "絵描き"
    },
    {
      "step": "2. ERC-721",
      "duration": 0.75,
      "focus": ["作者", "ERC-721"],
      "badge": "契約",
      "body": "OpenSea に出品"
    },
    {
      "step": "NFT の発行",
      "duration": 0.75,
      "focus": ["作者", "ERC-721", "一点物の絵"],
      "badge": "NFT",
      "body": "作者の財布が ERC-721 の契約を呼び、NFT が発行される。 NFT を発行する時の典型的な 3 段の流れ。"
    }
  ]
}`;

export const sourceYaml__sceneBankingFlow = `title: "scene: 銀行送金 (ATM → 銀行 → EC)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - ATM: { kind: shape-atm, lane: l, stack: 0, eyebrow: "現金の窓口", subtitle: "現金を引き出す" }
  - みずほ銀行: { kind: shape-bank, lane: l, stack: 1, eyebrow: "銀行", subtitle: "都銀" }
  - Amazon: { kind: shape-online-shop, lane: l, stack: 2, eyebrow: "店", subtitle: "ネット通販" }

flow:
  - ATM -> みずほ銀行: "" (accent)
  - みずほ銀行 -> Amazon: "" (accent)

animation:
  - step: "1. ATM" 0.75s
    focus: ["ATM"]
    badge: "現金の窓口"
    description: "現金を引き出す"
  - step: "2. みずほ銀行" 0.75s
    focus: ["ATM", "みずほ銀行"]
    badge: "銀行"
    description: "都銀"
  - step: "銀行の送金" 0.75s
    focus: ["ATM", "みずほ銀行", "Amazon"]
    badge: "店"
    description: "ATM で現金を引き出し、銀行の口座を通して、通販の代金を払う。 暮らしの中でお金が動く流れ。"
`;

export const sourceJson__sceneBankingFlow = `{
  "title": "scene: 銀行送金 (ATM → 銀行 → EC)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "ATM",
      "kind": "shape-atm",
      "lane": "l",
      "stack": 0,
      "eyebrow": "現金の窓口",
      "subtitle": "現金を引き出す"
    },
    {
      "name": "みずほ銀行",
      "kind": "shape-bank",
      "lane": "l",
      "stack": 1,
      "eyebrow": "銀行",
      "subtitle": "都銀"
    },
    {
      "name": "Amazon",
      "kind": "shape-online-shop",
      "lane": "l",
      "stack": 2,
      "eyebrow": "店",
      "subtitle": "ネット通販"
    }
  ],
  "flow": [
    { "from": "ATM", "to": "みずほ銀行", "label": "", "tone": "accent" },
    { "from": "みずほ銀行", "to": "Amazon", "label": "", "tone": "accent" }
  ],
  "animation": [
    { "step": "1. ATM", "duration": 0.75, "focus": ["ATM"], "badge": "現金の窓口", "body": "現金を引き出す" },
    {
      "step": "2. みずほ銀行",
      "duration": 0.75,
      "focus": ["ATM", "みずほ銀行"],
      "badge": "銀行",
      "body": "都銀"
    },
    {
      "step": "銀行の送金",
      "duration": 0.75,
      "focus": ["ATM", "みずほ銀行", "Amazon"],
      "badge": "店",
      "body": "ATM で現金を引き出し、銀行の口座を通して、通販の代金を払う。 暮らしの中でお金が動く流れ。"
    }
  ]
}`;

export const sourceYaml__sceneIotOnchain = `title: "scene: IoT 機器から台帳へ (sensor → RPC → contract)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 温度計: { kind: shape-iot-sensor, lane: l, stack: 0, eyebrow: "計測機器", subtitle: "近距離の無線" }
  - Infura: { kind: shape-rpc-node, lane: l, stack: 1, eyebrow: "RPC の窓口", subtitle: "窓口を貸す事業者" }
  - 外部データの受け口: { kind: shape-smart-contract, lane: l, stack: 2, eyebrow: "契約", subtitle: "Solidity", posW: 360 }

flow:
  - 温度計 -> Infura: "" (accent)
  - Infura -> 外部データの受け口: "" (accent)

animation:
  - step: "1. 温度計" 0.75s
    focus: ["温度計"]
    badge: "計測機器"
    description: "近距離の無線"
  - step: "2. Infura" 0.75s
    focus: ["温度計", "Infura"]
    badge: "RPC の窓口"
    description: "窓口を貸す事業者"
  - step: "計測値を台帳へ" 0.75s
    focus: ["温度計", "Infura", "外部データの受け口"]
    badge: "契約"
    description: "温度計の値を RPC の窓口へ送り、外部データの受け口の契約が台帳に書き込む。 現実の計測値を台帳に残す流れ。"
`;

export const sourceJson__sceneIotOnchain = `{
  "title": "scene: IoT 機器から台帳へ (sensor → RPC → contract)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "温度計",
      "kind": "shape-iot-sensor",
      "lane": "l",
      "stack": 0,
      "eyebrow": "計測機器",
      "subtitle": "近距離の無線"
    },
    {
      "name": "Infura",
      "kind": "shape-rpc-node",
      "lane": "l",
      "stack": 1,
      "eyebrow": "RPC の窓口",
      "subtitle": "窓口を貸す事業者"
    },
    {
      "name": "外部データの受け口",
      "kind": "shape-smart-contract",
      "lane": "l",
      "stack": 2,
      "eyebrow": "契約",
      "subtitle": "Solidity",
      "posW": 360
    }
  ],
  "flow": [
    { "from": "温度計", "to": "Infura", "label": "", "tone": "accent" },
    { "from": "Infura", "to": "外部データの受け口", "label": "", "tone": "accent" }
  ],
  "animation": [
    { "step": "1. 温度計", "duration": 0.75, "focus": ["温度計"], "badge": "計測機器", "body": "近距離の無線" },
    {
      "step": "2. Infura",
      "duration": 0.75,
      "focus": ["温度計", "Infura"],
      "badge": "RPC の窓口",
      "body": "窓口を貸す事業者"
    },
    {
      "step": "計測値を台帳へ",
      "duration": 0.75,
      "focus": ["温度計", "Infura", "外部データの受け口"],
      "badge": "契約",
      "body": "温度計の値を RPC の窓口へ送り、外部データの受け口の契約が台帳に書き込む。 現実の計測値を台帳に残す流れ。"
    }
  ]
}`;

export const sourceYaml__sceneAuditFlow = `title: "scene: 監査 (auditor → 帳簿 → regulator)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 監査法人: { kind: shape-auditor, lane: l, stack: 0, eyebrow: "監査", subtitle: "検査" }
  - 会計帳簿: { kind: shape-file, lane: l, stack: 1, eyebrow: "記録", subtitle: "元帳" }
  - 金融庁: { kind: shape-regulator, lane: l, stack: 2, eyebrow: "規制当局", subtitle: "監督" }

flow:
  - 監査法人 -> 会計帳簿: "" (accent)
  - 会計帳簿 -> 金融庁: "" (accent)

animation:
  - step: "1. 監査法人" 0.75s
    focus: ["監査法人"]
    badge: "監査"
    description: "検査"
  - step: "2. 会計帳簿" 0.75s
    focus: ["監査法人", "会計帳簿"]
    badge: "記録"
    description: "元帳"
  - step: "監査の流れ" 0.75s
    focus: ["監査法人", "会計帳簿", "金融庁"]
    badge: "規制当局"
    description: "監査法人が帳簿を確かめ、規制当局へ報告する。 上場企業の財務監査で踏む 3 段の流れ。"
`;

export const sourceJson__sceneAuditFlow = `{
  "title": "scene: 監査 (auditor → 帳簿 → regulator)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "監査法人",
      "kind": "shape-auditor",
      "lane": "l",
      "stack": 0,
      "eyebrow": "監査",
      "subtitle": "検査"
    },
    {
      "name": "会計帳簿",
      "kind": "shape-file",
      "lane": "l",
      "stack": 1,
      "eyebrow": "記録",
      "subtitle": "元帳"
    },
    {
      "name": "金融庁",
      "kind": "shape-regulator",
      "lane": "l",
      "stack": 2,
      "eyebrow": "規制当局",
      "subtitle": "監督"
    }
  ],
  "flow": [
    { "from": "監査法人", "to": "会計帳簿", "label": "", "tone": "accent" },
    { "from": "会計帳簿", "to": "金融庁", "label": "", "tone": "accent" }
  ],
  "animation": [
    { "step": "1. 監査法人", "duration": 0.75, "focus": ["監査法人"], "badge": "監査", "body": "検査" },
    {
      "step": "2. 会計帳簿",
      "duration": 0.75,
      "focus": ["監査法人", "会計帳簿"],
      "badge": "記録",
      "body": "元帳"
    },
    {
      "step": "監査の流れ",
      "duration": 0.75,
      "focus": ["監査法人", "会計帳簿", "金融庁"],
      "badge": "規制当局",
      "body": "監査法人が帳簿を確かめ、規制当局へ報告する。 上場企業の財務監査で踏む 3 段の流れ。"
    }
  ]
}`;

export const sourceYaml__sceneStockTrading = `title: "scene: 証券取引 (trader → 証券会社 → 取引所)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 個人投資家: { kind: shape-trader, lane: l, stack: 0, eyebrow: "売買", subtitle: "小口の注文" }
  - 野村証券: { kind: shape-brokerage, lane: l, stack: 1, eyebrow: "証券", subtitle: "投資銀行" }
  - 東証: { kind: shape-exchange, lane: l, stack: 2, eyebrow: "取引所", subtitle: "プライム市場" }

flow:
  - 個人投資家 -> 野村証券: "" (accent)
  - 野村証券 -> 東証: "" (accent)

animation:
  - step: "1. 個人投資家" 0.75s
    focus: ["個人投資家"]
    badge: "売買"
    description: "小口の注文"
  - step: "2. 野村証券" 0.75s
    focus: ["個人投資家", "野村証券"]
    badge: "証券"
    description: "投資銀行"
  - step: "証券取引" 0.75s
    focus: ["個人投資家", "野村証券", "東証"]
    badge: "取引所"
    description: "個人投資家が証券会社へ発注し、取引所で約定する。 株の売買で踏む 3 段の場面。"
`;

export const sourceJson__sceneStockTrading = `{
  "title": "scene: 証券取引 (trader → 証券会社 → 取引所)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "個人投資家",
      "kind": "shape-trader",
      "lane": "l",
      "stack": 0,
      "eyebrow": "売買",
      "subtitle": "小口の注文"
    },
    {
      "name": "野村証券",
      "kind": "shape-brokerage",
      "lane": "l",
      "stack": 1,
      "eyebrow": "証券",
      "subtitle": "投資銀行"
    },
    {
      "name": "東証",
      "kind": "shape-exchange",
      "lane": "l",
      "stack": 2,
      "eyebrow": "取引所",
      "subtitle": "プライム市場"
    }
  ],
  "flow": [
    { "from": "個人投資家", "to": "野村証券", "label": "", "tone": "accent" },
    { "from": "野村証券", "to": "東証", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. 個人投資家",
      "duration": 0.75,
      "focus": ["個人投資家"],
      "badge": "売買",
      "body": "小口の注文"
    },
    {
      "step": "2. 野村証券",
      "duration": 0.75,
      "focus": ["個人投資家", "野村証券"],
      "badge": "証券",
      "body": "投資銀行"
    },
    {
      "step": "証券取引",
      "duration": 0.75,
      "focus": ["個人投資家", "野村証券", "東証"],
      "badge": "取引所",
      "body": "個人投資家が証券会社へ発注し、取引所で約定する。 株の売買で踏む 3 段の場面。"
    }
  ]
}`;

export const sourceYaml__sceneSupportFlow = `title: "scene: 問い合わせ (CS → ticket → 開発)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - サポート担当: { kind: shape-customer-service, lane: l, stack: 0, eyebrow: "問い合わせ", subtitle: "24 時間対応" }
  - 不具合 #1234: { kind: shape-kanban-card, lane: l, stack: 1, eyebrow: "課題", subtitle: "管理表に起票" }
  - 緊急の修正: { kind: shape-code-block, lane: l, stack: 2, eyebrow: "変更の確定", subtitle: "開発者が直す" }

flow:
  - サポート担当 -> 不具合 #1234: "" (accent)
  - 不具合 #1234 -> 緊急の修正: "" (accent)

animation:
  - step: "1. サポート担当" 0.75s
    focus: ["サポート担当"]
    badge: "問い合わせ"
    description: "24 時間対応"
  - step: "2. 不具合 #1234" 0.75s
    focus: ["サポート担当", "不具合 #1234"]
    badge: "課題"
    description: "管理表に起票"
  - step: "問い合わせの流れ" 0.75s
    focus: ["サポート担当", "不具合 #1234", "緊急の修正"]
    badge: "変更の確定"
    description: "サポート担当が電話を受け、課題として起票し、開発者が緊急の修正を出す。 不具合の報告から修正までの、よくある 3 段の流れ。"
`;

export const sourceJson__sceneSupportFlow = `{
  "title": "scene: 問い合わせ (CS → ticket → 開発)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "サポート担当",
      "kind": "shape-customer-service",
      "lane": "l",
      "stack": 0,
      "eyebrow": "問い合わせ",
      "subtitle": "24 時間対応"
    },
    {
      "name": "不具合 #1234",
      "kind": "shape-kanban-card",
      "lane": "l",
      "stack": 1,
      "eyebrow": "課題",
      "subtitle": "管理表に起票"
    },
    {
      "name": "緊急の修正",
      "kind": "shape-code-block",
      "lane": "l",
      "stack": 2,
      "eyebrow": "変更の確定",
      "subtitle": "開発者が直す"
    }
  ],
  "flow": [
    { "from": "サポート担当", "to": "不具合 #1234", "label": "", "tone": "accent" },
    { "from": "不具合 #1234", "to": "緊急の修正", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. サポート担当",
      "duration": 0.75,
      "focus": ["サポート担当"],
      "badge": "問い合わせ",
      "body": "24 時間対応"
    },
    {
      "step": "2. 不具合 #1234",
      "duration": 0.75,
      "focus": ["サポート担当", "不具合 #1234"],
      "badge": "課題",
      "body": "管理表に起票"
    },
    {
      "step": "問い合わせの流れ",
      "duration": 0.75,
      "focus": ["サポート担当", "不具合 #1234", "緊急の修正"],
      "badge": "変更の確定",
      "body": "サポート担当が電話を受け、課題として起票し、開発者が緊急の修正を出す。 不具合の報告から修正までの、よくある 3 段の流れ。"
    }
  ]
}`;

export const sourceYaml__scenePaymentSettlement = `title: "scene: 決済 (provider → クレカ → 銀行)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - Stripe: { kind: shape-payment-provider, lane: l, stack: 0, eyebrow: "決済代行", subtitle: "クラウドで提供" }
  - VISA: { kind: shape-credit-card, lane: l, stack: 1, eyebrow: "カード", subtitle: "後払い" }
  - 発行銀行: { kind: shape-bank, lane: l, stack: 2, eyebrow: "発行元", subtitle: "三菱 UFJ 銀行" }

flow:
  - Stripe -> VISA: "" (accent)
  - VISA -> 発行銀行: "" (accent)

animation:
  - step: "1. Stripe" 0.75s
    focus: ["Stripe"]
    badge: "決済代行"
    description: "クラウドで提供"
  - step: "2. VISA" 0.75s
    focus: ["Stripe", "VISA"]
    badge: "カード"
    description: "後払い"
  - step: "決済の流れ" 0.75s
    focus: ["Stripe", "VISA", "発行銀行"]
    badge: "発行元"
    description: "Stripe がカードの承認を求め、発行銀行が決済する。 通販のカード払いで踏む 3 段の流れ。"
`;

export const sourceJson__scenePaymentSettlement = `{
  "title": "scene: 決済 (provider → クレカ → 銀行)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "Stripe",
      "kind": "shape-payment-provider",
      "lane": "l",
      "stack": 0,
      "eyebrow": "決済代行",
      "subtitle": "クラウドで提供"
    },
    {
      "name": "VISA",
      "kind": "shape-credit-card",
      "lane": "l",
      "stack": 1,
      "eyebrow": "カード",
      "subtitle": "後払い"
    },
    {
      "name": "発行銀行",
      "kind": "shape-bank",
      "lane": "l",
      "stack": 2,
      "eyebrow": "発行元",
      "subtitle": "三菱 UFJ 銀行"
    }
  ],
  "flow": [
    { "from": "Stripe", "to": "VISA", "label": "", "tone": "accent" },
    { "from": "VISA", "to": "発行銀行", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. Stripe",
      "duration": 0.75,
      "focus": ["Stripe"],
      "badge": "決済代行",
      "body": "クラウドで提供"
    },
    {
      "step": "2. VISA",
      "duration": 0.75,
      "focus": ["Stripe", "VISA"],
      "badge": "カード",
      "body": "後払い"
    },
    {
      "step": "決済の流れ",
      "duration": 0.75,
      "focus": ["Stripe", "VISA", "発行銀行"],
      "badge": "発行元",
      "body": "Stripe がカードの承認を求め、発行銀行が決済する。 通販のカード払いで踏む 3 段の流れ。"
    }
  ]
}`;

export const sourceYaml__sceneWebInfra = `title: "scene: web infra (website → CDN → server)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 会社案内: { kind: shape-website, lane: l, stack: 0, eyebrow: "サイト", subtitle: "1 画面で動くアプリ" }
  - Cloudflare: { kind: shape-cdn-edge, lane: l, stack: 1, eyebrow: "配信網", subtitle: "近くの拠点" }
  - 配信元: { kind: shape-server-rack, lane: l, stack: 2, eyebrow: "サーバ", subtitle: "AWS" }

flow:
  - 会社案内 -> Cloudflare: "" (accent)
  - Cloudflare -> 配信元: "" (accent)

animation:
  - step: "1. 会社案内" 0.75s
    focus: ["会社案内"]
    badge: "サイト"
    description: "1 画面で動くアプリ"
  - step: "2. Cloudflare" 0.75s
    focus: ["会社案内", "Cloudflare"]
    badge: "配信網"
    description: "近くの拠点"
  - step: "サイトの配信" 0.75s
    focus: ["会社案内", "Cloudflare", "配信元"]
    badge: "サーバ"
    description: "サイトへの要求を配信網の控えで返し、無い時だけ配信元のサーバへ取りに行く。 サイトの配信でよく使う 3 層の形。"
`;

export const sourceJson__sceneWebInfra = `{
  "title": "scene: web infra (website → CDN → server)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "会社案内",
      "kind": "shape-website",
      "lane": "l",
      "stack": 0,
      "eyebrow": "サイト",
      "subtitle": "1 画面で動くアプリ"
    },
    {
      "name": "Cloudflare",
      "kind": "shape-cdn-edge",
      "lane": "l",
      "stack": 1,
      "eyebrow": "配信網",
      "subtitle": "近くの拠点"
    },
    {
      "name": "配信元",
      "kind": "shape-server-rack",
      "lane": "l",
      "stack": 2,
      "eyebrow": "サーバ",
      "subtitle": "AWS"
    }
  ],
  "flow": [
    { "from": "会社案内", "to": "Cloudflare", "label": "", "tone": "accent" },
    { "from": "Cloudflare", "to": "配信元", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. 会社案内",
      "duration": 0.75,
      "focus": ["会社案内"],
      "badge": "サイト",
      "body": "1 画面で動くアプリ"
    },
    {
      "step": "2. Cloudflare",
      "duration": 0.75,
      "focus": ["会社案内", "Cloudflare"],
      "badge": "配信網",
      "body": "近くの拠点"
    },
    {
      "step": "サイトの配信",
      "duration": 0.75,
      "focus": ["会社案内", "Cloudflare", "配信元"],
      "badge": "サーバ",
      "body": "サイトへの要求を配信網の控えで返し、無い時だけ配信元のサーバへ取りに行く。 サイトの配信でよく使う 3 層の形。"
    }
  ]
}`;

export const sourceYaml__sceneTokenBridge = `title: "scene: token bridge (chain A → bridge → chain B)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - Ethereum: { kind: shape-ethereum-chain, lane: l, stack: 0, eyebrow: "送る側の台帳", subtitle: "L1" }
  - 橋渡し: { kind: shape-smart-contract, lane: l, stack: 1, eyebrow: "契約", subtitle: "預かって凍結" }
  - Arbitrum: { kind: shape-blockchain, lane: l, stack: 2, eyebrow: "受ける側の台帳", subtitle: "L2" }

flow:
  - Ethereum -> 橋渡し: "" (accent)
  - 橋渡し -> Arbitrum: "" (accent)

animation:
  - step: "1. Ethereum" 0.75s
    focus: ["Ethereum"]
    badge: "送る側の台帳"
    description: "L1"
  - step: "2. 橋渡し" 0.75s
    focus: ["Ethereum", "橋渡し"]
    badge: "契約"
    description: "預かって凍結"
  - step: "通貨の橋渡し" 0.75s
    focus: ["Ethereum", "橋渡し", "Arbitrum"]
    badge: "受ける側の台帳"
    description: "送る側の台帳で通貨を凍結し、橋渡しの契約を通して、受ける側の台帳で同じ額を発行する。 台帳をまたいで資産を移す流れ。"
`;

export const sourceJson__sceneTokenBridge = `{
  "title": "scene: token bridge (chain A → bridge → chain B)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "Ethereum",
      "kind": "shape-ethereum-chain",
      "lane": "l",
      "stack": 0,
      "eyebrow": "送る側の台帳",
      "subtitle": "L1"
    },
    {
      "name": "橋渡し",
      "kind": "shape-smart-contract",
      "lane": "l",
      "stack": 1,
      "eyebrow": "契約",
      "subtitle": "預かって凍結"
    },
    {
      "name": "Arbitrum",
      "kind": "shape-blockchain",
      "lane": "l",
      "stack": 2,
      "eyebrow": "受ける側の台帳",
      "subtitle": "L2"
    }
  ],
  "flow": [
    { "from": "Ethereum", "to": "橋渡し", "label": "", "tone": "accent" },
    { "from": "橋渡し", "to": "Arbitrum", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. Ethereum",
      "duration": 0.75,
      "focus": ["Ethereum"],
      "badge": "送る側の台帳",
      "body": "L1"
    },
    {
      "step": "2. 橋渡し",
      "duration": 0.75,
      "focus": ["Ethereum", "橋渡し"],
      "badge": "契約",
      "body": "預かって凍結"
    },
    {
      "step": "通貨の橋渡し",
      "duration": 0.75,
      "focus": ["Ethereum", "橋渡し", "Arbitrum"],
      "badge": "受ける側の台帳",
      "body": "送る側の台帳で通貨を凍結し、橋渡しの契約を通して、受ける側の台帳で同じ額を発行する。 台帳をまたいで資産を移す流れ。"
    }
  ]
}`;

export const sourceYaml__sceneDefiLending = `title: "scene: DeFi lending (wallet → contract → token)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 供給者: { kind: shape-wallet, lane: l, stack: 0, eyebrow: "財布", subtitle: "USDC を預ける" }
  - Aave v3: { kind: shape-smart-contract, lane: l, stack: 1, eyebrow: "貸し出し", subtitle: "まとめた資金" }
  - aUSDC: { kind: shape-token, lane: l, stack: 2, eyebrow: "通貨", subtitle: "利息が付く" }

flow:
  - 供給者 -> Aave v3: "" (accent)
  - Aave v3 -> aUSDC: "" (accent)

animation:
  - step: "1. 供給者" 0.75s
    focus: ["供給者"]
    badge: "財布"
    description: "USDC を預ける"
  - step: "2. Aave v3" 0.75s
    focus: ["供給者", "Aave v3"]
    badge: "貸し出し"
    description: "まとめた資金"
  - step: "分散型の貸し出し" 0.75s
    focus: ["供給者", "Aave v3", "aUSDC"]
    badge: "通貨"
    description: "財布から Aave に USDC を預けると、利息が付く aUSDC を受け取る。 利息の付く貸し出しの典型的な流れ。"
`;

export const sourceJson__sceneDefiLending = `{
  "title": "scene: DeFi lending (wallet → contract → token)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "供給者",
      "kind": "shape-wallet",
      "lane": "l",
      "stack": 0,
      "eyebrow": "財布",
      "subtitle": "USDC を預ける"
    },
    {
      "name": "Aave v3",
      "kind": "shape-smart-contract",
      "lane": "l",
      "stack": 1,
      "eyebrow": "貸し出し",
      "subtitle": "まとめた資金"
    },
    {
      "name": "aUSDC",
      "kind": "shape-token",
      "lane": "l",
      "stack": 2,
      "eyebrow": "通貨",
      "subtitle": "利息が付く"
    }
  ],
  "flow": [
    { "from": "供給者", "to": "Aave v3", "label": "", "tone": "accent" },
    { "from": "Aave v3", "to": "aUSDC", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. 供給者",
      "duration": 0.75,
      "focus": ["供給者"],
      "badge": "財布",
      "body": "USDC を預ける"
    },
    {
      "step": "2. Aave v3",
      "duration": 0.75,
      "focus": ["供給者", "Aave v3"],
      "badge": "貸し出し",
      "body": "まとめた資金"
    },
    {
      "step": "分散型の貸し出し",
      "duration": 0.75,
      "focus": ["供給者", "Aave v3", "aUSDC"],
      "badge": "通貨",
      "body": "財布から Aave に USDC を預けると、利息が付く aUSDC を受け取る。 利息の付く貸し出しの典型的な流れ。"
    }
  ]
}`;

export const sourceYaml__sceneBitcoinTx = `title: "scene: bitcoin tx (wallet → BTC chain → node)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 送金者: { kind: shape-wallet, lane: l, stack: 0, eyebrow: "財布", subtitle: "Bitcoin の公式ソフト" }
  - BTC の本番網: { kind: shape-bitcoin-chain, lane: l, stack: 1, eyebrow: "台帳", subtitle: "計算の量で合意" }
  - 全記録の保持者: { kind: shape-blockchain-node, lane: l, stack: 2, eyebrow: "参加者", subtitle: "検証役" }

flow:
  - 送金者 -> BTC の本番網: "" (accent)
  - BTC の本番網 -> 全記録の保持者: "" (accent)

animation:
  - step: "1. 送金者" 0.75s
    focus: ["送金者"]
    badge: "財布"
    description: "Bitcoin の公式ソフト"
  - step: "2. BTC の本番網" 0.75s
    focus: ["送金者", "BTC の本番網"]
    badge: "台帳"
    description: "計算の量で合意"
  - step: "Bitcoin の送金" 0.75s
    focus: ["送金者", "BTC の本番網", "全記録の保持者"]
    badge: "参加者"
    description: "財布で取引に署名し、Bitcoin の網へ流して、全記録の保持者が承認する。 仲介なしで直接送る 3 段の流れ。"
`;

export const sourceJson__sceneBitcoinTx = `{
  "title": "scene: bitcoin tx (wallet → BTC chain → node)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "送金者",
      "kind": "shape-wallet",
      "lane": "l",
      "stack": 0,
      "eyebrow": "財布",
      "subtitle": "Bitcoin の公式ソフト"
    },
    {
      "name": "BTC の本番網",
      "kind": "shape-bitcoin-chain",
      "lane": "l",
      "stack": 1,
      "eyebrow": "台帳",
      "subtitle": "計算の量で合意"
    },
    {
      "name": "全記録の保持者",
      "kind": "shape-blockchain-node",
      "lane": "l",
      "stack": 2,
      "eyebrow": "参加者",
      "subtitle": "検証役"
    }
  ],
  "flow": [
    { "from": "送金者", "to": "BTC の本番網", "label": "", "tone": "accent" },
    { "from": "BTC の本番網", "to": "全記録の保持者", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. 送金者",
      "duration": 0.75,
      "focus": ["送金者"],
      "badge": "財布",
      "body": "Bitcoin の公式ソフト"
    },
    {
      "step": "2. BTC の本番網",
      "duration": 0.75,
      "focus": ["送金者", "BTC の本番網"],
      "badge": "台帳",
      "body": "計算の量で合意"
    },
    {
      "step": "Bitcoin の送金",
      "duration": 0.75,
      "focus": ["送金者", "BTC の本番網", "全記録の保持者"],
      "badge": "参加者",
      "body": "財布で取引に署名し、Bitcoin の網へ流して、全記録の保持者が承認する。 仲介なしで直接送る 3 段の流れ。"
    }
  ]
}`;

export const sourceYaml__sceneEcOrder = `title: "scene: EC 注文 (customer → shop → warehouse)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 購入者: { kind: shape-customer-service, lane: l, stack: 0, eyebrow: "顧客", subtitle: "注文" }
  - 楽天市場: { kind: shape-online-shop, lane: l, stack: 1, eyebrow: "店", subtitle: "ネット通販" }
  - 市川倉庫: { kind: shape-warehouse, lane: l, stack: 2, eyebrow: "物流拠点", subtitle: "出荷" }

flow:
  - 購入者 -> 楽天市場: "" (accent)
  - 楽天市場 -> 市川倉庫: "" (accent)

animation:
  - step: "1. 購入者" 0.75s
    focus: ["購入者"]
    badge: "顧客"
    description: "注文"
  - step: "2. 楽天市場" 0.75s
    focus: ["購入者", "楽天市場"]
    badge: "店"
    description: "ネット通販"
  - step: "通販の注文" 0.75s
    focus: ["購入者", "楽天市場", "市川倉庫"]
    badge: "物流拠点"
    description: "購入者が注文し、通販の店が受けて、倉庫へ出荷を指示する。 物を売る時の、注文から出荷までの流れ。"
`;

export const sourceJson__sceneEcOrder = `{
  "title": "scene: EC 注文 (customer → shop → warehouse)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "購入者",
      "kind": "shape-customer-service",
      "lane": "l",
      "stack": 0,
      "eyebrow": "顧客",
      "subtitle": "注文"
    },
    {
      "name": "楽天市場",
      "kind": "shape-online-shop",
      "lane": "l",
      "stack": 1,
      "eyebrow": "店",
      "subtitle": "ネット通販"
    },
    {
      "name": "市川倉庫",
      "kind": "shape-warehouse",
      "lane": "l",
      "stack": 2,
      "eyebrow": "物流拠点",
      "subtitle": "出荷"
    }
  ],
  "flow": [
    { "from": "購入者", "to": "楽天市場", "label": "", "tone": "accent" },
    { "from": "楽天市場", "to": "市川倉庫", "label": "", "tone": "accent" }
  ],
  "animation": [
    { "step": "1. 購入者", "duration": 0.75, "focus": ["購入者"], "badge": "顧客", "body": "注文" },
    {
      "step": "2. 楽天市場",
      "duration": 0.75,
      "focus": ["購入者", "楽天市場"],
      "badge": "店",
      "body": "ネット通販"
    },
    {
      "step": "通販の注文",
      "duration": 0.75,
      "focus": ["購入者", "楽天市場", "市川倉庫"],
      "badge": "物流拠点",
      "body": "購入者が注文し、通販の店が受けて、倉庫へ出荷を指示する。 物を売る時の、注文から出荷までの流れ。"
    }
  ]
}`;

export const sourceYaml__sceneMobileApi = `title: "scene: mobile app (mobile → API gateway → server)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - iOS のアプリ: { kind: shape-mobile-device, lane: l, stack: 0, eyebrow: "携帯端末", subtitle: "SwiftUI" }
  - GraphQL: { kind: shape-api-gateway, lane: l, stack: 1, eyebrow: "API の入口", subtitle: "要求を振り分ける" }
  - 裏側の処理: { kind: shape-server-rack, lane: l, stack: 2, eyebrow: "サーバ", subtitle: "コンテナで稼働" }

flow:
  - iOS のアプリ -> GraphQL: "" (accent)
  - GraphQL -> 裏側の処理: "" (accent)

animation:
  - step: "1. iOS のアプリ" 0.75s
    focus: ["iOS のアプリ"]
    badge: "携帯端末"
    description: "SwiftUI"
  - step: "2. GraphQL" 0.75s
    focus: ["iOS のアプリ", "GraphQL"]
    badge: "API の入口"
    description: "要求を振り分ける"
  - step: "携帯アプリの API" 0.75s
    focus: ["iOS のアプリ", "GraphQL", "裏側の処理"]
    badge: "サーバ"
    description: "携帯のアプリが要求を送り、API の入口が認証して振り分け、裏側のサーバが処理する。 いまどきの携帯アプリの組み立て。"
`;

export const sourceJson__sceneMobileApi = `{
  "title": "scene: mobile app (mobile → API gateway → server)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "iOS のアプリ",
      "kind": "shape-mobile-device",
      "lane": "l",
      "stack": 0,
      "eyebrow": "携帯端末",
      "subtitle": "SwiftUI"
    },
    {
      "name": "GraphQL",
      "kind": "shape-api-gateway",
      "lane": "l",
      "stack": 1,
      "eyebrow": "API の入口",
      "subtitle": "要求を振り分ける"
    },
    {
      "name": "裏側の処理",
      "kind": "shape-server-rack",
      "lane": "l",
      "stack": 2,
      "eyebrow": "サーバ",
      "subtitle": "コンテナで稼働"
    }
  ],
  "flow": [
    { "from": "iOS のアプリ", "to": "GraphQL", "label": "", "tone": "accent" },
    { "from": "GraphQL", "to": "裏側の処理", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. iOS のアプリ",
      "duration": 0.75,
      "focus": ["iOS のアプリ"],
      "badge": "携帯端末",
      "body": "SwiftUI"
    },
    {
      "step": "2. GraphQL",
      "duration": 0.75,
      "focus": ["iOS のアプリ", "GraphQL"],
      "badge": "API の入口",
      "body": "要求を振り分ける"
    },
    {
      "step": "携帯アプリの API",
      "duration": 0.75,
      "focus": ["iOS のアプリ", "GraphQL", "裏側の処理"],
      "badge": "サーバ",
      "body": "携帯のアプリが要求を送り、API の入口が認証して振り分け、裏側のサーバが処理する。 いまどきの携帯アプリの組み立て。"
    }
  ]
}`;

export const sourceYaml__sceneFactoryLine = `title: "scene: 工場の組立 (robot → sensor → DB)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - ファナックの腕: { kind: shape-robot-arm, lane: l, stack: 0, eyebrow: "ロボット", subtitle: "組立", posW: 294 }
  - 外観の検査: { kind: shape-iot-sensor, lane: l, stack: 1, eyebrow: "計測機器", subtitle: "品質" }
  - 製造管理の DB: { kind: shape-cylinder, lane: l, stack: 2, eyebrow: "データベース", subtitle: "履歴を追える" }

flow:
  - ファナックの腕 -> 外観の検査: "" (accent)
  - 外観の検査 -> 製造管理の DB: "" (accent)

animation:
  - step: "1. ファナックの腕" 0.75s
    focus: ["ファナックの腕"]
    badge: "ロボット"
    description: "組立"
  - step: "2. 外観の検査" 0.75s
    focus: ["ファナックの腕", "外観の検査"]
    badge: "計測機器"
    description: "品質"
  - step: "工場の組立" 0.75s
    focus: ["ファナックの腕", "外観の検査", "製造管理の DB"]
    badge: "データベース"
    description: "ロボットの腕が組み立て、計測機器が品質を確かめ、製造管理の DB に記録する。 機械でつないだ工場の典型的な流れ。"
`;

export const sourceJson__sceneFactoryLine = `{
  "title": "scene: 工場の組立 (robot → sensor → DB)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "ファナックの腕",
      "kind": "shape-robot-arm",
      "lane": "l",
      "stack": 0,
      "eyebrow": "ロボット",
      "subtitle": "組立",
      "posW": 294
    },
    {
      "name": "外観の検査",
      "kind": "shape-iot-sensor",
      "lane": "l",
      "stack": 1,
      "eyebrow": "計測機器",
      "subtitle": "品質"
    },
    {
      "name": "製造管理の DB",
      "kind": "shape-cylinder",
      "lane": "l",
      "stack": 2,
      "eyebrow": "データベース",
      "subtitle": "履歴を追える"
    }
  ],
  "flow": [
    { "from": "ファナックの腕", "to": "外観の検査", "label": "", "tone": "accent" },
    { "from": "外観の検査", "to": "製造管理の DB", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. ファナックの腕",
      "duration": 0.75,
      "focus": ["ファナックの腕"],
      "badge": "ロボット",
      "body": "組立"
    },
    {
      "step": "2. 外観の検査",
      "duration": 0.75,
      "focus": ["ファナックの腕", "外観の検査"],
      "badge": "計測機器",
      "body": "品質"
    },
    {
      "step": "工場の組立",
      "duration": 0.75,
      "focus": ["ファナックの腕", "外観の検査", "製造管理の DB"],
      "badge": "データベース",
      "body": "ロボットの腕が組み立て、計測機器が品質を確かめ、製造管理の DB に記録する。 機械でつないだ工場の典型的な流れ。"
    }
  ]
}`;

export const sourceYaml__sceneSatelliteChain = `title: "scene: satellite (satellite → RPC → chain)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - Starlink: { kind: shape-satellite, lane: l, stack: 0, eyebrow: "人工衛星", subtitle: "低軌道" }
  - Alchemy: { kind: shape-rpc-node, lane: l, stack: 1, eyebrow: "RPC の窓口", subtitle: "接続先" }
  - Solana: { kind: shape-blockchain, lane: l, stack: 2, eyebrow: "台帳", subtitle: "処理が速い" }

flow:
  - Starlink -> Alchemy: "" (accent)
  - Alchemy -> Solana: "" (accent)

animation:
  - step: "1. Starlink" 0.75s
    focus: ["Starlink"]
    badge: "人工衛星"
    description: "低軌道"
  - step: "2. Alchemy" 0.75s
    focus: ["Starlink", "Alchemy"]
    badge: "RPC の窓口"
    description: "接続先"
  - step: "衛星から台帳へ" 0.75s
    focus: ["Starlink", "Alchemy", "Solana"]
    badge: "台帳"
    description: "衛星のデータを RPC の窓口が中継し、台帳に記録する。 宇宙から現実のデータを台帳へ送る流れ。"
`;

export const sourceJson__sceneSatelliteChain = `{
  "title": "scene: satellite (satellite → RPC → chain)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "Starlink",
      "kind": "shape-satellite",
      "lane": "l",
      "stack": 0,
      "eyebrow": "人工衛星",
      "subtitle": "低軌道"
    },
    {
      "name": "Alchemy",
      "kind": "shape-rpc-node",
      "lane": "l",
      "stack": 1,
      "eyebrow": "RPC の窓口",
      "subtitle": "接続先"
    },
    {
      "name": "Solana",
      "kind": "shape-blockchain",
      "lane": "l",
      "stack": 2,
      "eyebrow": "台帳",
      "subtitle": "処理が速い"
    }
  ],
  "flow": [
    { "from": "Starlink", "to": "Alchemy", "label": "", "tone": "accent" },
    { "from": "Alchemy", "to": "Solana", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. Starlink",
      "duration": 0.75,
      "focus": ["Starlink"],
      "badge": "人工衛星",
      "body": "低軌道"
    },
    {
      "step": "2. Alchemy",
      "duration": 0.75,
      "focus": ["Starlink", "Alchemy"],
      "badge": "RPC の窓口",
      "body": "接続先"
    },
    {
      "step": "衛星から台帳へ",
      "duration": 0.75,
      "focus": ["Starlink", "Alchemy", "Solana"],
      "badge": "台帳",
      "body": "衛星のデータを RPC の窓口が中継し、台帳に記録する。 宇宙から現実のデータを台帳へ送る流れ。"
    }
  ]
}`;

export const sourceYaml__sceneDevOps = `title: "scene: DevOps (code → CI → cloud)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 注文画面/: { kind: shape-code-block, lane: l, stack: 0, eyebrow: "コード", subtitle: "TypeScript" }
  - GitHub の実行環境: { kind: shape-gear, lane: l, stack: 1, eyebrow: "自動化", subtitle: "組み立てと検査", posW: 360 }
  - AWS ECS: { kind: shape-cloud, lane: l, stack: 2, eyebrow: "配備先", subtitle: "コンテナで稼働" }

flow:
  - 注文画面/ -> GitHub の実行環境: "" (accent)
  - GitHub の実行環境 -> AWS ECS: "" (accent)

animation:
  - step: "1. 注文画面/" 0.75s
    focus: ["注文画面/"]
    badge: "コード"
    description: "TypeScript"
  - step: "2. GitHub の実行環境" 0.75s
    focus: ["注文画面/", "GitHub の実行環境"]
    badge: "自動化"
    description: "組み立てと検査"
  - step: "開発と運用" 0.75s
    focus: ["注文画面/", "GitHub の実行環境", "AWS ECS"]
    badge: "配備先"
    description: "コードを送ると、自動で組み立てて検査し、クラウドへ配備する。 いまどきの自動配備の典型的な 3 段の流れ。"
`;

export const sourceJson__sceneDevOps = `{
  "title": "scene: DevOps (code → CI → cloud)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "注文画面/",
      "kind": "shape-code-block",
      "lane": "l",
      "stack": 0,
      "eyebrow": "コード",
      "subtitle": "TypeScript"
    },
    {
      "name": "GitHub の実行環境",
      "kind": "shape-gear",
      "lane": "l",
      "stack": 1,
      "eyebrow": "自動化",
      "subtitle": "組み立てと検査",
      "posW": 360
    },
    {
      "name": "AWS ECS",
      "kind": "shape-cloud",
      "lane": "l",
      "stack": 2,
      "eyebrow": "配備先",
      "subtitle": "コンテナで稼働"
    }
  ],
  "flow": [
    { "from": "注文画面/", "to": "GitHub の実行環境", "label": "", "tone": "accent" },
    { "from": "GitHub の実行環境", "to": "AWS ECS", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. 注文画面/",
      "duration": 0.75,
      "focus": ["注文画面/"],
      "badge": "コード",
      "body": "TypeScript"
    },
    {
      "step": "2. GitHub の実行環境",
      "duration": 0.75,
      "focus": ["注文画面/", "GitHub の実行環境"],
      "badge": "自動化",
      "body": "組み立てと検査"
    },
    {
      "step": "開発と運用",
      "duration": 0.75,
      "focus": ["注文画面/", "GitHub の実行環境", "AWS ECS"],
      "badge": "配備先",
      "body": "コードを送ると、自動で組み立てて検査し、クラウドへ配備する。 いまどきの自動配備の典型的な 3 段の流れ。"
    }
  ]
}`;

export const sourceYaml__sceneTaskFlow = `title: "scene: task flow (kanban → terminal → file)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 課題 #42: { kind: shape-kanban-card, lane: l, stack: 0, eyebrow: "看板", subtitle: "作業中" }
  - zsh: { kind: shape-terminal, lane: l, stack: 1, eyebrow: "端末", subtitle: "組み立てを実行", posW: 382 }
  - 組み立ての記録: { kind: shape-file, lane: l, stack: 2, eyebrow: "ファイル", subtitle: "出力" }

flow:
  - 課題 #42 -> zsh: "" (accent)
  - zsh -> 組み立ての記録: "" (accent)

animation:
  - step: "1. 課題 #42" 0.75s
    focus: ["課題 #42"]
    badge: "看板"
    description: "作業中"
  - step: "2. zsh" 0.75s
    focus: ["課題 #42", "zsh"]
    badge: "端末"
    description: "組み立てを実行"
  - step: "作業の流れ" 0.75s
    focus: ["課題 #42", "zsh", "組み立ての記録"]
    badge: "ファイル"
    description: "看板の課題に着手し、端末で命令を打ち、出力をファイルに残す。 開発者の日々の流れ。"
`;

export const sourceJson__sceneTaskFlow = `{
  "title": "scene: task flow (kanban → terminal → file)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "課題 #42",
      "kind": "shape-kanban-card",
      "lane": "l",
      "stack": 0,
      "eyebrow": "看板",
      "subtitle": "作業中"
    },
    {
      "name": "zsh",
      "kind": "shape-terminal",
      "lane": "l",
      "stack": 1,
      "eyebrow": "端末",
      "subtitle": "組み立てを実行",
      "posW": 382
    },
    {
      "name": "組み立ての記録",
      "kind": "shape-file",
      "lane": "l",
      "stack": 2,
      "eyebrow": "ファイル",
      "subtitle": "出力"
    }
  ],
  "flow": [
    { "from": "課題 #42", "to": "zsh", "label": "", "tone": "accent" },
    { "from": "zsh", "to": "組み立ての記録", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. 課題 #42",
      "duration": 0.75,
      "focus": ["課題 #42"],
      "badge": "看板",
      "body": "作業中"
    },
    {
      "step": "2. zsh",
      "duration": 0.75,
      "focus": ["課題 #42", "zsh"],
      "badge": "端末",
      "body": "組み立てを実行"
    },
    {
      "step": "作業の流れ",
      "duration": 0.75,
      "focus": ["課題 #42", "zsh", "組み立ての記録"],
      "badge": "ファイル",
      "body": "看板の課題に着手し、端末で命令を打ち、出力をファイルに残す。 開発者の日々の流れ。"
    }
  ]
}`;

export const sourceYaml__sceneNotification = `title: "scene: 通知 (message → service → app)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - @花子: { kind: shape-message-bubble, lane: l, stack: 0, eyebrow: "発言", subtitle: "社内の連絡" }
  - 通知の配達: { kind: shape-hexagon, lane: l, stack: 1, eyebrow: "役務", subtitle: "即時に知らせる", posW: 338 }
  - デスクトップ通知: { kind: shape-window, lane: l, stack: 2, eyebrow: "アプリの画面", subtitle: "端末の標準機能" }

flow:
  - @花子 -> 通知の配達: "" (accent)
  - 通知の配達 -> デスクトップ通知: "" (accent)

animation:
  - step: "1. @花子" 0.75s
    focus: ["@花子"]
    badge: "発言"
    description: "社内の連絡"
  - step: "2. 通知の配達" 0.75s
    focus: ["@花子", "通知の配達"]
    badge: "役務"
    description: "即時に知らせる"
  - step: "通知" 0.75s
    focus: ["@花子", "通知の配達", "デスクトップ通知"]
    badge: "アプリの画面"
    description: "発言を送ると通知の配達が受け取り、相手の画面に通知を出す。 送り手から受け手までをつなぐ流れ。"
`;

export const sourceJson__sceneNotification = `{
  "title": "scene: 通知 (message → service → app)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "@花子",
      "kind": "shape-message-bubble",
      "lane": "l",
      "stack": 0,
      "eyebrow": "発言",
      "subtitle": "社内の連絡"
    },
    {
      "name": "通知の配達",
      "kind": "shape-hexagon",
      "lane": "l",
      "stack": 1,
      "eyebrow": "役務",
      "subtitle": "即時に知らせる",
      "posW": 338
    },
    {
      "name": "デスクトップ通知",
      "kind": "shape-window",
      "lane": "l",
      "stack": 2,
      "eyebrow": "アプリの画面",
      "subtitle": "端末の標準機能"
    }
  ],
  "flow": [
    { "from": "@花子", "to": "通知の配達", "label": "", "tone": "accent" },
    { "from": "通知の配達", "to": "デスクトップ通知", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. @花子",
      "duration": 0.75,
      "focus": ["@花子"],
      "badge": "発言",
      "body": "社内の連絡"
    },
    {
      "step": "2. 通知の配達",
      "duration": 0.75,
      "focus": ["@花子", "通知の配達"],
      "badge": "役務",
      "body": "即時に知らせる"
    },
    {
      "step": "通知",
      "duration": 0.75,
      "focus": ["@花子", "通知の配達", "デスクトップ通知"],
      "badge": "アプリの画面",
      "body": "発言を送ると通知の配達が受け取り、相手の画面に通知を出す。 送り手から受け手までをつなぐ流れ。"
    }
  ]
}`;

export const sourceYaml__sceneTrustAsset = `title: "scene: 信託資産 (trader → trust bank → 帳簿)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 資産運用者: { kind: shape-trader, lane: l, stack: 0, eyebrow: "売買", subtitle: "買いの指示" }
  - 三井住友信託: { kind: shape-trust-bank, lane: l, stack: 1, eyebrow: "信託銀行", subtitle: "受託" }
  - 運用報告書: { kind: shape-file, lane: l, stack: 2, eyebrow: "記録", subtitle: "月次" }

flow:
  - 資産運用者 -> 三井住友信託: "" (accent)
  - 三井住友信託 -> 運用報告書: "" (accent)

animation:
  - step: "1. 資産運用者" 0.75s
    focus: ["資産運用者"]
    badge: "売買"
    description: "買いの指示"
  - step: "2. 三井住友信託" 0.75s
    focus: ["資産運用者", "三井住友信託"]
    badge: "信託銀行"
    description: "受託"
  - step: "信託資産" 0.75s
    focus: ["資産運用者", "三井住友信託", "運用報告書"]
    badge: "記録"
    description: "資産運用者が買いを指示し、信託銀行が預かって、月ごとの報告書を出す。 機関投資家の資産管理。"
`;

export const sourceJson__sceneTrustAsset = `{
  "title": "scene: 信託資産 (trader → trust bank → 帳簿)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "資産運用者",
      "kind": "shape-trader",
      "lane": "l",
      "stack": 0,
      "eyebrow": "売買",
      "subtitle": "買いの指示"
    },
    {
      "name": "三井住友信託",
      "kind": "shape-trust-bank",
      "lane": "l",
      "stack": 1,
      "eyebrow": "信託銀行",
      "subtitle": "受託"
    },
    {
      "name": "運用報告書",
      "kind": "shape-file",
      "lane": "l",
      "stack": 2,
      "eyebrow": "記録",
      "subtitle": "月次"
    }
  ],
  "flow": [
    { "from": "資産運用者", "to": "三井住友信託", "label": "", "tone": "accent" },
    { "from": "三井住友信託", "to": "運用報告書", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. 資産運用者",
      "duration": 0.75,
      "focus": ["資産運用者"],
      "badge": "売買",
      "body": "買いの指示"
    },
    {
      "step": "2. 三井住友信託",
      "duration": 0.75,
      "focus": ["資産運用者", "三井住友信託"],
      "badge": "信託銀行",
      "body": "受託"
    },
    {
      "step": "信託資産",
      "duration": 0.75,
      "focus": ["資産運用者", "三井住友信託", "運用報告書"],
      "badge": "記録",
      "body": "資産運用者が買いを指示し、信託銀行が預かって、月ごとの報告書を出す。 機関投資家の資産管理。"
    }
  ]
}`;

export const sourceYaml__sceneConsensus = `title: "scene: consensus (node → block → chain)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 検証役: { kind: shape-blockchain-node, lane: l, stack: 0, eyebrow: "参加者", subtitle: "預けた量で合意" }
  - 高さ 8123456: { kind: shape-blockchain-block, lane: l, stack: 1, eyebrow: "ブロック", subtitle: "提案中", posW: 360 }
  - 本流: { kind: shape-blockchain, lane: l, stack: 2, eyebrow: "台帳", subtitle: "確定済み" }

flow:
  - 検証役 -> 高さ 8123456: "" (accent)
  - 高さ 8123456 -> 本流: "" (accent)

animation:
  - step: "1. 検証役" 0.75s
    focus: ["検証役"]
    badge: "参加者"
    description: "預けた量で合意"
  - step: "2. 高さ 8123456" 0.75s
    focus: ["検証役", "高さ 8123456"]
    badge: "ブロック"
    description: "提案中"
  - step: "合意の形成" 0.75s
    focus: ["検証役", "高さ 8123456", "本流"]
    badge: "台帳"
    description: "検証役がブロックを提案し、他の検証役の承認を集めて、本流の台帳で確定する。 預けた量で合意する方式の典型的な流れ。"
`;

export const sourceJson__sceneConsensus = `{
  "title": "scene: consensus (node → block → chain)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "検証役",
      "kind": "shape-blockchain-node",
      "lane": "l",
      "stack": 0,
      "eyebrow": "参加者",
      "subtitle": "預けた量で合意"
    },
    {
      "name": "高さ 8123456",
      "kind": "shape-blockchain-block",
      "lane": "l",
      "stack": 1,
      "eyebrow": "ブロック",
      "subtitle": "提案中",
      "posW": 360
    },
    {
      "name": "本流",
      "kind": "shape-blockchain",
      "lane": "l",
      "stack": 2,
      "eyebrow": "台帳",
      "subtitle": "確定済み"
    }
  ],
  "flow": [
    { "from": "検証役", "to": "高さ 8123456", "label": "", "tone": "accent" },
    { "from": "高さ 8123456", "to": "本流", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. 検証役",
      "duration": 0.75,
      "focus": ["検証役"],
      "badge": "参加者",
      "body": "預けた量で合意"
    },
    {
      "step": "2. 高さ 8123456",
      "duration": 0.75,
      "focus": ["検証役", "高さ 8123456"],
      "badge": "ブロック",
      "body": "提案中"
    },
    {
      "step": "合意の形成",
      "duration": 0.75,
      "focus": ["検証役", "高さ 8123456", "本流"],
      "badge": "台帳",
      "body": "検証役がブロックを提案し、他の検証役の承認を集めて、本流の台帳で確定する。 預けた量で合意する方式の典型的な流れ。"
    }
  ]
}`;

export const sourceYaml__sceneTokenDeploy = `title: "scene: token deploy (dev → contract → token)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 発行者: { kind: shape-lawyer, lane: l, stack: 0, eyebrow: "開発者", subtitle: "創業者" }
  - ERC-20: { kind: shape-smart-contract, lane: l, stack: 1, eyebrow: "契約", subtitle: "OpenZeppelin" }
  - $KIWA: { kind: shape-token, lane: l, stack: 2, eyebrow: "通貨", subtitle: "発行 10 億枚" }

flow:
  - 発行者 -> ERC-20: "" (accent)
  - ERC-20 -> $KIWA: "" (accent)

animation:
  - step: "1. 発行者" 0.75s
    focus: ["発行者"]
    badge: "開発者"
    description: "創業者"
  - step: "2. ERC-20" 0.75s
    focus: ["発行者", "ERC-20"]
    badge: "契約"
    description: "OpenZeppelin"
  - step: "通貨の発行" 0.75s
    focus: ["発行者", "ERC-20", "$KIWA"]
    badge: "通貨"
    description: "発行者が ERC-20 の契約を配備し、通貨を発行して市場へ出す。 新しい事業の立ち上げ。"
`;

export const sourceJson__sceneTokenDeploy = `{
  "title": "scene: token deploy (dev → contract → token)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "発行者",
      "kind": "shape-lawyer",
      "lane": "l",
      "stack": 0,
      "eyebrow": "開発者",
      "subtitle": "創業者"
    },
    {
      "name": "ERC-20",
      "kind": "shape-smart-contract",
      "lane": "l",
      "stack": 1,
      "eyebrow": "契約",
      "subtitle": "OpenZeppelin"
    },
    {
      "name": "$KIWA",
      "kind": "shape-token",
      "lane": "l",
      "stack": 2,
      "eyebrow": "通貨",
      "subtitle": "発行 10 億枚"
    }
  ],
  "flow": [
    { "from": "発行者", "to": "ERC-20", "label": "", "tone": "accent" },
    { "from": "ERC-20", "to": "$KIWA", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. 発行者",
      "duration": 0.75,
      "focus": ["発行者"],
      "badge": "開発者",
      "body": "創業者"
    },
    {
      "step": "2. ERC-20",
      "duration": 0.75,
      "focus": ["発行者", "ERC-20"],
      "badge": "契約",
      "body": "OpenZeppelin"
    },
    {
      "step": "通貨の発行",
      "duration": 0.75,
      "focus": ["発行者", "ERC-20", "$KIWA"],
      "badge": "通貨",
      "body": "発行者が ERC-20 の契約を配備し、通貨を発行して市場へ出す。 新しい事業の立ち上げ。"
    }
  ]
}`;

export const sourceYaml__sceneCompliance = `title: "scene: 規制対応 (regulator → 帳簿 → bank)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 金融庁: { kind: shape-regulator, lane: l, stack: 0, eyebrow: "規制当局", subtitle: "検査" }
  - 取引の明細: { kind: shape-file, lane: l, stack: 1, eyebrow: "記録", subtitle: "監査の証跡" }
  - あおば銀行: { kind: shape-bank, lane: l, stack: 2, eyebrow: "銀行", subtitle: "検査対象" }

flow:
  - 金融庁 -> 取引の明細: "" (accent)
  - 取引の明細 -> あおば銀行: "" (accent)

animation:
  - step: "1. 金融庁" 0.75s
    focus: ["金融庁"]
    badge: "規制当局"
    description: "検査"
  - step: "2. 取引の明細" 0.75s
    focus: ["金融庁", "取引の明細"]
    badge: "記録"
    description: "監査の証跡"
  - step: "規制への対応" 0.75s
    focus: ["金融庁", "取引の明細", "あおば銀行"]
    badge: "銀行"
    description: "規制当局が検査を始めて取引の明細を出させ、銀行が検査に応じる。 金融庁の検査で踏む典型的な流れ。"
`;

export const sourceJson__sceneCompliance = `{
  "title": "scene: 規制対応 (regulator → 帳簿 → bank)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "金融庁",
      "kind": "shape-regulator",
      "lane": "l",
      "stack": 0,
      "eyebrow": "規制当局",
      "subtitle": "検査"
    },
    {
      "name": "取引の明細",
      "kind": "shape-file",
      "lane": "l",
      "stack": 1,
      "eyebrow": "記録",
      "subtitle": "監査の証跡"
    },
    {
      "name": "あおば銀行",
      "kind": "shape-bank",
      "lane": "l",
      "stack": 2,
      "eyebrow": "銀行",
      "subtitle": "検査対象"
    }
  ],
  "flow": [
    { "from": "金融庁", "to": "取引の明細", "label": "", "tone": "accent" },
    { "from": "取引の明細", "to": "あおば銀行", "label": "", "tone": "accent" }
  ],
  "animation": [
    { "step": "1. 金融庁", "duration": 0.75, "focus": ["金融庁"], "badge": "規制当局", "body": "検査" },
    {
      "step": "2. 取引の明細",
      "duration": 0.75,
      "focus": ["金融庁", "取引の明細"],
      "badge": "記録",
      "body": "監査の証跡"
    },
    {
      "step": "規制への対応",
      "duration": 0.75,
      "focus": ["金融庁", "取引の明細", "あおば銀行"],
      "badge": "銀行",
      "body": "規制当局が検査を始めて取引の明細を出させ、銀行が検査に応じる。 金融庁の検査で踏む典型的な流れ。"
    }
  ]
}`;

export const sourceYaml__sceneNftMarketplace = `title: "scene: NFT 売買 (buyer → marketplace → NFT)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 買い手: { kind: shape-wallet, lane: l, stack: 0, eyebrow: "財布", subtitle: "収集家" }
  - OpenSea: { kind: shape-exchange, lane: l, stack: 1, eyebrow: "売買の場", subtitle: "作者への還元 5%" }
  - 猿の絵 #7890: { kind: shape-nft, lane: l, stack: 2, eyebrow: "NFT", subtitle: "人気の作品群", posW: 272 }

flow:
  - 買い手 -> OpenSea: "" (accent)
  - OpenSea -> 猿の絵 #7890: "" (accent)

animation:
  - step: "1. 買い手" 0.75s
    focus: ["買い手"]
    badge: "財布"
    description: "収集家"
  - step: "2. OpenSea" 0.75s
    focus: ["買い手", "OpenSea"]
    badge: "売買の場"
    description: "作者への還元 5%"
  - step: "NFT の売買" 0.75s
    focus: ["買い手", "OpenSea", "猿の絵 #7890"]
    badge: "NFT"
    description: "買い手が売買の場で値を付け、契約が動いて NFT の持ち主が移る。 二次流通の流れ。"
`;

export const sourceJson__sceneNftMarketplace = `{
  "title": "scene: NFT 売買 (buyer → marketplace → NFT)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "買い手",
      "kind": "shape-wallet",
      "lane": "l",
      "stack": 0,
      "eyebrow": "財布",
      "subtitle": "収集家"
    },
    {
      "name": "OpenSea",
      "kind": "shape-exchange",
      "lane": "l",
      "stack": 1,
      "eyebrow": "売買の場",
      "subtitle": "作者への還元 5%"
    },
    {
      "name": "猿の絵 #7890",
      "kind": "shape-nft",
      "lane": "l",
      "stack": 2,
      "eyebrow": "NFT",
      "subtitle": "人気の作品群",
      "posW": 272
    }
  ],
  "flow": [
    { "from": "買い手", "to": "OpenSea", "label": "", "tone": "accent" },
    { "from": "OpenSea", "to": "猿の絵 #7890", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. 買い手",
      "duration": 0.75,
      "focus": ["買い手"],
      "badge": "財布",
      "body": "収集家"
    },
    {
      "step": "2. OpenSea",
      "duration": 0.75,
      "focus": ["買い手", "OpenSea"],
      "badge": "売買の場",
      "body": "作者への還元 5%"
    },
    {
      "step": "NFT の売買",
      "duration": 0.75,
      "focus": ["買い手", "OpenSea", "猿の絵 #7890"],
      "badge": "NFT",
      "body": "買い手が売買の場で値を付け、契約が動いて NFT の持ち主が移る。 二次流通の流れ。"
    }
  ]
}`;

export const sourceYaml__sceneNetworkPath = `title: "scene: network (router → hub → server)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 社員の携帯: { kind: shape-mobile-device, lane: l, stack: 0, eyebrow: "端末", subtitle: "無線でつなぐ" }
  - 基幹の中継器: { kind: shape-network-node, lane: l, stack: 1, eyebrow: "通信網", subtitle: "L2/L3" }
  - 業務の処理役: { kind: shape-server-rack, lane: l, stack: 2, eyebrow: "サーバ", subtitle: "データセンター", posW: 272 }

flow:
  - 社員の携帯 -> 基幹の中継器: "" (accent)
  - 基幹の中継器 -> 業務の処理役: "" (accent)

animation:
  - step: "1. 社員の携帯" 0.75s
    focus: ["社員の携帯"]
    badge: "端末"
    description: "無線でつなぐ"
  - step: "2. 基幹の中継器" 0.75s
    focus: ["社員の携帯", "基幹の中継器"]
    badge: "通信網"
    description: "L2/L3"
  - step: "通信の経路" 0.75s
    focus: ["社員の携帯", "基幹の中継器", "業務の処理役"]
    badge: "サーバ"
    description: "社員の携帯から基幹の中継器を通って、業務のサーバへ届く。 会社の通信網でよくある 3 段の経路。"
`;

export const sourceJson__sceneNetworkPath = `{
  "title": "scene: network (router → hub → server)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "社員の携帯",
      "kind": "shape-mobile-device",
      "lane": "l",
      "stack": 0,
      "eyebrow": "端末",
      "subtitle": "無線でつなぐ"
    },
    {
      "name": "基幹の中継器",
      "kind": "shape-network-node",
      "lane": "l",
      "stack": 1,
      "eyebrow": "通信網",
      "subtitle": "L2/L3"
    },
    {
      "name": "業務の処理役",
      "kind": "shape-server-rack",
      "lane": "l",
      "stack": 2,
      "eyebrow": "サーバ",
      "subtitle": "データセンター",
      "posW": 272
    }
  ],
  "flow": [
    { "from": "社員の携帯", "to": "基幹の中継器", "label": "", "tone": "accent" },
    { "from": "基幹の中継器", "to": "業務の処理役", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. 社員の携帯",
      "duration": 0.75,
      "focus": ["社員の携帯"],
      "badge": "端末",
      "body": "無線でつなぐ"
    },
    {
      "step": "2. 基幹の中継器",
      "duration": 0.75,
      "focus": ["社員の携帯", "基幹の中継器"],
      "badge": "通信網",
      "body": "L2/L3"
    },
    {
      "step": "通信の経路",
      "duration": 0.75,
      "focus": ["社員の携帯", "基幹の中継器", "業務の処理役"],
      "badge": "サーバ",
      "body": "社員の携帯から基幹の中継器を通って、業務のサーバへ届く。 会社の通信網でよくある 3 段の経路。"
    }
  ]
}`;

export const sourceYaml__sceneCheckout = `title: "scene: checkout (site → provider → card)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 山田商店の通販: { kind: shape-website, lane: l, stack: 0, eyebrow: "サイト", subtitle: "かごの中身", posW: 404 }
  - PayPal: { kind: shape-payment-provider, lane: l, stack: 1, eyebrow: "決済代行", subtitle: "支払いの手続き" }
  - MasterCard: { kind: shape-credit-card, lane: l, stack: 2, eyebrow: "カード", subtitle: "後払い" }

flow:
  - 山田商店の通販 -> PayPal: "" (accent)
  - PayPal -> MasterCard: "" (accent)

animation:
  - step: "1. 山田商店の通販" 0.75s
    focus: ["山田商店の通販"]
    badge: "サイト"
    description: "かごの中身"
  - step: "2. PayPal" 0.75s
    focus: ["山田商店の通販", "PayPal"]
    badge: "決済代行"
    description: "支払いの手続き"
  - step: "通販の支払い" 0.75s
    focus: ["山田商店の通販", "PayPal", "MasterCard"]
    badge: "カード"
    description: "サイトでかごの中身を送り、決済代行を通して、カードの承認を得る。 通販の支払いの典型的な流れ。"
`;

export const sourceJson__sceneCheckout = `{
  "title": "scene: checkout (site → provider → card)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "山田商店の通販",
      "kind": "shape-website",
      "lane": "l",
      "stack": 0,
      "eyebrow": "サイト",
      "subtitle": "かごの中身",
      "posW": 404
    },
    {
      "name": "PayPal",
      "kind": "shape-payment-provider",
      "lane": "l",
      "stack": 1,
      "eyebrow": "決済代行",
      "subtitle": "支払いの手続き"
    },
    {
      "name": "MasterCard",
      "kind": "shape-credit-card",
      "lane": "l",
      "stack": 2,
      "eyebrow": "カード",
      "subtitle": "後払い"
    }
  ],
  "flow": [
    { "from": "山田商店の通販", "to": "PayPal", "label": "", "tone": "accent" },
    { "from": "PayPal", "to": "MasterCard", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. 山田商店の通販",
      "duration": 0.75,
      "focus": ["山田商店の通販"],
      "badge": "サイト",
      "body": "かごの中身"
    },
    {
      "step": "2. PayPal",
      "duration": 0.75,
      "focus": ["山田商店の通販", "PayPal"],
      "badge": "決済代行",
      "body": "支払いの手続き"
    },
    {
      "step": "通販の支払い",
      "duration": 0.75,
      "focus": ["山田商店の通販", "PayPal", "MasterCard"],
      "badge": "カード",
      "body": "サイトでかごの中身を送り、決済代行を通して、カードの承認を得る。 通販の支払いの典型的な流れ。"
    }
  ]
}`;

export const sourceYaml__sceneEdgeCompute = `title: "scene: edge compute (mobile → CDN → cloud)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - Android のアプリ: { kind: shape-mobile-device, lane: l, stack: 0, eyebrow: "携帯端末", subtitle: "利用者", posW: 294 }
  - Fastly: { kind: shape-cdn-edge, lane: l, stack: 1, eyebrow: "配信網", subtitle: "拠点で処理する" }
  - GCP の配信元: { kind: shape-cloud, lane: l, stack: 2, eyebrow: "クラウド", subtitle: "拠点で返せない時" }

flow:
  - Android のアプリ -> Fastly: "" (accent)
  - Fastly -> GCP の配信元: "" (accent)

animation:
  - step: "1. Android のアプリ" 0.75s
    focus: ["Android のアプリ"]
    badge: "携帯端末"
    description: "利用者"
  - step: "2. Fastly" 0.75s
    focus: ["Android のアプリ", "Fastly"]
    badge: "配信網"
    description: "拠点で処理する"
  - step: "拠点での処理" 0.75s
    focus: ["Android のアプリ", "Fastly", "GCP の配信元"]
    badge: "クラウド"
    description: "携帯の要求を配信網の拠点で処理し、返せない時だけ配信元へ回す。 待ち時間の短い配信。"
`;

export const sourceJson__sceneEdgeCompute = `{
  "title": "scene: edge compute (mobile → CDN → cloud)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "Android のアプリ",
      "kind": "shape-mobile-device",
      "lane": "l",
      "stack": 0,
      "eyebrow": "携帯端末",
      "subtitle": "利用者",
      "posW": 294
    },
    {
      "name": "Fastly",
      "kind": "shape-cdn-edge",
      "lane": "l",
      "stack": 1,
      "eyebrow": "配信網",
      "subtitle": "拠点で処理する"
    },
    {
      "name": "GCP の配信元",
      "kind": "shape-cloud",
      "lane": "l",
      "stack": 2,
      "eyebrow": "クラウド",
      "subtitle": "拠点で返せない時"
    }
  ],
  "flow": [
    { "from": "Android のアプリ", "to": "Fastly", "label": "", "tone": "accent" },
    { "from": "Fastly", "to": "GCP の配信元", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. Android のアプリ",
      "duration": 0.75,
      "focus": ["Android のアプリ"],
      "badge": "携帯端末",
      "body": "利用者"
    },
    {
      "step": "2. Fastly",
      "duration": 0.75,
      "focus": ["Android のアプリ", "Fastly"],
      "badge": "配信網",
      "body": "拠点で処理する"
    },
    {
      "step": "拠点での処理",
      "duration": 0.75,
      "focus": ["Android のアプリ", "Fastly", "GCP の配信元"],
      "badge": "クラウド",
      "body": "携帯の要求を配信網の拠点で処理し、返せない時だけ配信元へ回す。 待ち時間の短い配信。"
    }
  ]
}`;

export const sourceYaml__sceneVersionDeploy = `title: "scene: version deploy (stack → gear → site)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - v3.2.0: { kind: shape-stack, lane: l, stack: 0, eyebrow: "公開版", subtitle: "目印を付けた", posW: 360 }
  - 配備の流れ: { kind: shape-gear, lane: l, stack: 1, eyebrow: "自動化", subtitle: "一部へ先に配る", posW: 382 }
  - 本番の画面: { kind: shape-website, lane: l, stack: 2, eyebrow: "サイト", subtitle: "公開中", posW: 404 }

flow:
  - v3.2.0 -> 配備の流れ: "" (accent)
  - 配備の流れ -> 本番の画面: "" (accent)

animation:
  - step: "1. v3.2.0" 0.75s
    focus: ["v3.2.0"]
    badge: "公開版"
    description: "目印を付けた"
  - step: "2. 配備の流れ" 0.75s
    focus: ["v3.2.0", "配備の流れ"]
    badge: "自動化"
    description: "一部へ先に配る"
  - step: "版の配備" 0.75s
    focus: ["v3.2.0", "配備の流れ", "本番の画面"]
    badge: "サイト"
    description: "版に目印を付け、配備の流れで一部へ先に配ってから、本番のサイトに出す。 クラウドの役務でよくある配備の形。"
`;

export const sourceJson__sceneVersionDeploy = `{
  "title": "scene: version deploy (stack → gear → site)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "v3.2.0",
      "kind": "shape-stack",
      "lane": "l",
      "stack": 0,
      "eyebrow": "公開版",
      "subtitle": "目印を付けた",
      "posW": 360
    },
    {
      "name": "配備の流れ",
      "kind": "shape-gear",
      "lane": "l",
      "stack": 1,
      "eyebrow": "自動化",
      "subtitle": "一部へ先に配る",
      "posW": 382
    },
    {
      "name": "本番の画面",
      "kind": "shape-website",
      "lane": "l",
      "stack": 2,
      "eyebrow": "サイト",
      "subtitle": "公開中",
      "posW": 404
    }
  ],
  "flow": [
    { "from": "v3.2.0", "to": "配備の流れ", "label": "", "tone": "accent" },
    { "from": "配備の流れ", "to": "本番の画面", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. v3.2.0",
      "duration": 0.75,
      "focus": ["v3.2.0"],
      "badge": "公開版",
      "body": "目印を付けた"
    },
    {
      "step": "2. 配備の流れ",
      "duration": 0.75,
      "focus": ["v3.2.0", "配備の流れ"],
      "badge": "自動化",
      "body": "一部へ先に配る"
    },
    {
      "step": "版の配備",
      "duration": 0.75,
      "focus": ["v3.2.0", "配備の流れ", "本番の画面"],
      "badge": "サイト",
      "body": "版に目印を付け、配備の流れで一部へ先に配ってから、本番のサイトに出す。 クラウドの役務でよくある配備の形。"
    }
  ]
}`;

export const sourceYaml__sceneAuditChain = `title: "scene: audit chain (auditor → file → regulator)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 監査法人: { kind: shape-auditor, lane: l, stack: 0, eyebrow: "監査", subtitle: "大手の一つ" }
  - 監査報告書: { kind: shape-file, lane: l, stack: 1, eyebrow: "提出物", subtitle: "署名済み" }
  - 金融庁: { kind: shape-regulator, lane: l, stack: 2, eyebrow: "規制当局", subtitle: "受領" }

flow:
  - 監査法人 -> 監査報告書: "" (accent)
  - 監査報告書 -> 金融庁: "" (accent)

animation:
  - step: "1. 監査法人" 0.75s
    focus: ["監査法人"]
    badge: "監査"
    description: "大手の一つ"
  - step: "2. 監査報告書" 0.75s
    focus: ["監査法人", "監査報告書"]
    badge: "提出物"
    description: "署名済み"
  - step: "監査の報告" 0.75s
    focus: ["監査法人", "監査報告書", "金融庁"]
    badge: "規制当局"
    description: "監査法人が検査して報告書を作り、規制当局が受け取る。 上場企業の四半期ごとの監査の典型的な流れ。"
`;

export const sourceJson__sceneAuditChain = `{
  "title": "scene: audit chain (auditor → file → regulator)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "監査法人",
      "kind": "shape-auditor",
      "lane": "l",
      "stack": 0,
      "eyebrow": "監査",
      "subtitle": "大手の一つ"
    },
    {
      "name": "監査報告書",
      "kind": "shape-file",
      "lane": "l",
      "stack": 1,
      "eyebrow": "提出物",
      "subtitle": "署名済み"
    },
    {
      "name": "金融庁",
      "kind": "shape-regulator",
      "lane": "l",
      "stack": 2,
      "eyebrow": "規制当局",
      "subtitle": "受領"
    }
  ],
  "flow": [
    { "from": "監査法人", "to": "監査報告書", "label": "", "tone": "accent" },
    { "from": "監査報告書", "to": "金融庁", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. 監査法人",
      "duration": 0.75,
      "focus": ["監査法人"],
      "badge": "監査",
      "body": "大手の一つ"
    },
    {
      "step": "2. 監査報告書",
      "duration": 0.75,
      "focus": ["監査法人", "監査報告書"],
      "badge": "提出物",
      "body": "署名済み"
    },
    {
      "step": "監査の報告",
      "duration": 0.75,
      "focus": ["監査法人", "監査報告書", "金融庁"],
      "badge": "規制当局",
      "body": "監査法人が検査して報告書を作り、規制当局が受け取る。 上場企業の四半期ごとの監査の典型的な流れ。"
    }
  ]
}`;

// ============================================================
// 記法 (#1376)
// ============================================================
//
// catalog は `sourceYaml__<図の export 名>` の名前で記法を拾う (`lib/catalog-items.ts`)。
// 記法があると画面で「コード」 を読めて「エディタで開く」 が押せる。
//
// **手で書かず、組み立て済みの図から機械で出した**。 110 件を手で写すと必ずずれる。
// 実際、先に手で書いた 30 件は図とずれていた = 縦列の幅と見出し、箱の上の小見出し、
// 段の札が落ちていて、コードのタブに **別の図になる記法** が出ていた。
//
// 出した記法は `textDslToDiagram` と `jsonToDiagram` に通して同じ図になることを確かめてから
// 貼っており、以降は一致検査 (`lib/catalog-source-parity.test.tsx`) が骨格まで突き合わせる。
//
// 出す経路は repo に残していない。 1 度きりの生成で、残すべき成果物は記法そのものだから。
// 記法を直したら検査が落ちるので、以降は記法が正になる。
//
// **図は組み立て API のまま残す**。 記法から組み立て直すと図の識別子が題から導かれ、
// 一覧と検索に出る文字列が変わる。

export const sourceYaml__kindActor = `title: "kind: actor (外部主体)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 42

actors:
  - 利用者: { kind: actor, lane: l, stack: 0, eyebrow: "外部主体", value: "{v} 人" }

animation:
  - step: "actor" 1.5s
    focus: ["利用者"]
    badge: "動作中"
    description: "外から関わる主体 (利用者や外部の仕組み)。 値の欄に数を出せる。"
  - step: "actor の数が動く" 1.5s
    focus: ["利用者"]
    tween:
      v: 42 -> 137
    badge: "動作中"
    description: "値の欄が段の中で動く。 この欄を描くのは actor だけ。"
`;

export const sourceJson__kindActor = `{
  "title": "kind: actor (外部主体)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "利用者",
      "kind": "actor",
      "lane": "l",
      "stack": 0,
      "eyebrow": "外部主体",
      "value": "{v} 人"
    }
  ],
  "flow": [],
  "states": { "v": 42 },
  "animation": [
    {
      "step": "actor",
      "duration": 1.5,
      "focus": ["利用者"],
      "badge": "動作中",
      "body": "外から関わる主体 (利用者や外部の仕組み)。 値の欄に数を出せる。"
    },
    {
      "step": "actor の数が動く",
      "duration": 1.5,
      "focus": ["利用者"],
      "tween": { "v": [42, 137] },
      "badge": "動作中",
      "body": "値の欄が段の中で動く。 この欄を描くのは actor だけ。"
    }
  ]
}`;

export const sourceYaml__kindFunction = `title: "kind: function (関数呼び出し)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 12

actors:
  - 注文を受ける(要求): { kind: function, lane: l, stack: 0, eyebrow: "関数呼び出し", subtitle: "-> 注文か失敗 · 呼出 {v} 回" }

animation:
  - step: "function" 1.5s
    focus: ["注文を受ける(要求)"]
    badge: "動作中"
    description: "処理を受け持つ関数。 題を等幅の字で書き、副題に戻り値を書いて署名に見せる。"
  - step: "function の数が動く" 1.5s
    focus: ["注文を受ける(要求)"]
    tween:
      v: 12 -> 480
    badge: "動作中"
    description: "副題の呼出回数が段の中で動く。 署名の形は変えない。"
`;

export const sourceJson__kindFunction = `{
  "title": "kind: function (関数呼び出し)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "注文を受ける(要求)",
      "kind": "function",
      "lane": "l",
      "stack": 0,
      "eyebrow": "関数呼び出し",
      "subtitle": "-> 注文か失敗 · 呼出 {v} 回"
    }
  ],
  "flow": [],
  "states": { "v": 12 },
  "animation": [
    {
      "step": "function",
      "duration": 1.5,
      "focus": ["注文を受ける(要求)"],
      "badge": "動作中",
      "body": "処理を受け持つ関数。 題を等幅の字で書き、副題に戻り値を書いて署名に見せる。"
    },
    {
      "step": "function の数が動く",
      "duration": 1.5,
      "focus": ["注文を受ける(要求)"],
      "tween": { "v": [12, 480] },
      "badge": "動作中",
      "body": "副題の呼出回数が段の中で動く。 署名の形は変えない。"
    }
  ]
}`;

export const sourceYaml__kindStorage = `title: "kind: storage (保存データ)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 1200

actors:
  - 利用者の表: { kind: storage, lane: l, stack: 0, eyebrow: "保存データ", rows: ["番号: 主キー", "メール: 文字列", "行数: {v}"] }

animation:
  - step: "storage" 1.5s
    focus: ["利用者の表"]
    badge: "動作中"
    description: "DB の表。 列を rows に 1 行ずつ書く。"
  - step: "storage の数が動く" 1.5s
    focus: ["利用者の表"]
    tween:
      v: 1200 -> 8400
    badge: "動作中"
    description: "行の数が段の中で動く。 行も同じ経路で置換される。"
`;

export const sourceJson__kindStorage = `{
  "title": "kind: storage (保存データ)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "利用者の表",
      "kind": "storage",
      "lane": "l",
      "stack": 0,
      "eyebrow": "保存データ",
      "rows": ["番号: 主キー", "メール: 文字列", "行数: {v}"]
    }
  ],
  "flow": [],
  "states": { "v": 1200 },
  "animation": [
    {
      "step": "storage",
      "duration": 1.5,
      "focus": ["利用者の表"],
      "badge": "動作中",
      "body": "DB の表。 列を rows に 1 行ずつ書く。"
    },
    {
      "step": "storage の数が動く",
      "duration": 1.5,
      "focus": ["利用者の表"],
      "tween": { "v": [1200, 8400] },
      "badge": "動作中",
      "body": "行の数が段の中で動く。 行も同じ経路で置換される。"
    }
  ]
}`;

export const sourceYaml__kindEvent = `title: "kind: event (イベントログ)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 3

actors:
  - 注文ができた: { kind: event, lane: l, stack: 0, eyebrow: "イベント", subtitle: "(注文, 利用者) · 毎秒 {v} 件" }

animation:
  - step: "event" 1.5s
    focus: ["注文ができた"]
    badge: "動作中"
    description: "発行された出来事。 出来事を配る経路や記録が読む。"
  - step: "event の数が動く" 1.5s
    focus: ["注文ができた"]
    tween:
      v: 3 -> 96
    badge: "動作中"
    description: "副題の発生件数が段の中で動く。 中身の形は変えない。"
`;

export const sourceJson__kindEvent = `{
  "title": "kind: event (イベントログ)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "注文ができた",
      "kind": "event",
      "lane": "l",
      "stack": 0,
      "eyebrow": "イベント",
      "subtitle": "(注文, 利用者) · 毎秒 {v} 件"
    }
  ],
  "flow": [],
  "states": { "v": 3 },
  "animation": [
    {
      "step": "event",
      "duration": 1.5,
      "focus": ["注文ができた"],
      "badge": "動作中",
      "body": "発行された出来事。 出来事を配る経路や記録が読む。"
    },
    {
      "step": "event の数が動く",
      "duration": 1.5,
      "focus": ["注文ができた"],
      "tween": { "v": [3, 96] },
      "badge": "動作中",
      "body": "副題の発生件数が段の中で動く。 中身の形は変えない。"
    }
  ]
}`;

export const sourceYaml__kindCard = `title: "kind: card (汎用情報)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 2

actors:
  - 備考: { kind: card, lane: l, stack: 0, eyebrow: "汎用カード", subtitle: "汎用の説明カード · {v} 件" }

animation:
  - step: "card" 1.5s
    focus: ["備考"]
    badge: "動作中"
    description: "kind に当てはまらない補足情報。"
  - step: "card の数が動く" 1.5s
    focus: ["備考"]
    tween:
      v: 2 -> 31
    badge: "動作中"
    description: "副題の件数が段の中で動く。 説明の文は変えない。"
`;

export const sourceJson__kindCard = `{
  "title": "kind: card (汎用情報)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "備考",
      "kind": "card",
      "lane": "l",
      "stack": 0,
      "eyebrow": "汎用カード",
      "subtitle": "汎用の説明カード · {v} 件"
    }
  ],
  "flow": [],
  "states": { "v": 2 },
  "animation": [
    {
      "step": "card",
      "duration": 1.5,
      "focus": ["備考"],
      "badge": "動作中",
      "body": "kind に当てはまらない補足情報。"
    },
    {
      "step": "card の数が動く",
      "duration": 1.5,
      "focus": ["備考"],
      "tween": { "v": [2, 31] },
      "badge": "動作中",
      "body": "副題の件数が段の中で動く。 説明の文は変えない。"
    }
  ]
}`;

export const sourceYaml__laneSingle = `title: "lane: 1 本"
type: flow

lanes:
  only: { x: 0, width: 440 }

actors:
  - A: { kind: actor, lane: only, stack: 0 }
  - B: { kind: function, lane: only, stack: 1 }

animation:
  - step: "1 lane" 1.5s
    focus: ["A", "B"]
    badge: "正常"
    description: "1 本の lane に node を縦に積む。"
`;

export const sourceJson__laneSingle = `{
  "title": "lane: 1 本",
  "type": "flow",
  "lanes": {
    "only": { "x": 0, "width": 440 }
  },
  "actors": [
    { "name": "A", "kind": "actor", "lane": "only", "stack": 0 },
    { "name": "B", "kind": "function", "lane": "only", "stack": 1 }
  ],
  "flow": [],
  "animation": [
    {
      "step": "1 lane",
      "duration": 1.5,
      "focus": ["A", "B"],
      "badge": "正常",
      "body": "1 本の lane に node を縦に積む。"
    }
  ]
}`;

export const sourceYaml__laneMulti = `title: "lane: 3 本 (横並び)"
type: flow

lanes:
  l1: { width: 240 }
  l2: { width: 240 }
  l3: { width: 240 }

actors:
  - A: { kind: function, lane: l1, stack: 0 }
  - B: { kind: function, lane: l2, stack: 0 }
  - C: { kind: event, lane: l3, stack: 0 }

animation:
  - step: "3 lane" 1.5s
    focus: ["A", "B", "C"]
    badge: "正常"
    description: "lane を横に並べて役割を分ける (利用者 / 処理 / 出来事)。"
`;

export const sourceJson__laneMulti = `{
  "title": "lane: 3 本 (横並び)",
  "type": "flow",
  "lanes": {
    "l1": { "width": 240 },
    "l2": { "width": 240 },
    "l3": { "width": 240 }
  },
  "actors": [
    { "name": "A", "kind": "function", "lane": "l1", "stack": 0 },
    { "name": "B", "kind": "function", "lane": "l2", "stack": 0 },
    { "name": "C", "kind": "event", "lane": "l3", "stack": 0 }
  ],
  "flow": [],
  "animation": [
    {
      "step": "3 lane",
      "duration": 1.5,
      "focus": ["A", "B", "C"],
      "badge": "正常",
      "body": "lane を横に並べて役割を分ける (利用者 / 処理 / 出来事)。"
    }
  ]
}`;

export const sourceYaml__laneContain = `title: "lane: contain (枠囲み)"
type: flow

lanes:
  inner: { x: 0, width: 440, contain: true }

actors:
  - 内部の処理: { kind: function, lane: inner, stack: 0 }
  - 保存先: { kind: storage, lane: inner, stack: 1 }

animation:
  - step: "contain" 1.5s
    focus: ["内部の処理", "保存先"]
    badge: "正常"
    description: "lane に contain を付けると、 lane ごと枠で囲んで内と外の境を示す。"
`;

export const sourceJson__laneContain = `{
  "title": "lane: contain (枠囲み)",
  "type": "flow",
  "lanes": {
    "inner": { "x": 0, "width": 440, "contain": true }
  },
  "actors": [
    { "name": "内部の処理", "kind": "function", "lane": "inner", "stack": 0 },
    { "name": "保存先", "kind": "storage", "lane": "inner", "stack": 1 }
  ],
  "flow": [],
  "animation": [
    {
      "step": "contain",
      "duration": 1.5,
      "focus": ["内部の処理", "保存先"],
      "badge": "正常",
      "body": "lane に contain を付けると、 lane ごと枠で囲んで内と外の境を示す。"
    }
  ]
}`;

export const sourceYaml__stackPair = `title: "stack: 縦 2 段"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 上: { kind: actor, lane: l, stack: 0 }
  - 下: { kind: actor, lane: l, stack: 1 }

animation:
  - step: "stack 0/1" 1.5s
    focus: ["上", "下"]
    badge: "正常"
    description: "同じ lane の中で、 stack の番号が縦の並びを決める。"
`;

export const sourceJson__stackPair = `{
  "title": "stack: 縦 2 段",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    { "name": "上", "kind": "actor", "lane": "l", "stack": 0 },
    { "name": "下", "kind": "actor", "lane": "l", "stack": 1 }
  ],
  "flow": [],
  "animation": [
    {
      "step": "stack 0/1",
      "duration": 1.5,
      "focus": ["上", "下"],
      "badge": "正常",
      "body": "同じ lane の中で、 stack の番号が縦の並びを決める。"
    }
  ]
}`;

export const sourceYaml__stackTriple = `title: "stack: 縦 3 段"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - stack 0: { kind: actor, lane: l, stack: 0 }
  - stack 1: { kind: function, lane: l, stack: 1 }
  - stack 2: { kind: storage, lane: l, stack: 2 }

animation:
  - step: "stack 0/1/2" 1.5s
    focus: ["stack 0", "stack 1", "stack 2"]
    badge: "正常"
    description: "stack を増やすと縦に伸びる。 間隔は row_gap が自動で決める。"
`;

export const sourceJson__stackTriple = `{
  "title": "stack: 縦 3 段",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    { "name": "stack 0", "kind": "actor", "lane": "l", "stack": 0 },
    { "name": "stack 1", "kind": "function", "lane": "l", "stack": 1 },
    { "name": "stack 2", "kind": "storage", "lane": "l", "stack": 2 }
  ],
  "flow": [],
  "animation": [
    {
      "step": "stack 0/1/2",
      "duration": 1.5,
      "focus": ["stack 0", "stack 1", "stack 2"],
      "badge": "正常",
      "body": "stack を増やすと縦に伸びる。 間隔は row_gap が自動で決める。"
    }
  ]
}`;

export const sourceYaml__shapeFile = `title: "shape: file (角を折った rect、 ファイル / document 表現)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 2

actors:
  - 月次報告書: { kind: shape-file, lane: l, stack: 0, eyebrow: "ファイル", subtitle: "PDF · {v} MB", posW: 272 }

animation:
  - step: "shape-file" 1.5s
    focus: ["月次報告書"]
    badge: "shape"
    description: "右上の角を折り返した四角。 ファイルや文書、報告書を表す。"
  - step: "shape-file の数が動く" 1.5s
    focus: ["月次報告書"]
    tween:
      v: 2 -> 9
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeFile = `{
  "title": "shape: file (角を折った rect、 ファイル / document 表現)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "月次報告書",
      "kind": "shape-file",
      "lane": "l",
      "stack": 0,
      "eyebrow": "ファイル",
      "subtitle": "PDF · {v} MB",
      "posW": 272
    }
  ],
  "flow": [],
  "states": { "v": 2 },
  "animation": [
    {
      "step": "shape-file",
      "duration": 1.5,
      "focus": ["月次報告書"],
      "badge": "shape",
      "body": "右上の角を折り返した四角。 ファイルや文書、報告書を表す。"
    },
    {
      "step": "shape-file の数が動く",
      "duration": 1.5,
      "focus": ["月次報告書"],
      "tween": { "v": [2, 9] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeFolder = `title: "shape: folder (tab 付き rect、 フォルダ / パッケージ)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 24

actors:
  - 設計資料/: { kind: shape-folder, lane: l, stack: 0, eyebrow: "フォルダ", subtitle: "ファイル {v} 件" }

animation:
  - step: "shape-folder" 1.5s
    focus: ["設計資料/"]
    badge: "shape"
    description: "上の縁につまみの付いた四角。 フォルダや、部品をまとめた単位を表す。"
  - step: "shape-folder の数が動く" 1.5s
    focus: ["設計資料/"]
    tween:
      v: 24 -> 118
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeFolder = `{
  "title": "shape: folder (tab 付き rect、 フォルダ / パッケージ)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "設計資料/",
      "kind": "shape-folder",
      "lane": "l",
      "stack": 0,
      "eyebrow": "フォルダ",
      "subtitle": "ファイル {v} 件"
    }
  ],
  "flow": [],
  "states": { "v": 24 },
  "animation": [
    {
      "step": "shape-folder",
      "duration": 1.5,
      "focus": ["設計資料/"],
      "badge": "shape",
      "body": "上の縁につまみの付いた四角。 フォルダや、部品をまとめた単位を表す。"
    },
    {
      "step": "shape-folder の数が動く",
      "duration": 1.5,
      "focus": ["設計資料/"],
      "tween": { "v": [24, 118] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeCloud = `title: "shape: cloud (5 円 合成、 クラウド / SaaS 表現)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 3

actors:
  - AWS: { kind: shape-cloud, lane: l, stack: 0, eyebrow: "クラウド", subtitle: "{v} リージョン" }

animation:
  - step: "shape-cloud" 1.5s
    focus: ["AWS"]
    badge: "shape"
    description: "5 つの円を重ねた雲の形。 クラウドの事業者や、外から呼ぶ API を表す。"
  - step: "shape-cloud の数が動く" 1.5s
    focus: ["AWS"]
    tween:
      v: 3 -> 12
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeCloud = `{
  "title": "shape: cloud (5 円 合成、 クラウド / SaaS 表現)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "AWS",
      "kind": "shape-cloud",
      "lane": "l",
      "stack": 0,
      "eyebrow": "クラウド",
      "subtitle": "{v} リージョン"
    }
  ],
  "flow": [],
  "states": { "v": 3 },
  "animation": [
    {
      "step": "shape-cloud",
      "duration": 1.5,
      "focus": ["AWS"],
      "badge": "shape",
      "body": "5 つの円を重ねた雲の形。 クラウドの事業者や、外から呼ぶ API を表す。"
    },
    {
      "step": "shape-cloud の数が動く",
      "duration": 1.5,
      "focus": ["AWS"],
      "tween": { "v": [3, 12] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeCylinder = `title: "shape: cylinder (円柱、 DB / storage 表現)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 120

actors:
  - PostgreSQL: { kind: shape-cylinder, lane: l, stack: 0, eyebrow: "データベース", subtitle: "{v} GB 使用", posW: 272 }

animation:
  - step: "shape-cylinder" 1.5s
    focus: ["PostgreSQL"]
    badge: "shape"
    description: "円柱 (上面と側面と底の楕円)。 DB や、消えずに残る保存先を表す。"
  - step: "shape-cylinder の数が動く" 1.5s
    focus: ["PostgreSQL"]
    tween:
      v: 120 -> 480
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeCylinder = `{
  "title": "shape: cylinder (円柱、 DB / storage 表現)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "PostgreSQL",
      "kind": "shape-cylinder",
      "lane": "l",
      "stack": 0,
      "eyebrow": "データベース",
      "subtitle": "{v} GB 使用",
      "posW": 272
    }
  ],
  "flow": [],
  "states": { "v": 120 },
  "animation": [
    {
      "step": "shape-cylinder",
      "duration": 1.5,
      "focus": ["PostgreSQL"],
      "badge": "shape",
      "body": "円柱 (上面と側面と底の楕円)。 DB や、消えずに残る保存先を表す。"
    },
    {
      "step": "shape-cylinder の数が動く",
      "duration": 1.5,
      "focus": ["PostgreSQL"],
      "tween": { "v": [120, 480] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeHexagon = `title: "shape: hexagon (六角形、 component / service)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 60

actors:
  - 認証の役務: { kind: shape-hexagon, lane: l, stack: 0, eyebrow: "部品", subtitle: "毎秒 {v} 件", posW: 294 }

animation:
  - step: "shape-hexagon" 1.5s
    focus: ["認証の役務"]
    badge: "shape"
    description: "六角形。 小さく分けた役務や、業務ごとの部品を表す。"
  - step: "shape-hexagon の数が動く" 1.5s
    focus: ["認証の役務"]
    tween:
      v: 60 -> 940
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeHexagon = `{
  "title": "shape: hexagon (六角形、 component / service)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "認証の役務",
      "kind": "shape-hexagon",
      "lane": "l",
      "stack": 0,
      "eyebrow": "部品",
      "subtitle": "毎秒 {v} 件",
      "posW": 294
    }
  ],
  "flow": [],
  "states": { "v": 60 },
  "animation": [
    {
      "step": "shape-hexagon",
      "duration": 1.5,
      "focus": ["認証の役務"],
      "badge": "shape",
      "body": "六角形。 小さく分けた役務や、業務ごとの部品を表す。"
    },
    {
      "step": "shape-hexagon の数が動く",
      "duration": 1.5,
      "focus": ["認証の役務"],
      "tween": { "v": [60, 940] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeDiamond = `title: "shape: diamond (ひし形、 decision / 判定)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 40

actors:
  - 正しい?: { kind: shape-diamond, lane: l, stack: 0, eyebrow: "判定", subtitle: "はい {v}%" }

animation:
  - step: "shape-diamond" 1.5s
    focus: ["正しい?"]
    badge: "shape"
    description: "ひし形。 条件で道が分かれる所を表す。"
  - step: "shape-diamond の数が動く" 1.5s
    focus: ["正しい?"]
    tween:
      v: 40 -> 92
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeDiamond = `{
  "title": "shape: diamond (ひし形、 decision / 判定)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "正しい?",
      "kind": "shape-diamond",
      "lane": "l",
      "stack": 0,
      "eyebrow": "判定",
      "subtitle": "はい {v}%"
    }
  ],
  "flow": [],
  "states": { "v": 40 },
  "animation": [
    {
      "step": "shape-diamond",
      "duration": 1.5,
      "focus": ["正しい?"],
      "badge": "shape",
      "body": "ひし形。 条件で道が分かれる所を表す。"
    },
    {
      "step": "shape-diamond の数が動く",
      "duration": 1.5,
      "focus": ["正しい?"],
      "tween": { "v": [40, 92] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeStack = `title: "shape: stack (重ね rect、 layer / history)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 3

actors:
  - v3.2.0: { kind: shape-stack, lane: l, stack: 0, eyebrow: "公開版", subtitle: "{v} 版" }

animation:
  - step: "shape-stack" 1.5s
    focus: ["v3.2.0"]
    badge: "shape"
    description: "3 枚重ねた四角。 版の履歴や層、ある時点の写しの束を表す。"
  - step: "shape-stack の数が動く" 1.5s
    focus: ["v3.2.0"]
    tween:
      v: 3 -> 14
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeStack = `{
  "title": "shape: stack (重ね rect、 layer / history)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "v3.2.0",
      "kind": "shape-stack",
      "lane": "l",
      "stack": 0,
      "eyebrow": "公開版",
      "subtitle": "{v} 版"
    }
  ],
  "flow": [],
  "states": { "v": 3 },
  "animation": [
    {
      "step": "shape-stack",
      "duration": 1.5,
      "focus": ["v3.2.0"],
      "badge": "shape",
      "body": "3 枚重ねた四角。 版の履歴や層、ある時点の写しの束を表す。"
    },
    {
      "step": "shape-stack の数が動く",
      "duration": 1.5,
      "focus": ["v3.2.0"],
      "tween": { "v": [3, 14] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapePerson = `title: "shape: person (人型 figure、 actor / user 表現)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 2

actors:
  - エンドユーザ: { kind: shape-person, lane: l, stack: 0, eyebrow: "人物", subtitle: "{v} 操作" }

animation:
  - step: "shape-person" 1.5s
    focus: ["エンドユーザ"]
    badge: "shape"
    description: "人の形 (丸い頭と台形の胴、曲げた腕)。 登場する人や利用者、担当者を表す。"
  - step: "shape-person の数が動く" 1.5s
    focus: ["エンドユーザ"]
    tween:
      v: 2 -> 21
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapePerson = `{
  "title": "shape: person (人型 figure、 actor / user 表現)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "エンドユーザ",
      "kind": "shape-person",
      "lane": "l",
      "stack": 0,
      "eyebrow": "人物",
      "subtitle": "{v} 操作"
    }
  ],
  "flow": [],
  "states": { "v": 2 },
  "animation": [
    {
      "step": "shape-person",
      "duration": 1.5,
      "focus": ["エンドユーザ"],
      "badge": "shape",
      "body": "人の形 (丸い頭と台形の胴、曲げた腕)。 登場する人や利用者、担当者を表す。"
    },
    {
      "step": "shape-person の数が動く",
      "duration": 1.5,
      "focus": ["エンドユーザ"],
      "tween": { "v": [2, 21] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeWindow = `title: "shape: window (GUI アプリ、 traffic lights + body)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 1

actors:
  - ダッシュボード: { kind: shape-window, lane: l, stack: 0, eyebrow: "アプリの画面", subtitle: "開いた画面 {v}" }

animation:
  - step: "shape-window" 1.5s
    focus: ["ダッシュボード"]
    badge: "shape"
    description: "題の帯と 3 色の丸ボタン、本体。 アプリの画面や、閲覧ソフトで開いた画面を表す。"
  - step: "shape-window の数が動く" 1.5s
    focus: ["ダッシュボード"]
    tween:
      v: 1 -> 6
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeWindow = `{
  "title": "shape: window (GUI アプリ、 traffic lights + body)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "ダッシュボード",
      "kind": "shape-window",
      "lane": "l",
      "stack": 0,
      "eyebrow": "アプリの画面",
      "subtitle": "開いた画面 {v}"
    }
  ],
  "flow": [],
  "states": { "v": 1 },
  "animation": [
    {
      "step": "shape-window",
      "duration": 1.5,
      "focus": ["ダッシュボード"],
      "badge": "shape",
      "body": "題の帯と 3 色の丸ボタン、本体。 アプリの画面や、閲覧ソフトで開いた画面を表す。"
    },
    {
      "step": "shape-window の数が動く",
      "duration": 1.5,
      "focus": ["ダッシュボード"],
      "tween": { "v": [1, 6] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeTerminal = `title: "shape: terminal (CLI shell、 mac bar + prompt)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - zsh: { kind: shape-terminal, lane: l, stack: 0, eyebrow: "端末", subtitle: "命令を打つ画面" }

animation:
  - step: "shape-terminal" 1.5s
    focus: ["zsh"]
    badge: "shape"
    description: "上の帯と $ の入力待ち、点滅する印。 命令を打つ画面や、遠くの機械への接続、手順の自動実行を表す。"
`;

export const sourceJson__shapeTerminal = `{
  "title": "shape: terminal (CLI shell、 mac bar + prompt)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "zsh",
      "kind": "shape-terminal",
      "lane": "l",
      "stack": 0,
      "eyebrow": "端末",
      "subtitle": "命令を打つ画面"
    }
  ],
  "flow": [],
  "animation": [
    {
      "step": "shape-terminal",
      "duration": 1.5,
      "focus": ["zsh"],
      "badge": "shape",
      "body": "上の帯と $ の入力待ち、点滅する印。 命令を打つ画面や、遠くの機械への接続、手順の自動実行を表す。"
    }
  ]
}`;

export const sourceYaml__shapeCodeBlock = `title: "shape: code-block (snippet、 editor tab + 4 syntax lines)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 共通の処理: { kind: shape-code-block, lane: l, stack: 0, eyebrow: "コード", subtitle: "3 行の抜粋" }

animation:
  - step: "shape-code-block" 1.5s
    focus: ["共通の処理"]
    badge: "shape"
    description: "編集画面の見出しと行番号の欄、色分けした 4 行。 コードの抜粋や、実装そのものを表す。"
`;

export const sourceJson__shapeCodeBlock = `{
  "title": "shape: code-block (snippet、 editor tab + 4 syntax lines)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "共通の処理",
      "kind": "shape-code-block",
      "lane": "l",
      "stack": 0,
      "eyebrow": "コード",
      "subtitle": "3 行の抜粋"
    }
  ],
  "flow": [],
  "animation": [
    {
      "step": "shape-code-block",
      "duration": 1.5,
      "focus": ["共通の処理"],
      "badge": "shape",
      "body": "編集画面の見出しと行番号の欄、色分けした 4 行。 コードの抜粋や、実装そのものを表す。"
    }
  ]
}`;

export const sourceYaml__shapeKanbanCard = `title: "shape: kanban-card (ticket + priority + tags)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 課題 #1111: { kind: shape-kanban-card, lane: l, stack: 0, eyebrow: "作業中", subtitle: "形で見せる種別" }

animation:
  - step: "shape-kanban-card" 1.5s
    focus: ["課題 #1111"]
    badge: "shape"
    description: "優先度の帯と番号、状態の札、題、分類の札、担当者の顔。 看板に貼る作業札や課題を表す。"
`;

export const sourceJson__shapeKanbanCard = `{
  "title": "shape: kanban-card (ticket + priority + tags)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "課題 #1111",
      "kind": "shape-kanban-card",
      "lane": "l",
      "stack": 0,
      "eyebrow": "作業中",
      "subtitle": "形で見せる種別"
    }
  ],
  "flow": [],
  "animation": [
    {
      "step": "shape-kanban-card",
      "duration": 1.5,
      "focus": ["課題 #1111"],
      "badge": "shape",
      "body": "優先度の帯と番号、状態の札、題、分類の札、担当者の顔。 看板に貼る作業札や課題を表す。"
    }
  ]
}`;

export const sourceYaml__shapeMessageBubble = `title: "shape: message-bubble (吹き出し、 rounded rect + tail)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 0

actors:
  - 了解しました: { kind: shape-message-bubble, lane: l, stack: 0, eyebrow: "発言", subtitle: "未読 {v}" }

animation:
  - step: "shape-message-bubble" 1.5s
    focus: ["了解しました"]
    badge: "shape"
    description: "角の丸い四角と、左下のしっぽ。 会話の発言や、変更への意見、通知を表す。"
  - step: "shape-message-bubble の数が動く" 1.5s
    focus: ["了解しました"]
    tween:
      v: 0 -> 9
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeMessageBubble = `{
  "title": "shape: message-bubble (吹き出し、 rounded rect + tail)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "了解しました",
      "kind": "shape-message-bubble",
      "lane": "l",
      "stack": 0,
      "eyebrow": "発言",
      "subtitle": "未読 {v}"
    }
  ],
  "flow": [],
  "states": { "v": 0 },
  "animation": [
    {
      "step": "shape-message-bubble",
      "duration": 1.5,
      "focus": ["了解しました"],
      "badge": "shape",
      "body": "角の丸い四角と、左下のしっぽ。 会話の発言や、変更への意見、通知を表す。"
    },
    {
      "step": "shape-message-bubble の数が動く",
      "duration": 1.5,
      "focus": ["了解しました"],
      "tween": { "v": [0, 9] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeGear = `title: "shape: gear (歯車、 設定 / 処理エンジン)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 8

actors:
  - 環境設定: { kind: shape-gear, lane: l, stack: 0, eyebrow: "構成", subtitle: "設定 {v} 件" }

animation:
  - step: "shape-gear" 1.5s
    focus: ["環境設定"]
    badge: "shape"
    description: "歯が 12 枚の大きな歯車と、4 本の腕、中心の軸、留め具。 設定や、処理を回す仕組みを表す。"
  - step: "shape-gear の数が動く" 1.5s
    focus: ["環境設定"]
    tween:
      v: 8 -> 26
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeGear = `{
  "title": "shape: gear (歯車、 設定 / 処理エンジン)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "環境設定",
      "kind": "shape-gear",
      "lane": "l",
      "stack": 0,
      "eyebrow": "構成",
      "subtitle": "設定 {v} 件"
    }
  ],
  "flow": [],
  "states": { "v": 8 },
  "animation": [
    {
      "step": "shape-gear",
      "duration": 1.5,
      "focus": ["環境設定"],
      "badge": "shape",
      "body": "歯が 12 枚の大きな歯車と、4 本の腕、中心の軸、留め具。 設定や、処理を回す仕組みを表す。"
    },
    {
      "step": "shape-gear の数が動く",
      "duration": 1.5,
      "focus": ["環境設定"],
      "tween": { "v": [8, 26] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeServerRack = `title: "shape: server-rack (19 inch rack、 物理サーバ)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 3

actors:
  - 公開用 1 号機: { kind: shape-server-rack, lane: l, stack: 0, eyebrow: "サーバ", subtitle: "{v} U 分を使用" }

animation:
  - step: "shape-server-rack" 1.5s
    focus: ["公開用 1 号機"]
    badge: "shape"
    description: "外枠と 3 段の差し込み口を持つ棚。 実機のサーバや、データセンター、自社に置く機器を表す。"
  - step: "shape-server-rack の数が動く" 1.5s
    focus: ["公開用 1 号機"]
    tween:
      v: 3 -> 12
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeServerRack = `{
  "title": "shape: server-rack (19 inch rack、 物理サーバ)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "公開用 1 号機",
      "kind": "shape-server-rack",
      "lane": "l",
      "stack": 0,
      "eyebrow": "サーバ",
      "subtitle": "{v} U 分を使用"
    }
  ],
  "flow": [],
  "states": { "v": 3 },
  "animation": [
    {
      "step": "shape-server-rack",
      "duration": 1.5,
      "focus": ["公開用 1 号機"],
      "badge": "shape",
      "body": "外枠と 3 段の差し込み口を持つ棚。 実機のサーバや、データセンター、自社に置く機器を表す。"
    },
    {
      "step": "shape-server-rack の数が動く",
      "duration": 1.5,
      "focus": ["公開用 1 号機"],
      "tween": { "v": [3, 12] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeNetworkNode = `title: "shape: network-node (network hub、 router / switch)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 12

actors:
  - 基幹ルータ: { kind: shape-network-node, lane: l, stack: 0, eyebrow: "通信網", subtitle: "L3 · 接続 {v} 台" }

animation:
  - step: "shape-network-node" 1.5s
    focus: ["基幹ルータ"]
    badge: "shape"
    description: "中央の円と 4 方向の線。 通信を中継する機器 (経路を選ぶもの、線を束ねるもの) を表す。"
  - step: "shape-network-node の数が動く" 1.5s
    focus: ["基幹ルータ"]
    tween:
      v: 12 -> 96
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeNetworkNode = `{
  "title": "shape: network-node (network hub、 router / switch)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "基幹ルータ",
      "kind": "shape-network-node",
      "lane": "l",
      "stack": 0,
      "eyebrow": "通信網",
      "subtitle": "L3 · 接続 {v} 台"
    }
  ],
  "flow": [],
  "states": { "v": 12 },
  "animation": [
    {
      "step": "shape-network-node",
      "duration": 1.5,
      "focus": ["基幹ルータ"],
      "badge": "shape",
      "body": "中央の円と 4 方向の線。 通信を中継する機器 (経路を選ぶもの、線を束ねるもの) を表す。"
    },
    {
      "step": "shape-network-node の数が動く",
      "duration": 1.5,
      "focus": ["基幹ルータ"],
      "tween": { "v": [12, 96] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeMobileDevice = `title: "shape: mobile-device (携帯端末)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 200

actors:
  - iPhone: { kind: shape-mobile-device, lane: l, stack: 0, eyebrow: "携帯端末", subtitle: "{v} 台が稼働" }

animation:
  - step: "shape-mobile-device" 1.5s
    focus: ["iPhone"]
    badge: "shape"
    description: "上の話し口と画面、下のボタンを持つスマホ。 携帯のアプリや、利用者の手元の端末を表す。"
  - step: "shape-mobile-device の数が動く" 1.5s
    focus: ["iPhone"]
    tween:
      v: 200 -> 1800
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeMobileDevice = `{
  "title": "shape: mobile-device (携帯端末)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "iPhone",
      "kind": "shape-mobile-device",
      "lane": "l",
      "stack": 0,
      "eyebrow": "携帯端末",
      "subtitle": "{v} 台が稼働"
    }
  ],
  "flow": [],
  "states": { "v": 200 },
  "animation": [
    {
      "step": "shape-mobile-device",
      "duration": 1.5,
      "focus": ["iPhone"],
      "badge": "shape",
      "body": "上の話し口と画面、下のボタンを持つスマホ。 携帯のアプリや、利用者の手元の端末を表す。"
    },
    {
      "step": "shape-mobile-device の数が動く",
      "duration": 1.5,
      "focus": ["iPhone"],
      "tween": { "v": [200, 1800] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeIotSensor = `title: "shape: iot-sensor (IoT beacon、 電波発信)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 18

actors:
  - 温度センサー: { kind: shape-iot-sensor, lane: l, stack: 0, eyebrow: "計測機器", subtitle: "無線 · {v} 度" }

animation:
  - step: "shape-iot-sensor" 1.5s
    focus: ["温度センサー"]
    badge: "shape"
    description: "計測器の円と 3 重の波紋。 電波で知らせる計測器や、ものにつないだ端末を表す。"
  - step: "shape-iot-sensor の数が動く" 1.5s
    focus: ["温度センサー"]
    tween:
      v: 18 -> 34
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeIotSensor = `{
  "title": "shape: iot-sensor (IoT beacon、 電波発信)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "温度センサー",
      "kind": "shape-iot-sensor",
      "lane": "l",
      "stack": 0,
      "eyebrow": "計測機器",
      "subtitle": "無線 · {v} 度"
    }
  ],
  "flow": [],
  "states": { "v": 18 },
  "animation": [
    {
      "step": "shape-iot-sensor",
      "duration": 1.5,
      "focus": ["温度センサー"],
      "badge": "shape",
      "body": "計測器の円と 3 重の波紋。 電波で知らせる計測器や、ものにつないだ端末を表す。"
    },
    {
      "step": "shape-iot-sensor の数が動く",
      "duration": 1.5,
      "focus": ["温度センサー"],
      "tween": { "v": [18, 34] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeRobotArm = `title: "shape: robot-arm (機械の腕、 産業機器)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 40

actors:
  - 組立ライン: { kind: shape-robot-arm, lane: l, stack: 0, eyebrow: "ロボット", subtitle: "6 軸 · {v} 個/時" }

animation:
  - step: "shape-robot-arm" 1.5s
    focus: ["組立ライン"]
    badge: "shape"
    description: "台座と 2 つの関節、先のつかみ手を持つ腕。 産業機器や、自動にした工程、制御する対象を表す。"
  - step: "shape-robot-arm の数が動く" 1.5s
    focus: ["組立ライン"]
    tween:
      v: 40 -> 260
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeRobotArm = `{
  "title": "shape: robot-arm (機械の腕、 産業機器)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "組立ライン",
      "kind": "shape-robot-arm",
      "lane": "l",
      "stack": 0,
      "eyebrow": "ロボット",
      "subtitle": "6 軸 · {v} 個/時"
    }
  ],
  "flow": [],
  "states": { "v": 40 },
  "animation": [
    {
      "step": "shape-robot-arm",
      "duration": 1.5,
      "focus": ["組立ライン"],
      "badge": "shape",
      "body": "台座と 2 つの関節、先のつかみ手を持つ腕。 産業機器や、自動にした工程、制御する対象を表す。"
    },
    {
      "step": "shape-robot-arm の数が動く",
      "duration": 1.5,
      "focus": ["組立ライン"],
      "tween": { "v": [40, 260] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeSatellite = `title: "shape: satellite (人工衛星、 エッジ通信)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 340

actors:
  - Starlink: { kind: shape-satellite, lane: l, stack: 0, eyebrow: "人工衛星", subtitle: "低軌道 · 高度 {v} km" }

animation:
  - step: "shape-satellite" 1.5s
    focus: ["Starlink"]
    badge: "shape"
    description: "中央の本体と左右の太陽電池板、アンテナ。 人工衛星や、宇宙を経由する通信を表す。"
  - step: "shape-satellite の数が動く" 1.5s
    focus: ["Starlink"]
    tween:
      v: 340 -> 550
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeSatellite = `{
  "title": "shape: satellite (人工衛星、 エッジ通信)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "Starlink",
      "kind": "shape-satellite",
      "lane": "l",
      "stack": 0,
      "eyebrow": "人工衛星",
      "subtitle": "低軌道 · 高度 {v} km"
    }
  ],
  "flow": [],
  "states": { "v": 340 },
  "animation": [
    {
      "step": "shape-satellite",
      "duration": 1.5,
      "focus": ["Starlink"],
      "badge": "shape",
      "body": "中央の本体と左右の太陽電池板、アンテナ。 人工衛星や、宇宙を経由する通信を表す。"
    },
    {
      "step": "shape-satellite の数が動く",
      "duration": 1.5,
      "focus": ["Starlink"],
      "tween": { "v": [340, 550] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeSmartContract = `title: "shape: smart-contract (契約書 + 歯車 = 自動実行)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 12

actors:
  - 預かり契約: { kind: shape-smart-contract, lane: l, stack: 0, eyebrow: "契約", subtitle: "0.8.24 · 呼出 {v}" }

animation:
  - step: "shape-smart-contract" 1.5s
    focus: ["預かり契約"]
    badge: "shape"
    description: "文書と、底の歯車 (自動で動く印)。 自動で動く契約や、参加者で決める組織の規約、条件付きの預かりを表す。"
  - step: "shape-smart-contract の数が動く" 1.5s
    focus: ["預かり契約"]
    tween:
      v: 12 -> 480
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeSmartContract = `{
  "title": "shape: smart-contract (契約書 + 歯車 = 自動実行)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "預かり契約",
      "kind": "shape-smart-contract",
      "lane": "l",
      "stack": 0,
      "eyebrow": "契約",
      "subtitle": "0.8.24 · 呼出 {v}"
    }
  ],
  "flow": [],
  "states": { "v": 12 },
  "animation": [
    {
      "step": "shape-smart-contract",
      "duration": 1.5,
      "focus": ["預かり契約"],
      "badge": "shape",
      "body": "文書と、底の歯車 (自動で動く印)。 自動で動く契約や、参加者で決める組織の規約、条件付きの預かりを表す。"
    },
    {
      "step": "shape-smart-contract の数が動く",
      "duration": 1.5,
      "focus": ["預かり契約"],
      "tween": { "v": [12, 480] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeBlockchainBlock = `title: "shape: blockchain-block (連結 3 block + hash pointer)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - ブロック #421: { kind: shape-blockchain-block, lane: l, stack: 0, eyebrow: "台帳", subtitle: "0xaf31c9d2..." }

animation:
  - step: "shape-blockchain-block" 1.5s
    focus: ["ブロック #421"]
    badge: "shape"
    description: "3 つのブロックを縦につなぎ、前のブロックの要約値と取引の数を持たせた形。 Ethereum や Bitcoin のブロックを表す。"
`;

export const sourceJson__shapeBlockchainBlock = `{
  "title": "shape: blockchain-block (連結 3 block + hash pointer)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "ブロック #421",
      "kind": "shape-blockchain-block",
      "lane": "l",
      "stack": 0,
      "eyebrow": "台帳",
      "subtitle": "0xaf31c9d2..."
    }
  ],
  "flow": [],
  "animation": [
    {
      "step": "shape-blockchain-block",
      "duration": 1.5,
      "focus": ["ブロック #421"],
      "badge": "shape",
      "body": "3 つのブロックを縦につなぎ、前のブロックの要約値と取引の数を持たせた形。 Ethereum や Bitcoin のブロックを表す。"
    }
  ]
}`;

export const sourceYaml__shapeRpcNode = `title: "shape: rpc-node (JSON-RPC node + 6 peers + sync bar)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 90

actors:
  - Alchemy: { kind: shape-rpc-node, lane: l, stack: 0, eyebrow: "RPC の窓口", subtitle: "本番の網 · 毎秒 {v} 件" }

animation:
  - step: "shape-rpc-node" 1.5s
    focus: ["Alchemy"]
    badge: "shape"
    description: "中央の球と周りの 6 つの点、同期の帯。 分散台帳へ問い合わせる窓口を貸す事業者を表す。"
  - step: "shape-rpc-node の数が動く" 1.5s
    focus: ["Alchemy"]
    tween:
      v: 90 -> 1200
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeRpcNode = `{
  "title": "shape: rpc-node (JSON-RPC node + 6 peers + sync bar)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "Alchemy",
      "kind": "shape-rpc-node",
      "lane": "l",
      "stack": 0,
      "eyebrow": "RPC の窓口",
      "subtitle": "本番の網 · 毎秒 {v} 件"
    }
  ],
  "flow": [],
  "states": { "v": 90 },
  "animation": [
    {
      "step": "shape-rpc-node",
      "duration": 1.5,
      "focus": ["Alchemy"],
      "badge": "shape",
      "body": "中央の球と周りの 6 つの点、同期の帯。 分散台帳へ問い合わせる窓口を貸す事業者を表す。"
    },
    {
      "step": "shape-rpc-node の数が動く",
      "duration": 1.5,
      "focus": ["Alchemy"],
      "tween": { "v": [90, 1200] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeWallet = `title: "shape: wallet (財布 + coin + balance display)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 1

actors:
  - MetaMask: { kind: shape-wallet, lane: l, stack: 0, eyebrow: "財布", subtitle: "個人の口座 · 残高 {v} ETH" }

animation:
  - step: "shape-wallet" 1.5s
    focus: ["MetaMask"]
    badge: "shape"
    description: "財布と差し込んだ硬貨、残高。 閲覧ソフトの財布や、鍵を持ち歩く機器、契約でできた財布を表す。"
  - step: "shape-wallet の数が動く" 1.5s
    focus: ["MetaMask"]
    tween:
      v: 1 -> 12
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeWallet = `{
  "title": "shape: wallet (財布 + coin + balance display)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "MetaMask",
      "kind": "shape-wallet",
      "lane": "l",
      "stack": 0,
      "eyebrow": "財布",
      "subtitle": "個人の口座 · 残高 {v} ETH"
    }
  ],
  "flow": [],
  "states": { "v": 1 },
  "animation": [
    {
      "step": "shape-wallet",
      "duration": 1.5,
      "focus": ["MetaMask"],
      "badge": "shape",
      "body": "財布と差し込んだ硬貨、残高。 閲覧ソフトの財布や、鍵を持ち歩く機器、契約でできた財布を表す。"
    },
    {
      "step": "shape-wallet の数が動く",
      "duration": 1.5,
      "focus": ["MetaMask"],
      "tween": { "v": [1, 12] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeNft = `title: "shape: nft (額縁 + polygonal art + verified badge)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 3

actors:
  - CryptoPunk: { kind: shape-nft, lane: l, stack: 0, eyebrow: "NFT", subtitle: "ERC-721 · {v} ETH", posW: 272 }

animation:
  - step: "shape-nft" 1.5s
    focus: ["CryptoPunk"]
    badge: "shape"
    description: "額縁と角ばった絵、本物の印。 ERC-721 の作品や、譲れない証明、作品の集まりを表す。"
  - step: "shape-nft の数が動く" 1.5s
    focus: ["CryptoPunk"]
    tween:
      v: 3 -> 28
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeNft = `{
  "title": "shape: nft (額縁 + polygonal art + verified badge)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "CryptoPunk",
      "kind": "shape-nft",
      "lane": "l",
      "stack": 0,
      "eyebrow": "NFT",
      "subtitle": "ERC-721 · {v} ETH",
      "posW": 272
    }
  ],
  "flow": [],
  "states": { "v": 3 },
  "animation": [
    {
      "step": "shape-nft",
      "duration": 1.5,
      "focus": ["CryptoPunk"],
      "badge": "shape",
      "body": "額縁と角ばった絵、本物の印。 ERC-721 の作品や、譲れない証明、作品の集まりを表す。"
    },
    {
      "step": "shape-nft の数が動く",
      "duration": 1.5,
      "focus": ["CryptoPunk"],
      "tween": { "v": [3, 28] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeToken = `title: "shape: token (硬貨、 fungible currency)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 2100

actors:
  - ETH: { kind: shape-token, lane: l, stack: 0, eyebrow: "通貨", subtitle: "ERC-20 · {v} ドル" }

animation:
  - step: "shape-token" 1.5s
    focus: ["ETH"]
    badge: "shape"
    description: "硬貨と通貨の記号 Ξ、光。 ERC-20 の通貨や、台帳そのものの通貨、値を固定した通貨を表す。"
  - step: "shape-token の数が動く" 1.5s
    focus: ["ETH"]
    tween:
      v: 2100 -> 3400
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeToken = `{
  "title": "shape: token (硬貨、 fungible currency)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "ETH",
      "kind": "shape-token",
      "lane": "l",
      "stack": 0,
      "eyebrow": "通貨",
      "subtitle": "ERC-20 · {v} ドル"
    }
  ],
  "flow": [],
  "states": { "v": 2100 },
  "animation": [
    {
      "step": "shape-token",
      "duration": 1.5,
      "focus": ["ETH"],
      "badge": "shape",
      "body": "硬貨と通貨の記号 Ξ、光。 ERC-20 の通貨や、台帳そのものの通貨、値を固定した通貨を表す。"
    },
    {
      "step": "shape-token の数が動く",
      "duration": 1.5,
      "focus": ["ETH"],
      "tween": { "v": [2100, 3400] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeBank = `title: "shape: bank (Greek facade + 4 columns + $)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 90

actors:
  - みずほ銀行: { kind: shape-bank, lane: l, stack: 0, eyebrow: "銀行", subtitle: "都銀 · 預金 {v} 兆円" }

animation:
  - step: "shape-bank" 1.5s
    focus: ["みずほ銀行"]
    badge: "shape"
    description: "神殿風の正面 (三角の屋根と柱と土台)。 都市銀行や地方銀行、銀行の本店を表す。"
  - step: "shape-bank の数が動く" 1.5s
    focus: ["みずほ銀行"]
    tween:
      v: 90 -> 142
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeBank = `{
  "title": "shape: bank (Greek facade + 4 columns + $)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "みずほ銀行",
      "kind": "shape-bank",
      "lane": "l",
      "stack": 0,
      "eyebrow": "銀行",
      "subtitle": "都銀 · 預金 {v} 兆円"
    }
  ],
  "flow": [],
  "states": { "v": 90 },
  "animation": [
    {
      "step": "shape-bank",
      "duration": 1.5,
      "focus": ["みずほ銀行"],
      "badge": "shape",
      "body": "神殿風の正面 (三角の屋根と柱と土台)。 都市銀行や地方銀行、銀行の本店を表す。"
    },
    {
      "step": "shape-bank の数が動く",
      "duration": 1.5,
      "focus": ["みずほ銀行"],
      "tween": { "v": [90, 142] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeTrustBank = `title: "shape: trust-bank (bank facade + 冠 crown = 受託の信頼)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 40

actors:
  - 三菱 UFJ 信託: { kind: shape-trust-bank, lane: l, stack: 0, eyebrow: "信託銀行", subtitle: "受託 {v} 兆円" }

animation:
  - step: "shape-trust-bank" 1.5s
    focus: ["三菱 UFJ 信託"]
    badge: "shape"
    description: "冠と正面の柱、T の印。 信託銀行や、預かって運用する業務、資産の管理を表す。"
  - step: "shape-trust-bank の数が動く" 1.5s
    focus: ["三菱 UFJ 信託"]
    tween:
      v: 40 -> 88
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeTrustBank = `{
  "title": "shape: trust-bank (bank facade + 冠 crown = 受託の信頼)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "三菱 UFJ 信託",
      "kind": "shape-trust-bank",
      "lane": "l",
      "stack": 0,
      "eyebrow": "信託銀行",
      "subtitle": "受託 {v} 兆円"
    }
  ],
  "flow": [],
  "states": { "v": 40 },
  "animation": [
    {
      "step": "shape-trust-bank",
      "duration": 1.5,
      "focus": ["三菱 UFJ 信託"],
      "badge": "shape",
      "body": "冠と正面の柱、T の印。 信託銀行や、預かって運用する業務、資産の管理を表す。"
    },
    {
      "step": "shape-trust-bank の数が動く",
      "duration": 1.5,
      "focus": ["三菱 UFJ 信託"],
      "tween": { "v": [40, 88] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapePaymentProvider = `title: "shape: payment-provider (POS 端末 + screen + keypad)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 30

actors:
  - Stripe: { kind: shape-payment-provider, lane: l, stack: 0, eyebrow: "決済", subtitle: "決済 {v} 件/s" }

animation:
  - step: "shape-payment-provider" 1.5s
    focus: ["Stripe"]
    badge: "shape"
    description: "支払いの端末と承認の表示、数字の鍵盤。 決済の代行業者や、電子決済の取次を表す。"
  - step: "shape-payment-provider の数が動く" 1.5s
    focus: ["Stripe"]
    tween:
      v: 30 -> 420
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapePaymentProvider = `{
  "title": "shape: payment-provider (POS 端末 + screen + keypad)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "Stripe",
      "kind": "shape-payment-provider",
      "lane": "l",
      "stack": 0,
      "eyebrow": "決済",
      "subtitle": "決済 {v} 件/s"
    }
  ],
  "flow": [],
  "states": { "v": 30 },
  "animation": [
    {
      "step": "shape-payment-provider",
      "duration": 1.5,
      "focus": ["Stripe"],
      "badge": "shape",
      "body": "支払いの端末と承認の表示、数字の鍵盤。 決済の代行業者や、電子決済の取次を表す。"
    },
    {
      "step": "shape-payment-provider の数が動く",
      "duration": 1.5,
      "focus": ["Stripe"],
      "tween": { "v": [30, 420] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeBrokerage = `title: "shape: brokerage (証券会社 tower + candle chart + up arrow)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 120

actors:
  - 野村證券: { kind: shape-brokerage, lane: l, stack: 0, eyebrow: "証券", subtitle: "約定 {v} 件" }

animation:
  - step: "shape-brokerage" 1.5s
    focus: ["野村證券"]
    badge: "shape"
    description: "高い建物と格子の窓、ろうそく足の図、上向きの矢印。 証券会社や投資銀行を表す。"
  - step: "shape-brokerage の数が動く" 1.5s
    focus: ["野村證券"]
    tween:
      v: 120 -> 940
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeBrokerage = `{
  "title": "shape: brokerage (証券会社 tower + candle chart + up arrow)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "野村證券",
      "kind": "shape-brokerage",
      "lane": "l",
      "stack": 0,
      "eyebrow": "証券",
      "subtitle": "約定 {v} 件"
    }
  ],
  "flow": [],
  "states": { "v": 120 },
  "animation": [
    {
      "step": "shape-brokerage",
      "duration": 1.5,
      "focus": ["野村證券"],
      "badge": "shape",
      "body": "高い建物と格子の窓、ろうそく足の図、上向きの矢印。 証券会社や投資銀行を表す。"
    },
    {
      "step": "shape-brokerage の数が動く",
      "duration": 1.5,
      "focus": ["野村證券"],
      "tween": { "v": [120, 940] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeExchange = `title: "shape: exchange (取引所、 $ ⇄ Ξ swap)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 12

actors:
  - Coinbase: { kind: shape-exchange, lane: l, stack: 0, eyebrow: "取引所", subtitle: "出来高 {v} 億" }

animation:
  - step: "shape-exchange" 1.5s
    focus: ["Coinbase"]
    badge: "shape"
    description: "2 つの通貨の硬貨と両向きの矢印、交換の比率。 取引所や、仲介なしで交換する場、両替を表す。"
  - step: "shape-exchange の数が動く" 1.5s
    focus: ["Coinbase"]
    tween:
      v: 12 -> 86
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeExchange = `{
  "title": "shape: exchange (取引所、 $ ⇄ Ξ swap)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "Coinbase",
      "kind": "shape-exchange",
      "lane": "l",
      "stack": 0,
      "eyebrow": "取引所",
      "subtitle": "出来高 {v} 億"
    }
  ],
  "flow": [],
  "states": { "v": 12 },
  "animation": [
    {
      "step": "shape-exchange",
      "duration": 1.5,
      "focus": ["Coinbase"],
      "badge": "shape",
      "body": "2 つの通貨の硬貨と両向きの矢印、交換の比率。 取引所や、仲介なしで交換する場、両替を表す。"
    },
    {
      "step": "shape-exchange の数が動く",
      "duration": 1.5,
      "focus": ["Coinbase"],
      "tween": { "v": [12, 86] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeAtm = `title: "shape: atm (現金自動預払機、 card slot + cash dispenser)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 180

actors:
  - ATM: { kind: shape-atm, lane: l, stack: 0, eyebrow: "現金の窓口", subtitle: "24 時間 · {v} 件/日" }

animation:
  - step: "shape-atm" 1.5s
    focus: ["ATM"]
    badge: "shape"
    description: "画面とボタン、カードの差し込み口、お金の出口。 銀行やコンビニの ATM を表す。"
  - step: "shape-atm の数が動く" 1.5s
    focus: ["ATM"]
    tween:
      v: 180 -> 620
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeAtm = `{
  "title": "shape: atm (現金自動預払機、 card slot + cash dispenser)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "ATM",
      "kind": "shape-atm",
      "lane": "l",
      "stack": 0,
      "eyebrow": "現金の窓口",
      "subtitle": "24 時間 · {v} 件/日"
    }
  ],
  "flow": [],
  "states": { "v": 180 },
  "animation": [
    {
      "step": "shape-atm",
      "duration": 1.5,
      "focus": ["ATM"],
      "badge": "shape",
      "body": "画面とボタン、カードの差し込み口、お金の出口。 銀行やコンビニの ATM を表す。"
    },
    {
      "step": "shape-atm の数が動く",
      "duration": 1.5,
      "focus": ["ATM"],
      "tween": { "v": [180, 620] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeWebsite = `title: "shape: website (browser + URL + page layout)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 1200

actors:
  - 会社案内: { kind: shape-website, lane: l, stack: 0, eyebrow: "サイト", subtitle: "閲覧 {v} 回/日" }

animation:
  - step: "shape-website" 1.5s
    focus: ["会社案内"]
    badge: "shape"
    description: "閲覧ソフトの枠と住所の欄、見出し、2 列の本文。 会社の案内や製品の紹介、日記のようなサイトを表す。"
  - step: "shape-website の数が動く" 1.5s
    focus: ["会社案内"]
    tween:
      v: 1200 -> 8600
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeWebsite = `{
  "title": "shape: website (browser + URL + page layout)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "会社案内",
      "kind": "shape-website",
      "lane": "l",
      "stack": 0,
      "eyebrow": "サイト",
      "subtitle": "閲覧 {v} 回/日"
    }
  ],
  "flow": [],
  "states": { "v": 1200 },
  "animation": [
    {
      "step": "shape-website",
      "duration": 1.5,
      "focus": ["会社案内"],
      "badge": "shape",
      "body": "閲覧ソフトの枠と住所の欄、見出し、2 列の本文。 会社の案内や製品の紹介、日記のようなサイトを表す。"
    },
    {
      "step": "shape-website の数が動く",
      "duration": 1.5,
      "focus": ["会社案内"],
      "tween": { "v": [1200, 8600] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeStorefront = `title: "shape: storefront (実店舗、 awning + door + windows)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 240

actors:
  - コンビニ: { kind: shape-storefront, lane: l, stack: 0, eyebrow: "店舗", subtitle: "来店 {v} 人/日" }

animation:
  - step: "shape-storefront" 1.5s
    focus: ["コンビニ"]
    badge: "shape"
    description: "赤と白の日よけ、営業中の札、扉、窓。 実際の店や小売を表す。"
  - step: "shape-storefront の数が動く" 1.5s
    focus: ["コンビニ"]
    tween:
      v: 240 -> 810
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeStorefront = `{
  "title": "shape: storefront (実店舗、 awning + door + windows)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "コンビニ",
      "kind": "shape-storefront",
      "lane": "l",
      "stack": 0,
      "eyebrow": "店舗",
      "subtitle": "来店 {v} 人/日"
    }
  ],
  "flow": [],
  "states": { "v": 240 },
  "animation": [
    {
      "step": "shape-storefront",
      "duration": 1.5,
      "focus": ["コンビニ"],
      "badge": "shape",
      "body": "赤と白の日よけ、営業中の札、扉、窓。 実際の店や小売を表す。"
    },
    {
      "step": "shape-storefront の数が動く",
      "duration": 1.5,
      "focus": ["コンビニ"],
      "tween": { "v": [240, 810] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeWarehouse = `title: "shape: warehouse (倉庫、 roof + shutter + boxes)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 12

actors:
  - 市川倉庫: { kind: shape-warehouse, lane: l, stack: 0, eyebrow: "物流拠点", subtitle: "在庫 {v} 千点" }

animation:
  - step: "shape-warehouse" 1.5s
    focus: ["市川倉庫"]
    badge: "shape"
    description: "屋根と巻き上げの扉、積んだ箱。 出荷を受け持つ拠点や倉庫を表す。"
  - step: "shape-warehouse の数が動く" 1.5s
    focus: ["市川倉庫"]
    tween:
      v: 12 -> 48
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeWarehouse = `{
  "title": "shape: warehouse (倉庫、 roof + shutter + boxes)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "市川倉庫",
      "kind": "shape-warehouse",
      "lane": "l",
      "stack": 0,
      "eyebrow": "物流拠点",
      "subtitle": "在庫 {v} 千点"
    }
  ],
  "flow": [],
  "states": { "v": 12 },
  "animation": [
    {
      "step": "shape-warehouse",
      "duration": 1.5,
      "focus": ["市川倉庫"],
      "badge": "shape",
      "body": "屋根と巻き上げの扉、積んだ箱。 出荷を受け持つ拠点や倉庫を表す。"
    },
    {
      "step": "shape-warehouse の数が動く",
      "duration": 1.5,
      "focus": ["市川倉庫"],
      "tween": { "v": [12, 48] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeOnlineShop = `title: "shape: online-shop (browser + cart badge + product grid)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 6

actors:
  - Amazon: { kind: shape-online-shop, lane: l, stack: 0, eyebrow: "通販", subtitle: "注文 {v} 件/分" }

animation:
  - step: "shape-online-shop" 1.5s
    focus: ["Amazon"]
    badge: "shape"
    description: "閲覧ソフトの枠と、かごの数 (3)、6 つの商品の並び。 通販やネットの販売を表す。"
  - step: "shape-online-shop の数が動く" 1.5s
    focus: ["Amazon"]
    tween:
      v: 6 -> 74
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeOnlineShop = `{
  "title": "shape: online-shop (browser + cart badge + product grid)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "Amazon",
      "kind": "shape-online-shop",
      "lane": "l",
      "stack": 0,
      "eyebrow": "通販",
      "subtitle": "注文 {v} 件/分"
    }
  ],
  "flow": [],
  "states": { "v": 6 },
  "animation": [
    {
      "step": "shape-online-shop",
      "duration": 1.5,
      "focus": ["Amazon"],
      "badge": "shape",
      "body": "閲覧ソフトの枠と、かごの数 (3)、6 つの商品の並び。 通販やネットの販売を表す。"
    },
    {
      "step": "shape-online-shop の数が動く",
      "duration": 1.5,
      "focus": ["Amazon"],
      "tween": { "v": [6, 74] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeCdnEdge = `title: "shape: cdn-edge (地球儀 + 5 edge nodes + arc)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 300

actors:
  - Cloudflare: { kind: shape-cdn-edge, lane: l, stack: 0, eyebrow: "配信網", subtitle: "拠点 {v} か所" }

animation:
  - step: "shape-cdn-edge" 1.5s
    focus: ["Cloudflare"]
    badge: "shape"
    description: "地球儀と 5 つの拠点、点線のつながり。 配信網の事業者や、利用者の近くで返す網を表す。"
  - step: "shape-cdn-edge の数が動く" 1.5s
    focus: ["Cloudflare"]
    tween:
      v: 300 -> 380
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeCdnEdge = `{
  "title": "shape: cdn-edge (地球儀 + 5 edge nodes + arc)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "Cloudflare",
      "kind": "shape-cdn-edge",
      "lane": "l",
      "stack": 0,
      "eyebrow": "配信網",
      "subtitle": "拠点 {v} か所"
    }
  ],
  "flow": [],
  "states": { "v": 300 },
  "animation": [
    {
      "step": "shape-cdn-edge",
      "duration": 1.5,
      "focus": ["Cloudflare"],
      "badge": "shape",
      "body": "地球儀と 5 つの拠点、点線のつながり。 配信網の事業者や、利用者の近くで返す網を表す。"
    },
    {
      "step": "shape-cdn-edge の数が動く",
      "duration": 1.5,
      "focus": ["Cloudflare"],
      "tween": { "v": [300, 380] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeApiGateway = `title: "shape: api-gateway (門柱 + arch + traffic arrow)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 400

actors:
  - Kong: { kind: shape-api-gateway, lane: l, stack: 0, eyebrow: "API の入口", subtitle: "毎秒 {v} 件" }

animation:
  - step: "shape-api-gateway" 1.5s
    focus: ["Kong"]
    badge: "shape"
    description: "2 本の柱と弧、API の字、行き交う矢印。 API の入口に立つ門番を表す。"
  - step: "shape-api-gateway の数が動く" 1.5s
    focus: ["Kong"]
    tween:
      v: 400 -> 3200
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeApiGateway = `{
  "title": "shape: api-gateway (門柱 + arch + traffic arrow)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "Kong",
      "kind": "shape-api-gateway",
      "lane": "l",
      "stack": 0,
      "eyebrow": "API の入口",
      "subtitle": "毎秒 {v} 件"
    }
  ],
  "flow": [],
  "states": { "v": 400 },
  "animation": [
    {
      "step": "shape-api-gateway",
      "duration": 1.5,
      "focus": ["Kong"],
      "badge": "shape",
      "body": "2 本の柱と弧、API の字、行き交う矢印。 API の入口に立つ門番を表す。"
    },
    {
      "step": "shape-api-gateway の数が動く",
      "duration": 1.5,
      "focus": ["Kong"],
      "tween": { "v": [400, 3200] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeAuditor = `title: "shape: auditor (監査人 + magnifier + check)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 2

actors:
  - 監査法人: { kind: shape-auditor, lane: l, stack: 0, eyebrow: "監査", subtitle: "指摘 {v} 件" }

animation:
  - step: "shape-auditor" 1.5s
    focus: ["監査法人"]
    badge: "shape"
    description: "人とネクタイ、虫眼鏡、確認の印。 監査人や公認会計士、内部の監査を表す。"
  - step: "shape-auditor の数が動く" 1.5s
    focus: ["監査法人"]
    tween:
      v: 2 -> 17
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeAuditor = `{
  "title": "shape: auditor (監査人 + magnifier + check)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "監査法人",
      "kind": "shape-auditor",
      "lane": "l",
      "stack": 0,
      "eyebrow": "監査",
      "subtitle": "指摘 {v} 件"
    }
  ],
  "flow": [],
  "states": { "v": 2 },
  "animation": [
    {
      "step": "shape-auditor",
      "duration": 1.5,
      "focus": ["監査法人"],
      "badge": "shape",
      "body": "人とネクタイ、虫眼鏡、確認の印。 監査人や公認会計士、内部の監査を表す。"
    },
    {
      "step": "shape-auditor の数が動く",
      "duration": 1.5,
      "focus": ["監査法人"],
      "tween": { "v": [2, 17] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeRegulator = `title: "shape: regulator (規制当局 + 冠 crown + 章 badge)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 4

actors:
  - 金融庁: { kind: shape-regulator, lane: l, stack: 0, eyebrow: "規制当局", subtitle: "検査 {v} 件" }

animation:
  - step: "shape-regulator" 1.5s
    focus: ["金融庁"]
    badge: "shape"
    description: "人と冠、五芒星の記章。 金融庁や消費者庁のような規制の当局を表す。"
  - step: "shape-regulator の数が動く" 1.5s
    focus: ["金融庁"]
    tween:
      v: 4 -> 23
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeRegulator = `{
  "title": "shape: regulator (規制当局 + 冠 crown + 章 badge)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "金融庁",
      "kind": "shape-regulator",
      "lane": "l",
      "stack": 0,
      "eyebrow": "規制当局",
      "subtitle": "検査 {v} 件"
    }
  ],
  "flow": [],
  "states": { "v": 4 },
  "animation": [
    {
      "step": "shape-regulator",
      "duration": 1.5,
      "focus": ["金融庁"],
      "badge": "shape",
      "body": "人と冠、五芒星の記章。 金融庁や消費者庁のような規制の当局を表す。"
    },
    {
      "step": "shape-regulator の数が動く",
      "duration": 1.5,
      "focus": ["金融庁"],
      "tween": { "v": [4, 23] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeNotary = `title: "shape: notary (公証人 + 儒学者風 hat + seal 印)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 6

actors:
  - 公証役場: { kind: shape-notary, lane: l, stack: 0, eyebrow: "公証", subtitle: "認証 {v} 件" }

animation:
  - step: "shape-notary" 1.5s
    focus: ["公証役場"]
    badge: "shape"
    description: "人と儒学者風の帽子、赤い印。 公証人や、書類が正しいと認める業務を表す。"
  - step: "shape-notary の数が動く" 1.5s
    focus: ["公証役場"]
    tween:
      v: 6 -> 31
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeNotary = `{
  "title": "shape: notary (公証人 + 儒学者風 hat + seal 印)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "公証役場",
      "kind": "shape-notary",
      "lane": "l",
      "stack": 0,
      "eyebrow": "公証",
      "subtitle": "認証 {v} 件"
    }
  ],
  "flow": [],
  "states": { "v": 6 },
  "animation": [
    {
      "step": "shape-notary",
      "duration": 1.5,
      "focus": ["公証役場"],
      "badge": "shape",
      "body": "人と儒学者風の帽子、赤い印。 公証人や、書類が正しいと認める業務を表す。"
    },
    {
      "step": "shape-notary の数が動く",
      "duration": 1.5,
      "focus": ["公証役場"],
      "tween": { "v": [6, 31] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeLawyer = `title: "shape: lawyer (弁護士 + wig + 天秤)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 3

actors:
  - 顧問弁護士: { kind: shape-lawyer, lane: l, stack: 0, eyebrow: "法務", subtitle: "案件 {v} 件" }

animation:
  - step: "shape-lawyer" 1.5s
    focus: ["顧問弁護士"]
    badge: "shape"
    description: "人と髪、正義の天秤の印。 弁護士や法務の顧問、法律事務所を表す。"
  - step: "shape-lawyer の数が動く" 1.5s
    focus: ["顧問弁護士"]
    tween:
      v: 3 -> 19
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeLawyer = `{
  "title": "shape: lawyer (弁護士 + wig + 天秤)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "顧問弁護士",
      "kind": "shape-lawyer",
      "lane": "l",
      "stack": 0,
      "eyebrow": "法務",
      "subtitle": "案件 {v} 件"
    }
  ],
  "flow": [],
  "states": { "v": 3 },
  "animation": [
    {
      "step": "shape-lawyer",
      "duration": 1.5,
      "focus": ["顧問弁護士"],
      "badge": "shape",
      "body": "人と髪、正義の天秤の印。 弁護士や法務の顧問、法律事務所を表す。"
    },
    {
      "step": "shape-lawyer の数が動く",
      "duration": 1.5,
      "focus": ["顧問弁護士"],
      "tween": { "v": [3, 19] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeTrader = `title: "shape: trader (トレーダー + headset + laptop chart)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 8

actors:
  - デイトレーダー: { kind: shape-trader, lane: l, stack: 0, eyebrow: "売買", subtitle: "約定 {v} 回" }

animation:
  - step: "shape-trader" 1.5s
    focus: ["デイトレーダー"]
    badge: "shape"
    description: "人とヘッドセット、値動きの映るパソコン。 トレーダーや、値付けを受け持つ業者、機械の自動発注を表す。"
  - step: "shape-trader の数が動く" 1.5s
    focus: ["デイトレーダー"]
    tween:
      v: 8 -> 152
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeTrader = `{
  "title": "shape: trader (トレーダー + headset + laptop chart)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "デイトレーダー",
      "kind": "shape-trader",
      "lane": "l",
      "stack": 0,
      "eyebrow": "売買",
      "subtitle": "約定 {v} 回"
    }
  ],
  "flow": [],
  "states": { "v": 8 },
  "animation": [
    {
      "step": "shape-trader",
      "duration": 1.5,
      "focus": ["デイトレーダー"],
      "badge": "shape",
      "body": "人とヘッドセット、値動きの映るパソコン。 トレーダーや、値付けを受け持つ業者、機械の自動発注を表す。"
    },
    {
      "step": "shape-trader の数が動く",
      "duration": 1.5,
      "focus": ["デイトレーダー"],
      "tween": { "v": [8, 152] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeCustomerService = `title: "shape: customer-service (CS + headset + bubble)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 14

actors:
  - サポート担当: { kind: shape-customer-service, lane: l, stack: 0, eyebrow: "問い合わせ", subtitle: "対応 {v} 件" }

animation:
  - step: "shape-customer-service" 1.5s
    focus: ["サポート担当"]
    badge: "shape"
    description: "人とヘッドセット、吹き出し、名札。 お客様の窓口やコールセンターを表す。"
  - step: "shape-customer-service の数が動く" 1.5s
    focus: ["サポート担当"]
    tween:
      v: 14 -> 88
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeCustomerService = `{
  "title": "shape: customer-service (CS + headset + bubble)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "サポート担当",
      "kind": "shape-customer-service",
      "lane": "l",
      "stack": 0,
      "eyebrow": "問い合わせ",
      "subtitle": "対応 {v} 件"
    }
  ],
  "flow": [],
  "states": { "v": 14 },
  "animation": [
    {
      "step": "shape-customer-service",
      "duration": 1.5,
      "focus": ["サポート担当"],
      "badge": "shape",
      "body": "人とヘッドセット、吹き出し、名札。 お客様の窓口やコールセンターを表す。"
    },
    {
      "step": "shape-customer-service の数が動く",
      "duration": 1.5,
      "focus": ["サポート担当"],
      "tween": { "v": [14, 88] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeBlockchain = `title: "shape: blockchain (5 block linked chain)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 5

actors:
  - ブロックチェーン: { kind: shape-blockchain, lane: l, stack: 0, eyebrow: "台帳", subtitle: "{v} ブロック" }

animation:
  - step: "shape-blockchain" 1.5s
    focus: ["ブロックチェーン"]
    badge: "shape"
    description: "5 つのブロックを、前の要約値を指す形で横につなぐ。 分散台帳の一般の形を表す。"
  - step: "shape-blockchain の数が動く" 1.5s
    focus: ["ブロックチェーン"]
    tween:
      v: 5 -> 42
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeBlockchain = `{
  "title": "shape: blockchain (5 block linked chain)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "ブロックチェーン",
      "kind": "shape-blockchain",
      "lane": "l",
      "stack": 0,
      "eyebrow": "台帳",
      "subtitle": "{v} ブロック"
    }
  ],
  "flow": [],
  "states": { "v": 5 },
  "animation": [
    {
      "step": "shape-blockchain",
      "duration": 1.5,
      "focus": ["ブロックチェーン"],
      "badge": "shape",
      "body": "5 つのブロックを、前の要約値を指す形で横につなぐ。 分散台帳の一般の形を表す。"
    },
    {
      "step": "shape-blockchain の数が動く",
      "duration": 1.5,
      "focus": ["ブロックチェーン"],
      "tween": { "v": [5, 42] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeBitcoinChain = `title: "shape: bitcoin-chain (₿ + PoW + 橙色)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 84

actors:
  - Bitcoin: { kind: shape-bitcoin-chain, lane: l, stack: 0, eyebrow: "分散台帳", subtitle: "ブロック高 {v} 万" }

animation:
  - step: "shape-bitcoin-chain" 1.5s
    focus: ["Bitcoin"]
    badge: "shape"
    description: "橙の色と ₿ の記号、計算の量で合意する採掘。 Bitcoin の本番の網や、試しの網を表す。"
  - step: "shape-bitcoin-chain の数が動く" 1.5s
    focus: ["Bitcoin"]
    tween:
      v: 84 -> 89
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeBitcoinChain = `{
  "title": "shape: bitcoin-chain (₿ + PoW + 橙色)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "Bitcoin",
      "kind": "shape-bitcoin-chain",
      "lane": "l",
      "stack": 0,
      "eyebrow": "分散台帳",
      "subtitle": "ブロック高 {v} 万"
    }
  ],
  "flow": [],
  "states": { "v": 84 },
  "animation": [
    {
      "step": "shape-bitcoin-chain",
      "duration": 1.5,
      "focus": ["Bitcoin"],
      "badge": "shape",
      "body": "橙の色と ₿ の記号、計算の量で合意する採掘。 Bitcoin の本番の網や、試しの網を表す。"
    },
    {
      "step": "shape-bitcoin-chain の数が動く",
      "duration": 1.5,
      "focus": ["Bitcoin"],
      "tween": { "v": [84, 89] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeEthereumChain = `title: "shape: ethereum-chain (Ξ + PoS + 紫色)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 2000

actors:
  - Ethereum: { kind: shape-ethereum-chain, lane: l, stack: 0, eyebrow: "分散台帳", subtitle: "{v} 万ブロック" }

animation:
  - step: "shape-ethereum-chain" 1.5s
    focus: ["Ethereum"]
    badge: "shape"
    description: "紫の色と Ξ の記号、預けた量で合意する検証役。 Ethereum の本番の網や、その上に重ねた網を表す。"
  - step: "shape-ethereum-chain の数が動く" 1.5s
    focus: ["Ethereum"]
    tween:
      v: 2000 -> 2400
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeEthereumChain = `{
  "title": "shape: ethereum-chain (Ξ + PoS + 紫色)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "Ethereum",
      "kind": "shape-ethereum-chain",
      "lane": "l",
      "stack": 0,
      "eyebrow": "分散台帳",
      "subtitle": "{v} 万ブロック"
    }
  ],
  "flow": [],
  "states": { "v": 2000 },
  "animation": [
    {
      "step": "shape-ethereum-chain",
      "duration": 1.5,
      "focus": ["Ethereum"],
      "badge": "shape",
      "body": "紫の色と Ξ の記号、預けた量で合意する検証役。 Ethereum の本番の網や、その上に重ねた網を表す。"
    },
    {
      "step": "shape-ethereum-chain の数が動く",
      "duration": 1.5,
      "focus": ["Ethereum"],
      "tween": { "v": [2000, 2400] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeBlockchainNode = `title: "shape: blockchain-node (P2P hex + 6 peers)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 8

actors:
  - フルノード: { kind: shape-blockchain-node, lane: l, stack: 0, eyebrow: "参加者", subtitle: "直接つながる相手 {v} 台" }

animation:
  - step: "shape-blockchain-node" 1.5s
    focus: ["フルノード"]
    badge: "shape"
    description: "中央の六角形と周りの 6 つの六角形、積んだブロックの印。 分散台帳の参加者 (全記録を持つもの、過去の状態まで持つもの、最小限だけ持つもの) を表す。"
  - step: "shape-blockchain-node の数が動く" 1.5s
    focus: ["フルノード"]
    tween:
      v: 8 -> 64
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeBlockchainNode = `{
  "title": "shape: blockchain-node (P2P hex + 6 peers)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "フルノード",
      "kind": "shape-blockchain-node",
      "lane": "l",
      "stack": 0,
      "eyebrow": "参加者",
      "subtitle": "直接つながる相手 {v} 台"
    }
  ],
  "flow": [],
  "states": { "v": 8 },
  "animation": [
    {
      "step": "shape-blockchain-node",
      "duration": 1.5,
      "focus": ["フルノード"],
      "badge": "shape",
      "body": "中央の六角形と周りの 6 つの六角形、積んだブロックの印。 分散台帳の参加者 (全記録を持つもの、過去の状態まで持つもの、最小限だけ持つもの) を表す。"
    },
    {
      "step": "shape-blockchain-node の数が動く",
      "duration": 1.5,
      "focus": ["フルノード"],
      "tween": { "v": [8, 64] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeCreditCard = `title: "shape: credit-card (chip + magstripe + brand mark)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 3

actors:
  - クレカ: { kind: shape-credit-card, lane: l, stack: 0, eyebrow: "カード", subtitle: "利用額 {v} 万円" }

animation:
  - step: "shape-credit-card" 1.5s
    focus: ["クレカ"]
    badge: "shape"
    description: "金色の端子と非接触の波、番号、名義、有効期限、ブランドの印。 実物のクレジットカードを表す。"
  - step: "shape-credit-card の数が動く" 1.5s
    focus: ["クレカ"]
    tween:
      v: 3 -> 18
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeCreditCard = `{
  "title": "shape: credit-card (chip + magstripe + brand mark)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "クレカ",
      "kind": "shape-credit-card",
      "lane": "l",
      "stack": 0,
      "eyebrow": "カード",
      "subtitle": "利用額 {v} 万円"
    }
  ],
  "flow": [],
  "states": { "v": 3 },
  "animation": [
    {
      "step": "shape-credit-card",
      "duration": 1.5,
      "focus": ["クレカ"],
      "badge": "shape",
      "body": "金色の端子と非接触の波、番号、名義、有効期限、ブランドの印。 実物のクレジットカードを表す。"
    },
    {
      "step": "shape-credit-card の数が動く",
      "duration": 1.5,
      "focus": ["クレカ"],
      "tween": { "v": [3, 18] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;
