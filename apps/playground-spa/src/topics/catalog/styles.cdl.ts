import { diagram } from "@cardenelabs/cdl";
import type { EdgeStyle, Tone, PhaseBuilder } from "@cardenelabs/cdl";
import { textDslToDiagram } from "@cardenelabs/dragon";

/**
 * Catalog - Styles ... edge / tone の見た目バリエーション。
 */

// lane gap = label pill 最大幅 (~240px = 14 文字 mono) + node 端マージン分を確保
function smallPair(id: string, style: EdgeStyle, tone: Tone, label: string, topicOverride: string, sub?: string) {
  return diagram(id, { topic: topicOverride })
    .lane("l1", { x: 0, width: 280 })
    .lane("l2", { x: 600, width: 280 })
    .node("a", { lane: "l1", stack: 0, kind: "actor", title: "始点" })
    .node("b", { lane: "l2", stack: 0, kind: "actor", title: "終点" })
    .edge("a", "b", { id: "e", label, sub, tone, style })
    .phase("p", { duration: 1800, title: `${style} / ${tone}`, body: "edge style と tone の組み合わせを確認。" }, (p: PhaseBuilder) => p.activate("a", "b", "e").badge(tone))
    .build();
}

/** 1. EdgeStyle 2 種 = 線種の違いを比較 (tone は accent 固定) */
export const styleSolid = smallPair("style-solid", "solid", "accent", "solid", "solid style (実線 + 矢頭、 edge の default)", "実線 + 矢頭");
export const styleDottedFlow = smallPair("style-dotted-flow", "dotted-flow", "accent", "dotted-flow", "dotted-flow style (点線 + 粒子、 動的 flow 表現)", "点線 + 粒子");

/** 2. Tone (`Tone` が持つ全ての色を solid edge で並べる) = 色 identity の違いを比較 */
export const toneAccent = smallPair("tone-accent", "solid", "accent", "accent", "accent tone (主張色、 dark navy)");
export const toneTeal = smallPair("tone-teal", "solid", "teal", "teal", "teal tone (青緑、 secondary emphasis)");
export const toneSuccess = smallPair("tone-success", "solid", "success", "success", "success tone (green、 成功状態)");
export const toneError = smallPair("tone-error", "solid", "error", "error", "error tone (red、 エラー状態)");
export const toneWarning = smallPair("tone-warning", "solid", "warning", "warning", "warning tone (orange、 警告状態)");
export const toneInfo = smallPair("tone-info", "solid", "info", "info", "info tone (light blue、 情報表示)");

/** 3. Inactive vs Active */
export const stateActive = diagram("state-active", { topic: "edge: 動いている状態" })
  .lane("l1", { x: 0, width: 280 })
  .lane("l2", { x: 600, width: 280 })
  .node("a", { lane: "l1", stack: 0, kind: "actor", title: "A" })
  .node("b", { lane: "l2", stack: 0, kind: "function", title: "B" })
  .edge("a", "b", { id: "e", label: "動作中", tone: "accent", style: "solid" })
  .phase("p", { duration: 1800, title: "動いている状態", body: "phase で activate された edge は太く + 色付きで見える。" }, (p: PhaseBuilder) => p.activate("a", "b", "e").badge("動作中"))
  .build();

export const stateInactive = diagram("state-inactive", { topic: "edge: 止まっている状態" })
  .lane("l1", { x: 0, width: 280 })
  .lane("l2", { x: 600, width: 280 })
  .node("a", { lane: "l1", stack: 0, kind: "actor", title: "A" })
  .node("b", { lane: "l2", stack: 0, kind: "function", title: "B" })
  .edge("a", "b", { id: "e", label: "停止中", tone: "accent", style: "solid" })
  .phase("p", { duration: 1800, title: "止まっている状態", body: "activate されていない edge は薄い灰色 + 破線で静かに出る。" }, (p: PhaseBuilder) => p.activate("a", "b").badge("矢印は停止中"))
  .build();

// ============================================================
// 記法 (#1373)
// ============================================================
//
// catalog は `sourceYaml__<図の export 名>` の名前で記法を拾う (`lib/catalog-items.ts`)。
// 記法があると画面で「コード」 を読めて「エディタで開く」 が押せる。
//
// **図は組み立て API のまま残す**。 記法から組み立て直すと図の識別子が題から導かれ、
// `style-solid` が `solid-style-実線-矢頭-edge-の-default` に変わる (識別子は一覧と検索に出る)。
//
// 併記は写し違いが起きるため、**同じ図になることを検査で固定する**
// (`lib/catalog-source-parity.test.tsx`)。 記法を直して図がずれたらそこで落ちる。
//
// 図の直前ではなく末尾にまとめるのは、10 件のうち 8 件が `smallPair(...)` の 1 行で
// 並ぶ形だから。 間に 50 行の記法を挟むと「線種 2 種 / 色 6 種」 の対比が読めなくなる。

export const sourceYaml__styleSolid = `title: "solid style (実線 + 矢頭、 edge の default)"
type: flow

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 600, width: 280 }

actors:
  - 始点: { kind: actor, lane: l1 }
  - 終点: { kind: actor, lane: l2 }

flow:
  - 始点 -> 終点: "solid" (accent, solid) { sub: "実線 + 矢頭" }

animation:
  - step: "solid / accent" 1.8s
    focus: ["始点", "終点", "始点 -> 終点"]
    badge: "accent"
    description: "edge style と tone の組み合わせを確認。"
`;

export const sourceJson__styleSolid = `{
  "title": "solid style (実線 + 矢頭、 edge の default)",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 280 },
    "l2": { "x": 600, "width": 280 }
  },
  "actors": [
    { "name": "始点", "kind": "actor", "lane": "l1" },
    { "name": "終点", "kind": "actor", "lane": "l2" }
  ],
  "flow": [
    {
      "from": "始点",
      "to": "終点",
      "label": "solid",
      "sub": "実線 + 矢頭",
      "tone": "accent",
      "style": "solid"
    }
  ],
  "animation": [
    {
      "step": "solid / accent",
      "duration": 1.8,
      "focus": ["始点", "終点", "始点 -> 終点"],
      "body": "edge style と tone の組み合わせを確認。",
      "badge": "accent"
    }
  ]
}`;

export const sourceYaml__styleDottedFlow = `title: "dotted-flow style (点線 + 粒子、 動的 flow 表現)"
type: flow

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 600, width: 280 }

actors:
  - 始点: { kind: actor, lane: l1 }
  - 終点: { kind: actor, lane: l2 }

flow:
  - 始点 -> 終点: "dotted-flow" (accent, dotted-flow) { sub: "点線 + 粒子" }

animation:
  - step: "dotted-flow / accent" 1.8s
    focus: ["始点", "終点", "始点 -> 終点"]
    badge: "accent"
    description: "edge style と tone の組み合わせを確認。"
`;

export const sourceJson__styleDottedFlow = `{
  "title": "dotted-flow style (点線 + 粒子、 動的 flow 表現)",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 280 },
    "l2": { "x": 600, "width": 280 }
  },
  "actors": [
    { "name": "始点", "kind": "actor", "lane": "l1" },
    { "name": "終点", "kind": "actor", "lane": "l2" }
  ],
  "flow": [
    {
      "from": "始点",
      "to": "終点",
      "label": "dotted-flow",
      "sub": "点線 + 粒子",
      "tone": "accent",
      "style": "dotted-flow"
    }
  ],
  "animation": [
    {
      "step": "dotted-flow / accent",
      "duration": 1.8,
      "focus": ["始点", "終点", "始点 -> 終点"],
      "body": "edge style と tone の組み合わせを確認。",
      "badge": "accent"
    }
  ]
}`;

export const sourceYaml__toneAccent = `title: "accent tone (主張色、 dark navy)"
type: flow

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 600, width: 280 }

actors:
  - 始点: { kind: actor, lane: l1 }
  - 終点: { kind: actor, lane: l2 }

flow:
  - 始点 -> 終点: "accent" (accent, solid)

animation:
  - step: "solid / accent" 1.8s
    focus: ["始点", "終点", "始点 -> 終点"]
    badge: "accent"
    description: "edge style と tone の組み合わせを確認。"
`;

export const sourceJson__toneAccent = `{
  "title": "accent tone (主張色、 dark navy)",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 280 },
    "l2": { "x": 600, "width": 280 }
  },
  "actors": [
    { "name": "始点", "kind": "actor", "lane": "l1" },
    { "name": "終点", "kind": "actor", "lane": "l2" }
  ],
  "flow": [
    { "from": "始点", "to": "終点", "label": "accent", "tone": "accent", "style": "solid" }
  ],
  "animation": [
    {
      "step": "solid / accent",
      "duration": 1.8,
      "focus": ["始点", "終点", "始点 -> 終点"],
      "body": "edge style と tone の組み合わせを確認。",
      "badge": "accent"
    }
  ]
}`;

export const sourceYaml__toneTeal = `title: "teal tone (青緑、 secondary emphasis)"
type: flow

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 600, width: 280 }

actors:
  - 始点: { kind: actor, lane: l1 }
  - 終点: { kind: actor, lane: l2 }

flow:
  - 始点 -> 終点: "teal" (teal, solid)

animation:
  - step: "solid / teal" 1.8s
    focus: ["始点", "終点", "始点 -> 終点"]
    badge: "teal"
    description: "edge style と tone の組み合わせを確認。"
`;

export const sourceJson__toneTeal = `{
  "title": "teal tone (青緑、 secondary emphasis)",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 280 },
    "l2": { "x": 600, "width": 280 }
  },
  "actors": [
    { "name": "始点", "kind": "actor", "lane": "l1" },
    { "name": "終点", "kind": "actor", "lane": "l2" }
  ],
  "flow": [
    { "from": "始点", "to": "終点", "label": "teal", "tone": "teal", "style": "solid" }
  ],
  "animation": [
    {
      "step": "solid / teal",
      "duration": 1.8,
      "focus": ["始点", "終点", "始点 -> 終点"],
      "body": "edge style と tone の組み合わせを確認。",
      "badge": "teal"
    }
  ]
}`;

export const sourceYaml__toneSuccess = `title: "success tone (green、 成功状態)"
type: flow

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 600, width: 280 }

actors:
  - 始点: { kind: actor, lane: l1 }
  - 終点: { kind: actor, lane: l2 }

flow:
  - 始点 -> 終点: "success" (success, solid)

animation:
  - step: "solid / success" 1.8s
    focus: ["始点", "終点", "始点 -> 終点"]
    badge: "success"
    description: "edge style と tone の組み合わせを確認。"
`;

export const sourceJson__toneSuccess = `{
  "title": "success tone (green、 成功状態)",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 280 },
    "l2": { "x": 600, "width": 280 }
  },
  "actors": [
    { "name": "始点", "kind": "actor", "lane": "l1" },
    { "name": "終点", "kind": "actor", "lane": "l2" }
  ],
  "flow": [
    { "from": "始点", "to": "終点", "label": "success", "tone": "success", "style": "solid" }
  ],
  "animation": [
    {
      "step": "solid / success",
      "duration": 1.8,
      "focus": ["始点", "終点", "始点 -> 終点"],
      "body": "edge style と tone の組み合わせを確認。",
      "badge": "success"
    }
  ]
}`;

export const sourceYaml__toneError = `title: "error tone (red、 エラー状態)"
type: flow

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 600, width: 280 }

actors:
  - 始点: { kind: actor, lane: l1 }
  - 終点: { kind: actor, lane: l2 }

flow:
  - 始点 -> 終点: "error" (error, solid)

animation:
  - step: "solid / error" 1.8s
    focus: ["始点", "終点", "始点 -> 終点"]
    badge: "error"
    description: "edge style と tone の組み合わせを確認。"
`;

