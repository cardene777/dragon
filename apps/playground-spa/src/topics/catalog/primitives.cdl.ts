import { diagram } from "@cardenelabs/cdl";
import type { NodeKind, PhaseBuilder } from "@cardenelabs/cdl";
import { textDslToDiagram } from "@cardenelabs/dragon";

/**
 * Catalog - Primitives ... lane / node の基本パーツ。
 * 全 card で lane width 440 統一 = SVG viewBox 同サイズ = catalog grid 整列。
 */

const W = 440;

/**
 * 1. 基本の NodeKind (actor / function / storage / event / card)。
 * 受け付ける種類の一覧は `@cardenelabs/dragon` の `NODE_KIND_VALID` が持つ。
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
    description: "縦列の見出しの下に線は無い。 段がずれて並ぶと、箱がどの縦列に属するかは箱の位置だけで読む。"
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
      "description": "縦列の見出しの下に線は無い。 段がずれて並ぶと、箱がどの縦列に属するかは箱の位置だけで読む。"
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
    description: "縦列の中心を縦の点線が通る。 段がずれて並んでも、箱がどの縦列に属するかを線で上から下まで追える。"
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
      "description": "縦列の中心を縦の点線が通る。 段がずれて並んでも、箱がどの縦列に属するかを線で上から下まで追える。"
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
    description: "縦列の間も箱の間も名札の余白も書かず、描く側が決めた間隔で並べる。"
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
      "description": "縦列の間も箱の間も名札の余白も書かず、描く側が決めた間隔で並べる。"
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
    description: "受付と処理の縦列の間が 400 に広がり、横に結ぶ 2 本の矢印が長くなる。 同じ縦列の箱の間は変わらない。"
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
      "description": "受付と処理の縦列の間が 400 に広がり、横に結ぶ 2 本の矢印が長くなる。 同じ縦列の箱の間は変わらない。"
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
    description: "同じ縦列で上下に並ぶ注文と問い合わせ、発送と回答の間が広がる。 縦列の間は変わらない。"
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
      "description": "同じ縦列で上下に並ぶ注文と問い合わせ、発送と回答の間が広がる。 縦列の間は変わらない。"
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
    description: "依頼と転送の名札が、矢印から離れて上に置かれる。 箱と縦列の位置は変わらない。"
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
      "description": "依頼と転送の名札が、矢印から離れて上に置かれる。 箱と縦列の位置は変わらない。"
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
    description: "縦列の間と箱の間と名札の余白を書かない時に、この 1 つの値が 3 つの代わりに使われ、全てが広がる。"
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
      "description": "縦列の間と箱の間と名札の余白を書かない時に、この 1 つの値が 3 つの代わりに使われ、全てが広がる。"
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
    description: "縦列ごとに書いた幅 240 より、図全体に書いた 520 が勝つ。 箱は広がった縦列の中央に置かれる。"
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
      "description": "縦列ごとに書いた幅 240 より、図全体に書いた 520 が勝つ。 箱は広がった縦列の中央に置かれる。"
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
    description: "図を描く広さが横 1400、縦 800 になる。 箱の置き方は変わらず、右と下に余白が残る。"
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
      "description": "図を描く広さが横 1400、縦 800 になる。 箱の置き方は変わらず、右と下に余白が残る。"
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
    description: "箱と字と線を 1.5 倍の大きさで描く。 置き方は書かない図と同じで、描く大きさだけが変わる。"
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
      "description": "箱と字と線を 1.5 倍の大きさで描く。 置き方は書かない図と同じで、描く大きさだけが変わる。"
    }
  ]
}`;

export const pattern__viewportSpacing__倍率 = textDslToDiagram(sourceYaml__pattern__viewportSpacing__倍率);

// ==== #1969 縦列の縦線と図全体の間隔 ここまで ====

// ==== #1969 並ぶ向きと始まりと終わり ここから ====
// ---- フローの並ぶ向き (direction) ----
//
// 向きはフローと担当の図だけに効く。 箱に縦列を書くと縦列が勝つので、縦列を書かない 2 つの箱で比べる。

export const patternBase__flowDirection = "書かない";

export const subtitle__flowDirection =
  "フローの並ぶ向きを書く (direction)。 縦は 1 つの縦列に積み、横は 1 人ずつ縦列を作る。 向きを書くと矢印は書いた端のとおりに引く";

export const sourceYaml__flowDirection = `title: "フローの並ぶ向きを書かない"
type: flow

actors:
  - 申し込む: { kind: card }
  - 登録する: { kind: card }

flow:
  - 申し込む -> 登録する: "申込書"

animation:
  - step: "書かない時の並び" 1.8s
    focus: ["申し込む", "登録する"]
    description: "動きを持つフローは向きを書かないと、1 人ずつ縦列を作って左から並べる。"
`;

export const sourceJson__flowDirection = `{
  "title": "フローの並ぶ向きを書かない",
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
      "description": "動きを持つフローは向きを書かないと、1 人ずつ縦列を作って左から並べる。"
    }
  ]
}`;

export const flowDirection = textDslToDiagram(sourceYaml__flowDirection);

export const sourceYaml__pattern__flowDirection__縦に積む = `title: "フローを縦に積む"
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
    description: "縦に積むと書くと、1 つの縦列に上から積む。 動きを持つフローの既定は横なので、向きの行を外すと横並びに戻る。"
`;

export const sourceJson__pattern__flowDirection__縦に積む = `{
  "title": "フローを縦に積む",
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
      "description": "縦に積むと書くと、1 つの縦列に上から積む。 動きを持つフローの既定は横なので、向きの行を外すと横並びに戻る。"
    }
  ]
}`;

export const pattern__flowDirection__縦に積む = textDslToDiagram(sourceYaml__pattern__flowDirection__縦に積む);

export const sourceYaml__pattern__flowDirection__横に並べる = `title: "フローを横に並べる"
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
    description: "横に並べると、1 人ずつ縦列を作って左から並べる。 動きを持つフローの既定と同じなので、記法は向きの行を外せることを知らせる。"
`;

export const sourceJson__pattern__flowDirection__横に並べる = `{
  "title": "フローを横に並べる",
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
      "description": "横に並べると、1 人ずつ縦列を作って左から並べる。 動きを持つフローの既定と同じなので、記法は向きの行を外せることを知らせる。"
    }
  ]
}`;

export const pattern__flowDirection__横に並べる = textDslToDiagram(sourceYaml__pattern__flowDirection__横に並べる);

// 向きを書かないフローは登場人物を書いた順に鎖で繋ぎ、`登録する -> 申し込む` の差し戻しは引かない
// (端の知らせが出る)。 向きを書くと行に書いた端のとおりに矢印を引く (#1986)
//
// **この切替だけ段を書かない**。 段を書いたフローは向きを書かなくても書いた端のとおりに引くため、
// 段を残すと向きの行を消しても絵が変わらず、見比べる意味が無くなる (実測 = 段を書いた本文から
// 向きを外しても矢印は 2 本のまま、段と向きの両方を外すと 1 本になり知らせが出た)
export const sourceYaml__pattern__flowDirection__書いた端のとおりに繋ぐ = `title: "フローの矢印を書いた端のとおりに繋ぐ"
type: flow
direction: vertical

actors:
  - 申し込む: { kind: card }
  - 登録する: { kind: card }

flow:
  - 申し込む -> 登録する: "申込書"
  - 登録する -> 申し込む: "差し戻し"
`;

export const sourceJson__pattern__flowDirection__書いた端のとおりに繋ぐ = `{
  "title": "フローの矢印を書いた端のとおりに繋ぐ",
  "type": "flow",
  "direction": "vertical",
  "actors": [
    { "name": "申し込む", "kind": "card" },
    { "name": "登録する", "kind": "card" }
  ],
  "flow": [
    { "from": "申し込む", "to": "登録する", "label": "申込書" },
    { "from": "登録する", "to": "申し込む", "label": "差し戻し" }
  ]
}`;

export const pattern__flowDirection__書いた端のとおりに繋ぐ = textDslToDiagram(
  sourceYaml__pattern__flowDirection__書いた端のとおりに繋ぐ,
);

// ---- 順序図の箱の並べ替え (order) ----
//
// 並べ替えは順序図だけに効く。 書かない図は登場人物を書いた順に左から置き、書くと種類の順
// (人 → 契約 → 保管 → 出来事) に置き直す。 見比べるために、書いた順と種類の順が食い違う並びにする。
//
// **書かない側は箱に種類を書かない**。 順序図の板は種類を描かないので、並べ替えを書かずに
// 種類だけ書くと「書いた種類は効きません」 の知らせが出る。 並べ替えを書いた側でだけ種類が
// 意味を持つ = 種類は並べ替えの読む材料で、書かない側に置くと効かない指定になる。

export const patternBase__boxOrder = "書かない";

export const subtitle__boxOrder =
  "順序図の箱を種類の順に並べ替える (order)。 書かない図は書いた順のまま左から置く";

export const sourceYaml__boxOrder = `title: "順序図の箱を書いた順に置く"
type: sequence

actors:
  - 金庫
  - 利用者
  - 履歴

flow:
  - 利用者 -> 金庫: "預ける"
  - 金庫 -> 履歴: "残す"

animation:
  - step: "預ける" 1.6s
    focus: [利用者, 金庫, "利用者 -> 金庫"]
    description: "並べ替えを書かないので、箱は記法に書いた順のまま左から 金庫 / 利用者 / 履歴 と並ぶ。"
  - step: "残す" 1.6s
    focus: [金庫, 履歴, "金庫 -> 履歴"]
    description: "言づては書いた順に進む。 並びが書いた順のままなので、1 通目は右から左へ戻る形になる。"
`;

export const sourceJson__boxOrder = `{
  "title": "順序図の箱を書いた順に置く",
  "type": "sequence",
  "actors": [
    { "name": "金庫" },
    { "name": "利用者" },
    { "name": "履歴" }
  ],
  "flow": [
    { "from": "利用者", "to": "金庫", "label": "預ける" },
    { "from": "金庫", "to": "履歴", "label": "残す" }
  ],
  "animation": [
    {
      "step": "預ける",
      "duration": 1.6,
      "focus": ["利用者", "金庫", "利用者 -> 金庫"],
      "description": "並べ替えを書かないので、箱は記法に書いた順のまま左から 金庫 / 利用者 / 履歴 と並ぶ。"
    },
    {
      "step": "残す",
      "duration": 1.6,
      "focus": ["金庫", "履歴", "金庫 -> 履歴"],
      "description": "言づては書いた順に進む。 並びが書いた順のままなので、1 通目は右から左へ戻る形になる。"
    }
  ]
}`;

export const boxOrder = textDslToDiagram(sourceYaml__boxOrder);

export const sourceYaml__pattern__boxOrder__種類の順に置く = `title: "順序図の箱を種類の順に置く"
type: sequence
order: 種類

actors:
  - 金庫: { kind: storage }
  - 利用者: { kind: actor }
  - 履歴: { kind: event }

flow:
  - 利用者 -> 金庫: "預ける"
  - 金庫 -> 履歴: "残す"

animation:
  - step: "預ける" 1.6s
    focus: [利用者, 金庫, "利用者 -> 金庫"]
    description: "並べ替えを書くと、書いた順 (金庫 / 利用者 / 履歴) ではなく種類の順に 利用者 / 金庫 / 履歴 と並ぶ。"
  - step: "残す" 1.6s
    focus: [金庫, 履歴, "金庫 -> 履歴"]
    description: "人が左端に来るので、言づては左から右へ順に進む。 並べ替えが読むのは箱に書いた kind だけ。"
`;

export const sourceJson__pattern__boxOrder__種類の順に置く = `{
  "title": "順序図の箱を種類の順に置く",
  "type": "sequence",
  "order": "kind",
  "actors": [
    { "name": "金庫", "kind": "storage" },
    { "name": "利用者", "kind": "actor" },
    { "name": "履歴", "kind": "event" }
  ],
  "flow": [
    { "from": "利用者", "to": "金庫", "label": "預ける" },
    { "from": "金庫", "to": "履歴", "label": "残す" }
  ],
  "animation": [
    {
      "step": "預ける",
      "duration": 1.6,
      "focus": ["利用者", "金庫", "利用者 -> 金庫"],
      "description": "並べ替えを書くと、書いた順 (金庫 / 利用者 / 履歴) ではなく種類の順に 利用者 / 金庫 / 履歴 と並ぶ。"
    },
    {
      "step": "残す",
      "duration": 1.6,
      "focus": ["金庫", "履歴", "金庫 -> 履歴"],
      "description": "人が左端に来るので、言づては左から右へ順に進む。 並べ替えが読むのは箱に書いた kind だけ。"
    }
  ]
}`;

export const pattern__boxOrder__種類の順に置く = textDslToDiagram(
  sourceYaml__pattern__boxOrder__種類の順に置く,
);

// ---- 始まりと終わり (initial / final) ----
//
// 書かない図には札が付かない。 書くと書いた箱だけに札が付き、終わりを 2 つ持てる (#2782)。

export const patternBase__stateStartEnd = "書かない";

export const subtitle__stateStartEnd =
  "行を持つ図の始まりと終わりを箱に書く (initial / final)。 書かない図には札が付かない";

export const sourceYaml__stateStartEnd = `title: "始まりと終わりを書かない"
type: record

actors:
  - 受付: { kind: card, posW: 240 }
  - 完了: { kind: card, posW: 240 }
  - 取り下げ: { kind: card, posW: 240 }

flow:
  - 受付 -> 完了: "承認" { head: open }
  - 受付 -> 取り下げ: "撤回" { head: open }

animation:
  - step: "札の付かない形" 1.8s
    focus: ["受付", "完了", "取り下げ"]
    description: "始まりも終わりも書かない図には札が付かない。 並びから推し量らない。"
`;

export const sourceJson__stateStartEnd = `{
  "title": "始まりと終わりを書かない",
  "type": "record",
  "actors": [
    { "name": "受付", "kind": "card", "posW": 240 },
    { "name": "完了", "kind": "card", "posW": 240 },
    { "name": "取り下げ", "kind": "card", "posW": 240 }
  ],
  "flow": [
    { "from": "受付", "to": "完了", "label": "承認", "head": "open" },
    { "from": "受付", "to": "取り下げ", "label": "撤回", "head": "open" }
  ],
  "animation": [
    {
      "step": "札の付かない形",
      "duration": 1.8,
      "focus": ["受付", "完了", "取り下げ"],
      "description": "始まりも終わりも書かない図には札が付かない。 並びから推し量らない。"
    }
  ]
}`;

export const stateStartEnd = textDslToDiagram(sourceYaml__stateStartEnd);

export const sourceYaml__pattern__stateStartEnd__書く = `title: "始まりと終わりを書く"
type: record

actors:
  - 受付: { kind: card, posW: 240, initial: true }
  - 完了: { kind: card, posW: 240, final: true }
  - 取り下げ: { kind: card, posW: 240, final: true }

flow:
  - 受付 -> 完了: "承認" { head: open }
  - 受付 -> 取り下げ: "撤回" { head: open }

animation:
  - step: "始まりと終わりの札" 1.8s
    focus: ["受付", "完了", "取り下げ"]
    description: "始まりと書いた受付に「初期」、終わりと書いた完了と取り下げの 2 つに「最終」 の札が付く。"
`;

export const sourceJson__pattern__stateStartEnd__書く = `{
  "title": "始まりと終わりを書く",
  "type": "record",
  "actors": [
    { "name": "受付", "kind": "card", "posW": 240, "initial": true },
    { "name": "完了", "kind": "card", "posW": 240, "final": true },
    { "name": "取り下げ", "kind": "card", "posW": 240, "final": true }
  ],
  "flow": [
    { "from": "受付", "to": "完了", "label": "承認", "head": "open" },
    { "from": "受付", "to": "取り下げ", "label": "撤回", "head": "open" }
  ],
  "animation": [
    {
      "step": "始まりと終わりの札",
      "duration": 1.8,
      "focus": ["受付", "完了", "取り下げ"],
      "description": "始まりと書いた受付に「初期」、終わりと書いた完了と取り下げの 2 つに「最終」 の札が付く。"
    }
  ]
}`;

export const pattern__stateStartEnd__書く = textDslToDiagram(sourceYaml__pattern__stateStartEnd__書く);

// 段を分けて書く形 (#2346)。
//
// 始まりと終わりの印 (`initial` / `final`) と箱の目次 (`eyebrow`) は、
// **1 行の中括弧にしか書き方が無かった**。 段を分けて書くと綴りの誤りとして落ちるので、
// 他の項目を段で並べた本文でも この 3 つだけ中括弧に戻す必要があった。
//
// 目次は始まりと終わりの箱に書かない。 始まりと終わりの札そのものが目次の位置に出るため、
// 両方書くと後から書いた方だけが残る。 途中の箱 (審査) に書いて重ならない形にしてある。

export const sourceYaml__pattern__stateStartEnd__段を分けて書く = `title: "始まりと終わりを段を分けて書く"
type: record

actors:
  - 受付:
      kind: card
      大きさ: 240,96
      initial: true
  - 審査:
      kind: card
      大きさ: 240,96
      eyebrow: "途中"
  - 完了:
      kind: card
      大きさ: 240,96
      final: true

flow:
  - 受付 -> 審査: "提出" { head: open }
  - 審査 -> 完了: "承認" { head: open }

animation:
  - step: "段を分けて書いた札" 1.8s
    focus: ["受付", "審査", "完了"]
    description: "始まりと終わりの印も目次も、名前の下に段を分けて並べられる。 中括弧に書いた時と同じ札が付く。"
`;

export const sourceJson__pattern__stateStartEnd__段を分けて書く = `{
  "title": "始まりと終わりを段を分けて書く",
  "type": "record",
  "actors": [
    { "name": "受付", "kind": "card", "posW": 240, "posH": 96, "initial": true },
    { "name": "審査", "kind": "card", "posW": 240, "posH": 96, "eyebrow": "途中" },
    { "name": "完了", "kind": "card", "posW": 240, "posH": 96, "final": true }
  ],
  "flow": [
    { "from": "受付", "to": "審査", "label": "提出", "head": "open" },
    { "from": "審査", "to": "完了", "label": "承認", "head": "open" }
  ],
  "animation": [
    {
      "step": "段を分けて書いた札",
      "duration": 1.8,
      "focus": ["受付", "審査", "完了"],
      "description": "始まりと終わりの印も目次も、名前の下に段を分けて並べられる。 中括弧に書いた時と同じ札が付く。"
    }
  ]
}`;

export const pattern__stateStartEnd__段を分けて書く = textDslToDiagram(
  sourceYaml__pattern__stateStartEnd__段を分けて書く,
);
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
    description: "位置のずらしを書かず、縦列と段から決まった位置に箱と縦列と矢印の名前を置く。"
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
      "description": "位置のずらしを書かず、縦列と段から決まった位置に箱と縦列と矢印の名前を置く。"
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
    description: "注文するの箱だけが右へ 40、下へ 60 動き、矢印は動いた箱から出る。 縦列と他の箱は動かない。"
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
      "description": "注文するの箱だけが右へ 40、下へ 60 動き、矢印は動いた箱から出る。 縦列と他の箱は動かない。"
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
    description: "受付の窓口の縦列が右へ 120、下へ 40 動き、中の 2 つの箱も一緒に動く。 縦列の幅と高さと、利用者の縦列は変わらない。"
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
      "description": "受付の窓口の縦列が右へ 120、下へ 40 動き、中の 2 つの箱も一緒に動く。 縦列の幅と高さと、利用者の縦列は変わらない。"
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
    description: "注文の矢印の名前だけが右へ 40、上へ 24 動く。 矢印の線と箱は動かない。"
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
      "description": "注文の矢印の名前だけが右へ 40、上へ 24 動く。 矢印の線と箱は動かない。"
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
    description: "組を書かず、受付の層と処理の層と保存の層を枠で囲まずに横へ並べる。"
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
      "description": "組を書かず、受付の層と処理の層と保存の層を枠で囲まずに横へ並べる。"
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
    description: "社内の網の枠が処理の層と保存の層と中の箱を囲み、受付の層は枠の外に残る。 縦列と箱の位置は束ねない図と同じ。"
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
      "description": "社内の網の枠が処理の層と保存の層と中の箱を囲み、受付の層は枠の外に残る。 縦列と箱の位置は束ねない図と同じ。"
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
    description: "社外の枠が受付の層を、社内の網の枠が処理の層と保存の層を囲む。 依頼の矢印は 2 つの枠の間を渡る。"
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
      "description": "社外の枠が受付の層を、社内の網の枠が処理の層と保存の層を囲む。 依頼の矢印は 2 つの枠の間を渡る。"
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

/** 4. Shape-driven basement (CAR-1099) ... 要素形状自体が意味を持つ SVG path node */
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
  title: "外部のクラウド",
  eyebrow: "クラウド",
  subtitle: "{v} リージョン",
  metric: { from: 3, to: 12 },
  topic: "shape: cloud (5 円 合成、 クラウド / SaaS 表現)",
  phase: { title: "shape-cloud", body: "5 つの円を重ねた雲の形。 クラウドの事業者や、外から呼ぶ API を表す。" },
});
export const shapeCylinder = shapeSample({
  id: "shape-cylinder",
  kind: "shape-cylinder",
  title: "顧客台帳",
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

/** 4-b. Shape-driven software (CAR-1111 Phase 2-B) ... OS ウィンドウ / 端末 / コード block */
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
  title: "シェル",
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

/** 5. Shape-driven hardware (CAR-1111 Phase 2-C) ... サーバーの棚 / 携帯の端末 */
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
export const shapeMobileDevice = shapeSample({
  id: "shape-mobile-device",
  kind: "shape-mobile-device",
  title: "スマホ",
  eyebrow: "携帯端末",
  subtitle: "{v} 台が稼働",
  metric: { from: 200, to: 1800 },
  topic: "shape: mobile-device (携帯端末)",
  phase: { title: "shape-mobile-device", body: "上の話し口と画面、下のボタンを持つスマホ。 携帯のアプリや、利用者の手元の端末を表す。" },
});

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
      "description": "外から関わる主体 (利用者や外部の仕組み)。 値の欄に数を出せる。"
    },
    {
      "step": "actor の数が動く",
      "duration": 1.5,
      "focus": ["利用者"],
      "tween": { "v": [42, 137] },
      "badge": "動作中",
      "description": "値の欄が段の中で動く。 この欄を描くのは actor だけ。"
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
      "description": "処理を受け持つ関数。 題を等幅の字で書き、副題に戻り値を書いて署名に見せる。"
    },
    {
      "step": "function の数が動く",
      "duration": 1.5,
      "focus": ["注文を受ける(要求)"],
      "tween": { "v": [12, 480] },
      "badge": "動作中",
      "description": "副題の呼出回数が段の中で動く。 署名の形は変えない。"
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
      "description": "DB の表。 列を rows に 1 行ずつ書く。"
    },
    {
      "step": "storage の数が動く",
      "duration": 1.5,
      "focus": ["利用者の表"],
      "tween": { "v": [1200, 8400] },
      "badge": "動作中",
      "description": "行の数が段の中で動く。 行も同じ経路で置換される。"
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
      "description": "発行された出来事。 出来事を配る経路や記録が読む。"
    },
    {
      "step": "event の数が動く",
      "duration": 1.5,
      "focus": ["注文ができた"],
      "tween": { "v": [3, 96] },
      "badge": "動作中",
      "description": "副題の発生件数が段の中で動く。 中身の形は変えない。"
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
      "description": "kind に当てはまらない補足情報。"
    },
    {
      "step": "card の数が動く",
      "duration": 1.5,
      "focus": ["備考"],
      "tween": { "v": [2, 31] },
      "badge": "動作中",
      "description": "副題の件数が段の中で動く。 説明の文は変えない。"
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
      "description": "1 本の lane に node を縦に積む。"
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
      "description": "lane を横に並べて役割を分ける (利用者 / 処理 / 出来事)。"
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
      "description": "lane に contain を付けると、 lane ごと枠で囲んで内と外の境を示す。"
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
      "description": "同じ lane の中で、 stack の番号が縦の並びを決める。"
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
      "description": "stack を増やすと縦に伸びる。 間隔は row_gap が自動で決める。"
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
      "description": "右上の角を折り返した四角。 ファイルや文書、報告書を表す。"
    },
    {
      "step": "shape-file の数が動く",
      "duration": 1.5,
      "focus": ["月次報告書"],
      "tween": { "v": [2, 9] },
      "badge": "shape",
      "description": "副題の数が段の中で動く。 形と説明は変えない。"
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
      "description": "上の縁につまみの付いた四角。 フォルダや、部品をまとめた単位を表す。"
    },
    {
      "step": "shape-folder の数が動く",
      "duration": 1.5,
      "focus": ["設計資料/"],
      "tween": { "v": [24, 118] },
      "badge": "shape",
      "description": "副題の数が段の中で動く。 形と説明は変えない。"
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
  - 外部のクラウド: { kind: shape-cloud, lane: l, stack: 0, eyebrow: "クラウド", subtitle: "{v} リージョン" }

animation:
  - step: "shape-cloud" 1.5s
    focus: ["外部のクラウド"]
    badge: "shape"
    description: "5 つの円を重ねた雲の形。 クラウドの事業者や、外から呼ぶ API を表す。"
  - step: "shape-cloud の数が動く" 1.5s
    focus: ["外部のクラウド"]
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
      "name": "外部のクラウド",
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
      "focus": ["外部のクラウド"],
      "badge": "shape",
      "description": "5 つの円を重ねた雲の形。 クラウドの事業者や、外から呼ぶ API を表す。"
    },
    {
      "step": "shape-cloud の数が動く",
      "duration": 1.5,
      "focus": ["外部のクラウド"],
      "tween": { "v": [3, 12] },
      "badge": "shape",
      "description": "副題の数が段の中で動く。 形と説明は変えない。"
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
  - 顧客台帳: { kind: shape-cylinder, lane: l, stack: 0, eyebrow: "データベース", subtitle: "{v} GB 使用", posW: 272 }

animation:
  - step: "shape-cylinder" 1.5s
    focus: ["顧客台帳"]
    badge: "shape"
    description: "円柱 (上面と側面と底の楕円)。 DB や、消えずに残る保存先を表す。"
  - step: "shape-cylinder の数が動く" 1.5s
    focus: ["顧客台帳"]
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
      "name": "顧客台帳",
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
      "focus": ["顧客台帳"],
      "badge": "shape",
      "description": "円柱 (上面と側面と底の楕円)。 DB や、消えずに残る保存先を表す。"
    },
    {
      "step": "shape-cylinder の数が動く",
      "duration": 1.5,
      "focus": ["顧客台帳"],
      "tween": { "v": [120, 480] },
      "badge": "shape",
      "description": "副題の数が段の中で動く。 形と説明は変えない。"
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
      "description": "六角形。 小さく分けた役務や、業務ごとの部品を表す。"
    },
    {
      "step": "shape-hexagon の数が動く",
      "duration": 1.5,
      "focus": ["認証の役務"],
      "tween": { "v": [60, 940] },
      "badge": "shape",
      "description": "副題の数が段の中で動く。 形と説明は変えない。"
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
      "description": "ひし形。 条件で道が分かれる所を表す。"
    },
    {
      "step": "shape-diamond の数が動く",
      "duration": 1.5,
      "focus": ["正しい?"],
      "tween": { "v": [40, 92] },
      "badge": "shape",
      "description": "副題の数が段の中で動く。 形と説明は変えない。"
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
      "description": "3 枚重ねた四角。 版の履歴や層、ある時点の写しの束を表す。"
    },
    {
      "step": "shape-stack の数が動く",
      "duration": 1.5,
      "focus": ["v3.2.0"],
      "tween": { "v": [3, 14] },
      "badge": "shape",
      "description": "副題の数が段の中で動く。 形と説明は変えない。"
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
      "description": "人の形 (丸い頭と台形の胴、曲げた腕)。 登場する人や利用者、担当者を表す。"
    },
    {
      "step": "shape-person の数が動く",
      "duration": 1.5,
      "focus": ["エンドユーザ"],
      "tween": { "v": [2, 21] },
      "badge": "shape",
      "description": "副題の数が段の中で動く。 形と説明は変えない。"
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
      "description": "題の帯と 3 色の丸ボタン、本体。 アプリの画面や、閲覧ソフトで開いた画面を表す。"
    },
    {
      "step": "shape-window の数が動く",
      "duration": 1.5,
      "focus": ["ダッシュボード"],
      "tween": { "v": [1, 6] },
      "badge": "shape",
      "description": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeTerminal = `title: "shape: terminal (CLI shell、 mac bar + prompt)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - シェル: { kind: shape-terminal, lane: l, stack: 0, eyebrow: "端末", subtitle: "命令を打つ画面" }

animation:
  - step: "shape-terminal" 1.5s
    focus: ["シェル"]
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
      "name": "シェル",
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
      "focus": ["シェル"],
      "badge": "shape",
      "description": "上の帯と $ の入力待ち、点滅する印。 命令を打つ画面や、遠くの機械への接続、手順の自動実行を表す。"
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
      "description": "編集画面の見出しと行番号の欄、色分けした 4 行。 コードの抜粋や、実装そのものを表す。"
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
      "description": "外枠と 3 段の差し込み口を持つ棚。 実機のサーバや、データセンター、自社に置く機器を表す。"
    },
    {
      "step": "shape-server-rack の数が動く",
      "duration": 1.5,
      "focus": ["公開用 1 号機"],
      "tween": { "v": [3, 12] },
      "badge": "shape",
      "description": "副題の数が段の中で動く。 形と説明は変えない。"
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
  - スマホ: { kind: shape-mobile-device, lane: l, stack: 0, eyebrow: "携帯端末", subtitle: "{v} 台が稼働" }

animation:
  - step: "shape-mobile-device" 1.5s
    focus: ["スマホ"]
    badge: "shape"
    description: "上の話し口と画面、下のボタンを持つスマホ。 携帯のアプリや、利用者の手元の端末を表す。"
  - step: "shape-mobile-device の数が動く" 1.5s
    focus: ["スマホ"]
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
      "name": "スマホ",
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
      "focus": ["スマホ"],
      "badge": "shape",
      "description": "上の話し口と画面、下のボタンを持つスマホ。 携帯のアプリや、利用者の手元の端末を表す。"
    },
    {
      "step": "shape-mobile-device の数が動く",
      "duration": 1.5,
      "focus": ["スマホ"],
      "tween": { "v": [200, 1800] },
      "badge": "shape",
      "description": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;