export const sourceJson__toneError = `{
  "title": "error tone (red、 エラー状態)",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 280 },
    "l2": { "x": 600, "width": 280 }
  },
  "actors": [
    { "name": "始点", "kind": "actor", "lane": "l1" },
    { "name": "終点", "kind": "actor", "lane": "l2" }
  ],
  "flow": [
    { "from": "始点", "to": "終点", "label": "error", "tone": "error", "style": "solid" }
  ],
  "animation": [
    {
      "step": "solid / error",
      "duration": 1.8,
      "focus": ["始点", "終点", "始点 -> 終点"],
      "body": "edge style と tone の組み合わせを確認。",
      "badge": "error"
    }
  ]
}`;

export const sourceYaml__toneWarning = `title: "warning tone (orange、 警告状態)"
type: flow

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 600, width: 280 }

actors:
  - 始点: { kind: actor, lane: l1 }
  - 終点: { kind: actor, lane: l2 }

flow:
  - 始点 -> 終点: "warning" (warning, solid)

animation:
  - step: "solid / warning" 1.8s
    focus: ["始点", "終点", "始点 -> 終点"]
    badge: "warning"
    description: "edge style と tone の組み合わせを確認。"
`;

export const sourceJson__toneWarning = `{
  "title": "warning tone (orange、 警告状態)",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 280 },
    "l2": { "x": 600, "width": 280 }
  },
  "actors": [
    { "name": "始点", "kind": "actor", "lane": "l1" },
    { "name": "終点", "kind": "actor", "lane": "l2" }
  ],
  "flow": [
    { "from": "始点", "to": "終点", "label": "warning", "tone": "warning", "style": "solid" }
  ],
  "animation": [
    {
      "step": "solid / warning",
      "duration": 1.8,
      "focus": ["始点", "終点", "始点 -> 終点"],
      "body": "edge style と tone の組み合わせを確認。",
      "badge": "warning"
    }
  ]
}`;

export const sourceYaml__toneInfo = `title: "info tone (light blue、 情報表示)"
type: flow

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 600, width: 280 }

actors:
  - 始点: { kind: actor, lane: l1 }
  - 終点: { kind: actor, lane: l2 }

flow:
  - 始点 -> 終点: "info" (info, solid)

animation:
  - step: "solid / info" 1.8s
    focus: ["始点", "終点", "始点 -> 終点"]
    badge: "info"
    description: "edge style と tone の組み合わせを確認。"
`;

export const sourceJson__toneInfo = `{
  "title": "info tone (light blue、 情報表示)",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 280 },
    "l2": { "x": 600, "width": 280 }
  },
  "actors": [
    { "name": "始点", "kind": "actor", "lane": "l1" },
    { "name": "終点", "kind": "actor", "lane": "l2" }
  ],
  "flow": [
    { "from": "始点", "to": "終点", "label": "info", "tone": "info", "style": "solid" }
  ],
  "animation": [
    {
      "step": "solid / info",
      "duration": 1.8,
      "focus": ["始点", "終点", "始点 -> 終点"],
      "body": "edge style と tone の組み合わせを確認。",
      "badge": "info"
    }
  ]
}`;

export const sourceYaml__stateActive = `title: "edge: 動いている状態"
type: flow

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 600, width: 280 }

actors:
  - A: { kind: actor, lane: l1 }
  - B: { kind: function, lane: l2 }

flow:
  - A -> B: "動作中" (accent, solid)

animation:
  - step: "動いている状態" 1.8s
    focus: ["A", "B", "A -> B"]
    badge: "動作中"
    description: "phase で activate された edge は太く + 色付きで見える。"
`;

export const sourceJson__stateActive = `{
  "title": "edge: 動いている状態",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 280 },
    "l2": { "x": 600, "width": 280 }
  },
  "actors": [
    { "name": "A", "kind": "actor", "lane": "l1" },
    { "name": "B", "kind": "function", "lane": "l2" }
  ],
  "flow": [
    { "from": "A", "to": "B", "label": "動作中", "tone": "accent", "style": "solid" }
  ],
  "animation": [
    {
      "step": "動いている状態",
      "duration": 1.8,
      "focus": ["A", "B", "A -> B"],
      "body": "phase で activate された edge は太く + 色付きで見える。",
      "badge": "動作中"
    }
  ]
}`;

export const sourceYaml__stateInactive = `title: "edge: 止まっている状態"
type: flow

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 600, width: 280 }

actors:
  - A: { kind: actor, lane: l1 }
  - B: { kind: function, lane: l2 }

flow:
  - A -> B: "停止中" (accent, solid)

animation:
  - step: "止まっている状態" 1.8s
    focus: ["A", "B"]
    badge: "矢印は停止中"
    description: "activate されていない edge は薄い灰色 + 破線で静かに出る。"
`;

export const sourceJson__stateInactive = `{
  "title": "edge: 止まっている状態",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 280 },
    "l2": { "x": 600, "width": 280 }
  },
  "actors": [
    { "name": "A", "kind": "actor", "lane": "l1" },
    { "name": "B", "kind": "function", "lane": "l2" }
  ],
  "flow": [
    { "from": "A", "to": "B", "label": "停止中", "tone": "accent", "style": "solid" }
  ],
  "animation": [
    {
      "step": "止まっている状態",
      "duration": 1.8,
      "focus": ["A", "B"],
      "body": "activate されていない edge は薄い灰色 + 破線で静かに出る。",
      "badge": "矢印は停止中"
    }
  ]
}`;

// ============================================================
// 欄が取る値を全て見せる (#1966)
// ============================================================
//
// 節の色・矢印の端の形・矢印の出る辺・形の満ちる向きは、engine が値の一覧を持つ。 カタログは
// それぞれ 1 つか 2 つの値しか書いておらず、残りの値がどんな絵になるかをどこでも見られなかった。
// 抜けは `lib/catalog-value-coverage.test.ts` が engine の一覧と突き合わせて数える。
//
// **1 枚に並べる値と、切替で見せる値を分ける**。 色と端の形は隣に並べた方が違いを読める。
// 出る辺は 1 枚に 4 本並べると迂回の線が重なって読めないので、同じ 2 つの節を切替で出し分ける。
//
// ここの図は記法から組む = 記法と図がずれない。 上の 10 件と違い、識別子を一覧で固定する前の見本なので、
// 題から導かれた識別子のままでよい。

// ---- 節の色 ----

export const sourceYaml__nodeTone = `title: "節の色 6 種"
type: flow

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 400, width: 280 }

actors:
  - 主張: { kind: card, lane: l1, stack: 0, tone: accent, subtitle: "accent" }
  - 青緑: { kind: card, lane: l1, stack: 1, tone: teal, subtitle: "teal" }
  - 成功: { kind: card, lane: l1, stack: 2, tone: success, subtitle: "success" }
  - 失敗: { kind: card, lane: l2, stack: 0, tone: error, subtitle: "error" }
  - 注意: { kind: card, lane: l2, stack: 1, tone: warning, subtitle: "warning" }
  - 案内: { kind: card, lane: l2, stack: 2, tone: info, subtitle: "info" }

animation:
  - step: "6 色を並べる" 1.8s
    focus: ["主張", "青緑", "成功", "失敗", "注意", "案内"]
    description: "強調した箱の枠が、書いた色の名前で描かれる。 主張の色は強調の既定の色と同じ"
`;

export const sourceJson__nodeTone = `{
  "title": "節の色 6 種",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 280 },
    "l2": { "x": 400, "width": 280 }
  },
  "actors": [
    { "name": "主張", "kind": "card", "lane": "l1", "stack": 0, "tone": "accent", "subtitle": "accent" },
    { "name": "青緑", "kind": "card", "lane": "l1", "stack": 1, "tone": "teal", "subtitle": "teal" },
    { "name": "成功", "kind": "card", "lane": "l1", "stack": 2, "tone": "success", "subtitle": "success" },
    { "name": "失敗", "kind": "card", "lane": "l2", "stack": 0, "tone": "error", "subtitle": "error" },
    { "name": "注意", "kind": "card", "lane": "l2", "stack": 1, "tone": "warning", "subtitle": "warning" },
    { "name": "案内", "kind": "card", "lane": "l2", "stack": 2, "tone": "info", "subtitle": "info" }
  ],
  "flow": [],
  "animation": [
    {
      "step": "6 色を並べる",
      "duration": 1.8,
      "focus": ["主張", "青緑", "成功", "失敗", "注意", "案内"],
      "body": "強調した箱の枠が、書いた色の名前で描かれる。 主張の色は強調の既定の色と同じ"
    }
  ]
}`;

export const nodeTone = textDslToDiagram(sourceYaml__nodeTone);

// 題を書いた箱にも色が乗ることを、切替で並べて見せる (#2333)。
//
// この組み合わせはカタログに 1 件も無く (実測 = 記法 571 件のうち、同じ箱に題と色を書いた所が
// 0 件)、書ける形なのに誰も試していなかった。 その間、色を載せる後処理が名前と突き合わせて
// いたため、題を書くと箱になる 7 図種のうち 5 図種で色が黙って消えていた。
//
// **名前と題を別の字にする**。 同じ字にすると、名前で突き合わせても題で突き合わせても通って
// しまい、見本としてこの組み合わせを示せない。
//
// 元の見本の名前 (`patternBase__nodeTone`) は #1969 の変種が既に置いている。

export const sourceYaml__pattern__nodeTone__題も書く = `title: "節の色 6 種 (題も書く)"
type: flow

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 400, width: 280 }

actors:
  - 主張: { kind: card, lane: l1, stack: 0, tone: accent, title: "accent", subtitle: "名前は 主張" }
  - 青緑: { kind: card, lane: l1, stack: 1, tone: teal, title: "teal", subtitle: "名前は 青緑" }
  - 成功: { kind: card, lane: l1, stack: 2, tone: success, title: "success", subtitle: "名前は 成功" }
  - 失敗: { kind: card, lane: l2, stack: 0, tone: error, title: "error", subtitle: "名前は 失敗" }
  - 注意: { kind: card, lane: l2, stack: 1, tone: warning, title: "warning", subtitle: "名前は 注意" }
  - 案内: { kind: card, lane: l2, stack: 2, tone: info, title: "info", subtitle: "名前は 案内" }

animation:
  - step: "題を書いても色は残る" 1.8s
    focus: ["主張", "青緑", "成功", "失敗", "注意", "案内"]
    description: "箱に出る字は題で、色は書いたとおりに残る。 強調や矢印が指すのは題ではなく名前"
`;

export const sourceJson__pattern__nodeTone__題も書く = `{
  "title": "節の色 6 種 (題も書く)",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 280 },
    "l2": { "x": 400, "width": 280 }
  },
  "actors": [
    { "name": "主張", "kind": "card", "lane": "l1", "stack": 0, "tone": "accent", "title": "accent", "subtitle": "名前は 主張" },
    { "name": "青緑", "kind": "card", "lane": "l1", "stack": 1, "tone": "teal", "title": "teal", "subtitle": "名前は 青緑" },
    { "name": "成功", "kind": "card", "lane": "l1", "stack": 2, "tone": "success", "title": "success", "subtitle": "名前は 成功" },
    { "name": "失敗", "kind": "card", "lane": "l2", "stack": 0, "tone": "error", "title": "error", "subtitle": "名前は 失敗" },
    { "name": "注意", "kind": "card", "lane": "l2", "stack": 1, "tone": "warning", "title": "warning", "subtitle": "名前は 注意" },
    { "name": "案内", "kind": "card", "lane": "l2", "stack": 2, "tone": "info", "title": "info", "subtitle": "名前は 案内" }
  ],
  "flow": [],
  "animation": [
    {
      "step": "題を書いても色は残る",
      "duration": 1.8,
      "focus": ["主張", "青緑", "成功", "失敗", "注意", "案内"],
      "body": "箱に出る字は題で、色は書いたとおりに残る。 強調や矢印が指すのは題ではなく名前"
    }
  ]
}`;

export const pattern__nodeTone__題も書く = textDslToDiagram(sourceYaml__pattern__nodeTone__題も書く);

// ---- 矢印の端の形 ----
//
// 先端 (`head`) と根元 (`tailHead`) は同じ 9 形を取る。 9 本を 1 枚に縦に積むと台の高さを超え、横に 2 列に
// 並べると一覧の幅で字が読めない大きさまで縮む。 形の意味で 2 つに分ける = 線の向きを示す矢じり 5 形と、
// 関係の数を示す多重度 4 形。 それぞれを先端に置く形と根元に置く形の 4 つを切り替える。
// 根元の側は先端を「無し」 にして、根元の形だけが見えるようにする。

export const patternBase__edgeHead = "先端の矢じり";

export const sourceYaml__edgeHead = `title: "矢印の先端の矢じり 5 形"
type: flow

lanes:
  元: { x: 0, width: 240 }
  先: { x: 600, width: 240 }

actors:
  - 無し: { kind: actor, lane: 元, stack: 0 }
  - 三角: { kind: actor, lane: 元, stack: 1 }
  - 菱形: { kind: actor, lane: 元, stack: 2 }
  - 開いた矢じり: { kind: actor, lane: 元, stack: 3 }
  - 鳥の足: { kind: actor, lane: 元, stack: 4 }
  - 無しの行き先: { kind: actor, lane: 先, stack: 0 }
  - 三角の行き先: { kind: actor, lane: 先, stack: 1 }
  - 菱形の行き先: { kind: actor, lane: 先, stack: 2 }
  - 開いた矢じりの行き先: { kind: actor, lane: 先, stack: 3 }
  - 鳥の足の行き先: { kind: actor, lane: 先, stack: 4 }

flow:
  - 無し -> 無しの行き先: "none" (accent, solid) { head: none }
  - 三角 -> 三角の行き先: "triangle" (accent, solid) { head: triangle }
  - 菱形 -> 菱形の行き先: "diamond" (accent, solid) { head: diamond }
  - 開いた矢じり -> 開いた矢じりの行き先: "open" (accent, solid) { head: open }
  - 鳥の足 -> 鳥の足の行き先: "crow" (accent, solid) { head: crow }

animation:
  - step: "先端に矢じりを置く" 1.8s
    focus: ["無し -> 無しの行き先", "三角 -> 三角の行き先", "菱形 -> 菱形の行き先", "開いた矢じり -> 開いた矢じりの行き先", "鳥の足 -> 鳥の足の行き先"]
    description: "線の行き先の端に、向きを示す 5 つの形を置く"
`;

export const sourceJson__edgeHead = `{
  "title": "矢印の先端の矢じり 5 形",
  "type": "flow",
  "lanes": {
    "元": { "x": 0, "width": 240 },
    "先": { "x": 600, "width": 240 }
  },
  "actors": [
    { "name": "無し", "kind": "actor", "lane": "元", "stack": 0 },
    { "name": "三角", "kind": "actor", "lane": "元", "stack": 1 },
    { "name": "菱形", "kind": "actor", "lane": "元", "stack": 2 },
    { "name": "開いた矢じり", "kind": "actor", "lane": "元", "stack": 3 },
    { "name": "鳥の足", "kind": "actor", "lane": "元", "stack": 4 },
    { "name": "無しの行き先", "kind": "actor", "lane": "先", "stack": 0 },
    { "name": "三角の行き先", "kind": "actor", "lane": "先", "stack": 1 },
    { "name": "菱形の行き先", "kind": "actor", "lane": "先", "stack": 2 },
    { "name": "開いた矢じりの行き先", "kind": "actor", "lane": "先", "stack": 3 },
    { "name": "鳥の足の行き先", "kind": "actor", "lane": "先", "stack": 4 }
  ],
  "flow": [
    { "from": "無し", "to": "無しの行き先", "label": "none", "tone": "accent", "style": "solid", "head": "none" },
    { "from": "三角", "to": "三角の行き先", "label": "triangle", "tone": "accent", "style": "solid", "head": "triangle" },
    { "from": "菱形", "to": "菱形の行き先", "label": "diamond", "tone": "accent", "style": "solid", "head": "diamond" },
    { "from": "開いた矢じり", "to": "開いた矢じりの行き先", "label": "open", "tone": "accent", "style": "solid", "head": "open" },
    { "from": "鳥の足", "to": "鳥の足の行き先", "label": "crow", "tone": "accent", "style": "solid", "head": "crow" }
  ],
  "animation": [
    {
      "step": "先端に矢じりを置く",
      "duration": 1.8,
      "focus": ["無し -> 無しの行き先", "三角 -> 三角の行き先", "菱形 -> 菱形の行き先", "開いた矢じり -> 開いた矢じりの行き先", "鳥の足 -> 鳥の足の行き先"],
      "body": "線の行き先の端に、向きを示す 5 つの形を置く"
    }
  ]
}`;

export const edgeHead = textDslToDiagram(sourceYaml__edgeHead);

export const sourceYaml__pattern__edgeHead__先端の多重度 = `title: "矢印の先端の多重度 4 形"
type: flow

lanes:
  元: { x: 0, width: 240 }
  先: { x: 600, width: 240 }

actors:
  - 1 つ: { kind: actor, lane: 元, stack: 0 }
  - 0 か 1: { kind: actor, lane: 元, stack: 1 }
  - 多: { kind: actor, lane: 元, stack: 2 }
  - 0 以上: { kind: actor, lane: 元, stack: 3 }
  - 1 つの行き先: { kind: actor, lane: 先, stack: 0 }
  - 0 か 1の行き先: { kind: actor, lane: 先, stack: 1 }
  - 多の行き先: { kind: actor, lane: 先, stack: 2 }
  - 0 以上の行き先: { kind: actor, lane: 先, stack: 3 }

flow:
  - 1 つ -> 1 つの行き先: "one" (accent, solid) { head: one }
  - 0 か 1 -> 0 か 1の行き先: "zero-one" (accent, solid) { head: zero-one }
  - 多 -> 多の行き先: "many" (accent, solid) { head: many }
  - 0 以上 -> 0 以上の行き先: "zero-many" (accent, solid) { head: zero-many }

animation:
  - step: "先端に多重度を置く" 1.8s
    focus: ["1 つ -> 1 つの行き先", "0 か 1 -> 0 か 1の行き先", "多 -> 多の行き先", "0 以上 -> 0 以上の行き先"]
    description: "線の行き先の端に、関係の数を示す 4 つの形を置く"
`;

export const sourceJson__pattern__edgeHead__先端の多重度 = `{
  "title": "矢印の先端の多重度 4 形",
  "type": "flow",
  "lanes": {
    "元": { "x": 0, "width": 240 },
    "先": { "x": 600, "width": 240 }
  },
  "actors": [
    { "name": "1 つ", "kind": "actor", "lane": "元", "stack": 0 },
    { "name": "0 か 1", "kind": "actor", "lane": "元", "stack": 1 },
    { "name": "多", "kind": "actor", "lane": "元", "stack": 2 },
    { "name": "0 以上", "kind": "actor", "lane": "元", "stack": 3 },
    { "name": "1 つの行き先", "kind": "actor", "lane": "先", "stack": 0 },
    { "name": "0 か 1の行き先", "kind": "actor", "lane": "先", "stack": 1 },
    { "name": "多の行き先", "kind": "actor", "lane": "先", "stack": 2 },
    { "name": "0 以上の行き先", "kind": "actor", "lane": "先", "stack": 3 }
  ],
  "flow": [
    { "from": "1 つ", "to": "1 つの行き先", "label": "one", "tone": "accent", "style": "solid", "head": "one" },
    { "from": "0 か 1", "to": "0 か 1の行き先", "label": "zero-one", "tone": "accent", "style": "solid", "head": "zero-one" },
    { "from": "多", "to": "多の行き先", "label": "many", "tone": "accent", "style": "solid", "head": "many" },
    { "from": "0 以上", "to": "0 以上の行き先", "label": "zero-many", "tone": "accent", "style": "solid", "head": "zero-many" }
  ],
  "animation": [
    {
      "step": "先端に多重度を置く",
      "duration": 1.8,
      "focus": ["1 つ -> 1 つの行き先", "0 か 1 -> 0 か 1の行き先", "多 -> 多の行き先", "0 以上 -> 0 以上の行き先"],
      "body": "線の行き先の端に、関係の数を示す 4 つの形を置く"
    }
  ]
}`;

export const pattern__edgeHead__先端の多重度 = textDslToDiagram(sourceYaml__pattern__edgeHead__先端の多重度);

export const sourceYaml__pattern__edgeHead__根元の矢じり = `title: "矢印の根元の矢じり 5 形"
type: flow

lanes:
  元: { x: 0, width: 240 }
  先: { x: 600, width: 240 }

actors:
  - 無し: { kind: actor, lane: 元, stack: 0 }
  - 三角: { kind: actor, lane: 元, stack: 1 }
  - 菱形: { kind: actor, lane: 元, stack: 2 }
  - 開いた矢じり: { kind: actor, lane: 元, stack: 3 }
  - 鳥の足: { kind: actor, lane: 元, stack: 4 }
  - 無しの行き先: { kind: actor, lane: 先, stack: 0 }
  - 三角の行き先: { kind: actor, lane: 先, stack: 1 }
  - 菱形の行き先: { kind: actor, lane: 先, stack: 2 }
  - 開いた矢じりの行き先: { kind: actor, lane: 先, stack: 3 }
  - 鳥の足の行き先: { kind: actor, lane: 先, stack: 4 }

flow:
  - 無し -> 無しの行き先: "none" (accent, solid) { head: none, tailHead: none }
  - 三角 -> 三角の行き先: "triangle" (accent, solid) { head: none, tailHead: triangle }
  - 菱形 -> 菱形の行き先: "diamond" (accent, solid) { head: none, tailHead: diamond }
  - 開いた矢じり -> 開いた矢じりの行き先: "open" (accent, solid) { head: none, tailHead: open }
  - 鳥の足 -> 鳥の足の行き先: "crow" (accent, solid) { head: none, tailHead: crow }

animation:
  - step: "根元に矢じりを置く" 1.8s
    focus: ["無し -> 無しの行き先", "三角 -> 三角の行き先", "菱形 -> 菱形の行き先", "開いた矢じり -> 開いた矢じりの行き先", "鳥の足 -> 鳥の足の行き先"]
    description: "線の出どころの端に、5 つの形を置く。 先端は無しにして根元だけを見せる"
`;

export const sourceJson__pattern__edgeHead__根元の矢じり = `{
  "title": "矢印の根元の矢じり 5 形",
  "type": "flow",
  "lanes": {
    "元": { "x": 0, "width": 240 },
    "先": { "x": 600, "width": 240 }
  },
  "actors": [
    { "name": "無し", "kind": "actor", "lane": "元", "stack": 0 },
    { "name": "三角", "kind": "actor", "lane": "元", "stack": 1 },
    { "name": "菱形", "kind": "actor", "lane": "元", "stack": 2 },
    { "name": "開いた矢じり", "kind": "actor", "lane": "元", "stack": 3 },
    { "name": "鳥の足", "kind": "actor", "lane": "元", "stack": 4 },
    { "name": "無しの行き先", "kind": "actor", "lane": "先", "stack": 0 },
    { "name": "三角の行き先", "kind": "actor", "lane": "先", "stack": 1 },
    { "name": "菱形の行き先", "kind": "actor", "lane": "先", "stack": 2 },
    { "name": "開いた矢じりの行き先", "kind": "actor", "lane": "先", "stack": 3 },
    { "name": "鳥の足の行き先", "kind": "actor", "lane": "先", "stack": 4 }
  ],
  "flow": [
    { "from": "無し", "to": "無しの行き先", "label": "none", "tone": "accent", "style": "solid", "head": "none", "tailHead": "none" },
    { "from": "三角", "to": "三角の行き先", "label": "triangle", "tone": "accent", "style": "solid", "head": "none", "tailHead": "triangle" },
    { "from": "菱形", "to": "菱形の行き先", "label": "diamond", "tone": "accent", "style": "solid", "head": "none", "tailHead": "diamond" },
    { "from": "開いた矢じり", "to": "開いた矢じりの行き先", "label": "open", "tone": "accent", "style": "solid", "head": "none", "tailHead": "open" },
    { "from": "鳥の足", "to": "鳥の足の行き先", "label": "crow", "tone": "accent", "style": "solid", "head": "none", "tailHead": "crow" }
  ],
  "animation": [
    {
      "step": "根元に矢じりを置く",
      "duration": 1.8,
      "focus": ["無し -> 無しの行き先", "三角 -> 三角の行き先", "菱形 -> 菱形の行き先", "開いた矢じり -> 開いた矢じりの行き先", "鳥の足 -> 鳥の足の行き先"],
      "body": "線の出どころの端に、5 つの形を置く。 先端は無しにして根元だけを見せる"
    }
  ]
}`;

export const pattern__edgeHead__根元の矢じり = textDslToDiagram(sourceYaml__pattern__edgeHead__根元の矢じり);

export const sourceYaml__pattern__edgeHead__根元の多重度 = `title: "矢印の根元の多重度 4 形"
type: flow

lanes:
  元: { x: 0, width: 240 }
  先: { x: 600, width: 240 }

actors:
  - 1 つ: { kind: actor, lane: 元, stack: 0 }
  - 0 か 1: { kind: actor, lane: 元, stack: 1 }
  - 多: { kind: actor, lane: 元, stack: 2 }
  - 0 以上: { kind: actor, lane: 元, stack: 3 }
  - 1 つの行き先: { kind: actor, lane: 先, stack: 0 }
  - 0 か 1の行き先: { kind: actor, lane: 先, stack: 1 }
  - 多の行き先: { kind: actor, lane: 先, stack: 2 }
  - 0 以上の行き先: { kind: actor, lane: 先, stack: 3 }

flow:
  - 1 つ -> 1 つの行き先: "one" (accent, solid) { head: none, tailHead: one }
  - 0 か 1 -> 0 か 1の行き先: "zero-one" (accent, solid) { head: none, tailHead: zero-one }
  - 多 -> 多の行き先: "many" (accent, solid) { head: none, tailHead: many }
  - 0 以上 -> 0 以上の行き先: "zero-many" (accent, solid) { head: none, tailHead: zero-many }

animation:
  - step: "根元に多重度を置く" 1.8s
    focus: ["1 つ -> 1 つの行き先", "0 か 1 -> 0 か 1の行き先", "多 -> 多の行き先", "0 以上 -> 0 以上の行き先"]
    description: "線の出どころの端に、関係の数を示す 4 つの形を置く。 先端は無しにして根元だけを見せる"
`;

export const sourceJson__pattern__edgeHead__根元の多重度 = `{
  "title": "矢印の根元の多重度 4 形",
  "type": "flow",
  "lanes": {
    "元": { "x": 0, "width": 240 },
    "先": { "x": 600, "width": 240 }
  },
  "actors": [
    { "name": "1 つ", "kind": "actor", "lane": "元", "stack": 0 },
    { "name": "0 か 1", "kind": "actor", "lane": "元", "stack": 1 },
    { "name": "多", "kind": "actor", "lane": "元", "stack": 2 },
    { "name": "0 以上", "kind": "actor", "lane": "元", "stack": 3 },
    { "name": "1 つの行き先", "kind": "actor", "lane": "先", "stack": 0 },
    { "name": "0 か 1の行き先", "kind": "actor", "lane": "先", "stack": 1 },
    { "name": "多の行き先", "kind": "actor", "lane": "先", "stack": 2 },
    { "name": "0 以上の行き先", "kind": "actor", "lane": "先", "stack": 3 }
  ],
  "flow": [
    { "from": "1 つ", "to": "1 つの行き先", "label": "one", "tone": "accent", "style": "solid", "head": "none", "tailHead": "one" },
    { "from": "0 か 1", "to": "0 か 1の行き先", "label": "zero-one", "tone": "accent", "style": "solid", "head": "none", "tailHead": "zero-one" },
    { "from": "多", "to": "多の行き先", "label": "many", "tone": "accent", "style": "solid", "head": "none", "tailHead": "many" },
    { "from": "0 以上", "to": "0 以上の行き先", "label": "zero-many", "tone": "accent", "style": "solid", "head": "none", "tailHead": "zero-many" }
  ],
  "animation": [
    {
      "step": "根元に多重度を置く",
      "duration": 1.8,
      "focus": ["1 つ -> 1 つの行き先", "0 か 1 -> 0 か 1の行き先", "多 -> 多の行き先", "0 以上 -> 0 以上の行き先"],
      "body": "線の出どころの端に、関係の数を示す 4 つの形を置く。 先端は無しにして根元だけを見せる"
    }
  ]
}`;

export const pattern__edgeHead__根元の多重度 = textDslToDiagram(sourceYaml__pattern__edgeHead__根元の多重度);

// ---- 矢印の出る辺 ----
//
// 書かない矢印は、2 つの箱のレーンから出る辺を推し量る (別のレーンなら横の辺、同じレーンなら縦の辺)。
// 書くと出どころの辺が決まり、行き先には向かいの辺から入る。
//
// **1 枚に 2 組を上下に並べる**。 上の組は辺を書かず、下の組は同じ置き方で辺を書く。 1 組だけだと、
// 書いた辺が推し量った辺と同じになる置き方 (別のレーンで右へ出す) で「書かない」 と見分けが付かない。
//
// engine は辺を書いた矢印を迂回させないため、出す辺の先に行き先を置く。 置かないと線が箱の裏を通る。
// 箱は段 (`stack`) で置き、**右と左の見本だけ位置 (`posX` / `posY`) も書く**。 右と左は同じレーンの中で
// 行き先を横にずらす必要があり、段だけでは同じレーンの箱が縦 1 列に並ぶ。 横にずらすことは図の検査の
// 揃えの決まりに触れるので、2 図は `packages/dragon/test/visual-validate-sweep.test.ts` の見逃す組に
// 理由を書いてある。

export const patternBase__edgeSide = "書かない";

export const sourceYaml__edgeSide = `title: "矢印の出る辺を書かない"
type: flow

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 560, width: 280 }

actors:
  - 別のレーンの元: { kind: card, lane: l1, stack: 0 }
  - 別のレーンの先: { kind: card, lane: l2, stack: 1 }
  - 同じレーンの元: { kind: card, lane: l2, stack: 2 }
  - 同じレーンの先: { kind: card, lane: l2, stack: 3 }

flow:
  - 別のレーンの元 -> 別のレーンの先: "横の辺で結ぶ" (accent, solid)
  - 同じレーンの元 -> 同じレーンの先: "縦の辺で結ぶ" (accent, solid)

animation:
  - step: "出る辺を推し量る" 1.8s
    focus: ["別のレーンの元", "別のレーンの先", "同じレーンの元", "同じレーンの先", "別のレーンの元 -> 別のレーンの先", "同じレーンの元 -> 同じレーンの先"]
    description: "上の組は別のレーンなので横の辺で結ぶ。 下の組は同じレーンなので縦の辺で結ぶ"
`;

export const sourceJson__edgeSide = `{
  "title": "矢印の出る辺を書かない",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 280 },
    "l2": { "x": 560, "width": 280 }
  },
  "actors": [
    { "name": "別のレーンの元", "kind": "card", "lane": "l1", "stack": 0 },
    { "name": "別のレーンの先", "kind": "card", "lane": "l2", "stack": 1 },
    { "name": "同じレーンの元", "kind": "card", "lane": "l2", "stack": 2 },
    { "name": "同じレーンの先", "kind": "card", "lane": "l2", "stack": 3 }
  ],
  "flow": [
    { "from": "別のレーンの元", "to": "別のレーンの先", "label": "横の辺で結ぶ", "tone": "accent", "style": "solid" },
    { "from": "同じレーンの元", "to": "同じレーンの先", "label": "縦の辺で結ぶ", "tone": "accent", "style": "solid" }
  ],
  "animation": [
    {
      "step": "出る辺を推し量る",
      "duration": 1.8,
      "focus": [
        "別のレーンの元",
        "別のレーンの先",
        "同じレーンの元",
        "同じレーンの先",
        "別のレーンの元 -> 別のレーンの先",
        "同じレーンの元 -> 同じレーンの先"
      ],
      "body": "上の組は別のレーンなので横の辺で結ぶ。 下の組は同じレーンなので縦の辺で結ぶ"
    }
  ]
}`;

export const edgeSide = textDslToDiagram(sourceYaml__edgeSide);

export const sourceYaml__pattern__edgeSide__上 = `title: "矢印を上の辺から出す"
type: flow

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 560, width: 280 }

actors:
  - 書かない時の元: { kind: card, lane: l1, stack: 1 }
  - 書かない時の先: { kind: card, lane: l2, stack: 0 }
  - 上と書いた元: { kind: card, lane: l1, stack: 3 }
  - 上と書いた先: { kind: card, lane: l2, stack: 2 }

flow:
  - 書かない時の元 -> 書かない時の先: "横の辺で結ぶ" (info, dashed)
  - 上と書いた元 -> 上と書いた先: "上の辺から" (accent, solid) { side: top }

animation:
  - step: "上の辺から出す" 1.8s
    focus: ["書かない時の元", "書かない時の先", "上と書いた元", "上と書いた先", "書かない時の元 -> 書かない時の先", "上と書いた元 -> 上と書いた先"]
    description: "上の組は辺を書かないので横の辺で結ぶ。 下の組は上の辺から出て、行き先には下の辺から入る"
`;

export const sourceJson__pattern__edgeSide__上 = `{
  "title": "矢印を上の辺から出す",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 280 },
    "l2": { "x": 560, "width": 280 }
  },
  "actors": [
    { "name": "書かない時の元", "kind": "card", "lane": "l1", "stack": 1 },
    { "name": "書かない時の先", "kind": "card", "lane": "l2", "stack": 0 },
    { "name": "上と書いた元", "kind": "card", "lane": "l1", "stack": 3 },
    { "name": "上と書いた先", "kind": "card", "lane": "l2", "stack": 2 }
  ],
  "flow": [
    { "from": "書かない時の元", "to": "書かない時の先", "label": "横の辺で結ぶ", "tone": "info", "style": "dashed" },
    { "from": "上と書いた元", "to": "上と書いた先", "label": "上の辺から", "tone": "accent", "style": "solid", "side": "top" }
  ],
  "animation": [
    {
      "step": "上の辺から出す",
      "duration": 1.8,
      "focus": [
        "書かない時の元",
        "書かない時の先",
        "上と書いた元",
        "上と書いた先",
        "書かない時の元 -> 書かない時の先",
        "上と書いた元 -> 上と書いた先"
      ],
      "body": "上の組は辺を書かないので横の辺で結ぶ。 下の組は上の辺から出て、行き先には下の辺から入る"
    }
  ]
}`;

export const pattern__edgeSide__上 = textDslToDiagram(sourceYaml__pattern__edgeSide__上);

export const sourceYaml__pattern__edgeSide__右 = `title: "矢印を右の辺から出す"
type: flow

lanes:
  l1: { x: 0, width: 840 }

actors:
  - 書かない時の元: { kind: card, lane: l1, stack: 0, posX: 140, posY: 0, posW: 260, posH: 56 }
  - 書かない時の先: { kind: card, lane: l1, stack: 1, posX: 700, posY: 180, posW: 260, posH: 56 }
  - 右と書いた元: { kind: card, lane: l1, stack: 2, posX: 140, posY: 360, posW: 260, posH: 56 }
  - 右と書いた先: { kind: card, lane: l1, stack: 3, posX: 700, posY: 540, posW: 260, posH: 56 }

flow:
  - 書かない時の元 -> 書かない時の先: "縦の辺で結ぶ" (info, dashed)
  - 右と書いた元 -> 右と書いた先: "右の辺から" (accent, solid) { side: right }

animation:
  - step: "右の辺から出す" 1.8s
    focus: ["書かない時の元", "書かない時の先", "右と書いた元", "右と書いた先", "書かない時の元 -> 書かない時の先", "右と書いた元 -> 右と書いた先"]
    description: "上の組は辺を書かないので縦の辺で結ぶ。 下の組は右の辺から出て、行き先には左の辺から入る"
`;

export const sourceJson__pattern__edgeSide__右 = `{
  "title": "矢印を右の辺から出す",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 840 }
  },
  "actors": [
    { "name": "書かない時の元", "kind": "card", "lane": "l1", "stack": 0, "posX": 140, "posY": 0, "posW": 260, "posH": 56 },
    { "name": "書かない時の先", "kind": "card", "lane": "l1", "stack": 1, "posX": 700, "posY": 180, "posW": 260, "posH": 56 },
    { "name": "右と書いた元", "kind": "card", "lane": "l1", "stack": 2, "posX": 140, "posY": 360, "posW": 260, "posH": 56 },
    { "name": "右と書いた先", "kind": "card", "lane": "l1", "stack": 3, "posX": 700, "posY": 540, "posW": 260, "posH": 56 }
  ],
  "flow": [
    { "from": "書かない時の元", "to": "書かない時の先", "label": "縦の辺で結ぶ", "tone": "info", "style": "dashed" },
    { "from": "右と書いた元", "to": "右と書いた先", "label": "右の辺から", "tone": "accent", "style": "solid", "side": "right" }
  ],
  "animation": [
    {
      "step": "右の辺から出す",
      "duration": 1.8,
      "focus": [
        "書かない時の元",
        "書かない時の先",
        "右と書いた元",
        "右と書いた先",
        "書かない時の元 -> 書かない時の先",
        "右と書いた元 -> 右と書いた先"
      ],
      "body": "上の組は辺を書かないので縦の辺で結ぶ。 下の組は右の辺から出て、行き先には左の辺から入る"
    }
  ]
}`;

export const pattern__edgeSide__右 = textDslToDiagram(sourceYaml__pattern__edgeSide__右);

export const sourceYaml__pattern__edgeSide__下 = `title: "矢印を下の辺から出す"
type: flow

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 560, width: 280 }

actors:
  - 書かない時の元: { kind: card, lane: l1, stack: 0 }
  - 書かない時の先: { kind: card, lane: l2, stack: 1 }
  - 下と書いた元: { kind: card, lane: l1, stack: 2 }
  - 下と書いた先: { kind: card, lane: l2, stack: 3 }

flow:
  - 書かない時の元 -> 書かない時の先: "横の辺で結ぶ" (info, dashed)
  - 下と書いた元 -> 下と書いた先: "下の辺から" (accent, solid) { side: bottom }

animation:
  - step: "下の辺から出す" 1.8s
    focus: ["書かない時の元", "書かない時の先", "下と書いた元", "下と書いた先", "書かない時の元 -> 書かない時の先", "下と書いた元 -> 下と書いた先"]
    description: "上の組は辺を書かないので横の辺で結ぶ。 下の組は下の辺から出て、行き先には上の辺から入る"
`;

export const sourceJson__pattern__edgeSide__下 = `{
  "title": "矢印を下の辺から出す",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 280 },
    "l2": { "x": 560, "width": 280 }
  },
  "actors": [
    { "name": "書かない時の元", "kind": "card", "lane": "l1", "stack": 0 },
    { "name": "書かない時の先", "kind": "card", "lane": "l2", "stack": 1 },
    { "name": "下と書いた元", "kind": "card", "lane": "l1", "stack": 2 },
    { "name": "下と書いた先", "kind": "card", "lane": "l2", "stack": 3 }
  ],
  "flow": [
    { "from": "書かない時の元", "to": "書かない時の先", "label": "横の辺で結ぶ", "tone": "info", "style": "dashed" },
    { "from": "下と書いた元", "to": "下と書いた先", "label": "下の辺から", "tone": "accent", "style": "solid", "side": "bottom" }
  ],
  "animation": [
    {
      "step": "下の辺から出す",
      "duration": 1.8,
      "focus": [
        "書かない時の元",
        "書かない時の先",
        "下と書いた元",
        "下と書いた先",
        "書かない時の元 -> 書かない時の先",
        "下と書いた元 -> 下と書いた先"
      ],
      "body": "上の組は辺を書かないので横の辺で結ぶ。 下の組は下の辺から出て、行き先には上の辺から入る"
    }
  ]
}`;

export const pattern__edgeSide__下 = textDslToDiagram(sourceYaml__pattern__edgeSide__下);

export const sourceYaml__pattern__edgeSide__左 = `title: "矢印を左の辺から出す"
type: flow

lanes:
  l1: { x: 0, width: 840 }

actors:
  - 書かない時の元: { kind: card, lane: l1, stack: 0, posX: 700, posY: 0, posW: 260, posH: 56 }
  - 書かない時の先: { kind: card, lane: l1, stack: 1, posX: 140, posY: 180, posW: 260, posH: 56 }
  - 左と書いた元: { kind: card, lane: l1, stack: 2, posX: 700, posY: 360, posW: 260, posH: 56 }
  - 左と書いた先: { kind: card, lane: l1, stack: 3, posX: 140, posY: 540, posW: 260, posH: 56 }

flow:
  - 書かない時の元 -> 書かない時の先: "縦の辺で結ぶ" (info, dashed)
  - 左と書いた元 -> 左と書いた先: "左の辺から" (accent, solid) { side: left }

animation:
  - step: "左の辺から出す" 1.8s
    focus: ["書かない時の元", "書かない時の先", "左と書いた元", "左と書いた先", "書かない時の元 -> 書かない時の先", "左と書いた元 -> 左と書いた先"]
    description: "上の組は辺を書かないので縦の辺で結ぶ。 下の組は左の辺から出て、行き先には右の辺から入る"
`;

export const sourceJson__pattern__edgeSide__左 = `{
  "title": "矢印を左の辺から出す",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 840 }
  },
  "actors": [
    { "name": "書かない時の元", "kind": "card", "lane": "l1", "stack": 0, "posX": 700, "posY": 0, "posW": 260, "posH": 56 },
    { "name": "書かない時の先", "kind": "card", "lane": "l1", "stack": 1, "posX": 140, "posY": 180, "posW": 260, "posH": 56 },
    { "name": "左と書いた元", "kind": "card", "lane": "l1", "stack": 2, "posX": 700, "posY": 360, "posW": 260, "posH": 56 },
    { "name": "左と書いた先", "kind": "card", "lane": "l1", "stack": 3, "posX": 140, "posY": 540, "posW": 260, "posH": 56 }
  ],
  "flow": [
    { "from": "書かない時の元", "to": "書かない時の先", "label": "縦の辺で結ぶ", "tone": "info", "style": "dashed" },
    { "from": "左と書いた元", "to": "左と書いた先", "label": "左の辺から", "tone": "accent", "style": "solid", "side": "left" }
  ],
  "animation": [
    {
      "step": "左の辺から出す",
      "duration": 1.8,
      "focus": [
        "書かない時の元",
        "書かない時の先",
        "左と書いた元",
        "左と書いた先",
        "書かない時の元 -> 書かない時の先",
        "左と書いた元 -> 左と書いた先"
      ],
      "body": "上の組は辺を書かないので縦の辺で結ぶ。 下の組は左の辺から出て、行き先には右の辺から入る"
    }
  ]
}`;

export const pattern__edgeSide__左 = textDslToDiagram(sourceYaml__pattern__edgeSide__左);

// ---- 線の役目 (#2141) ----
//
// 役目 `role: main` を書いた線は、強調した箱の枠と同じ色で引く。 図の中に主となる 1 本道と、そこから
// 分かれる線がある時、どこから読むかを色で決めるための欄。
//
// **書かない形と書いた形で、箱と線と名前を揃える**。 切替で見比べた時に変わるのが線の色だけになり、
// 色が変わった線が役目を書いた線だと読める。
//
// 通り道は横 1 列に置き、分かれる 2 本は縦に下ろす。 分かれる線を右の縦列の上下へ斜めに引くと、
// その縦列で箱の間が 64 と 236 に割れて図の検査の揃えの決まりに触れた (実測)。 線の名前を 2-4 字に
// 抑えるのは、横の間が名前の幅で広がり、一覧の器 (874px) で箱の題が 12px を割るため (実測 = 5-7 字で
// 図の幅 1705)。

export const patternBase__edgeRole = "書かない";

export const sourceYaml__edgeRole = `title: "線の役目を書かない"
type: flow

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 400, width: 280 }
  l3: { x: 800, width: 280 }

actors:
  - ブラウザ: { kind: card, lane: l1, stack: 0 }
  - 注文 API: { kind: card, lane: l2, stack: 0 }
  - 台帳: { kind: card, lane: l3, stack: 0 }
  - 受付の知らせ: { kind: card, lane: l2, stack: 1 }
  - 台帳の写し: { kind: card, lane: l3, stack: 1 }

flow:
  - ブラウザ -> 注文 API: "送る" (accent, solid)
  - 注文 API -> 台帳: "書く" (accent, solid)
  - 注文 API -> 受付の知らせ: "知らせる" (accent, solid)
  - 台帳 -> 台帳の写し: "写す" (accent, solid)

animation:
  - step: "どの線も同じ色で引く" 1.8s
    focus: ["ブラウザ", "注文 API", "台帳", "受付の知らせ", "台帳の写し", "ブラウザ -> 注文 API", "注文 API -> 台帳", "注文 API -> 受付の知らせ", "台帳 -> 台帳の写し"]
    description: "役目を書かないと 4 本とも同じ色になる。 ブラウザから台帳に書くまでの通り道と、知らせや写しへ分かれる線を色で見分けられない"
`;

export const sourceJson__edgeRole = `{
  "title": "線の役目を書かない",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 280 },
    "l2": { "x": 400, "width": 280 },
    "l3": { "x": 800, "width": 280 }
  },
  "actors": [
    { "name": "ブラウザ", "kind": "card", "lane": "l1", "stack": 0 },
    { "name": "注文 API", "kind": "card", "lane": "l2", "stack": 0 },
    { "name": "台帳", "kind": "card", "lane": "l3", "stack": 0 },
    { "name": "受付の知らせ", "kind": "card", "lane": "l2", "stack": 1 },
    { "name": "台帳の写し", "kind": "card", "lane": "l3", "stack": 1 }
  ],
  "flow": [
    { "from": "ブラウザ", "to": "注文 API", "label": "送る", "tone": "accent", "style": "solid" },
    { "from": "注文 API", "to": "台帳", "label": "書く", "tone": "accent", "style": "solid" },
    { "from": "注文 API", "to": "受付の知らせ", "label": "知らせる", "tone": "accent", "style": "solid" },
    { "from": "台帳", "to": "台帳の写し", "label": "写す", "tone": "accent", "style": "solid" }
  ],
  "animation": [
    {
      "step": "どの線も同じ色で引く",
      "duration": 1.8,
      "focus": [
        "ブラウザ",
        "注文 API",
        "台帳",
        "受付の知らせ",
        "台帳の写し",
        "ブラウザ -> 注文 API",
        "注文 API -> 台帳",
        "注文 API -> 受付の知らせ",
        "台帳 -> 台帳の写し"
      ],
      "body": "役目を書かないと 4 本とも同じ色になる。 ブラウザから台帳に書くまでの通り道と、知らせや写しへ分かれる線を色で見分けられない"
    }
  ]
}`;

export const edgeRole = textDslToDiagram(sourceYaml__edgeRole);

export const sourceYaml__pattern__edgeRole__main = `title: "通り道の線に役目を書く"
type: flow

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 400, width: 280 }
  l3: { x: 800, width: 280 }

actors:
  - ブラウザ: { kind: card, lane: l1, stack: 0 }
  - 注文 API: { kind: card, lane: l2, stack: 0 }
  - 台帳: { kind: card, lane: l3, stack: 0 }
  - 受付の知らせ: { kind: card, lane: l2, stack: 1 }
  - 台帳の写し: { kind: card, lane: l3, stack: 1 }

flow:
  - ブラウザ -> 注文 API: "送る" (accent, solid) { role: main }
  - 注文 API -> 台帳: "書く" (accent, solid) { role: main }
  - 注文 API -> 受付の知らせ: "知らせる" (accent, solid)
  - 台帳 -> 台帳の写し: "写す" (accent, solid)

animation:
  - step: "通り道だけを強調の色で引く" 1.8s
    focus: ["ブラウザ", "注文 API", "台帳", "受付の知らせ", "台帳の写し", "ブラウザ -> 注文 API", "注文 API -> 台帳", "注文 API -> 受付の知らせ", "台帳 -> 台帳の写し"]
    description: "ブラウザから台帳に書くまでの 2 本に role: main を書くと、その 2 本を強調した箱の枠と同じ色で引く。 知らせと写しへ分かれる 2 本は役目を書かないので、色味の色のまま"
`;

export const sourceJson__pattern__edgeRole__main = `{
  "title": "通り道の線に役目を書く",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 280 },
    "l2": { "x": 400, "width": 280 },
    "l3": { "x": 800, "width": 280 }
  },
  "actors": [
    { "name": "ブラウザ", "kind": "card", "lane": "l1", "stack": 0 },
    { "name": "注文 API", "kind": "card", "lane": "l2", "stack": 0 },
    { "name": "台帳", "kind": "card", "lane": "l3", "stack": 0 },
    { "name": "受付の知らせ", "kind": "card", "lane": "l2", "stack": 1 },
    { "name": "台帳の写し", "kind": "card", "lane": "l3", "stack": 1 }
  ],
  "flow": [
    { "from": "ブラウザ", "to": "注文 API", "label": "送る", "tone": "accent", "style": "solid", "role": "main" },
    { "from": "注文 API", "to": "台帳", "label": "書く", "tone": "accent", "style": "solid", "role": "main" },
    { "from": "注文 API", "to": "受付の知らせ", "label": "知らせる", "tone": "accent", "style": "solid" },
    { "from": "台帳", "to": "台帳の写し", "label": "写す", "tone": "accent", "style": "solid" }
  ],
  "animation": [
    {
      "step": "通り道だけを強調の色で引く",
      "duration": 1.8,
      "focus": [
        "ブラウザ",
        "注文 API",
        "台帳",
        "受付の知らせ",
        "台帳の写し",
        "ブラウザ -> 注文 API",
        "注文 API -> 台帳",
        "注文 API -> 受付の知らせ",
        "台帳 -> 台帳の写し"
      ],
      "body": "ブラウザから台帳に書くまでの 2 本に role: main を書くと、その 2 本を強調した箱の枠と同じ色で引く。 知らせと写しへ分かれる 2 本は役目を書かないので、色味の色のまま"
    }
  ]
}`;

export const pattern__edgeRole__main = textDslToDiagram(sourceYaml__pattern__edgeRole__main);

// ---- 矢印の飾り ----
//
// 矢印には色味 (`情報`) と線の種類 (`dashed`) と根元に添える字 (`tailSub`) を書ける。 色味と
// 線の種類は説明文の後ろに続けて書き、根元の字だけ中括弧に入れる。
//
// **縦列を書いた形と書かない形を並べる**。 フローは動き / 向き / 縦列のどれも書かないと、箱を
// 鎖のように 1 本につなぐ別の組み立てへ回る。 かつてその経路は矢印に説明文しか渡しておらず、
// 3 つとも黙って消えていた (#2394)。 書き手には経路の違いが見えないので、同じ飾りを書いた
// 2 枚を切替で見比べられる形にする。
//
// 箱と飾りは 2 枚で揃える = 切替で変わるのが並び方だけになり、飾りがどちらでも同じに出ることが読める。
// **箱は 2 つに絞る** = 鎖の形は箱を縦に積むので、3 つ置くと一覧の台で 954px になり
// 1 画面に収まらない (`packages/dragon/test/inline-stage-height.test.ts` の 900px の線)。

export const patternBase__edgeDeco = "縦列を書く";

export const sourceYaml__edgeDeco = `title: "縦列を書いて矢印を飾る"
type: flow

lanes:
  l1: { x: 0, width: 260 }
  l2: { x: 460, width: 260 }

actors:
  - 受付: { kind: card, lane: l1, stack: 0 }
  - 台帳: { kind: card, lane: l2, stack: 0 }

flow:
  - 受付 -> 台帳: "書く" 情報 dashed { tailSub: "1", sub: "1..*" }
`;

export const sourceJson__edgeDeco = `{
  "title": "縦列を書いて矢印を飾る",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 260 },
    "l2": { "x": 460, "width": 260 }
  },
  "actors": [
    { "name": "受付", "kind": "card", "lane": "l1", "stack": 0 },
    { "name": "台帳", "kind": "card", "lane": "l2", "stack": 0 }
  ],
  "flow": [
    {
      "from": "受付",
      "to": "台帳",
      "label": "書く",
      "sub": "1..*",
      "tone": "info",
      "style": "dashed",
      "tailSub": "1"
    }
  ]
}`;

export const edgeDeco = textDslToDiagram(sourceYaml__edgeDeco);

export const sourceYaml__pattern__edgeDeco__縦列を書かない = `title: "縦列を書かずに矢印を飾る"
type: flow

actors:
  - 受付: card
  - 台帳: card

flow:
  - 受付 -> 台帳: "書く" 情報 dashed { tailSub: "1", sub: "1..*" }
`;

export const sourceJson__pattern__edgeDeco__縦列を書かない = `{
  "title": "縦列を書かずに矢印を飾る",
  "type": "flow",
  "actors": [
    { "name": "受付", "kind": "card" },
    { "name": "台帳", "kind": "card" }
  ],
  "flow": [
    {
      "from": "受付",
      "to": "台帳",
      "label": "書く",
      "sub": "1..*",
      "tone": "info",
      "style": "dashed",
      "tailSub": "1"
    }
  ]
}`;

export const pattern__edgeDeco__縦列を書かない = textDslToDiagram(
  sourceYaml__pattern__edgeDeco__縦列を書かない,
);

// ---- 形の満ちる向き ----
//
// 四角の形 (`dyn-rect`) は、値に合わせて中を塗る向きを 4 つ取る。 同じ値 (6 割) で 4 つを並べ、塗りが
// 寄る向きだけが違うことを見せる。 **値は動かさない** = スタイルの分類は見た目の違いを見せる見本で、
// 値を動かすと向きより満ちていく動きに目が行く (`packages/dragon/test/catalog-motion-coverage.test.ts`)。
//
// **形を 1 つずつ見出し付きのレーンに入れる**。 `dyn-rect` は値の字 (`60 / 100`) しか描かず、箱の名前も
// 副題も出ないので、4 つ並べるとどれがどの向きか画面から読めない。 レーンの見出しに向きの名前と
// 書く値を出す。 レーンは記法で縦に積めないので横 1 列に並べ、形を小さくして図を縮めずに出す
// (縮めると値の字 `60 / 100` が読めなくなる)。

export const sourceYaml__shapeOrient = `title: "形の満ちる向き 4 種"
type: flow

lanes:
  o-up: { label: "上へ満ちる (up)", x: 0, width: 200 }
  o-down: { label: "下へ満ちる (down)", x: 260, width: 200 }
  o-left: { label: "左へ満ちる (left)", x: 520, width: 200 }
  o-right: { label: "右へ満ちる (right)", x: 780, width: 200 }

states:
  level: 60

actors:
  - 上へ満ちる: { kind: dyn-rect, lane: o-up, stack: 0, posW: 180, posH: 110, shape: { kind: rect, source: "{level}", fillMax: 100, orient: up, fill: "#22c55e", radius: 6 } }
  - 下へ満ちる: { kind: dyn-rect, lane: o-down, stack: 0, posW: 180, posH: 110, shape: { kind: rect, source: "{level}", fillMax: 100, orient: down, fill: "#22c55e", radius: 6 } }
  - 左へ満ちる: { kind: dyn-rect, lane: o-left, stack: 0, posW: 180, posH: 110, shape: { kind: rect, source: "{level}", fillMax: 100, orient: left, fill: "#22c55e", radius: 6 } }
  - 右へ満ちる: { kind: dyn-rect, lane: o-right, stack: 0, posW: 180, posH: 110, shape: { kind: rect, source: "{level}", fillMax: 100, orient: right, fill: "#22c55e", radius: 6 } }

animation:
  - step: "同じ値で 4 つの向き" 1.8s
    focus: ["上へ満ちる", "下へ満ちる", "左へ満ちる", "右へ満ちる"]
    description: "どれも 6 割を塗る。 上へは下から、下へは上から、左へは右から、右へは左から塗りが寄る"
`;

export const sourceJson__shapeOrient = `{
  "title": "形の満ちる向き 4 種",
  "type": "flow",
  "lanes": {
    "o-up": { "label": "上へ満ちる (up)", "x": 0, "width": 200 },
    "o-down": { "label": "下へ満ちる (down)", "x": 260, "width": 200 },
    "o-left": { "label": "左へ満ちる (left)", "x": 520, "width": 200 },
    "o-right": { "label": "右へ満ちる (right)", "x": 780, "width": 200 }
  },
  "actors": [
    {
      "name": "上へ満ちる",
      "kind": "dyn-rect",
      "lane": "o-up",
      "stack": 0,
      "posW": 180,
      "posH": 110,
      "shape": { "kind": "rect", "source": "{level}", "fillMax": 100, "orient": "up", "fill": "#22c55e", "radius": 6 }
    },
    {
      "name": "下へ満ちる",
      "kind": "dyn-rect",
      "lane": "o-down",
      "stack": 0,
      "posW": 180,
      "posH": 110,
      "shape": { "kind": "rect", "source": "{level}", "fillMax": 100, "orient": "down", "fill": "#22c55e", "radius": 6 }
    },
    {
      "name": "左へ満ちる",
      "kind": "dyn-rect",
      "lane": "o-left",
      "stack": 0,
      "posW": 180,
      "posH": 110,
      "shape": { "kind": "rect", "source": "{level}", "fillMax": 100, "orient": "left", "fill": "#22c55e", "radius": 6 }
    },
    {
      "name": "右へ満ちる",
      "kind": "dyn-rect",
      "lane": "o-right",
      "stack": 0,
      "posW": 180,
      "posH": 110,
      "shape": { "kind": "rect", "source": "{level}", "fillMax": 100, "orient": "right", "fill": "#22c55e", "radius": 6 }
    }
  ],
  "flow": [],
  "states": { "level": 60 },
  "animation": [
    {
      "step": "同じ値で 4 つの向き",
      "duration": 1.8,
      "focus": ["上へ満ちる", "下へ満ちる", "左へ満ちる", "右へ満ちる"],
      "body": "どれも 6 割を塗る。 上へは下から、下へは上から、左へは右から、右へは左から塗りが寄る"
    }
  ]
}`;

export const shapeOrient = textDslToDiagram(sourceYaml__shapeOrient);

// ==== #1969 スタイルの欄の見本 ここから ====
// ---- 節の色を `color` の欄で書く (#1969) ----
//
// `color` は `tone` と同じ色の名前を受ける欄。 JSON の型定義にあるのに、カタログのどの見本も書いていなかった。

export const patternBase__nodeTone = "色調の欄で書く";

export const sourceYaml__pattern__nodeTone__色の欄で書く = `title: "節の色 6 種を色の欄で書く"
type: flow

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 400, width: 280 }

actors:
  - 主張: { kind: card, lane: l1, stack: 0, color: accent, subtitle: "accent" }
  - 青緑: { kind: card, lane: l1, stack: 1, color: teal, subtitle: "teal" }
  - 成功: { kind: card, lane: l1, stack: 2, color: success, subtitle: "success" }
  - 失敗: { kind: card, lane: l2, stack: 0, color: error, subtitle: "error" }
  - 注意: { kind: card, lane: l2, stack: 1, color: warning, subtitle: "warning" }
  - 案内: { kind: card, lane: l2, stack: 2, color: info, subtitle: "info" }

animation:
  - step: "6 色を並べる" 1.8s
    focus: ["主張", "青緑", "成功", "失敗", "注意", "案内"]
    description: "tone の代わりに color と書いても、同じ 6 色で描かれる。 color は部品の色番号 (# で始まる値) も受ける"
`;

export const sourceJson__pattern__nodeTone__色の欄で書く = `{
  "title": "節の色 6 種を色の欄で書く",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 280 },
    "l2": { "x": 400, "width": 280 }
  },
  "actors": [
    { "name": "主張", "kind": "card", "lane": "l1", "stack": 0, "color": "accent", "subtitle": "accent" },
    { "name": "青緑", "kind": "card", "lane": "l1", "stack": 1, "color": "teal", "subtitle": "teal" },
    { "name": "成功", "kind": "card", "lane": "l1", "stack": 2, "color": "success", "subtitle": "success" },
    { "name": "失敗", "kind": "card", "lane": "l2", "stack": 0, "color": "error", "subtitle": "error" },
    { "name": "注意", "kind": "card", "lane": "l2", "stack": 1, "color": "warning", "subtitle": "warning" },
    { "name": "案内", "kind": "card", "lane": "l2", "stack": 2, "color": "info", "subtitle": "info" }
  ],
  "flow": [],
  "animation": [
    {
      "step": "6 色を並べる",
      "duration": 1.8,
      "focus": ["主張", "青緑", "成功", "失敗", "注意", "案内"],
      "body": "tone の代わりに color と書いても、同じ 6 色で描かれる。 color は部品の色番号 (# で始まる値) も受ける"
    }
  ]
}`;

export const pattern__nodeTone__色の欄で書く = textDslToDiagram(sourceYaml__pattern__nodeTone__色の欄で書く);

// ---- 矢印の端の塗り (#1969) ----
//
// 塗り (`headFill` / `tailHeadFill`) はクラス図と ER 図の組み立てが関係の種類から書いており、記法で直接書いた
// 見本が無かった。 塗りが見分けられる三角と菱形だけを、塗った形と中を抜いた形で並べる。

export const sourceYaml__pattern__edgeHead__先端の塗り = `title: "矢印の先端の塗り 2 種"
type: flow

lanes:
  元: { x: 0, width: 240 }
  先: { x: 600, width: 240 }

actors:
  - 三角を塗る: { kind: actor, lane: 元, stack: 0 }
  - 三角を中空にする: { kind: actor, lane: 元, stack: 1 }
  - 菱形を塗る: { kind: actor, lane: 元, stack: 2 }
  - 菱形を中空にする: { kind: actor, lane: 元, stack: 3 }
  - 三角を塗るの行き先: { kind: actor, lane: 先, stack: 0 }
  - 三角を中空にするの行き先: { kind: actor, lane: 先, stack: 1 }
  - 菱形を塗るの行き先: { kind: actor, lane: 先, stack: 2 }
  - 菱形を中空にするの行き先: { kind: actor, lane: 先, stack: 3 }

flow:
  - 三角を塗る -> 三角を塗るの行き先: "solid" (accent, solid) { head: triangle, headFill: solid }
  - 三角を中空にする -> 三角を中空にするの行き先: "hollow" (accent, solid) { head: triangle, headFill: hollow }
  - 菱形を塗る -> 菱形を塗るの行き先: "solid" (accent, solid) { head: diamond, headFill: solid }
  - 菱形を中空にする -> 菱形を中空にするの行き先: "hollow" (accent, solid) { head: diamond, headFill: hollow }

animation:
  - step: "先端を塗る形と中空の形" 1.8s
    focus: ["三角を塗る -> 三角を塗るの行き先", "三角を中空にする -> 三角を中空にするの行き先", "菱形を塗る -> 菱形を塗るの行き先", "菱形を中空にする -> 菱形を中空にするの行き先"]
    description: "線の行き先の三角と菱形を、塗った形 (solid) と中を抜いた形 (hollow) で並べる。 書かない矢印は塗った形で描かれる"
`;

export const sourceJson__pattern__edgeHead__先端の塗り = `{
  "title": "矢印の先端の塗り 2 種",
  "type": "flow",
  "lanes": {
    "元": { "x": 0, "width": 240 },
    "先": { "x": 600, "width": 240 }
  },
  "actors": [
    { "name": "三角を塗る", "kind": "actor", "lane": "元", "stack": 0 },
    { "name": "三角を中空にする", "kind": "actor", "lane": "元", "stack": 1 },
    { "name": "菱形を塗る", "kind": "actor", "lane": "元", "stack": 2 },
    { "name": "菱形を中空にする", "kind": "actor", "lane": "元", "stack": 3 },
    { "name": "三角を塗るの行き先", "kind": "actor", "lane": "先", "stack": 0 },
    { "name": "三角を中空にするの行き先", "kind": "actor", "lane": "先", "stack": 1 },
    { "name": "菱形を塗るの行き先", "kind": "actor", "lane": "先", "stack": 2 },
    { "name": "菱形を中空にするの行き先", "kind": "actor", "lane": "先", "stack": 3 }
  ],
  "flow": [
    { "from": "三角を塗る", "to": "三角を塗るの行き先", "label": "solid", "tone": "accent", "style": "solid", "head": "triangle", "headFill": "solid" },
    { "from": "三角を中空にする", "to": "三角を中空にするの行き先", "label": "hollow", "tone": "accent", "style": "solid", "head": "triangle", "headFill": "hollow" },
    { "from": "菱形を塗る", "to": "菱形を塗るの行き先", "label": "solid", "tone": "accent", "style": "solid", "head": "diamond", "headFill": "solid" },
    { "from": "菱形を中空にする", "to": "菱形を中空にするの行き先", "label": "hollow", "tone": "accent", "style": "solid", "head": "diamond", "headFill": "hollow" }
  ],
  "animation": [
    {
      "step": "先端を塗る形と中空の形",
      "duration": 1.8,
      "focus": ["三角を塗る -> 三角を塗るの行き先", "三角を中空にする -> 三角を中空にするの行き先", "菱形を塗る -> 菱形を塗るの行き先", "菱形を中空にする -> 菱形を中空にするの行き先"],
      "body": "線の行き先の三角と菱形を、塗った形 (solid) と中を抜いた形 (hollow) で並べる。 書かない矢印は塗った形で描かれる"
    }
  ]
}`;

export const pattern__edgeHead__先端の塗り = textDslToDiagram(sourceYaml__pattern__edgeHead__先端の塗り);

export const sourceYaml__pattern__edgeHead__根元の塗り = `title: "矢印の根元の塗り 2 種"
type: flow

lanes:
  元: { x: 0, width: 240 }
  先: { x: 600, width: 240 }

actors:
  - 三角を塗る: { kind: actor, lane: 元, stack: 0 }
  - 三角を中空にする: { kind: actor, lane: 元, stack: 1 }
  - 菱形を塗る: { kind: actor, lane: 元, stack: 2 }
  - 菱形を中空にする: { kind: actor, lane: 元, stack: 3 }
  - 三角を塗るの行き先: { kind: actor, lane: 先, stack: 0 }
  - 三角を中空にするの行き先: { kind: actor, lane: 先, stack: 1 }
  - 菱形を塗るの行き先: { kind: actor, lane: 先, stack: 2 }
  - 菱形を中空にするの行き先: { kind: actor, lane: 先, stack: 3 }

flow:
  - 三角を塗る -> 三角を塗るの行き先: "solid" (accent, solid) { head: none, tailHead: triangle, tailHeadFill: solid }
  - 三角を中空にする -> 三角を中空にするの行き先: "hollow" (accent, solid) { head: none, tailHead: triangle, tailHeadFill: hollow }
  - 菱形を塗る -> 菱形を塗るの行き先: "solid" (accent, solid) { head: none, tailHead: diamond, tailHeadFill: solid }
  - 菱形を中空にする -> 菱形を中空にするの行き先: "hollow" (accent, solid) { head: none, tailHead: diamond, tailHeadFill: hollow }

animation:
  - step: "根元を塗る形と中空の形" 1.8s
    focus: ["三角を塗る -> 三角を塗るの行き先", "三角を中空にする -> 三角を中空にするの行き先", "菱形を塗る -> 菱形を塗るの行き先", "菱形を中空にする -> 菱形を中空にするの行き先"]
    description: "線の出どころの三角と菱形を、塗った形 (solid) と中を抜いた形 (hollow) で並べる。 先端は無しにして根元だけを見せる"
`;

export const sourceJson__pattern__edgeHead__根元の塗り = `{
  "title": "矢印の根元の塗り 2 種",
  "type": "flow",
  "lanes": {
    "元": { "x": 0, "width": 240 },
    "先": { "x": 600, "width": 240 }
  },
  "actors": [
    { "name": "三角を塗る", "kind": "actor", "lane": "元", "stack": 0 },
    { "name": "三角を中空にする", "kind": "actor", "lane": "元", "stack": 1 },
    { "name": "菱形を塗る", "kind": "actor", "lane": "元", "stack": 2 },
    { "name": "菱形を中空にする", "kind": "actor", "lane": "元", "stack": 3 },
    { "name": "三角を塗るの行き先", "kind": "actor", "lane": "先", "stack": 0 },
    { "name": "三角を中空にするの行き先", "kind": "actor", "lane": "先", "stack": 1 },
    { "name": "菱形を塗るの行き先", "kind": "actor", "lane": "先", "stack": 2 },
    { "name": "菱形を中空にするの行き先", "kind": "actor", "lane": "先", "stack": 3 }
  ],
  "flow": [
    { "from": "三角を塗る", "to": "三角を塗るの行き先", "label": "solid", "tone": "accent", "style": "solid", "head": "none", "tailHead": "triangle", "tailHeadFill": "solid" },
    { "from": "三角を中空にする", "to": "三角を中空にするの行き先", "label": "hollow", "tone": "accent", "style": "solid", "head": "none", "tailHead": "triangle", "tailHeadFill": "hollow" },
    { "from": "菱形を塗る", "to": "菱形を塗るの行き先", "label": "solid", "tone": "accent", "style": "solid", "head": "none", "tailHead": "diamond", "tailHeadFill": "solid" },
    { "from": "菱形を中空にする", "to": "菱形を中空にするの行き先", "label": "hollow", "tone": "accent", "style": "solid", "head": "none", "tailHead": "diamond", "tailHeadFill": "hollow" }
  ],
  "animation": [
    {
      "step": "根元を塗る形と中空の形",
      "duration": 1.8,
      "focus": ["三角を塗る -> 三角を塗るの行き先", "三角を中空にする -> 三角を中空にするの行き先", "菱形を塗る -> 菱形を塗るの行き先", "菱形を中空にする -> 菱形を中空にするの行き先"],
      "body": "線の出どころの三角と菱形を、塗った形 (solid) と中を抜いた形 (hollow) で並べる。 先端は無しにして根元だけを見せる"
    }
  ]
}`;

export const pattern__edgeHead__根元の塗り = textDslToDiagram(sourceYaml__pattern__edgeHead__根元の塗り);

// ---- 形の線の色 (#1969) ----
//
// 形 (`shape`) は塗り (`fill`) と別に外枠の色 (`stroke`) を受ける。 見本は塗りしか書いていなかった。

export const patternBase__shapeOrient = "線の色を書かない";

export const sourceYaml__pattern__shapeOrient__線の色を付ける = `title: "形の満ちる向き 4 種に線の色を付ける"
type: flow

lanes:
  o-up: { label: "上へ満ちる (up)", x: 0, width: 200 }
  o-down: { label: "下へ満ちる (down)", x: 260, width: 200 }
  o-left: { label: "左へ満ちる (left)", x: 520, width: 200 }
  o-right: { label: "右へ満ちる (right)", x: 780, width: 200 }

states:
  level: 60

actors:
  - 上へ満ちる: { kind: dyn-rect, lane: o-up, stack: 0, posW: 180, posH: 110, shape: { kind: rect, source: "{level}", fillMax: 100, orient: up, fill: "#22c55e", radius: 6, stroke: "#15803d" } }
  - 下へ満ちる: { kind: dyn-rect, lane: o-down, stack: 0, posW: 180, posH: 110, shape: { kind: rect, source: "{level}", fillMax: 100, orient: down, fill: "#22c55e", radius: 6, stroke: "#15803d" } }
  - 左へ満ちる: { kind: dyn-rect, lane: o-left, stack: 0, posW: 180, posH: 110, shape: { kind: rect, source: "{level}", fillMax: 100, orient: left, fill: "#22c55e", radius: 6, stroke: "#15803d" } }
  - 右へ満ちる: { kind: dyn-rect, lane: o-right, stack: 0, posW: 180, posH: 110, shape: { kind: rect, source: "{level}", fillMax: 100, orient: right, fill: "#22c55e", radius: 6, stroke: "#15803d" } }

animation:
  - step: "同じ値で 4 つの向き" 1.8s
    focus: ["上へ満ちる", "下へ満ちる", "左へ満ちる", "右へ満ちる"]
    description: "形の外枠を、書いた線の色 (#15803d) で描く。 書かない形は線の既定の色で描かれる"
`;

export const sourceJson__pattern__shapeOrient__線の色を付ける = `{
  "title": "形の満ちる向き 4 種に線の色を付ける",
  "type": "flow",
  "lanes": {
    "o-up": { "label": "上へ満ちる (up)", "x": 0, "width": 200 },
    "o-down": { "label": "下へ満ちる (down)", "x": 260, "width": 200 },
    "o-left": { "label": "左へ満ちる (left)", "x": 520, "width": 200 },
    "o-right": { "label": "右へ満ちる (right)", "x": 780, "width": 200 }
  },
  "actors": [
    {
      "name": "上へ満ちる",
      "kind": "dyn-rect",
      "lane": "o-up",
      "stack": 0,
      "posW": 180,
      "posH": 110,
      "shape": { "kind": "rect", "source": "{level}", "fillMax": 100, "orient": "up", "fill": "#22c55e", "radius": 6, "stroke": "#15803d" }
    },
    {
      "name": "下へ満ちる",
      "kind": "dyn-rect",
      "lane": "o-down",
      "stack": 0,
      "posW": 180,
      "posH": 110,
      "shape": { "kind": "rect", "source": "{level}", "fillMax": 100, "orient": "down", "fill": "#22c55e", "radius": 6, "stroke": "#15803d" }
    },
    {
      "name": "左へ満ちる",
      "kind": "dyn-rect",
      "lane": "o-left",
      "stack": 0,
      "posW": 180,
      "posH": 110,
      "shape": { "kind": "rect", "source": "{level}", "fillMax": 100, "orient": "left", "fill": "#22c55e", "radius": 6, "stroke": "#15803d" }
    },
    {
      "name": "右へ満ちる",
      "kind": "dyn-rect",
      "lane": "o-right",
      "stack": 0,
      "posW": 180,
      "posH": 110,
      "shape": { "kind": "rect", "source": "{level}", "fillMax": 100, "orient": "right", "fill": "#22c55e", "radius": 6, "stroke": "#15803d" }
    }
  ],
  "flow": [],
  "states": { "level": 60 },
  "animation": [
    {
      "step": "同じ値で 4 つの向き",
      "duration": 1.8,
      "focus": ["上へ満ちる", "下へ満ちる", "左へ満ちる", "右へ満ちる"],
      "body": "形の外枠を、書いた線の色 (#15803d) で描く。 書かない形は線の既定の色で描かれる"
    }
  ]
}`;

export const pattern__shapeOrient__線の色を付ける = textDslToDiagram(sourceYaml__pattern__shapeOrient__線の色を付ける);
// ==== #1969 スタイルの欄の見本 ここまで ====

// ==== #2039 位置を他の要素からの相対で書く見本 ここから ====
//
// 座標の代わりに「誰の」「どちら側に」「どれだけ離して」 を書く。 書く人も LLM も座標を知らないので、
// 数値を当てさせずに並びを決められる。
//
// **向きを 4 つとも見せる**。 1 つだけ載せると、記法が受ける残り 3 つが画面のどこにも出ない。
// 記法の欄と値がカタログに出ていることは `catalog-value-coverage.test.ts` が見る。
//
// 箱は普通の箱 (`card`) にする。 部品を使うと図が縦に伸び (部品は高さ 380-400、普通の箱は 68)、
// 一覧の台に描ける高さ (900) を超える。 部品を基準にする形は「部品を箱に使う」 の頁が見せる。
//
// **図の種類は `topology` で、縦列の囲みを外す**。 `flow` は登場人物を書いた順に矢印で繋ぐので、
// 位置だけを見せたい図に矢印が出て、その根元の長さが下限 (40) を割る (実測 = 絵の検査に 4 件出た)。
// `topology` は矢印を作らないが、既定で縦列に破線の囲みを引き、相対で置いた箱だけが囲みの外に出る
// (実測 = 右に置いた図は囲みの中が 1 箱、外が 1 箱に割れ、上に置いた図は 2 箱とも中に入った)。
// `contain: false` を書くと囲みが消え、置いた位置だけが見える。
//
// **上に置いた図だけ、題が 2 つの箱の間に出る** (実測)。 題は図の原点の上に描かれるが、上に置いた
// 箱は原点より上へ出るため、題を越えて更に上に来る。 描いているのは cdl の側で、この repo からは
// 動かせない。 4 つとも同じ書き方に揃える方を採り、基準の箱へ座標を足して図ごと下げることはしない
// (座標を書くと「座標を知らなくても並べられる」 という見本の主旨が濁る)。

export const patternBase__relativePos = "右に置く";

export const subtitle__relativePos =
  "位置を座標ではなく、他の箱からの向きと間隔で書く。 右 / 左 / 上 / 下 の 4 つを書ける";

export const sourceYaml__relativePos = `title: "受付の右に確認を置く"
type: topology

lanes:
  main: { contain: false }

actors:
  - 受付: { kind: card }
  - 確認する:
      kind: card
      位置: 受付 の右 200
`;

export const sourceJson__relativePos = `{
  "title": "受付の右に確認を置く",
  "type": "topology",
  "lanes": { "main": { "contain": false } },
  "actors": [
    { "name": "受付", "kind": "card" },
    {
      "name": "確認する",
      "kind": "card",
      "posRel": { "anchor": "受付", "dir": "right", "gap": 200 }
    }
  ],
  "flow": []
}`;

export const relativePos = textDslToDiagram(sourceYaml__relativePos);

export const sourceYaml__pattern__relativePos__左に置く = `title: "受付の左に確認を置く"
type: topology

lanes:
  main: { contain: false }

actors:
  - 受付: { kind: card }
  - 確認する:
      kind: card
      位置: 受付 の左 200
`;

export const sourceJson__pattern__relativePos__左に置く = `{
  "title": "受付の左に確認を置く",
  "type": "topology",
  "lanes": { "main": { "contain": false } },
  "actors": [
    { "name": "受付", "kind": "card" },
    {
      "name": "確認する",
      "kind": "card",
      "posRel": { "anchor": "受付", "dir": "left", "gap": 200 }
    }
  ],
  "flow": []
}`;

export const pattern__relativePos__左に置く = textDslToDiagram(
  sourceYaml__pattern__relativePos__左に置く,
);

export const sourceYaml__pattern__relativePos__上に置く = `title: "受付の上に確認を置く"
type: topology

lanes:
  main: { contain: false }

actors:
  - 受付: { kind: card }
  - 確認する:
      kind: card
      位置: 受付 の上 120
`;

export const sourceJson__pattern__relativePos__上に置く = `{
  "title": "受付の上に確認を置く",
  "type": "topology",
  "lanes": { "main": { "contain": false } },
  "actors": [
    { "name": "受付", "kind": "card" },
    {
      "name": "確認する",
      "kind": "card",
      "posRel": { "anchor": "受付", "dir": "above", "gap": 120 }
    }
  ],
  "flow": []
}`;

export const pattern__relativePos__上に置く = textDslToDiagram(
  sourceYaml__pattern__relativePos__上に置く,
);

export const sourceYaml__pattern__relativePos__下に置く = `title: "受付の下に確認を置く"
type: topology

lanes:
  main: { contain: false }

actors:
  - 受付: { kind: card }
  - 確認する:
      kind: card
      位置: 受付 の下 120
`;

export const sourceJson__pattern__relativePos__下に置く = `{
  "title": "受付の下に確認を置く",
  "type": "topology",
  "lanes": { "main": { "contain": false } },
  "actors": [
    { "name": "受付", "kind": "card" },
    {
      "name": "確認する",
      "kind": "card",
      "posRel": { "anchor": "受付", "dir": "below", "gap": 120 }
    }
  ],
  "flow": []
}`;

export const pattern__relativePos__下に置く = textDslToDiagram(
  sourceYaml__pattern__relativePos__下に置く,
);

export const sourceYaml__pattern__relativePos__間隔を書かない = `title: "間隔を書かずに受付の右へ置く"
type: topology

lanes:
  main: { contain: false }

actors:
  - 受付: { kind: card }
  - 確認する:
      kind: card
      位置: 受付 の右
`;

export const sourceJson__pattern__relativePos__間隔を書かない = `{
  "title": "間隔を書かずに受付の右へ置く",
  "type": "topology",
  "lanes": { "main": { "contain": false } },
  "actors": [
    { "name": "受付", "kind": "card" },
    {
      "name": "確認する",
      "kind": "card",
      "posRel": { "anchor": "受付", "dir": "right" }
    }
  ],
  "flow": []
}`;

export const pattern__relativePos__間隔を書かない = textDslToDiagram(
  sourceYaml__pattern__relativePos__間隔を書かない,
);
// ==== #2039 位置を他の要素からの相対で書く見本 ここまで ====
